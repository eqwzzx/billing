import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Создать тикет в поддержку'),
  
  async execute(interaction) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const supportUrl = `${appUrl}/support`;

    const embed = new EmbedBuilder()
      .setColor('#ffa500')
      .setTitle('🎫 Поддержка')
      .setDescription(
        'Нужна помощь? Мы всегда готовы помочь!\n\n' +
        '**Доступные каналы поддержки:**\n' +
        '• Создать тикет на сайте\n' +
        '• Написать в Discord сервер поддержки\n' +
        '• Написать администратору\n\n' +
        'Среднее время ответа: 1-2 часа'
      )
      .setTimestamp()
      .setFooter({ text: 'Avelon Billing System' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Открыть поддержку')
          .setStyle(ButtonStyle.Link)
          .setURL(supportUrl)
          .setEmoji('🎫')
      );

    await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      ephemeral: true 
    });
  },
};
