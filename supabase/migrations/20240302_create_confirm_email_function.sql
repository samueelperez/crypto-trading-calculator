-- Función para confirmar el email de un usuario en desarrollo
-- Esta función debe tener permisos de seguridad adecuados para producción

-- DROP FUNCTION IF EXISTS confirm_user_email
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con los privilegios del creador
SET search_path = public
AS $$
DECLARE
  is_confirmed BOOLEAN;
BEGIN
  -- Comprobar si el usuario existe y actualizar email_confirmed_at
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      is_sso_user = TRUE
  WHERE id = user_id
  RETURNING (email_confirmed_at IS NOT NULL) INTO is_confirmed;
  
  RETURN is_confirmed;
END;
$$;

-- Otorgar permiso para ejecutar la función a usuarios autenticados
-- NOTA: En producción, considera restringir quién puede llamar a esta función
GRANT EXECUTE ON FUNCTION public.confirm_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_user_email TO service_role;

-- En desarrollo, también podemos permitir a usuarios anónimos para pruebas
-- NOTA: Quita esto en producción
GRANT EXECUTE ON FUNCTION public.confirm_user_email TO anon; 