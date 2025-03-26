'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { refreshAuthTokenIfNeeded, clearAuthCookies } from '@/lib/actions/token-refresh'

export default function AuthDebugPage() {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [cookies, setCookies] = useState<string[]>([])
  
  // Usar la API actual de Supabase
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Cargar información de sesión
  useEffect(() => {
    async function loadAuthInfo() {
      try {
        // Obtener sesión y usuario
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        setSession(currentSession)
        setUser(currentUser)
        setStatus(currentUser ? 'authenticated' : 'unauthenticated')
        
        // Obtener información sobre cookies
        const availableCookies = document.cookie.split(';').map(c => c.trim())
        setCookies(availableCookies)
        
        // Verificar estado del token
        if (currentSession) {
          setTokenInfo({
            accessToken: `${currentSession.access_token.substring(0, 10)}...`,
            refreshToken: `${currentSession.refresh_token.substring(0, 5)}...`,
            expiresAt: new Date(currentSession.expires_at * 1000).toLocaleString(),
            expiresIn: Math.floor((currentSession.expires_at * 1000 - Date.now()) / 1000 / 60) + ' minutos',
          })
        }
      } catch (e) {
        setError('Error al cargar información de autenticación: ' + (e instanceof Error ? e.message : String(e)))
        setStatus('unauthenticated')
      }
    }
    
    loadAuthInfo()
  }, [supabase])
  
  // Refrescar token manualmente
  const handleRefreshToken = async () => {
    setMessage('Refrescando token...')
    setError('')
    
    try {
      const result = await refreshAuthTokenIfNeeded()
      
      if (result.success) {
        setMessage(`Token actualizado: ${result.message}. Expira: ${result.expiresAt}`)
        
        // Recargar información de sesión
        const { data: { session: refreshedSession } } = await supabase.auth.getSession()
        setSession(refreshedSession)
        
        if (refreshedSession) {
          setTokenInfo({
            accessToken: `${refreshedSession.access_token.substring(0, 10)}...`,
            refreshToken: `${refreshedSession.refresh_token.substring(0, 5)}...`,
            expiresAt: new Date(refreshedSession.expires_at * 1000).toLocaleString(),
            expiresIn: Math.floor((refreshedSession.expires_at * 1000 - Date.now()) / 1000 / 60) + ' minutos',
          })
        }
      } else {
        setError(`Error al refrescar token: ${result.message}`)
      }
    } catch (e) {
      setError('Error inesperado: ' + (e instanceof Error ? e.message : String(e)))
    }
  }
  
  // Limpiar cookies de autenticación
  const handleClearCookies = async () => {
    if (window.confirm('¿Estás seguro? Esto cerrará tu sesión actual.')) {
      setMessage('Limpiando cookies de autenticación...')
      setError('')
      
      try {
        const result = await clearAuthCookies()
        
        if (result.success) {
          setMessage(result.message + ' - Refresca la página para ver los cambios')
          // Recargar en 2 segundos
          setTimeout(() => window.location.reload(), 2000)
        } else {
          setError(`Error: ${result.message}`)
        }
      } catch (e) {
        setError('Error inesperado: ' + (e instanceof Error ? e.message : String(e)))
      }
    }
  }
  
  // Función para limpiar cookies en el cliente
  const handleClearClientCookies = () => {
    if (window.confirm('¿Estás seguro? Esto eliminará todas las cookies de autenticación en el navegador.')) {
      try {
        let count = 0
        const cookies = document.cookie.split(';')
        
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i]
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
          
          if (
            name.includes('supabase') ||
            name.includes('auth') ||
            name.includes('sb-') ||
            name === '__session'
          ) {
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;'
            count++
          }
        }
        
        setMessage(`Se han eliminado ${count} cookies en el navegador. Recargando...`)
        setTimeout(() => window.location.reload(), 1500)
      } catch (e) {
        setError('Error al limpiar cookies del navegador: ' + (e instanceof Error ? e.message : String(e)))
      }
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Diagnóstico de Autenticación</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Estado de autenticación</h2>
        <p className="mb-2">
          Estado: 
          <span 
            className={`ml-2 px-2 py-1 rounded text-sm ${
              status === 'authenticated' 
                ? 'bg-green-100 text-green-800' 
                : status === 'unauthenticated' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {status === 'authenticated' 
              ? 'Autenticado' 
              : status === 'unauthenticated' 
                ? 'No autenticado' 
                : 'Cargando...'}
          </span>
        </p>
        
        {user && (
          <div className="mt-3">
            <h3 className="font-medium">Información del usuario:</h3>
            <ul className="list-disc ml-5 mt-1">
              <li>ID: {user.id}</li>
              <li>Email: {user.email}</li>
              <li>Email confirmado: {user.email_confirmed_at ? 'Sí' : 'No'}</li>
              <li>Último inicio de sesión: {user.last_sign_in_at || 'Nunca'}</li>
            </ul>
          </div>
        )}
        
        {tokenInfo && (
          <div className="mt-4">
            <h3 className="font-medium">Información del token:</h3>
            <ul className="list-disc ml-5 mt-1">
              <li>Token: {tokenInfo.accessToken}</li>
              <li>Token de refresco: {tokenInfo.refreshToken}</li>
              <li>Expira: {tokenInfo.expiresAt}</li>
              <li>Tiempo restante: {tokenInfo.expiresIn}</li>
            </ul>
          </div>
        )}
        
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleRefreshToken}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refrescar token
          </button>
          
          <button
            onClick={handleClearCookies}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Limpiar cookies (servidor)
          </button>
          
          <button
            onClick={handleClearClientCookies}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Limpiar cookies (cliente)
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Cookies detectadas</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                <th className="px-4 py-2 border text-left">Cookie</th>
                <th className="px-4 py-2 border text-left">Valor truncado</th>
              </tr>
            </thead>
            <tbody>
              {cookies.length > 0 ? (
                cookies.map((cookie, idx) => {
                  const [name, value] = cookie.split('=')
                  const truncatedValue = value && value.length > 10 
                    ? `${value.substring(0, 10)}...` 
                    : value
                    
                  return (
                    <tr key={idx} className="border">
                      <td className="px-4 py-2 border">{name}</td>
                      <td className="px-4 py-2 border">{truncatedValue || '(vacío)'}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={2} className="px-4 py-2 text-center">No se encontraron cookies</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3">Soluciones comunes</h2>
        <ul className="list-disc ml-5">
          <li className="mb-2">
            <strong>Error 400 "No resource with given identifier found":</strong>{' '}
            Indica un problema con el token. Usa el botón "Limpiar cookies" y luego inicia sesión nuevamente.
          </li>
          <li className="mb-2">
            <strong>Error de token:</strong>{' '}
            Prueba ambos botones de limpieza de cookies (servidor y cliente) y refresca la página.
          </li>
          <li className="mb-2">
            <strong>Email no confirmado:</strong>{' '}
            Ejecuta <code className="bg-gray-100 p-1 rounded">node scripts/debug-auth.js confirm-email tu@email.com</code>
          </li>
          <li className="mb-2">
            <strong>Problemas persistentes:</strong>{' '}
            Ejecuta <code className="bg-gray-100 p-1 rounded">node scripts/clear-auth-cookies.js</code> y sigue las instrucciones.
          </li>
          <li className="mb-2">
            <strong>Última opción:</strong>{' '}
            Prueba en modo incógnito o borra el almacenamiento local del navegador.
          </li>
        </ul>
        
        <div className="mt-4">
          <Link 
            href="/login" 
            className="px-4 py-2 bg-gray-800 text-white rounded inline-block hover:bg-gray-900"
          >
            Ir a la página de inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
} 