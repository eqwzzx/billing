import express from 'express';
import {
  sendBalanceNotification,
  sendServerNotification,
  sendUserNotification,
  sendAdminNotification,
  sendBanNotification,
  sendAppealNotification
} from './utils/notifications.js';

/**
 * HTTP сервер для приёма webhook уведомлений от веб-приложения
 */
export function createWebhookServer(client) {
  const app = express();
  app.use(express.json());

  const webhookSecret = process.env.INTERNAL_WEBHOOK_SECRET || 'fluxor-internal-webhook';
  const port = process.env.DISCORD_BOT_WEBHOOK_PORT || 3001;

  // Middleware для проверки авторизации
  app.use((req, res, next) => {
    if (req.path === '/health') return next();
    
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      bot: client.user?.tag || 'not ready',
      uptime: process.uptime()
    });
  });

  // Webhook endpoint
  app.post('/webhook', async (req, res) => {
    try {
      const { type, data } = req.body;

      console.log(`📬 Получен webhook: ${type}`);

      switch (type) {
        case 'BALANCE':
          await sendBalanceNotification(client, data);
          break;

        case 'SERVER':
          await sendServerNotification(client, data, data.action || 'CREATE');
          break;

        case 'USER':
          await sendUserNotification(client, data, data.action || 'REGISTER');
          break;

        case 'ADMIN':
          await sendAdminNotification(client, data);
          break;

        case 'BAN':
          await sendBanNotification(client, data.ban, data.user);
          break;

        case 'APPEAL':
          await sendAppealNotification(client, data.appeal, data.user);
          break;

        default:
          console.warn(`⚠️  Неизвестный тип webhook: ${type}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('❌ Ошибка обработки webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const server = app.listen(port, () => {
    console.log(`🌐 Webhook сервер запущен на порту ${port}`);
  });

  return server;
}
