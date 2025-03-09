"use client"

import { useState, useEffect } from "react"
import { AlertCircle, WifiOffIcon, ShieldAlert, RefreshCcw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { checkSupabaseCredentials, testSupabaseConnection } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function SupabaseError() {
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean
    success: boolean
    error?: string
  }>({ tested: false, success: false })
  const [isChecking, setIsChecking] = useState(false)

  // Verificar las credenciales una sola vez durante la renderización
  const hasCredentials = checkSupabaseCredentials()
  const isOffline = typeof navigator !== "undefined" ? !navigator.onLine : false

  // Probar la conexión a Supabase
  useEffect(() => {
    if (hasCredentials && !isOffline && !connectionStatus.tested) {
      checkConnection()
    }
  }, [hasCredentials, isOffline, connectionStatus.tested])

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      console.log("Testing Supabase connection...")
      const result = await testSupabaseConnection()
      console.log("Connection test result:", result)

      setConnectionStatus({
        tested: true,
        success: result.success,
        error: result.error,
      })

      // Si la conexión es exitosa, intentar verificar las tablas
      if (result.success) {
        try {
          console.log("Testing access to exchanges table...")
          const { supabase } = await import("@/lib/supabase/client")
          const { data, error } = await supabase.from("exchanges").select("count", { count: "exact", head: true })

          if (error) {
            console.error("Error accessing exchanges table:", error)
            setConnectionStatus({
              tested: true,
              success: false,
              error: `Conexión exitosa pero error al acceder a la tabla 'exchanges': ${error.message}`,
            })
          } else {
            console.log("Successfully accessed exchanges table")
          }
        } catch (tableErr) {
          console.error("Error testing table access:", tableErr)
        }
      }
    } catch (err) {
      console.error("Error testing connection:", err)
      setConnectionStatus({
        tested: true,
        success: false,
        error: err instanceof Error ? err.message : "Error desconocido al probar la conexión",
      })
    } finally {
      setIsChecking(false)
    }
  }

  // Si las credenciales están presentes, estamos online y la conexión es exitosa, no mostrar nada
  if (hasCredentials && !isOffline && connectionStatus.success) return null

  // Determinar el tipo de error para mostrar el mensaje adecuado
  let alertVariant = "destructive"
  let icon = <AlertCircle className="h-4 w-4" />
  let title = "Error de Configuración"
  let description = ""

  if (isOffline) {
    alertVariant = "warning"
    icon = <WifiOffIcon className="h-4 w-4" />
    title = "Estás desconectado"
    description = "Tu dispositivo está actualmente sin conexión. Algunas funciones pueden no funcionar correctamente."
  } else if (!hasCredentials) {
    icon = <AlertCircle className="h-4 w-4" />
    title = "Error de Configuración"
    description = "Faltan variables de entorno de Supabase. Verifica que las siguientes variables estén configuradas:"
  } else if (connectionStatus.tested && !connectionStatus.success) {
    icon = <ShieldAlert className="h-4 w-4" />
    title = "Error de Autorización"
    description = `No tienes autorización para acceder a los recursos de Supabase. ${connectionStatus.error || ""}`
  }

  return (
    <Alert variant={alertVariant as any} className="mb-4">
      {icon}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {description}

        {!hasCredentials && (
          <ul className="list-disc pl-5 mt-2">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>SUPABASE_SERVICE_ROLE_KEY</li>
          </ul>
        )}

        {connectionStatus.tested && !connectionStatus.success && (
          <div className="mt-2">
            <p>Posibles soluciones:</p>
            <ul className="list-disc pl-5 mt-1">
              <li>Verifica que las políticas de seguridad en Supabase permitan acceso a las tablas</li>
              <li>Asegúrate de que la clave anónima tenga los permisos necesarios</li>
              <li>Comprueba que las tablas 'exchanges' y 'assets' existan en tu base de datos</li>
            </ul>
          </div>
        )}

        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={isOffline ? () => window.location.reload() : checkConnection}
            disabled={isChecking}
          >
            {isChecking ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isOffline ? "Recargar Página" : "Verificar Conexión"}
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

