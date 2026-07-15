import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { generatePterodactylPassword, encryptPassword } from '@/lib/pterodactyl-password'
import nodemailer from 'nodemailer'

async function getSmtpSettings() {
  const settings = await prisma.adminSettings.findMany({
    where: { key: { startsWith: 'smtp_' } }
  })

  const smtp: Record<string, string> = {}
  settings.forEach(s => {
    smtp[s.key.replace('smtp_', '')] = s.value
  })

  if (!smtp.host || !smtp.user || !smtp.password) {
    return null
  }

  return {
    host: smtp.host,
    port: parseInt(smtp.port || '587'),
    user: smtp.user,
    password: smtp.password,
    from: smtp.from || smtp.user,
    secure: smtp.secure === 'true',
  }
}

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
      const smtp = await getSmtpSettings()
      if (smtp) {
        const transporter = nodemailer.createTransporter({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure,
          auth: {
            user: smtp.user,
            pass: smtp.password,
          },
        })
        
        await transporter.sendMail({
          from: smtp.from,
          to: currentUser.email,
          subject: 'Новый пароль панели управления — Fluxor',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background: linear-gradient(145deg, #141414 0%, #1a1a1a 100%); border-radius: 16px; border: 1px solid #262626;">
                      <tr>
                        <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #262626;">
                          <div style="font-size: 28px; font-weight: 700; color: #ffffff;">Fluxor</div>
                          <div style="font-size: 12px; color: #666; margin-top: 4px;">ХОСТИНГ</div>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style="padding: 32px;">
                          <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #ffffff;">Новый пароль панели</h1>
                          <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #a1a1a1;">
                            Ваш пароль от панели управления серверами был сброшен.
                          </p>
                          
                          <div style="background: #1f1f1f; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                            <p style="margin: 0 0 8px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Логин</p>
                            <p style="margin: 0 0 20px; font-size: 16px; color: #fff; font-family: monospace; word-break: break-all;">${currentUser.email}</p>
                            
                            <p style="margin: 0 0 8px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Новый пароль</p>
                            <p style="margin: 0; font-size: 18px; color: #a855f7; font-weight: 600; font-family: monospace; word-break: break-all;">${newPassword}</p>
                          </div>
                          
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="padding: 8px 0 24px;">
                                <a href="${panelUrl}" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px;">
                                  Открыть панель
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <div style="background: #1f1f1f; border-radius: 8px; padding: 16px;">
                            <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.5;">
                              ⚠️ Сохраните этот пароль в надёжном месте. Мы не сможем показать его снова.
                            </p>
                          </div>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style="padding: 24px 32px; background: #0f0f0f; border-top: 1px solid #262626; text-align: center;">
                          <p style="margin: 0; font-size: 12px; color: #525252;">
                            © ${new Date().getFullYear()} Fluxor. Все права защищены.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        })
      }
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
