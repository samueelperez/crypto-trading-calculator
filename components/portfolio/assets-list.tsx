"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Pencil, Trash2, Plus, RefreshCw, AlertCircle } from "lucide-react"
import Image from "next/image"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AddAssetDialog } from "@/components/portfolio/add-asset-dialog"
import { EditAssetDialog } from "@/components/portfolio/edit-asset-dialog"
import { ConfirmDialog } from "@/components/portfolio/confirm-dialog"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"
import { usePortfolio } from "@/hooks/use-portfolio"
import { type AssetWithValue } from "@/types/portfolio"

interface AssetsListProps {
  exchangeId: string
}

export function AssetsList({ exchangeId }: AssetsListProps) {
  const { portfolioWithPrices, isLoading, error, refreshData, deleteAsset } = usePortfolio()
  const [assets, setAssets] = useState<AssetWithValue[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [exchangeName, setExchangeName] = useState<string>("")
  const [updateCounter, setUpdateCounter] = useState(0) // Contador para forzar actualizaciones
  const initialLoadDone = useRef(false)

  // Función para actualizar la lista de assets cuando se añade uno nuevo
  const handleAssetAdded = useCallback(() => {
    console.log("Asset añadido, forzando actualización de la lista...")
    setUpdateCounter(prev => prev + 1)
    
    // La actualización real se hace en el useEffect que observa updateCounter
  }, [])

  // Obtener los assets y el nombre del intercambio del exchange actual
  useEffect(() => {
    console.log("Actualizando lista de assets desde portfolioWithPrices...", { 
      isLoading, 
      portfolioCount: portfolioWithPrices?.length,
      exchangeId
    })
    
    if (!isLoading && portfolioWithPrices) {
      const exchange = portfolioWithPrices.find(e => e.id === exchangeId)
      if (exchange) {
        console.log("Exchange encontrado:", exchange.name, "con", exchange.assets.length, "assets")
        setAssets(exchange.assets)
        setExchangeName(exchange.name)
        initialLoadDone.current = true
      } else {
        console.log("No se encontró el exchange con ID:", exchangeId)
      }
    }
  }, [exchangeId, portfolioWithPrices, isLoading, updateCounter])

  // Forzar actualización cuando se incrementa el contador
  useEffect(() => {
    if (updateCounter > 0 && initialLoadDone.current) {
      console.log("Forzando actualización por cambio en updateCounter:", updateCounter)
      refreshData().catch(error => {
        console.error("Error al refrescar datos después de actualización:", error)
      })
    }
  }, [updateCounter, refreshData])

  // Función para refrescar los datos manualmente
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    console.log("Refrescando datos manualmente...")
    try {
      await refreshData()
      setUpdateCounter(prev => prev + 1) // Forzar actualización de UI
      toast({
        title: "Data refreshed",
        description: "Asset list has been updated with latest data."
      })
    } catch (error) {
      console.error("Error refreshing assets:", error)
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Could not refresh asset data. Please try again."
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshData])

  const handleDeleteAsset = async (assetId: string) => {
    setIsDeleting(true)
    try {
      await deleteAsset(assetId)
      
      // Actualizar la lista local de assets inmediatamente
      setAssets(current => current.filter(asset => asset.id !== assetId))
      
      setIsDeleteDialogOpen(false)
      toast({
        title: "Asset deleted",
        description: "The asset has been deleted successfully."
      })
      
      // Incrementar contador para forzar actualización
      setUpdateCounter(prev => prev + 1)
      
      // Refrescar datos completos para asegurar consistencia
      await refreshData()
    } catch (error) {
      console.error("Error deleting asset:", error)
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditDialog = (assetId: string) => {
    setSelectedAssetId(assetId)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (assetId: string) => {
    setSelectedAssetId(assetId)
    setIsDeleteDialogOpen(true)
  }

  // Manejar cambios en el diálogo de añadir
  const handleAddDialogChange = (open: boolean) => {
    setIsAddDialogOpen(open)
    // Si se cierra el diálogo, refrescar datos para asegurar que se muestran todos los assets
    if (!open) {
      console.log("Diálogo de añadir cerrado, refrescando datos...")
      handleRefresh()
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Assets</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : assets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-primary-foreground p-3">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2">No assets yet</CardTitle>
            <CardDescription className="mb-4">
              Start tracking your {exchangeName} portfolio by adding your first asset.
            </CardDescription>
            <Button onClick={() => setIsAddDialogOpen(true)} className="mt-2">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Card key={`${asset.id}-${updateCounter}`} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  {asset.logo_url ? (
                    <Image
                      src={asset.logo_url}
                      alt={asset.symbol}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {asset.symbol.substring(0, 2)}
                    </div>
                  )}
                  <CardTitle className="text-lg">{asset.symbol}</CardTitle>
                </div>
                <CardDescription>Current price: {formatCurrency(asset.currentPrice)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="text-sm text-muted-foreground">Value</span>
                    <span className="text-xl font-bold">{formatCurrency(asset.currentValue)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quantity</span>
                    <span>{Number(asset.quantity).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Purchase Avg</span>
                    <span>{formatCurrency(Number(asset.purchase_price_avg))}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">P/L</span>
                    <span
                      className={asset.profitLoss >= 0 ? "text-positive" : "text-negative"}
                    >
                      {formatCurrency(asset.profitLoss)} ({asset.profitLossPercentage.toFixed(2)}%)
                    </span>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(asset.id)}>
                      <Pencil className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(asset.id)}>
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {exchangeName && (
        <AddAssetDialog
          open={isAddDialogOpen}
          onOpenChange={handleAddDialogChange}
          exchangeId={exchangeId}
          exchangeName={exchangeName}
          onAssetAdded={handleAssetAdded}
        />
      )}

      {isEditDialogOpen && (
        <EditAssetDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          assetId={selectedAssetId}
          exchangeName={exchangeName}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Asset"
        description="Are you sure you want to delete this asset? This action cannot be undone."
        isLoading={isDeleting}
        onConfirm={() => handleDeleteAsset(selectedAssetId)}
      />
    </div>
  )
}



