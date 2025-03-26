import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import type { Database } from "@/types/supabase"
import { cookies } from "next/headers"

// Versión para App Router (compatible con restricciones de Next.js 14)
export async function createServerSupabaseClient() {
  try {
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            // IMPORTANTE: Usar await con cookies() antes de llamar a cualquier método
            const cookieStore = await cookies()
            return cookieStore.get(name)?.value
          },
          async set(name: string, value: string, options: CookieOptions) {
            try {
              // IMPORTANTE: Usar await con cookies() antes de llamar a cualquier método
              const cookieStore = await cookies()
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('Error al establecer cookie:', error)
            }
          },
          async remove(name: string, options: CookieOptions) {
            try {
              // IMPORTANTE: Usar await con cookies() antes de llamar a cualquier método
              const cookieStore = await cookies()
              cookieStore.set({ name, value: '', ...options, maxAge: 0 })
            } catch (error) {
              console.error('Error al eliminar cookie:', error)
            }
          },
        },
      }
    )
  } catch (error) {
    console.error('Error al crear cliente de Supabase:', error)
    throw new Error('No se pudo crear el cliente de Supabase')
  }
}

/**
 * Obtener la sesión actual de forma segura (App Router)
 * @returns La sesión actual o null si no hay sesión
 */
export async function getSession() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Primera obtenemos la sesión desde las cookies
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return null
    }
    
    // MEJORA DE SEGURIDAD: Verificamos que el usuario sea válido usando getUser()
    // que autentica los datos a través del servidor de Supabase
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('Sesión potencialmente manipulada detectada: usuario no válido')
      return null
    }
    
    // Si llegamos aquí, la sesión es válida y el usuario también
    return {
      ...session,
      user // Reemplazamos el usuario de la sesión con el usuario autenticado
    }
  } catch (error) {
    console.error('Error al obtener la sesión de forma segura:', error)
    return null
  }
}

/**
 * Obtener detalles del usuario autenticado (App Router)
 * @returns Información del usuario con su perfil, o null si no hay usuario
 */
export async function getUserDetails() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Usar getUser() directamente como recomienda Supabase para mayor seguridad
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    // Obtener datos del perfil del usuario desde la base de datos
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
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
    const supabase = await createServerSupabaseClient()
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

