import { Events, EmbedBuilder } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default function (client) {
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'ban-appeal') {
      await handleBanAppeal(interaction);
    }
  });
}

async function handleBanAppeal(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const db = await getDbConnection();
    const discordId = interaction.user.id;
    const reason = interaction.fields.getTextInputValue('appeal-reason');
    const contact = interaction.fields.getTextInputValue('appeal-contact') || 'Не указано';

    const [users] = await db.query(
      'SELECT id, username, banned FROM users WHERE discordId = ?',
      [discordId]
    );

    if (users.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Аккаунт не привязан')
        .setDescription('Ваш Discord аккаунт не привязан к Avelon.')
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const user = users[0];

    if (!user.banned) {
      const embed = new EmbedBuilder()
        .setColor('#ffa500')
        .setTitle('⚠️ Аккаунт не забанен')
        .setDescription('Вы не можете подать апелляцию, так как ваш аккаунт не забанен.')
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Проверяем, есть ли уже активная апелляция
    const [existingAppeals] = await db.query(
      `SELECT id FROM ban_appeals 
       WHERE userId = ? AND status = 'pending' 
       ORDER BY createdAt DESC 
       LIMIT 1`,
      [user.id]
    );

    if (existingAppeals.length > 0) {
      const embed = new EmbedBuilder()
        .setColor('#ffa500')
        .setTitle('⚠️ Апелляция уже подана')
        .setDescription('У вас уже есть активная апелляция. Дождитесь её рассмотрения.')
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Создаем апелляцию
    await db.query(
      `INSERT INTO ban_appeals (userId, reason, contact, status, createdAt) 
       VALUES (?, ?, ?, 'pending', NOW())`,
      [user.id, reason, contact]
    );

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Апелляция подана')
      .setDescription(
        'Ваша апелляция успешно отправлена на рассмотрение администрации.\n\n' +
        'Среднее время рассмотрения: 1-3 дня.\n' +
        'Вы получите уведомление о решении.'
      )
      .addFields(
        { name: 'Контакт', value: contact, inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Avelon Billing System' });

    await interaction.editReply({ embeds: [embed] });

    // Отправляем уведомление админам
    const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',') || [];
    for (const adminId of adminIds) {
      try {
        const admin = await client.users.fetch(adminId);
        const adminEmbed = new EmbedBuilder()
          .setColor('#ffa500')
          .setTitle('🆕 Новая апелляция на бан')
          .addFields(
            { name: 'Пользователь', value: user.username, inline: true },
            { name: 'Discord', value: `${interaction.user.tag}`, inline: true },
            { name: 'Причина апелляции', value: reason, inline: false },
            { name: 'Контакт', value: contact, inline: false }
          )
          .setTimestamp();

        await admin.send({ embeds: [adminEmbed] });
      } catch (error) {
        console.error(`Failed to send appeal notification to admin ${adminId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error submitting ban appeal:', error);
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Ошибка')
      .setDescription('Произошла ошибка при подаче апелляции.')
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  }
}
