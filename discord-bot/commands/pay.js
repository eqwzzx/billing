import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Пополнить баланс'),
  
  async execute(interaction) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentUrl = `${appUrl}/dashboard/billing`;

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('💳 Пополнение баланса')
      .setDescription(
        'Для пополнения баланса:\n\n' +
        '1. Нажмите на кнопку ниже\n' +
        '2. Выберите удобный способ оплаты\n' +
        '3. Укажите сумму пополнения\n' +
        '4. Следуйте инструкциям платежной системы'
      )
      .setTimestamp()
      .setFooter({ text: 'Fluxor Billing System' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Пополнить баланс')
          .setStyle(ButtonStyle.Link)
          .setURL(paymentUrl)
          .setEmoji('💰')
      );

    await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      ephemeral: true 
    });
  },
};
