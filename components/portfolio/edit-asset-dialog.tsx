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
import { assetService } from "@/lib/supabase/portfolio-service"
import { CoinSearch } from "@/components/ui/coin-search"
import type { CoinInfo } from "@/lib/api/coingecko-service"
import { toast } from "@/components/ui/use-toast"

interface EditAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetId: string
  exchangeName: string
}

const formSchema = z.object({
  symbol: z
    .string()
    .min(1, {
      message: "Asset symbol is required.",
    })
    .toUpperCase(),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Quantity must be a positive number.",
  }),
  purchase_price_avg: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Purchase price must be a positive number.",
  }),
})

export function EditAssetDialog({ open, onOpenChange, assetId, exchangeName }: EditAssetDialogProps) {
  const { updateAsset, loadPortfolioData } = usePortfolio()
  const [isLoading, setIsLoading] = useState(false)
  const [assetLoading, setAssetLoading] = useState(true)
  const [assetLogo, setAssetLogo] = useState<string | null>(null)
  const [selectedCoin, setSelectedCoin] = useState<CoinInfo | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symbol: "",
      quantity: "",
      purchase_price_avg: "",
    },
  })

  // Cargar datos del asset
  useEffect(() => {
    const loadAsset = async () => {
      try {
        setAssetLoading(true)
        const asset = await assetService.getById(assetId)

        if (asset) {
          form.reset({
            symbol: asset.symbol,
            quantity: asset.quantity.toString(),
            purchase_price_avg: asset.purchase_price_avg.toString(),
          })
          setAssetLogo(asset.logo_url)
        }
      } catch (error) {
        console.error("Error loading asset:", error)
      } finally {
        setAssetLoading(false)
      }
    }

    if (open && assetId) {
      loadAsset()
    }
  }, [open, assetId, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      const assetData = {
        symbol: values.symbol,
        quantity: values.quantity,
        purchase_price_avg: values.purchase_price_avg,
        // Usar el logo del coin seleccionado si está disponible
        logo_url: selectedCoin?.image || assetLogo,
      }

      await updateAsset(assetId, assetData)

      // Recargar los datos del portfolio para asegurar que la UI se actualice
      await loadPortfolioData()

      // Mostrar un mensaje de éxito
      toast({
        title: "Activo actualizado",
        description: `${values.symbol} ha sido actualizado correctamente.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error updating asset:", error)

      // Mostrar un mensaje de error
      toast({
        title: "Error al actualizar",
        description: error instanceof Error ? error.message : "No se pudo actualizar el activo",
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
          <DialogTitle>Edit Asset in {exchangeName}</DialogTitle>
          <DialogDescription>Update cryptocurrency asset details.</DialogDescription>
        </DialogHeader>

        {assetLoading ? (
          <div className="py-6 text-center">Loading asset data...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Symbol</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <CoinSearch
                          onSelect={(coin) => {
                            setSelectedCoin(coin)
                            field.onChange(coin.symbol.toUpperCase())
                            // Si hay un logo, actualizarlo
                            if (coin.image) {
                              setAssetLogo(coin.image)
                            }
                          }}
                          placeholder="Search for a cryptocurrency..."
                        />
                        <Input
                          {...field}
                          className="hidden" // Oculto porque usamos el componente de búsqueda
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchase_price_avg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Purchase Price (USD)</FormLabel>
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
        )}
      </DialogContent>
    </Dialog>
  )
}

