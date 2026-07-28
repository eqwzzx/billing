'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Smartphone, Key, AlertCircle } from 'lucide-react'

interface TwoFactorInputProps {
  email: string
  onSuccess: (user: any) => void
  onCancel: () => void
}

export function TwoFactorInput({ email, onSuccess, onCancel }: TwoFactorInputProps) {
  const [code, setCode] = useState('')
  const [useBackup, setUseBackup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!code || (code.length !== 6 && code.length !== 8)) {
      setError('Введите корректный код')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token: code,
          useBackupCode: useBackup,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Неверный код')
        setLoading(false)
        return
      }

      onSuccess(data.user)
    } catch (err) {
      setError('Ошибка подключения к серверу')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {useBackup ? <Key className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
          Двухфакторная аутентификация
        </CardTitle>
        <CardDescription>
          {useBackup
            ? 'Введите один из резервных кодов'
            : 'Введите код из приложения аутентификации'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="2fa-code">
              {useBackup ? 'Резервный код' : 'Код подтверждения'}
            </Label>
            <Input
              id="2fa-code"
              type="text"
              maxLength={useBackup ? 8 : 6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s/g, '').toUpperCase())}
              placeholder={useBackup ? 'ABCD1234' : '123456'}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Проверка...' : 'Войти'}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setUseBackup(!useBackup)
                setCode('')
                setError('')
              }}
            >
              {useBackup ? 'Использовать код из приложения' : 'Использовать резервный код'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onCancel}
            >
              Вернуться к логину
            </Button>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              Откройте приложение аутентификации на вашем телефоне и введите 6-значный код.
              Если у вас нет доступа к приложению, используйте резервный код.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  )
}
