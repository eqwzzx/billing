-- Добавление роли PR_MANAGER в enum user_role

USE fluxor;

-- Изменяем enum чтобы добавить PR_MANAGER
ALTER TABLE `User` 
MODIFY COLUMN `role` ENUM('USER', 'ADMIN', 'PR_MANAGER') NOT NULL DEFAULT 'USER';

-- Проверка
SELECT 'Роль PR_MANAGER добавлена!' as message;

-- Показываем текущую структуру
SHOW COLUMNS FROM `User` LIKE 'role';

-- Показываем всех пользователей с их ролями
SELECT id, email, role FROM `User` LIMIT 10;
