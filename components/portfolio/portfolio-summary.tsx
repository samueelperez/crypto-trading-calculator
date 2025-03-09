"use client"

import { useEffect, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, RefreshCcwIcon, WifiOffIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { usePortfolio } from "@/hooks/use-portfolio"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cryptoPriceService } from "@/lib/api/crypto-price-service"

export function PortfolioSummary() {
  const {
    summary,
    isLoading,
    error,
    lastUpdated,
    isOffline,
    retryCount,
    refreshPrices,
    refreshData,
    portfolioWithPrices,
  } = usePortfolio()

  // Estados para los precios actualizados y el resumen recalculado
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false)
  const [updatedSummary, setUpdatedSummary] = useState<{
    totalValue: number
    totalProfitLoss: number
    profitLossPercentage: number
    lastUpdatedFromAPI: Date
  } | null>(null)

  // Efecto para actualizar los precios y recalcular el resumen
  useEffect(() => {
    if (!portfolioWithPrices || portfolioWithPrices.length === 0 || isOffline) return

    const updatePricesAndSummary = async () => {
      setIsUpdatingPrices(true)

      try {
        let newTotalValue = 0
        const symbols = portfolioWithPrices.flatMap((exchange) => exchange.assets.map((asset) => asset.symbol))

        // Get all prices at once to reduce API calls
        const prices = await cryptoPriceService.getPrices(symbols)

        // Calculate new total value
        for (const exchange of portfolioWithPrices) {
          for (const asset of exchange.assets) {
            try {
              const price = prices[asset.symbol]?.current_price

              if (price) {
                const assetValue = Number(asset.quantity) * price
                newTotalValue += assetValue
              } else {
                // Use existing value as fallback
                newTotalValue += asset.currentValue
              }
            } catch (assetError) {
              console.error(`Error processing asset ${asset.symbol}:`, assetError)
              newTotalValue += asset.currentValue
            }
          }
        }

        // Si tenemos un resumen y un valor total recalculado
        if (summary && newTotalValue > 0) {
          // Calcular el nuevo profit/loss
          const newProfitLoss = newTotalValue - summary.totalInvestment
          const newProfitLossPercentage =
            summary.totalInvestment > 0 ? (newProfitLoss / summary.totalInvestment) * 100 : 0

          // Actualizar el resumen
          setUpdatedSummary({
            totalValue: newTotalValue,
            totalProfitLoss: newProfitLoss,
            profitLossPercentage: newProfitLossPercentage,
            lastUpdatedFromAPI: new Date(),
          })
        }
      } catch (error) {
        console.error("Error updating prices:", error)
      } finally {
        setIsUpdatingPrices(false)
      }
    }

    // Actualizar precios al montar el componente
    updatePricesAndSummary()

    // Actualizar precios cada 2 minutos
    const interval = setInterval(updatePricesAndSummary, 120000)

    return () => clearInterval(interval)
  }, [portfolioWithPrices, summary, isOffline])

  const formattedLastUpdate = lastUpdated.toLocaleTimeString()
  const formattedAPIUpdate = updatedSummary?.lastUpdatedFromAPI.toLocaleTimeString()

  // Renderizar estado de error
  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center">
            {isOffline && <WifiOffIcon className="mr-2 h-5 w-5" />}
            Error Loading Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={refreshData} disabled={isOffline}>
              <RefreshCcwIcon className="mr-2 h-4 w-4" />
              Retry Loading Data
            </Button>

            {isOffline && (
              <p className="text-sm text-muted-foreground mt-2 sm:mt-0 sm:ml-2 flex items-center">
                <WifiOffIcon className="mr-1 h-4 w-4" />
                You are currently offline
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Portfolio Summary</CardTitle>
            <CardDescription className="flex items-center">
              {updatedSummary ? (
                <>
                  Last updated from API: {formattedAPIUpdate}
                  {isUpdatingPrices && <span className="ml-2 text-muted-foreground">(actualizando...)</span>}
                </>
              ) : (
                <>Last updated: {formattedLastUpdate}</>
              )}
              {isOffline && (
                <span className="ml-2 flex items-center text-amber-500">
                  <WifiOffIcon className="mr-1 h-4 w-4" />
                  Offline
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={updatedSummary ? () => setIsUpdatingPrices(true) : refreshData}
            disabled={isLoading || isUpdatingPrices || isOffline}
          >
            <RefreshCcwIcon className={cn("mr-2 h-4 w-4", (isLoading || isUpdatingPrices) && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Value</p>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <p className="text-2xl font-bold">
                {updatedSummary ? formatCurrency(updatedSummary.totalValue) : formatCurrency(summary?.totalValue || 0)}
                {updatedSummary && <span className="text-xs ml-1 text-muted-foreground">(actualizado)</span>}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Investment</p>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(summary?.totalInvestment || 0)}</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Profit/Loss</p>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : summary ? (
              <p
                className={cn(
                  "text-2xl font-bold flex items-center",
                  (updatedSummary ? updatedSummary.totalProfitLoss : summary.totalProfitLoss) >= 0
                    ? "text-positive"
                    : "text-negative",
                )}
              >
                {(updatedSummary ? updatedSummary.totalProfitLoss : summary.totalProfitLoss) >= 0 ? (
                  <ArrowUpIcon className="mr-1 h-5 w-5" />
                ) : (
                  <ArrowDownIcon className="mr-1 h-5 w-5" />
                )}
                {formatCurrency(Math.abs(updatedSummary ? updatedSummary.totalProfitLoss : summary.totalProfitLoss))}
                {updatedSummary && <span className="text-xs ml-1 text-muted-foreground">(actualizado)</span>}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Profit/Loss %</p>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : summary ? (
              <p
                className={cn(
                  "text-2xl font-bold flex items-center",
                  (updatedSummary ? updatedSummary.profitLossPercentage : summary.profitLossPercentage) >= 0
                    ? "text-positive"
                    : "text-negative",
                )}
              >
                {(updatedSummary ? updatedSummary.profitLossPercentage : summary.profitLossPercentage) >= 0 ? (
                  <ArrowUpIcon className="mr-1 h-5 w-5" />
                ) : (
                  <ArrowDownIcon className="mr-1 h-5 w-5" />
                )}
                {Math.abs(updatedSummary ? updatedSummary.profitLossPercentage : summary.profitLossPercentage).toFixed(
                  2,
                )}
                %{updatedSummary && <span className="text-xs ml-1 text-muted-foreground">(actualizado)</span>}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

