"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DollarSign, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { userSettingsService } from "@/lib/supabase/user-settings-service"
import { eventBus, EVENTS } from "@/lib/event-bus"

export default function InitialCapitalPage() {
  const router = useRouter()
  const [initialCapital, setInitialCapital] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Cargar el valor actual cuando el componente se monta
    const loadInitialCapital = async () => {
      try {
        // Intentar cargar desde localStorage primero
        const savedCapital = localStorage.getItem("initialCapital")
        if (savedCapital) {
          setInitialCapital(savedCapital)
          return
        }
        
        // Si no hay en localStorage, intentar desde userSettingsService
        const current = await userSettingsService.getInitialCapital()
        if (current > 0) {
          setInitialCapital(current.toString())
          // Sincronizar con localStorage
          localStorage.setItem("initialCapital", current.toString())
        }
      } catch (error) {
        console.error("Error loading initial capital:", error)
      }
    }
    
    loadInitialCapital()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const amount = Number(initialCapital.replace(/,/g, ""))
      
      if (isNaN(amount) || amount < 0) {
        toast({
          variant: "destructive",
          title: "Valor inválido",
          description: "Por favor, introduce un número positivo"
        })
        return
      }
      
      // Guardar en localStorage
      localStorage.setItem("initialCapital", amount.toString())
      
      // También guardar en userSettingsService si está disponible
      try {
        await userSettingsService.updateInitialCapital(amount)
      } catch (error) {
        console.error("Error saving to userSettingsService:", error)
        // Continuamos aunque falle userSettingsService
      }
      
      // Notificar a otros componentes
      eventBus.publish(EVENTS.SETTINGS_UPDATED, { initialCapital: amount })
      
      toast({
        title: "Inversión inicial actualizada",
        description: "El valor ha sido guardado correctamente"
      })
      
      // Volver a la página anterior
      router.push("/dashboard")
      
    } catch (error) {
      console.error("Error saving initial capital:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al guardar el valor"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Establecer Capital Inicial</CardTitle>
          <CardDescription>Define tu capital inicial para hacer seguimiento del rendimiento de tu portfolio</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-2">
              <label htmlFor="initialCapital" className="text-sm font-medium">
                Capital Inicial (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="initialCapital"
                  type="text"
                  placeholder="10000"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()} type="button">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

