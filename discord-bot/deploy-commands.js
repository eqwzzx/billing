import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

dotenv.config();

const commands = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загрузка команд
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  
  if ('data' in command.default && 'execute' in command.default) {
    commands.push(command.default.data.toJSON());
    console.log(`✅ Загружена команда: ${command.default.data.name}`);
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🔄 Начало регистрации ${commands.length} slash команд...`);

    // Регистрация команд для конкретной гильдии (быстрее для разработки)
    if (process.env.DISCORD_GUILD_ID) {
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
        { body: commands },
      );

      console.log(`✅ Успешно зарегистрировано ${data.length} команд для гильдии!`);
    } else {
      // Глобальная регистрация (для всех серверов, может занять до часа)
      const data = await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands },
      );

      console.log(`✅ Успешно зарегистрировано ${data.length} глобальных команд!`);
    }
  } catch (error) {
    console.error('❌ Ошибка регистрации команд:', error);
  }
})();
