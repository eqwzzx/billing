import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Проверить баланс аккаунта'),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const connection = await getDbConnection();
      const discordId = interaction.user.id;

      // Получаем пользователя через mysql2
      const [rows] = await connection.execute(
        'SELECT id, name, email, balance, emailVerified FROM User WHERE discordId = ?',
        [discordId]
      );
      
      const user = rows[0];

      if (!user) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Аккаунт не привязан')
          .setDescription(
            'Ваш Discord аккаунт не привязан к Fluxor.\n' +
            'Используйте команду `/link` для привязки аккаунта.'
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('💰 Баланс аккаунта')
        .addFields(
          { name: 'Пользователь', value: user.name || 'Не указано', inline: true },
          { name: 'Email', value: user.email, inline: true },
          { name: 'Баланс', value: `${parseFloat(user.balance || 0).toFixed(2)} ₽`, inline: true },
          { name: 'Email верифицирован', value: user.emailVerified ? '✅ Да' : '❌ Нет', inline: true }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp()
        .setFooter({ text: 'Fluxor Billing System' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error checking balance:', error);

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription('Произошла ошибка при получении баланса.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
