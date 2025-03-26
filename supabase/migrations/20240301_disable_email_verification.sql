-- Desactivar la verificación de email en entorno de desarrollo
-- Esto creará un trigger que marcará automáticamente los emails como verificados

-- Primero eliminamos el trigger (para evitar problemas de dependencia)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Luego eliminamos la función
DROP FUNCTION IF EXISTS handle_new_user();

-- Crear función para actualizar usuarios nuevos
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Marcar el email como confirmado automáticamente
  -- Nota: No actualizamos confirmed_at porque es una columna generada
  UPDATE auth.users 
  SET email_confirmed_at = now(), 
      is_sso_user = TRUE
  WHERE id = NEW.id;
  
  -- También podemos insertar en profiles automáticamente
  -- Verificamos primero si ya existe el registro para evitar errores
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, email, updated_at, created_at)
    VALUES (NEW.id, NEW.email, now(), now());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger que se activa cuando se crea un nuevo usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Marcar como verificados los usuarios existentes sin verificar
-- Nota: No actualizamos confirmed_at porque es una columna generada
UPDATE auth.users 
SET email_confirmed_at = now(),
    is_sso_user = TRUE
WHERE email_confirmed_at IS NULL;

-- Log para confirmar que la migración se ejecutó
SELECT 'Verificación automática de email configurada correctamente' as log; 