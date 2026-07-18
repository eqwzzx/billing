# Исправление проблемы с Prisma и таблицами

## Проблема
```
The table `referrallink` does not exist in the current database.
```

Prisma ищет таблицу с неправильным именем (lowercase вместо правильного).

## Возможные причины

1. **Prisma Client не синхронизирован** с базой данных
2. **Имя таблицы в базе отличается** от ожидаемого
3. **Кэш Prisma** содержит старую информацию

---

## Решение 1: Автоматическое исправление (РЕКОМЕНДУЕТСЯ)

### Запустите скрипт:
```bash
# Дважды кликните на файл:
fix-prisma.bat
```

Этот скрипт:
1. Удалит старый Prisma Client
2. Синхронизирует схему с базой данных
3. Перегенерирует Prisma Client

### Затем перезапустите сервер:
```bash
npm run dev
```

---

## Решение 2: Вручную через командную строку

### Шаг 1: Проверьте имя таблицы в базе данных
```bash
mysql -u avelon -p123456 avelon -e "SHOW TABLES;"
```

Ищите таблицу с именем:
- `ReferralLink` (правильное)
- `referrallink` (неправильное, lowercase)

### Шаг 2: Если таблица названа неправильно, переименуйте её
```sql
mysql -u avelon -p123456 avelon

-- Переименовать таблицу если нужно
RENAME TABLE referrallink TO ReferralLink;
RENAME TABLE referralregistration TO ReferralRegistration;
RENAME TABLE marketingevent TO MarketingEvent;
RENAME TABLE firstorderdiscount TO FirstOrderDiscount;
```

### Шаг 3: Очистите кэш Prisma
```bash
cd C:\Users\Babur\Desktop\Avelon-Web-main

# Удалите кэш
rd /s /q node_modules\.prisma
rd /s /q node_modules\@prisma\client
rd /s /q .next
```

### Шаг 4: Перегенерируйте Prisma Client
```bash
npx prisma generate
```

### Шаг 5: Перезапустите сервер
```bash
npm run dev
```

---

## Решение 3: Применить схему Prisma к базе данных

Если проблемы продолжаются, принудительно примените схему Prisma:

```bash
cd C:\Users\Babur\Desktop\Avelon-Web-main

# Применить схему Prisma (перезапишет таблицы!)
npx prisma db push --force-reset

# ⚠️ ВНИМАНИЕ: Это удалит все данные!
```

**НЕ используйте этот метод если у вас есть важные данные в базе!**

---

## Решение 4: Проверка регистрозависимости MySQL

MariaDB/MySQL на Windows может быть регистронезависимым для имён таблиц.

### Проверьте настройку:
```sql
mysql -u avelon -p123456 avelon -e "SHOW VARIABLES LIKE 'lower_case_table_names';"
```

**Значения:**
- `0` - регистрозависимый (Linux/Unix)
- `1` - регистронезависимый (Windows)
- `2` - смешанный режим (Mac)

### Если значение = 1 (Windows):
Таблицы хранятся в lowercase, но обращение регистронезависимо.

**Решение:** Prisma должен работать, но нужно перегенерировать клиент.

---

## Диагностика

### 1. Проверьте что таблицы существуют:
```bash
# Запустите скрипт проверки:
check-tables.bat
```

Или вручную:
```bash
mysql -u avelon -p123456 avelon -e "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'avelon' AND TABLE_NAME LIKE '%Referral%';"
```

### 2. Проверьте schema.prisma:
```bash
# Найдите модель ReferralLink
type prisma\schema.prisma | findstr /i "model ReferralLink"
```

Должно быть:
```prisma
model ReferralLink {
  ...
  @@map("ReferralLink")
}
```

### 3. Проверьте Prisma Client:
```bash
# Посмотрите какие модели доступны
npx prisma validate
```

---

## Быстрое решение (всё в одной команде)

```bash
cd C:\Users\Babur\Desktop\Avelon-Web-main && rd /s /q node_modules\.prisma 2>nul && rd /s /q node_modules\@prisma\client 2>nul && rd /s /q .next 2>nul && npx prisma generate && echo "Готово! Запустите: npm run dev"
```

---

## Альтернатива: Использовать @@map с lowercase

Если ничего не помогает, измените схему Prisma чтобы использовать lowercase имена:

### В файле `prisma/schema.prisma`:
```prisma
model ReferralLink {
  // ... поля ...
  
  @@map("referrallink")  // Изменить с "ReferralLink" на "referrallink"
}

model ReferralRegistration {
  // ... поля ...
  
  @@map("referralregistration")  // Изменить на lowercase
}
```

### Затем:
```bash
npx prisma generate
npm run dev
```

---

## Проверка после исправления

### Запустите сервер:
```bash
npm run dev
```

### В логах должно быть:
```
[API] POST /api/admin/referrals - Start
[API] User authenticated: ...
[API] Referral link created successfully: ...
POST /api/admin/referrals 201 ✅
```

**Без ошибки** `The table referrallink does not exist`!

---

## Если всё ещё не работает

### Пришлите результаты этих команд:

1. **Список таблиц:**
```bash
mysql -u avelon -p123456 avelon -e "SHOW TABLES;"
```

2. **Информация о таблице:**
```bash
mysql -u avelon -p123456 avelon -e "SHOW CREATE TABLE ReferralLink\G"
```

3. **Настройка регистра:**
```bash
mysql -u avelon -p123456 -e "SHOW VARIABLES LIKE 'lower_case_table_names';"
```

4. **Версия MySQL/MariaDB:**
```bash
mysql -u avelon -p123456 -e "SELECT VERSION();"
```

Это поможет точно определить проблему!
