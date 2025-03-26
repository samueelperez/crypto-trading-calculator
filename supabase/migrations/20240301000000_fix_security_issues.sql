-- Corrige el problema de seguridad "mutable search_path" en la función update_updated_at_column
-- Al establecer explícitamente el search_path, mejoramos la seguridad de la función

-- Primero, verificamos si la función existe
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_proc
        WHERE proname = 'update_updated_at_column'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        -- Redefinir la función con un search_path explícito
        DROP FUNCTION IF EXISTS public.update_updated_at_column();
        
        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$;
        
        RAISE NOTICE 'Función update_updated_at_column actualizada con search_path seguro';
    ELSE
        RAISE NOTICE 'La función update_updated_at_column no existe, no se realizaron cambios';
    END IF;
END
$$; 