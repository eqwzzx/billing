import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { getBotSettings, updateBotSettings } from '../utils/notifications.js';

export default {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Управление настройками Discord бота')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('Просмотр текущих настроек')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Настройка каналов для уведомлений')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Тип канала')
            .setRequired(true)
            .addChoices(
              { name: '📋 Общие логи', value: 'log' },
              { name: '💰 Пополнения баланса', value: 'balance' },
              { name: '🎮 Серверы', value: 'server' },
              { name: '👤 Пользователи', value: 'user' },
              { name: '👮 Админские действия', value: 'admin' },
              { name: '⚖️ Апелляции', value: 'appeal' }
            )
        )
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Канал для уведомлений')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Включить/выключить тип уведомлений')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Тип уведомлений')
            .setRequired(true)
            .addChoices(
              { name: '💰 Пополнения баланса', value: 'balance' },
              { name: '🎮 Серверы', value: 'server' },
              { name: '👤 Пользователи', value: 'user' },
              { name: '👮 Админские действия', value: 'admin' },
              { name: '🚫 Баны', value: 'ban' },
              { name: '⚖️ Апелляции', value: 'appeal' }
            )
        )
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Включить или выключить')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('minbalance')
        .setDescription('Установить минимальную сумму для уведомлений о пополнении')
        .addNumberOption(option =>
          option
            .setName('amount')
            .setDescription('Минимальная сумма в рублях')
            .setRequired(true)
            .setMinValue(0)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('mention')
        .setDescription('Настройка упоминаний роли')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('Роль для упоминания')
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('large_balance')
            .setDescription('Упоминать при крупных пополнениях')
            .setRequired(false)
        )
        .addNumberOption(option =>
          option
            .setName('threshold')
            .setDescription('Порог крупного пополнения (рублей)')
            .setRequired(false)
            .setMinValue(100)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    try {
      if (subcommand === 'view') {
        await handleView(interaction, guildId);
      } else if (subcommand === 'channel') {
        await handleChannel(interaction, guildId);
      } else if (subcommand === 'toggle') {
        await handleToggle(interaction, guildId);
      } else if (subcommand === 'minbalance') {
        await handleMinBalance(interaction, guildId);
      } else if (subcommand === 'mention') {
        await handleMention(interaction, guildId);
      }
    } catch (error) {
      console.error('Ошибка в команде settings:', error);
      await interaction.reply({ 
        content: '❌ Произошла ошибка при выполнении команды', 
        ephemeral: true 
      });
    }
  }
};


async function handleView(interaction, guildId) {
  const settings = await getBotSettings(guildId);

  const channelMention = (channelId) => channelId ? `<#${channelId}>` : '❌ Не установлен';
  const roleMention = (roleId) => roleId ? `<@&${roleId}>` : '❌ Не установлена';
  const booleanEmoji = (value) => value ? '✅ Включено' : '❌ Выключено';

  const embed = {
    color: 0x5865F2,
    title: '⚙️ Настройки Discord бота',
    fields: [
      {
        name: '📢 Каналы уведомлений',
        value: [
          `**📋 Общие логи:** ${channelMention(settings.logChannelId)}`,
          `**💰 Пополнения:** ${channelMention(settings.balanceLogChannelId)}`,
          `**🎮 Серверы:** ${channelMention(settings.serverLogChannelId)}`,
          `**👤 Пользователи:** ${channelMention(settings.userLogChannelId)}`,
          `**👮 Админские действия:** ${channelMention(settings.adminLogChannelId)}`,
          `**⚖️ Апелляции:** ${channelMention(settings.appealChannelId)}`
        ].join('\n'),
        inline: false
      },
      {
        name: '🔔 Типы уведомлений',
        value: [
          `**💰 Пополнения:** ${booleanEmoji(settings.notifyBalance)}`,
          `**🎮 Серверы:** ${booleanEmoji(settings.notifyServer)}`,
          `**👤 Пользователи:** ${booleanEmoji(settings.notifyUser)}`,
          `**👮 Админские действия:** ${booleanEmoji(settings.notifyAdmin)}`,
          `**🚫 Баны:** ${booleanEmoji(settings.notifyBan)}`,
          `**⚖️ Апелляции:** ${booleanEmoji(settings.notifyAppeal)}`
        ].join('\n'),
        inline: false
      },
      {
        name: '💵 Настройки пополнений',
        value: [
          `**Минимальная сумма:** ${settings.minBalanceNotify} ₽`,
          `**Упоминание роли:** ${roleMention(settings.mentionRoleId)}`,
          `**Упоминать при крупных:** ${booleanEmoji(settings.mentionOnLargeBalance)}`,
          `**Порог крупного пополнения:** ${settings.largeBalanceThreshold} ₽`
        ].join('\n'),
        inline: false
      }
    ],
    footer: { text: `Guild ID: ${guildId}` },
    timestamp: new Date().toISOString()
  };

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleChannel(interaction, guildId) {
  const type = interaction.options.getString('type');
  const channel = interaction.options.getChannel('channel');

  const channelMapping = {
    'log': 'logChannelId',
    'balance': 'balanceLogChannelId',
    'server': 'serverLogChannelId',
    'user': 'userLogChannelId',
    'admin': 'adminLogChannelId',
    'appeal': 'appealChannelId'
  };

  const typeNames = {
    'log': 'Общие логи',
    'balance': 'Пополнения баланса',
    'server': 'Серверы',
    'user': 'Пользователи',
    'admin': 'Админские действия',
    'appeal': 'Апелляции'
  };

  await updateBotSettings(guildId, {
    [channelMapping[type]]: channel.id
  });

  await interaction.reply({
    content: `✅ Канал **${typeNames[type]}** установлен на ${channel}`,
    ephemeral: true
  });
}

async function handleToggle(interaction, guildId) {
  const type = interaction.options.getString('type');
  const enabled = interaction.options.getBoolean('enabled');

  const notifyMapping = {
    'balance': 'notifyBalance',
    'server': 'notifyServer',
    'user': 'notifyUser',
    'admin': 'notifyAdmin',
    'ban': 'notifyBan',
    'appeal': 'notifyAppeal'
  };

  const typeNames = {
    'balance': 'Пополнения баланса',
    'server': 'Серверы',
    'user': 'Пользователи',
    'admin': 'Админские действия',
    'ban': 'Баны',
    'appeal': 'Апелляции'
  };

  await updateBotSettings(guildId, {
    [notifyMapping[type]]: enabled
  });

  await interaction.reply({
    content: `${enabled ? '✅' : '❌'} Уведомления **${typeNames[type]}** ${enabled ? 'включены' : 'выключены'}`,
    ephemeral: true
  });
}


async function handleMinBalance(interaction, guildId) {
  const amount = interaction.options.getNumber('amount');

  await updateBotSettings(guildId, {
    minBalanceNotify: amount
  });

  await interaction.reply({
    content: `✅ Минимальная сумма для уведомлений о пополнении установлена на **${amount} ₽**`,
    ephemeral: true
  });
}

async function handleMention(interaction, guildId) {
  const role = interaction.options.getRole('role');
  const largeBalance = interaction.options.getBoolean('large_balance');
  const threshold = interaction.options.getNumber('threshold');

  const updates = {};
  
  if (role !== null) {
    updates.mentionRoleId = role.id;
  }
  
  if (largeBalance !== null) {
    updates.mentionOnLargeBalance = largeBalance;
  }
  
  if (threshold !== null) {
    updates.largeBalanceThreshold = threshold;
  }

  await updateBotSettings(guildId, updates);

  const messages = [];
  
  if (role !== null) {
    messages.push(`**Роль для упоминаний:** ${role}`);
  }
  
  if (largeBalance !== null) {
    messages.push(`**Упоминание при крупных пополнениях:** ${largeBalance ? '✅ Включено' : '❌ Выключено'}`);
  }
  
  if (threshold !== null) {
    messages.push(`**Порог крупного пополнения:** ${threshold} ₽`);
  }

  await interaction.reply({
    content: `✅ Настройки упоминаний обновлены:\n${messages.join('\n')}`,
    ephemeral: true
  });
}
