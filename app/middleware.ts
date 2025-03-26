import { NextResponse, NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Listado de rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/auth/signup', '/auth/recover', '/api/', '/favicon.ico']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Crear cliente de Supabase en el middleware
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Verificar sesión para rutas protegidas
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  if (!isPublicRoute) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('message', 'Debes iniciar sesión para acceder a esta página')
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error en middleware:', error)
      // En caso de error, permitir que continúe pero registrar el problema
    }
  }

  return response
}

// Configurar para que solo se ejecute en rutas específicas
export const config = {
  matcher: [
    /*
     * Excluir archivos estáticos, API y rutas de autenticación del middleware
     * para evitar problemas de rendimiento y loops infinitos
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 