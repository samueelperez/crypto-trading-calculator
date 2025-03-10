import { Suspense } from "react"

import { PortfolioSummary } from "@/components/portfolio/portfolio-summary"
import { PortfolioDistribution } from "@/components/portfolio/portfolio-distribution"
import { ExchangesList } from "@/components/portfolio/exchanges-list"
import { PortfolioSkeleton } from "@/components/portfolio/portfolio-skeleton"
import { SupabaseError } from "@/components/supabase-error"

export const metadata = {
  title: "Portfolio - CryptoTrader",
  description: "Manage and track your cryptocurrency portfolio across multiple exchanges",
}

export default function PortfolioPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Portfolio</h2>
        <div>
          {/* ... existing buttons ... */}
        </div>
      </div>
      
      <SupabaseError />

      <Suspense fallback={<PortfolioSkeleton />}>
        <PortfolioSummary />

        <div className="grid gap-6 md:grid-cols-2">
          <PortfolioDistribution type="exchange" />
          <PortfolioDistribution type="asset" />
        </div>

        <ExchangesList />
      </Suspense>
    </div>
  )
}

