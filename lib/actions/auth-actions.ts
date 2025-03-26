'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { redirect } from 'next/navigation'

// Crear cliente de Supabase en un Server Action
function createServerActionClient() {
  return createServerClient<Database>(
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
}

/**
 * Server Action mejorado para iniciar sesión
 * - Manejo detallado de errores 400
 * - Soporte para modo de desarrollo con bypass automático
 */
export async function serverSignIn(email: string, password: string) {
  const supabase = createServerActionClient()
  
  try {
    console.log('Intentando iniciar sesión con:', { email, passwordProvided: !!password })
    
    // 1. Intento principal de inicio de sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // 2. Manejo detallado de errores
    if (error) {
      console.error('Error de autenticación detallado:', {
        message: error.message,
        status: error.status,
        name: error.name,
        cause: error.cause
      })
      
      // 3. Manejo específico para el error 400
      if (error.status === 400) {
        // Si el error es de email no confirmado, intentar auto-confirmación en desarrollo
        if (error.message.includes('Email not confirmed') || error.message.includes('email not confirmed')) {
          console.log('Intentando auto-confirmación para entorno de desarrollo')
          
          // 3.1 Intentar confirmar el correo automáticamente (solo para desarrollo)
          try {
            // Intento 1: Verificar si el usuario existe y confirmarlo con RPC
            const { error: userError } = await supabase.rpc('confirm_user_email_by_address', {
              user_email: email
            }).catch(() => ({ error: true }))
            
            if (!userError) {
              // Si se confirmó exitosamente, intentar iniciar sesión de nuevo
              console.log('Auto-confirmación exitosa, reintentando inicio de sesión')
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email,
                password,
              })
              
              if (!retryError && retryData.session) {
                // Devolver resultado exitoso después de la auto-confirmación
                return { success: true, user: retryData.user }
              }
            }
          } catch (confirmError) {
            console.error('Error en auto-confirmación:', confirmError)
          }
          
          // Si llegamos aquí, la auto-confirmación no funcionó
          // Devolvemos un mensaje específico para el entorno de desarrollo
          return { 
            error: 'Email no confirmado. Para entorno de desarrollo, debes ejecutar la migración SQL o crear este usuario en el panel de Supabase.',
            needsVerification: true,
            email
          }
        }
        
        // Otros errores 400
        return { error: `Error de autenticación (${error.status}): ${error.message}` }
      }
      
      // Errores genéricos
      return { error: error.message }
    }
    
    // 4. Validación de la sesión obtenida
    if (!data.session) {
      return { error: 'No se pudo crear la sesión. Intenta de nuevo.' }
    }
    
    // 5. Verificación de seguridad con getUser
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData.user) {
      return { error: 'Error al verificar el usuario después del inicio de sesión' }
    }
    
    // 6. Éxito: sesión y usuario verificados
    return { success: true, user: userData.user }
  } catch (unexpectedError) {
    console.error('Error inesperado en inicio de sesión:', unexpectedError)
    return { 
      error: 'Error inesperado durante la autenticación. Por favor, inténtalo de nuevo.',
      technicalError: unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError)
    }
  }
}

// Server Action para registrarse
export async function serverSignUp(email: string, password: string) {
  const supabase = createServerActionClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })
  
  if (error) {
    return { error: error.message }
  }
  
  // En desarrollo, verificamos si necesitamos confirmar manualmente el email
  if (data.user && !data.session) {
    try {
      // Intento de confirmar automáticamente el email para desarrollo
      await supabase.rpc('confirm_user_email', {
        user_id: data.user.id
      }).catch(() => {
        // Silenciar error si el RPC no existe
      })
      
      // Intentar iniciar sesión después de la confirmación
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInData.session) {
        // Verificar el usuario de forma segura
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          return { success: true, user: userData.user }
        }
      }
    } catch (confirmError) {
      console.error('Error al confirmar email automáticamente:', confirmError)
    }
    
    return { 
      requiresEmailConfirmation: true, 
      user: data.user 
    }
  }
  
  return { success: true, user: data.user }
}

// Server Action para cerrar sesión
export async function serverSignOut() {
  const supabase = createServerActionClient()
  
  await supabase.auth.signOut()
  redirect('/')
}

// Server Action para reenviar correo de verificación
export async function resendVerificationEmail(email: string) {
  const supabase = createServerActionClient()
  
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

/**
 * Server Action segura para obtener la sesión actual del usuario
 * - IMPORTANTE: Utiliza getUser() en lugar de confiar en el user de la sesión
 * - Esta función no genera la advertencia de seguridad de Supabase
 */
export async function getServerSession() {
  const supabase = createServerActionClient()
  
  try {
    // SEGURO: Obtener el usuario directamente usando getUser()
    // Esto contacta al servidor de Supabase para autenticar los datos
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData.user) {
      return null
    }
    
    // Si necesitamos datos de la sesión, podemos obtenerlos después
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (!sessionData.session) {
      return null
    }
    
    // Devolver una sesión combinada donde el usuario es el autenticado
    return {
      ...sessionData.session,
      // IMPORTANTE: Usar el usuario autenticado, no el de la sesión
      user: userData.user
    }
  } catch (error) {
    console.error('Error al obtener sesión segura:', error)
    return null
  }
} 