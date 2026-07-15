import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('transactions')
    .setDescription('История транзакций'),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const connection = await getDbConnection();
      const discordId = interaction.user.id;

      // Получаем пользователя (таблица User, не Users!)
      const [userRows] = await connection.execute(
        'SELECT id, name, email FROM User WHERE discordId = ?',
        [discordId]
      );

      if (userRows.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Аккаунт не привязан')
          .setDescription('Используйте команду `/link` для привязки аккаунта.')
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const user = userRows[0];

      // Получаем транзакции (таблица Transaction, не transactions!)
      const [transactions] = await connection.execute(
        `SELECT type, amount, description, status, method, createdAt 
         FROM Transaction 
         WHERE userId = ? 
         ORDER BY createdAt DESC 
         LIMIT 10`,
        [user.id]
      );

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('💳 История транзакций')
        .setDescription(`Последние 10 транзакций для ${user.name || user.email}`)
        .setTimestamp()
        .setFooter({ text: 'Fluxor Billing System' });

      if (transactions.length === 0) {
        embed.setDescription('У вас пока нет транзакций.');
      } else {
        transactions.forEach(tx => {
          // Определяем эмодзи по типу
          const typeEmoji = {
            'DEPOSIT': '💰➕',
            'PAYMENT': '💸➖',
            'REFUND': '↩️',
            'PROMO': '🎁',
            'VDS_PAYMENT': '🖥️➖',
            'VDS_RENEWAL': '🔄',
            'DEDICATED_PAYMENT': '🖥️➖',
            'DEDICATED_RENEWAL': '🔄',
            'DOMAIN_PAYMENT': '🌐➖',
            'DOMAIN_RENEWAL': '🔄',
            'STORAGEBOX_PAYMENT': '📦➖',
            'STORAGEBOX_RENEWAL': '🔄'
          };
          
          const emoji = typeEmoji[tx.type] || '💳';
          
          // Определяем статус
          const statusEmoji = {
            'PENDING': '⏳',
            'COMPLETED': '✅',
            'FAILED': '❌'
          };
          
          const status = statusEmoji[tx.status] || '❓';
          
          // Форматируем сумму
          const amount = parseFloat(tx.amount).toFixed(2);
          const sign = tx.type === 'DEPOSIT' || tx.type === 'REFUND' || tx.type === 'PROMO' ? '+' : '-';
          
          embed.addFields({
            name: `${emoji} ${sign}${amount} ₽ ${status}`,
            value: `${tx.description}\n📅 ${new Date(tx.createdAt).toLocaleString('ru-RU')}`,
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
