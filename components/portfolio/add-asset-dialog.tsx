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
import { CoinSearch } from "@/components/ui/coin-search"
import type { CoinInfo } from "@/lib/api/coingecko-service"
import { toast } from "@/components/ui/use-toast"

interface AddAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exchangeId: string
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

// Lista de stablecoins comunes
const stablecoins = [
  "USDT",
  "USDC",
  "DAI",
  "BUSD",
  "UST",
  "TUSD",
  "USDP",
  "GUSD",
  "USDN",
  "FRAX",
  "LUSD",
  "SUSD",
  "HUSD",
  "USDK",
  "PAX",
  "EURS",
  "XSGD",
  "USDX",
]

// Función para verificar si un símbolo es una stablecoin
const isStablecoin = (symbol: string): boolean => {
  return stablecoins.includes(symbol.toUpperCase())
}

export function AddAssetDialog({ open, onOpenChange, exchangeId, exchangeName }: AddAssetDialogProps) {
  const { addAsset } = usePortfolio()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState<CoinInfo | null>(null)
  const [isSelectedCoinStable, setIsSelectedCoinStable] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symbol: "",
      quantity: "",
      purchase_price_avg: "",
    },
  })

  // Manejar la selección de una moneda
  const handleCoinSelect = (coin: CoinInfo) => {
    setSelectedCoin(coin)
    form.setValue("symbol", coin.symbol.toUpperCase())

    // Verificar si es una stablecoin
    const isStable = isStablecoin(coin.symbol)
    setIsSelectedCoinStable(isStable)

    // Si es una stablecoin, establecer el precio a 1
    if (isStable) {
      form.setValue("purchase_price_avg", "1")
    }
    // Si no es stablecoin y tiene precio actual, establecerlo como precio de compra predeterminado
    else if (coin.current_price) {
      form.setValue("purchase_price_avg", coin.current_price.toString())
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      const assetData = {
        exchange_id: exchangeId,
        symbol: values.symbol,
        quantity: values.quantity,
        purchase_price_avg: values.purchase_price_avg,
        logo_url: selectedCoin?.image || null, // Include the URL of the logo
      }

      console.log("Submitting asset data:", assetData)

      await addAsset(assetData)

      toast({
        title: "Asset añadido",
        description: `${values.symbol} ha sido añadido correctamente a ${exchangeName}.`,
      })

      form.reset()
      setSelectedCoin(null)
      setIsSelectedCoinStable(false)

      // Cerrar el diálogo inmediatamente
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding asset:", error)
      toast({
        title: "Error al añadir",
        description: error instanceof Error ? error.message : "No se pudo añadir el asset",
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
          <DialogTitle>Add Asset to {exchangeName}</DialogTitle>
          <DialogDescription>Add a new cryptocurrency asset to track in your portfolio.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <CoinSearch onSelect={handleCoinSelect} placeholder="Search for a cryptocurrency..." />
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
                    <Input placeholder="0.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isSelectedCoinStable && (
              <FormField
                control={form.control}
                name="purchase_price_avg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Purchase Price (USD)</FormLabel>
                    <FormControl>
                      <Input placeholder="40000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {isSelectedCoinStable && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Stablecoin detectada - precio establecido a $1.00</p>
                <Input type="hidden" name="purchase_price_avg" value="1" />
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Asset"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

