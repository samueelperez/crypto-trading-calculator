"use client"

import { useState, useEffect } from "react"
import { ChevronRightIcon, PlusIcon, MoreHorizontalIcon, Trash2Icon, PencilIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePortfolio } from "@/hooks/use-portfolio"
import type { ExchangeWithAssets } from "@/types/portfolio"
import { formatCurrency } from "@/lib/utils"
import { AddAssetDialog } from "@/components/portfolio/add-asset-dialog"
import { EditExchangeDialog } from "@/components/portfolio/edit-exchange-dialog"
import { ConfirmDialog } from "@/components/portfolio/confirm-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditAssetDialog } from "./edit-asset-dialog"
import { cryptoPriceService } from "@/lib/api/crypto-price-service"

interface ExchangeCardProps {
  exchange: ExchangeWithAssets
}

export function ExchangeCard({ exchange: initialExchange }: ExchangeCardProps) {
  const router = useRouter()
  const { deleteExchange, deleteAsset, portfolioWithPrices } = usePortfolio()
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null)

  // Estado local para el exchange y sus assets
  const [exchange, setExchange] = useState<ExchangeWithAssets>(initialExchange)

  // Estado para almacenar los precios obtenidos de la API
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number | null>>({})
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)

  // Estado para el valor total recalculado del exchange
  const [recalculatedTotal, setRecalculatedTotal] = useState<number | null>(null)

  // Actualizar el estado local cuando cambia el exchange en portfolioWithPrices
  useEffect(() => {
    const updatedExchange = portfolioWithPrices.find((e) => e.id === initialExchange.id)
    if (updatedExchange) {
      console.log("Exchange updated from portfolioWithPrices:", updatedExchange)
      setExchange(updatedExchange)
    }
  }, [portfolioWithPrices, initialExchange.id])

  const hasAssets = exchange.assets.length > 0

  // Efecto para cargar los precios de las criptomonedas cuando hay assets
  useEffect(() => {
    if (!hasAssets) return

    const loadPrices = async () => {
      setIsLoadingPrices(true)

      try {
        // Get all symbols at once
        const symbols = exchange.assets.map((asset) => asset.symbol)

        // Get all prices in a single call
        const prices = await cryptoPriceService.getPrices(symbols)

        // Process the results
        const priceMap: Record<string, number | null> = {}
        let newTotalValue = 0

        for (const asset of exchange.assets) {
          const price = prices[asset.symbol]?.current_price || null
          priceMap[asset.id] = price

          if (price !== null) {
            newTotalValue += Number(asset.quantity) * price
          } else {
            newTotalValue += asset.currentValue
          }
        }

        setCryptoPrices(priceMap)
        setRecalculatedTotal(newTotalValue > 0 ? newTotalValue : null)
      } catch (error) {
        console.error("Error loading prices:", error)
        // Keep using existing values
      } finally {
        setIsLoadingPrices(false)
      }
    }

    loadPrices()
  }, [exchange.assets, hasAssets])

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      await deleteExchange(exchange.id)
      setIsDeleted(true) // Marcar como eliminado para ocultar la tarjeta
      toast({
        title: "Exchange eliminado",
        description: `${exchange.name} ha sido eliminado correctamente.`,
      })
    } catch (error) {
      console.error("Error deleting exchange:", error)
      toast({
        title: "Error al eliminar",
        description: error instanceof Error ? error.message : "No se pudo eliminar el exchange",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleEditAsset = (assetId: string) => {
    setEditingAssetId(assetId)
  }

  const handleDeleteAsset = async (assetId: string) => {
    try {
      setIsLoading(true)

      // Eliminar el asset de la base de datos
      await deleteAsset(assetId)

      // Actualizar el estado local inmediatamente para una respuesta visual rápida
      const updatedAssets = exchange.assets.filter((asset) => asset.id !== assetId)

      // Recalcular el valor total del exchange
      const newTotalValue = updatedAssets.reduce((sum, asset) => sum + asset.currentValue, 0)

      // Actualizar el estado local del exchange
      setExchange({
        ...exchange,
        assets: updatedAssets,
        totalValue: newTotalValue,
      })

      // Actualizar también los precios y el valor recalculado
      setCryptoPrices((prevPrices) => {
        const newPrices = { ...prevPrices }
        delete newPrices[assetId]
        return newPrices
      })

      // Recalcular el total con los precios actualizados
      const newRecalculatedTotal = updatedAssets.reduce((sum, asset) => {
        const price = cryptoPrices[asset.id]
        if (price !== null && price !== undefined) {
          return sum + Number(asset.quantity) * price
        }
        return sum + asset.currentValue
      }, 0)

      setRecalculatedTotal(newRecalculatedTotal > 0 ? newRecalculatedTotal : null)

      toast({
        title: "Asset eliminado",
        description: "El activo ha sido eliminado correctamente.",
      })
    } catch (error) {
      console.error("Error deleting asset:", error)
      toast({
        title: "Error al eliminar",
        description: error instanceof Error ? error.message : "No se pudo eliminar el activo",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setDeletingAssetId(null)
    }
  }

  const handleViewDetails = () => {
    router.push(`/portfolio/exchanges/${exchange.id}`)
  }

  // Si el exchange ha sido eliminado, no renderizar nada
  if (isDeleted) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{exchange.name}</CardTitle>
              <CardDescription>{hasAssets ? `${exchange.assets.length} assets` : "No assets added"}</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontalIcon className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2Icon className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <span className="font-medium">
                {recalculatedTotal !== null ? formatCurrency(recalculatedTotal) : formatCurrency(exchange.totalValue)}
                {recalculatedTotal !== null && recalculatedTotal !== exchange.totalValue && (
                  <span className="text-xs ml-1 text-muted-foreground">(actualizado)</span>
                )}
              </span>
            </div>

            {hasAssets && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium">Top Assets</h4>
                <div className="space-y-2">
                  {exchange.assets
                    .sort((a, b) => b.currentValue - a.currentValue)
                    .slice(0, 3)
                    .map((asset) => (
                      <div key={asset.id} className="flex justify-between items-center group">
                        <div className="flex items-center">
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarImage
                              src={asset.logo_url || undefined}
                              alt={asset.symbol}
                              onError={(e) => {
                                // Use a generic avatar instead of trying to load from external sources
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${asset.symbol}&background=random&color=fff&size=128&bold=true`
                              }}
                            />
                            <AvatarFallback>{asset.symbol.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{asset.symbol}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">
                            {isLoadingPrices
                              ? "Cargando valor..."
                              : cryptoPrices[asset.id]
                                ? formatCurrency(Number(asset.quantity) * cryptoPrices[asset.id]!)
                                : asset.currentValue > 0
                                  ? formatCurrency(asset.currentValue)
                                  : "Valor no disponible"}
                          </span>
                          <div className="flex transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEditAsset(asset.id)}
                            >
                              <PencilIcon className="h-3 w-3" />
                              <span className="sr-only">Edit {asset.symbol}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => setDeletingAssetId(asset.id)}
                            >
                              <Trash2Icon className="h-3 w-3" />
                              <span className="sr-only">Delete {asset.symbol}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm" onClick={() => setIsAddAssetDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Asset
          </Button>

          <Button variant="ghost" size="sm" onClick={handleViewDetails}>
            View All
            <ChevronRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <AddAssetDialog
        open={isAddAssetDialogOpen}
        onOpenChange={(open) => {
          setIsAddAssetDialogOpen(open)
          // Si se cierra el diálogo, actualizar los precios para reflejar los cambios
          if (!open) {
            const loadPrices = async () => {
              if (exchange.assets.length > 0) {
                setIsLoadingPrices(true)
                try {
                  const symbols = exchange.assets.map((asset) => asset.symbol)
                  const prices = await cryptoPriceService.getPrices(symbols)

                  const priceMap: Record<string, number | null> = {}
                  let newTotalValue = 0

                  for (const asset of exchange.assets) {
                    const price = prices[asset.symbol]?.current_price || null
                    priceMap[asset.id] = price

                    if (price !== null) {
                      newTotalValue += Number(asset.quantity) * price
                    } else {
                      newTotalValue += asset.currentValue
                    }
                  }

                  setCryptoPrices(priceMap)
                  setRecalculatedTotal(newTotalValue > 0 ? newTotalValue : null)
                } catch (error) {
                  console.error("Error loading prices:", error)
                } finally {
                  setIsLoadingPrices(false)
                }
              }
            }

            loadPrices()
          }
        }}
        exchangeId={exchange.id}
        exchangeName={exchange.name}
      />

      <EditExchangeDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} exchange={exchange} />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Exchange"
        description={`Are you sure you want to delete ${exchange.name}? This will also delete all assets associated with this exchange.`}
        isLoading={isLoading}
        onConfirm={handleDelete}
      />

      {editingAssetId && (
        <EditAssetDialog
          open={!!editingAssetId}
          onOpenChange={(open) => {
            if (!open) setEditingAssetId(null)
          }}
          assetId={editingAssetId}
          exchangeName={exchange.name}
        />
      )}

      {deletingAssetId && (
        <ConfirmDialog
          open={!!deletingAssetId}
          onOpenChange={(open) => {
            if (!open) setDeletingAssetId(null)
          }}
          title="Delete Asset"
          description="Are you sure you want to delete this asset? This action cannot be undone."
          isLoading={isLoading}
          onConfirm={() => handleDeleteAsset(deletingAssetId)}
        />
      )}
    </>
  )
}

