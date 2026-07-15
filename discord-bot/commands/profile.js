import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Просмотр профиля пользователя (только админ)')
    .addStringOption(option =>
      option.setName('user')
        .setDescription('Email или Discord ID пользователя')
        .setRequired(true)),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Проверка, что пользователь админ в боте
      const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()) || [];
      if (!adminIds.includes(interaction.user.id)) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Доступ запрещён')
          .setDescription('Только администраторы могут использовать эту команду.')
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const connection = await getDbConnection();
      const userIdentifier = interaction.options.getString('user');

      // Поиск пользователя
      let user;
      
      if (userIdentifier.includes('@')) {
        const [rows] = await connection.execute(
          'SELECT * FROM User WHERE email = ?',
          [userIdentifier]
        );
        user = rows[0];
      } else {
        const [rows] = await connection.execute(
          'SELECT * FROM User WHERE discordId = ?',
          [userIdentifier]
        );
        user = rows[0];
      }

      if (!user) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Пользователь не найден')
          .setDescription(`Пользователь с идентификатором \`${userIdentifier}\` не найден в системе.`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Получаем статистику транзакций
      const [transactionsStats] = await connection.execute(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
          SUM(CASE WHEN status = 'COMPLETED' AND type = 'DEPOSIT' THEN amount ELSE 0 END) as totalDeposited,
          SUM(CASE WHEN status = 'COMPLETED' AND type = 'PAYMENT' THEN amount ELSE 0 END) as totalSpent
        FROM Transaction 
        WHERE userId = ?`,
        [user.id]
      );

      // Получаем последние транзакции
      const [transactions] = await connection.execute(
        'SELECT amount, type, description, status, createdAt FROM Transaction WHERE userId = ? ORDER BY createdAt DESC LIMIT 5',
        [user.id]
      );

      // Получаем количество серверов
      const [serversCount] = await connection.execute(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended,
          SUM(CASE WHEN status IN ('INSTALLING', 'STARTING') THEN 1 ELSE 0 END) as installing
        FROM Server 
        WHERE userId = ?`,
        [user.id]
      );

      // Получаем список серверов
      const [servers] = await connection.execute(
        'SELECT name, status, expiresAt FROM Server WHERE userId = ? ORDER BY createdAt DESC LIMIT 5',
        [user.id]
      );

      const stats = transactionsStats[0];
      const serverStats = serversCount[0];

      // Формируем информацию о роли
      const roleEmoji = {
        'USER': '👤',
        'ADMIN': '👑',
        'MODERATOR': '🛡️'
      };

      // Определяем цвет в зависимости от статуса
      let embedColor = '#0099ff'; // Синий по умолчанию
      if (user.banned) {
        embedColor = '#ff0000'; // Красный для забаненных
      } else if (user.role === 'ADMIN') {
        embedColor = '#ffd700'; // Золотой для админов
      } else if (!user.emailVerified) {
        embedColor = '#ffaa00'; // Оранжевый для не верифицированных
      }

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('👤 Профиль пользователя')
        .addFields(
          { name: '📧 Email', value: user.email, inline: true },
          { name: '📝 Имя', value: user.name || 'Не указано', inline: true },
          { name: '🎭 Роль', value: `${roleEmoji[user.role] || '👤'} ${user.role || 'USER'}`, inline: true },
          { name: '💰 Баланс', value: `**${parseFloat(user.balance || 0).toFixed(2)} ₽**`, inline: true },
          { name: '✅ Email верифицирован', value: user.emailVerified ? 'Да' : 'Нет', inline: true },
          { name: '🔗 Discord', value: user.discordId ? `Да (<@${user.discordId}>)` : 'Не привязан', inline: true },
          { name: '🔒 Статус бана', value: user.banned ? `❌ Забанен (${user.banType || 'Unknown'})` : '✅ Активен', inline: false }
        );

      // Статистика серверов
      embed.addFields({
        name: '🎮 Статистика серверов',
        value: `📊 Всего: **${serverStats.total || 0}** | ✅ Активных: **${serverStats.active || 0}** | ⏸️ Приостановлено: **${serverStats.suspended || 0}** | 🔄 Установка: **${serverStats.installing || 0}**`,
        inline: false
      });

      // Статистика транзакций
      embed.addFields({
        name: '💳 Статистика транзакций',
        value: `📊 Всего: **${stats.total || 0}** | ✅ Завершено: **${stats.completed || 0}**\n💰 Пополнено: **${parseFloat(stats.totalDeposited || 0).toFixed(2)} ₽** | 📉 Потрачено: **${Math.abs(parseFloat(stats.totalSpent || 0)).toFixed(2)} ₽**`,
        inline: false
      });

      // Добавляем информацию о Pterodactyl
      if (user.pterodactylId) {
        embed.addFields({ 
          name: '🆔 Pterodactyl ID', 
          value: `${user.pterodactylId}`, 
          inline: true 
        });
      }

      // Дата регистрации
      if (user.createdAt) {
        embed.addFields({ 
          name: '📅 Регистрация', 
          value: `<t:${Math.floor(new Date(user.createdAt).getTime() / 1000)}:F> (<t:${Math.floor(new Date(user.createdAt).getTime() / 1000)}:R>)`, 
          inline: false 
        });
      }

      // Добавляем информацию о Discord аватаре
      if (user.discordAvatar && user.discordId) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`;
        embed.setThumbnail(avatarUrl);
      }

      // Добавляем детальную информацию о бане
      if (user.banned) {
        let banInfo = `**Тип:** ${user.banType || 'Unknown'}\n`;
        banInfo += `**Причина:** ${user.banReason || 'Не указана'}\n`;
        
        if (user.bannedAt) {
          banInfo += `**Дата:** <t:${Math.floor(new Date(user.bannedAt).getTime() / 1000)}:F>`;
        }
        
        if (user.banExpiresAt) {
          banInfo += `\n**Истекает:** <t:${Math.floor(new Date(user.banExpiresAt).getTime() / 1000)}:R>`;
        }
        
        embed.addFields({
          name: '⚠️ Информация о бане',
          value: banInfo,
          inline: false
        });
      }

      // Добавляем последние серверы
      if (servers && servers.length > 0) {
        const serversText = servers.map(s => {
          const statusEmoji = {
            'ACTIVE': '✅',
            'SUSPENDED': '⏸️',
            'DELETED': '🗑️',
            'INSTALLING': '🔄',
            'STARTING': '🔄'
          };
          
          let text = `${statusEmoji[s.status] || '❓'} **${s.name}** - ${s.status}`;
          if (s.expiresAt) {
            text += ` | Истекает: <t:${Math.floor(new Date(s.expiresAt).getTime() / 1000)}:R>`;
          }
          return text;
        }).join('\n');

        embed.addFields({
          name: '🎮 Последние серверы',
          value: serversText,
          inline: false
        });
      }

      // Добавляем последние транзакции
      if (transactions && transactions.length > 0) {
        const transactionsText = transactions.map(t => {
          const statusEmoji = {
            'COMPLETED': '✅',
            'PENDING': '⏳',
            'FAILED': '❌',
            'CANCELLED': '🚫'
          };
          
          const amount = parseFloat(t.amount);
          const sign = amount >= 0 ? '+' : '';
          
          return `${statusEmoji[t.status] || '❓'} \`${sign}${amount.toFixed(2)} ₽\` - ${t.description || t.method} (<t:${Math.floor(new Date(t.createdAt).getTime() / 1000)}:R>)`;
        }).join('\n');

        embed.addFields({
          name: '💳 Последние транзакции',
          value: transactionsText,
          inline: false
        });
      }

      embed.setTimestamp();
      embed.setFooter({ text: `User ID: ${user.id} • Запросил: ${interaction.user.tag}` });

      // Добавляем кнопки быстрых действий
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`addbalance_${user.id}`)
            .setLabel('💰 Пополнить баланс')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true), // Disabled, так как это требует модального окна
          new ButtonBuilder()
            .setLabel('👤 Открыть в админке')
            .setStyle(ButtonStyle.Link)
            .setURL(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin`)
        );

      await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
      console.error('Error viewing profile:', error);

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription(`Произошла ошибка при получении профиля.\n\`\`\`${error.message}\`\`\``)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
