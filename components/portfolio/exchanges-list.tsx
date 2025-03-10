"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { PlusIcon, RefreshCcwIcon, AlertCircle } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePortfolio } from "@/hooks/use-portfolio"
import { ExchangeCard } from "@/components/portfolio/exchange-card"
import { AddExchangeDialog } from "@/components/portfolio/add-exchange-dialog"
import { toast } from "@/components/ui/use-toast"
import { eventBus, EVENTS } from "@/lib/event-bus"
import { Skeleton } from "@/components/ui/skeleton"

export function ExchangesList() {
  const { portfolioWithPrices, isLoading, error, refreshData } = usePortfolio()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [lastDialogClose, setLastDialogClose] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updateCounter, setUpdateCounter] = useState(0)
  const [localPortfolio, setLocalPortfolio] = useState(portfolioWithPrices)
  const lastUpdateTime = useRef(Date.now())
  const dataFetched = useRef(false)

  // Actualizar el estado local cuando cambie el estado global
  useEffect(() => {
    console.log("ExchangesList: portfolioWithPrices updated, items:", portfolioWithPrices.length)
    if (portfolioWithPrices.length > 0) {
      dataFetched.current = true;
    }
    setLocalPortfolio(portfolioWithPrices)
  }, [portfolioWithPrices])

  // Forzar actualización inicial si es necesario
  useEffect(() => {
    if (!dataFetched.current && !isLoading) {
      console.log("ExchangesList: No data loaded initially, forcing refresh")
      refreshData().catch(err => {
        console.error("Error during initial data refresh:", err)
      })
    }
  }, [isLoading, refreshData])

  // Suscribirse a eventos de cambios en el portfolio
  useEffect(() => {
    console.log("ExchangesList: Setting up event listeners")
    
    // Cuando se añade un asset, forzar actualización
    const assetAddedUnsubscribe = eventBus.subscribe(EVENTS.ASSET_ADDED, (newAsset, exchangeId) => {
      console.log("ExchangesList: Asset added event received", newAsset)
      setUpdateCounter(prev => prev + 1)
      toast({
        title: "Asset Added",
        description: `${newAsset.symbol} was added successfully.`,
      })
    })
    
    // Cuando se actualiza un asset, forzar actualización
    const assetUpdatedUnsubscribe = eventBus.subscribe(EVENTS.ASSET_UPDATED, (data) => {
      console.log("ExchangesList: Asset updated event received", data.asset.symbol)
      
      // Actualizar estado local si tenemos datos de portfolio actualizados
      if (data.portfolioData && data.portfolioData.length > 0) {
        setLocalPortfolio(data.portfolioData)
      }
      
      // Incrementar contador para forzar actualización de componentes
      setUpdateCounter(prev => prev + 1)
      
      toast({
        title: "Asset Updated",
        description: `${data.asset.symbol} was updated successfully.`,
      })
    })
    
    // Cuando se refresca el portfolio, actualizar el estado local
    const portfolioRefreshedUnsubscribe = eventBus.subscribe(EVENTS.PORTFOLIO_REFRESHED, (data) => {
      console.log("ExchangesList: Portfolio refreshed event received", data.length)
      if (data && data.length > 0) {
        setLocalPortfolio(data)
      }
    })
    
    // Limpiar suscripciones al desmontar
    return () => {
      assetAddedUnsubscribe()
      assetUpdatedUnsubscribe() 
      portfolioRefreshedUnsubscribe()
    }
  }, [])

  // Manejar actualización forzada
  useEffect(() => {
    if (updateCounter > 0) {
      const now = Date.now();
      // Solo permitir actualizaciones cada 1 segundo para evitar demasiadas llamadas
      if (now - lastUpdateTime.current > 1000) {
        console.log("Exchange List - Forcing refresh due to update counter:", updateCounter);
        lastUpdateTime.current = now;
        refreshData().catch(error => {
          console.error("Error refreshing exchanges:", error);
        });
      }
    }
  }, [updateCounter, refreshData]);

  // Función para forzar actualización manualmente
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    console.log("Exchange List - Manual refresh triggered");
    try {
      await refreshData();
      setUpdateCounter(prev => prev + 1);
      toast({
        title: "Data refreshed",
        description: "Portfolio data has been updated successfully."
      });
    } catch (error) {
      console.error("Error refreshing portfolio data:", error);
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Could not refresh portfolio data. Please try again."
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

  const handleAddExchangeDialogClose = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      // Registrar el momento en que se cerró el diálogo
      setLastDialogClose(Date.now());
      // Forzar actualización cuando se cierra el diálogo
      console.log("Exchange List - Add exchange dialog closed, refreshing data...");
      handleRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Exchanges</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing || isLoading}
          >
            <RefreshCcwIcon className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Exchange
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <p className="text-muted-foreground">Loading exchanges...</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                  <Skeleton className="h-12 w-full mb-3" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-8 w-full" />
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Error al cargar exchanges</h3>
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCcwIcon className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>

            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>

            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Exchange
            </Button>
          </CardContent>
        </Card>
      ) : localPortfolio.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium mb-2">No Exchanges Added</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first exchange to start tracking your portfolio.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Exchange
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {localPortfolio.map((exchange) => (
            <ExchangeCard 
              key={`${exchange.id}-${updateCounter}-${lastDialogClose}`} 
              exchange={exchange} 
            />
          ))}
        </div>
      )}

      <AddExchangeDialog open={isAddDialogOpen} onOpenChange={handleAddExchangeDialogClose} />
    </div>
  )
}

