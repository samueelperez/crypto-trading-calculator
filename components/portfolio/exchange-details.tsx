"use client"

import { useState, useEffect } from "react"
import { ArrowLeftIcon, PencilIcon } from "lucide-react"

import { usePortfolio } from "@/hooks/use-portfolio"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { EditExchangeDialog } from "@/components/portfolio/edit-exchange-dialog"
import { useRouter } from "next/navigation"
import type { Exchange } from "@/types/portfolio"

interface ExchangeDetailsProps {
  exchangeId: string
}

export function ExchangeDetails({ exchangeId }: ExchangeDetailsProps) {
  const router = useRouter()
  const { portfolioWithPrices, loadPortfolioData } = usePortfolio()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Encontrar el exchange en los datos del portfolio
  const exchange = portfolioWithPrices.find((e) => e.id === exchangeId)

  useEffect(() => {
    loadPortfolioData()
  }, [loadPortfolioData])

  if (!exchange) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Exchange not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/portfolio")}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Portfolio
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={() => router.push("/portfolio")} className="mr-4">
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{exchange.name}</h1>
        </div>
        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
          <PencilIcon className="mr-2 h-4 w-4" />
          Edit Exchange
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exchange Summary</CardTitle>
          <CardDescription>Overview of assets held at {exchange.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">{formatCurrency(exchange.totalValue)}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Assets Count</p>
              <p className="text-2xl font-bold">{exchange.assets.length}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Most Valuable Asset</p>
              {exchange.assets.length > 0 ? (
                <p className="text-2xl font-bold">
                  {exchange.assets.sort((a, b) => b.currentValue - a.currentValue)[0]?.symbol || "None"}
                </p>
              ) : (
                <p className="text-muted-foreground">No assets</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Best Performing</p>
              {exchange.assets.length > 0 ? (
                <p className="text-2xl font-bold">
                  {exchange.assets.sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)[0]?.symbol || "None"}
                </p>
              ) : (
                <p className="text-muted-foreground">No assets</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <EditExchangeDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} exchange={exchange as Exchange} />
    </>
  )
}

