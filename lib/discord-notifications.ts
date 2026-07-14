/**
 * Утилита для отправки уведомлений в Discord бота
 */

interface NotificationData {
  type: 'BALANCE' | 'SERVER' | 'USER' | 'ADMIN' | 'BAN' | 'APPEAL';
  data: any;
}

/**
 * Отправить уведомление в Discord бота
 */
export async function sendDiscordNotification(notification: NotificationData) {
  try {
    const webhookSecret = process.env.INTERNAL_WEBHOOK_SECRET || 'fluxor-internal-webhook';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await fetch(`${appUrl}/api/discord-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`
      },
      body: JSON.stringify(notification)
    });

    if (!response.ok) {
      console.error('Failed to send Discord notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
}

/**
 * Уведомление о пополнении баланса
 */
export async function notifyBalanceDeposit(transaction: any) {
  await sendDiscordNotification({
    type: 'BALANCE',
    data: transaction
  });
}

/**
 * Уведомление о создании сервера
 */
export async function notifyServerCreated(server: any) {
  await sendDiscordNotification({
    type: 'SERVER',
    data: { ...server, action: 'CREATE' }
  });
}

/**
 * Уведомление о регистрации пользователя
 */
export async function notifyUserRegistered(user: any) {
  await sendDiscordNotification({
    type: 'USER',
    data: { ...user, action: 'REGISTER' }
  });
}

/**
 * Уведомление о бане пользователя
 */
export async function notifyUserBanned(ban: any, user: any) {
  await sendDiscordNotification({
    type: 'BAN',
    data: { ban, user }
  });
}

/**
 * Уведомление об апелляции
 */
export async function notifyAppealCreated(appeal: any, user: any) {
  await sendDiscordNotification({
    type: 'APPEAL',
    data: { appeal, user }
  });
}
