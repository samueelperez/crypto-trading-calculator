"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { usePortfolio } from "@/hooks/use-portfolio"
import { toast } from "@/components/ui/use-toast"
import type { ExchangeWithAssets } from "@/types/portfolio"

interface EditExchangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exchange: ExchangeWithAssets
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Exchange name must be at least 2 characters.",
  }),
})

export function EditExchangeDialog({ open, onOpenChange, exchange }: EditExchangeDialogProps) {
  const { updateExchange, loadPortfolioData } = usePortfolio()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: exchange.name,
    },
  })

  // Actualizar el formulario cuando cambia el exchange
  useEffect(() => {
    if (open) {
      form.reset({
        name: exchange.name,
      })
    }
  }, [open, exchange, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      const exchangeData = {
        name: values.name,
      }

      await updateExchange(exchange.id, exchangeData)

      // Notificar al usuario
      toast({
        title: "Exchange actualizado",
        description: `${values.name} ha sido actualizado correctamente.`,
      })

      // Recargar datos para asegurar que la UI se actualice
      await loadPortfolioData()

      onOpenChange(false)
    } catch (error) {
      console.error("Error updating exchange:", error)
      toast({
        title: "Error al actualizar",
        description: error instanceof Error ? error.message : "No se pudo actualizar el exchange",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Exchange</DialogTitle>
          <DialogDescription>Update the exchange information.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

