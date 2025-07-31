-- Проверим текущие статусы пользователей
SELECT 
  id,
  email,
  name,
  role,
  approved,
  created_at
FROM profiles
ORDER BY created_at DESC;
