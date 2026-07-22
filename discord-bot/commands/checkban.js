import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('checkban')
    .setDescription('Проверить статус бана'),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const db = await getDbConnection();
      const discordId = interaction.user.id;

      const [users] = await db.query(
        'SELECT name, banned, banType, banReason, bannedAt, banExpiresAt FROM User WHERE discordId = ?',
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

      const user = users[0];

      if (!user.banned) {
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ Аккаунт не забанен')
          .setDescription('Ваш аккаунт активен и не имеет ограничений.')
          .setTimestamp()
          .setFooter({ text: 'Fluxor Billing System' });
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const bannedUntil = user.banExpiresAt
        ? new Date(user.banExpiresAt).toLocaleString('ru-RU')
        : 'Навсегда';

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🚫 Аккаунт забанен')
        .addFields(
          { name: 'Причина', value: user.banReason || 'Не указана', inline: false },
          { name: 'Дата бана', value: new Date(user.bannedAt).toLocaleString('ru-RU'), inline: true },
          { name: 'Истекает', value: bannedUntil, inline: true }
        )
        .setDescription('Для апелляции используйте команду `/appeal`')
        .setTimestamp()
        .setFooter({ text: 'Fluxor Billing System' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error checking ban:', error);
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription('Произошла ошибка при проверке статуса бана.')
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
