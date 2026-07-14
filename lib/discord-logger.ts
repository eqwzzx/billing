/**
 * Discord Logger - отправка админ логов в Discord
 */

interface AdminLog {
  id: string;
  action: string;
  description: string;
  userId?: string | null;
  adminId?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
}

/**
 * Отправить админ лог в Discord через webhook бота
 */
export async function sendAdminLogToDiscord(adminLog: AdminLog) {
  try {
    const webhookUrl = process.env.DISCORD_BOT_WEBHOOK_URL;
    const webhookSecret = process.env.INTERNAL_WEBHOOK_SECRET;

    if (!webhookUrl || !webhookSecret) {
      console.log('⚠️ Discord webhook не настроен, пропускаем отправку лога');
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`
      },
      body: JSON.stringify({
        type: 'ADMIN',
        data: adminLog
      })
    });

    if (!response.ok) {
      console.error('❌ Ошибка отправки лога в Discord:', response.status, response.statusText);
    } else {
      console.log('✅ Админ лог отправлен в Discord:', adminLog.action);
    }
  } catch (error) {
    console.error('❌ Ошибка отправки админ лога в Discord:', error);
  }
}

/**
 * Отправить уведомление о пополнении баланса
 */
export async function sendBalanceNotificationToDiscord(transaction: any) {
  try {
    const webhookUrl = process.env.DISCORD_BOT_WEBHOOK_URL;
    const webhookSecret = process.env.INTERNAL_WEBHOOK_SECRET;

    if (!webhookUrl || !webhookSecret) {
      return;
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`
      },
      body: JSON.stringify({
        type: 'BALANCE',
        data: transaction
      })
    });
  } catch (error) {
    console.error('❌ Ошибка отправки уведомления о балансе:', error);
  }
}

/**
 * Отправить уведомление о действии с сервером
 */
export async function sendServerNotificationToDiscord(server: any, action: string) {
  try {
    const webhookUrl = process.env.DISCORD_BOT_WEBHOOK_URL;
    const webhookSecret = process.env.INTERNAL_WEBHOOK_SECRET;

    if (!webhookUrl || !webhookSecret) {
      return;
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`
      },
      body: JSON.stringify({
        type: 'SERVER',
        data: {
          ...server,
          action
        }
      })
    });
  } catch (error) {
    console.error('❌ Ошибка отправки уведомления о сервере:', error);
  }
}

/**
 * Отправить уведомление о действии пользователя
 */
export async function sendUserNotificationToDiscord(user: any, action: string) {
  try {
    const webhookUrl = process.env.DISCORD_BOT_WEBHOOK_URL;
    const webhookSecret = process.env.INTERNAL_WEBHOOK_SECRET;

    if (!webhookUrl || !webhookSecret) {
      return;
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`
      },
      body: JSON.stringify({
        type: 'USER',
        data: {
          ...user,
          action
        }
      })
    });
  } catch (error) {
    console.error('❌ Ошибка отправки уведомления о пользователе:', error);
  }
}

/**
 * Отправить уведомление о бане
 */
export async function sendBanNotificationToDiscord(ban: any, user: any) {
  try {
    const webhookUrl = process.env.DISCORD_BOT_WEBHOOK_URL;
    const webhookSecret = process.env.INTERNAL_WEBHOOK_SECRET;

    if (!webhookUrl || !webhookSecret) {
      return;
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`
      },
      body: JSON.stringify({
        type: 'BAN',
        data: { ban, user }
      })
    });
  } catch (error) {
    console.error('❌ Ошибка отправки уведомления о бане:', error);
  }
}
