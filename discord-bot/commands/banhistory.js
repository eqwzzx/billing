import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('banhistory')
    .setDescription('История банов'),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const db = await getDbConnection();
      const discordId = interaction.user.id;

      const [users] = await db.query(
        'SELECT id, name FROM User WHERE discordId = ?',
        [discordId]
      );

      if (users.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Аккаунт не привязан')
          .setDescription('Используйте команду `/link` для привязки аккаунта.')
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const userId = users[0].id;

      const [bans] = await db.query(
        `SELECT reason, startedAt, expiresAt, endedAt, isActive
         FROM BanHistory
         WHERE userId = ?
         ORDER BY startedAt DESC
         LIMIT 10`,
        [userId]
      );

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📜 История банов')
        .setTimestamp()
        .setFooter({ text: 'Fluxor Billing System' });

      if (bans.length === 0) {
        embed.setDescription('У вас нет истории банов.');
      } else {
        bans.forEach((ban, index) => {
          const status = ban.isActive ? '🚫 Активен' : '✅ Снят';
          const duration = ban.expiresAt
            ? new Date(ban.expiresAt).toLocaleDateString('ru-RU')
            : 'Навсегда';

          embed.addFields({
            name: `${status} - Бан #${index + 1}`,
            value:
              `**Причина:** ${ban.reason}\n` +
              `**Дата:** ${new Date(ban.startedAt).toLocaleString('ru-RU')}\n` +
              `**До:** ${duration}` +
              (ban.endedAt ? `\n**Снят:** ${new Date(ban.endedAt).toLocaleString('ru-RU')}` : ''),
            inline: false
          });
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching ban history:', error);
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription('Произошла ошибка при получении истории банов.')
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
