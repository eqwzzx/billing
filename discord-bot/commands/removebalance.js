import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('removebalance')
    .setDescription('Снять баланс с пользователя (только админ)')
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
        .setRequired(false)),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Проверка, что пользователь админ в боте
      const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()) || [];
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
      const reason = interaction.options.getString('reason') || 'Списание администратором через Discord';

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
          .setDescription(`Пользователь с идентификатором \`${userIdentifier}\` не найден в системе.`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Получаем информацию об администраторе из БД (если он привязан)
      const [adminRows] = await connection.execute(
        'SELECT id FROM User WHERE discordId = ?',
        [interaction.user.id]
      );
      const adminUser = adminRows[0];
      const adminUserId = adminUser ? adminUser.id : null;

      const oldBalance = parseFloat(user.balance) || 0;
      const newBalance = oldBalance - amount;

      // Проверка, что баланс не уйдет в минус (опционально)
      if (newBalance < 0) {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('⚠️ Предупреждение')
          .setDescription(`После списания баланс станет отрицательным: **${newBalance.toFixed(2)} ₽**\n\nТекущий баланс: ${oldBalance.toFixed(2)} ₽\nСписание: ${amount.toFixed(2)} ₽`)
          .addFields({
            name: 'Продолжить?',
            value: 'Операция будет выполнена. Если это нежелательно, отмените команду.',
            inline: false
          })
          .setTimestamp();

        // Можно добавить кнопки подтверждения, но для простоты продолжаем
      }

      // Обновляем баланс
      await connection.execute(
        'UPDATE User SET balance = ?, updatedAt = NOW() WHERE id = ?',
        [newBalance, user.id]
      );

      // Создаём запись о транзакции с информацией об администраторе
      const adminUsername = `${interaction.user.username}#${interaction.user.discriminator}`;
      const description = `${reason} | Администратор: ${adminUsername}`;
      const externalId = `DISCORD_REMOVE_${interaction.user.id}_${Date.now()}`;
      
      await connection.execute(
        'INSERT INTO Transaction (id, userId, amount, type, status, description, externalId, method, createdAt) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, NOW())',
        [user.id, amount, 'PAYMENT', 'COMPLETED', description, externalId, 'MANUAL']
      );

      // Логируем действие в AdminLog с adminId
      await connection.execute(
        'INSERT INTO AdminLog (id, userId, adminId, action, description, ipAddress, createdAt) VALUES (UUID(), ?, ?, ?, ?, ?, NOW())',
        [
          user.id,
          adminUserId,
          'BALANCE_SUBTRACT',  // Правильное значение из enum
          `Списано ${amount.toFixed(2)} ₽ через Discord Bot. Причина: ${reason}. Администратор: ${adminUsername}`,
          'Discord Bot'
        ]
      );

      const embed = new EmbedBuilder()
        .setColor(newBalance < 0 ? '#ff0000' : '#ffaa00')
        .setTitle('✅ Баланс успешно списан')
        .setDescription(`Баланс пользователя обновлён`)
        .addFields(
          { name: '👤 Пользователь', value: user.name || user.email, inline: true },
          { name: '📧 Email', value: user.email, inline: true },
          { name: '💰 Старый баланс', value: `${oldBalance.toFixed(2)} ₽`, inline: true },
          { name: '💸 Списано', value: `**-${amount.toFixed(2)} ₽**`, inline: true },
          { name: '💎 Новый баланс', value: `**${newBalance.toFixed(2)} ₽**`, inline: true },
          { name: '📝 Причина', value: reason, inline: false },
          { name: '👮 Администратор', value: adminUsername, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `ID транзакции: ${externalId}` });

      if (newBalance < 0) {
        embed.addFields({
          name: '⚠️ Внимание',
          value: 'Баланс пользователя стал отрицательным!',
          inline: false
        });
      }

      if (user.discordId) {
        embed.addFields({ 
          name: '🔗 Discord', 
          value: `<@${user.discordId}>`, 
          inline: true 
        });
      }

      await interaction.editReply({ embeds: [embed] });

      // Отправляем уведомление пользователю (если у него привязан Discord)
      if (user.discordId) {
        try {
          const targetUser = await interaction.client.users.fetch(user.discordId);
          const userEmbed = new EmbedBuilder()
            .setColor(newBalance < 0 ? '#ff0000' : '#ffaa00')
            .setTitle('💸 Списание с баланса')
            .setDescription(`С вашего баланса списаны средства администратором`)
            .addFields(
              { name: '💸 Списано', value: `**-${amount.toFixed(2)} ₽**`, inline: true },
              { name: '💎 Новый баланс', value: `**${newBalance.toFixed(2)} ₽**`, inline: true },
              { name: '📝 Причина', value: reason, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Fluxor Billing System' });

          if (newBalance < 0) {
            userEmbed.addFields({
              name: '⚠️ Внимание',
              value: 'Ваш баланс стал отрицательным. Пожалуйста, пополните баланс.',
              inline: false
            });
          }

          await targetUser.send({ embeds: [userEmbed] });
          console.log(`✅ Отправлено уведомление пользователю ${user.email}`);
        } catch (error) {
          console.log('⚠️ Не удалось отправить уведомление пользователю:', error.message);
        }
      }

    } catch (error) {
      console.error('Error removing balance:', error);

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription(`Произошла ошибка при списании баланса.\n\`\`\`${error.message}\`\`\``)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
