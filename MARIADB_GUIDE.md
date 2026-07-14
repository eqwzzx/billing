# 🐬 Использование MariaDB вместо MySQL

Полное руководство по настройке Fluxor с MariaDB

---

## ✅ Совместимость

**MariaDB полностью совместима с MySQL!**

- Использует тот же протокол
- Тот же драйвер (`mysql2`)
- Та же строка подключения
- Никаких изменений в коде не требуется

**Преимущества MariaDB:**
- Быстрее MySQL в большинстве случаев
- Открытый исходный код (не принадлежит Oracle)
- Больше функций и улучшений
- Активное сообщество разработчиков

---

## 🚀 Быстрый старт

### Минимальная настройка (5 минут)

```bash
# 1. Установите MariaDB (Linux)
sudo apt install mariadb-server -y
sudo systemctl start mariadb
sudo mysql_secure_installation

# 2. Создайте базы данных
sudo mysql -u root -p
```

```sql
-- В консоли MariaDB:
CREATE DATABASE fluxor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE fluxor_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fluxor'@'localhost' IDENTIFIED BY 'ваш_пароль';
GRANT ALL PRIVILEGES ON fluxor.* TO 'fluxor'@'localhost';
GRANT ALL PRIVILEGES ON fluxor_shadow.* TO 'fluxor'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# 3. Настройте .env
nano .env
```

```env
DATABASE_URL="mysql://fluxor:ваш_пароль@localhost:3306/fluxor"
SHADOW_DATABASE_URL="mysql://fluxor:ваш_пароль@localhost:3306/fluxor_shadow"
```

```bash
# 4. Примените миграции
npm run db:generate
npm run db:push

# Готово! 🎉
```

---

## 📦 Установка MariaDB

### Windows

#### Вариант 1: Официальный установщик

1. Скачайте установщик: https://mariadb.org/download/
2. Запустите установщик
3. Выберите:
   - ✅ Server
   - ✅ Client programs
   - ✅ HeidiSQL (опционально - GUI для управления)
4. Установите пароль для root
5. Порт по умолчанию: **3306**
6. Завершите установку

#### Вариант 2: Через Chocolatey

```powershell
# Установка Chocolatey (если не установлен)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Установка MariaDB
choco install mariadb -y
```

#### Вариант 3: Через XAMPP (включает Apache, PHP, MariaDB)

1. Скачайте XAMPP: https://www.apachefriends.org/
2. Установите XAMPP
3. MariaDB будет установлена автоматически
4. Управление через XAMPP Control Panel

### Linux (Ubuntu/Debian)

```bash
# Обновление пакетов
sudo apt update

# Установка MariaDB
sudo apt install mariadb-server mariadb-client -y

# Запуск MariaDB
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Проверка статуса
sudo systemctl status mariadb

# Безопасная установка
sudo mysql_secure_installation
```

**Ответы на вопросы mysql_secure_installation:**
- Switch to unix_socket authentication? → **N**
- Change root password? → **Y** (установите надёжный пароль)
- Remove anonymous users? → **Y**
- Disallow root login remotely? → **Y**
- Remove test database? → **Y**
- Reload privilege tables? → **Y**

### Linux (CentOS/RHEL/Rocky)

```bash
# Установка MariaDB
sudo yum install mariadb-server mariadb -y

# Запуск
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Безопасная установка
sudo mysql_secure_installation
```

### macOS

```bash
# Через Homebrew
brew install mariadb

# Запуск
brew services start mariadb

# Безопасная установка
mysql_secure_installation
```

---

## 🔧 Настройка для Fluxor

### 1. Вход в MariaDB

**Windows:**
```cmd
mysql -u root -p
```

**Linux:**
```bash
sudo mysql -u root -p
# или
mysql -u root -p
```

### 2. Создание базы данных и пользователя

```sql
-- Создание основной базы данных
CREATE DATABASE fluxor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Создание shadow базы данных (для Prisma миграций)
CREATE DATABASE fluxor_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Создание пользователя с паролем
CREATE USER 'fluxor'@'localhost' IDENTIFIED BY 'ваш_надёжный_пароль';

-- Выдача всех прав на основную базу
GRANT ALL PRIVILEGES ON fluxor.* TO 'fluxor'@'localhost';

-- Выдача всех прав на shadow базу
GRANT ALL PRIVILEGES ON fluxor_shadow.* TO 'fluxor'@'localhost';

-- Применение изменений
FLUSH PRIVILEGES;

-- Проверка созданного пользователя
SELECT User, Host FROM mysql.user WHERE User='fluxor';

-- Проверка созданных баз
SHOW DATABASES LIKE 'fluxor%';

-- Выход
EXIT;
```

**Для чего нужна shadow база:**
- Prisma использует её для безопасного тестирования миграций
- Позволяет обнаружить проблемы до применения к основной БД
- Автоматически очищается после каждой миграции
- **Важно:** Shadow БД должна быть пустой, Prisma управляет ей автоматически

### 3. Настройка .env файла

```env
# DATABASE (обе строки подключения!)
DATABASE_URL="mysql://fluxor:ваш_пароль@localhost:3306/fluxor"
SHADOW_DATABASE_URL="mysql://fluxor:ваш_пароль@localhost:3306/fluxor_shadow"
```

**Формат строки подключения:**
```
mysql://[пользователь]:[пароль]@[хост]:[порт]/[база_данных]
```

**Примеры:**
```env
# Локальная разработка
DATABASE_URL="mysql://fluxor:password123@localhost:3306/fluxor"
SHADOW_DATABASE_URL="mysql://fluxor:password123@localhost:3306/fluxor_shadow"

# Production сервер
DATABASE_URL="mysql://fluxor:strong_password@127.0.0.1:3306/fluxor"
SHADOW_DATABASE_URL="mysql://fluxor:strong_password@127.0.0.1:3306/fluxor_shadow"

# Удалённый сервер
DATABASE_URL="mysql://fluxor:password@192.168.1.100:3306/fluxor"
SHADOW_DATABASE_URL="mysql://fluxor:password@192.168.1.100:3306/fluxor_shadow"
```

**⚠️ Важно:**
- Пароль должен быть одинаковым в обеих строках
- Shadow база используется только при выполнении `prisma migrate dev`
- В production можно не использовать shadow базу (для `prisma db push` она не нужна)

### 4. Применение миграций

```bash
# Генерация Prisma Client
npm run db:generate

# Применение схемы к базе данных
npm run db:push

# Проверка подключения
npm run db:studio
```

**Команды Prisma и shadow база:**

```bash
# db:push - НЕ использует shadow базу
npm run db:push

# migrate dev - ИСПОЛЬЗУЕТ shadow базу
npx prisma migrate dev

# migrate deploy - НЕ использует shadow базу (для production)
npx prisma migrate deploy
```

---

## 📂 Что такое Shadow Database?

### Зачем нужна Shadow база данных?

**Shadow база** - это временная база данных, которую Prisma создаёт для:

1. **Безопасного тестирования миграций** - изменения сначала проверяются на копии
2. **Обнаружения проблем** - ошибки находятся до применения к реальной БД
3. **Генерации миграций** - Prisma сравнивает схему с текущим состоянием

### Когда используется?

| Команда | Использует Shadow БД? | Описание |
|---------|----------------------|----------|
| `prisma migrate dev` | ✅ Да | Разработка миграций |
| `prisma migrate reset` | ✅ Да | Сброс и повторное применение |
| `prisma migrate resolve` | ❌ Нет | Маркировка миграций |
| `prisma migrate deploy` | ❌ Нет | Production деплой |
| `prisma db push` | ❌ Нет | Быстрое применение схемы |
| `prisma db pull` | ❌ Нет | Получение схемы из БД |

### Настройка Shadow базы

**Вариант 1: Отдельная база (рекомендуется)**

```env
DATABASE_URL="mysql://fluxor:password@localhost:3306/fluxor"
SHADOW_DATABASE_URL="mysql://fluxor:password@localhost:3306/fluxor_shadow"
```

```sql
-- Создайте отдельную базу
CREATE DATABASE fluxor_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON fluxor_shadow.* TO 'fluxor'@'localhost';
```

**Вариант 2: Без Shadow базы (только для production)**

```env
# Только основная база
DATABASE_URL="mysql://fluxor:password@localhost:3306/fluxor"
# SHADOW_DATABASE_URL не указываем
```

⚠️ **Внимание:** Без shadow базы команда `prisma migrate dev` не будет работать!

### Для разработки (Development)

```env
# Обязательно указывайте обе базы
DATABASE_URL="mysql://fluxor:password@localhost:3306/fluxor"
SHADOW_DATABASE_URL="mysql://fluxor:password@localhost:3306/fluxor_shadow"
```

### Для продакшна (Production)

**Вариант A: Используете Prisma Migrate**
```env
# Shadow база НЕ нужна для prisma migrate deploy
DATABASE_URL="mysql://fluxor:password@localhost:3306/fluxor"
```

**Вариант B: Используете db:push**
```env
# Shadow база НЕ нужна для db:push
DATABASE_URL="mysql://fluxor:password@localhost:3306/fluxor"
```

### Автоматическое управление

Prisma автоматически:
- ✅ Создаёт структуру в shadow базе
- ✅ Тестирует миграции
- ✅ Очищает shadow базу после использования
- ✅ Не трогает данные в основной базе

**Не нужно вручную:**
- ❌ Создавать таблицы в shadow базе
- ❌ Копировать данные в shadow базу
- ❌ Очищать shadow базу

---

## 🔍 Проверка работы MariaDB

### Проверка статуса

**Windows:**
```cmd
# Список сервисов
sc query | findstr MariaDB

# Статус конкретного сервиса
sc query MariaDB
```

**Linux:**
```bash
sudo systemctl status mariadb
```

### Проверка версии

```bash
mysql --version
# Пример вывода: mysql  Ver 15.1 Distrib 10.11.6-MariaDB
```

### Проверка подключения

```bash
# Подключение к базе
mysql -u fluxor -p fluxor

# В консоли MariaDB:
SHOW TABLES;
SELECT DATABASE();
```

---

## ⚙️ Управление MariaDB

### Windows

#### Через Services (GUI)

1. Нажмите `Win + R`
2. Введите `services.msc`
3. Найдите "MariaDB"
4. Правый клик → Запустить/Остановить/Перезапустить

#### Через PowerShell (требуется админ)

```powershell
# Запуск
Start-Service MariaDB

# Остановка
Stop-Service MariaDB

# Перезапуск
Restart-Service MariaDB

# Статус
Get-Service MariaDB

# Автозапуск при старте системы
Set-Service MariaDB -StartupType Automatic
```

#### Через cmd (требуется админ)

```cmd
# Запуск
net start MariaDB

# Остановка
net stop MariaDB
```

### Linux

```bash
# Запуск
sudo systemctl start mariadb

# Остановка
sudo systemctl stop mariadb

# Перезапуск
sudo systemctl restart mariadb

# Статус
sudo systemctl status mariadb

# Автозапуск
sudo systemctl enable mariadb

# Отключить автозапуск
sudo systemctl disable mariadb

# Логи
sudo journalctl -u mariadb -f
```

---

## 🎨 GUI инструменты для MariaDB

### 1. HeidiSQL (Windows)

**Преимущества:**
- Бесплатный
- Лёгкий и быстрый
- Отличный интерфейс

**Установка:**
- Включён в установщик MariaDB
- Или скачайте: https://www.heidisql.com/

### 2. phpMyAdmin (Web)

**Установка с XAMPP:**
- Уже включён
- Доступ: http://localhost/phpmyadmin

**Установка вручную (Linux):**
```bash
sudo apt install phpmyadmin -y
```

### 3. DBeaver (Кроссплатформенный)

**Преимущества:**
- Поддержка множества БД
- Мощные возможности

**Установка:**
- Скачайте: https://dbeaver.io/download/

### 4. MySQL Workbench

**Работает с MariaDB!**
- Скачайте: https://www.mysql.com/products/workbench/

### 5. TablePlus (macOS, Windows, Linux)

**Современный и красивый интерфейс**
- Скачайте: https://tableplus.com/

---

## 🔄 Миграция с MySQL на MariaDB

### Если у вас уже MySQL и хотите перейти на MariaDB:

#### 1. Создайте резервную копию

```bash
# Экспорт базы данных MySQL
mysqldump -u root -p fluxor > fluxor_backup.sql
```

#### 2. Установите MariaDB

См. раздел "Установка MariaDB" выше

#### 3. Импортируйте данные

```bash
# Создайте основную базу в MariaDB
mysql -u root -p -e "CREATE DATABASE fluxor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Создайте shadow базу в MariaDB
mysql -u root -p -e "CREATE DATABASE fluxor_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Импортируйте данные только в основную базу
mysql -u root -p fluxor < fluxor_backup.sql
```

**Примечание:** Shadow база должна остаться пустой - Prisma управляет ею автоматически

#### 4. Обновите .env

Добавьте обе строки подключения:
```env
DATABASE_URL="mysql://fluxor:password@localhost:3306/fluxor"
SHADOW_DATABASE_URL="mysql://fluxor:password@localhost:3306/fluxor_shadow"
```

#### 5. Остановите MySQL и запустите MariaDB

**Windows:**
```powershell
Stop-Service MySQL80
Start-Service MariaDB
```

**Linux:**
```bash
sudo systemctl stop mysql
sudo systemctl start mariadb
```

---

## 🚀 Оптимизация MariaDB для Production

### 1. Настройка конфигурации

**Файл конфигурации:**
- Windows: `C:\Program Files\MariaDB X.X\data\my.ini`
- Linux: `/etc/mysql/mariadb.conf.d/50-server.cnf`

**Рекомендуемые настройки:**

```ini
[mysqld]
# Базовые настройки
max_connections = 200
max_allowed_packet = 64M

# InnoDB настройки (основной движок)
innodb_buffer_pool_size = 1G          # 50-70% от RAM
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Кэширование запросов (не для production с большой нагрузкой)
query_cache_type = 0
query_cache_size = 0

# Производительность
table_open_cache = 4000
tmp_table_size = 64M
max_heap_table_size = 64M

# Логирование (отключите slow query log после оптимизации)
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Безопасность
local_infile = 0
```

**Применение изменений:**
```bash
# Linux
sudo systemctl restart mariadb

# Windows
Restart-Service MariaDB
```

### 2. Мониторинг производительности

```sql
-- Текущие соединения
SHOW PROCESSLIST;

-- Статус сервера
SHOW STATUS;

-- Переменные
SHOW VARIABLES LIKE '%buffer%';

-- Медленные запросы
SHOW STATUS LIKE 'Slow_queries';
```

---

## 🔒 Безопасность

### 1. Создайте отдельного пользователя для каждого приложения

```sql
-- Fluxor веб-приложение
CREATE USER 'fluxor_web'@'localhost' IDENTIFIED BY 'password1';
GRANT SELECT, INSERT, UPDATE, DELETE ON fluxor.* TO 'fluxor_web'@'localhost';
GRANT ALL PRIVILEGES ON fluxor_shadow.* TO 'fluxor_web'@'localhost';

-- Discord бот
CREATE USER 'fluxor_bot'@'localhost' IDENTIFIED BY 'password2';
GRANT SELECT, INSERT, UPDATE ON fluxor.* TO 'fluxor_bot'@'localhost';
-- Shadow база боту не нужна

FLUSH PRIVILEGES;
```

**Примечание:** Shadow база нужна только пользователю, который запускает миграции (обычно это основной пользователь приложения)

### 2. Ограничьте удалённый доступ

```sql
-- Только локальные подключения
CREATE USER 'fluxor'@'localhost' IDENTIFIED BY 'password';

-- Конкретный IP
CREATE USER 'fluxor'@'192.168.1.100' IDENTIFIED BY 'password';

-- НИКОГДА не делайте это в production:
-- CREATE USER 'fluxor'@'%' IDENTIFIED BY 'password';
```

### 3. Используйте сильные пароли

```bash
# Генерация пароля
openssl rand -base64 32
```

---

## 📊 Сравнение MySQL vs MariaDB

| Характеристика | MySQL 8.0 | MariaDB 10.11 |
|----------------|-----------|----------------|
| **Лицензия** | GPL + Commercial (Oracle) | GPL (Open Source) |
| **Производительность** | Отлично | Лучше в некоторых случаях |
| **Совместимость** | Стандарт | 100% совместима с MySQL |
| **JSON поддержка** | Есть | Есть (лучше в 10.6+) |
| **Новые функции** | Медленнее | Быстрее выходят |
| **Документация** | Отличная | Хорошая |
| **Сообщество** | Большое | Растущее |

**Вывод:** Для Fluxor подходят обе базы данных одинаково хорошо!

---

## ❓ FAQ

### В: Нужно ли менять код при переходе на MariaDB?

**О:** Нет! Код остаётся полностью идентичным. Prisma работает одинаково.

### В: Можно ли использовать MySQL драйвер с MariaDB?

**О:** Да! `mysql2` пакет работает с обеими БД.

### В: Что лучше для production?

**О:** Обе подходят. MariaDB может быть чуть быстрее и полностью Open Source.

### В: Можно ли использовать MySQL и MariaDB одновременно?

**О:** Да, но они должны быть на разных портах:
```env
# MySQL на 3306
DATABASE_URL="mysql://user:pass@localhost:3306/db1"

# MariaDB на 3307
DATABASE_URL="mysql://user:pass@localhost:3307/db2"
```

### В: Сломаются ли миграции Prisma?

**О:** Нет! Prisma поддерживает MariaDB из коробки.

### В: Обязательно ли создавать shadow базу?

**О:** Зависит от того, как вы работаете с БД:
- **Используете `prisma migrate dev`** → Да, нужна
- **Используете `prisma db push`** → Нет, не нужна
- **Production с `prisma migrate deploy`** → Нет, не нужна

### В: Что будет, если не создать shadow базу?

**О:** При запуске `prisma migrate dev` получите ошибку:
```
Error: P3014 The datasource provider `mysql` specified in your schema does not match the one specified in the url: `postgresql`.
```

Решение: добавьте `SHADOW_DATABASE_URL` в `.env`

### В: Можно ли использовать одну базу для обоих целей?

**О:** Не рекомендуется! Shadow база должна быть отдельной, так как Prisma постоянно её пересоздаёт.

---

## ✅ Чек-лист перехода на MariaDB

- [ ] MariaDB установлена
- [ ] Служба MariaDB запущена
- [ ] `mysql_secure_installation` выполнен
- [ ] Основная база данных создана (`fluxor`)
- [ ] Shadow база данных создана (`fluxor_shadow`)
- [ ] Пользователь создан с правами на обе базы
- [ ] `.env` настроен с `DATABASE_URL` и `SHADOW_DATABASE_URL`
- [ ] `npm run db:generate` успешно выполнен
- [ ] `npm run db:push` успешно выполнен
- [ ] Приложение запускается без ошибок
- [ ] Подключение к обеим БД работает

---

## 🎉 Готово!

MariaDB настроена и готова к работе с Fluxor. Никаких изменений в коде не требуется - всё работает "из коробки"!

**Следующие шаги:**
1. Создайте резервное копирование
2. Настройте автозапуск MariaDB
3. Оптимизируйте конфигурацию под ваши нужды
4. Настройте мониторинг

