"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react'
import { createClientBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { serverSignIn } from '@/lib/actions/auth-actions'
import { refreshAuthTokenIfNeeded } from '@/lib/actions/token-refresh'
import { supabase } from '@/lib/supabase-client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const formSchema = z.object({
  email: z.string().email({
    message: 'Por favor introduce un email válido.',
  }),
  password: z.string().min(6, {
    message: 'La contraseña debe tener al menos 6 caracteres.',
  }),
})

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

// Exportar opción dynamic para forzar renderizado dinámico
export const dynamic = 'force-dynamic'

// Componente para extraer parámetros de búsqueda de forma segura
function LoginMessageHandler() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  
  if (!message) return null
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Atención</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<"login" | "register">("login")
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    const errorParam = searchParams?.get('error')
    const returnUrl = searchParams?.get('returnUrl')
    
    if (errorParam) {
      switch (errorParam) {
        case 'token_expired':
          setError('Tu sesión ha expirado o no es válida. Por favor, inicia sesión nuevamente.')
          break;
        case 'email_not_confirmed':
          setError('Tu email no ha sido confirmado. Por favor, revisa tu correo electrónico.')
          setNeedsVerification(true)
          break;
        default:
          setError(`Error de autenticación: ${errorParam}`)
      }
    }
    
    const tryRefreshToken = async () => {
      try {
        await refreshAuthTokenIfNeeded()
      } catch (e) {
        // Ignorar errores, solo estamos intentando refrescar si es posible
      }
    }
    
    tryRefreshToken()
  }, [searchParams])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setServerError(null)
    setError(null)
    
    try {
      if (mode === "login") {
        const result = await serverSignIn(values.email, values.password)
        
        if (result.error) {
          setError(result.error)
          
          if (result.needsVerification) {
            setNeedsVerification(true)
          }
        } else if (result.success) {
          const returnUrl = searchParams?.get('returnUrl') || '/dashboard'
          router.push(returnUrl)
        }
      } else {
        // Mostrar mensaje de carga para el usuario
        toast({
          title: "Registrando usuario...",
          description: "Esto puede tardar unos segundos.",
        })
        
        try {
          console.log('Iniciando registro con email:', values.email)
          
          // Obtener la URL base correcta (con el puerto actual)
          const redirectTo = `${getBaseUrl()}/auth/callback`
          console.log('URL de redirección:', redirectTo)
          
          // Añadir verificaciones adicionales
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            throw new Error('Variables de entorno de Supabase no configuradas correctamente')
          }
          
          // Capturar errores 500 durante el registro
          const { data, error } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
              // Usar URL dinámica en lugar de hardcoded
              emailRedirectTo: redirectTo,
              data: {
                registered_at: new Date().toISOString(),
              }
            },
          })

          console.log('Respuesta del registro:', { data, error })

          if (error) {
            console.error('Error de registro:', error)
            
            // Manejar el error
            if (error.status === 500) {
              if (error.message.includes('Database error saving new user')) {
                setServerError(`Error de base de datos al guardar el usuario (500).
                
                Posibles causas:
                1. El email ya existe pero tiene algún problema.
                2. Hay un conflicto en la base de datos de Supabase.
                
                Soluciones recomendadas:
                - Intenta con un email diferente
                - Contacta al administrador para limpiar usuarios problemáticos
                - Verifica en el panel de Supabase si hay limitaciones de plan`)
                
                toast({
                  variant: "destructive",
                  title: "Error de base de datos",
                  description: "No se pudo crear el usuario. Intenta con otro email.",
                })
              } else {
                setServerError(`Error en el servidor de Supabase (500): ${error.message}
                Si estás en desarrollo, verifica que las variables de entorno estén configuradas correctamente.`)
                
                toast({
                  variant: "destructive",
                  title: "Error de servidor (500)",
                  description: "Error en Supabase durante el registro. Ver detalles abajo.",
                })
              }
            } else if (error.message.includes('API key')) {
              setServerError(`Error de configuración: No se encontró la API key necesaria. 
              Verifica que NEXT_PUBLIC_SUPABASE_ANON_KEY esté configurada correctamente en tu archivo .env`)
            } else if (error.message.includes('fetch') || error.message.includes('CORS')) {
              setServerError(`Error de CORS: No se pudo conectar con Supabase debido a restricciones de origen cruzado.
              
              Verifica que este origen (${getBaseUrl()}) esté en la lista de dominios permitidos en la configuración de Supabase:
              1. Panel de Supabase → Authentication → URL Configuration
              2. Añade "${getBaseUrl()}" a la lista de dominios permitidos
              `)
              
              toast({
                variant: "destructive",
                title: "Error de CORS",
                description: "Tu dominio no está permitido en Supabase. Ver detalles abajo.",
              })
            } else {
              toast({
                variant: "destructive",
                title: "Error de registro",
                description: error.message,
              })
              setError(error.message)
            }
            return
          }

          // Verificar si necesita confirmación de email
          if (data?.user && !data?.session) {
            setNeedsVerification(true)
            toast({
              title: "Registro exitoso",
              description: "Por favor verifica tu email para completar el registro.",
            })
          } else if (data?.user && data?.session) {
            // Usuario registrado y confirmado automáticamente
            toast({
              title: "Registro exitoso",
              description: "Tu cuenta ha sido creada y confirmada.",
            })
            
            // Redirigir al usuario
            const returnUrl = searchParams?.get('returnUrl') || '/dashboard'
            router.push(returnUrl)
          }
        } catch (e) {
          console.error("Error durante el registro:", e)
          const errorMessage = e instanceof Error ? e.message : 'Error desconocido'
          
          // Detectar si es un error CORS
          if (errorMessage.includes('fetch') || errorMessage.includes('CORS') || errorMessage.includes('network')) {
            setServerError(`Error de conexión con Supabase: Posible problema de CORS.
            
            Verifica que este origen (${getBaseUrl()}) esté permitido en Supabase:
            1. Panel de Supabase → Authentication → URL Configuration
            2. Añade "${getBaseUrl()}" a la lista de dominios permitidos
            `)
          } else {
            setServerError(`Error de conexión: ${errorMessage}. Verifica tu configuración de Supabase.`)
          }
          
          toast({
            variant: "destructive",
            title: "Error de conexión",
            description: "No se pudo conectar con el servidor de autenticación.",
          })
        }
      }
    } catch (error) {
      console.error('Error de inicio de sesión/registro:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error inesperado. Inténtalo de nuevo.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationResend = async () => {
    // Aquí iría la lógica para reenviar el email de verificación
    // Por ejemplo: await resendVerificationEmail(values.email)
    alert('Funcionalidad de reenvío de verificación no implementada')
  }

  const handleDebug = () => {
    router.push('/auth/debug')
  }

  return (
    <div className="container flex justify-center items-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex justify-center">
            <Image 
              src="/icons/icon-192x192.png" 
              alt="Logo" 
              width={80} 
              height={80}
              className="rounded-xl"
            />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Ingresa tus credenciales para acceder a tu cuenta"
              : "Registra una cuenta nueva para empezar"}
          </p>
        </div>
        
        {/* Usar Suspense para envolver el componente que usa useSearchParams */}
        <Suspense fallback={<div className="mb-4">Cargando...</div>}>
          <LoginMessageHandler />
        </Suspense>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div>
                <p className="text-sm text-red-700">{error}</p>
                
                {error.includes('400') && (
                  <button 
                    className="mt-2 text-blue-600 hover:underline text-sm"
                    onClick={handleDebug}
                  >
                    Diagnosticar problema de autenticación
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {serverError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-red-700">Error del servidor de Supabase</p>
              <p className="text-sm text-red-700 mt-1">{serverError}</p>
              
              {serverError.includes('500') && (
                <div className="mt-3 text-xs text-gray-600 bg-gray-100 p-3 rounded">
                  <p className="font-semibold">Soluciones para entornos de desarrollo:</p>
                  <ol className="list-decimal ml-4 mt-1 space-y-1">
                    <li>Ejecuta <code className="bg-gray-200 px-1 rounded">node scripts/disable-email-confirmation.js</code> para deshabilitar la verificación de email</li>
                    <li>O usa <code className="bg-gray-200 px-1 rounded">node scripts/debug-auth.js confirm-email {form.getValues('email') || 'tu@email.com'}</code> después de intentar registrarte</li>
                    <li>Verifica que el servicio de email esté configurado en Supabase</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
        
        {needsVerification && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
            <p className="text-sm text-yellow-700">
              Tu correo electrónico aún no ha sido verificado. Por favor, revisa tu bandeja de entrada.
            </p>
            <button 
              className="mt-2 text-blue-600 hover:underline text-sm"
              onClick={handleVerificationResend}
            >
              Reenviar email de verificación
            </button>
            
            <div className="mt-2 text-xs text-gray-600">
              <p>¿Estás en entorno de desarrollo?</p>
              <code className="bg-gray-100 p-1 rounded mt-1 block">
                node scripts/debug-auth.js confirm-email {form.getValues('email') || 'tu@email.com'}
              </code>
            </div>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="tu@email.com" {...field} autoComplete="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === "login" && (
              <div className="flex items-center justify-end">
                <Link
                  href="/reset-password"
                  className="text-xs text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Iniciando sesión..." : "Registrando..."}
                </>
              ) : mode === "login" ? (
                "Iniciar sesión"
              ) : (
                "Registrarse"
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm">
          {mode === "login" ? (
            <p>
              ¿No tienes una cuenta?{" "}
              <button
                onClick={() => setMode("register")}
                className="font-medium text-primary hover:underline"
              >
                Regístrate
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tienes una cuenta?{" "}
              <button
                onClick={() => setMode("login")}
                className="font-medium text-primary hover:underline"
              >
                Inicia sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 