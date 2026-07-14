import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { giveDiscordRole } from '@/lib/discord-role';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { discordId } = body;

    if (!discordId || typeof discordId !== 'string') {
      return NextResponse.json({ error: 'Discord ID обязателен' }, { status: 400 });
    }

    // Проверка формата Discord ID
    if (!/^\d{17,19}$/.test(discordId)) {
      return NextResponse.json({ 
        error: 'Неверный формат Discord ID. Должно быть 17-19 цифр.' 
      }, { status: 400 });
    }

    // Проверяем, не привязан ли этот Discord ID к другому аккаунту
    const existingLink = await prisma.user.findFirst({
      where: {
        discordId: discordId,
        id: { not: user.id }
      }
    });

    if (existingLink) {
      return NextResponse.json({
        error: 'Этот Discord ID уже привязан к другому аккаунту'
      }, { status: 400 });
    }

    // Привязываем Discord ID
    await prisma.user.update({
      where: { id: user.id },
      data: { discordId }
    });

    console.log(`[Discord Link] User ${user.email} linked Discord ${discordId}`);

    // Выдаём роль в Discord
    await giveDiscordRole(discordId);

    return NextResponse.json({
      success: true,
      message: 'Discord успешно привязан! Теперь вы можете использовать команды бота.'
    });
  } catch (error) {
    console.error('[Discord Link] Error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
