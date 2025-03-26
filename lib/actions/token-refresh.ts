'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

/**
 * Función para verificar y refrescar el token de autenticación
 * - Se puede llamar antes de operaciones importantes que requieran autenticación
 * - Resuelve problemas de token expirado que causan errores 400
 */
export async function refreshAuthTokenIfNeeded() {
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookieStore = await cookies()
            return cookieStore.get(name)?.value
          },
          async set(name: string, value: string, options: CookieOptions) {
            const cookieStore = await cookies()
            cookieStore.set({ name, value, ...options })
          },
          async remove(name: string, options: CookieOptions) {
            const cookieStore = await cookies()
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          },
        },
      }
    )

    // Intentar obtener la sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Si hay un error o no hay sesión, no hay nada que refrescar
    if (sessionError || !session) {
      return { success: false, message: 'No hay sesión activa' }
    }

    // Verificar si el token está próximo a expirar (dentro de 10 minutos)
    const expiresAt = session.expires_at
    const now = Math.floor(Date.now() / 1000) // Tiempo actual en segundos
    const tenMinutesInSeconds = 10 * 60
    
    if (expiresAt && expiresAt - now < tenMinutesInSeconds) {
      // El token expirará pronto, intentamos refrescarlo
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('Error al refrescar el token:', refreshError)
        return {
          success: false,
          message: 'Error al refrescar el token',
          error: refreshError.message
        }
      }
      
      if (refreshData.session) {
        return {
          success: true,
          message: 'Token refrescado exitosamente',
          expiresAt: new Date(refreshData.session.expires_at * 1000).toISOString()
        }
      }
    }
    
    // El token está vigente, no necesita refrescarse
    return {
      success: true,
      message: 'Token vigente',
      expiresAt: new Date(session.expires_at * 1000).toISOString()
    }
  } catch (error) {
    console.error('Error inesperado al refrescar token:', error)
    return {
      success: false,
      message: 'Error inesperado al verificar el token',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Función para limpiar todas las cookies de autenticación
 * - Útil como último recurso cuando hay problemas persistentes con tokens
 */
export async function clearAuthCookies() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    // Buscar y eliminar todas las cookies relacionadas con autenticación
    let removedCount = 0
    
    for (const cookie of allCookies) {
      if (
        cookie.name.includes('supabase') ||
        cookie.name.includes('auth') ||
        cookie.name.includes('sb-') ||
        cookie.name === '__session'
      ) {
        cookieStore.set({
          name: cookie.name,
          value: '',
          maxAge: 0,
          path: '/',
          sameSite: 'lax',
        })
        removedCount++
      }
    }
    
    return {
      success: true,
      message: `Se eliminaron ${removedCount} cookies de autenticación`
    }
  } catch (error) {
    console.error('Error al limpiar cookies de autenticación:', error)
    return {
      success: false,
      message: 'Error al limpiar cookies',
      error: error instanceof Error ? error.message : String(error)
    }
  }
} 