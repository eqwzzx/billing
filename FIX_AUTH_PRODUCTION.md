# 🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ АВТОРИЗАЦИИ НА PRODUCTION

## Проблема
Пользователь успешно входит в систему (LOGIN_SUCCESS в логах), но `/api/auth/me` возвращает 401 Unauthorized.

## Причина
1. **Cookie не устанавливается**: В production `secure: true` требует HTTPS, но сайт работает на HTTP
2. **Проверка authEnabled**: База данных не содержит корректную запись `AdminSettings.authEnabled`

## Решение

### ✅ Изменения уже внесены в код:
1. Изменён `secure: true` → `secure: false` в `/app/api/auth/login/route.ts`
2. Временно отключена проверка `isAuthEnabled()` в login и me endpoints
3. Добавлены debug логи для отслеживания cookie

### 📋 Шаги для применения на VDS:

#### 1️⃣ Подключитесь к VDS по SSH
```bash
ssh root@77.91.100.68
```

#### 2️⃣ Перейдите в директорию проекта
```bash
cd /var/www/billing
```

#### 3️⃣ Создайте резервную копию
```bash
cp app/api/auth/login/route.ts app/api/auth/login/route.ts.backup
cp app/api/auth/me/route.ts app/api/auth/me/route.ts.backup
```

#### 4️⃣ Загрузите обновлённые файлы
Есть несколько способов:

**Вариант A: Через Git (если настроен репозиторий)**
```bash
git pull origin main
```

**Вариант B: Через SCP с вашего компьютера**
Откройте PowerShell на вашем компьютере:
```powershell
# Скопировать login route
scp "C:\Users\Babur\Desktop\Avelon-Web-main\app\api\auth\login\route.ts" root@77.91.100.68:/var/www/billing/app/api/auth/login/

# Скопировать me route
scp "C:\Users\Babur\Desktop\Avelon-Web-main\app\api\auth\me\route.ts" root@77.91.100.68:/var/www/billing/app/api/auth/me/
```

**Вариант C: Через Remote SSH в VS Code**
1. В VS Code откройте Remote SSH к вашему VDS
2. Скопируйте содержимое файлов вручную
3. Вставьте в соответствующие файлы на сервере

#### 5️⃣ Пересоберите проект
```bash
cd /var/www/billing
rm -rf .next
npm run build
```

#### 6️⃣ Перезапустите приложение
```bash
pm2 restart fluxor-web
```

#### 7️⃣ Проверьте логи
```bash
pm2 logs fluxor-web --lines 50
```

#### 8️⃣ Протестируйте авторизацию

**Откройте браузер в режиме инкогнито** и перейдите на:
```
http://77.91.100.68:3000
```

Попробуйте войти. В логах должны появиться сообщения:
```
=== /api/auth/me DEBUG ===
All cookies: [...]
✅ Token found, length: XXX
✅ Token decoded, userId: XXX
✅ User authenticated: user@email.com
```

---

## 🔍 Диагностика

### Проверка cookie в браузере
1. Откройте DevTools (F12)
2. Перейдите в Application → Cookies
3. Проверьте наличие cookie `auth-token`

### Проверка через curl
```bash
# 1. Сначала получите cookie при логине
curl -v -X POST http://77.91.100.68:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eqwzzx.wtf","password":"123456@"}' \
  -c cookies.txt

# 2. Используйте cookie для проверки /me
curl -v http://77.91.100.68:3000/api/auth/me \
  -b cookies.txt
```

Должны увидеть `Set-Cookie: auth-token=...` в первом запросе.

---

## 🚨 Важные замечания

### После настройки SSL/HTTPS
Когда настроите HTTPS с Let's Encrypt (см. `PRODUCTION_DEPLOY.md`), **обязательно** измените обратно:

В `app/api/auth/login/route.ts` строка ~107:
```typescript
secure: false,  // ← ИЗМЕНИТЬ НА true
```

### Проблема AdminSettings
Таблица `AdminSettings` имеет проблему с полем `id` (требует cuid, нет default value).

**Временное решение**: Проверка `isAuthEnabled()` отключена в коде.

**Постоянное решение**: Обновить схему Prisma:
```prisma
model AdminSettings {
  id        String   @id @default(cuid())  // ← добавить @default(cuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}
```

Затем:
```bash
npx prisma db push
```

После этого можно включить обратно проверку `isAuthEnabled()` в коде.

---

## 📊 Проверка статуса

### Ожидаемое поведение
- ✅ Login возвращает 200 и устанавливает cookie `auth-token`
- ✅ `/api/auth/me` возвращает 200 и данные пользователя
- ✅ В логах видны debug сообщения с информацией о cookies
- ✅ Cookie видна в DevTools браузера

### Если всё ещё не работает
1. Проверьте, что NODE_ENV не установлен в 'development':
   ```bash
   cat /var/www/billing/.env | grep NODE_ENV
   ```
   
2. Проверьте, что JWT_SECRET настроен:
   ```bash
   cat /var/www/billing/.env | grep JWT_SECRET
   ```

3. Проверьте логи PM2 на ошибки:
   ```bash
   pm2 logs fluxor-web --err --lines 100
   ```

4. Убедитесь, что сборка прошла успешно:
   ```bash
   ls -la /var/www/billing/.next
   ```

---

## 🎯 Резюме изменений

| Файл | Изменение | Причина |
|------|-----------|---------|
| `app/api/auth/login/route.ts` | `secure: false` | HTTP не поддерживает secure cookies |
| `app/api/auth/login/route.ts` | Отключена проверка `isAuthEnabled()` | База данных не готова |
| `app/api/auth/me/route.ts` | Отключена проверка `isAuthEnabled()` | База данных не готова |
| `app/api/auth/me/route.ts` | Добавлены debug логи | Диагностика проблемы с cookies |

---

Если проблема сохраняется, проверьте логи с помощью:
```bash
pm2 logs fluxor-web --lines 200
```

И отправьте вывод для дальнейшей диагностики.
