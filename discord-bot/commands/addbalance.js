import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
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
      const reason = interaction.options.getString('reason') || 'Начисление администратором через Discord';

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
      const newBalance = oldBalance + amount;

      // Обновляем баланс
      await connection.execute(
        'UPDATE User SET balance = balance + ?, updatedAt = NOW() WHERE id = ?',
        [amount, user.id]
      );

      // Создаём запись о транзакции с информацией об администраторе
      const adminUsername = `${interaction.user.username}#${interaction.user.discriminator}`;
      const description = `${reason} | Администратор: ${adminUsername}`;
      const externalId = `DISCORD_${interaction.user.id}_${Date.now()}`;
      
      await connection.execute(
        'INSERT INTO Transaction (id, userId, amount, type, status, description, externalId, method, createdAt) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, NOW())',
        [user.id, amount, 'DEPOSIT', 'COMPLETED', description, externalId, 'MANUAL']
      );

      // Логируем действие в AdminLog с adminId
      await connection.execute(
        'INSERT INTO AdminLog (id, userId, adminId, action, description, ipAddress, createdAt) VALUES (UUID(), ?, ?, ?, ?, ?, NOW())',
        [
          user.id,
          adminUserId,
          'BALANCE_ADD',
          `Добавлено ${amount.toFixed(2)} ₽ через Discord Bot. Причина: ${reason}. Администратор: ${adminUsername}`,
          'Discord Bot'
        ]
      );

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Баланс успешно пополнен')
        .setDescription(`Баланс пользователя успешно обновлён`)
        .addFields(
          { name: '👤 Пользователь', value: user.name || user.email, inline: true },
          { name: '📧 Email', value: user.email, inline: true },
          { name: '💰 Старый баланс', value: `${oldBalance.toFixed(2)} ₽`, inline: true },
          { name: '💵 Добавлено', value: `**+${amount.toFixed(2)} ₽**`, inline: true },
          { name: '💎 Новый баланс', value: `**${newBalance.toFixed(2)} ₽**`, inline: true },
          { name: '📝 Причина', value: reason, inline: false },
          { name: '👮 Администратор', value: adminUsername, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `ID транзакции: ${externalId}` });

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
            .setColor('#00ff00')
            .setTitle('💰 Баланс пополнен')
            .setDescription(`Ваш баланс пополнен администратором!`)
            .addFields(
              { name: '💵 Добавлено', value: `**+${amount.toFixed(2)} ₽**`, inline: true },
              { name: '💎 Новый баланс', value: `**${newBalance.toFixed(2)} ₽**`, inline: true },
              { name: '📝 Причина', value: reason, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Fluxor Billing System' });

          await targetUser.send({ embeds: [userEmbed] });
          console.log(`✅ Отправлено уведомление пользователю ${user.email}`);
        } catch (error) {
          console.log('⚠️ Не удалось отправить уведомление пользователю:', error.message);
        }
      }

    } catch (error) {
      console.error('Error adding balance:', error);

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription(`Произошла ошибка при добавлении баланса.\n\`\`\`${error.message}\`\`\``)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
