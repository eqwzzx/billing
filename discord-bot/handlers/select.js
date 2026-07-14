import { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export async function handleSelectMenu(interaction, client) {
  const [type, action, userId] = interaction.customId.split('_');

  if (type === 'admin' && action === 'action') {
    const selectedAction = interaction.values[0];

    const user = await client.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Ошибка')
        .setDescription('Пользователь не найден.')
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (selectedAction === 'balance') {
      // Показываем модальное окно для изменения баланса
      const modal = new ModalBuilder()
        .setCustomId(`balance_modal_${userId}`)
        .setTitle(`Изменить баланс: ${user.email}`);

      const amountInput = new TextInputBuilder()
        .setCustomId('amount')
        .setLabel('Сумма (+ пополнение, - списание)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Например: 100 или -50')
        .setRequired(true);

      const reasonInput = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Причина изменения баланса')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Укажите причину...')
        .setRequired(true);

      const firstRow = new ActionRowBuilder().addComponents(amountInput);
      const secondRow = new ActionRowBuilder().addComponents(reasonInput);

      modal.addComponents(firstRow, secondRow);

      await interaction.showModal(modal);
    } else if (selectedAction === 'block') {
      await interaction.deferReply({ ephemeral: true });

      // Блокируем пользователя (через AdminSettings)
      await client.prisma.adminSettings.upsert({
        where: { key: `user_blocked_${userId}` },
        update: { value: 'true' },
        create: { key: `user_blocked_${userId}`, value: 'true' }
      });

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🔒 Пользователь заблокирован')
        .setDescription(`Пользователь **${user.email}** заблокирован`)
        .addFields(
          { name: '📧 Email', value: user.email, inline: true },
          { name: '🆔 ID', value: user.id, inline: true },
          { name: '💰 Баланс', value: `${user.balance.toFixed(2)} ₽`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Администратор: ${interaction.user.tag}` });

      await interaction.editReply({ embeds: [embed] });

      // Уведомляем пользователя
      if (user.discordId) {
        try {
          const discordUser = await client.users.fetch(user.discordId);
          const notificationEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🔒 Аккаунт заблокирован')
            .setDescription('Ваш аккаунт был заблокирован администратором.')
            .addFields({ name: '📞 Поддержка', value: 'Обратитесь в поддержку для разблокировки' })
            .setTimestamp();

          await discordUser.send({ embeds: [notificationEmbed] });
        } catch (error) {
          console.error('Не удалось отправить уведомление:', error);
        }
      }
    } else if (selectedAction === 'unblock') {
      await interaction.deferReply({ ephemeral: true });

      // Разблокируем пользователя
      try {
        await client.prisma.adminSettings.delete({
          where: { key: `user_blocked_${userId}` }
        });
      } catch (error) {
        // Пользователь не был заблокирован
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔓 Пользователь разблокирован')
        .setDescription(`Пользователь **${user.email}** разблокирован`)
        .addFields(
          { name: '📧 Email', value: user.email, inline: true },
          { name: '🆔 ID', value: user.id, inline: true },
          { name: '💰 Баланс', value: `${user.balance.toFixed(2)} ₽`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Администратор: ${interaction.user.tag}` });

      await interaction.editReply({ embeds: [embed] });

      // Уведомляем пользователя
      if (user.discordId) {
        try {
          const discordUser = await client.users.fetch(user.discordId);
          const notificationEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🔓 Аккаунт разблокирован')
            .setDescription('Ваш аккаунт был разблокирован администратором.')
            .setTimestamp();

          await discordUser.send({ embeds: [notificationEmbed] });
        } catch (error) {
          console.error('Не удалось отправить уведомление:', error);
        }
      }
    } else if (selectedAction === 'make_admin') {
      await interaction.deferReply({ ephemeral: true });

      await client.prisma.user.update({
        where: { id: userId },
        data: { role: 'ADMIN' }
      });

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('👑 Права администратора выданы')
        .setDescription(`Пользователь **${user.email}** теперь администратор`)
        .setTimestamp()
        .setFooter({ text: `Администратор: ${interaction.user.tag}` });

      await interaction.editReply({ embeds: [embed] });
    } else if (selectedAction === 'remove_admin') {
      await interaction.deferReply({ ephemeral: true });

      await client.prisma.user.update({
        where: { id: userId },
        data: { role: 'USER' }
      });

      const embed = new EmbedBuilder()
        .setColor('#808080')
        .setTitle('👤 Права администратора сняты')
        .setDescription(`Пользователь **${user.email}** теперь обычный пользователь`)
        .setTimestamp()
        .setFooter({ text: `Администратор: ${interaction.user.tag}` });

      await interaction.editReply({ embeds: [embed] });
    } else if (selectedAction === 'refresh') {
      await interaction.deferReply({ ephemeral: true });

      // Обновляем информацию о пользователе
      const updatedUser = await client.prisma.user.findUnique({
        where: { id: userId },
        include: {
          servers: true,
          vdsServers: true,
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('🔄 Информация обновлена')
        .addFields(
          { name: '📧 Email', value: updatedUser.email, inline: true },
          { name: '👤 Имя', value: updatedUser.name || 'Не указано', inline: true },
          { name: '🆔 ID', value: updatedUser.id, inline: true },
          { name: '💰 Баланс', value: `${updatedUser.balance.toFixed(2)} ₽`, inline: true },
          { name: '👑 Роль', value: updatedUser.role === 'ADMIN' ? 'Администратор' : 'Пользователь', inline: true },
          { name: '✅ Email подтверждён', value: updatedUser.emailVerified ? 'Да' : 'Нет', inline: true },
          { name: '🎮 Игровые серверы', value: `${updatedUser.servers.length}`, inline: true },
          { name: '💻 VDS серверы', value: `${updatedUser.vdsServers.length}`, inline: true },
          { name: '🔗 Discord', value: updatedUser.discordId ? `<@${updatedUser.discordId}>` : 'Не привязан', inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  }
}
