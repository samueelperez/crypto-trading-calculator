"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { coinGeckoService, type CoinInfo } from "@/lib/api/coingecko-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CoinSearchProps {
  onSelect: (coin: CoinInfo) => void
  placeholder?: string
}

export function CoinSearch({ onSelect, placeholder = "Search for a coin..." }: CoinSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [coins, setCoins] = React.useState<CoinInfo[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedCoin, setSelectedCoin] = React.useState<CoinInfo | null>(null)

  // Cargar monedas populares al inicio
  React.useEffect(() => {
    const loadInitialOptions = async () => {
      setLoading(true)
      try {
        // Asegurarnos de que USDT y otras stablecoins estén en la lista inicial
        const popularSymbols = ["BTC", "ETH", "USDT", "USDC", "BNB", "SOL", "XRP", "ADA", "DOGE"]
        const results = await Promise.all(popularSymbols.map((symbol) => coinGeckoService.searchCoins(symbol)))

        // Aplanar y eliminar duplicados
        const flatResults = results.flat()

        // Eliminar duplicados por ID
        const uniqueOptions = Array.from(new Map(flatResults.map((item) => [item.id, item])).values())
        setCoins(uniqueOptions.slice(0, 10))
      } catch (error) {
        console.error("Error loading initial options:", error)
      } finally {
        setLoading(false)
      }
    }

    if (open && coins.length === 0 && !searchTerm) {
      loadInitialOptions()
    }
  }, [open, coins.length, searchTerm])

  // Buscar monedas cuando cambia el término de búsqueda
  React.useEffect(() => {
    const handleSearch = async () => {
      if (!searchTerm.trim() && coins.length > 0) {
        return
      }

      if (!searchTerm.trim() && coins.length === 0) {
        return
      }

      setLoading(true)
      try {
        let results = await coinGeckoService.searchCoins(searchTerm)

        if (searchTerm.toLowerCase().includes("usdt") || searchTerm.toLowerCase().includes("tether")) {
          const usdtResults = await coinGeckoService.searchCoins("USDT")
          if (usdtResults.length > 0 && !results.some((coin) => coin.symbol.toUpperCase() === "USDT")) {
            results = [...usdtResults, ...results]
          }
        }

        setCoins(results.slice(0, 10))
      } catch (error) {
        console.error("Error searching coins:", error)
        setCoins([])
      } finally {
        setLoading(false)
      }
    }

    const handler = setTimeout(handleSearch, 300)
    return () => clearTimeout(handler)
  }, [searchTerm, coins.length])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedCoin ? (
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={selectedCoin.image} alt={selectedCoin.name} />
                <AvatarFallback>{selectedCoin.symbol.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>
                {selectedCoin.name} ({selectedCoin.symbol.toUpperCase()})
              </span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={placeholder} value={searchTerm} onValueChange={setSearchTerm} />
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && (
            <CommandList>
              <CommandEmpty>No coins found.</CommandEmpty>
              <CommandGroup>
                {coins.map((coin) => (
                  <CommandItem
                    key={coin.id}
                    value={coin.id}
                    onSelect={() => {
                      setSelectedCoin(coin)
                      onSelect(coin)
                      setOpen(false)
                    }}
                    className="flex items-center"
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={coin.image} alt={coin.name} />
                      <AvatarFallback>{coin.symbol.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </span>
                    <Check
                      className={cn("ml-auto h-4 w-4", selectedCoin?.id === coin.id ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

