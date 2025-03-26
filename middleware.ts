import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Este middleware solo actualiza las cookies de autenticación sin cambiar la UI
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Crear cliente de Supabase para el middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Si estamos en una respuesta, podemos modificar los headers de respuesta
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  try {
    // Intento de recuperar la sesión del usuario
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // Manejar específicamente errores 400 relacionados con tokens
    if (error && error.status === 400 && error.message.includes('token')) {
      console.warn('Error de token en middleware:', error.message)
      
      // Si el error es de token inválido, limpiar cookies problemáticas
      // Esto forzará un nuevo inicio de sesión en lugar de quedarse en un estado de error
      const authCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token']
      
      for (const cookieName of authCookies) {
        if (request.cookies.has(cookieName)) {
          response.cookies.set({
            name: cookieName,
            value: '',
            maxAge: 0,
            path: '/',
          })
        }
      }
      
      // Si no estamos en una página de autenticación, redirigir al login
      const url = new URL(request.url)
      const isAuthPage = url.pathname.startsWith('/login') || 
                          url.pathname.startsWith('/register') ||
                          url.pathname.startsWith('/auth/');
      
      if (!isAuthPage) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('error', 'token_expired')
        redirectUrl.searchParams.set('returnUrl', url.pathname)
        return NextResponse.redirect(redirectUrl)
      }
      
      // En páginas de autenticación, continuar normalmente pero con las cookies eliminadas
      return response
    }

    // Rutas protegidas que requieren autenticación
    const protectedPaths = ['/dashboard', '/profile', '/settings', '/trading']
    const url = new URL(request.url)
    
    // Comprobar si la ruta actual está protegida
    const isProtectedPath = protectedPaths.some(path => 
      url.pathname === path || url.pathname.startsWith(`${path}/`)
    )
    
    if (isProtectedPath) {
      // Si no hay sesión y la ruta está protegida, redirigir al login
      if (!session) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('returnUrl', url.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return response
  } catch (e) {
    console.error('Error inesperado en middleware:', e)
    return response
  }
}

// Ejecutar middleware solo en estas rutas
export const config = {
  matcher: [
    /*
     * Executa el middleware en todas las rutas excepto
     * - Archivos estáticos (_next/static, _next/image, favicon.ico, etc)
     * - API routes (/api/, /auth/callback)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|api|auth/callback).*)',
  ],
} 