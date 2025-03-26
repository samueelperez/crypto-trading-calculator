'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

// Verifica que las variables de entorno necesarias estén disponibles
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables de entorno de Supabase no configuradas: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// URL base de la aplicación, detectando el puerto actual
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

// Crear cliente de Supabase con mejores mensajes de error
export const createClient = () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Variables de entorno de Supabase no configuradas')
    }
    
    // Crear el cliente con las variables de entorno
    return createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          // Actualizar la URL de redirección para usar el origen actual
          redirectTo: `${getBaseUrl()}/auth/callback`
        },
        // Eliminar la configuración global de fetch que causa problemas de CORS
        // Supabase ya maneja esto internamente
      }
    )
  } catch (error) {
    console.error('Error al crear cliente de Supabase:', error)
    // En caso de error, devolver un cliente con mensajes amigables
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error desconocido al inicializar Supabase'
      
    throw new Error(`Error de configuración de autenticación: ${errorMessage}`)
  }
}

// Exportar una instancia del cliente para uso general
export const supabase = createClient() 