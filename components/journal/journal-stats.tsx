"use client"

import { useEffect, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getJournalStats } from "@/lib/journal-service"

export function JournalStats() {
  const [stats, setStats] = useState<{
    totalTrades: number
    winningTrades: number
    losingTrades: number
    winRate: number
    averageProfit: number
    averageLoss: number
    profitLossRatio: number
    totalProfitLoss: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      try {
        const journalStats = await getJournalStats()
        setStats(journalStats)
      } catch (error) {
        console.error("Error al cargar estadísticas:", error)
        setStats(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-36 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats || stats.totalTrades === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No hay operaciones cerradas para mostrar estadísticas.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.winRate.toFixed(2)}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.winningTrades} ganadas / {stats.losingTrades} perdidas
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.profitLossRatio.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Ratio ganancia/pérdida
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resultado Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            stats.totalProfitLoss > 0 
              ? "text-emerald-600 dark:text-emerald-500" 
              : stats.totalProfitLoss < 0 
                ? "text-red-600 dark:text-red-500" 
                : ""
          }`}>
            {stats.totalProfitLoss > 0 ? "+" : ""}
            {stats.totalProfitLoss.toFixed(2)} USDT
          </div>
          <p className="text-xs text-muted-foreground">
            De {stats.totalTrades} operaciones
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promedio por Operación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <ArrowUpIcon className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
              +{stats.averageProfit.toFixed(2)} USDT
            </span>
          </div>
          <div className="flex items-center mt-1">
            <ArrowDownIcon className="mr-2 h-4 w-4 text-red-600 dark:text-red-500" />
            <span className="text-sm font-medium text-red-600 dark:text-red-500">
              -{stats.averageLoss.toFixed(2)} USDT
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

