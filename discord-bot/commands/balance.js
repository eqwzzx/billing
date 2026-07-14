import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Проверить баланс аккаунта'),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const connection = await getDbConnection();
      const discordId = interaction.user.id;

      // Получаем пользователя через mysql2
      const [rows] = await connection.execute(
        'SELECT id, name, email, balance, emailVerified, createdAt FROM User WHERE discordId = ?',
        [discordId]
      );
      
      const user = rows[0];

      if (!user) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Аккаунт не привязан')
          .setDescription(
            'Ваш Discord аккаунт не привязан к биллинг системе.\n' +
            'Используйте команду `/link` для привязки аккаунта.'
          )
          .setTimestamp();

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setLabel('🔗 Привязать аккаунт')
              .setStyle(ButtonStyle.Link)
              .setURL(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile/discord`)
          );

        await interaction.editReply({ embeds: [embed], components: [row] });
        return;
      }

      // Получаем статистику транзакций
      const [transactionsStats] = await connection.execute(
        `SELECT 
          COUNT(*) as totalTransactions,
          SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) as totalDeposited,
          MAX(createdAt) as lastTransaction
        FROM Payment 
        WHERE userId = ? AND amount > 0`,
        [user.id]
      );

      // Получаем количество серверов
      const [serversCount] = await connection.execute(
        'SELECT COUNT(*) as total, SUM(CASE WHEN status IN ("ACTIVE", "INSTALLING", "STARTING") THEN 1 ELSE 0 END) as active FROM Server WHERE userId = ?',
        [user.id]
      );

      const stats = transactionsStats[0];
      const servers = serversCount[0];
      
      // Форматируем баланс
      const balance = parseFloat(user.balance || 0);
      const balanceColor = balance > 100 ? '#00ff00' : balance > 10 ? '#ffaa00' : '#ff0000';
      
      const embed = new EmbedBuilder()
        .setColor(balanceColor)
        .setTitle('💰 Баланс аккаунта')
        .setDescription(`Информация о вашем биллинг аккаунте`)
        .addFields(
          { name: '👤 Пользователь', value: user.name || 'Не указано', inline: true },
          { name: '📧 Email', value: user.email, inline: true },
          { name: '✅ Верификация', value: user.emailVerified ? '✅ Подтверждён' : '❌ Не подтверждён', inline: true },
          { name: '💵 Текущий баланс', value: `**${balance.toFixed(2)} ₽**`, inline: true },
          { name: '📊 Всего пополнено', value: `${parseFloat(stats.totalDeposited || 0).toFixed(2)} ₽`, inline: true },
          { name: '💳 Транзакций', value: `${stats.totalTransactions || 0}`, inline: true },
          { name: '🎮 Активные серверы', value: `${servers.active || 0}`, inline: true },
          { name: '📦 Всего серверов', value: `${servers.total || 0}`, inline: true },
          { name: '📅 Регистрация', value: `<t:${Math.floor(new Date(user.createdAt).getTime() / 1000)}:R>`, inline: true }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      // Добавляем информацию о последней транзакции
      if (stats.lastTransaction) {
        embed.addFields({
          name: '💰 Последнее пополнение',
          value: `<t:${Math.floor(new Date(stats.lastTransaction).getTime() / 1000)}:R>`,
          inline: true
        });
      }

      embed.setFooter({ text: `ID: ${user.id} • Fluxor Billing` });

      // Добавляем кнопки для быстрых действий
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('💰 Пополнить баланс')
            .setStyle(ButtonStyle.Link)
            .setURL(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client`),
          new ButtonBuilder()
            .setLabel('🎮 Мои серверы')
            .setStyle(ButtonStyle.Link)
            .setURL(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client`),
          new ButtonBuilder()
            .setLabel('📊 История транзакций')
            .setStyle(ButtonStyle.Link)
            .setURL(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client`)
        );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error('Error checking balance:', error);

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription('Произошла ошибка при получении баланса. Попробуйте позже.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
