import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import type { Database } from "@/types/supabase"
import { cookies } from "next/headers"

// Función corregida para manejo de cookies - solo para uso en Server Components
export const createClient = async () => {
  // Obtenemos el store de cookies (en Next.js 14+ devuelve una Promise)
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Manejo de errores cuando las cookies ya están enviadas
            console.error("Error al establecer cookie:", error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch (error) {
            console.error("Error al eliminar cookie:", error)
          }
        },
      },
    }
  )
}

// Mantener las funciones originales
export const createServerSupabaseClient = createClient

// Función para obtener sesión actual - solo para uso en Server Components
export const getSession = async () => {
  const supabase = await createClient()
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error("Error al obtener sesión:", error.message)
      return null
    }
    return session
  } catch (error) {
    console.error("Error inesperado al obtener sesión:", error)
    return null
  }
}

/**
 * Obtener detalles del usuario autenticado (App Router)
 * @returns Información del usuario con su perfil, o null si no hay usuario
 */
export async function getUserDetails() {
  try {
    const supabase = await createClient()
    
    // Usar getUser() directamente como recomienda Supabase para mayor seguridad
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    // Obtener datos del perfil del usuario desde la base de datos
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id as string)
      .single()
    
    return {
      ...user,
      profile
    }
  } catch (error) {
    console.error('Error al obtener detalles del usuario:', error)
    return null
  }
}

// Versión segura para verificar si hay sesión sin lanzar excepciones
export async function hasSession() {
  try {
    // Usar getUser directamente es más seguro que session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch (error) {
    return false
  }
}

// Versión para Pages Router (compatible con getServerSideProps)
export function createServerSupabaseClientForPages(context: {
  req: any;
  res: any;
}) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return context.req.cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          context.res.setHeader(
            'Set-Cookie',
            `${name}=${value}; Path=${options.path || '/'}; Max-Age=${options.maxAge || 31536000}${options.domain ? `; Domain=${options.domain}` : ''}`
          );
        },
        remove(name: string, options: CookieOptions) {
          context.res.setHeader(
            'Set-Cookie',
            `${name}=; Path=${options.path || '/'}; Max-Age=0${options.domain ? `; Domain=${options.domain}` : ''}`
          );
        },
      },
    }
  );
}

// Función para obtener el usuario actual - solo para uso en Server Components
export const getUser = async () => {
  const supabase = await createClient()
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error("Error al obtener usuario:", error.message)
      return null
    }
    return user
  } catch (error) {
    console.error("Error inesperado al obtener usuario:", error)
    return null
  }
}

