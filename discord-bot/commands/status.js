import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

// Хранилище сообщений статуса для каждого канала
const statusMessages = new Map();
const updateIntervals = new Map();

// Эмодзи для статусов
const STATUS_EMOJI = {
  online: '🟢',
  offline: '🔴',
  degraded: '🟡'
};

// Эмодзи для типов сервисов
const SERVICE_EMOJI = {
  WEB: '🌐',
  GAME: '🎮',
  NODE: '🖥️',
  DATABASE: '💾',
  API: '🔌'
};

/**
 * Получить статус всех сервисов из БД
 */
async function getServicesStatus() {
  try {
    const connection = await getDbConnection();
    
    const [statuses] = await connection.execute(`
      SELECT 
        ss.id,
        ss.name,
        ss.type,
        ss.isOnline,
        ss.responseTime,
        ss.lastCheck,
        ss.sortOrder,
        pn.name as nodeName,
        pn.locationName
      FROM ServiceStatus ss
      LEFT JOIN PterodactylNode pn ON ss.nodeId = pn.id
      ORDER BY ss.sortOrder ASC, ss.createdAt ASC
    `);
    
    return statuses;
  } catch (error) {
    console.error('Error fetching service status:', error);
    return [];
  }
}

/**
 * Вычислить общий uptime
 */
async function calculateUptime(serviceId) {
  try {
    const connection = await getDbConnection();
    
    // Получаем статистику за последние 24 часа
    const [history] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN isOnline = 1 THEN 1 ELSE 0 END) as online
      FROM UptimeHistory
      WHERE serviceId = ?
      AND checkedAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `, [serviceId]);
    
    if (history[0].total === 0) return 100;
    
    return ((history[0].online / history[0].total) * 100).toFixed(2);
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Создать эмбед со статусом сервисов
 */
async function createStatusEmbed() {
  const services = await getServicesStatus();
  
  if (!services || services.length === 0) {
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('⚠️ Статус сервисов')
      .setDescription('Нет данных о сервисах. Инициализируйте статусы в админ панели.')
      .setTimestamp();
    return embed;
  }
  
  // Группируем сервисы по типам
  const servicesByType = {};
  for (const service of services) {
    if (!servicesByType[service.type]) {
      servicesByType[service.type] = [];
    }
    servicesByType[service.type].push(service);
  }
  
  // Подсчитываем общую статистику
  const totalServices = services.length;
  const onlineServices = services.filter(s => s.isOnline).length;
  const offlineServices = totalServices - onlineServices;
  
  // Определяем общий статус
  let overallStatus = 'online';
  let overallColor = '#00ff00'; // Зеленый
  
  if (offlineServices > 0) {
    if (offlineServices === totalServices) {
      overallStatus = 'offline';
      overallColor = '#ff0000'; // Красный
    } else {
      overallStatus = 'degraded';
      overallColor = '#ffaa00'; // Оранжевый
    }
  }
  
  const statusText = {
    online: '✅ Все системы работают нормально',
    degraded: '⚠️ Некоторые системы недоступны',
    offline: '🔴 Все системы недоступны'
  };
  
  const embed = new EmbedBuilder()
    .setColor(overallColor)
    .setTitle('📊 Статус сервисов Fluxor')
    .setDescription(statusText[overallStatus])
    .addFields({
      name: '📈 Общая статистика',
      value: `🟢 Онлайн: **${onlineServices}** | 🔴 Оффлайн: **${offlineServices}** | 📊 Всего: **${totalServices}**`,
      inline: false
    });
  
  // Добавляем информацию о каждом типе сервиса
  for (const [type, typeServices] of Object.entries(servicesByType)) {
    const emoji = SERVICE_EMOJI[type] || '🔧';
    const serviceLines = [];
    
    for (const service of typeServices) {
      const statusEmoji = service.isOnline ? STATUS_EMOJI.online : STATUS_EMOJI.offline;
      const responseTime = service.responseTime ? `${service.responseTime}ms` : 'N/A';
      const uptime = await calculateUptime(service.id);
      
      let serviceName = service.name;
      if (service.nodeName) {
        serviceName += ` (${service.nodeName})`;
      }
      
      serviceLines.push(
        `${statusEmoji} **${serviceName}**\n` +
        `└ Время ответа: \`${responseTime}\` | Uptime: \`${uptime}%\``
      );
    }
    
    if (serviceLines.length > 0) {
      embed.addFields({
        name: `${emoji} ${type}`,
        value: serviceLines.join('\n\n'),
        inline: false
      });
    }
  }
  
  // Добавляем время последнего обновления
  const lastCheck = services[0]?.lastCheck;
  if (lastCheck) {
    const timestamp = Math.floor(new Date(lastCheck).getTime() / 1000);
    embed.setFooter({ 
      text: `Обновляется каждые 3 минуты • Последняя проверка` 
    });
    embed.setTimestamp(new Date(lastCheck));
  } else {
    embed.setFooter({ text: 'Обновляется каждые 3 минуты' });
    embed.setTimestamp();
  }
  
  return embed;
}

/**
 * Обновить сообщение со статусом
 */
async function updateStatusMessage(message) {
  try {
    const embed = await createStatusEmbed();
    await message.edit({ embeds: [embed] });
  } catch (error) {
    console.error('Error updating status message:', error);
  }
}

/**
 * Запустить автообновление статуса
 */
function startAutoUpdate(message, channelId) {
  // Останавливаем предыдущее обновление, если было
  if (updateIntervals.has(channelId)) {
    clearInterval(updateIntervals.get(channelId));
  }
  
  // Обновляем каждые 3 минуты (180000 мс)
  const interval = setInterval(async () => {
    try {
      // Проверяем что сообщение еще существует
      await message.fetch().catch(() => {
        // Сообщение удалено, останавливаем обновление
        clearInterval(interval);
        updateIntervals.delete(channelId);
        statusMessages.delete(channelId);
        return;
      });
      
      await updateStatusMessage(message);
      console.log(`✅ Status updated for channel ${channelId}`);
    } catch (error) {
      console.error('Error in auto-update:', error);
      // Если ошибка, останавливаем обновление
      clearInterval(interval);
      updateIntervals.delete(channelId);
      statusMessages.delete(channelId);
    }
  }, 180000); // 3 минуты
  
  updateIntervals.set(channelId, interval);
  console.log(`✅ Auto-update started for channel ${channelId}`);
  return interval;
}

/**
 * Запустить глобальное автообновление для всех статусов
 */
async function startGlobalAutoUpdate(client) {
  try {
    const db = await getDbConnection();
    
    // Получаем ID канала для статусов из настроек
    const [settings] = await db.query(
      'SELECT value FROM BotSetting WHERE `key` = ?',
      ['status_channel_id']
    );
    
    if (!settings || settings.length === 0) {
      console.log('⚠️  Status channel not configured, skipping auto-update');
      return;
    }
    
    const statusChannelId = settings[0].value;
    
    // Получаем канал
    const channel = await client.channels.fetch(statusChannelId).catch(() => null);
    if (!channel) {
      console.log('⚠️  Status channel not found, skipping auto-update');
      return;
    }
    
    // Получаем ID последнего сообщения статуса
    const [messageSettings] = await db.query(
      'SELECT value FROM BotSetting WHERE `key` = ?',
      ['status_message_id']
    );
    
    if (!messageSettings || messageSettings.length === 0) {
      console.log('⚠️  Status message not configured, skipping auto-update');
      return;
    }
    
    const messageId = messageSettings[0].value;
    
    // Получаем сообщение
    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message) {
      console.log('⚠️  Status message not found, skipping auto-update');
      return;
    }
    
    // Запускаем автообновление для этого сообщения
    statusMessages.set(statusChannelId, message);
    startAutoUpdate(message, statusChannelId);
    
    console.log(`✅ Global auto-update started for channel ${statusChannelId}`);
  } catch (error) {
    console.error('Error starting global auto-update:', error);
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Показать статус всех сервисов с автообновлением'),
  
  async execute(interaction) {
    // Проверка прав администратора
    const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()) || [];
    
    if (!adminIds.includes(interaction.user.id)) {
      await interaction.reply({
        content: '❌ У вас нет прав для использования этой команды.',
        ephemeral: true
      });
      return;
    }

    // Отправляем эфемерное сообщение что команда выполняется
    await interaction.reply({
      content: '⏳ Получение статуса серверов...',
      ephemeral: true
    });

    try {
      const embed = await createStatusEmbed();
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('refresh_status')
            .setLabel('🔄 Обновить')
            .setStyle(ButtonStyle.Primary)
        );
      
      // Отправляем публичное сообщение со статусом в текущий канал
      const message = await interaction.channel.send({ 
        embeds: [embed],
        components: [row]
      });

      // Обновляем эфемерное сообщение
      await interaction.editReply({
        content: '✅ Статус серверов отображен в канале!',
        ephemeral: true
      });
      
      // Сохраняем сообщение для автообновления
      const channelId = interaction.channelId;
      
      // Останавливаем предыдущее обновление, если было
      if (updateIntervals.has(channelId)) {
        clearInterval(updateIntervals.get(channelId));
        updateIntervals.delete(channelId);
      }
      
      // Запускаем новое автообновление
      startAutoUpdate(message, channelId);
      statusMessages.set(channelId, message);
      
      // Сохраняем ID канала и сообщения в БД для автообновления после перезапуска
      try {
        const db = await getDbConnection();
        
        await db.query(
          'INSERT INTO BotSetting (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
          ['status_channel_id', channelId, channelId]
        );
        
        await db.query(
          'INSERT INTO BotSetting (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
          ['status_message_id', message.id, message.id]
        );
        
        console.log(`✅ Status message info saved to database`);
      } catch (dbError) {
        console.error('Error saving status message info:', dbError);
      }
      
      console.log(`✅ Status message started with auto-update in channel ${channelId}`);
      
    } catch (error) {
      console.error('Error executing status command:', error);

      await interaction.editReply({
        content: '❌ Произошла ошибка при получении статуса сервисов.',
        ephemeral: true
      });
    }
  },
  
  // Обработчик для кнопки обновления
  async handleButton(interaction) {
    if (interaction.customId === 'refresh_status') {
      await interaction.deferUpdate();
      
      try {
        const embed = await createStatusEmbed();
        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error refreshing status:', error);
      }
    }
  },
  
  // Экспортируем функцию для глобального автообновления
  startGlobalAutoUpdate
};
