import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUser } from '../utils/api-client.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Проверить баланс аккаунта'),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const discordId = interaction.user.id;

      // Получаем пользователя через API
      const data = await getUser(discordId, 'discordId');
      
      if (!data || !data.user) {
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

      const user = data.user;
      const stats = data.stats;
      
      // Форматируем баланс
      const balance = user.balance;
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
          { name: '📊 Всего транзакций', value: `${stats.transactions.total}`, inline: true },
          { name: '💰 Сумма транзакций', value: `${stats.transactions.totalAmount.toFixed(2)} ₽`, inline: true },
          { name: '🎮 Всего серверов', value: `${stats.servers.total}`, inline: true },
          { name: '✅ Активных', value: `${stats.servers.byStatus.ACTIVE || 0}`, inline: true },
          { name: '📅 Регистрация', value: `<t:${Math.floor(new Date(user.createdAt).getTime() / 1000)}:R>`, inline: true }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

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
