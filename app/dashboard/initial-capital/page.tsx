"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

export default function InitialCapitalPage() {
  const router = useRouter()
  const [initialCapital, setInitialCapital] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // Cargar el valor guardado al iniciar
  useEffect(() => {
    const savedCapital = localStorage.getItem("initialCapital")
    if (savedCapital) {
      setInitialCapital(savedCapital)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validar que sea un número positivo
      const capital = Number.parseFloat(initialCapital)
      if (isNaN(capital) || capital <= 0) {
        throw new Error("Please enter a valid positive number")
      }

      // Guardar en localStorage
      localStorage.setItem("initialCapital", initialCapital)

      toast({
        title: "Initial capital saved",
        description: `Your initial capital of $${capital.toLocaleString()} has been saved.`,
      })

      // Redirigir al dashboard
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Button variant="outline" className="mb-6" onClick={() => router.push("/dashboard")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Set Initial Capital</CardTitle>
          <CardDescription>Define your starting capital to track your portfolio profit over time</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="initialCapital">Initial Capital (USD)</Label>
                <Input
                  id="initialCapital"
                  placeholder="10000"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/dashboard")} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

