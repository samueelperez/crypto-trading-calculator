// Archivo dividido en un componente de servidor y uno de cliente
import { Suspense } from 'react'
import { getSession } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

// Componente de servidor para obtener la sesión
async function SessionDebugPage() {
  // Obtener información de sesión
  const session = await getSession()
  
  if (!session) {
    redirect('/login?message=Debes iniciar sesión para acceder a esta página')
  }
  
  return <ClientDebugPage session={session} />
}

// Componente por defecto con Suspense para manejar loading state
export default function DebugPageWrapper() {
  return (
    <Suspense fallback={<div className="container mx-auto my-8">Cargando información de sesión...</div>}>
      <SessionDebugPage />
    </Suspense>
  )
}

// Componente cliente que recibe los datos del servidor
'use client'
function ClientDebugPage({ session }: { session: any }) {
  // Extraer session para debug
  const currentSession = session
  
  // Información de usuario
  const userInfo = {
    id: session.user?.id || 'No disponible',
    email: session.user?.email || 'No disponible',
    role: session.user?.role || 'No disponible',
    lastSignIn: session.user?.last_sign_in_at 
      ? new Date(session.user.last_sign_in_at).toLocaleString() 
      : 'Desconocido',
  }
  
  // Verificar que expires_at existe y tiene un valor
  const expires_at = currentSession?.expires_at || 0
  const expiresDate = new Date(expires_at * 1000)
  const expiresInMinutes = Math.floor((expires_at * 1000 - Date.now()) / 1000 / 60)
  
  // Información de sesión
  const sessionInfo = {
    isActive: !!currentSession,
    provider: session.user?.app_metadata?.provider || 'Desconocido',
    authenticated: session.user?.aud === 'authenticated',
    accessToken: currentSession?.access_token 
      ? `${currentSession.access_token.substring(0, 10)}...` 
      : 'No disponible',
    refreshToken: currentSession?.refresh_token 
      ? `${currentSession.refresh_token.substring(0, 5)}...` 
      : 'No disponible',
    expiresAt: expiresDate.toLocaleString(),
    expiresIn: `${expiresInMinutes} minutos`,
  }
  
  return (
    <div className="container mx-auto my-8 space-y-8">
      <h1 className="text-2xl font-bold">Información de Depuración</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Información de Usuario</CardTitle>
          <CardDescription>Datos del usuario actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {Object.entries(userInfo).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2">
                <span className="font-semibold">{key}:</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Información de Sesión</CardTitle>
          <CardDescription>Datos de la sesión actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {Object.entries(sessionInfo).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2">
                <span className="font-semibold">{key}:</span>
                <span>{typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 