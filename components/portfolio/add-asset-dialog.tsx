"use client"

import { useState, useEffect, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { PlusIcon, ArrowRightIcon, DollarSignIcon, CoinsIcon } from "lucide-react"
import Image from "next/image"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { usePortfolio } from "@/hooks/use-portfolio"
import { CoinSearch } from "@/components/ui/coin-search"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import type { CoinInfo } from "@/lib/api/coingecko-service"
import { eventBus } from "@/lib/event-bus"
import { EVENTS } from "@/lib/event-bus"

interface AddAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exchangeId: string
  exchangeName: string
  onAssetAdded?: (asset: CoinInfo, exchangeId: string) => void  // Nueva prop para callback después de añadir asset
}

// Define el esquema de validación
const formSchema = z.object({
  symbol: z
    .string()
    .min(1, {
      message: "Symbol is required",
    })
    .max(10, {
      message: "Symbol must not be longer than 10 characters",
    }),
  quantity: z
    .string()
    .min(1, {
      message: "Quantity is required",
    })
    .refine(
      (val) => {
        const num = Number(val.replace(/,/g, ""))
        return !isNaN(num) && num > 0
      },
      {
        message: "Quantity must be a positive number",
      },
    ),
  purchase_price_avg: z
    .string()
    .min(1, {
      message: "Average purchase price is required",
    })
    .refine(
      (val) => {
        const num = Number(val.replace(/,/g, ""))
        return !isNaN(num) && num > 0
      },
      {
        message: "Average purchase price must be a positive number",
      },
    ),
})

// Función para verificar si es una stablecoin
const isStablecoin = (symbol: string): boolean => {
  const stablecoins = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdp', 'usdd', 'gusd', 'frax', 'lusd', 'susd'];
  return stablecoins.includes(symbol.toLowerCase());
};

export function AddAssetDialog({ 
  open, 
  onOpenChange, 
  exchangeId, 
  exchangeName,
  onAssetAdded = () => {} // Valor por defecto vacío
}: AddAssetDialogProps) {
  const { addAsset, refreshData } = usePortfolio()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("search")
  const [selectedCoin, setSelectedCoin] = useState<CoinInfo | null>(null)
  const [totalValue, setTotalValue] = useState<number>(0)
  const [successfullyAdded, setSuccessfullyAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symbol: "",
      quantity: "",
      purchase_price_avg: "",
    },
  })

  // Actualizar el valor total cuando cambian los inputs
  useEffect(() => {
    const quantity = Number(form.watch("quantity").replace(/,/g, "") || "0")
    const price = Number(form.watch("purchase_price_avg").replace(/,/g, "") || "0")
    if (!isNaN(quantity) && !isNaN(price)) {
      setTotalValue(quantity * price)
    }
  }, [form.watch("quantity"), form.watch("purchase_price_avg")])

  // Manejar la selección de moneda desde el componente CoinSearch
  const handleCoinSelect = (coin: CoinInfo) => {
    setSelectedCoin(coin)
    form.setValue("symbol", coin.symbol.toUpperCase())
    setActiveTab("details")
    
    // Si es un stablecoin, preestablecemos el precio a 1
    if (isStablecoin(coin.symbol)) {
      form.setValue("purchase_price_avg", "1")
    } else if (coin.current_price) {
      // Si tenemos el precio actual, lo usamos como referencia
      form.setValue("purchase_price_avg", coin.current_price.toString())
    }
    
    // Obtener el foco en el campo de cantidad
    setTimeout(() => {
      const quantityInput = document.querySelector('input[name="quantity"]') as HTMLInputElement;
      if (quantityInput) quantityInput.focus();
    }, 100);
  }

  // Handler para agregar un asset
  const handleAddAsset = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Para stablecoins, asegurar que el precio de compra es 1.00
      const symbol = data.symbol.toUpperCase();
      const isAssetStablecoin = isStablecoin(symbol.toLowerCase());
      
      // Si es stablecoin, usar precio 1.00
      const purchasePrice = isAssetStablecoin ? 1.0 : Number(data.purchase_price_avg);
      
      const newAsset = await addAsset({
        exchange_id: exchangeId,
        symbol: symbol,
        name: data.name,
        quantity: data.quantity,
        purchase_price_avg: isAssetStablecoin ? 1.0 : data.purchase_price_avg,
        logo_url: data.logo_url || null,
      });

      console.log("Asset added:", newAsset);
      onAssetAdded?.(newAsset, exchangeId);
      
      // Publicar evento para notificar a otros componentes
      eventBus.publish(EVENTS.ASSET_ADDED, newAsset, exchangeId);
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding asset:", error);
      setError(error instanceof Error ? error.message : "An error occurred while adding the asset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedCoin(null);
    setActiveTab("search");
    setSuccessfullyAdded(false);
  }

  // Al cerrar el diálogo, resetear el formulario
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Si acabamos de añadir un asset con éxito, refrescar los datos antes de cerrar
      if (successfullyAdded) {
        // Ya se ha refrescado en onSubmit
        setSuccessfullyAdded(false);
      }
      resetForm();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Asset to {exchangeName}</DialogTitle>
          <DialogDescription>
            Search for a cryptocurrency and add it to your portfolio.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search Coin</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedCoin}>Asset Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="py-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Search for a cryptocurrency you want to add to your portfolio:
              </p>
              
              <CoinSearch 
                onSelect={handleCoinSelect} 
                placeholder="Search for a cryptocurrency..."
              />
              
              {selectedCoin && (
                <Card className="mt-4">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedCoin.image} alt={selectedCoin.name} />
                        <AvatarFallback>{selectedCoin.symbol.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{selectedCoin.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedCoin.symbol.toUpperCase()}</p>
                      </div>
                      <Button 
                        className="ml-auto" 
                        size="sm"
                        onClick={() => setActiveTab("details")}
                      >
                        Continue 
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="py-4">
            {selectedCoin && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddAsset)} className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedCoin.image} alt={selectedCoin.name} />
                      <AvatarFallback>{selectedCoin.symbol.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedCoin.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedCoin.symbol.toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CoinsIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="0.5" 
                              {...field} 
                              className="pl-10" 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>How many tokens do you own?</FormDescription>
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
                          <div className="relative">
                            <DollarSignIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="30000" 
                              {...field} 
                              className="pl-10" 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Average price you paid per token in USD.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Card className="mt-4 bg-muted/50">
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Value:</span>
                        <span className="text-lg font-bold">${totalValue.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2 pt-4 justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setActiveTab("search")}
                    >
                      Back
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <PlusIcon className="mr-2 h-4 w-4" />
                          Add Asset
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

