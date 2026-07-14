import { Events } from 'discord.js';

export default (client) => {
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    // Обработка кнопок из команд
    const statusCommand = client.commands.get('status');
    if (statusCommand?.handleButton) {
      await statusCommand.handleButton(interaction);
    }
  });
};
