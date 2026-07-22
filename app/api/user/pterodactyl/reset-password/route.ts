import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { generatePterodactylPassword, encryptPassword } from '@/lib/pterodactyl-password'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        id: true, 
        email: true, 
        pterodactylId: true,
        name: true
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    if (!currentUser.pterodactylId) {
      return NextResponse.json({ 
        error: 'У вас нет аккаунта в панели управления' 
      }, { status: 400 })
    }

    // Генерируем новый пароль
    const newPassword = generatePterodactylPassword()
    const encryptedPassword = encryptPassword(newPassword)

    // Обновляем в БД
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { pterodactylPassword: encryptedPassword }
    })

    // Обновляем в Pterodactyl
    try {
      const { updatePterodactylUserPassword } = await import('@/lib/pterodactyl')
      await updatePterodactylUserPassword(currentUser.pterodactylId, newPassword)
    } catch (pteroError) {
      console.error('[Reset Ptero Password] Pterodactyl error:', pteroError)
      // Откатываем изменение в БД
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { pterodactylPassword: null }
      })
      return NextResponse.json({ 
        error: 'Ошибка обновления пароля в панели' 
      }, { status: 500 })
    }

    // Отправляем письмо с новым паролем
    const panelUrl = process.env.PTERODACTYL_URL || 'https://control.fluxor.solutions'
    
    try {
      const { sendPterodactylPasswordEmail } = await import('@/lib/email')
      await sendPterodactylPasswordEmail(currentUser.email, {
        email: currentUser.email,
        password: newPassword,
        panelUrl
      })
    } catch (emailError) {
      console.error('[Reset Ptero Password] Email error:', emailError)
      // Продолжаем, даже если email не отправился
    }

    return NextResponse.json({ 
      success: true,
      password: newPassword, // Возвращаем пароль для отображения в UI
      message: 'Новый пароль отправлен на вашу почту' 
    })
  } catch (error) {
    console.error('[Reset Ptero Password] Error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
