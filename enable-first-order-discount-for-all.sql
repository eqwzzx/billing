-- Включить скидку первого заказа для всех пользователей которые ещё не делали заказ
-- Это нужно выполнить только один раз после добавления функционала

-- Включаем скидку для всех пользователей у которых нет серверов
UPDATE User 
SET firstOrderDiscount = 1 
WHERE firstOrderDiscount = 0 
  AND id NOT IN (
    SELECT DISTINCT userId FROM Server WHERE deletedAt IS NULL
  );

-- Проверяем сколько пользователей получили скидку
SELECT 
  COUNT(*) as total_users_with_discount,
  (SELECT COUNT(*) FROM User WHERE firstOrderDiscount = 0) as users_without_discount
FROM User 
WHERE firstOrderDiscount = 1;
