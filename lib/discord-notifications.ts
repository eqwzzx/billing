/**
 * Discord Notifications - отправка различных уведомлений в Discord
 */

const WEBHOOK_URL = process.env.DISCORD_BOT_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.INTERNAL_WEBHOOK_SECRET;

/**
 * Базовая функция для отправки webhook
 */
async function sendWebhook(type: string, data: any) {
  try {
    if (!WEBHOOK_URL || !WEBHOOK_SECRET) {
      console.log('⚠️ Discord webhook не настроен, пропускаем уведомление');
      return false;
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBHOOK_SECRET}`
      },
      body: JSON.stringify({ type, data })
    });

    if (!response.ok) {
      console.error('❌ Ошибка отправки webhook в Discord:', response.status);
      return false;
    }

    console.log(`✅ Отправлено уведомление в Discord: ${type}`);
    return true;
  } catch (error) {
    console.error('❌ Ошибка отправки webhook:', error);
    return false;
  }
}

/**
 * Отправить уведомление о пополнении/списании баланса
 */
export async function sendBalanceNotification(data: {
  userId: string;
  amount: number;
  newBalance: number;
  description: string;
  isAddition: boolean;
}) {
  // Получаем данные пользователя из БД
  const { prisma } = await import('@/lib/db');
  
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: {
      id: true,
      name: true,
      email: true,
      discordId: true,
      balance: true
    }
  });

  if (!user) {
    console.error('Пользователь не найден:', data.userId);
    return false;
  }

  return await sendWebhook('BALANCE', {
    id: `balance_${Date.now()}`,
    userId: user.id,
    amount: data.isAddition ? data.amount : -data.amount,
    method: 'MANUAL',
    description: data.description,
    createdAt: new Date().toISOString(),
    user: {
      name: user.name,
      email: user.email,
      discordId: user.discordId,
      balance: user.balance
    }
  });
}

/**
 * Отправить уведомление о действии с сервером
 */
export async function sendServerNotification(serverId: string, action: 'CREATE' | 'DELETE' | 'SUSPEND' | 'UNSUSPEND' | 'RENEW') {
  const { prisma } = await import('@/lib/db');
  
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          discordId: true
        }
      },
      plan: {
        select: {
          name: true,
          category: true,
          ram: true,
          cpu: true,
          disk: true
        }
      }
    }
  });

  if (!server) {
    console.error('Сервер не найден:', serverId);
    return false;
  }

  return await sendWebhook('SERVER', {
    ...server,
    action
  });
}

/**
 * Отправить уведомление о действии пользователя
 */
export async function sendUserNotification(userId: string, action: 'REGISTER' | 'LOGIN' | 'VERIFY' | 'DISCORD_LINK') {
  const { prisma } = await import('@/lib/db');
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      discordId: true,
      balance: true
    }
  });

  if (!user) {
    console.error('Пользователь не найден:', userId);
    return false;
  }

  return await sendWebhook('USER', {
    ...user,
    action
  });
}

/**
 * Отправить уведомление о бане
 */
export async function sendBanNotification(banId: string) {
  const { prisma } = await import('@/lib/db');
  
  const ban = await prisma.ban.findUnique({
    where: { id: banId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          discordId: true
        }
      }
    }
  });

  if (!ban) {
    console.error('Бан не найден:', banId);
    return false;
  }

  return await sendWebhook('BAN', {
    ban: {
      id: ban.id,
      userId: ban.userId,
      banType: ban.banType,
      reason: ban.reason,
      expiresAt: ban.expiresAt,
      createdAt: ban.createdAt
    },
    user: ban.user
  });
}

/**
 * Отправить уведомление об апелляции
 */
export async function sendAppealNotification(appealId: string) {
  const { prisma } = await import('@/lib/db');
  
  const appeal = await prisma.banAppeal.findUnique({
    where: { id: appealId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          discordId: true
        }
      }
    }
  });

  if (!appeal) {
    console.error('Апелляция не найдена:', appealId);
    return false;
  }

  return await sendWebhook('APPEAL', {
    appeal: {
      id: appeal.id,
      userId: appeal.userId,
      reason: appeal.reason,
      status: appeal.status,
      reviewNote: appeal.reviewNote,
      createdAt: appeal.createdAt
    },
    user: appeal.user
  });
}

/**
 * Уведомление о пополнении баланса (alias для sendBalanceNotification)
 */
export async function notifyBalanceDeposit(data: {
  userId: string;
  amount: number;
  newBalance: number;
  description: string;
  method?: string;
}) {
  return await sendBalanceNotification({
    userId: data.userId,
    amount: data.amount,
    newBalance: data.newBalance,
    description: data.description,
    isAddition: true
  });
}

/**
 * Уведомление о регистрации пользователя (alias для sendUserNotification)
 */
export async function notifyUserRegistered(userId: string) {
  return await sendUserNotification(userId, 'REGISTER');
}
