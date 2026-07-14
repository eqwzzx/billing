import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Показать список всех команд'),
  
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📚 Помощь по командам Avelon Bot')
      .setDescription('Вот список всех доступных команд:')
      .addFields(
        { name: '/link', value: 'Привязать Discord аккаунт к Avelon', inline: false },
        { name: '/unlink', value: 'Отвязать Discord аккаунт', inline: false },
        { name: '/balance', value: 'Проверить баланс аккаунта', inline: false },
        { name: '/servers', value: 'Показать список ваших серверов', inline: false },
        { name: '/transactions', value: 'История транзакций', inline: false },
        { name: '/promo', value: 'Активировать промокод', inline: false },
        { name: '/pay', value: 'Пополнить баланс', inline: false },
        { name: '/support', value: 'Создать тикет в поддержку', inline: false },
        { name: '/appeal', value: 'Подать апелляцию на бан', inline: false },
        { name: '/checkban', value: 'Проверить статус бана', inline: false },
        { name: '/banhistory', value: 'История банов', inline: false }
      )
      .addFields(
        { name: '\n👑 Админ команды', value: '\u200B', inline: false },
        { name: '/admin', value: 'Панель администратора', inline: false },
        { name: '/ban', value: 'Забанить пользователя', inline: false },
        { name: '/unban', value: 'Разбанить пользователя', inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Avelon Billing System' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
