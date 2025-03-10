import { Suspense } from "react"
import Link from "next/link"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

import { CryptoMarketOverview } from "@/components/dashboard/crypto-market-overview"
import { PriceChart } from "@/components/dashboard/price-chart"
import { RecentTrades } from "@/components/dashboard/recent-trades"
import { WatchlistTable } from "@/components/dashboard/watchlist-table"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Suspense fallback={<DashboardSkeleton />}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <CryptoMarketOverview />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-5 flex flex-col h-full">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Profit Chart</CardTitle>
                    <CardDescription>Portfolio profit over time</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/initial-capital">
                      <Settings className="mr-2 h-4 w-4" />
                      Set Initial Capital
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 p-0 pb-2">
                  <PriceChart />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Trades</CardTitle>
                  <CardDescription>Your latest trading activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentTrades />
                </CardContent>
              </Card>
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="watchlist">
          <Card>
            <CardHeader>
              <CardTitle>Watchlist</CardTitle>
              <CardDescription>Track your favorite cryptocurrencies</CardDescription>
            </CardHeader>
            <CardContent>
              <WatchlistTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>Your complete trading history</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Detailed trade history will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

