# 🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМ С DISCORD

## Проблемы

1. **Настройки не сохраняются** - после обновления страницы "обязательная привязка Discord" выключается
2. **Неправильный редирект** - после привязки Discord редиректит на `localhost:3000` вместо реального домена  
3. **Discord отвязывается** - привязка не сохраняется

---

## ✅ РЕШЕНИЕ

### Проблема 1: Настройки не сохраняются

**Причина:** При загрузке админки не загружается настройка `discordRequired` из базы данных.

**Исправление необходимо в `/app/admin/page.tsx`:**

В функции `loadGlobalDiscount` добавить загрузку `discordRequired`:

```typescript
const loadGlobalDiscount = async () => { 
  try { 
    const r = await fetch('/api/admin/settings'); 
    if (r.ok) { 
      const d = await r.json(); 
      const disc = d.find((s: { key: string }) => s.key === 'globalDiscount'); 
      setGlobalDiscount(disc ? parseFloat(disc.value) : 0); 
      
      const snow = d.find((s: { key: string }) => s.key === 'snowEnabled'); 
      setSnowEnabled(snow?.value === 'true'); 
      
      const maintenance = d.find((s: { key: string }) => s.key === 'maintenanceMode'); 
      setMaintenanceMode(maintenance?.value === 'true'); 
      
      const serverDisabled = d.find((s: { key: string }) => s.key === 'serverCreationDisabled'); 
      setServerCreationDisabled(serverDisabled?.value === 'true'); 
      
      // ← ДОБАВИТЬ ЭТИ СТРОКИ:
      const discordReq = d.find((s: { key: string }) => s.key === 'discordRequired');
      setDiscordRequired(discordReq?.value === 'true');
      
      const coreLimit = d.find((s: { key: string }) => s.key === 'vdsCoreLimit'); 
      setVdsCoreLimit(coreLimit ? parseInt(coreLimit.value) : 100); 
      return true 
    } 
  } catch {} 
  return false 
}
```

Также нужно добавить состояние в начале компонента:

```typescript
const [discordRequired, setDiscordRequired] = useState(false)
```

И передать в SettingsTab:

```typescript
<SettingsTab
  plans={plans}
  eggs={eggs}
  promos={promos}
  globalDiscount={globalDiscount}
  snowEnabled={snowEnabled}
  maintenanceMode={maintenanceMode}
  serverCreationDisabled={serverCreationDisabled}
  discordRequired={discordRequired}  // ← ДОБАВИТЬ ЭТУ СТРОКУ
  onLoadPlans={loadPlans}
  onLoadPromos={loadPromos}
/>
```

---

### Проблема 2: Неправильный редирект на localhost

**Причина:** В `/app/api/auth/discord/callback/route.ts` используется `request.url` для редиректа, который содержит localhost.

**Исправление:**

Строка 248:

```typescript
// БЫЛО:
return NextResponse.redirect(
  new URL(`/client/settings?discord=linked`, request.url)
);

// СТАЛО:
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url;
return NextResponse.redirect(
  new URL(`/client/settings?discord=linked`, baseUrl)
);
```

Аналогично для всех редиректов в этом файле (строки 31, 39, 131, 143, 217, 228, 236, 248, 253).

**Полное исправление функции `handleDiscordLink`:**

```typescript
async function handleDiscordLink(request: NextRequest, discordUser: DiscordUser) {
  console.log('[Discord Link] Starting link process for user:', discordUser.id);
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://77.91.100.68:3000';
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log('[Discord Link] All cookies:', allCookies.map(c => c.name));
  
  const token = cookieStore.get('auth-token')?.value;

  console.log('[Discord Link] Token found:', !!token);

  if (!token) {
    console.error('[Discord Link] No authentication token found');
    return NextResponse.redirect(
      new URL(`/?error=not_authenticated`, baseUrl)
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    console.log('[Discord Link] Authenticated user ID:', decoded.userId);
    
    const existingDiscordUser = await prisma.user.findUnique({
      where: { discordId: discordUser.id },
    });

    if (existingDiscordUser && existingDiscordUser.id !== decoded.userId) {
      console.error('[Discord Link] Discord ID already linked to another account');
      return NextResponse.redirect(
        new URL(`/client/settings?error=discord_already_linked`, baseUrl)
      );
    }

    console.log('[Discord Link] Updating user record...');
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { 
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordDiscriminator: discordUser.discriminator,
        discordAvatar: discordUser.avatar || null,
        discordGlobalName: discordUser.global_name || null,
      },
    });
    console.log('[Discord Link] User record updated successfully');

    console.log('[Discord Link] Giving Discord role...');
    await giveDiscordRole(discordUser.id);
    console.log('[Discord Link] Discord role given successfully');

    console.log('[Discord Link] Redirecting to settings page');
    return NextResponse.redirect(
      new URL(`/client/settings?discord=linked`, baseUrl)
    );
  } catch (error) {
    console.error('[Discord Link] Error:', error);
    return NextResponse.redirect(
      new URL(`/?error=discord_link_failed`, baseUrl)
    );
  }
}
```

---

### Проблема 3: Discord отвязывается

**Возможные причины:**

1. **Проблема с cookie** - `auth-token` не передаётся при редиректе
2. **Ошибка в giveDiscordRole** - если эта функция падает, транзакция откатывается
3. **Проблема с базой данных** - запись не сохраняется

**Диагностика:**

На VDS выполните:

```bash
# Проверьте логи PM2
pm2 logs fluxor-web | grep "Discord Link"

# Проверьте базу данных
mysql -u fluxor -p fluxor -e "SELECT id, email, discordId, discordUsername FROM User WHERE discordId IS NOT NULL LIMIT 10;"
```

**Если привязка сохраняется, но потом исчезает:**

Проверьте, нет ли кода, который очищает `discordId`. Выполните поиск:

```bash
cd /var/www/billing
grep -r "discordId: null" app/
grep -r "discordId = null" app/
```

---

## 🚀 БЫСТРОЕ ПРИМЕНЕНИЕ

### Шаг 1: Исправить Discord callback

Скопируйте исправленный файл на VDS:

```powershell
# В PowerShell на Windows
scp "C:\Users\Babur\Desktop\Avelon-Web-main\app\api\auth\discord\callback\route.ts" root@77.91.100.68:/var/www/billing/app/api/auth/discord/callback/
```

### Шаг 2: Проверить .env на VDS

```bash
ssh root@77.91.100.68
cat /var/www/billing/.env | grep NEXT_PUBLIC_APP_URL
```

Должно быть:
```
NEXT_PUBLIC_APP_URL="http://77.91.100.68:3000"
```

Если нет, добавьте:

```bash
nano /var/www/billing/.env
```

Добавьте строку:
```
NEXT_PUBLIC_APP_URL="http://77.91.100.68:3000"
```

### Шаг 3: Пересоберите и перезапустите

```bash
cd /var/www/billing
rm -rf .next
npm run build
pm2 restart fluxor-web
pm2 logs fluxor-web --lines 50
```

---

## 🧪 ТЕСТИРОВАНИЕ

### Тест 1: Настройки сохраняются

1. Откройте админ панель
2. Перейдите в "Настройки"
3. Включите "Обязательная привязка Discord"
4. Обновите страницу (F5)
5. Проверьте, что настройка осталась включённой ✅

### Тест 2: Редирект на правильный домен

1. Перейдите в настройки профиля
2. Нажмите "Привязать Discord"
3. Авторизуйтесь в Discord
4. После редиректа URL должен быть: `http://77.91.100.68:3000/client/settings?discord=linked` ✅

### Тест 3: Discord остаётся привязанным

1. Привяжите Discord
2. Обновите страницу несколько раз
3. Discord должен оставаться привязанным ✅

Проверьте в базе данных:

```bash
mysql -u fluxor -p fluxor -e "SELECT email, discordId, discordUsername FROM User WHERE email='your@email.com';"
```

`discordId` должен быть заполнен и не меняться.

---

## 🐛 ДОПОЛНИТЕЛЬНАЯ ДИАГНОСТИКА

### Если настройки всё ещё не сохраняются

**Проверьте API:**

```bash
# На VDS
curl -X GET http://localhost:3000/api/admin/settings \
  -H "Cookie: auth-token=YOUR_TOKEN"

# Должен вернуть массив настроек, включая discordRequired
```

**Проверьте таблицу AdminSettings:**

```sql
mysql -u fluxor -p fluxor

SELECT * FROM AdminSettings WHERE `key` = 'discordRequired';
```

Если записи нет, создайте вручную:

```sql
INSERT INTO AdminSettings (id, `key`, value, updatedAt) 
VALUES (UUID(), 'discordRequired', 'false', NOW());
```

### Если редирект всё ещё на localhost

**Проверьте переменную окружения:**

```bash
pm2 logs fluxor-web | grep "NEXT_PUBLIC_APP_URL"
```

**Если пустая, PM2 не видит .env. Перезапустите:**

```bash
pm2 delete fluxor-web
pm2 start ecosystem.config.js
```

### Если Discord отвязывается

**Проверьте giveDiscordRole:**

```bash
pm2 logs fluxor-bot | grep "role"
```

Если ошибки, бот может не работать. Проверьте:

```bash
pm2 status | grep fluxor-bot
```

Если бот не запущен, запустите:

```bash
cd /var/www/billing/discord-bot
pm2 start index.js --name fluxor-bot
```

---

## 📚 ФАЙЛЫ ДЛЯ ИЗМЕНЕНИЯ

1. `app/api/auth/discord/callback/route.ts` - исправить редирект
2. `app/admin/page.tsx` - добавить загрузку discordRequired
3. `.env` - добавить NEXT_PUBLIC_APP_URL

---

**После всех исправлений перезапустите приложение и протестируйте!** 🚀
