-- Script para limpiar usuarios problemáticos en Supabase
-- Ejecutar este script desde el SQL Editor en el panel de Supabase

-- ADVERTENCIA: Este script elimina usuarios. Úsalo con precaución.
-- Recomendación: Haz una copia de seguridad antes de ejecutarlo.

-- 1. Identificar usuarios problemáticos (sin eliminar)
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'No confirmado'
    ELSE 'Confirmado' 
  END as estado
FROM auth.users
WHERE email LIKE '%crypto.com'; -- Filtrar por dominio o correo específico

-- 2. Opción para eliminar un usuario específico por email
-- (Descomenta para usar)
-- DELETE FROM auth.users
-- WHERE email = 'p@crypto.com';

-- 3. Eliminar usuarios no confirmados que nunca iniciaron sesión
-- (Descomenta para usar)
-- DELETE FROM auth.users
-- WHERE email_confirmed_at IS NULL AND last_sign_in_at IS NULL;

-- 4. Alternativa: Confirmar automáticamente emails pendientes
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 5. Verificar si hay identidades duplicadas para un mismo usuario
-- (Esto puede causar problemas en el registro)
SELECT 
  user_id, 
  COUNT(*) as num_identities
FROM auth.identities
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 6. Corregir inconsistencias entre identities y users
-- Eliminar identidades sin usuarios asociados
-- (Descomenta para usar)
-- DELETE FROM auth.identities
-- WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 7. Verificar si el error persiste
-- Si después de los pasos anteriores el error continúa,
-- es posible que haya un problema con la estructura de la
-- base de datos o con los límites del plan de Supabase. 