/**
 * Discord Role Management
 * Выдача и удаление ролей через Discord Bot API
 */

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DISCORD_VERIFIED_ROLE_ID = process.env.DISCORD_VERIFIED_ROLE_ID;

/**
 * Выдать роль пользователю Discord
 */
export async function giveDiscordRole(discordUserId: string): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_VERIFIED_ROLE_ID) {
    console.log('Discord role assignment skipped: missing configuration');
    return false;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${DISCORD_VERIFIED_ROLE_ID}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 204) {
      console.log(`✅ Discord role assigned to user ${discordUserId}`);
      return true;
    } else if (response.status === 404) {
      console.log(`⚠️ Discord user ${discordUserId} not found in guild`);
      return false;
    } else {
      const error = await response.text();
      console.error(`❌ Failed to assign Discord role: ${response.status} - ${error}`);
      return false;
    }
  } catch (error) {
    console.error('Discord role assignment error:', error);
    return false;
  }
}

/**
 * Удалить роль у пользователя Discord
 */
export async function removeDiscordRole(discordUserId: string): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_VERIFIED_ROLE_ID) {
    console.log('Discord role removal skipped: missing configuration');
    return false;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${DISCORD_VERIFIED_ROLE_ID}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (response.status === 204) {
      console.log(`✅ Discord role removed from user ${discordUserId}`);
      return true;
    } else if (response.status === 404) {
      console.log(`⚠️ Discord user ${discordUserId} not found in guild`);
      return false;
    } else {
      const error = await response.text();
      console.error(`❌ Failed to remove Discord role: ${response.status} - ${error}`);
      return false;
    }
  } catch (error) {
    console.error('Discord role removal error:', error);
    return false;
  }
}
