'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Key, Download, AlertTriangle, CheckCircle2, Smartphone } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface TwoFactorStatus {
  enabled: boolean
  backupCodesCount: number
}

export default function SecurityPage() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [showDisable, setShowDisable] = useState(false)
  const [showRegenerate, setShowRegenerate] = useState(false)

  // Состояния для настройки
  const [qrCode, setQrCode] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verifyCode, setVerifyCode] = useState('')
  const [setupStep, setSetupStep] = useState<'qr' | 'verify' | 'backup'>('qr')

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSetup = async () => {
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Ошибка настройки 2FA')
        return
      }

      const data = await response.json()
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setBackupCodes(data.backupCodes)
      setSetupStep('qr')
      setShowSetup(true)
    } catch (error) {
      toast.error('Ошибка подключения к серверу')
    }
  }

  const handleVerifyAndEnable = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error('Введите 6-значный код')
      return
    }

    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyCode }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Неверный код')
        return
      }

      toast.success('2FA успешно включена!')
      setSetupStep('backup')
    } catch (error) {
      toast.error('Ошибка подключения к серверу')
    }
  }

  const handleCompleteSetup = () => {
    setShowSetup(false)
    setSetupStep('qr')
    setVerifyCode('')
    fetchStatus()
  }

  const handleDisable = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error('Введите 6-значный код для подтверждения')
      return
    }

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyCode }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Ошибка отключения 2FA')
        return
      }

      toast.success('2FA отключена')
      setShowDisable(false)
      setVerifyCode('')
      fetchStatus()
    } catch (error) {
      toast.error('Ошибка подключения к серверу')
    }
  }

  const handleRegenerateBackup = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error('Введите 6-значный код для подтверждения')
      return
    }

    try {
      const response = await fetch('/api/auth/2fa/regenerate-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyCode }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Ошибка генерации кодов')
        return
      }

      const data = await response.json()
      setBackupCodes(data.backupCodes)
      setVerifyCode('')
      toast.success('Резервные коды обновлены')
      fetchStatus()
    } catch (error) {
      toast.error('Ошибка подключения к серверу')
    }
  }

  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fluxor-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    toast.success('Коды скопированы в буфер обмена')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Безопасность аккаунта
        </h1>
        <p className="text-muted-foreground mt-2">
          Управление настройками безопасности и двухфакторной аутентификацией
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Двухфакторная аутентификация (2FA)
          </CardTitle>
          <CardDescription>
            Защитите свой аккаунт с помощью Google Authenticator или другого TOTP приложения
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {status?.enabled ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">2FA включена</p>
                    <p className="text-sm text-muted-foreground">
                      Ваш аккаунт защищен двухфакторной аутентификацией
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">2FA отключена</p>
                    <p className="text-sm text-muted-foreground">
                      Рекомендуем включить для дополнительной защиты
                    </p>
                  </div>
                </>
              )}
            </div>
            <Button
              onClick={() => (status?.enabled ? setShowDisable(true) : handleStartSetup())}
              variant={status?.enabled ? 'destructive' : 'default'}
            >
              {status?.enabled ? 'Отключить' : 'Включить'}
            </Button>
          </div>

          {status?.enabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Резервные коды</p>
                    <p className="text-sm text-muted-foreground">
                      Осталось кодов: {status.backupCodesCount}
                    </p>
                  </div>
                </div>
                <Button onClick={() => setShowRegenerate(true)} variant="outline">
                  Обновить коды
                </Button>
              </div>
            </div>
          )}

          <Alert>
            <AlertDescription>
              <strong>Важно:</strong> Сохраните резервные коды в безопасном месте. Они понадобятся,
              если вы потеряете доступ к приложению аутентификации.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Диалог настройки 2FA */}
      <Dialog open={showSetup} onOpenChange={(open) => {
        setShowSetup(open)
        if (!open) {
          // Очищаем все состояния при закрытии
          setSetupStep('qr')
          setVerifyCode('')
          setQrCode('')
          setSecret('')
          setBackupCodes([])
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Настройка двухфакторной аутентификации</DialogTitle>
            <DialogDescription>
              {setupStep === 'qr' && 'Отсканируйте QR код в приложении аутентификации'}
              {setupStep === 'verify' && 'Введите код из приложения для подтверждения'}
              {setupStep === 'backup' && 'Сохраните резервные коды'}
            </DialogDescription>
          </DialogHeader>

          {setupStep === 'qr' && (
            <div className="space-y-6 py-4">
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  <strong>Шаг 1:</strong> Скачайте приложение Google Authenticator, Authy или любое другое TOTP приложение на свой телефон
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <p className="text-sm font-medium text-center">Шаг 2: Отсканируйте QR код</p>
                <div className="flex justify-center p-6 bg-white rounded-lg">
                  {qrCode && (
                    <Image 
                      src={qrCode} 
                      alt="QR Code" 
                      width={280} 
                      height={280} 
                      className="border-4 border-gray-200 rounded-lg shadow-sm" 
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Или введите код вручную:</Label>
                <div className="flex gap-2">
                  <Input 
                    value={secret} 
                    readOnly 
                    className="font-mono text-sm flex-1" 
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(secret)
                      toast.success('Секретный код скопирован')
                    }}
                  >
                    Копировать
                  </Button>
                </div>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Шаг 3:</strong> После сканирования QR кода, нажмите кнопку "Далее" чтобы подтвердить настройку
                </AlertDescription>
              </Alert>
              
              <Button onClick={() => setSetupStep('verify')} className="w-full" size="lg">
                Далее - Подтвердить настройку
              </Button>
            </div>
          )}

          {setupStep === 'verify' && (
            <div className="space-y-6 py-4">
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Откройте приложение аутентификации на телефоне и введите 6-значный код, который вы видите для Fluxor
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="verify-code" className="text-base font-medium">Код подтверждения</Label>
                <Input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center text-3xl tracking-[0.5em] font-bold h-16"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  Введите 6-значный код из приложения
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => {
                    setSetupStep('qr')
                    setVerifyCode('')
                  }} 
                  variant="outline" 
                  className="flex-1"
                  size="lg"
                >
                  Назад к QR коду
                </Button>
                <Button 
                  onClick={handleVerifyAndEnable} 
                  className="flex-1"
                  size="lg"
                  disabled={verifyCode.length !== 6}
                >
                  Подтвердить и включить
                </Button>
              </div>
            </div>
          )}

          {setupStep === 'backup' && (
            <div className="space-y-6 py-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Очень важно!</strong> Сохраните эти резервные коды в безопасном месте. 
                  Они понадобятся, если вы потеряете доступ к телефону или приложению аутентификации.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Label className="text-base font-medium">Ваши резервные коды:</Label>
                <div className="bg-muted/50 p-6 rounded-lg border-2 border-border">
                  <div className="grid grid-cols-2 gap-3 font-mono text-base">
                    {backupCodes.map((code, i) => (
                      <div 
                        key={i} 
                        className="text-center py-2 px-3 bg-background rounded border font-semibold"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={downloadBackupCodes} variant="outline" className="flex-1" size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Скачать коды
                </Button>
                <Button onClick={copyBackupCodes} variant="outline" className="flex-1" size="lg">
                  Копировать все
                </Button>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Каждый код можно использовать только один раз. Храните их в безопасном месте, 
                  например в менеджере паролей.
                </AlertDescription>
              </Alert>

              <Button onClick={handleCompleteSetup} className="w-full" size="lg">
                Завершить настройку
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог отключения 2FA */}
      <Dialog open={showDisable} onOpenChange={(open) => {
        setShowDisable(open)
        if (!open) setVerifyCode('')
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Отключить двухфакторную аутентификацию</DialogTitle>
            <DialogDescription>
              Для отключения 2FA введите код из приложения аутентификации
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Внимание!</strong> После отключения ваш аккаунт будет менее защищен. 
                Мы настоятельно рекомендуем оставить 2FA включенной.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="disable-code" className="text-base font-medium">Код подтверждения</Label>
              <Input
                id="disable-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-3xl tracking-[0.5em] font-bold h-16"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Введите 6-значный код из приложения Google Authenticator
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              onClick={() => {
                setShowDisable(false)
                setVerifyCode('')
              }} 
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Отмена
            </Button>
            <Button 
              onClick={handleDisable} 
              variant="destructive"
              size="lg"
              className="flex-1"
              disabled={verifyCode.length !== 6}
            >
              Отключить 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог обновления backup кодов */}
      <Dialog open={showRegenerate} onOpenChange={(open) => {
        setShowRegenerate(open)
        if (!open) {
          setBackupCodes([])
          setVerifyCode('')
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Обновить резервные коды</DialogTitle>
            <DialogDescription>
              {backupCodes.length === 0
                ? 'Введите код из приложения аутентификации для подтверждения'
                : 'Новые резервные коды успешно сгенерированы'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {backupCodes.length === 0 ? (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Важно:</strong> Старые резервные коды перестанут работать после генерации новых. 
                    Убедитесь, что сохранили новые коды в безопасном месте.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="regen-code" className="text-base font-medium">Код подтверждения</Label>
                  <Input
                    id="regen-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="text-center text-3xl tracking-[0.5em] font-bold h-16"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Введите 6-значный код из приложения Google Authenticator
                  </p>
                </div>
              </>
            ) : (
              <>
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    <strong>Успешно!</strong> Резервные коды обновлены. Сохраните их в безопасном месте.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Ваши новые резервные коды:</Label>
                  <div className="bg-muted/50 p-6 rounded-lg border-2 border-border">
                    <div className="grid grid-cols-2 gap-3 font-mono text-base">
                      {backupCodes.map((code, i) => (
                        <div 
                          key={i} 
                          className="text-center py-2 px-3 bg-background rounded border font-semibold"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={downloadBackupCodes} variant="outline" className="flex-1" size="lg">
                    <Download className="h-4 w-4 mr-2" />
                    Скачать коды
                  </Button>
                  <Button onClick={copyBackupCodes} variant="outline" className="flex-1" size="lg">
                    Копировать все
                  </Button>
                </div>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Не забудьте сохранить!</strong> Старые коды больше не работают. 
                    Каждый новый код можно использовать только один раз.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
          <DialogFooter>
            {backupCodes.length === 0 ? (
              <>
                <Button 
                  onClick={() => {
                    setShowRegenerate(false)
                    setVerifyCode('')
                  }} 
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleRegenerateBackup}
                  size="lg"
                  className="flex-1"
                  disabled={verifyCode.length !== 6}
                >
                  Обновить коды
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setShowRegenerate(false)
                  setBackupCodes([])
                  setVerifyCode('')
                }}
                className="w-full"
                size="lg"
              >
                Готово
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
