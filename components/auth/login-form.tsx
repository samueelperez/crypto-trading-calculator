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
  password: z.string().min(1, {
    message: "La contraseña es obligatoria",
  }),
})

export function LoginForm() {
  const { signIn, resendVerificationEmail } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)
  
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
    setNeedsVerification(null)
    
    try {
      await signIn(values.email, values.password)
      // Si el inicio de sesión es exitoso, el AuthProvider nos redirigirá al dashboard
    } catch (error: any) {
      // Verificar si el error está relacionado con email no confirmado
      if (error.message && (
          error.message.includes('El email no ha sido confirmado') || 
          error.message.includes('Email not confirmed')
        )) {
        setNeedsVerification(values.email)
      } else {
        setError(error.message || "Error al iniciar sesión")
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  // Función para reenviar el correo de verificación
  async function handleResendVerification() {
    if (!needsVerification) return
    
    setIsLoading(true)
    try {
      await resendVerificationEmail(needsVerification)
      setVerificationSent(true)
      // Reiniciar el estado después de 5 segundos
      setTimeout(() => {
        setVerificationSent(false)
      }, 5000)
    } catch (error: any) {
      setError("No se pudo reenviar el correo: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {needsVerification && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 font-medium">Email no verificado</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Tu cuenta aún no ha sido verificada. Por favor, revisa tu correo electrónico y haz clic en el enlace de verificación.
          </AlertDescription>
        </Alert>
      )}
      
      {verificationSent && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            ¡Correo de verificación reenviado con éxito! Revisa tu bandeja de entrada.
          </AlertDescription>
        </Alert>
      )}
      
      {needsVerification ? (
        <div className="space-y-4">
          <Button 
            onClick={handleResendVerification} 
            variant="outline" 
            disabled={isLoading || verificationSent}
            className="w-full gap-2"
          >
            <Mail className="h-4 w-4" />
            {isLoading ? "Enviando..." : "Reenviar correo de verificación"}
          </Button>
          
          <Button variant="link" onClick={() => setNeedsVerification(null)} className="w-full">
            Volver al formulario de inicio de sesión
          </Button>
        </div>
      ) : (
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
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </Form>
      )}
      
      <div className="text-center text-sm">
        ¿No tienes una cuenta?{" "}
        <Link href="/register" className="underline">
          Registrarse
        </Link>
      </div>
    </div>
  )
} 