import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { giveDiscordRole } from '@/lib/discord-role';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  email?: string;
  avatar?: string;
  global_name?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  console.log('[Discord OAuth] Received callback:', { code: !!code, state, error });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://77.91.100.68:3000';

  if (error) {
    console.error('[Discord OAuth] Authorization denied by user');
    return NextResponse.redirect(
      new URL(`/?error=discord_auth_denied`, baseUrl)
    );
  }

  if (!code) {
    console.error('[Discord OAuth] No authorization code received');
    return NextResponse.redirect(
      new URL(`/?error=discord_auth_failed`, baseUrl)
    );
  }

  // Декодируем state
  let action = 'login';
  let joinServer = false;
  try {
    if (state) {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      action = decoded.action || 'login';
      joinServer = decoded.joinServer || false;
      console.log('[Discord OAuth] Decoded state:', { action, joinServer });
    }
  } catch (e) {
    console.error('[Discord OAuth] Failed to decode state:', e);
    // Используем значение по умолчанию
  }

  try {
    console.log('[Discord OAuth] Exchanging code for token...');
    // Обмениваем code на access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_OAUTH_CLIENT_ID!,
        client_secret: process.env.DISCORD_OAUTH_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.DISCORD_OAUTH_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[Discord OAuth] Token exchange failed:', tokenResponse.status, errorData);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('[Discord OAuth] Token received successfully');

    // Получаем информацию о пользователе Discord
    console.log('[Discord OAuth] Fetching user data...');
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error('[Discord OAuth] Failed to fetch user data:', userResponse.status);
      throw new Error('Failed to fetch Discord user');
    }

    const discordUser: DiscordUser = await userResponse.json();
    console.log('[Discord OAuth] User data received:', {
      id: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      globalName: discordUser.global_name
    });

    if (action === 'link') {
      console.log('[Discord OAuth] Processing link action...');
      // Привязка Discord к существующему аккаунту
      return await handleDiscordLink(request, discordUser, accessToken, joinServer);
    } else {
      console.log('[Discord OAuth] Processing login action...');
      // Авторизация/регистрация через Discord
      return await handleDiscordLogin(request, discordUser);
    }
  } catch (error) {
    console.error('[Discord OAuth] Error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://77.91.100.68:3000';
    return NextResponse.redirect(
      new URL(`/?error=discord_auth_error`, baseUrl)
    );
  }
}

async function handleDiscordLogin(request: NextRequest, discordUser: DiscordUser) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://77.91.100.68:3000';
  
  // Проверяем, есть ли пользователь с таким Discord ID
  let user = await prisma.user.findUnique({
    where: { discordId: discordUser.id },
  });

  if (!user) {
    // Пользователь не найден - создаем новый аккаунт
    if (!discordUser.email) {
      return NextResponse.redirect(
        new URL(`/?error=discord_email_required`, baseUrl)
      );
    }

    // Проверяем, не занят ли email
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: discordUser.email },
    });

    if (existingEmailUser) {
      // Email уже занят - предлагаем привязать
      return NextResponse.redirect(
        new URL(`/client/profile?discord_link_suggestion=true`, baseUrl)
      );
    }

    // Создаем нового пользователя
    const randomPassword = bcrypt.hashSync(
      Math.random().toString(36).slice(-8) + discordUser.id,
      10
    );

    user = await prisma.user.create({
      data: {
        email: discordUser.email,
        password: randomPassword,
        name: discordUser.global_name || discordUser.username,
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordDiscriminator: discordUser.discriminator,
        discordAvatar: discordUser.avatar || null,
        discordGlobalName: discordUser.global_name || null,
        emailVerified: true, // Discord email уже подтвержден
        balance: 0,
        role: 'USER',
      },
    });

    // Выдаём роль в Discord
    try {
      await giveDiscordRole(discordUser.id);
    } catch (roleError) {
      console.error('[Discord Login] Failed to give Discord role:', roleError);
    }
  }

  // Создаем JWT токен
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Устанавливаем cookie
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: false, // ИЗМЕНИТЬ НА true ПОСЛЕ НАСТРОЙКИ SSL/HTTPS!
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 дней
    path: '/',
  });

  // Редирект на клиентскую панель
  return NextResponse.redirect(new URL('/client', baseUrl));
}

async function handleDiscordLink(request: NextRequest, discordUser: DiscordUser, accessToken: string, joinServer: boolean) {
  console.log('[Discord Link] Starting link process for user:', discordUser.id);
  
  // Используем NEXT_PUBLIC_APP_URL вместо request.url для правильного редиректа
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://77.91.100.68:3000';
  
  // Получаем текущего пользователя из cookie
  const cookieStore = await cookies();
  
  // Выведем все cookies для отладки
  const allCookies = cookieStore.getAll();
  console.log('[Discord Link] All cookies:', allCookies.map(c => c.name));
  
  const token = cookieStore.get('auth-token')?.value;

  console.log('[Discord Link] Token found:', !!token);

  if (!token) {
    console.error('[Discord Link] No authentication token found');
    console.error('[Discord Link] Available cookies:', allCookies.map(c => c.name).join(', '));
    return NextResponse.redirect(
      new URL(`/?error=not_authenticated`, baseUrl)
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    console.log('[Discord Link] Authenticated user ID:', decoded.userId);
    
    // Проверяем, не привязан ли Discord ID к другому аккаунту
    const existingDiscordUser = await prisma.user.findUnique({
      where: { discordId: discordUser.id },
    });

    if (existingDiscordUser && existingDiscordUser.id !== decoded.userId) {
      console.error('[Discord Link] Discord ID already linked to another account');
      return NextResponse.redirect(
        new URL(`/client/settings?error=discord_already_linked`, baseUrl)
      );
    }

    console.log('[Discord Link] Updating user record...');
    // Привязываем Discord ID к текущему пользователю
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { 
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordDiscriminator: discordUser.discriminator,
        discordAvatar: discordUser.avatar || null,
        discordGlobalName: discordUser.global_name || null,
      },
    });
    console.log('[Discord Link] User record updated successfully');

    // Выдаём роль в Discord
    console.log('[Discord Link] Giving Discord role...');
    try {
      await giveDiscordRole(discordUser.id);
      console.log('[Discord Link] Discord role given successfully');
    } catch (roleError) {
      console.error('[Discord Link] Failed to give Discord role:', roleError);
      // Не прерываем процесс, если роль не удалось выдать
    }

    // Проверяем настройку присоединения к серверу
    if (joinServer && process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID) {
      console.log('[Discord Link] Attempting to add user to Discord server...');
      try {
        // Добавляем пользователя на Discord сервер через Bot API
        const addMemberResponse = await fetch(
          `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordUser.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: accessToken, // OAuth access token нужен здесь
            })
          }
        );

        if (addMemberResponse.ok) {
          console.log('[Discord Link] User added to Discord server successfully');
        } else {
          const errorText = await addMemberResponse.text();
          console.error('[Discord Link] Failed to add user to server:', addMemberResponse.status, errorText);
        }
      } catch (joinError) {
        console.error('[Discord Link] Error adding user to Discord server:', joinError);
        // Не прерываем процесс
      }
    }

    console.log('[Discord Link] Redirecting to settings page');
    return NextResponse.redirect(
      new URL(`/client/settings?discord=linked`, baseUrl)
    );
  } catch (error) {
    console.error('[Discord Link] Error:', error);
    return NextResponse.redirect(
      new URL(`/?error=discord_link_failed`, baseUrl)
    );
  }
}
