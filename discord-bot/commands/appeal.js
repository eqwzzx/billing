import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('appeal')
    .setDescription('Подать апелляцию на бан'),
  
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('ban-appeal')
      .setTitle('Апелляция на бан');

    const reasonInput = new TextInputBuilder()
      .setCustomId('appeal-reason')
      .setLabel('Почему вы считаете бан несправедливым?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Опишите вашу ситуацию подробно...')
      .setRequired(true)
      .setMinLength(50)
      .setMaxLength(1000);

    const contactInput = new TextInputBuilder()
      .setCustomId('appeal-contact')
      .setLabel('Контактная информация (опционально)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Email или Telegram для связи')
      .setRequired(false);

    const firstRow = new ActionRowBuilder().addComponents(reasonInput);
    const secondRow = new ActionRowBuilder().addComponents(contactInput);

    modal.addComponents(firstRow, secondRow);

    await interaction.showModal(modal);
  },
};
