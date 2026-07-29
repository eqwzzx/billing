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
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Настройка двухфакторной аутентификации</DialogTitle>
            <DialogDescription>
              {setupStep === 'qr' && 'Отсканируйте QR код в приложении аутентификации'}
              {setupStep === 'verify' && 'Введите код из приложения для подтверждения'}
              {setupStep === 'backup' && 'Сохраните резервные коды'}
            </DialogDescription>
          </DialogHeader>

          {setupStep === 'qr' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {qrCode && (
                  <Image src={qrCode} alt="QR Code" width={200} height={200} className="border rounded-lg" />
                )}
              </div>
              <div>
                <Label>Или введите код вручную:</Label>
                <Input value={secret} readOnly className="font-mono text-xs" />
              </div>
              <Alert>
                <AlertDescription className="text-xs">
                  Скачайте Google Authenticator или Authy на свой телефон и отсканируйте этот QR код
                </AlertDescription>
              </Alert>
              <Button onClick={() => setSetupStep('verify')} className="w-full">
                Далее
              </Button>
            </div>
          )}

          {setupStep === 'verify' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="verify-code">Код подтверждения</Label>
                <Input
                  id="verify-code"
                  type="text"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setSetupStep('qr')} variant="outline" className="w-full">
                  Назад
                </Button>
                <Button onClick={handleVerifyAndEnable} className="w-full">
                  Подтвердить
                </Button>
              </div>
            </div>
          )}

          {setupStep === 'backup' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Сохраните эти коды в безопасном месте! Они понадобятся, если вы потеряете телефон.
                </AlertDescription>
              </Alert>
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="text-center py-1">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Скачать
                </Button>
                <Button onClick={copyBackupCodes} variant="outline" className="flex-1">
                  Копировать
                </Button>
              </div>
              <Button onClick={handleCompleteSetup} className="w-full">
                Готово
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог отключения 2FA */}
      <Dialog open={showDisable} onOpenChange={setShowDisable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отключить двухфакторную аутентификацию</DialogTitle>
            <DialogDescription>
              Введите код из приложения для подтверждения
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="disable-code">Код подтверждения</Label>
              <Input
                id="disable-code"
                type="text"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                После отключения ваш аккаунт будет менее защищен
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDisable(false)} variant="outline">
              Отмена
            </Button>
            <Button onClick={handleDisable} variant="destructive">
              Отключить 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог обновления backup кодов */}
      <Dialog open={showRegenerate} onOpenChange={setShowRegenerate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Обновить резервные коды</DialogTitle>
            <DialogDescription>
              {backupCodes.length === 0
                ? 'Введите код из приложения для подтверждения'
                : 'Новые резервные коды сгенерированы'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {backupCodes.length === 0 ? (
              <>
                <div>
                  <Label htmlFor="regen-code">Код подтверждения</Label>
                  <Input
                    id="regen-code"
                    type="text"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
                <Alert>
                  <AlertDescription>
                    Старые резервные коды перестанут работать после генерации новых
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="text-center py-1">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Скачать
                  </Button>
                  <Button onClick={copyBackupCodes} variant="outline" className="flex-1">
                    Копировать
                  </Button>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            {backupCodes.length === 0 ? (
              <>
                <Button onClick={() => setShowRegenerate(false)} variant="outline">
                  Отмена
                </Button>
                <Button onClick={handleRegenerateBackup}>Обновить</Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setShowRegenerate(false)
                  setBackupCodes([])
                }}
                className="w-full"
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
