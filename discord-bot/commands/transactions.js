import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('transactions')
    .setDescription('История транзакций'),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const db = await getDbConnection();
      const discordId = interaction.user.id;

      const [users] = await db.query(
        'SELECT id FROM users WHERE discordId = ?',
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

      const [transactions] = await db.query(
        `SELECT type, amount, description, createdAt FROM transactions 
         WHERE userId = ? 
         ORDER BY createdAt DESC LIMIT 10`,
        [userId]
      );

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('💳 История транзакций')
        .setTimestamp()
        .setFooter({ text: 'Avelon Billing System' });

      if (transactions.length === 0) {
        embed.setDescription('У вас пока нет транзакций.');
      } else {
        transactions.forEach(tx => {
          const emoji = tx.type === 'credit' ? '➕' : '➖';
          embed.addFields({
            name: `${emoji} ${tx.amount.toFixed(2)} ₽`,
            value: `${tx.description}\n${new Date(tx.createdAt).toLocaleString('ru-RU')}`,
            inline: false
          });
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription('Произошла ошибка при получении транзакций.')
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
