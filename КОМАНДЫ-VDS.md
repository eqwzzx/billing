# 📋 ПОЛЕЗНЫЕ КОМАНДЫ ДЛЯ VDS

Быстрый справочник по работе с Fluxor на production сервере.

---

## 🔌 ПОДКЛЮЧЕНИЕ

```bash
# Подключение к VDS
ssh root@77.91.100.68

# Переход в директорию проекта
cd /var/www/billing
```

---

## 🔄 PM2 (Управление процессами)

### Основные команды

```bash
# Список всех процессов
pm2 list

# Статус конкретного процесса
pm2 show fluxor-web

# Логи всех процессов
pm2 logs

# Логи конкретного процесса
pm2 logs fluxor-web
pm2 logs fluxor-bot

# Последние 50 строк
pm2 logs fluxor-web --lines 50

# Только ошибки
pm2 logs fluxor-web --err

# Без follow (не следить за новыми)
pm2 logs fluxor-web --lines 100 --nostream
```

### Перезапуск

```bash
# Перезапуск конкретного приложения
pm2 restart fluxor-web
pm2 restart fluxor-bot

# Перезапуск всех
pm2 restart all

# Остановка
pm2 stop fluxor-web

# Запуск
pm2 start fluxor-web

# Полная перезагрузка (удаление из списка)
pm2 delete fluxor-web
pm2 start ecosystem.config.js
```

### Мониторинг

```bash
# Интерактивный монитор
pm2 monit

# Статистика использования ресурсов
pm2 status

# Информация о конкретном процессе
pm2 describe fluxor-web
```

---

## 🏗️ СБОРКА И РАЗВЁРТЫВАНИЕ

### Полная пересборка

```bash
cd /var/www/billing

# Очистка старой сборки
rm -rf .next

# Сборка
npm run build

# Перезапуск
pm2 restart fluxor-web
```

### Обновление зависимостей

```bash
cd /var/www/billing

# Обновление npm packages
npm install

# Обновление Discord бота
cd discord-bot
npm install
cd ..
```

### Применение изменений кода

```bash
cd /var/www/billing

# 1. Резервная копия (опционально)
tar -czf backup-$(date +%Y%m%d_%H%M%S).tar.gz app lib components

# 2. Загрузите новые файлы через git, scp или редактируйте

# 3. Пересоберите
rm -rf .next
npm run build

# 4. Перезапустите
pm2 restart fluxor-web
pm2 logs fluxor-web --lines 30
```

---

## 🗄️ БАЗА ДАННЫХ

### MySQL/MariaDB

```bash
# Подключение к БД
mysql -u fluxor -p fluxor

# Подключение как root
mysql -u root -p

# Выполнение SQL команды
mysql -u fluxor -p fluxor -e "SELECT COUNT(*) FROM User;"

# Дамп базы данных
mysqldump -u fluxor -p fluxor > backup.sql

# Восстановление из дампа
mysql -u fluxor -p fluxor < backup.sql
```

### Prisma

```bash
cd /var/www/billing

# Генерация Prisma Client
npx prisma generate

# Применение схемы к БД (без миграций)
npx prisma db push

# Применение миграций
npx prisma migrate deploy

# Prisma Studio (GUI для БД) - НЕ используйте на production!
# npx prisma studio

# Проверка схемы
npx prisma validate
```

### Полезные SQL запросы

```sql
-- Список всех пользователей
SELECT id, email, name, role, balance FROM User;

-- Список всех серверов
SELECT id, name, status, userId FROM Server;

-- Список транзакций
SELECT * FROM Payment ORDER BY createdAt DESC LIMIT 10;

-- Информация о конкретном пользователе
SELECT * FROM User WHERE email = 'admin@eqwzzx.wtf';

-- Создать админа (если нужно)
UPDATE User SET role = 'ADMIN' WHERE email = 'user@example.com';
```

---

## 📊 ЛОГИ И ДИАГНОСТИКА

### Системные логи

```bash
# Логи systemd (если используется)
journalctl -u fluxor-web -f

# Логи Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Системные логи
tail -f /var/log/syslog

# Использование диска
df -h

# Использование RAM
free -h

# Топ процессов
htop
# или
top
```

### PM2 логи по дате

```bash
# Логи за сегодня
pm2 logs --lines 1000 | grep "$(date +%Y-%m-%d)"

# Логи с фильтром
pm2 logs fluxor-web | grep "ERROR"
pm2 logs fluxor-web | grep "LOGIN"
pm2 logs fluxor-web | grep "401"
```

### Проверка портов

```bash
# Какие порты открыты
netstat -tulpn | grep LISTEN

# Проверка конкретного порта
netstat -tulpn | grep :3000

# Проверка с помощью lsof
lsof -i :3000
```

---

## 🌐 NGINX

### Управление

```bash
# Проверка конфигурации
nginx -t

# Перезагрузка конфигурации
systemctl reload nginx

# Перезапуск Nginx
systemctl restart nginx

# Статус
systemctl status nginx

# Остановка
systemctl stop nginx

# Запуск
systemctl start nginx
```

### Логи Nginx

```bash
# Access логи
tail -f /var/log/nginx/access.log

# Error логи
tail -f /var/log/nginx/error.log

# Логи конкретного сайта (если настроены)
tail -f /var/log/nginx/fluxor-access.log
tail -f /var/log/nginx/fluxor-error.log
```

---

## 🔒 SSL/HTTPS (Let's Encrypt)

### Certbot

```bash
# Получение сертификата
certbot --nginx -d fluxor.host -d www.fluxor.host

# Продление сертификата (вручную)
certbot renew

# Тестовое продление
certbot renew --dry-run

# Список сертификатов
certbot certificates

# Удаление сертификата
certbot delete --cert-name fluxor.host
```

---

## 🔧 ИСПРАВЛЕНИЕ АВТОРИЗАЦИИ

### Быстрое исправление проблемы 401

```bash
cd /var/www/billing

# Резервная копия
cp app/api/auth/login/route.ts app/api/auth/login/route.ts.backup

# Применение исправления
sed -i "s/secure: process\.env\.NODE_ENV === 'production'/secure: false \/\/ ИЗМЕНИТЬ НА true ПОСЛЕ SSL!/g" app/api/auth/login/route.ts

# Пересборка и перезапуск
rm -rf .next && npm run build && pm2 restart fluxor-web

# Проверка логов
pm2 logs fluxor-web --lines 50
```

### Проверка авторизации через curl

```bash
# Тест логина
curl -v -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eqwzzx.wtf","password":"123456@"}' \
  -c /tmp/cookies.txt 2>&1 | grep "Set-Cookie"

# Проверка /me
curl http://localhost:3000/api/auth/me -b /tmp/cookies.txt
```

---

## 🤖 DISCORD БОТ

### Управление

```bash
# Перезапуск бота
pm2 restart fluxor-bot

# Логи бота
pm2 logs fluxor-bot

# Регистрация команд
cd /var/www/billing/discord-bot
node deploy-commands.js
cd ..
```

### Проверка webhook сервера

```bash
# Проверка, что webhook сервер работает (порт 3001)
curl http://localhost:3001/webhook
# Должен вернуть: Method not allowed
```

---

## 🧹 ОЧИСТКА И ОБСЛУЖИВАНИЕ

### Очистка логов PM2

```bash
# Очистка всех логов
pm2 flush

# Ротация логов (если настроена)
pm2 reloadLogs
```

### Очистка npm кэша

```bash
npm cache clean --force
```

### Очистка старых файлов

```bash
cd /var/www/billing

# Удаление старых резервных копий
find . -name "*.backup*" -mtime +30 -delete

# Очистка временных файлов
rm -rf /tmp/*.txt
```

### Освобождение места

```bash
# Проверка использования диска
du -sh /var/www/billing/*

# Топ 10 больших файлов/папок
du -ah /var/www/billing | sort -rh | head -10

# Очистка неиспользуемых Docker образов (если используется)
docker system prune -a
```

---

## 📦 РЕЗЕРВНОЕ КОПИРОВАНИЕ

### Быстрое резервное копирование

```bash
cd /var/www

# Резервная копия кода
tar -czf backup-code-$(date +%Y%m%d_%H%M%S).tar.gz billing/

# Резервная копия базы данных
mysqldump -u fluxor -p fluxor > backup-db-$(date +%Y%m%d_%H%M%S).sql

# Копирование на локальную машину (с вашего компьютера)
scp root@77.91.100.68:/var/www/backup-*.tar.gz .
scp root@77.91.100.68:/var/www/backup-*.sql .
```

---

## 🔥 ЭКСТРЕННЫЕ КОМАНДЫ

### Откат изменений

```bash
cd /var/www/billing

# Восстановление из резервной копии
cp app/api/auth/login/route.ts.backup app/api/auth/login/route.ts
rm -rf .next
npm run build
pm2 restart fluxor-web
```

### Полная перезагрузка сервера

```bash
# Сохранение конфигурации PM2
pm2 save

# Перезагрузка
reboot
```

### Восстановление после сбоя

```bash
# Проверка состояния всех сервисов
systemctl status nginx
systemctl status mysql
pm2 status

# Запуск всех сервисов
systemctl start nginx
systemctl start mysql
pm2 resurrect  # Восстановление процессов PM2
```

---

## 📞 МОНИТОРИНГ В РЕАЛЬНОМ ВРЕМЕНИ

### Мультиплексор команд

```bash
# Открыть несколько терминалов и запустить:

# Терминал 1: PM2 логи
pm2 logs fluxor-web

# Терминал 2: Nginx логи
tail -f /var/log/nginx/access.log

# Терминал 3: Системный монитор
htop

# Терминал 4: PM2 монитор
pm2 monit
```

---

**Сохраните этот файл для быстрого доступа к командам! 📌**
