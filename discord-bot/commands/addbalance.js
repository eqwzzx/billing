import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('addbalance')
    .setDescription('Добавить баланс пользователю (только админ)')
    .addStringOption(option =>
      option.setName('user')
        .setDescription('Email или Discord ID пользователя')
        .setRequired(true))
    .addNumberOption(option =>
      option.setName('amount')
        .setDescription('Сумма для добавления')
        .setRequired(true)
        .setMinValue(0.01))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Причина начисления')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Проверка, что пользователь админ в боте
      const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',') || [];
      if (!adminIds.includes(interaction.user.id)) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Доступ запрещён')
          .setDescription('Только администраторы могут использовать эту команду.')
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const connection = await getDbConnection();
      const userIdentifier = interaction.options.getString('user');
      const amount = interaction.options.getNumber('amount');
      const reason = interaction.options.getString('reason') || 'Начисление администратором';

      // Поиск пользователя по email или Discord ID
      let user;
      
      if (userIdentifier.includes('@')) {
        // Поиск по email
        const [rows] = await connection.execute(
          'SELECT id, name, email, balance, discordId FROM User WHERE email = ?',
          [userIdentifier]
        );
        user = rows[0];
      } else {
        // Поиск по Discord ID
        const [rows] = await connection.execute(
          'SELECT id, name, email, balance, discordId FROM User WHERE discordId = ?',
          [userIdentifier]
        );
        user = rows[0];
      }

      if (!user) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Пользователь не найден')
          .setDescription(`Пользователь с идентификатором \`${userIdentifier}\` не найден.`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const oldBalance = parseFloat(user.balance) || 0;
      const newBalance = oldBalance + amount;

      // Обновляем баланс
      await connection.execute(
        'UPDATE User SET balance = ? WHERE id = ?',
        [newBalance, user.id]
      );

      // Создаём запись о транзакции
      await connection.execute(
        'INSERT INTO Payment (userId, amount, method, status, description, paymentId) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, amount, 'MANUAL', 'COMPLETED', `Начисление администратором: ${reason}`, `ADMIN_${Date.now()}`]
      );

      // Логируем действие
      await connection.execute(
        'INSERT INTO AdminLog (userId, action, description, ipAddress) VALUES (?, ?, ?, ?)',
        [user.id, 'BALANCE_ADD', `Добавлено ${amount.toFixed(2)} ₽. Причина: ${reason}`, 'Discord Bot']
      );

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Баланс добавлен')
        .addFields(
          { name: 'Пользователь', value: user.name || user.email, inline: true },
          { name: 'Email', value: user.email, inline: true },
          { name: 'Старый баланс', value: `${oldBalance.toFixed(2)} ₽`, inline: true },
          { name: 'Добавлено', value: `+${amount.toFixed(2)} ₽`, inline: true },
          { name: 'Новый баланс', value: `${newBalance.toFixed(2)} ₽`, inline: true },
          { name: 'Причина', value: reason, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `Выполнил: ${interaction.user.tag}` });

      await interaction.editReply({ embeds: [embed] });

      // Отправляем уведомление пользователю (если у него привязан Discord)
      if (user.discordId) {
        try {
          const targetUser = await interaction.client.users.fetch(user.discordId);
          const userEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('💰 Баланс пополнен')
            .setDescription(`Ваш баланс пополнен администратором на **${amount.toFixed(2)} ₽**`)
            .addFields(
              { name: 'Новый баланс', value: `${newBalance.toFixed(2)} ₽`, inline: true },
              { name: 'Причина', value: reason, inline: false }
            )
            .setTimestamp();

          await targetUser.send({ embeds: [userEmbed] });
        } catch (error) {
          console.log('Не удалось отправить уведомление пользователю:', error.message);
        }
      }

    } catch (error) {
      console.error('Error adding balance:', error);

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription('Произошла ошибка при добавлении баланса.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
