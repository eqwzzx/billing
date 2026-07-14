import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Привязать Discord аккаунт к Avelon'),
  
  async execute(interaction) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const linkUrl = `${appUrl}/dashboard/profile`;

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🔗 Привязка Discord аккаунта')
      .setDescription(
        'Чтобы привязать ваш Discord аккаунт к Avelon:\n\n' +
        '1. Нажмите на кнопку ниже\n' +
        '2. Авторизуйтесь на сайте\n' +
        '3. Перейдите в раздел "Профиль"\n' +
        '4. Нажмите кнопку "Привязать Discord"\n\n' +
        'После привязки вы получите доступ к управлению серверами через Discord!'
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: 'Avelon Billing System' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Открыть профиль')
          .setStyle(ButtonStyle.Link)
          .setURL(linkUrl)
          .setEmoji('🌐')
      );

    await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      ephemeral: true 
    });
  },
};
