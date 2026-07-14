import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Получаем полные данные пользователя из базы включая Discord поля
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        discordId: true,
        discordUsername: true,
        discordDiscriminator: true,
        discordAvatar: true,
        discordGlobalName: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (user.discordId) {
      return NextResponse.json({
        linked: true,
        discordId: user.discordId,
        username: user.discordUsername,
        discriminator: user.discordDiscriminator,
        avatar: user.discordAvatar,
        globalName: user.discordGlobalName,
        discordTag: user.discordUsername && user.discordDiscriminator 
          ? `${user.discordUsername}#${user.discordDiscriminator}` 
          : null
      });
    }

    return NextResponse.json({ linked: false });
  } catch (error) {
    console.error('[Discord Check] Error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
