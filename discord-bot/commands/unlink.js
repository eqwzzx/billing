import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Отвязать Discord аккаунт от Avelon'),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const db = await getDbConnection();
      const discordId = interaction.user.id;

      // Проверяем, привязан ли аккаунт
      const [users] = await db.query(
        'SELECT id FROM users WHERE discordId = ?',
        [discordId]
      );

      if (users.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Ошибка')
          .setDescription('Ваш Discord аккаунт не привязан к Avelon.')
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Отвязываем аккаунт
      await db.query(
        'UPDATE users SET discordId = NULL WHERE discordId = ?',
        [discordId]
      );

      // Убираем роль верифицированного пользователя
      const roleId = process.env.DISCORD_VERIFIED_ROLE_ID;
      if (roleId && interaction.member.roles.cache.has(roleId)) {
        await interaction.member.roles.remove(roleId);
      }

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Успешно')
        .setDescription('Ваш Discord аккаунт успешно отвязан от Avelon.')
        .setTimestamp()
        .setFooter({ text: 'Avelon Billing System' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error unlinking Discord:', error);

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription('Произошла ошибка при отвязке аккаунта.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
