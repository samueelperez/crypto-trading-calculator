"use client"

import { useState, useEffect } from "react"
import { ArrowDownIcon, ArrowUpIcon, Save, Check, AlertCircle, InfoIcon, BookIcon, SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { usePortfolio } from "@/hooks/use-portfolio"
import { useToast } from "@/hooks/use-toast"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Importar el servicio del journal
import { createJournalEntry } from "@/lib/journal-service"

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

export default function CalculatorPage() {
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<string>("")
  const [entryPrice, setEntryPrice] = useState<string>("")
  const [stopLossPrice, setStopLossPrice] = useState<string>("")
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>("")
  const [operationType, setOperationType] = useState<string>("long")
  const [riskPercentage, setRiskPercentage] = useState<number>(1) // Default 1%
  const [selectedLeverage, setSelectedLeverage] = useState<number | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [tradingNote, setTradingNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [assetSymbol, setAssetSymbol] = useState<string>("BTC/USDT")
  const [assetSelectorOpen, setAssetSelectorOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados para la lista de monedas
  const [coins, setCoins] = useState<Coin[]>([])
  const [coinsLoading, setCoinsLoading] = useState<boolean>(true)
  const [coinsError, setCoinsError] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    maxRisk: number
    usdtAmount: number
    leverage: number
    riskRewardRatio?: number
    riskPercentage: number
    stopLossPercentage: number
  } | null>(null)

  // Opciones fijas de apalancamiento
  const leverageOptions = [5, 10, 20, 50]

  // Pares de trading comunes (fallback)
  const commonPairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "ADA/USDT"]

  const [isLoading, setIsLoading] = useState<boolean>(true)
  
  // Usar hooks para obtener datos
  const { summary, isLoading: portfolioLoading } = usePortfolio()
  const { toast } = useToast()

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

  useEffect(() => {
    // Obtener el valor del portfolio desde el hook usePortfolio
    const fetchPortfolioData = async () => {
      setIsLoading(true)
      try {
        // Si el resumen del portfolio está disponible, usar su valor total
        if (summary && summary.totalValue > 0) {
          setPortfolio(summary.totalValue.toString())
        } else {
          // Intentar obtener el valor del localStorage como respaldo
          const storedValue = localStorage.getItem('user_settings_portfolio_value')
          if (storedValue && !isNaN(Number(storedValue))) {
            setPortfolio(storedValue)
          } else {
            // Si no hay valor disponible, usar 0
            setPortfolio("0")
          }
        }
      } catch (error) {
        console.error("Error obteniendo valor del portfolio:", error)
        setPortfolio("0")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPortfolioData()
  }, [summary])

  // Actualizar el isLoading basado en el estado de carga del portfolio
  useEffect(() => {
    setIsLoading(portfolioLoading || coinsLoading)
  }, [portfolioLoading, coinsLoading])

  // Restablecer el leverage seleccionado cuando cambian los resultados
  useEffect(() => {
    if (result) {
      // Seleccionar el valor más cercano de las opciones disponibles
      const closestLeverage = leverageOptions.reduce((prev, curr) => 
        Math.abs(curr - result.leverage) < Math.abs(prev - result.leverage) ? curr : prev
      )
      setSelectedLeverage(closestLeverage)
    } else {
      setSelectedLeverage(null)
    }
  }, [result])

  const calculatePosition = () => {
    // Reset previous results and errors
    setError(null)
    setResult(null)

    // Validate inputs are numbers and positive
    const portfolioValue = Number(portfolio)
    const entry = Number(entryPrice)
    const stopLoss = Number(stopLossPrice)
    const takeProfit = takeProfitPrice ? Number(takeProfitPrice) : null

    if (isNaN(portfolioValue) || portfolioValue <= 0) {
      setError("Portfolio amount must be a positive number")
      return
    }

    if (isNaN(entry) || entry <= 0) {
      setError("Entry price must be a positive number")
      return
    }

    if (isNaN(stopLoss) || stopLoss <= 0) {
      setError("Stop loss price must be a positive number")
      return
    }

    if (takeProfit !== null && (isNaN(takeProfit) || takeProfit <= 0)) {
      setError("Take profit price must be a positive number")
      return
    }

    // Validate stop loss position based on operation type
    if (operationType === "long" && stopLoss >= entry) {
      setError("For long positions, stop loss must be below entry price")
      return
    }

    if (operationType === "short" && stopLoss <= entry) {
      setError("For short positions, stop loss must be above entry price")
      return
    }

    // Calculate maximum risk (using selected risk percentage of portfolio)
    const maxRisk = portfolioValue * (riskPercentage / 100)

    // CORRECCIÓN: Calcular el porcentaje de distancia al stop loss primero
    let stopLossPercentage
    if (operationType === "long") {
      // Para long, (entry - stopLoss) / entry
      stopLossPercentage = (entry - stopLoss) / entry
    } else {
      // Para short, (stopLoss - entry) / entry
      stopLossPercentage = (stopLoss - entry) / entry
    }

    // Calcular posibles apalancamientos basados en riesgo
    // Para cualquier apalancamiento, el riesgo total sería stopLossPercentage * leverage * posición
    // Por lo tanto, posición = maxRisk / (stopLossPercentage * leverage)
    
    // Calcular posiciones para cada opción de apalancamiento
    const positionSizes = leverageOptions.map(lev => {
      // El tamaño máximo de posición que mantiene el riesgo en maxRisk con este apalancamiento
      const positionSize = maxRisk / (stopLossPercentage * lev)
      return {
        leverage: lev,
        // La posición real con apalancamiento (lo que el usuario ve en la plataforma)
        adjustedSize: positionSize,
        // El colateral necesario (dinero real invertido)
        collateral: positionSize / lev
      }
    })
    
    // Ordenar por tamaño de posición ajustado para encontrar el mejor apalancamiento
    positionSizes.sort((a, b) => b.adjustedSize - a.adjustedSize)
    
    // Seleccionar el apalancamiento que proporciona la mejor posición dentro del riesgo permitido
    const bestOption = positionSizes[0]

    // Calculate USDT amount to invest (colateral real necesario)
    const usdtAmount = bestOption.collateral

    // Calculate risk/reward ratio if take profit is provided
    let riskRewardRatio
    if (takeProfit !== null) {
      let takeProfitPercentage
      if (operationType === "long") {
        takeProfitPercentage = (takeProfit - entry) / entry
      } else {
        takeProfitPercentage = (entry - takeProfit) / entry
      }
      riskRewardRatio = Math.abs(takeProfitPercentage / stopLossPercentage)
    }

    // Set result
    const resultData = {
      maxRisk,
      usdtAmount,
      leverage: bestOption.leverage,
      riskRewardRatio,
      riskPercentage,
      // Guardar el porcentaje de stop loss para cálculos futuros
      stopLossPercentage
    }
    
    setResult(resultData)
    setSelectedLeverage(bestOption.leverage) // Seleccionar el leverage recomendado por defecto
  }
  
  // Calcular tamaño de posición ajustado según el leverage seleccionado
  const getAdjustedPositionSize = () => {
    if (!result || !selectedLeverage) return 0
    
    // CORRECCIÓN: Calcular correctamente el tamaño de posición basado en el riesgo máximo permitido
    // Fórmula: riesgo_máximo / (porcentaje_stop_loss * apalancamiento)
    const maxPositionSize = result.maxRisk / (result.stopLossPercentage * selectedLeverage)
    
    return maxPositionSize
  }

  // Función para guardar la operación en el diario
  const saveToJournal = async () => {
    if (!result || !selectedLeverage) return
    
    setIsSaving(true)
    
    try {
      // Crear objeto con los datos de la operación
      const operationData = {
        type: operationType as 'long' | 'short',
        asset: assetSymbol,
        entry_price: Number(entryPrice),
        stop_loss: Number(stopLossPrice),
        take_profit: takeProfitPrice ? Number(takeProfitPrice) : null,
        position_size: getAdjustedPositionSize(),
        leverage: selectedLeverage,
        risk_amount: result.maxRisk,
        risk_percentage: result.riskPercentage,
        status: 'planned' as const, // Operación planificada
        notes: tradingNote || undefined,
        created_at: new Date().toISOString(),
      }
      
      // Usar el servicio para crear la entrada en el diario
      await createJournalEntry(operationData)
      
      toast({
        title: "Operación guardada",
        description: "La operación se ha guardado correctamente en el diario de trading",
        variant: "default",
      })
      
      setSaveDialogOpen(false)
      setTradingNote("")
      
      // Redirección a la sección Journal después de guardar
      router.push('/journal')
    } catch (error) {
      console.error("Error al guardar la operación:", error)
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "No se pudo guardar la operación en el diario",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Calculadora de Posiciones</h1>
      </div>

      <Card className="overflow-hidden border-2">
        <CardHeader className="bg-muted/40">
          <CardTitle className="text-2xl">Calculadora de Tamaño y Apalancamiento</CardTitle>
          <CardDescription>
            Calcula el tamaño de posición óptimo y el apalancamiento para trading de futuros basado en gestión de riesgo
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {coinsError && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aviso</AlertTitle>
              <AlertDescription>{coinsError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-5">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-base">Portfolio (USDT)</Label>
                <div className="rounded-md border-2 border-input bg-background px-4 py-3 font-medium text-lg">
                  {isLoading ? "Cargando..." : Number(portfolio).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Automáticamente obtenido de tu portfolio</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="risk-percentage" className="text-base flex items-center gap-1">
                  Riesgo: <span className="font-medium">{riskPercentage}%</span>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </Label>
                <div className="pt-2">
                  <Slider
                    id="risk-percentage"
                    min={0.1}
                    max={5}
                    step={0.1}
                    value={[riskPercentage]}
                    onValueChange={(value) => setRiskPercentage(value[0])}
                    className={cn(
                      riskPercentage <= 1 ? "accent-emerald-500" : 
                      riskPercentage <= 2 ? "accent-amber-500" : 
                      "accent-red-500"
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {riskPercentage <= 1 
                    ? "Conservador (recomendado)" 
                    : riskPercentage <= 2 
                      ? "Moderado" 
                      : "Agresivo (alto riesgo)"}
                </p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                <div className="col-span-1">
                  <Label htmlFor="asset" className="text-base mb-2 block">Par de Trading</Label>
                  
                  <Popover open={assetSelectorOpen} onOpenChange={setAssetSelectorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={assetSelectorOpen}
                        className="w-full justify-between h-11 text-base"
                      >
                        {assetSymbol}
                        <ArrowDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar criptomoneda..." 
                          className="h-11"
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
                                    setAssetSymbol(pair.value)
                                    setAssetSelectorOpen(false)
                                    setSearchTerm("")
                                  }}
                                  className="flex items-center gap-2 p-2"
                                >
                                  {pair.image && (
                                    <img 
                                      src={pair.image} 
                                      alt={pair.label}
                                      className="h-5 w-5 rounded-full"
                                    />
                                  )}
                                  <span>{pair.label}</span>
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="col-span-3">
                  <RadioGroup value={operationType} onValueChange={setOperationType} className="flex space-x-6 mb-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="long" id="long" className="text-positive" />
                      <Label htmlFor="long" className="flex items-center text-base font-medium">
                        <ArrowUpIcon className="mr-1 h-5 w-5 text-positive" />
                        Long
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="short" id="short" className="text-negative" />
                      <Label htmlFor="short" className="flex items-center text-base font-medium">
                        <ArrowDownIcon className="mr-1 h-5 w-5 text-negative" />
                        Short
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="entry-price" className="text-base">Precio de Entrada</Label>
                  <Input
                    id="entry-price"
                    type="number"
                    placeholder="50000"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="text-base py-5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stop-loss" className="text-base text-negative">
                    Stop Loss
                  </Label>
                  <Input
                    id="stop-loss"
                    type="number"
                    placeholder={operationType === "long" ? "49500" : "50500"}
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(e.target.value)}
                    className="border-negative/30 focus-visible:ring-negative/30 text-base py-5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="take-profit" className="text-base text-positive">
                    Take Profit (Opcional)
                  </Label>
                  <Input
                    id="take-profit"
                    type="number"
                    placeholder={operationType === "long" ? "51000" : "49000"}
                    value={takeProfitPrice}
                    onChange={(e) => setTakeProfitPrice(e.target.value)}
                    className="border-positive/30 focus-visible:ring-positive/30 text-base py-5"
                  />
                </div>
              </div>
            </div>

            <Button onClick={calculatePosition} className="w-full text-base h-12 mt-2">
              Calcular Posición
            </Button>
          </div>

          {result && (
            <>
              <Separator className="my-6" />
              
              <div className="space-y-6">
                {/* NUEVA SECCIÓN DE RESULTADOS */}
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="space-y-1">
                      <Label className="text-base font-medium text-muted-foreground">Riesgo Máximo ({result.riskPercentage}%)</Label>
                      <div className="rounded-lg border border-input bg-background p-4 text-xl font-semibold">
                        {result.maxRisk.toFixed(2)} USDT
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-base font-medium text-muted-foreground">Tamaño Base</Label>
                      <div className="rounded-lg border border-input bg-background p-4 text-xl font-semibold">
                        {result.usdtAmount.toFixed(2)} USDT
                      </div>
                    </div>
                    
                    {result.riskRewardRatio && (
                      <div className="space-y-1">
                        <Label className="text-base font-medium text-muted-foreground">Ratio Riesgo/Recompensa</Label>
                        <div className={cn(
                          "rounded-lg border border-input bg-background p-4 text-xl font-semibold",
                          result.riskRewardRatio >= 2 ? "text-positive" : result.riskRewardRatio < 1 ? "text-negative" : ""
                        )}>
                          1:{result.riskRewardRatio.toFixed(2)}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <Label className="text-base font-medium text-muted-foreground">Posición Ajustada</Label>
                      <div className="rounded-lg border border-input bg-background p-4 text-xl font-semibold">
                        {getAdjustedPositionSize().toFixed(2)} USDT
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 mb-6">
                    <h3 className="text-base font-medium text-muted-foreground mb-3">Seleccionar Apalancamiento</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {leverageOptions.map((lev) => (
                        <button
                          key={lev}
                          onClick={() => setSelectedLeverage(lev)}
                          className={cn(
                            "flex justify-center items-center h-16 rounded-lg border font-semibold text-xl transition-all",
                            selectedLeverage === lev 
                              ? "bg-blue-600 text-white border-blue-600" 
                              : "bg-white dark:bg-background border-input text-foreground",
                            lev === result.leverage ? "ring-2 ring-blue-400" : ""
                          )}
                        >
                          {lev}x
                          {lev === result.leverage && (
                            <span className="ml-1 text-xs">(Rec)</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                
                  <div className="bg-gray-50 dark:bg-muted/20 rounded-lg p-6 mt-10">
                    <h3 className="text-lg font-semibold mb-4">Resumen de Posición</h3>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      Basado en tu portfolio de <span className="font-medium">{Number(portfolio).toLocaleString()} USDT</span>, 
                      deberías arriesgar un máximo de <span className="font-medium">{result.maxRisk.toFixed(2)} USDT</span> ({result.riskPercentage}%) en esta operación.
                    </p>
                    
                    <div className="mb-4 bg-white dark:bg-muted p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        <h4 className="text-base font-bold">Configuración Seleccionada</h4>
                      </div>
                      <p className="text-base ml-7">
                        <span className="font-semibold">Par: {assetSymbol}</span> | 
                        <span className="font-semibold"> Apalancamiento: {selectedLeverage}x</span> | 
                        Posición ajustada: {getAdjustedPositionSize().toFixed(2)} USDT
                      </p>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      Para una operación <span className="font-medium">{operationType === "long" ? "LONG" : "SHORT"}</span> con entrada en {Number(entryPrice).toLocaleString()} USDT y stop loss
                      en {Number(stopLossPrice).toLocaleString()} USDT:
                    </p>
                    
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-2">
                      <li>Tamaño de posición: <strong className="text-foreground">{getAdjustedPositionSize().toFixed(2)} USDT</strong> con apalancamiento <strong className="text-foreground">{selectedLeverage}x</strong></li>
                      {result.riskRewardRatio && (
                        <li className={cn(
                          result.riskRewardRatio >= 2
                            ? "text-positive"
                            : result.riskRewardRatio < 1
                              ? "text-negative"
                              : ""
                        )}>
                          Ratio riesgo/recompensa: <strong>1:{result.riskRewardRatio.toFixed(2)}</strong>{" "}
                          {result.riskRewardRatio >= 2 ? "(Bueno)" : result.riskRewardRatio < 1 ? "(Pobre)" : "(Aceptable)"}
                        </li>
                      )}
                      <li>Riesgo máximo: <strong className="text-foreground">{result.maxRisk.toFixed(2)} USDT</strong> ({result.riskPercentage}% del portfolio)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        {result && (
          <CardFooter className="bg-gray-100 dark:bg-gray-900 px-6 py-4 flex justify-end border-t">
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-12"
                >
                  <BookIcon className="h-5 w-5" />
                  Guardar Operación en Diario
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Guardar Operación en el Diario</DialogTitle>
                  <DialogDescription>
                    Añade esta operación planificada a tu diario de trading para seguimiento
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Resumen de la operación</h4>
                    <div className="text-sm rounded-md bg-muted p-3">
                      <p><strong>Par:</strong> {assetSymbol}</p>
                      <p><strong>Tipo:</strong> {operationType === "long" ? "Compra (Long)" : "Venta (Short)"}</p>
                      <p><strong>Precio de entrada:</strong> {Number(entryPrice).toLocaleString()} USDT</p>
                      <p><strong>Stop Loss:</strong> {Number(stopLossPrice).toLocaleString()} USDT</p>
                      {takeProfitPrice && <p><strong>Take Profit:</strong> {Number(takeProfitPrice).toLocaleString()} USDT</p>}
                      <p><strong>Tamaño de posición:</strong> {getAdjustedPositionSize().toFixed(2)} USDT</p>
                      <p><strong>Apalancamiento:</strong> {selectedLeverage}x</p>
                      <p><strong>Riesgo:</strong> {result.maxRisk.toFixed(2)} USDT ({result.riskPercentage}%)</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trading-note">Notas adicionales (opcional)</Label>
                    <Input
                      id="trading-note"
                      value={tradingNote}
                      onChange={(e) => setTradingNote(e.target.value)}
                      placeholder="Razones para esta operación, estrategia, etc."
                      className="h-20"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={saveToJournal} disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Guardar operación"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

