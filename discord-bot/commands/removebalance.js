import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('removebalance')
    .setDescription('Убавить баланс пользователю (только админ)')
    .addStringOption(option =>
      option.setName('user')
        .setDescription('Email или Discord ID пользователя')
        .setRequired(true))
    .addNumberOption(option =>
      option.setName('amount')
        .setDescription('Сумма для списания')
        .setRequired(true)
        .setMinValue(0.01))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Причина списания')
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
      const reason = interaction.options.getString('reason') || 'Списание администратором';

      // Поиск пользователя
      let user;
      
      if (userIdentifier.includes('@')) {
        const [rows] = await connection.execute(
          'SELECT id, name, email, balance, discordId FROM User WHERE email = ?',
          [userIdentifier]
        );
        user = rows[0];
      } else {
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
      const newBalance = Math.max(0, oldBalance - amount); // Не даём балансу уйти в минус
      const actualRemoved = oldBalance - newBalance;

      // Обновляем баланс
      await connection.execute(
        'UPDATE User SET balance = ? WHERE id = ?',
        [newBalance, user.id]
      );

      // Создаём запись о транзакции
      await connection.execute(
        'INSERT INTO Payment (userId, amount, method, status, description, paymentId) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, -actualRemoved, 'MANUAL', 'COMPLETED', `Списание администратором: ${reason}`, `ADMIN_${Date.now()}`]
      );

      // Логируем действие
      await connection.execute(
        'INSERT INTO AdminLog (userId, action, description, ipAddress) VALUES (?, ?, ?, ?)',
        [user.id, 'BALANCE_REMOVE', `Списано ${actualRemoved.toFixed(2)} ₽. Причина: ${reason}`, 'Discord Bot']
      );

      const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('✅ Баланс списан')
        .addFields(
          { name: 'Пользователь', value: user.name || user.email, inline: true },
          { name: 'Email', value: user.email, inline: true },
          { name: 'Старый баланс', value: `${oldBalance.toFixed(2)} ₽`, inline: true },
          { name: 'Списано', value: `-${actualRemoved.toFixed(2)} ₽`, inline: true },
          { name: 'Новый баланс', value: `${newBalance.toFixed(2)} ₽`, inline: true },
          { name: 'Причина', value: reason, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `Выполнил: ${interaction.user.tag}` });

      if (actualRemoved < amount) {
        embed.setDescription(`⚠️ Списано меньше запрошенной суммы, так как баланс не может быть отрицательным.`);
      }

      await interaction.editReply({ embeds: [embed] });

      // Отправляем уведомление пользователю
      if (user.discordId) {
        try {
          const targetUser = await interaction.client.users.fetch(user.discordId);
          const userEmbed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('💸 Баланс списан')
            .setDescription(`С вашего баланса списано **${actualRemoved.toFixed(2)} ₽**`)
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
      console.error('Error removing balance:', error);

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription('Произошла ошибка при списании баланса.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
