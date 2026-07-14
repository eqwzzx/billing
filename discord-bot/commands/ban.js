import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Забанить пользователя')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Пользователь для бана')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Причина бана')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Длительность бана в днях (0 = навсегда)')
        .setRequired(false)
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
      const reason = interaction.options.getString('reason');
      const duration = interaction.options.getInteger('duration') || 0;

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

      if (user.banned) {
        const embed = new EmbedBuilder()
          .setColor('#ffa500')
          .setTitle('⚠️ Уже забанен')
          .setDescription('Этот пользователь уже забанен.')
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const expiresAt = duration > 0 
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
        : null;

      await db.query(
        'UPDATE users SET banned = true, bannedReason = ?, bannedAt = NOW(), bannedUntil = ? WHERE id = ?',
        [reason, expiresAt, user.id]
      );

      await db.query(
        'INSERT INTO ban_history (userId, reason, bannedBy, bannedUntil) VALUES (?, ?, ?, ?)',
        [user.id, reason, interaction.user.id, expiresAt]
      );

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Пользователь забанен')
        .addFields(
          { name: 'Пользователь', value: user.username, inline: true },
          { name: 'Discord', value: `${targetUser.tag}`, inline: true },
          { name: 'Причина', value: reason, inline: false },
          { name: 'Длительность', value: duration > 0 ? `${duration} дней` : 'Навсегда', inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Avelon Admin System' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error banning user:', error);
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription('Произошла ошибка при бане пользователя.')
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
