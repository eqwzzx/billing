"use client"

import { Settings, Shield, Link2, LogOut, Plus, Check, ExternalLink, RefreshCw, Eye, EyeOff, Copy, Loader2, Mail, CheckCircle, XCircle } from "lucide-react"
import { User } from "../types"
import { useState, useEffect } from "react"
import { VerifyEmailModal } from "../modals/verify-email-modal"

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

interface PteroAccount {
  linked: boolean
  username?: string
  email?: string
}

interface SettingsTabProps {
  user: User
  pteroAccount: PteroAccount | null
  pteroLoading: boolean
  pteroPassword: string | null
  showPteroPassword: boolean
  setShowPteroPassword: (show: boolean) => void
  onCreatePteroAccount: () => void
  onResetPteroPassword: () => void
  onShowPasswordModal: () => void
  onCopyToClipboard: (text: string) => void
  onShowDeleteAccountModal: () => void
  onResendVerification?: () => void
  verificationLoading?: boolean
}

export function SettingsTab({
  user,
  pteroAccount,
  pteroLoading,
  pteroPassword,
  showPteroPassword,
  setShowPteroPassword,
  onCreatePteroAccount,
  onResetPteroPassword,
  onShowPasswordModal,
  onCopyToClipboard,
  onShowDeleteAccountModal,
  onResendVerification,
  verificationLoading = false,
}: SettingsTabProps) {
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [discordLinked, setDiscordLinked] = useState<boolean | null>(null)
  const [discordData, setDiscordData] = useState<{
    username?: string;
    discriminator?: string;
    avatar?: string;
    globalName?: string;
    discordId?: string;
  } | null>(null)
  const [discordLoading, setDiscordLoading] = useState(true)
  const [showDiscordSuccess, setShowDiscordSuccess] = useState(false)
  const [userName, setUserName] = useState(user.name || '')
  const [savingName, setSavingName] = useState(false)
  const [joinDiscordServer, setJoinDiscordServer] = useState(true)
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailChangeStep, setEmailChangeStep] = useState<1 | 2>(1)
  const [changingEmail, setChangingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  useEffect(() => {
    checkDiscordLink()
    
    // Проверка query параметра discord=linked
    const params = new URLSearchParams(window.location.search)
    if (params.get('discord') === 'linked') {
      setShowDiscordSuccess(true)
      window.history.replaceState({}, '', window.location.pathname)
      
      // Скрыть через 5 секунд
      setTimeout(() => setShowDiscordSuccess(false), 5000)
    }
  }, [])

  const checkDiscordLink = async () => {
    try {
      const res = await fetch('/api/user/discord/check')
      const data = await res.json()
      setDiscordLinked(data.linked)
      if (data.linked) {
        setDiscordData({
          username: data.username,
          discriminator: data.discriminator,
          avatar: data.avatar,
          globalName: data.globalName,
          discordId: data.discordId,
        })
      }
    } catch (error) {
      console.error('Failed to check Discord link:', error)
      setDiscordLinked(false)
    } finally {
      setDiscordLoading(false)
    }
  }

  const handleDiscordUnlink = async () => {
    if (!confirm('Вы уверены что хотите отвязать Discord?')) return

    try {
      const res = await fetch('/api/user/discord/unlink', { method: 'POST' })
      if (res.ok) {
        setDiscordLinked(false)
        setDiscordData(null)
      }
    } catch (error) {
      console.error('Failed to unlink Discord:', error)
    }
  }

  // Функция для получения URL аватара Discord
  const getDiscordAvatarUrl = (userId: string, avatarHash: string | undefined) => {
    if (!avatarHash) {
      // Дефолтный аватар Discord
      return `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) % 5}.png`
    }
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=128`
  }

  const handleResendVerification = async () => {
    if (onResendVerification) {
      await onResendVerification()
      setShowVerifyModal(true)
    }
  }

  const handleVerificationSuccess = () => {
    // Перезагрузить страницу чтобы обновить статус
    window.location.reload()
  }

  const handleSaveName = async () => {
    if (!userName.trim()) {
      return
    }

    setSavingName(true)
    try {
      const res = await fetch('/api/user/name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName }),
      })
      const data = await res.json()

      if (res.ok) {
        // Успешный toast покажется автоматически
        window.location.reload() // Перезагрузим для обновления имени везде
      } else {
        alert(data.error || 'Ошибка сохранения имени')
      }
    } catch {
      alert('Ошибка сети')
    }
    setSavingName(false)
  }

  const handleDiscordLink = () => {
    // Сохраняем настройку в localStorage перед редиректом
    localStorage.setItem('discord_join_server', joinDiscordServer ? 'true' : 'false')
    // Передаем параметр через URL
    const joinParam = joinDiscordServer ? '&join_server=true' : ''
    window.location.href = `/api/auth/discord?action=link${joinParam}`
  }

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim()) return
    
    setChangingEmail(true)
    setEmailError(null)
    
    try {
      const res = await fetch('/api/user/email/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      })
      const data = await res.json()
      
      if (res.ok) {
        setEmailChangeStep(2)
        alert('Код подтверждения отправлен на новый email!')
      } else {
        setEmailError(data.error || 'Ошибка отправки кода')
      }
    } catch {
      setEmailError('Ошибка сети')
    }
    setChangingEmail(false)
  }

  const handleConfirmEmailChange = async () => {
    if (!emailCode.trim()) return
    
    setChangingEmail(true)
    setEmailError(null)
    
    try {
      const res = await fetch('/api/user/email/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: emailCode }),
      })
      const data = await res.json()
      
      if (res.ok) {
        alert('Email успешно изменен!')
        window.location.reload()
      } else {
        setEmailError(data.error || 'Неверный код')
      }
    } catch {
      setEmailError('Ошибка сети')
    }
    setChangingEmail(false)
  }

  const resetEmailChange = () => {
    setShowChangeEmail(false)
    setNewEmail('')
    setEmailCode('')
    setEmailChangeStep(1)
    setEmailError(null)
  }
  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-6 border border-border/50 bg-card/30 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div 
          className="absolute inset-0"
          style={{ backgroundImage: 'url(/waves.jpg)', backgroundPosition: 'center', backgroundSize: 'cover' }}
        />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="relative z-10 p-6">
          <h1 className="font-heading text-2xl font-bold text-white">Настройки</h1>
          <p className="text-white/60 text-sm mt-1">Управление аккаунтом и безопасностью</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="px-5 py-4 border-b border-border/30 bg-muted/20">
            <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="size-4 text-primary" />
              </div>
              Профиль
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
              <div className="mt-1.5 px-4 py-2.5 rounded-xl bg-muted/30 border border-border/30 text-sm text-muted-foreground flex items-center justify-between">
                <span>{user.email}</span>
                {user.emailVerified ? (
                  <div className="flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle className="size-4" />
                    <span className="text-xs font-medium">Подтвержден</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-red-500">
                    <XCircle className="size-4" />
                    <span className="text-xs font-medium">Не подтвержден</span>
                  </div>
                )}
              </div>
              {!user.emailVerified && onResendVerification && (
                <button
                  onClick={handleResendVerification}
                  disabled={verificationLoading}
                  className="mt-2 flex items-center gap-2 text-xs text-primary hover:text-primary/80 disabled:opacity-50"
                >
                  {verificationLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Mail className="size-3.5" />
                  )}
                  Отправить код подтверждения
                </button>
              )}
              
              {/* Кнопка смены email */}
              {!showChangeEmail ? (
                <button
                  onClick={() => setShowChangeEmail(true)}
                  className="mt-2 flex items-center gap-2 text-xs text-primary hover:text-primary/80"
                >
                  <RefreshCw className="size-3.5" />
                  Сменить email
                </button>
              ) : (
                <div className="mt-3 p-3 rounded-xl bg-muted/20 border border-border/30 space-y-3">
                  {emailChangeStep === 1 ? (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Новый Email</label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="new@example.com"
                          className="w-full mt-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      </div>
                      {emailError && (
                        <p className="text-xs text-red-500">{emailError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleRequestEmailChange}
                          disabled={changingEmail || !newEmail.trim()}
                          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {changingEmail && <Loader2 className="size-3.5 animate-spin" />}
                          Отправить код
                        </button>
                        <button
                          onClick={resetEmailChange}
                          disabled={changingEmail}
                          className="rounded-lg border border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/20 disabled:opacity-50"
                        >
                          Отмена
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Код отправлен на <strong className="text-foreground">{newEmail}</strong>
                      </p>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Код из письма</label>
                        <input
                          type="text"
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value.toUpperCase())}
                          placeholder="ABC123"
                          maxLength={6}
                          className="w-full mt-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 font-mono"
                        />
                      </div>
                      {emailError && (
                        <p className="text-xs text-red-500">{emailError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleConfirmEmailChange}
                          disabled={changingEmail || !emailCode.trim()}
                          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {changingEmail && <Loader2 className="size-3.5 animate-spin" />}
                          Подтвердить
                        </button>
                        <button
                          onClick={resetEmailChange}
                          disabled={changingEmail}
                          className="rounded-lg border border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/20 disabled:opacity-50"
                        >
                          Отмена
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Имя</label>
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full mt-1.5 rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200" 
              />
            </div>
            <button 
              onClick={handleSaveName}
              disabled={savingName || userName === (user.name || '')}
              className="w-full mt-2 rounded-xl bg-foreground py-2.5 text-sm font-medium text-background hover:bg-foreground/90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingName && <Loader2 className="size-4 animate-spin" />}
              Сохранить
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
          <div className="px-5 py-4 border-b border-border/30 bg-muted/20">
            <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="size-4 text-primary" />
              </div>
              Безопасность
            </h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-muted-foreground mb-4">
              Управление паролем от аккаунта на сайте
            </p>
            <button 
              onClick={onShowPasswordModal}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            >
              <RefreshCw className="size-4" />
              Сменить пароль
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#5865F2]/20 bg-card/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '175ms', animationFillMode: 'both' }}>
          <div className="px-5 py-4 border-b border-[#5865F2]/20 bg-[#5865F2]/5">
            <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
              <div className="size-8 rounded-lg bg-[#5865F2]/10 flex items-center justify-center">
                <DiscordIcon className="size-4 text-[#5865F2]" />
              </div>
              Discord
            </h2>
          </div>
          <div className="p-5">
            {showDiscordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                  <CheckCircle className="size-4" />
                  Discord успешно привязан!
                </p>
              </div>
            )}
            {discordLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                <span className="text-sm">Загрузка...</span>
              </div>
            ) : discordLinked && discordData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20">
                  <img
                    src={getDiscordAvatarUrl(discordData.discordId || '', discordData.avatar)}
                    alt="Discord Avatar"
                    className="size-16 rounded-full border-2 border-[#5865F2]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {discordData.globalName || discordData.username || 'Discord User'}
                    </p>
                    {discordData.username && (
                      <p className="text-sm text-muted-foreground truncate">
                        @{discordData.username}
                        {discordData.discriminator && discordData.discriminator !== '0' && (
                          <span className="text-[#5865F2]">#{discordData.discriminator}</span>
                        )}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      ID: {discordData.discordId}
                    </p>
                  </div>
                  <CheckCircle className="size-6 text-[#5865F2] flex-shrink-0" />
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-sm font-medium text-foreground mb-2">Доступные возможности:</p>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-[#5865F2]" />
                      Управление через Discord команды
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-[#5865F2]" />
                      Уведомления о серверах и платежах
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-[#5865F2]" />
                      Эксклюзивная роль на сервере
                    </li>
                  </ul>
                </div>
                <button
                  onClick={handleDiscordUnlink}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                >
                  <XCircle className="size-4" />
                  Отвязать Discord
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="size-16 rounded-2xl bg-[#5865F2]/10 flex items-center justify-center mx-auto mb-4">
                    <DiscordIcon className="size-8 text-[#5865F2]" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-2">Discord не привязан</p>
                  <p className="text-sm text-muted-foreground">
                    Привяжите Discord для управления через бота
                  </p>
                </div>
                
                {/* Переключатель присоединения к Discord серверу */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Вступить в Discord сервер</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Автоматически присоединиться к серверу поддержки
                      </p>
                    </div>
                    <button
                      onClick={() => setJoinDiscordServer(!joinDiscordServer)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        joinDiscordServer ? 'bg-[#5865F2]' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          joinDiscordServer ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleDiscordLink}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#4752C4] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <DiscordIcon className="size-4" />
                  Привязать через Discord
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  Безопасная авторизация через Discord OAuth
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="px-5 py-4 border-b border-border/30 bg-muted/20">
            <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Link2 className="size-4 text-primary" />
              </div>
              Панель управления серверами
            </h2>
          </div>
          <div className="p-5">
            {pteroAccount === null ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                <span className="text-sm">Загрузка...</span>
              </div>
            ) : !pteroAccount.linked ? (
              <div className="text-center py-6">
                <div className="size-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                  <Link2 className="size-7 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Создайте аккаунт для доступа к панели управления серверами
                </p>
                <button
                  onClick={onCreatePteroAccount}
                  disabled={pteroLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                >
                  {pteroLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Создать аккаунт
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/30">
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Check className="size-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{pteroAccount.username}</p>
                    <p className="text-sm text-muted-foreground truncate">{pteroAccount.email}</p>
                  </div>
                  <a
                    href={process.env.NEXT_PUBLIC_PTERODACTYL_URL || 'https://control.fluxor.solutions'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    <ExternalLink className="size-4" />
                    Открыть
                  </a>
                </div>
                
                {pteroPassword && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-muted-foreground font-medium mb-3">Ваш новый пароль:</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 rounded-xl bg-background border border-border/50 select-all">
                        <span className="text-base font-normal text-foreground">
                          {showPteroPassword ? pteroPassword : '••••••••••••'}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowPteroPassword(!showPteroPassword)}
                        className="size-11 rounded-xl flex items-center justify-center hover:bg-muted/50 hover:scale-105 active:scale-95 text-muted-foreground transition-all duration-200"
                        title={showPteroPassword ? "Скрыть" : "Показать"}
                      >
                        {showPteroPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                      <button
                        onClick={() => pteroPassword && onCopyToClipboard(pteroPassword)}
                        className="size-11 rounded-xl flex items-center justify-center hover:bg-muted/50 hover:scale-105 active:scale-95 text-muted-foreground transition-all duration-200"
                        title="Копировать"
                      >
                        <Copy className="size-5" />
                      </button>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={onResetPteroPassword}
                  disabled={pteroLoading}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5 text-sm text-foreground hover:bg-muted/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50"
                >
                  {pteroLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  Сбросить пароль панели
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-red-500/20 bg-red-500/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
          <div className="px-5 py-4 border-b border-red-500/20 bg-red-500/10">
            <h2 className="font-heading font-bold text-red-400 flex items-center gap-2">
              <div className="size-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <LogOut className="size-4 text-red-400" />
              </div>
              Опасная зона
            </h2>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Удалить аккаунт</p>
              <p className="text-xs text-muted-foreground mt-0.5">Все данные и серверы будут удалены навсегда</p>
            </div>
            <button 
              onClick={onShowDeleteAccountModal}
              className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>

      {showVerifyModal && (
        <VerifyEmailModal
          email={user.email}
          onClose={() => setShowVerifyModal(false)}
          onSuccess={handleVerificationSuccess}
        />
      )}
    </div>
  )
}
