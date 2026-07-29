'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Loader2, KeyRound, Shield } from 'lucide-react'

interface TwoFactorPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (token: string, useBackupCode: boolean) => Promise<void>
  title?: string
  description?: string
}

export function TwoFactorPromptModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Требуется 2FA код',
  description = 'Введите код из приложения аутентификации',
}: TwoFactorPromptModalProps) {
  const [code, setCode] = useState(['', '', '', '', '', '', '', ''])
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setTimeout(() => setIsAnimating(true), 10)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } else {
      setIsAnimating(false)
      setTimeout(() => setIsVisible(false), 400)
    }
  }, [isOpen])

  useEffect(() => {
    if (error) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }, [error])

  // Сброс при смене типа кода
  useEffect(() => {
    setCode(useBackupCode ? ['', '', '', '', '', '', '', ''] : ['', '', '', '', '', ''])
    setError('')
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }, [useBackupCode])

  if (!isVisible) return null

  const maxLength = useBackupCode ? 8 : 6
  const displayCode = useBackupCode ? code : code.slice(0, 6)

  const handleCodeChange = (index: number, value: string) => {
    const pattern = useBackupCode ? /^[A-Z0-9]*$/i : /^\d*$/
    if (!pattern.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1).toUpperCase()
    setCode(newCode)
    setError('')

    // Auto-focus next input
    if (value && index < maxLength - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (newCode.slice(0, maxLength).every(d => d)) {
      handleSubmit(newCode.slice(0, maxLength).join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pattern = useBackupCode ? /[^A-Z0-9]/gi : /\D/g
    const pasted = e.clipboardData.getData('text').replace(pattern, '').slice(0, maxLength).toUpperCase()

    if (pasted.length === maxLength) {
      const newCode = pasted.split('')
      setCode([...newCode, '', '', '', '', '', '', '', ''].slice(0, 8))
      handleSubmit(pasted)
    }
  }

  const handleSubmit = async (codeStr: string) => {
    setLoading(true)
    setError('')

    try {
      await onSubmit(codeStr, useBackupCode)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код')
      setCode(useBackupCode ? ['', '', '', '', '', '', '', ''] : ['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
    setLoading(false)
  }

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
      setCode(['', '', '', '', '', '', '', ''])
      setError('')
      setUseBackupCode(false)
    }, 400)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-400 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-sm transition-all duration-400 ease-out ${
          isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        } ${shake ? 'animate-shake' : ''}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-border">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-muted/50 hover:bg-red-500/20 group"
          >
            <X className="size-4 text-muted-foreground group-hover:text-red-500" />
          </button>

          <div className="relative p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="size-8 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground mb-1">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {useBackupCode
                  ? 'Введите резервный код (8 символов)'
                  : description}
              </p>
            </div>

            {/* Error */}
            <div
              className={`overflow-hidden transition-all duration-300 ${error ? 'max-h-20 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}
            >
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                {error}
              </div>
            </div>

            {/* Code inputs */}
            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
              {displayCode.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode={useBackupCode ? 'text' : 'numeric'}
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  disabled={loading}
                  className={`${useBackupCode ? 'w-10 h-12 text-xl' : 'w-12 h-14 text-2xl'} text-center font-bold bg-background/50 border-2 border-border/40 rounded-xl focus:border-primary focus:outline-none focus:shadow-[0_0_0_4px_rgba(var(--primary),0.1)] transition-all disabled:opacity-50 uppercase`}
                />
              ))}
            </div>

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Проверяем...</span>
              </div>
            )}

            {/* Toggle backup code */}
            <div className="text-center mb-4">
              <button
                onClick={() => setUseBackupCode(!useBackupCode)}
                disabled={loading}
                className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
              >
                {useBackupCode ? 'Использовать код из приложения' : 'Использовать резервный код'}
              </button>
            </div>

            {/* Info */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30 text-muted-foreground text-xs text-center">
              {useBackupCode
                ? 'Каждый резервный код можно использовать только один раз'
                : 'Откройте Google Authenticator и введите 6-значный код'}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  )
}
