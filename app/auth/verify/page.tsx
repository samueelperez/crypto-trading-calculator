"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "verified" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const verifySession = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Intentar actualizar la sesión
        const { error } = await supabase.auth.refreshSession()
        
        if (error) {
          console.error("Error de verificación:", error)
          setStatus("error")
          setMessage(error.message)
          return
        }
        
        // Comprobar el estado de la sesión
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setStatus("verified")
          // Redirigir después de un breve retardo
          setTimeout(() => router.push("/dashboard"), 1500)
        } else {
          setStatus("error")
          setMessage("No se pudo verificar tu cuenta. Por favor, intenta iniciar sesión de nuevo.")
        }
      } catch (error: any) {
        console.error("Error:", error)
        setStatus("error")
        setMessage(error.message || "Ocurrió un error durante la verificación")
      }
    }

    verifySession()
  }, [router])

  return (
    <div className="container flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === "loading" && "Verificando cuenta"}
            {status === "verified" && "¡Verificación exitosa!"}
            {status === "error" && "Error de verificación"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Espera mientras verificamos tu cuenta..."}
            {status === "verified" && "Tu cuenta ha sido verificada correctamente."}
            {status === "error" && message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          {status === "loading" && <Clock className="h-16 w-16 text-muted-foreground animate-pulse" />}
          {status === "verified" && <CheckCircle className="h-16 w-16 text-green-500" />}
          {status === "error" && <ArrowLeft className="h-16 w-16 text-red-500" />}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status === "loading" && (
            <p className="text-sm text-muted-foreground">Esto puede tomar unos momentos...</p>
          )}
          {status === "verified" && (
            <p className="text-sm text-muted-foreground">Redirigiendo al dashboard...</p>
          )}
          {status === "error" && (
            <Button asChild variant="default">
              <Link href="/login">Volver al inicio de sesión</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 