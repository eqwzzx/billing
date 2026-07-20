-- Генерируем реферальные коды для существующих пользователей
-- Код формируется из первых 6 символов email + случайное 4-значное число

-- Проверяем что колонка существует
SELECT COUNT(*) as existing_codes FROM `User` WHERE referralCode IS NOT NULL;

-- Обновляем только тех, у кого нет кода
UPDATE `User` SET 
  referralCode = CONCAT(
    UPPER(SUBSTRING(REPLACE(SUBSTRING_INDEX(email, '@', 1), '.', ''), 1, 6)),
    LPAD(FLOOR(1000 + RAND() * 9000), 4, '0')
  )
WHERE referralCode IS NULL;

-- Показываем результат
SELECT 'Коды успешно сгенерированы!' as status;
SELECT COUNT(*) as total_codes FROM `User` WHERE referralCode IS NOT NULL;
SELECT id, email, referralCode FROM `User` WHERE referralCode IS NOT NULL LIMIT 10;
