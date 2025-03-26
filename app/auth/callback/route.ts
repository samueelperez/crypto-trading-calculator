import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options) {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          },
        },
      }
    )
    
    // Intercambiar el código por una sesión
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error al intercambiar código por sesión:', error)
      // Redirigir a la página de error con información sobre el problema
      return NextResponse.redirect(new URL('/auth/error?message=Error+al+procesar+la+autenticación', requestUrl.origin))
    }
    
    // Verificar que el usuario sea válido consultando al servidor
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Error al verificar usuario después de autenticación:', userError)
      return NextResponse.redirect(new URL('/auth/error?message=Error+al+verificar+usuario', requestUrl.origin))
    }
    
    // Autenticación exitosa, redirigir al dashboard
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
  }
  
  // Si no hay código, redirigir a la página de inicio
  return NextResponse.redirect(new URL('/', requestUrl.origin))
} 