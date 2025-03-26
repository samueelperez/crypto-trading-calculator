"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-provider"
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react"

// Esquema de validación para el formulario
const formSchema = z.object({
  email: z.string().email({
    message: "Por favor ingresa un email válido",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  }),
})

export function RegisterForm() {
  const { signUp, resendVerificationEmail } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<{
    needsVerification: boolean, 
    email: string
  } | null>(null)

  // Configurar el formulario con React Hook Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await signUp(values.email, values.password)
      
      // Si el usuario necesita verificar su email
      if (result?.requiresEmailConfirmation) {
        setVerificationStatus({
          needsVerification: true,
          email: values.email
        })
      } else {
        // Si el registro fue exitoso y no requiere verificación
        router.push("/dashboard")
      }
    } catch (error: any) {
      setError(error.message || "Hubo un error durante el registro")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para reenviar el correo de verificación
  async function handleResendVerification() {
    if (!verificationStatus?.email) return
    
    setIsLoading(true)
    try {
      await resendVerificationEmail(verificationStatus.email)
      setError(null)
      // Mostrar mensaje de éxito temporal
      setVerificationStatus({
        ...verificationStatus,
        resent: true
      } as any)
      
      // Reiniciar el estado del mensaje después de 5 segundos
      setTimeout(() => {
        setVerificationStatus({
          ...verificationStatus,
          resent: false
        } as any)
      }, 5000)
    } catch (error: any) {
      setError("No se pudo reenviar el correo: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Si el usuario necesita verificar su email, mostramos un mensaje específico
  if (verificationStatus?.needsVerification) {
    return (
      <div className="space-y-6">
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 font-medium">Verifica tu correo electrónico</AlertTitle>
          <AlertDescription className="text-blue-700">
            Hemos enviado un enlace de verificación a <strong>{verificationStatus.email}</strong>. 
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </AlertDescription>
        </Alert>
        
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 font-medium">Entorno de desarrollo</AlertTitle>
          <AlertDescription className="text-yellow-700">
            <p>Para desactivar la verificación de email en entorno de desarrollo:</p>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Ve al dashboard de Supabase</li>
              <li>Navega a <strong>Authentication</strong> &gt; <strong>Providers</strong></li>
              <li>En la sección <strong>Email</strong>, desactiva la opción <strong>"Confirm emails"</strong></li>
              <li>O ejecuta la migración SQL <code>supabase/migrations/20240301_disable_email_verification.sql</code></li>
            </ol>
          </AlertDescription>
        </Alert>
        
        {(verificationStatus as any)?.resent ? (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              ¡Correo reenviado con éxito! Revisa tu bandeja de entrada.
            </AlertDescription>
          </Alert>
        ) : null}
        
        <div className="flex flex-col space-y-4">
          <Button 
            onClick={handleResendVerification} 
            variant="outline" 
            disabled={isLoading || (verificationStatus as any)?.resent}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            {isLoading ? "Enviando..." : "Reenviar correo de verificación"}
          </Button>
          
          <Button variant="link" asChild>
            <Link href="/login">Volver a iniciar sesión</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Formulario de registro normal
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="tu@email.com" type="email" {...field} />
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
                  <Input placeholder="******" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Registrando..." : "Registrarse"}
          </Button>
        </form>
      </Form>
      
      <div className="text-center text-sm">
        ¿Ya tienes una cuenta?{" "}
        <Link href="/login" className="underline">
          Iniciar sesión
        </Link>
      </div>
    </div>
  )
} 