'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Link as LinkIcon, Unlink } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

function DiscordLinkPageContent() {
  const searchParams = useSearchParams();
  const [discordId, setDiscordId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [currentLink, setCurrentLink] = useState<{ discordId: string, discordTag?: string } | null>(null);
  const [checkingLink, setCheckingLink] = useState(true);

  useEffect(() => {
    checkCurrentLink();

  
    const success = searchParams?.get('success');
    const error = searchParams?.get('error');

    if (success === 'linked') {
      setMessage({ type: 'success', text: 'Discord успешно привязан через OAuth!' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'discord_already_linked') {
      setMessage({ type: 'error', text: 'Этот Discord аккаунт уже привязан к другому пользователю' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'discord_link_failed') {
      setMessage({ type: 'error', text: 'Ошибка привязки Discord. Попробуйте снова' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  const checkCurrentLink = async () => {
    try {
      const res = await fetch('/api/user/discord/check');
      const data = await res.json();
      
      if (data.linked) {
        setCurrentLink({
          discordId: data.discordId,
          discordTag: data.discordTag
        });
      }
    } catch (error) {
      console.error('Ошибка проверки привязки:', error);
    } finally {
      setCheckingLink(false);
    }
  };

  const handleOAuthLink = () => {

    window.location.href = '/api/auth/discord?action=link';
  };

  const handleLink = async () => {
    if (!discordId.trim()) {
      setMessage({ type: 'error', text: 'Введите ваш Discord ID' });
      return;
    }

    
    if (!/^\d{17,19}$/.test(discordId.trim())) {
      setMessage({ type: 'error', text: 'Неверный формат Discord ID. Должно быть 17-19 цифр.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/discord/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: discordId.trim() })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Discord успешно привязан!' });
        setDiscordId('');
        await checkCurrentLink();
      } else {
        setMessage({ type: 'error', text: data.error || 'Ошибка привязки' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Вы уверены что хотите отвязать Discord? Вы потеряете доступ к командам бота.')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/discord/unlink', {
        method: 'POST'
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Discord успешно отвязан' });
        setCurrentLink(null);
      } else {
        setMessage({ type: 'error', text: data.error || 'Ошибка отвязки' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка соединения с сервером' });
    } finally {
      setLoading(false);
    }
  };

  if (checkingLink) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-6 w-6" />
            Привязка Discord
          </CardTitle>
          <CardDescription>
            Привяжите ваш Discord аккаунт для доступа к боту и уведомлениям
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {currentLink ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="font-medium">Discord привязан</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    ID: {currentLink.discordId}
                    {currentLink.discordTag && (
                      <span className="ml-2">({currentLink.discordTag})</span>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-medium">✨ Доступные возможности:</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Проверка баланса через Discord</li>
                  <li>• Просмотр серверов</li>
                  <li>• История транзакций</li>
                  <li>• Автоматические уведомления</li>
                  <li>• Эксклюзивная роль на сервере</li>
                </ul>
              </div>

              <Button
                variant="destructive"
                onClick={handleUnlink}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Отвязка...
                  </>
                ) : (
                  <>
                    <Unlink className="mr-2 h-4 w-4" />
                    Отвязать Discord
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Основной метод - OAuth */}
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  Рекомендуемый способ - OAuth
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Самый простой и безопасный способ. Нажмите кнопку и авторизуйтесь через Discord.
                </p>
                <Button
                  onClick={handleOAuthLink}
                  disabled={loading}
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
                >
                  <DiscordIcon className="mr-2 h-5 w-5" />
                  Привязать через Discord
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Или вручную
                  </span>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">📝 Как получить Discord ID:</h3>
                <ol className="text-sm space-y-1 text-muted-foreground mb-3">
                  <li>1. Откройте Discord</li>
                  <li>2. Настройки → Дополнительно → Включите "Режим разработчика"</li>
                  <li>3. ПКМ на свой профиль → "Копировать ID пользователя"</li>
                  <li>4. Вставьте ID в поле ниже</li>
                </ol>

                <div className="space-y-2">
                  <Label htmlFor="discordId">Discord ID</Label>
                  <Input
                    id="discordId"
                    type="text"
                    placeholder="123456789012345678"
                    value={discordId}
                    onChange={(e) => setDiscordId(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Должен быть 17-19 цифр
                  </p>
                </div>

                <Button
                  onClick={handleLink}
                  disabled={loading}
                  variant="outline"
                  className="w-full mt-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Привязка...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Привязать вручную
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-medium">Что вы получите:</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Управление балансом через Discord команды</li>
                  <li>• Просмотр ваших серверов</li>
                  <li>• Уведомления о платежах и серверах</li>
                  <li>• Эксклюзивная роль на Discord сервере</li>
                  <li>• Быстрая поддержка</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DiscordLinkPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <DiscordLinkPageContent />
    </Suspense>
  );
}
