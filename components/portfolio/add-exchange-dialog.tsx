"use client"

import { useState } from "react"
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

interface AddExchangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Exchange name must be at least 2 characters.",
  }),
})

export function AddExchangeDialog({ open, onOpenChange }: AddExchangeDialogProps) {
  const { addExchange } = usePortfolio()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      const exchangeData = {
        name: values.name,
      }

      await addExchange(exchangeData)

      // Notificar al usuario
      toast({
        title: "Exchange añadido",
        description: `${values.name} ha sido añadido correctamente.`,
      })

      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding exchange:", error)
      toast({
        title: "Error al añadir",
        description: error instanceof Error ? error.message : "No se pudo añadir el exchange",
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
          <DialogTitle>Add Exchange</DialogTitle>
          <DialogDescription>Add a new exchange to track your cryptocurrency assets.</DialogDescription>
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
                    <Input placeholder="Binance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Exchange"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

