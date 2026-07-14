import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('servers')
    .setDescription('Показать список ваших серверов'),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const db = await getDbConnection();
      const discordId = interaction.user.id;

      // Получаем пользователя
      const [users] = await db.query(
        'SELECT id, username FROM users WHERE discordId = ?',
        [discordId]
      );

      if (users.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Аккаунт не привязан')
          .setDescription(
            'Ваш Discord аккаунт не привязан к Avelon.\n' +
            'Используйте команду `/link` для привязки аккаунта.'
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const userId = users[0].id;

      // Получаем серверы пользователя
      const [servers] = await db.query(
        `SELECT id, name, status, createdAt FROM servers 
         WHERE userId = ? 
         ORDER BY createdAt DESC`,
        [userId]
      );

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🖥️ Ваши серверы')
        .setTimestamp()
        .setFooter({ text: 'Avelon Billing System' });

      if (servers.length === 0) {
        embed.setDescription('У вас пока нет серверов.');
      } else {
        embed.setDescription(`Найдено серверов: ${servers.length}`);
        
        servers.slice(0, 10).forEach(server => {
          const statusEmoji = server.status === 'active' ? '✅' : 
                             server.status === 'suspended' ? '⏸️' : '❌';
          embed.addFields({
            name: `${statusEmoji} ${server.name}`,
            value: `ID: ${server.id}\nСтатус: ${server.status}\nСоздан: ${new Date(server.createdAt).toLocaleDateString('ru-RU')}`,
            inline: true
          });
        });

        if (servers.length > 10) {
          embed.addFields({
            name: '\u200B',
            value: `... и еще ${servers.length - 10} серверов`,
            inline: false
          });
        }
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching servers:', error);

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription('Произошла ошибка при получении списка серверов.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
