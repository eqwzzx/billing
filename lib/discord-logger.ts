/**
 * Discord Logger Utility
 * Отправляет логи в Discord через webhook
 */

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string;
  footer?: {
    text: string;
  };
  author?: {
    name: string;
    icon_url?: string;
  };
}

interface LogData {
  userId?: string;
  userName?: string;
  userEmail?: string;
  action?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

class DiscordLogger {
  private webhookUrl: string | undefined;

  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  }

  /**
   * Отправка лога в Discord
   */
  private async sendToDiscord(embed: DiscordEmbed): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('DISCORD_WEBHOOK_URL не настроен, лог пропущен');
      return;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed],
        }),
      });

      if (!response.ok) {
        console.error('Discord webhook error:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to send Discord log:', error);
    }
  }

  /**
   * Цвета для разных типов логов
   */
  private getColor(type: 'success' | 'info' | 'warning' | 'error' | 'admin'): number {
    const colors = {
      success: 0x00ff00, // Зеленый
      info: 0x3b82f6,    // Синий
      warning: 0xfbbf24, // Желтый
      error: 0xef4444,   // Красный
      admin: 0x8b5cf6,   // Фиолетовый
    };
    return colors[type];
  }

  /**
   * Форматирование временной метки
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Логирование авторизации
   */
  async logAuth(data: {
    type: 'login' | 'register' | 'logout';
    userId: string;
    userName: string;
    userEmail: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const titles = {
      login: '🔐 Пользователь вошел в систему',
      register: '✨ Новая регистрация',
      logout: '🚪 Пользователь вышел',
    };

    const colors = {
      login: this.getColor('success'),
      register: this.getColor('info'),
      logout: this.getColor('info'),
    };

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: '👤 Имя', value: data.userName, inline: true },
      { name: '📧 Email', value: data.userEmail, inline: true },
      { name: '🆔 ID', value: data.userId, inline: true },
    ];

    if (data.ipAddress) {
      fields.push({ name: '🌐 IP', value: data.ipAddress, inline: true });
    }

    if (data.userAgent) {
      fields.push({ name: '💻 User Agent', value: data.userAgent.substring(0, 100), inline: false });
    }

    await this.sendToDiscord({
      title: titles[data.type],
      color: colors[data.type],
      fields,
      timestamp: this.getTimestamp(),
      footer: { text: 'Fluxor Auth System' },
    });
  }

  /**
   * Логирование привязки Discord
   */
  async logDiscordLink(data: {
    userId: string;
    userName: string;
    userEmail: string;
    discordId: string;
    discordUsername: string;
    discordAvatar?: string;
    ipAddress?: string;
  }): Promise<void> {
    await this.sendToDiscord({
      title: '🔗 Discord привязан к аккаунту',
      color: this.getColor('success'),
      fields: [
        { name: '👤 Имя пользователя', value: data.userName, inline: true },
        { name: '📧 Email', value: data.userEmail, inline: true },
        { name: '🆔 User ID', value: data.userId, inline: true },
        { name: '💬 Discord Username', value: data.discordUsername, inline: true },
        { name: '💬 Discord ID', value: data.discordId, inline: true },
        ...(data.ipAddress ? [{ name: '🌐 IP', value: data.ipAddress, inline: true }] : []),
      ],
      timestamp: this.getTimestamp(),
      footer: { text: 'Fluxor Discord Integration' },
      ...(data.discordAvatar ? {
        author: {
          name: data.discordUsername,
          icon_url: `https://cdn.discordapp.com/avatars/${data.discordId}/${data.discordAvatar}.png`,
        },
      } : {}),
    });
  }

  /**
   * Логирование отвязки Discord
   */
  async logDiscordUnlink(data: {
    userId: string;
    userName: string;
    userEmail: string;
    discordId: string;
    discordUsername: string;
  }): Promise<void> {
    await this.sendToDiscord({
      title: '🔓 Discord отвязан от аккаунта',
      color: this.getColor('warning'),
      fields: [
        { name: '👤 Имя пользователя', value: data.userName, inline: true },
        { name: '📧 Email', value: data.userEmail, inline: true },
        { name: '🆔 User ID', value: data.userId, inline: true },
        { name: '💬 Discord Username', value: data.discordUsername, inline: true },
        { name: '💬 Discord ID', value: data.discordId, inline: true },
      ],
      timestamp: this.getTimestamp(),
      footer: { text: 'Fluxor Discord Integration' },
    });
  }

  /**
   * Логирование действий администратора
   */
  async logAdminAction(data: {
    adminId: string;
    adminName: string;
    adminEmail: string;
    action: string;
    targetType?: string; // 'user', 'server', 'payment', etc.
    targetId?: string;
    targetName?: string;
    details?: string;
    ipAddress?: string;
  }): Promise<void> {
    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: '👨‍💼 Администратор', value: data.adminName, inline: true },
      { name: '📧 Email', value: data.adminEmail, inline: true },
      { name: '🆔 Admin ID', value: data.adminId, inline: true },
      { name: '⚡ Действие', value: data.action, inline: false },
    ];

    if (data.targetType && data.targetId) {
      fields.push({ name: '🎯 Тип объекта', value: data.targetType, inline: true });
      fields.push({ name: '🆔 ID объекта', value: data.targetId, inline: true });
    }

    if (data.targetName) {
      fields.push({ name: '📝 Имя объекта', value: data.targetName, inline: true });
    }

    if (data.details) {
      fields.push({ name: '📋 Детали', value: data.details, inline: false });
    }

    if (data.ipAddress) {
      fields.push({ name: '🌐 IP', value: data.ipAddress, inline: true });
    }

    await this.sendToDiscord({
      title: '🛡️ Действие администратора',
      color: this.getColor('admin'),
      fields,
      timestamp: this.getTimestamp(),
      footer: { text: 'Fluxor Admin Panel' },
    });
  }

  /**
   * Логирование платежа
   */
  async logPayment(data: {
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
    details?: string;
  }): Promise<void> {
    const statusEmojis = {
      pending: '⏳',
      completed: '✅',
      failed: '❌',
    };

    const statusColors = {
      pending: this.getColor('warning'),
      completed: this.getColor('success'),
      failed: this.getColor('error'),
    };

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: '👤 Пользователь', value: data.userName, inline: true },
      { name: '📧 Email', value: data.userEmail, inline: true },
      { name: '🆔 User ID', value: data.userId, inline: true },
      { name: '💰 Сумма', value: `${data.amount} ${data.currency}`, inline: true },
      { name: '💳 Метод оплаты', value: data.paymentMethod, inline: true },
      { name: '📊 Статус', value: `${statusEmojis[data.status]} ${data.status}`, inline: true },
    ];

    if (data.transactionId) {
      fields.push({ name: '🔖 ID транзакции', value: data.transactionId, inline: false });
    }

    if (data.details) {
      fields.push({ name: '📋 Детали', value: data.details, inline: false });
    }

    await this.sendToDiscord({
      title: `${statusEmojis[data.status]} Платеж ${data.status === 'completed' ? 'завершен' : data.status === 'failed' ? 'отклонен' : 'обрабатывается'}`,
      color: statusColors[data.status],
      fields,
      timestamp: this.getTimestamp(),
      footer: { text: 'Fluxor Payment System' },
    });
  }

  /**
   * Логирование создания/удаления сервера
   */
  async logServer(data: {
    action: 'create' | 'delete' | 'suspend' | 'unsuspend';
    userId: string;
    userName: string;
    userEmail: string;
    serverId: string;
    serverName: string;
    planName?: string;
    adminId?: string;
    adminName?: string;
  }): Promise<void> {
    const actionData = {
      create: { title: '🆕 Сервер создан', color: this.getColor('success') },
      delete: { title: '🗑️ Сервер удален', color: this.getColor('error') },
      suspend: { title: '⏸️ Сервер приостановлен', color: this.getColor('warning') },
      unsuspend: { title: '▶️ Сервер возобновлен', color: this.getColor('success') },
    };

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: '👤 Пользователь', value: data.userName, inline: true },
      { name: '📧 Email', value: data.userEmail, inline: true },
      { name: '🆔 User ID', value: data.userId, inline: true },
      { name: '🖥️ Имя сервера', value: data.serverName, inline: true },
      { name: '🔖 Server ID', value: data.serverId, inline: true },
    ];

    if (data.planName) {
      fields.push({ name: '📦 Тариф', value: data.planName, inline: true });
    }

    if (data.adminId && data.adminName) {
      fields.push({ name: '👨‍💼 Администратор', value: `${data.adminName} (${data.adminId})`, inline: false });
    }

    await this.sendToDiscord({
      title: actionData[data.action].title,
      color: actionData[data.action].color,
      fields,
      timestamp: this.getTimestamp(),
      footer: { text: 'Fluxor Server Management' },
    });
  }

  /**
   * Общий лог для кастомных событий
   */
  async log(data: {
    title: string;
    description?: string;
    type: 'success' | 'info' | 'warning' | 'error' | 'admin';
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    footer?: string;
  }): Promise<void> {
    await this.sendToDiscord({
      title: data.title,
      description: data.description,
      color: this.getColor(data.type),
      fields: data.fields,
      timestamp: this.getTimestamp(),
      footer: { text: data.footer || 'Fluxor System' },
    });
  }
}

// Экспортируем singleton
export const discordLogger = new DiscordLogger();
