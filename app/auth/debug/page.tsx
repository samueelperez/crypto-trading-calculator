'use client'

import { Suspense, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientBrowser, getClientSession } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

// Componente principal que maneja la carga de datos
export default function DebugPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true)
        const sessionData = await getClientSession()
        
        if (!sessionData) {
          // Redirigir al usuario a la página de login si no hay sesión
          window.location.href = '/login?message=Debes iniciar sesión para acceder a esta página'
          return
        }
        
        setSession(sessionData)
      } catch (err) {
        console.error('Error al cargar la sesión:', err)
        setError('No se pudo cargar la información de sesión')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [])

  if (loading) {
    return <div className="container mx-auto my-8">Cargando información de sesión...</div>
  }

  if (error) {
    return <div className="container mx-auto my-8 text-red-500">Error: {error}</div>
  }
  
  if (!session) {
    return <div className="container mx-auto my-8">No hay sesión activa</div>
  }

  return <SessionDebugInfo session={session} />
}

// Componente para mostrar la información de sesión
function SessionDebugInfo({ session }: { session: any }) {
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