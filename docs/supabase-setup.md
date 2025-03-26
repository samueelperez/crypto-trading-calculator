# Configuración de Supabase para autenticación y base de datos

Esta guía explica cómo configurar Supabase para nuestra aplicación de trading de criptomonedas.

## 1. Crear un proyecto en Supabase

1. Ve a [Supabase](https://supabase.com/) y crea una cuenta o inicia sesión
2. Crea un nuevo proyecto con el nombre "crypto-trading-platform"
3. Anota la URL y la clave anónima (se utilizarán en las variables de entorno)

## 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-url-de-supabase.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
```

## 3. Crear tablas en la base de datos

En el panel de Supabase, ve a SQL Editor y ejecuta las siguientes consultas:

### Tabla de perfiles

```sql
-- Tabla para los perfiles de usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  preferences JSONB
);

-- Función para crear automáticamente un perfil después del registro
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función después de una inserción en auth.users
CREATE TRIGGER create_profile_after_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_user();
```

### Tabla para las claves API de exchanges

```sql
-- Tabla para almacenar las claves API de los exchanges
CREATE TABLE user_exchange_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  exchange TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exchange)
);

-- Política RLS para proteger las claves API
ALTER TABLE user_exchange_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exchange keys"
  ON user_exchange_keys
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exchange keys"
  ON user_exchange_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exchange keys"
  ON user_exchange_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exchange keys"
  ON user_exchange_keys
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Tabla para las operaciones de trading

```sql
-- Tabla para el registro de operaciones
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL, -- 'buy' o 'sell'
  quantity DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  fee DECIMAL NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política RLS para proteger los trades
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades"
  ON trades
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
  ON trades
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
  ON trades
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades"
  ON trades
  FOR DELETE
  USING (auth.uid() = user_id);
```

## 4. Configurar la autenticación

En el panel de Supabase, ve a Authentication > Settings:

1. **Proveedores de Email**:
   - Activa "Email confirmations" = Enabled
   - Site URL = URL de tu aplicación (por ejemplo, https://crypto-trading-platform.vercel.app)
   - Redirect URLs = https://crypto-trading-platform.vercel.app/auth/callback

2. **Aplicaciones autorizadas**:
   - Agrega los dominios donde se ejecutará tu aplicación (por ejemplo, localhost, tu dominio de producción)

## 5. Política de seguridad Row Level Security (RLS)

Configura políticas para la tabla de perfiles:

```sql
-- Habilitar RLS en la tabla de perfiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean y editen su propio perfil
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

## 6. Comandos útiles para trabajar con Supabase

### Instalar Supabase CLI (opcional)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Inicializar Supabase en el proyecto
supabase init
```

### Usar Supabase CLI para extraer tipos (opcional)

```bash
# Generar tipos de TypeScript desde la base de datos
supabase gen types typescript --project-id tu-project-id > types/supabase.ts
```

## 7. Ejemplo de consultas usando el cliente de Supabase

### En el lado del servidor

```typescript
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function getUserProfile() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .single();
    
  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  
  return profile;
}
```

### En el lado del cliente

```typescript
"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState, useEffect } from "react";

export function ProfileComponent() {
  const [profile, setProfile] = useState(null);
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    async function loadProfile() {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .single();
        
      if (!error) {
        setProfile(profile);
      }
    }
    
    loadProfile();
  }, []);
  
  // Resto del componente
}
```

## 8. Verificar la configuración

Para verificar que todo está configurado correctamente:

1. Prueba registrar un usuario en tu aplicación
2. Comprueba en Supabase > Authentication > Users que el usuario aparece
3. Comprueba en Supabase > Table Editor > profiles que se ha creado un perfil para ese usuario
4. Prueba iniciar sesión y cerrar sesión desde tu aplicación 