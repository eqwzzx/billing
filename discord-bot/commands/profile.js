import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getDbConnection } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Просмотр профиля пользователя (только админ)')
    .addStringOption(option =>
      option.setName('user')
        .setDescription('Email или Discord ID пользователя')
        .setRequired(true)),
  
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

      // Поиск пользователя
      let user;
      
      if (userIdentifier.includes('@')) {
        const [rows] = await connection.execute(
          'SELECT * FROM User WHERE email = ?',
          [userIdentifier]
        );
        user = rows[0];
      } else {
        const [rows] = await connection.execute(
          'SELECT * FROM User WHERE discordId = ?',
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

      // Получаем последние транзакции
      const [transactions] = await connection.execute(
        'SELECT amount, method, description, createdAt FROM Payment WHERE userId = ? AND status = "COMPLETED" ORDER BY createdAt DESC LIMIT 5',
        [user.id]
      );

      // Получаем количество серверов
      const [serversCount] = await connection.execute(
        'SELECT COUNT(*) as total, SUM(CASE WHEN status IN ("ACTIVE", "INSTALLING", "STARTING") THEN 1 ELSE 0 END) as active FROM Server WHERE userId = ?',
        [user.id]
      );

      // Получаем количество транзакций
      const [transactionsCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM Payment WHERE userId = ?',
        [user.id]
      );

      // Формируем информацию о роли
      const roleEmoji = {
        'USER': '👤',
        'ADMIN': '👑',
        'MODERATOR': '🛡️'
      };

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('👤 Профиль пользователя')
        .addFields(
          { name: '📧 Email', value: user.email, inline: true },
          { name: '📝 Имя', value: user.name || 'Не указано', inline: true },
          { name: '🎭 Роль', value: `${roleEmoji[user.role] || '👤'} ${user.role || 'USER'}`, inline: true },
          { name: '💰 Баланс', value: `${parseFloat(user.balance || 0).toFixed(2)} ₽`, inline: true },
          { name: '🎮 Активные серверы', value: `${serversCount[0]?.active || 0}`, inline: true },
          { name: '📊 Всего серверов', value: `${serversCount[0]?.total || 0}`, inline: true },
          { name: '✅ Email верифицирован', value: user.emailVerified ? 'Да' : 'Нет', inline: true },
          { name: '🔗 Discord привязан', value: user.discordId ? `Да (<@${user.discordId}>)` : 'Нет', inline: true },
          { name: '🔒 Забанен', value: user.banned ? `Да (${user.banType || 'Unknown'})` : 'Нет', inline: true },
          { name: '💳 Транзакций', value: `${transactionsCount[0]?.count || 0}`, inline: true },
          { name: '🆔 Pterodactyl ID', value: user.pterodactylId ? `${user.pterodactylId}` : 'Не создан', inline: true },
          { name: '📅 Регистрация', value: user.createdAt ? `<t:${Math.floor(new Date(user.createdAt).getTime() / 1000)}:R>` : 'Неизвестно', inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `ID: ${user.id}` });

      // Добавляем информацию о Discord аватаре
      if (user.discordAvatar && user.discordId) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`;
        embed.setThumbnail(avatarUrl);
      }

      // Добавляем информацию о бане
      if (user.banned) {
        embed.addFields({
          name: '⚠️ Информация о бане',
          value: `**Тип:** ${user.banType || 'Unknown'}\n**Причина:** ${user.banReason || 'Не указана'}\n**Дата:** ${user.bannedAt ? `<t:${Math.floor(new Date(user.bannedAt).getTime() / 1000)}:F>` : 'Неизвестно'}`,
          inline: false
        });
      }

      // Добавляем последние транзакции
      if (transactions && transactions.length > 0) {
        const transactionsText = transactions.map(t => 
          `\`${parseFloat(t.amount) >= 0 ? '+' : ''}${parseFloat(t.amount).toFixed(2)} ₽\` - ${t.description || t.method} (<t:${Math.floor(new Date(t.createdAt).getTime() / 1000)}:R>)`
        ).join('\n');

        embed.addFields({
          name: '💳 Последние транзакции',
          value: transactionsText,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error viewing profile:', error);

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Ошибка')
        .setDescription('Произошла ошибка при получении профиля.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
