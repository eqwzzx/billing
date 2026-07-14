# 🤖 ЗАПУСК DISCORD БОТА НА VDS

Полная инструкция по настройке и запуску Discord бота через PM2 на production сервере.

---

## 📋 ЧТО НУЖНО ПЕРЕД ЗАПУСКОМ

- ✅ Discord бот создан на [Discord Developer Portal](https://discord.com/developers/applications)
- ✅ Бот добавлен на сервер с нужными правами
- ✅ VDS настроен и работает веб-приложение
- ✅ PM2 установлен (`npm install -g pm2`)

---

## 🚀 БЫСТРЫЙ ЗАПУСК (1 команда)

Подключитесь к VDS и выполните:

```bash
ssh root@77.91.100.68

cd /var/www/billing/discord-bot

# Установка зависимостей
npm install

# Регистрация команд Discord
node deploy-commands.js

# Запуск через PM2
pm2 start index.js --name fluxor-bot

# Проверка
pm2 logs fluxor-bot
```

---

## 📝 ПОШАГОВАЯ ИНСТРУКЦИЯ

### 1️⃣ Подключитесь к VDS

```bash
ssh root@77.91.100.68
cd /var/www/billing
```

### 2️⃣ Настройте .env файл бота

```bash
nano discord-bot/.env
```

**Вставьте настройки:**

```env
# Discord Bot Configuration
DISCORD_TOKEN="MTUyNTc3MzI3NjY0MTQ5NzIzMA.G4ACSu.MkwSznJVDwgEeWmq8Ok1th93gq441wK4NfSiF0"
DISCORD_CLIENT_ID="1525773276641497230"
DISCORD_GUILD_ID="1525774593355419669"
DISCORD_OAUTH_CLIENT_SECRET="y8mpn4Gm-wx2-cgaR-oATxrTeI3Z9GdM"

# Verified Role
DISCORD_VERIFIED_ROLE_ID="1525774705955573760"

# Database (должен совпадать с основным .env)
DATABASE_URL="mysql://fluxor:YOUR_PASSWORD@localhost:3306/fluxor"

# Bot Settings
BOT_PREFIX="!"
ADMIN_DISCORD_IDS="YOUR_DISCORD_ID"

# Website URL
NEXT_PUBLIC_APP_URL="http://77.91.100.68:3000"
```

**ВАЖНО:** Замените:
- `YOUR_PASSWORD` - пароль от базы данных
- `YOUR_DISCORD_ID` - ваш Discord ID (для админских команд)

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### 3️⃣ Установите зависимости

```bash
cd /var/www/billing/discord-bot
npm install
```

### 4️⃣ Зарегистрируйте команды Discord

```bash
node deploy-commands.js
```

**Ожидаемый вывод:**
```
Started refreshing 15 application (/) commands.
Successfully reloaded 15 application (/) commands.
```

### 5️⃣ Запустите бота через PM2

```bash
pm2 start index.js --name fluxor-bot
```

### 6️⃣ Проверьте статус

```bash
pm2 status
```

Должно быть:
```
┌─────┬────────────────┬─────────┬─────────┐
│ id  │ name           │ status  │ restart │
├─────┼────────────────┼─────────┼─────────┤
│ 0   │ fluxor-web     │ online  │ 5       │
│ 1   │ fluxor-bot     │ online  │ 0       │
└─────┴────────────────┴─────────┴─────────┘
```

### 7️⃣ Проверьте логи

```bash
pm2 logs fluxor-bot --lines 50
```

**Ожидаемый вывод:**
```
✅ Подключен к базе данных MySQL
✅ Logged in as botiks#0793
✅ Webhook сервер запущен на порту 3001
```

### 8️⃣ Сохраните конфигурацию PM2

```bash
pm2 save
```

---

## 🔧 ИСПОЛЬЗОВАНИЕ ECOSYSTEM.CONFIG.JS (РЕКОМЕНДУЕТСЯ)

Если у вас уже есть файл `ecosystem.config.js`, бот должен быть там настроен.

### Проверка конфигурации

```bash
cat /var/www/billing/ecosystem.config.js
```

Должен содержать:

```javascript
module.exports = {
  apps: [
    {
      name: 'fluxor-web',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/billing',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'fluxor-bot',
      script: 'index.js',
      cwd: '/var/www/billing/discord-bot',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/fluxor-bot-error.log',
      out_file: '/var/log/pm2/fluxor-bot-out.log',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
}
```

### Запуск через ecosystem

```bash
cd /var/www/billing

# Остановить все процессы
pm2 delete all

# Запустить через ecosystem
pm2 start ecosystem.config.js

# Сохранить
pm2 save
```

---

## 🧪 ПРОВЕРКА РАБОТЫ БОТА

### 1. Проверьте статус на Discord сервере

Бот должен быть **онлайн** (зелёный статус).

### 2. Протестируйте команду

В любом канале Discord напишите:

```
/help
```

Бот должен ответить списком команд.

### 3. Проверьте webhook сервер

```bash
curl http://localhost:3001/webhook
```

Должен вернуть:
```json
{"error":"Method not allowed"}
```

Это нормально - webhook работает!

---

## 📊 УПРАВЛЕНИЕ БОТОМ

### Основные команды PM2

```bash
# Просмотр логов
pm2 logs fluxor-bot

# Последние 50 строк
pm2 logs fluxor-bot --lines 50

# Только ошибки
pm2 logs fluxor-bot --err

# Перезапуск
pm2 restart fluxor-bot

# Остановка
pm2 stop fluxor-bot

# Запуск
pm2 start fluxor-bot

# Удаление из PM2
pm2 delete fluxor-bot

# Статус
pm2 status

# Информация о процессе
pm2 show fluxor-bot

# Мониторинг в реальном времени
pm2 monit
```

---

## 🔄 ОБНОВЛЕНИЕ БОТА

### После изменения кода

```bash
cd /var/www/billing/discord-bot

# Остановить бота
pm2 stop fluxor-bot

# Обновить зависимости (если нужно)
npm install

# Перерегистрировать команды (если изменились)
node deploy-commands.js

# Запустить заново
pm2 restart fluxor-bot

# Проверить логи
pm2 logs fluxor-bot --lines 30
```

---

## 🐛 ДИАГНОСТИКА ПРОБЛЕМ

### Проблема 1: Бот не запускается

**Проверьте логи:**
```bash
pm2 logs fluxor-bot --err --lines 100
```

**Частые причины:**
- Неверный `DISCORD_TOKEN`
- Отсутствует `DATABASE_URL`
- Не установлены зависимости (`npm install`)

### Проблема 2: "Cannot find module 'discord.js'"

```bash
cd /var/www/billing/discord-bot
npm install
pm2 restart fluxor-bot
```

### Проблема 3: Ошибка подключения к БД

**Проверьте DATABASE_URL:**
```bash
cat discord-bot/.env | grep DATABASE_URL
```

Должен совпадать с основным .env:
```bash
cat .env | grep DATABASE_URL
```

### Проблема 4: Команды не регистрируются

```bash
cd /var/www/billing/discord-bot
node deploy-commands.js
```

Если ошибка, проверьте:
- `DISCORD_TOKEN` правильный
- `DISCORD_CLIENT_ID` правильный
- Бот имеет права `applications.commands`

### Проблема 5: Webhook сервер не работает

**Проверьте порт 3001:**
```bash
netstat -tulpn | grep 3001
lsof -i :3001
```

**Проверьте логи:**
```bash
pm2 logs fluxor-bot | grep "Webhook"
```

Должно быть:
```
✅ Webhook сервер запущен на порту 3001
```

---

## 🔒 НАСТРОЙКА .ENV НА PRODUCTION

### Основной .env (/var/www/billing/.env)

Добавьте/обновите:

```bash
nano /var/www/billing/.env
```

```env
# Discord OAuth (для авторизации на сайте)
DISCORD_OAUTH_CLIENT_ID="1525773276641497230"
DISCORD_OAUTH_CLIENT_SECRET="y8mpn4Gm-wx2-cgaR-oATxrTeI3Z9GdM"
DISCORD_OAUTH_REDIRECT_URI="http://77.91.100.68:3000/api/auth/discord/callback"

# Discord Bot Webhook
DISCORD_BOT_WEBHOOK_URL="http://localhost:3001/webhook"
INTERNAL_WEBHOOK_SECRET="fluxor-internal-webhook"
```

### .env бота (/var/www/billing/discord-bot/.env)

```bash
nano /var/www/billing/discord-bot/.env
```

```env
DISCORD_TOKEN="MTUyNTc3MzI3NjY0MTQ5NzIzMA.G4ACSu.MkwSznJVDwgEeWmq8Ok1th93gq441wK4NfSiF0"
DISCORD_CLIENT_ID="1525773276641497230"
DISCORD_GUILD_ID="1525774593355419669"
DISCORD_VERIFIED_ROLE_ID="1525774705955573760"
DATABASE_URL="mysql://fluxor:YOUR_PASSWORD@localhost:3306/fluxor"
BOT_PREFIX="!"
ADMIN_DISCORD_IDS="YOUR_DISCORD_ID"
NEXT_PUBLIC_APP_URL="http://77.91.100.68:3000"
```

**После изменения .env:**
```bash
pm2 restart fluxor-web
pm2 restart fluxor-bot
```

---

## 📝 БЫСТРАЯ СПРАВКА

### Один файл для запуска всего

Создайте скрипт `start-all.sh`:

```bash
nano /var/www/billing/start-all.sh
```

```bash
#!/bin/bash
cd /var/www/billing

echo "🚀 Запуск всех сервисов..."

# Запуск через ecosystem
pm2 start ecosystem.config.js

# Сохранение
pm2 save

# Статус
pm2 status

echo "✅ Готово!"
```

Сделайте исполняемым:
```bash
chmod +x /var/www/billing/start-all.sh
```

Использование:
```bash
/var/www/billing/start-all.sh
```

---

## ✅ КОНТРОЛЬНЫЙ СПИСОК

- [ ] `.env` бота настроен
- [ ] Зависимости установлены (`npm install`)
- [ ] Команды зарегистрированы (`node deploy-commands.js`)
- [ ] Бот запущен через PM2 (`pm2 start index.js --name fluxor-bot`)
- [ ] Бот показывает статус "online" (`pm2 status`)
- [ ] Бот онлайн в Discord (зелёный статус)
- [ ] Команды работают (тест `/help`)
- [ ] Webhook сервер работает (порт 3001)
- [ ] Конфигурация сохранена (`pm2 save`)

---

## 🔗 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

- `DISCORD_NOTIFICATIONS.md` - настройка системы уведомлений
- `КОМАНДЫ-VDS.md` - все команды для управления VDS
- `discord-bot/СТАРТ.md` - запуск бота локально

---

**Удачи! 🚀**
