-- Funciones para confirmación de email en entorno de desarrollo
-- ATENCIÓN: Estas funciones son adecuadas para entornos de desarrollo
-- En producción, considere implementar restricciones adicionales

-- Función para confirmar un correo electrónico por el ID del usuario
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con los privilegios del creador
SET search_path = public
AS $$
DECLARE
  is_confirmed BOOLEAN;
BEGIN
  -- Actualizar email_confirmed_at solo si es NULL
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = user_id
  RETURNING (email_confirmed_at IS NOT NULL) INTO is_confirmed;
  
  RETURN COALESCE(is_confirmed, FALSE);
END;
$$;

-- Función para confirmar un correo electrónico por dirección de email
-- Útil cuando solo conocemos el email pero no el ID
CREATE OR REPLACE FUNCTION public.confirm_user_email_by_address(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID;
  is_confirmed BOOLEAN;
BEGIN
  -- Buscar el ID del usuario por email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RETURN FALSE; -- Usuario no encontrado
  END IF;
  
  -- Actualizar email_confirmed_at solo si es NULL
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = user_id
  RETURNING (email_confirmed_at IS NOT NULL) INTO is_confirmed;
  
  RETURN COALESCE(is_confirmed, FALSE);
END;
$$;

-- Otorgar permisos para ejecutar las funciones
GRANT EXECUTE ON FUNCTION public.confirm_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_user_email TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_user_email_by_address TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_user_email_by_address TO service_role;

-- En desarrollo también permitimos a anónimos (para tests)
-- En producción esto NO debería estar habilitado
GRANT EXECUTE ON FUNCTION public.confirm_user_email TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_user_email_by_address TO anon;

-- Indicador de que la migración se ejecutó correctamente
SELECT 'Funciones de confirmación de email instaladas correctamente' as log; 