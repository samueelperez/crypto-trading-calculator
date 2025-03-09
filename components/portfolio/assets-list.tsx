"use client"

import { useState } from "react"
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePortfolio } from "@/hooks/use-portfolio"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { AddAssetDialog } from "@/components/portfolio/add-asset-dialog"
import { EditAssetDialog } from "@/components/portfolio/edit-asset-dialog"
import { ConfirmDialog } from "@/components/portfolio/confirm-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AssetsListProps {
  exchangeId: string
}

export function AssetsList({ exchangeId }: AssetsListProps) {
  const { portfolioWithPrices, deleteAsset } = usePortfolio()
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<string | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Encontrar el exchange en los datos del portfolio
  const exchange = portfolioWithPrices.find((e) => e.id === exchangeId)

  if (!exchange) {
    return <p className="text-muted-foreground">Exchange not found</p>
  }

  const handleDeleteAsset = async (assetId: string) => {
    try {
      setIsLoading(true)
      await deleteAsset(assetId)
    } catch (error) {
      console.error("Error deleting asset:", error)
    } finally {
      setIsLoading(false)
      setDeletingAsset(null)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Assets</h2>
          <Button onClick={() => setIsAddAssetDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>

        {exchange.assets.length === 0 ? (
          <Card className="bg-muted/50">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium mb-2">No Assets Added</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first asset to start tracking your portfolio.
              </p>
              <Button onClick={() => setIsAddAssetDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Asset List</CardTitle>
              <CardDescription>Assets held at {exchange.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Avg. Price</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>P/L</TableHead>
                    <TableHead>P/L %</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exchange.assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage
                              src={asset.logo_url || undefined}
                              alt={asset.symbol}
                              onError={(e) => {
                                console.log(`Error loading image for ${asset.symbol}:`, e)
                                // Intentar con un repositorio común de iconos de criptomonedas
                                e.currentTarget.src = `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${asset.symbol.toLowerCase()}.png`
                              }}
                            />
                            <AvatarFallback>{asset.symbol.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{asset.symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell>{Number(asset.quantity).toFixed(8)}</TableCell>
                      <TableCell>{formatCurrency(Number(asset.purchase_price_avg))}</TableCell>
                      <TableCell>{formatCurrency(asset.currentPrice)}</TableCell>
                      <TableCell>{formatCurrency(asset.currentValue)}</TableCell>
                      <TableCell className={cn(asset.profitLoss >= 0 ? "text-positive" : "text-negative")}>
                        <div className="flex items-center">
                          {asset.profitLoss >= 0 ? (
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                          ) : (
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                          )}
                          {formatCurrency(Math.abs(asset.profitLoss))}
                        </div>
                      </TableCell>
                      <TableCell className={cn(asset.profitLossPercentage >= 0 ? "text-positive" : "text-negative")}>
                        <div className="flex items-center">
                          {asset.profitLossPercentage >= 0 ? (
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                          ) : (
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                          )}
                          {Math.abs(asset.profitLossPercentage).toFixed(2)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontalIcon className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingAsset(asset.id)}>
                              <PencilIcon className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeletingAsset(asset.id)}
                            >
                              <Trash2Icon className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <AddAssetDialog
        open={isAddAssetDialogOpen}
        onOpenChange={setIsAddAssetDialogOpen}
        exchangeId={exchangeId}
        exchangeName={exchange.name}
      />

      {editingAsset && (
        <EditAssetDialog
          open={!!editingAsset}
          onOpenChange={(open) => {
            if (!open) setEditingAsset(null)
          }}
          assetId={editingAsset}
          exchangeName={exchange.name}
        />
      )}

      {deletingAsset && (
        <ConfirmDialog
          open={!!deletingAsset}
          onOpenChange={(open) => {
            if (!open) setDeletingAsset(null)
          }}
          title="Delete Asset"
          description="Are you sure you want to delete this asset? This action cannot be undone."
          isLoading={isLoading}
          onConfirm={() => handleDeleteAsset(deletingAsset)}
        />
      )}
    </>
  )
}

