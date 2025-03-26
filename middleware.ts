import { NextResponse, NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Listado de rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/auth/signup', '/auth/recover', '/auth/callback', '/api/', '/favicon.ico']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Si es una ruta pública, permitir acceso sin verificar autenticación
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Verificar que las variables de entorno estén disponibles
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Variables de entorno de Supabase no disponibles en middleware')
    
    // En desarrollo, permitir continuar pero mostrar advertencia
    if (process.env.NODE_ENV !== 'production') {
      console.warn('En desarrollo: permitiendo acceso a ruta protegida sin autenticación debido a variables de entorno faltantes')
      return NextResponse.next()
    }
    
    // En producción, redirigir a login con mensaje de error
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('message', 'Error de configuración del servidor. Por favor, inténtelo más tarde.')
    return NextResponse.redirect(redirectUrl)
  }

  // Crear cliente de Supabase en el middleware
  const response = NextResponse.next()
  
  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
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

    // Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('message', 'Debes iniciar sesión para acceder a esta página')
      redirectUrl.searchParams.set('returnUrl', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.error('Error en middleware:', error)
    
    // En caso de error crítico, redirigir a login con mensaje
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('message', 'Error de autenticación. Por favor, inicia sesión nuevamente.')
    return NextResponse.redirect(redirectUrl)
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