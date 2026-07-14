import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Разбанить пользователя')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Пользователь для разбана')
        .setRequired(true)
    ),
  
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

    await interaction.deferReply({ ephemeral: true });

    try {
      const db = await getDbConnection();
      const targetUser = interaction.options.getUser('user');

      const [users] = await db.query(
        'SELECT id, username, banned FROM users WHERE discordId = ?',
        [targetUser.id]
      );

      if (users.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Пользователь не найден')
          .setDescription('Этот Discord аккаунт не привязан к Avelon.')
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const user = users[0];

      if (!user.banned) {
        const embed = new EmbedBuilder()
          .setColor('#ffa500')
          .setTitle('⚠️ Не забанен')
          .setDescription('Этот пользователь не забанен.')
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      await db.query(
        'UPDATE users SET banned = false, bannedReason = NULL, bannedAt = NULL, bannedUntil = NULL WHERE id = ?',
        [user.id]
      );

      await db.query(
        'UPDATE ban_history SET unbannedAt = NOW(), unbannedBy = ? WHERE userId = ? AND unbannedAt IS NULL',
        [interaction.user.id, user.id]
      );

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Пользователь разбанен')
        .addFields(
          { name: 'Пользователь', value: user.username, inline: true },
          { name: 'Discord', value: `${targetUser.tag}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Avelon Admin System' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error unbanning user:', error);
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription('Произошла ошибка при разбане пользователя.')
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
