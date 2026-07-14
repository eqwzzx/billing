/**
 * Система уведомлений о блокировках в Discord
 */

import { prisma } from '@/lib/db'

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID

interface BanNotificationParams {
  userId: string
  banType: 'WARNING' | 'TEMP_BAN' | 'PERM_BAN'
  reason: string
  expiresAt?: Date
  adminName?: string
}

interface UnbanNotificationParams {
  userId: string
  reason: string
  adminName?: string
}

interface AppealNotificationParams {
  userId: string
  appealId: string
  reason: string
}

interface AppealResultNotificationParams {
  userId: string
  appealId: string
  status: 'APPROVED' | 'REJECTED'
  reviewNote?: string
  adminName?: string
}

/**
 * Отправить уведомление о блокировке пользователю
 */
export async function sendBanNotification(params: BanNotificationParams): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { discordId: true, email: true, name: true }
    })

    if (!user?.discordId) {
      console.log('[Ban Notification] User has no Discord linked:', params.userId)
      return
    }

    if (!DISCORD_BOT_TOKEN) {
      console.error('[Ban Notification] DISCORD_BOT_TOKEN not configured')
      return
    }

    // Создаём DM канал с пользователем
    const dmChannelResponse = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: user.discordId,
      }),
    })

    if (!dmChannelResponse.ok) {
      console.error('[Ban Notification] Failed to create DM channel:', await dmChannelResponse.text())
      return
    }

    const dmChannel = await dmChannelResponse.json()

    // Определяем цвет и эмодзи в зависимости от типа бана
    let color: number
    let emoji: string
    let title: string
    let expiryText = ''

    switch (params.banType) {
      case 'WARNING':
        color = 0xffa500 // Оранжевый
        emoji = '⚠️'
        title = 'Предупреждение'
        break
      case 'TEMP_BAN':
        color = 0xff0000 // Красный
        emoji = '🚫'
        title = 'Временная блокировка'
        if (params.expiresAt) {
          const expiryDate = new Date(params.expiresAt)
          expiryText = `\n**Блокировка истекает:** ${expiryDate.toLocaleString('ru-RU')}`
        }
        break
      case 'PERM_BAN':
        color = 0x8b0000 // Тёмно-красный
        emoji = '⛔'
        title = 'Постоянная блокировка'
        break
    }

    const embed = {
      title: `${emoji} ${title}`,
      description: `Ваш аккаунт был заблокирован.${expiryText}`,
      color: color,
      fields: [
        {
          name: '📋 Причина',
          value: params.reason || 'Не указана',
          inline: false,
        },
      ],
      footer: {
        text: 'Вы можете подать апелляцию через Discord команду /appeal',
      },
      timestamp: new Date().toISOString(),
    }

    if (params.adminName) {
      embed.fields.push({
        name: '👤 Администратор',
        value: params.adminName,
        inline: true,
      })
    }

    // Отправляем сообщение в DM
    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    })

    if (!messageResponse.ok) {
      console.error('[Ban Notification] Failed to send message:', await messageResponse.text())
      return
    }

    console.log('[Ban Notification] Sent ban notification to user:', user.email)
  } catch (error) {
    console.error('[Ban Notification] Error:', error)
  }
}

/**
 * Отправить уведомление о разблокировке
 */
export async function sendUnbanNotification(params: UnbanNotificationParams): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { discordId: true, email: true, name: true }
    })

    if (!user?.discordId) {
      console.log('[Unban Notification] User has no Discord linked:', params.userId)
      return
    }

    if (!DISCORD_BOT_TOKEN) {
      console.error('[Unban Notification] DISCORD_BOT_TOKEN not configured')
      return
    }

    const dmChannelResponse = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: user.discordId,
      }),
    })

    if (!dmChannelResponse.ok) {
      console.error('[Unban Notification] Failed to create DM channel:', await dmChannelResponse.text())
      return
    }

    const dmChannel = await dmChannelResponse.json()

    const embed = {
      title: '✅ Блокировка снята',
      description: 'Ваш аккаунт был разблокирован. Добро пожаловать обратно!',
      color: 0x00ff00, // Зелёный
      fields: [
        {
          name: '📋 Причина разблокировки',
          value: params.reason || 'Не указана',
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
    }

    if (params.adminName) {
      embed.fields.push({
        name: '👤 Администратор',
        value: params.adminName,
        inline: true,
      })
    }

    await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    })

    console.log('[Unban Notification] Sent unban notification to user:', user.email)
  } catch (error) {
    console.error('[Unban Notification] Error:', error)
  }
}

/**
 * Уведомление админам о новой апелляции
 */
export async function notifyAdminsAboutAppeal(params: AppealNotificationParams): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, name: true, discordId: true }
    })

    if (!user) return

    // Здесь можно отправить сообщение в админ-канал
    // Для этого нужен ADMIN_CHANNEL_ID в .env
    const ADMIN_CHANNEL_ID = process.env.DISCORD_ADMIN_CHANNEL_ID
    
    if (!ADMIN_CHANNEL_ID || !DISCORD_BOT_TOKEN) {
      console.log('[Appeal Notification] Admin channel not configured')
      return
    }

    const embed = {
      title: '📨 Новая апелляция на бан',
      color: 0xffff00, // Жёлтый
      fields: [
        {
          name: '👤 Пользователь',
          value: `${user.name || user.email} (${user.email})`,
          inline: false,
        },
        {
          name: '📋 Причина апелляции',
          value: params.reason,
          inline: false,
        },
        {
          name: '🆔 ID апелляции',
          value: params.appealId,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    }

    await fetch(`https://discord.com/api/v10/channels/${ADMIN_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    })

    console.log('[Appeal Notification] Notified admins about appeal:', params.appealId)
  } catch (error) {
    console.error('[Appeal Notification] Error:', error)
  }
}

/**
 * Уведомление пользователю о результате апелляции
 */
export async function sendAppealResultNotification(params: AppealResultNotificationParams): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { discordId: true, email: true }
    })

    if (!user?.discordId || !DISCORD_BOT_TOKEN) return

    const dmChannelResponse = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: user.discordId,
      }),
    })

    if (!dmChannelResponse.ok) return

    const dmChannel = await dmChannelResponse.json()

    const isApproved = params.status === 'APPROVED'
    const embed = {
      title: isApproved ? '✅ Апелляция одобрена' : '❌ Апелляция отклонена',
      description: isApproved 
        ? 'Ваша апелляция была одобрена. Блокировка снята.'
        : 'Ваша апелляция была отклонена.',
      color: isApproved ? 0x00ff00 : 0xff0000,
      fields: [
        {
          name: '🆔 ID апелляции',
          value: params.appealId,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    }

    if (params.reviewNote) {
      embed.fields.push({
        name: '📝 Комментарий',
        value: params.reviewNote,
        inline: false,
      })
    }

    if (params.adminName) {
      embed.fields.push({
        name: '👤 Администратор',
        value: params.adminName,
        inline: true,
      })
    }

    await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    })

    console.log('[Appeal Result] Sent result notification to user:', user.email)
  } catch (error) {
    console.error('[Appeal Result] Error:', error)
  }
}
