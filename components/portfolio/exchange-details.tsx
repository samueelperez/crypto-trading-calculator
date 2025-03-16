"use client"

import { useState, useEffect } from "react"
import { ArrowLeftIcon, PencilIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLinkIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

import { usePortfolio } from "@/hooks/use-portfolio"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { EditExchangeDialog } from "@/components/portfolio/edit-exchange-dialog"
import { useRouter } from "next/navigation"
import type { Exchange } from "@/types/portfolio"

interface Exchange {
  id: string
  name: string
  logo_url?: string
  created_at?: string
}

interface ExchangeDetailsProps {
  exchangeId: string
}

export function ExchangeDetails({ exchangeId }: ExchangeDetailsProps) {
  const router = useRouter()
  const { portfolioWithPrices, loadPortfolioData } = usePortfolio()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [exchange, setExchange] = useState<Exchange | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Encontrar el exchange en los datos del portfolio
  const portfolioExchange = portfolioWithPrices.find((e) => e.id === exchangeId)

  useEffect(() => {
    const fetchExchange = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('exchanges')
          .select('*')
          .eq('id', exchangeId)
          .single()

        if (error) {
          throw error
        }

        setExchange(data)
      } catch (err) {
        console.error('Error loading exchange details:', err)
        setError('No se pudo cargar los detalles del exchange')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExchange()
  }, [exchangeId])

  if (isLoading) {
    return <ExchangeDetailsSkeleton />
  }

  if (error || !exchange) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'No se encontró el exchange'}</p>
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
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {exchange.logo_url ? (
              <div className="relative h-8 w-8 overflow-hidden rounded-full">
                <Image 
                  src={exchange.logo_url} 
                  alt={exchange.name} 
                  width={32}
                  height={32}
                  className="object-contain" 
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-semibold">{exchange.name.charAt(0)}</span>
              </div>
            )}
            <CardTitle className="text-xl">{exchange.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-medium">{exchange.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Creado:</span>
              <span className="font-medium">
                {exchange.created_at 
                  ? new Date(exchange.created_at).toLocaleDateString() 
                  : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

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

export function ExchangeDetailsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

