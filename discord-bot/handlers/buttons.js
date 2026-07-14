import { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import bcrypt from 'bcryptjs';

export async function handleButtonInteraction(interaction, client) {
  const customId = interaction.customId;

  if (customId === 'link_start') {
    // Показываем модальное окно для ввода email и пароля
    const modal = new ModalBuilder()
      .setCustomId('link_modal')
      .setTitle('Привязка аккаунта');

    const emailInput = new TextInputBuilder()
      .setCustomId('email')
      .setLabel('Email от биллинга')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('your@email.com')
      .setRequired(true);

    const passwordInput = new TextInputBuilder()
      .setCustomId('password')
      .setLabel('Пароль от биллинга')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ваш пароль')
      .setRequired(true);

    const firstRow = new ActionRowBuilder().addComponents(emailInput);
    const secondRow = new ActionRowBuilder().addComponents(passwordInput);

    modal.addComponents(firstRow, secondRow);

    await interaction.showModal(modal);
  } else if (customId === 'link_cancel') {
    const embed = new EmbedBuilder()
      .setColor('#808080')
      .setTitle('❌ Отменено')
      .setDescription('Привязка аккаунта отменена.')
      .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });
  } else if (customId === 'unlink_confirm') {
    await interaction.deferUpdate();

    const user = await client.prisma.user.findFirst({
      where: { discordId: interaction.user.id }
    });

    if (!user) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Ошибка')
        .setDescription('Аккаунт не найден')
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], components: [] });
    }

    // Отвязываем Discord ID
    await client.prisma.user.update({
      where: { id: user.id },
      data: { discordId: null }
    });

    // Убираем роль если она была
    const roleId = process.env.DISCORD_VERIFIED_ROLE_ID;
    if (roleId && interaction.member.roles.cache.has(roleId)) {
      try {
        await interaction.member.roles.remove(roleId);
      } catch (error) {
        console.error('Не удалось убрать роль:', error);
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ Аккаунт отвязан')
      .setDescription('Ваш Discord успешно отвязан от аккаунта биллинга.')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], components: [] });
  } else if (customId === 'unlink_cancel') {
    const embed = new EmbedBuilder()
      .setColor('#808080')
      .setTitle('❌ Отменено')
      .setDescription('Отвязка аккаунта отменена.')
      .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });
  }
}
