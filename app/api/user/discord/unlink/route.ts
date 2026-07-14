import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { removeDiscordRole } from '@/lib/discord-role';

export async function POST(request: NextRequest) {
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
      }
    });

    if (!user || !user.discordId) {
      return NextResponse.json({ error: 'Discord не привязан' }, { status: 400 });
    }

    // Сохраняем Discord ID перед удалением для удаления роли
    const discordId = user.discordId;

    // Отвязываем Discord ID
    await prisma.user.update({
      where: { id: authUser.id },
      data: { 
        discordId: null,
        discordUsername: null,
        discordDiscriminator: null,
        discordAvatar: null,
        discordGlobalName: null,
      }
    });

    console.log(`[Discord Unlink] User ${authUser.email} unlinked Discord ${discordId}`);

    // Удаляем роль в Discord
    await removeDiscordRole(discordId);

    return NextResponse.json({
      success: true,
      message: 'Discord успешно отвязан'
    });
  } catch (error) {
    console.error('[Discord Unlink] Error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
