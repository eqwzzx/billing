import { EmbedBuilder } from 'discord.js';
import { getDbConnection } from './database.js';

export async function getBotSettings(guildId) {
  return { guildId, notifyBalance: false, notifyServer: false, notifyUser: false, notifyAdmin: false };
}

export async function updateBotSettings(guildId, updates) {
  return await getBotSettings(guildId);
}

export async function sendBalanceNotification(client, transaction) {
  try {
    console.log('📊 Balance notification:', transaction);

    // Получаем ID канала для уведомлений о балансе
    const channelId = process.env.DISCORD_BALANCE_LOG_CHANNEL_ID || process.env.DISCORD_LOG_CHANNEL_ID;
    
    // Получаем ID роли покупателя
    const buyerRoleId = process.env.DISCORD_BUYER_ROLE_ID;
    
    // Если у пользователя есть Discord ID и это пополнение (не списание)
    if (transaction.user?.discordId && transaction.amount > 0 && buyerRoleId) {
      try {
        // Проходим по всем серверам бота
        for (const [guildId, guild] of client.guilds.cache) {
          try {
            // Ищем участника на сервере
            const member = await guild.members.fetch(transaction.user.discordId).catch(() => null);
            
            if (member) {
              // Проверяем есть ли уже роль
              if (!member.roles.cache.has(buyerRoleId)) {
                // Выдаём роль
                await member.roles.add(buyerRoleId);
                console.log(`✅ Роль покупателя выдана пользователю ${member.user.tag} на сервере ${guild.name}`);
              } else {
                console.log(`ℹ️  Пользователь ${member.user.tag} уже имеет роль покупателя на сервере ${guild.name}`);
              }
            }
          } catch (error) {
            console.error(`❌ Ошибка выдачи роли на сервере ${guild.name}:`, error.message);
          }
        }
      } catch (error) {
        console.error('❌ Ошибка при выдаче роли покупателя:', error);
      }
    }

    // Отправляем уведомление в канал
    if (channelId) {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel) {
        const isDeposit = transaction.amount > 0;
        const color = isDeposit ? '#00FF00' : '#FF0000';
        const emoji = isDeposit ? '💰' : '💸';
        
        const embed = new EmbedBuilder()
          .setColor(color)
          .setTitle(`${emoji} ${isDeposit ? 'Пополнение баланса' : 'Списание с баланса'}`)
          .addFields(
            { name: '👤 Пользователь', value: transaction.user?.name || 'Неизвестен', inline: true },
            { name: '📧 Email', value: transaction.user?.email || 'Неизвестен', inline: true },
            { name: '\u200b', value: '\u200b', inline: true },
            { name: '💵 Сумма', value: `${Math.abs(transaction.amount)} ₽`, inline: true },
            { name: '💳 Новый баланс', value: `${transaction.user?.balance || 0} ₽`, inline: true },
            { name: '\u200b', value: '\u200b', inline: true },
            { name: '📝 Описание', value: transaction.description || 'Нет описания', inline: false }
          )
          .setTimestamp()
          .setFooter({ text: `ID: ${transaction.userId || transaction.id}` });

        // Если это пополнение и есть Discord ID, добавляем упоминание
        if (isDeposit && transaction.user?.discordId) {
          embed.addFields({ 
            name: '🔗 Discord', 
            value: `<@${transaction.user.discordId}>`, 
            inline: false 
          });
        }

        await channel.send({ embeds: [embed] });
        console.log('✅ Уведомление о балансе отправлено');
      }
    }
  } catch (error) {
    console.error('❌ Ошибка отправки уведомления о балансе:', error);
  }
}

export async function sendServerNotification(client, server, action) {
  console.log('Server notification:', action);
}

export async function sendUserNotification(client, user, action) {
  console.log('User notification:', action);
}

export async function sendAdminNotification(client, adminLog) {
  try {
    const channelId = process.env.DISCORD_ADMIN_LOG_CHANNEL_ID || process.env.DISCORD_LOG_CHANNEL_ID;
    if (!channelId) return;
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Admin Action: ' + adminLog.action)
      .setDescription(adminLog.description)
      .setTimestamp();
    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}

export async function sendBanNotification(client, ban, user) {
  console.log('Ban notification:', ban);
}

export async function sendAppealNotification(client, appeal, user) {
  console.log('Appeal notification:', appeal);
}
