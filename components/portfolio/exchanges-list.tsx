"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { RefreshCcwIcon, AlertCircle } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePortfolio } from "@/hooks/use-portfolio"
import { ExchangeCard } from "@/components/portfolio/exchange-card"
import { AddExchangeDialog } from "@/components/portfolio/add-exchange-dialog"

export function ExchangesList() {
  const { portfolioWithPrices, isLoading, error, refreshData } = usePortfolio()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [lastDialogClose, setLastDialogClose] = useState(0)

  const handleAddExchangeDialogClose = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      // Registrar el momento en que se cerró el diálogo
      setLastDialogClose(Date.now())
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Exchanges</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Exchange
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading exchanges...</p>
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
      ) : portfolioWithPrices.length === 0 ? (
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
          {portfolioWithPrices.map((exchange) => (
            <ExchangeCard key={exchange.id} exchange={exchange} />
          ))}
        </div>
      )}

      <AddExchangeDialog open={isAddDialogOpen} onOpenChange={handleAddExchangeDialogClose} />
    </div>
  )
}

