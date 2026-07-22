import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Панель администратора')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',') || [];
    
    if (!adminIds.includes(interaction.user.id)) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Доступ запрещен')
        .setDescription('У вас нет прав для использования этой команды.')
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const adminUrl = `${appUrl}/admin`;

    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('👑 Админ панель')
      .setDescription(
        '**Доступные админ команды:**\n' +
        '• `/ban` - Забанить пользователя\n' +
        '• `/unban` - Разбанить пользователя\n' +
        '• `/checkban` - Проверить статус бана\n' +
        '• `/banhistory` - История банов\n\n' +
        `[Открыть веб-панель администратора](${adminUrl})`
      )
      .setTimestamp()
      .setFooter({ text: 'Fluxor Admin System' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
