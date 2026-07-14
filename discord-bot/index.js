import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import { createWebhookServer } from './webhook-server.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Создание клиента Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Коллекция команд
client.commands = new Collection();

// Загрузка команд
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('🔄 Загрузка команд...');
for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  
  if ('data' in command.default && 'execute' in command.default) {
    client.commands.set(command.default.data.name, command.default);
    console.log(`✅ Загружена команда: ${command.default.data.name}`);
  } else {
    console.warn(`⚠️  Команда ${file} не имеет required "data" или "execute" свойства.`);
  }
}

// Загрузка обработчиков событий
const handlersPath = join(__dirname, 'handlers');
if (readdirSync(__dirname).includes('handlers')) {
  const handlerFiles = readdirSync(handlersPath).filter(file => file.endsWith('.js'));

  console.log('🔄 Загрузка обработчиков...');
  for (const file of handlerFiles) {
    const filePath = join(handlersPath, file);
    try {
      const handler = await import(`file://${filePath}`);
      
      if (handler.default) {
        handler.default(client);
        console.log(`✅ Загружен обработчик: ${file}`);
      }
    } catch (error) {
      console.warn(`⚠️  Не удалось загрузить обработчик ${file}:`, error.message);
    }
  }
}

// Обработка slash команд
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`❌ Команда ${interaction.commandName} не найдена.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Ошибка выполнения команды ${interaction.commandName}:`, error);
    
    const errorMessage = {
      content: '❌ Произошла ошибка при выполнении команды!',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Событие готовности бота
client.once(Events.ClientReady, () => {
  console.log('✅ Бот запущен!');
  console.log(`🤖 Имя бота: ${client.user.tag}`);
  console.log(`🆔 ID бота: ${client.user.id}`);
  console.log(`📊 Серверов: ${client.guilds.cache.size}`);
  console.log(`👥 Пользователей: ${client.users.cache.size}`);
  
  // Установка статуса
  client.user.setPresence({
    activities: [{ name: 'Fluxor Billing' }],
    status: 'online',
  });

  // Запуск webhook сервера
  try {
    createWebhookServer(client);
  } catch (error) {
    console.error('⚠️  Не удалось запустить webhook сервер:', error);
  }
});

// Обработка ошибок
client.on(Events.Error, error => {
  console.error('❌ Discord client ошибка:', error);
});

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

// Вход бота
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('❌ Не удалось войти в Discord:', error);
  process.exit(1);
});
