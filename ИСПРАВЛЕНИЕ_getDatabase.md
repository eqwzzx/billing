# 🚨 ИСПРАВЛЕНИЕ ОШИБКИ getDatabase

## Проблема

```
SyntaxError: The requested module './database.js' does not provide an export named 'getDatabase'
```

**Причина:** Файл `database.js` не экспортирует функцию `getDatabase`, которую использует `notifications.js`.

---

## ✅ РЕШЕНИЕ

### Способ 1: Автоматический (РЕКОМЕНДУЕТСЯ) ⚡

**Откройте PowerShell на Windows:**

```powershell
cd C:\Users\Babur\Desktop\Avelon-Web-main
.\Обновить-Бота-Срочно.ps1
```

Скрипт автоматически:
1. Скопирует исправленный `database.js` и `package.json`
2. Установит `@prisma/client`
3. Сгенерирует Prisma Client
4. Перезапустит бота
5. Покажет логи

---

### Способ 2: Ручное копирование

#### На Windows (PowerShell):

```powershell
cd C:\Users\Babur\Desktop\Avelon-Web-main\discord-bot

# Скопировать исправленные файлы
scp utils/database.js root@77.91.100.68:/var/www/billing/discord-bot/utils/
scp package.json root@77.91.100.68:/var/www/billing/discord-bot/
```

#### На VDS:

```bash
ssh root@77.91.100.68

cd /var/www/billing/discord-bot

# Установить @prisma/client
npm install @prisma/client

# Сгенерировать Prisma Client (из корня проекта)
cd /var/www/billing
npx prisma generate

# Вернуться в папку бота
cd discord-bot

# Зарегистрировать команды
node deploy-commands.js

# Перезапустить бота
pm2 restart fluxor-bot

# Проверить логи
pm2 logs fluxor-bot --lines 50
```

---

### Способ 3: Ручное редактирование на VDS

Если не можете скопировать файлы, отредактируйте вручную:

```bash
ssh root@77.91.100.68
nano /var/www/billing/discord-bot/utils/database.js
```

**Добавьте в начало (после импортов):**

```javascript
import { PrismaClient } from '@prisma/client';
```

**Добавьте новую переменную:**

```javascript
let prisma;
```

**Добавьте новую функцию (перед `closeDbConnection`):**

```javascript
export async function getDatabase() {
  if (!prisma) {
    prisma = new PrismaClient();
    console.log('✅ Prisma client initialized');
  }
  return prisma;
}
```

**Обновите функцию `closeDbConnection` (добавьте в конец):**

```javascript
export async function closeDbConnection() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database pool closed');
  }
  
  // Добавьте это:
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    console.log('✅ Prisma client disconnected');
  }
}
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

**Затем:**

```bash
cd /var/www/billing/discord-bot
npm install @prisma/client

cd /var/www/billing
npx prisma generate

cd discord-bot
pm2 restart fluxor-bot
pm2 logs fluxor-bot
```

---

## 🔍 ЧТО БЫЛО ИСПРАВЛЕНО

### 1. Добавлена функция `getDatabase()`

**БЫЛО:**
```javascript
// Только getDbConnection()
export async function getDbConnection() { ... }
```

**СТАЛО:**
```javascript
// Добавлена getDatabase() для Prisma
export async function getDatabase() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
```

### 2. Добавлен @prisma/client в зависимости

**package.json:**
```json
"dependencies": {
  "@prisma/client": "^6.4.0",  // ← Добавлено
  "bcryptjs": "^2.4.3",
  "discord.js": "^14.14.1",
  ...
}
```

---

## ✅ ПРОВЕРКА

### Логи должны показать:

```bash
pm2 logs fluxor-bot --lines 50
```

**Ожидаемый вывод:**
```
✅ Prisma client initialized
✅ Подключен к базе данных MySQL
✅ Logged in as botiks#0793
✅ Webhook сервер запущен на порту 3001
```

**Без ошибок:**
- ❌ "does not provide an export named 'getDatabase'"
- ❌ "Cannot find module '@prisma/client'"

### Статус бота в Discord

Бот должен быть **онлайн** (зелёный статус).

### Тест команды

В Discord напишите:
```
/help
```

Бот должен ответить списком команд.

---

## 🐛 ЕСЛИ ОШИБКА ОСТАЁТСЯ

### Ошибка: "Cannot find module '@prisma/client'"

```bash
cd /var/www/billing/discord-bot
npm install @prisma/client --save
cd /var/www/billing
npx prisma generate
pm2 restart fluxor-bot
```

### Ошибка: "Prisma schema not found"

```bash
# Проверьте, что schema.prisma существует
ls -la /var/www/billing/prisma/schema.prisma

# Если нет, скопируйте из Windows
scp C:\Users\Babur\Desktop\Avelon-Web-main\prisma\schema.prisma root@77.91.100.68:/var/www/billing/prisma/

# Сгенерируйте заново
cd /var/www/billing
npx prisma generate
pm2 restart fluxor-bot
```

### Ошибка подключения к БД

```bash
# Проверьте DATABASE_URL
cat /var/www/billing/discord-bot/.env | grep DATABASE_URL

# Должно быть:
# DATABASE_URL="mysql://fluxor:PASSWORD@localhost:3306/fluxor"

# Проверьте подключение
mysql -u fluxor -p fluxor -e "SELECT 1;"
```

---

## 📊 ПОЛНАЯ ПЕРЕУСТАНОВКА (ЕСЛИ НИЧЕГО НЕ ПОМОГЛО)

```bash
ssh root@77.91.100.68

# Удалить node_modules
cd /var/www/billing/discord-bot
rm -rf node_modules package-lock.json

# Переустановить всё
npm install

# Сгенерировать Prisma
cd /var/www/billing
npx prisma generate

# Регистрация команд
cd discord-bot
node deploy-commands.js

# Перезапуск
pm2 restart fluxor-bot
pm2 logs fluxor-bot
```

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

- `ИСПРАВИТЬ_БОТА.md` - общие проблемы с ботом
- `ЗАПУСК_БОТА_VDS.md` - полная инструкция по запуску
- `КОМАНДЫ-VDS.md` - справочник команд

---

**Используйте скрипт `Обновить-Бота-Срочно.ps1` для быстрого исправления!** 🚀
