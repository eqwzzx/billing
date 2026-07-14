# 🚀 ЗАПУСК FLUXOR НА PRODUCTION VDS (Ubuntu Linux)

Полное руководство по развертыванию Fluxor на VDS с Ubuntu 20.04/22.04 в production режиме

> ⚠️ **КРИТИЧЕСКИ ВАЖНО**: Перед первым запуском необходимо исправить проблему с авторизацией!  
> По умолчанию авторизация не будет работать на HTTP (требуется либо HTTPS, либо изменение настроек cookies).
> 
> **См. инструкции:**
> - `БЫСТРОЕ_ИСПРАВЛЕНИЕ.md` - для быстрого применения патча
> - `FIX_AUTH_PRODUCTION.md` - для подробного понимания проблемы

---

## 📋 Содержание

1. [Подготовка VDS](#подготовка-vds)
2. [Установка необходимого ПО](#установка-необходимого-по)
3. [Настройка MySQL](#настройка-mysql)
4. [Загрузка проекта](#загрузка-проекта)
5. [Настройка переменных окружения](#настройка-переменных-окружения)
6. [Сборка и запуск](#сборка-и-запуск)
7. [Настройка PM2 (автозапуск)](#настройка-pm2)
8. [Настройка Nginx (обратный прокси)](#настройка-nginx)
9. [Настройка SSL сертификата](#настройка-ssl-сертификата)
10. [Мониторинг и логи](#мониторинг-и-логи)

---

## 🖥️ Подготовка VDS

### Минимальные требования:

- **ОС:** Ubuntu 20.04 или 22.04 LTS
- **RAM:** 2GB (рекомендуется 4GB)
- **CPU:** 2 ядра
- **Диск:** 20GB SSD
- **Сеть:** Открыты порты 80, 443, 22

### Подключение к VDS:

```bash
ssh root@your-server-ip
```

### Обновление системы:

```bash
apt update && apt upgrade -y
```

### Установка базовых утилит:

```bash
apt install -y curl wget git build-essential
```

---

## 📦 Установка необходимого ПО

### 1. Установка Node.js 20.x (LTS)

```bash
# Добавление репозитория NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Установка Node.js и npm
apt install -y nodejs

# Проверка версий
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 2. Установка MySQL 8.0

```bash
# Установка MySQL сервера
apt install -y mysql-server

# Запуск MySQL
systemctl start mysql
systemctl enable mysql

# Проверка статуса
systemctl status mysql
```

### 3. Установка PM2 (Process Manager)

```bash
npm install -g pm2

# Проверка установки
pm2 --version
```

### 4. Установка Nginx

```bash
apt install -y nginx

# Запуск Nginx
systemctl start nginx
systemctl enable nginx

# Проверка статуса
systemctl status nginx
```

---

## 🗄️ Настройка MySQL

### 1. Безопасная установка MySQL

```bash
mysql_secure_installation
```

**Ответы на вопросы:**
- Set root password? → **Y** (задайте надежный пароль)
- Remove anonymous users? → **Y**
- Disallow root login remotely? → **Y**
- Remove test database? → **Y**
- Reload privilege tables? → **Y**

### 2. Создание базы данных и пользователя

```bash
# Вход в MySQL
mysql -u root -p

# В консоли MySQL выполните:
```

```sql
-- Создание базы данных
CREATE DATABASE fluxor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Создание пользователя (замените PASSWORD на свой)
CREATE USER 'fluxor'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';

-- Выдача прав
GRANT ALL PRIVILEGES ON fluxor.* TO 'fluxor'@'localhost';
FLUSH PRIVILEGES;

-- Выход
EXIT;
```

### 3. Настройка MySQL для производительности

```bash
# Редактирование конфига
nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

**Добавьте/измените:**
```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M
```

**Перезапуск MySQL:**
```bash
systemctl restart mysql
```

---

## 📂 Загрузка проекта

### Вариант 1: Через Git (рекомендуется)

```bash
# Создание папки для проектов
mkdir -p /var/www
cd /var/www

# Клонирование репозитория
git clone https://github.com/your-username/fluxor.git
cd fluxor

# Или если используете другой Git
git clone git@your-server:your-repo.git fluxor
```

### Вариант 2: Загрузка через SCP

**С вашего компьютера (Windows):**
```powershell
# Сжатие проекта
Compress-Archive -Path "C:\Users\Babur\Desktop\Avelon-Web-main\*" -DestinationPath "fluxor.zip"

# Загрузка на VDS (из WSL или через WinSCP)
scp fluxor.zip root@your-server-ip:/var/www/
```

**На VDS:**
```bash
cd /var/www
unzip fluxor.zip -d fluxor
cd fluxor
```

### Установка зависимостей

```bash
# Установка зависимостей веб-приложения
npm install --production

# Установка зависимостей Discord бота
cd discord-bot
npm install --production
cd ..
```

---

## ⚙️ Настройка переменных окружения

### 1. Главный .env файл

```bash
# Редактирование .env
nano .env
```

**Обязательные настройки для production:**

```env
# DATABASE
DATABASE_URL="mysql://fluxor:YOUR_DB_PASSWORD@localhost:3306/fluxor"

# AUTHENTICATION (ГЕНЕРИРУЙТЕ НОВЫЕ!)
JWT_SECRET="$(openssl rand -hex 32)"
NEXTAUTH_SECRET="$(openssl rand -hex 32)"
NEXTAUTH_URL="https://fluxor.host"
CSRF_SECRET="$(openssl rand -hex 32)"

# APP URL
NEXT_PUBLIC_APP_URL="https://fluxor.host"

# PTERODACTYL PASSWORD ENCRYPTION
PTERODACTYL_PASSWORD_KEY="$(openssl rand -base64 32)"

# PTERODACTYL (если используете)
PTERODACTYL_URL="https://panel.yourdomain.com"
PTERODACTYL_API_KEY="your_api_key"
PTERODACTYL_CLIENT_KEY="your_client_key"

# DISCORD BOT
DISCORD_BOT_TOKEN="your_bot_token"
DISCORD_GUILD_ID="your_guild_id"
DISCORD_VERIFIED_ROLE_ID="your_role_id"

# DISCORD OAUTH
DISCORD_OAUTH_CLIENT_ID="your_client_id"
DISCORD_OAUTH_CLIENT_SECRET="your_client_secret"
DISCORD_OAUTH_REDIRECT_URI="https://fluxor.host/api/auth/discord/callback"

# DISCORD INVITE
NEXT_PUBLIC_DISCORD_INVITE="https://discord.gg/your-invite"

# PAYMENT SYSTEMS
CRYSTALPAY_LOGIN="your_login"
CRYSTALPAY_SECRET="your_secret"
CRYSTALPAY_SALT="your_salt"

# ADMIN
ADMIN_EMAIL="admin@fluxor.host"
ADMIN_PASSWORD="your_secure_password"
ADMIN_NAME="Administrator"
```

**Генерация секретов:**
```bash
# Генерация случайных ключей
openssl rand -hex 32
openssl rand -base64 32
```

### 2. Discord Bot .env файл

```bash
nano discord-bot/.env
```

```env
# Discord Bot Configuration
DISCORD_TOKEN="your_bot_token"
DISCORD_CLIENT_ID="your_client_id"
DISCORD_GUILD_ID="your_guild_id"
DISCORD_OAUTH_CLIENT_SECRET="your_oauth_secret"

# Verified Role
DISCORD_VERIFIED_ROLE_ID="your_role_id"

# Database (должен совпадать с основным .env)
DATABASE_URL="mysql://fluxor:YOUR_DB_PASSWORD@localhost:3306/fluxor"

# Bot Settings
BOT_PREFIX="!"
ADMIN_DISCORD_IDS="your_discord_id"

# Website URL
NEXT_PUBLIC_APP_URL="https://fluxor.host"
```

### 3. Применение миграций базы данных

```bash
# Генерация Prisma Client
npm run db:generate

# Применение схемы к базе данных
npm run db:push

# Создание администратора
npm run create-admin
```

---

## 🚀 Сборка и запуск

### 1. Сборка Next.js приложения

```bash
# Сборка production версии
npm run build

# Проверка сборки
ls -la .next
```

**Успешная сборка покажет:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

### 2. Тестовый запуск

```bash
# Тест production версии
npm run start
```

**Откройте в браузере:** `http://your-server-ip:3000`

Если всё работает, переходите к настройке PM2.

---

## 🔄 Настройка PM2 (автозапуск)

### 1. Создание ecosystem файла

```bash
nano ecosystem.config.js
```

**Содержимое файла:**
```javascript
module.exports = {
  apps: [
    {
      name: 'fluxor-web',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/fluxor',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/fluxor-web-error.log',
      out_file: '/var/log/pm2/fluxor-web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'fluxor-bot',
      script: 'index.js',
      cwd: '/var/www/fluxor/discord-bot',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/fluxor-bot-error.log',
      out_file: '/var/log/pm2/fluxor-bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
}
```

### 2. Создание папки для логов

```bash
mkdir -p /var/log/pm2
```

### 3. Регистрация Discord команд

```bash
cd discord-bot
node deploy-commands.js
cd ..
```

### 4. Запуск через PM2

```bash
# Запуск всех сервисов
pm2 start ecosystem.config.js

# Проверка статуса
pm2 status

# Просмотр логов
pm2 logs

# Просмотр логов конкретного приложения
pm2 logs fluxor-web
pm2 logs fluxor-bot
```

### 5. Настройка автозапуска при перезагрузке

```bash
# Сохранение текущей конфигурации PM2
pm2 save

# Генерация startup скрипта
pm2 startup systemd

# Выполните команду, которую покажет PM2 (будет начинаться с sudo...)
```

---

## 🔧 ВАЖНО: Исправление проблемы с авторизацией

> ⚠️ **КРИТИЧЕСКИ ВАЖНО!** После первого запуска авторизация не будет работать из-за проблемы с cookies на HTTP.

### Быстрое решение (1 команда):

```bash
cd /var/www/fluxor && \
\cp app/api/auth/login/route.ts app/api/auth/login/route.ts.backup && \
\cp app/api/auth/me/route.ts app/api/auth/me/route.ts.backup && \
sed -i 's/secure: process\.env\.NODE_ENV === .production./secure: false \/\/ ПОСЛЕ SSL ИЗМЕНИТЬ НА true!/g' app/api/auth/login/route.ts && \
rm -rf .next && \
npm run build && \
pm2 restart fluxor-web && \
echo "✅ Исправление применено! Проверьте: pm2 logs fluxor-web"
```

### Или по шагам:

**1. Создайте резервные копии:**
```bash
cd /var/www/fluxor
cp app/api/auth/login/route.ts app/api/auth/login/route.ts.backup
cp app/api/auth/me/route.ts app/api/auth/me/route.ts.backup
```

**2. Измените `secure` flag:**

Откройте `app/api/auth/login/route.ts` и найдите (~строка 107):
```typescript
secure: process.env.NODE_ENV === 'production',  // ← БЫЛО
```

Замените на:
```typescript
secure: false,  // ИЗМЕНИТЬ НА true ПОСЛЕ НАСТРОЙКИ SSL/HTTPS!
```

**3. Пересоберите и перезапустите:**
```bash
rm -rf .next
npm run build
pm2 restart fluxor-web
```

**4. Проверьте логи:**
```bash
pm2 logs fluxor-web --lines 50
```

### Тестирование авторизации:

```bash
# Проверка через curl
curl -v -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fluxor.host","password":"your_password"}' \
  -c /tmp/cookies.txt 2>&1 | grep -i "set-cookie"

# Должны увидеть: Set-Cookie: auth-token=...
```

> **После настройки SSL/HTTPS вернитесь и измените `secure: false` → `secure: true`!**
> 
> Подробнее см.: `БЫСТРОЕ_ИСПРАВЛЕНИЕ.md` или `FIX_AUTH_PRODUCTION.md`

---# Выполните команду, которую выдаст PM2
# Она будет выглядеть примерно так:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

### 6. Полезные команды PM2

```bash
pm2 list              # Список процессов
pm2 restart all       # Перезапуск всех
pm2 restart fluxor-web  # Перезапуск веб-приложения
pm2 stop all          # Остановка всех
pm2 delete all        # Удаление всех
pm2 logs --lines 100  # Последние 100 строк логов
pm2 monit             # Мониторинг в реальном времени
```

---

## 🔒 Настройка Nginx (обратный прокси)

### 1. Создание конфигурации Nginx

```bash
nano /etc/nginx/sites-available/fluxor.host
```

**Конфигурация для HTTP (временная):**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name fluxor.host www.fluxor.host;

    # Размер загружаемых файлов
    client_max_body_size 100M;

    # Логирование
    access_log /var/log/nginx/fluxor-access.log;
    error_log /var/log/nginx/fluxor-error.log;

    # Прокси к Next.js приложению
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support для Next.js HMR (если нужно)
    location /_next/webpack-hmr {
        proxy_pass http://localhost:3000/_next/webpack-hmr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 2. Активация конфигурации

```bash
# Создание символической ссылки
ln -s /etc/nginx/sites-available/fluxor.host /etc/nginx/sites-enabled/

# Проверка конфигурации
nginx -t

# Перезагрузка Nginx
systemctl reload nginx
```

### 3. Проверка

Откройте в браузере: `http://fluxor.host` или `http://your-server-ip`

---

## 🔐 Настройка SSL сертификата

### Установка Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### Получение SSL сертификата

```bash
# Автоматическая настройка SSL для домена
certbot --nginx -d fluxor.host -d www.fluxor.host

# Следуйте инструкциям:
# - Введите email для уведомлений
# - Согласитесь с условиями (Y)
# - Выберите redirect с HTTP на HTTPS (2)
```

### Автоматическое обновление сертификата

```bash
# Certbot автоматически создаст cron задачу
# Проверка:
certbot renew --dry-run

# Если нужно создать вручную:
crontab -e

# Добавьте строку:
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

### Финальная конфигурация Nginx (с SSL)

После запуска certbot ваш конфиг будет автоматически обновлен примерно так:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name fluxor.host www.fluxor.host;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name fluxor.host www.fluxor.host;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/fluxor.host/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fluxor.host/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Остальная конфигурация...
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 Мониторинг и логи

### 1. Просмотр логов PM2

```bash
# Все логи в реальном времени
pm2 logs

# Логи конкретного приложения
pm2 logs fluxor-web
pm2 logs fluxor-bot

# Последние 100 строк
pm2 logs --lines 100

# Очистка логов
pm2 flush
```

### 2. Логи Nginx

```bash
# Access логи
tail -f /var/log/nginx/fluxor-access.log

# Error логи
tail -f /var/log/nginx/fluxor-error.log

# Последние 50 строк
tail -n 50 /var/log/nginx/fluxor-error.log
```

### 3. Мониторинг системы

```bash
# Мониторинг PM2 процессов
pm2 monit

# Использование памяти и CPU
pm2 list

# Подробная информация
pm2 show fluxor-web

# Системные ресурсы
htop  # установите: apt install htop
```

### 4. Логи MySQL

```bash
# Медленные запросы
tail -f /var/log/mysql/slow-query.log

# Общий лог ошибок
tail -f /var/log/mysql/error.log
```

### 5. Мониторинг диска

```bash
# Использование диска
df -h

# Размер папок
du -sh /var/www/fluxor
du -sh /var/log/*

# Очистка логов старше 7 дней
find /var/log/pm2 -name "*.log" -mtime +7 -delete
```

---

## 🔄 Обновление приложения

### Обновление через Git

```bash
# Переход в папку проекта
cd /var/www/fluxor

# Остановка приложения
pm2 stop all

# Получение обновлений
git pull origin main

# Установка зависимостей
npm install --production
cd discord-bot && npm install --production && cd ..

# Пересборка
npm run build

# Применение миграций (если есть)
npm run db:push

# Запуск
pm2 restart all

# Проверка
pm2 status
pm2 logs --lines 50
```

### Обновление через загрузку файлов

```bash
# Остановка
pm2 stop all

# Резервная копия
cp -r /var/www/fluxor /var/www/fluxor-backup-$(date +%Y%m%d)

# Загрузите новые файлы и распакуйте
# Потом:
cd /var/www/fluxor
npm install --production
npm run build
npm run db:push

# Запуск
pm2 restart all
```

---

## 🔥 Настройка Firewall (UFW)

### Базовая настройка

```bash
# Установка UFW (если не установлен)
apt install -y ufw

# Разрешение SSH (ВАЖНО!)
ufw allow 22/tcp

# Разрешение HTTP и HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Включение firewall
ufw enable

# Проверка статуса
ufw status verbose
```

### Дополнительная безопасность

```bash
# Ограничение SSH доступа по IP (опционально)
ufw allow from YOUR_IP_ADDRESS to any port 22

# Защита от брутфорса SSH
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

## 🛡️ Безопасность и оптимизация

### 1. Настройка прав доступа

```bash
# Создание пользователя для приложения
useradd -r -s /bin/bash -d /var/www/fluxor fluxor

# Назначение владельца
chown -R fluxor:fluxor /var/www/fluxor

# Права на файлы
chmod -R 750 /var/www/fluxor

# Защита .env файлов
chmod 600 /var/www/fluxor/.env
chmod 600 /var/www/fluxor/discord-bot/.env
```

### 2. Ротация логов

```bash
nano /etc/logrotate.d/fluxor
```

```
/var/log/pm2/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
```

### 3. Настройка swap (если мало RAM)

```bash
# Создание swap файла 2GB
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Автоматическое подключение при загрузке
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Проверка
free -h
```

### 4. Автоматические резервные копии базы данных

```bash
# Создание скрипта резервного копирования
nano /root/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="fluxor"
DB_USER="fluxor"
DB_PASS="YOUR_PASSWORD"

mkdir -p $BACKUP_DIR

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/fluxor_$DATE.sql.gz

# Удаление бэкапов старше 7 дней
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: fluxor_$DATE.sql.gz"
```

```bash
# Права на выполнение
chmod +x /root/backup-db.sh

# Добавление в cron (каждый день в 3:00)
crontab -e
```

```
0 3 * * * /root/backup-db.sh >> /var/log/backup.log 2>&1
```

---

## 🐛 Решение проблем

### Проблема: Приложение не запускается

**Проверка:**
```bash
pm2 logs fluxor-web --lines 50
```

**Частые причины:**
- Неправильные переменные в `.env`
- База данных не доступна
- Порт 3000 занят

**Решение:**
```bash
# Проверка порта
netstat -tulpn | grep :3000

# Проверка MySQL
systemctl status mysql

# Проверка переменных
cat .env | grep DATABASE_URL
```

### Проблема: 502 Bad Gateway в Nginx

**Причины:**
- Next.js приложение не запущено
- Неправильный proxy_pass в Nginx

**Решение:**
```bash
# Проверка статуса PM2
pm2 status

# Проверка порта 3000
curl http://localhost:3000

# Перезапуск Nginx
systemctl restart nginx

# Проверка логов Nginx
tail -f /var/log/nginx/fluxor-error.log
```

### Проблема: Discord бот не отвечает

**Проверка:**
```bash
pm2 logs fluxor-bot --lines 50
```

**Решение:**
```bash
# Перезапуск бота
pm2 restart fluxor-bot

# Проверка токена
cat discord-bot/.env | grep DISCORD_TOKEN

# Регистрация команд заново
cd discord-bot
node deploy-commands.js
cd ..
pm2 restart fluxor-bot
```

### Проблема: Высокая нагрузка на память

**Проверка:**
```bash
pm2 monit
free -h
```

**Решение:**
```bash
# Уменьшение количества PM2 инстансов
pm2 scale fluxor-web 1

# Добавление swap
# (см. раздел "Настройка swap")

# Перезапуск
pm2 restart all
```

### Проблема: SSL сертификат не обновляется

**Решение:**
```bash
# Ручное обновление
certbot renew --force-renewal

# Перезапуск Nginx
systemctl reload nginx

# Проверка автообновления
certbot renew --dry-run
```

---

## 📋 Чек-лист развертывания

### Подготовка сервера
- [ ] VDS с Ubuntu 20.04/22.04
- [ ] SSH доступ настроен
- [ ] Система обновлена (`apt update && apt upgrade`)
- [ ] Базовые утилиты установлены

### Установка ПО
- [ ] Node.js 20.x установлен
- [ ] MySQL 8.0 установлен и запущен
- [ ] PM2 установлен глобально
- [ ] Nginx установлен и запущен

### База данных
- [ ] MySQL база создана
- [ ] Пользователь создан с правами
- [ ] Пароль надежный и записан

### Проект
- [ ] Код загружен на сервер
- [ ] Зависимости установлены (`npm install`)
- [ ] `.env` настроен с production значениями
- [ ] `discord-bot/.env` настроен
- [ ] Миграции применены (`npm run db:push`)
- [ ] Администратор создан
- [ ] Production сборка выполнена (`npm run build`)

### PM2
- [ ] `ecosystem.config.js` создан
- [ ] Discord команды зарегистрированы
- [ ] Приложения запущены через PM2
- [ ] Автозапуск настроен (`pm2 startup`)
- [ ] Конфигурация сохранена (`pm2 save`)

### Nginx
- [ ] Конфигурация создана
- [ ] Символическая ссылка создана
- [ ] Nginx перезапущен
- [ ] Сайт доступен по HTTP

### SSL
- [ ] Certbot установлен
- [ ] SSL сертификат получен
- [ ] Автообновление настроено
- [ ] Сайт доступен по HTTPS
- [ ] Редирект с HTTP на HTTPS работает

### Безопасность
- [ ] Firewall настроен (UFW)
- [ ] Fail2ban установлен
- [ ] Права на файлы настроены
- [ ] `.env` файлы защищены (chmod 600)

### Мониторинг
- [ ] PM2 логи доступны
- [ ] Nginx логи доступны
- [ ] Резервное копирование БД настроено
- [ ] Ротация логов настроена

---

## 🚀 Быстрый деплой (команды подряд)

```bash
# 1. Подготовка
apt update && apt upgrade -y
apt install -y curl wget git build-essential

# 2. Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. MySQL
apt install -y mysql-server
mysql_secure_installation

# 4. Создание БД
mysql -u root -p << EOF
CREATE DATABASE fluxor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fluxor'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON fluxor.* TO 'fluxor'@'localhost';
FLUSH PRIVILEGES;
EOF

# 5. PM2 и Nginx
npm install -g pm2
apt install -y nginx

# 6. Загрузка проекта
mkdir -p /var/www
cd /var/www
# Загрузите ваш проект сюда

# 7. Установка зависимостей
cd /var/www/fluxor
npm install --production
cd discord-bot && npm install --production && cd ..

# 8. Настройка .env
nano .env
nano discord-bot/.env

# 9. База данных
npm run db:generate
npm run db:push
npm run create-admin

# 10. Сборка
npm run build

# 11. Регистрация Discord команд
cd discord-bot
node deploy-commands.js
cd ..

# 12. Создание ecosystem.config.js
nano ecosystem.config.js
# (скопируйте конфиг из раздела PM2)

# 13. Запуск
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 14. Nginx
nano /etc/nginx/sites-available/fluxor.host
ln -s /etc/nginx/sites-available/fluxor.host /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 15. SSL
apt install -y certbot python3-certbot-nginx
certbot --nginx -d fluxor.host -d www.fluxor.host

# 16. Firewall
apt install -y ufw
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable

# Готово! 🎉
```

---

## 📚 Полезные ссылки и команды

### Документация
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **PM2 Documentation:** https://pm2.keymetrics.io/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/
- **MySQL 8.0:** https://dev.mysql.com/doc/

### Частые команды

**PM2:**
```bash
pm2 list              # Список процессов
pm2 restart all       # Перезапуск всех
pm2 logs             # Логи в реальном времени
pm2 monit            # Мониторинг
pm2 save             # Сохранение конфигурации
pm2 delete all       # Удаление всех процессов
```

**Nginx:**
```bash
nginx -t                      # Проверка конфигурации
systemctl restart nginx       # Перезапуск
systemctl status nginx        # Статус
systemctl reload nginx        # Перезагрузка без даунтайма
tail -f /var/log/nginx/error.log  # Логи ошибок
```

**MySQL:**
```bash
systemctl status mysql        # Статус
mysql -u root -p             # Подключение
mysqldump fluxor > backup.sql  # Бэкап базы
```

**Система:**
```bash
htop                 # Мониторинг системы
df -h                # Использование диска
free -h              # Использование памяти
netstat -tulpn       # Открытые порты
ufw status          # Статус firewall
journalctl -xe      # Системные логи
```

---

## 🎓 Рекомендации для production

### 1. Производительность
- Используйте 2+ инстанса PM2 в cluster mode
- Настройте кэширование в Nginx
- Включите Gzip сжатие
- Используйте CDN для статики
- Оптимизируйте размер Docker образов (если используете)

### 2. Безопасность
- Регулярно обновляйте систему и пакеты
- Используйте сильные пароли
- Настройте fail2ban
- Ограничьте SSH доступ по IP
- Регулярно проверяйте логи на подозрительную активность
- Храните секреты в безопасном месте (не в Git!)

### 3. Мониторинг
- Настройте мониторинг uptime (UptimeRobot, Pingdom)
- Используйте систему логирования (ELK, Graylog)
- Настройте алерты на критические события
- Мониторьте использование ресурсов

### 4. Резервное копирование
- Ежедневные бэкапы базы данных
- Еженедельные полные бэкапы сервера
- Храните бэкапы в отдельном месте
- Периодически проверяйте восстановление из бэкапов

### 5. Масштабирование
- Для высокой нагрузки используйте Load Balancer
- Рассмотрите использование Redis для сессий
- Вынесите базу данных на отдельный сервер
- Используйте CDN для статического контента

---

## 🆘 Поддержка

Если возникли проблемы при развертывании:

1. **Проверьте логи:**
   ```bash
   pm2 logs --lines 100
   tail -f /var/log/nginx/error.log
   journalctl -xe
   ```

2. **Проверьте статус сервисов:**
   ```bash
   pm2 status
   systemctl status nginx
   systemctl status mysql
   ```

3. **Проверьте переменные окружения:**
   ```bash
   cat .env | grep -v "PASSWORD\|SECRET\|KEY"
   ```

4. **Проверьте подключение к БД:**
   ```bash
   mysql -u fluxor -p fluxor
   ```

5. **Проверьте открытые порты:**
   ```bash
   netstat -tulpn | grep -E '(3000|80|443|3306)'
   ```

---

## ✅ Успешное развертывание!

После выполнения всех шагов ваш Fluxor должен быть доступен по адресу:

🌐 **https://fluxor.host**

**Панели управления:**
- Клиентская панель: https://fluxor.host/client
- Админ панель: https://fluxor.host/admin
- API: https://fluxor.host/api

**Следующие шаги:**
1. Проверьте работу всех функций
2. Создайте тестовый заказ
3. Проверьте Discord бота
4. Настройте платежные системы
5. Заполните контент (документация, FAQ)

**Удачи! 🚀**

