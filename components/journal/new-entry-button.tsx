"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusIcon, ArrowDownIcon, ArrowUpIcon, HelpCircleIcon, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { createJournalEntry } from "@/lib/journal-service"
import { useRouter } from "next/navigation"

// Tipo de datos para las criptomonedas
interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
}

// Tipo para los pares de trading
interface TradingPair {
  value: string;
  label: string;
  image: string | null;
  id: string;
  uniqueKey: string;
}

// Define el esquema de validación del formulario
const formSchema = z.object({
  type: z.enum(["long", "short"], {
    required_error: "Debes seleccionar el tipo de operación",
  }),
  asset: z.string().min(1, "Debes seleccionar un activo"),
  entryPrice: z.coerce.number().positive("El precio debe ser positivo"),
  stopLoss: z.coerce.number().positive("El stop loss debe ser positivo"),
  takeProfit: z.coerce.number().positive("El take profit debe ser positivo").optional(),
  positionSize: z.coerce.number().positive("El tamaño de posición debe ser positivo"),
  leverage: z.coerce.number().positive("El apalancamiento debe ser positivo"),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function NewEntryButton() {
  const { toast } = useToast()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tabValue, setTabValue] = useState("planned")
  const [calculatedRisk, setCalculatedRisk] = useState<number | null>(null)
  const [riskPercentage, setRiskPercentage] = useState<string>("")
  
  // Estados para el selector de criptomonedas
  const [coins, setCoins] = useState<Coin[]>([])
  const [coinsLoading, setCoinsLoading] = useState<boolean>(true)
  const [coinsError, setCoinsError] = useState<string | null>(null)
  const [assetSelectorOpen, setAssetSelectorOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Pares de trading comunes (fallback)
  const commonPairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "ADA/USDT"]

  // Inicializar formulario con React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "long",
      asset: "BTC/USDT",
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: undefined,
      positionSize: 0,
      leverage: 1,
      notes: "",
    },
  })
  
  // Función para obtener la lista de criptomonedas de CoinGecko
  const fetchCoinsList = async () => {
    setCoinsLoading(true)
    setCoinsError(null)
    
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1'
      )
      
      if (!response.ok) {
        throw new Error('Error al obtener la lista de criptomonedas')
      }
      
      const data = await response.json()
      setCoins(data)
    } catch (error) {
      console.error('Error fetching coins:', error)
      setCoinsError('No se pudieron cargar las criptomonedas. Usando lista de respaldo.')
    } finally {
      setCoinsLoading(false)
    }
  }

  // Cargar la lista de criptomonedas al montar el componente
  useEffect(() => {
    fetchCoinsList()
  }, [])

  // Preparar las opciones de pares de trading
  const tradingPairs: TradingPair[] = coins.length > 0 
    ? coins
        .filter(coin => coin.symbol.toLowerCase() !== 'usdt') // Filtrar USDT para evitar "USDT/USDT"
        .map(coin => ({
          value: `${coin.symbol.toUpperCase()}/USDT`,
          label: `${coin.name} (${coin.symbol.toUpperCase()}/USDT)`,
          image: coin.image,
          id: coin.id,
          uniqueKey: `${coin.id}-usdt` // Clave única basada en el ID
        }))
    : commonPairs.map((pair, index) => {
        const [base] = pair.split('/')
        return {
          value: pair,
          label: pair,
          image: null,
          id: base.toLowerCase(),
          uniqueKey: `common-${index}`
        }
      })

  // Filtrar los pares de trading según el término de búsqueda
  const filteredTradingPairs = searchTerm 
    ? tradingPairs.filter(pair => 
        pair.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pair.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : tradingPairs

  // Calcular el riesgo basado en los valores del formulario
  const calculateRisk = () => {
    const values = form.getValues()
    const { type, entryPrice, stopLoss, positionSize, leverage } = values
    
    if (!entryPrice || !stopLoss || !positionSize || !leverage) {
      setCalculatedRisk(null)
      setRiskPercentage("")
      return
    }
    
    // Calcular la distancia al stop loss
    let stopLossPercentage
    if (type === "long") {
      stopLossPercentage = (entryPrice - stopLoss) / entryPrice
    } else {
      stopLossPercentage = (stopLoss - entryPrice) / entryPrice
    }
    
    // Calcular el riesgo con el apalancamiento
    const riskAmount = positionSize * stopLossPercentage * leverage
    
    setCalculatedRisk(riskAmount)
    
    // Estimar el porcentaje de riesgo (asumiendo un portfolio promedio)
    const portfolioEstimate = 10000 // Valor estimado del portfolio si no tenemos acceso al real
    const percentage = (riskAmount / portfolioEstimate) * 100
    setRiskPercentage(percentage.toFixed(2))
  }
  
  // Recalcular el riesgo cuando cambien los valores relevantes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'entryPrice' || name === 'stopLoss' || name === 'positionSize' || name === 'leverage' || name === 'type') {
        calculateRisk()
      }
    })
    
    return () => subscription.unsubscribe()
  }, [form.watch])

  // Manejar el envío del formulario
  const onSubmit = async (data: FormValues) => {
    try {
      // Calcular el monto de riesgo final
      let riskAmount = 0
      if (data.entryPrice && data.stopLoss && data.positionSize && data.leverage) {
        // Calcular la distancia al stop loss
        let stopLossPercentage
        if (data.type === "long") {
          stopLossPercentage = (data.entryPrice - data.stopLoss) / data.entryPrice
        } else {
          stopLossPercentage = (data.stopLoss - data.entryPrice) / data.entryPrice
        }
        
        // Calcular el riesgo con el apalancamiento
        riskAmount = data.positionSize * stopLossPercentage * data.leverage
      }
      
      // Crear el objeto de entrada para el diario
      const entryData = {
        type: data.type,
        asset: data.asset,
        entry_price: data.entryPrice || 0,
        stop_loss: data.stopLoss || 0,
        take_profit: data.takeProfit || null,
        position_size: data.positionSize || 0,
        leverage: data.leverage || 1,
        risk_amount: riskAmount,
        risk_percentage: parseFloat(riskPercentage) || 1,
        status: tabValue as 'planned' | 'open' | 'closed' | 'cancelled',
        notes: data.notes || undefined,
      }

      // Crear la entrada en el diario
      await createJournalEntry(entryData)

      // Mostrar notificación de éxito
      toast({
        title: "Operación guardada",
        description: "La operación se ha añadido correctamente a tu diario",
      })

      // Cerrar el diálogo y reiniciar el formulario
      setOpen(false)
      form.reset()
      
      // Actualizar la vista del diario para mostrar la nueva entrada
      router.refresh()
    } catch (error) {
      console.error("Error al guardar la operación:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la operación. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-2 h-4 w-4" />
          Nueva Operación
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Añadir nueva operación</DialogTitle>
          <DialogDescription>
            Registra los detalles de tu operación en el diario de trading
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <Tabs
              defaultValue="planned"
              value={tabValue}
              onValueChange={setTabValue}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="planned">Planificada</TabsTrigger>
                <TabsTrigger value="open">Abierta</TabsTrigger>
                <TabsTrigger value="closed">Cerrada</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelada</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Tipo de Operación</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="long" id="long" />
                          <Label
                            htmlFor="long"
                            className="flex items-center cursor-pointer"
                          >
                            <ArrowUpIcon className="mr-1 h-4 w-4 text-emerald-500" />
                            Long
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="short" id="short" />
                          <Label
                            htmlFor="short"
                            className="flex items-center cursor-pointer"
                          >
                            <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
                            Short
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="asset"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Par de Trading</FormLabel>
                    <FormControl>
                      <Popover open={assetSelectorOpen} onOpenChange={setAssetSelectorOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={assetSelectorOpen}
                            className="w-full justify-between"
                          >
                            {field.value}
                            <ArrowDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[300px]">
                          <Command>
                            <CommandInput 
                              placeholder="Buscar criptomoneda..." 
                              className="h-9"
                              value={searchTerm}
                              onValueChange={setSearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                              <CommandGroup className="max-h-[300px] overflow-auto">
                                {coinsLoading ? (
                                  <div className="p-2 text-center text-sm text-muted-foreground">Cargando criptomonedas...</div>
                                ) : (
                                  filteredTradingPairs.map((pair) => (
                                    <CommandItem
                                      key={pair.uniqueKey}
                                      value={pair.value}
                                      onSelect={() => {
                                        form.setValue("asset", pair.value);
                                        setAssetSelectorOpen(false);
                                        setSearchTerm("");
                                      }}
                                      className="flex items-center gap-2"
                                    >
                                      {pair.image && (
                                        <img 
                                          src={pair.image} 
                                          alt={pair.label}
                                          className="h-5 w-5 rounded-full"
                                        />
                                      )}
                                      <span>{pair.value}</span>
                                    </CommandItem>
                                  ))
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entryPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio de Entrada</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                          field.onChange(value);
                          calculateRisk();
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stopLoss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stop Loss</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                          field.onChange(value);
                          calculateRisk();
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="takeProfit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Take Profit (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={field.value || ""}
                        onChange={(e) => {
                          const newValue = e.target.value === "" ? undefined : parseFloat(e.target.value);
                          field.onChange(newValue);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="positionSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamaño de Posición</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                          field.onChange(value);
                          calculateRisk();
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="leverage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apalancamiento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        min="1"
                        placeholder="1"
                        value={field.value === 0 ? "1" : field.value}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 1 : parseFloat(e.target.value);
                          field.onChange(value);
                          calculateRisk();
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col">
                <FormLabel className="mb-2">Cantidad en Riesgo (Calculada)</FormLabel>
                <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center">
                  {calculatedRisk !== null ? (
                    <span>{calculatedRisk.toFixed(2)} USDT 
                      {riskPercentage && <span className="text-xs ml-1 text-muted-foreground">
                        (~{riskPercentage}%)
                      </span>}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Pendiente de cálculo</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Calculado automáticamente basado en el tamaño de posición y la distancia al stop loss
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Añade notas sobre tu análisis, razones de entrada, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar Operación</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

