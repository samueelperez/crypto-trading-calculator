"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, PlusIcon, Pencil, Trash2, Settings, RefreshCw, EyeIcon } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { AddAssetDialog } from "@/components/portfolio/add-asset-dialog"
import { EditExchangeDialog } from "@/components/portfolio/edit-exchange-dialog"
import { EditAssetDialog } from "@/components/portfolio/edit-asset-dialog"
import { ConfirmDialog } from "@/components/portfolio/confirm-dialog"
import { toast } from "@/components/ui/use-toast"
import { ExchangeWithAssets, AssetWithValue } from "@/types/portfolio"
import { formatCurrency } from "@/lib/utils"
import { usePortfolio } from "@/hooks/use-portfolio"
import { eventBus, EVENTS } from "@/lib/event-bus"

interface ExchangeCardProps {
  exchange: ExchangeWithAssets
}

export function ExchangeCard({ exchange: initialExchange }: ExchangeCardProps) {
  const router = useRouter()
  const { refreshData, deleteExchange, deleteAsset } = usePortfolio()
  const [exchange, setExchange] = useState<ExchangeWithAssets>(initialExchange)
  const [isAddingAsset, setIsAddingAsset] = useState(false)
  const [isEditingExchange, setIsEditingExchange] = useState(false)
  const [isEditingAsset, setIsEditingAsset] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState<string>("")
  const [isShowingConfirm, setIsShowingConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false)
  const [updateCounter, setUpdateCounter] = useState(0) // Counter to force updates
  const initialLoadDone = useRef(false)
  const [forceUpdate, setForceUpdate] = useState(0) // New state for forceUpdate

  // Update exchange state when initialExchange changes
  useEffect(() => {
    console.log(`ExchangeCard(${initialExchange.name}): Received updated exchange data with ${initialExchange.assets.length} assets`)
    setExchange(initialExchange)
    initialLoadDone.current = true
  }, [initialExchange])

  // Suscribirse a eventos relevantes
  useEffect(() => {
    // Escuchar evento de asset añadido
    const assetAddedUnsubscribe = eventBus.subscribe(EVENTS.ASSET_ADDED, (newAsset, exchangeId) => {
      if (exchangeId === exchange.id) {
        console.log(`ExchangeCard(${exchange.name}): Received ASSET_ADDED event for this exchange`, newAsset)
        
        // Verificar si es una stablecoin
        const isStablecoin = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdp'].includes(
          newAsset.symbol.toLowerCase()
        )
        
        // Calculate values for the new asset
        const quantity = Number(newAsset.quantity)
        const purchasePrice = Number(newAsset.purchase_price_avg)
        
        // Para stablecoins, asegurar que el precio sea siempre 1.00
        const effectivePrice = isStablecoin ? 1.0 : purchasePrice
        const initialValue = quantity * effectivePrice
        
        // Create new asset with calculated values
        const assetWithValue: AssetWithValue = {
          ...newAsset,
          currentPrice: effectivePrice,
          currentValue: initialValue,
          profitLoss: isStablecoin ? 0 : (quantity * effectivePrice) - (quantity * purchasePrice),
          profitLossPercentage: isStablecoin ? 0 : purchasePrice > 0 ? ((effectivePrice - purchasePrice) / purchasePrice) * 100 : 0,
          lastUpdated: new Date(),
        }
        
        // Actualizar inmediatamente el estado local
        setExchange(prev => ({
          ...prev,
          assets: [...prev.assets, assetWithValue],
          totalValue: prev.totalValue + initialValue,
        }))
        
        setUpdateCounter(prev => prev + 1)
      }
    })

    // Escuchar evento de portfolio refrescado
    const portfolioRefreshedUnsubscribe = eventBus.subscribe(EVENTS.PORTFOLIO_REFRESHED, (exchangesData) => {
      const updatedExchange = exchangesData.find(e => e.id === exchange.id)
      if (updatedExchange) {
        console.log(`ExchangeCard(${exchange.name}): Portfolio refreshed, updating with new data`)
        setExchange(updatedExchange)
      }
    })
    
    return () => {
      assetAddedUnsubscribe()
      portfolioRefreshedUnsubscribe()
    }
  }, [exchange.id, exchange.name])

  // Suscribirse a eventos de cambios en los assets
  useEffect(() => {
    // Cuando se actualiza un asset que pertenece a este exchange
    const assetUpdatedUnsubscribe = eventBus.subscribe(EVENTS.ASSET_UPDATED, (data) => {
      if (data.exchangeId === exchange.id) {
        console.log(`ExchangeCard: Asset updated for exchange ${exchange.name}`, data.asset.symbol)
        setForceUpdate(prev => prev + 1)
      }
    })
    
    return () => {
      assetUpdatedUnsubscribe()
    }
  }, [exchange.id, exchange.name])

  // También usamos updateCounter para forzar actualizaciones
  useEffect(() => {
    if (updateCounter > 0 && initialLoadDone.current) {
      console.log(`ExchangeCard(${exchange.name}): Forcing refresh due to update counter:`, updateCounter)
      refreshData().catch(error => {
        console.error("Error refreshing data after update:", error)
      })
    }
  }, [updateCounter, refreshData, exchange.name])

  // Forzar actualización cuando cambie el exchange o el contador de actualizaciones
  useEffect(() => {
    // Actualizar el estado del exchange cuando cambie o cuando se fuerce la actualización
    setExchange(initialExchange)
    console.log(`ExchangeCard(${initialExchange.name}): Actualizando por cambio forzado`)
  }, [initialExchange, forceUpdate])

  // Asset added callback handler
  const handleAssetAdded = useCallback(() => {
    console.log(`ExchangeCard(${exchange.name}): Asset added, forcing update...`)
    setUpdateCounter(prev => prev + 1)
  }, [exchange.name])

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await deleteExchange(exchange.id)
      toast({
        title: "Exchange deleted",
        description: "The exchange has been successfully deleted",
      })
      
      // Publicar evento
      eventBus.publish(EVENTS.EXCHANGE_DELETED, exchange.id)
    } catch (error) {
      console.error("Error deleting exchange:", error)
      toast({
        variant: "destructive",
        title: "Failed to delete exchange",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
      setIsShowingConfirm(false)
    }
  }

  const handleEditAsset = (assetId: string) => {
    setSelectedAssetId(assetId)
    setIsEditingAsset(true)
  }

  const handleDeleteAsset = async (assetId: string) => {
    setIsLoading(true)
    try {
      await deleteAsset(assetId)

      // Update local state immediately
      setExchange(prev => ({
        ...prev,
        assets: prev.assets.filter(asset => asset.id !== assetId),
      }))

      toast({
        title: "Asset deleted",
        description: "The asset has been successfully deleted",
      })
      
      // Publicar evento
      eventBus.publish(EVENTS.ASSET_DELETED, assetId, exchange.id)
      
      // Force refresh to ensure consistency
      await refreshData()
    } catch (error) {
      console.error("Error deleting asset:", error)
      toast({
        variant: "destructive",
        title: "Failed to delete asset",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshPrices = async () => {
    setIsRefreshingPrices(true)
    try {
      await refreshData()
      toast({
        title: "Prices refreshed",
        description: "The portfolio prices have been updated",
      })
    } catch (error) {
      console.error("Error refreshing prices:", error)
      toast({
        variant: "destructive",
        title: "Failed to refresh prices",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsRefreshingPrices(false)
    }
  }

  const handleViewDetails = () => {
    router.push(`/portfolio/exchanges/${exchange.id}`)
  }

  // Handle dialog changes to ensure data is refreshed when dialogs close
  const handleAddAssetDialogChange = (open: boolean) => {
    setIsAddingAsset(open)
    if (!open) {
      console.log(`ExchangeCard(${exchange.name}): Add asset dialog closed, refreshing data...`)
      refreshData().catch(error => {
        console.error("Error refreshing data after dialog close:", error)
      })
    }
  }

  const handleEditExchangeDialogChange = (open: boolean) => {
    setIsEditingExchange(open)
    if (!open) {
      console.log(`ExchangeCard(${exchange.name}): Edit exchange dialog closed, refreshing data...`)
      refreshData().catch(error => {
        console.error("Error refreshing data after dialog close:", error)
      })
    }
  }

  // Renderizado manual forzado cuando se solicite
  const forceRefresh = () => {
    console.log(`ExchangeCard(${exchange.name}): Forcing update...`)
    setUpdateCounter(prev => prev + 1)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {exchange.logo_url ? (
              <div className="h-8 w-8 rounded-full overflow-hidden">
                <Image src={exchange.logo_url} alt={exchange.name} width={32} height={32} />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <span className="text-sm font-semibold text-primary-foreground">
                  {exchange.name.substring(0, 1)}
                </span>
              </div>
            )}
            <div>
              <CardTitle>{exchange.name}</CardTitle>
              <CardDescription>{exchange.assets.length} assets</CardDescription>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshPrices}
              disabled={isRefreshingPrices}
              title="Refresh prices"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshingPrices ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsAddingAsset(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Asset
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsEditingExchange(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Exchange
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewDetails}>
                  <EyeIcon className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={forceRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Force Update
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsShowingConfirm(true)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Exchange
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4 flex items-end justify-between">
          <span className="text-sm text-muted-foreground">Total Value</span>
          <span className="text-xl font-bold">{formatCurrency(exchange.totalValue)}</span>
        </div>

        <div className="space-y-3">
          {exchange.assets.length === 0 ? (
            <div className="rounded-md bg-muted py-3 text-center text-sm text-muted-foreground">
              No assets found
            </div>
          ) : (
            exchange.assets.slice(0, 5).map((asset) => (
              <div 
                key={`${asset.id}-${updateCounter}`} 
                className="flex items-center justify-between rounded-md border p-2"
              >
                <div className="flex items-center space-x-2">
                  {asset.logo_url ? (
                    <Image
                      src={asset.logo_url}
                      alt={asset.symbol}
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-full"
                    />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">
                      {asset.symbol.substring(0, 2)}
                    </div>
                  )}
                  <span className="font-medium">{asset.symbol}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{formatCurrency(asset.currentValue)}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-3 w-3" />
                        <span className="sr-only">Options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditAsset(asset.id)}>
                        <Pencil className="mr-2 h-3 w-3" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteAsset(asset.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}

          {exchange.assets.length > 5 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={handleViewDetails}
            >
              View all {exchange.assets.length} assets
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-muted/50 px-4 py-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Performance</span>
          <span
            className={
              exchange.totalValue > 0
                ? "text-sm font-medium text-positive"
                : exchange.totalValue < 0
                ? "text-sm font-medium text-negative"
                : "text-sm font-medium"
            }
          >
            {formatCurrency(exchange.totalValue)}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setIsAddingAsset(true)}>
          <PlusIcon className="mr-2 h-3 w-3" />
          Add Asset
        </Button>
      </CardFooter>

      {isAddingAsset && (
        <AddAssetDialog
          open={isAddingAsset}
          onOpenChange={handleAddAssetDialogChange}
          exchangeId={exchange.id}
          exchangeName={exchange.name}
          onAssetAdded={handleAssetAdded}
        />
      )}

      {isEditingExchange && (
        <EditExchangeDialog
          open={isEditingExchange}
          onOpenChange={handleEditExchangeDialogChange}
          exchange={exchange}
        />
      )}

      {isEditingAsset && (
        <EditAssetDialog
          open={isEditingAsset}
          onOpenChange={setIsEditingAsset}
          assetId={selectedAssetId}
          exchangeName={exchange.name}
        />
      )}

      <ConfirmDialog
        open={isShowingConfirm}
        onOpenChange={setIsShowingConfirm}
        title="Delete Exchange"
        description={`Are you sure you want to delete ${exchange.name}? This will also delete all ${exchange.assets.length} assets associated with this exchange.`}
        isLoading={isLoading}
        onConfirm={handleDelete}
      />
    </Card>
  )
}

