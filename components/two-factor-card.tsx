'use client'

import { useState, useEffect } from 'react'
import { Shield, Smartphone, CheckCircle, AlertTriangle, Key, Download, Loader2, XCircle } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface TwoFactorStatus {
  enabled: boolean
  backupCodesCount: number
}

export function TwoFactorCard() {
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
  const [processing, setProcessing] = useState(false)

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
    setProcessing(true)
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
    } finally {
      setProcessing(false)
    }
  }

  const handleVerifyAndEnable = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error('Введите 6-значный код')
      return
    }

    setProcessing(true)
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
    } finally {
      setProcessing(false)
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

    setProcessing(true)
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
    } finally {
      setProcessing(false)
    }
  }

  const handleRegenerateBackup = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error('Введите 6-значный код для подтверждения')
      return
    }

    setProcessing(true)
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
    } finally {
      setProcessing(false)
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
      <div className="flex items-center justify-center gap-2 py-6 sm:py-8 text-muted-foreground">
        <Loader2 className="size-4 sm:size-5 animate-spin" />
        <span className="text-xs sm:text-sm">Загрузка...</span>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-muted/20 border border-border/30">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {status?.enabled ? (
              <>
                <div className="size-10 sm:size-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="size-5 sm:size-6 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base text-foreground">2FA включена</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Аккаунт защищен двухфакторной аутентификацией
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="size-10 sm:size-12 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="size-5 sm:size-6 text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base text-foreground">2FA отключена</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Рекомендуем включить для дополнительной защиты
                  </p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => (status?.enabled ? setShowDisable(true) : handleStartSetup())}
            disabled={processing}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${
              status?.enabled
                ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20'
                : 'bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500/20'
            }`}
          >
            {processing ? <Loader2 className="size-4 animate-spin" /> : status?.enabled ? 'Отключить' : 'Включить'}
          </button>
        </div>

        {status?.enabled && (
          <>
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-muted/20 border border-border/30">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="size-10 sm:size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Key className="size-5 sm:size-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base text-foreground">Резервные коды</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Осталось кодов: {status.backupCodesCount}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRegenerate(true)}
                className="px-4 py-2 rounded-xl border border-border/50 bg-muted/20 text-xs sm:text-sm font-medium text-foreground hover:bg-muted/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Обновить
              </button>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                <strong>Важно:</strong> 2FA код потребуется при авторизации, покупке тарифа, смене email и пароля.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Диалог настройки 2FA */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border/30">
              <h3 className="font-heading font-bold text-lg sm:text-xl">Настройка двухфакторной аутентификации</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {setupStep === 'qr' && 'Отсканируйте QR код в приложении аутентификации'}
                {setupStep === 'verify' && 'Введите код из приложения для подтверждения'}
                {setupStep === 'backup' && 'Сохраните резервные коды в безопасном месте'}
              </p>
            </div>

            <div className="p-5 sm:p-6">
              {setupStep === 'qr' && (
                <div className="space-y-6">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Smartphone className="size-4 flex-shrink-0" />
                      <span>
                        <strong>Шаг 1:</strong> Скачайте приложение Google Authenticator, Authy или любое другое TOTP приложение на свой телефон
                      </span>
                    </p>
                  </div>

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
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Или введите код вручную:</label>
                    <div className="flex gap-2">
                      <input
                        value={secret}
                        readOnly
                        className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5 text-xs font-mono text-foreground select-all flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(secret)
                          toast.success('Секретный код скопирован')
                        }}
                        className="px-4 py-2 rounded-xl border border-border/50 bg-muted/20 text-xs font-medium text-foreground hover:bg-muted/40 transition-all"
                      >
                        Копировать
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle className="size-4 flex-shrink-0" />
                      <span>
                        <strong>Шаг 3:</strong> После сканирования QR кода, нажмите кнопку "Далее" чтобы подтвердить настройку
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => setSetupStep('verify')}
                    className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:bg-foreground/90 transition-all"
                  >
                    Далее - Подтвердить настройку
                  </button>
                </div>
              )}

              {setupStep === 'verify' && (
                <div className="space-y-6">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Smartphone className="size-4 flex-shrink-0" />
                      <span>
                        Откройте приложение аутентификации на телефоне и введите 6-значный код, который вы видите для Fluxor
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="verify-code" className="text-sm font-medium text-foreground">
                      Код подтверждения
                    </label>
                    <input
                      id="verify-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      autoFocus
                      className="w-full rounded-xl border border-border/50 bg-background px-4 py-4 text-center text-3xl tracking-[0.5em] font-bold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Введите 6-значный код из приложения
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSetupStep('qr')
                        setVerifyCode('')
                      }}
                      className="flex-1 rounded-xl border border-border/50 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/20 transition-all"
                    >
                      Назад к QR коду
                    </button>
                    <button
                      onClick={handleVerifyAndEnable}
                      disabled={processing || verifyCode.length !== 6}
                      className="flex-1 rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {processing && <Loader2 className="size-4 animate-spin" />}
                      Подтвердить и включить
                    </button>
                  </div>
                </div>
              )}

              {setupStep === 'backup' && (
                <div className="space-y-6">
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="size-4 flex-shrink-0" />
                      <span>
                        <strong>Очень важно!</strong> Сохраните эти резервные коды в безопасном месте. 
                        Они понадобятся, если вы потеряете доступ к телефону или приложению аутентификации.
                      </span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Ваши резервные коды:</label>
                    <div className="bg-muted/50 p-6 rounded-xl border-2 border-border">
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
                    <button
                      onClick={downloadBackupCodes}
                      className="flex-1 rounded-xl border border-border/50 py-3 text-sm font-medium text-foreground hover:bg-muted/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="size-4" />
                      Скачать коды
                    </button>
                    <button
                      onClick={copyBackupCodes}
                      className="flex-1 rounded-xl border border-border/50 py-3 text-sm font-medium text-foreground hover:bg-muted/20 transition-all"
                    >
                      Копировать все
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle className="size-4 flex-shrink-0" />
                      <span>
                        Каждый код можно использовать только один раз. Храните их в безопасном месте, 
                        например в менеджере паролей.
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={handleCompleteSetup}
                    className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:bg-foreground/90 transition-all"
                  >
                    Завершить настройку
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Диалог отключения 2FA */}
      {showDisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card rounded-2xl border border-border shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border/30">
              <h3 className="font-heading font-bold text-lg">Отключить двухфакторную аутентификацию</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Для отключения 2FA введите код из приложения аутентификации
              </p>
            </div>
            <div className="p-5 sm:p-6 space-y-6">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="size-4 flex-shrink-0" />
                  <span>
                    <strong>Внимание!</strong> После отключения ваш аккаунт будет менее защищен. 
                    Мы настоятельно рекомендуем оставить 2FA включенной.
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="disable-code" className="text-sm font-medium text-foreground">
                  Код подтверждения
                </label>
                <input
                  id="disable-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-4 text-center text-3xl tracking-[0.5em] font-bold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Введите 6-значный код из приложения Google Authenticator
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDisable(false)
                    setVerifyCode('')
                  }}
                  className="flex-1 rounded-xl border border-border/50 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/20 transition-all"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDisable}
                  disabled={processing || verifyCode.length !== 6}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {processing && <Loader2 className="size-4 animate-spin" />}
                  Отключить 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Диалог обновления backup кодов */}
      {showRegenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border/30">
              <h3 className="font-heading font-bold text-lg">Обновить резервные коды</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {backupCodes.length === 0
                  ? 'Введите код из приложения аутентификации для подтверждения'
                  : 'Новые резервные коды успешно сгенерированы'}
              </p>
            </div>
            <div className="p-5 sm:p-6 space-y-6">
              {backupCodes.length === 0 ? (
                <>
                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                      <AlertTriangle className="size-4 flex-shrink-0" />
                      <span>
                        <strong>Важно:</strong> Старые резервные коды перестанут работать после генерации новых. 
                        Убедитесь, что сохранили новые коды в безопасном месте.
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="regen-code" className="text-sm font-medium text-foreground">
                      Код подтверждения
                    </label>
                    <input
                      id="regen-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      autoFocus
                      className="w-full rounded-xl border border-border/50 bg-background px-4 py-4 text-center text-3xl tracking-[0.5em] font-bold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Введите 6-значный код из приложения Google Authenticator
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowRegenerate(false)
                        setVerifyCode('')
                      }}
                      className="flex-1 rounded-xl border border-border/50 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/20 transition-all"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleRegenerateBackup}
                      disabled={processing || verifyCode.length !== 6}
                      className="flex-1 rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {processing && <Loader2 className="size-4 animate-spin" />}
                      Обновить коды
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle className="size-4 flex-shrink-0" />
                      <span>
                        <strong>Успешно!</strong> Резервные коды обновлены. Сохраните их в безопасном месте.
                      </span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Ваши новые резервные коды:</label>
                    <div className="bg-muted/50 p-6 rounded-xl border-2 border-border">
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
                    <button
                      onClick={downloadBackupCodes}
                      className="flex-1 rounded-xl border border-border/50 py-3 text-sm font-medium text-foreground hover:bg-muted/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="size-4" />
                      Скачать коды
                    </button>
                    <button
                      onClick={copyBackupCodes}
                      className="flex-1 rounded-xl border border-border/50 py-3 text-sm font-medium text-foreground hover:bg-muted/20 transition-all"
                    >
                      Копировать все
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="size-4 flex-shrink-0" />
                      <span>
                        <strong>Не забудьте сохранить!</strong> Старые коды больше не работают. 
                        Каждый новый код можно использовать только один раз.
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowRegenerate(false)
                      setBackupCodes([])
                      setVerifyCode('')
                    }}
                    className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background hover:bg-foreground/90 transition-all"
                  >
                    Готово
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
