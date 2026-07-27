/**
 * API клиент для взаимодействия с биллинг системой
 */

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_SECRET = process.env.INTERNAL_WEBHOOK_SECRET;
if (!API_SECRET) {
  throw new Error('INTERNAL_WEBHOOK_SECRET is required');
}

/**
 * Получить информацию о пользователе
 * @param {string} identifier - Discord ID, email или username
 * @param {string} type - Тип идентификатора: 'discordId', 'email', 'username'
 */
export async function getUser(identifier, type = 'discordId') {
  try {
    const params = new URLSearchParams();
    params.set(type, identifier);

    const response = await fetch(`${API_URL}/api/discord/user?${params}`, {
      headers: {
        'Authorization': `Bearer ${API_SECRET}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Получить список серверов пользователя
 * @param {string} identifier - Discord ID, email или userId
 * @param {string} type - Тип идентификатора: 'discordId', 'email', 'userId'
 */
export async function getUserServers(identifier, type = 'discordId') {
  try {
    const params = new URLSearchParams();
    params.set(type, identifier);

    const response = await fetch(`${API_URL}/api/discord/servers?${params}`, {
      headers: {
        'Authorization': `Bearer ${API_SECRET}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch servers');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching servers:', error);
    return null;
  }
}

/**
 * Получить транзакции пользователя
 * @param {string} identifier - Discord ID, email или userId
 * @param {string} type - Тип идентификатора: 'discordId', 'email', 'userId'
 * @param {number} limit - Количество транзакций (макс 50)
 * @param {string} status - Фильтр по статусу (опционально)
 */
export async function getUserTransactions(identifier, type = 'discordId', limit = 10, status = null) {
  try {
    const params = new URLSearchParams();
    params.set(type, identifier);
    params.set('limit', limit.toString());
    if (status) {
      params.set('status', status);
    }

    const response = await fetch(`${API_URL}/api/discord/transactions?${params}`, {
      headers: {
        'Authorization': `Bearer ${API_SECRET}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch transactions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return null;
  }
}
