import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('promo')
    .setDescription('Активировать промокод')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Промокод')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const db = await getDbConnection();
      const discordId = interaction.user.id;
      const promoCode = interaction.options.getString('code');

      const [users] = await db.query(
        'SELECT id, balance FROM users WHERE discordId = ?',
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

      // Проверяем промокод
      const [promos] = await db.query(
        `SELECT id, code, discount, type, usageLimit, usedCount 
         FROM promos 
         WHERE code = ? AND active = true`,
        [promoCode]
      );

      if (promos.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Промокод не найден')
          .setDescription('Промокод недействителен или уже истек.')
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const promo = promos[0];

      // Проверяем лимит использования
      if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Промокод исчерпан')
          .setDescription('Этот промокод уже использован максимальное количество раз.')
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Проверяем, использовал ли пользователь этот промокод
      const [usages] = await db.query(
        'SELECT id FROM promo_usages WHERE userId = ? AND promoId = ?',
        [userId, promo.id]
      );

      if (usages.length > 0) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Промокод уже использован')
          .setDescription('Вы уже использовали этот промокод.')
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Применяем промокод
      const amount = promo.type === 'fixed' ? promo.discount : 0;
      
      if (amount > 0) {
        await db.query(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [amount, userId]
        );

        await db.query(
          'INSERT INTO transactions (userId, type, amount, description) VALUES (?, ?, ?, ?)',
          [userId, 'credit', amount, `Промокод: ${promoCode}`]
        );
      }

      // Записываем использование
      await db.query(
        'INSERT INTO promo_usages (userId, promoId) VALUES (?, ?)',
        [userId, promo.id]
      );

      await db.query(
        'UPDATE promos SET usedCount = usedCount + 1 WHERE id = ?',
        [promo.id]
      );

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Промокод активирован')
        .setDescription(
          promo.type === 'fixed' 
            ? `На ваш баланс зачислено ${amount} ₽`
            : `Скидка ${promo.discount}% будет применена при следующей оплате`
        )
        .setTimestamp()
        .setFooter({ text: 'Avelon Billing System' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error activating promo:', error);
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription('Произошла ошибка при активации промокода.')
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }
  },
};
