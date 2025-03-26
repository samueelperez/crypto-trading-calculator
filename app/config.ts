// Configuración global para forzar renderizado dinámico en toda la aplicación
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

// Opciones de metadatos por defecto para la aplicación
export const defaultMetadata = {
  title: 'Crypto Trading Platform',
  description: 'Plataforma de seguimiento y gestión de operaciones con criptomonedas',
  keywords: ['crypto', 'trading', 'portfolio', 'investment'],
}

// Configuración de autenticación
export const authConfig = {
  loginPath: '/login',
  redirectAfterLogin: '/dashboard',
  unauthorizedRedirect: '/login?message=Debes iniciar sesión para acceder a esta página',
}

// Tiempos de caché (en segundos)
export const cacheTimes = {
  prices: 60, // Actualizar precios cada minuto
  balances: 300, // Actualizar balances cada 5 minutos
  portfolios: 600, // Actualizar carteras cada 10 minutos
  session: 3600, // Validar sesión cada hora
}

// Configuración de la API
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 10000, // 10 segundos
  retries: 3,
}

// Otros ajustes
export const settings = {
  debug: process.env.NODE_ENV !== 'production',
  enableAnalytics: process.env.NODE_ENV === 'production',
} 