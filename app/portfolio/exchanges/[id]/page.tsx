import { Suspense } from "react"
import { notFound } from "next/navigation"

import { ExchangeDetails } from "@/components/portfolio/exchange-details"
import { AssetsList } from "@/components/portfolio/assets-list"
import { ExchangeDetailsSkeleton } from "@/components/portfolio/exchange-details-skeleton"
import { createServerSupabaseClient } from "@/lib/supabase/server"

interface ExchangeDetailsPageProps {
  params: {
    id: string
  }
}

export default async function ExchangeDetailsPage({ params }: ExchangeDetailsPageProps) {
  const supabase = createServerSupabaseClient()

  // Verificar si el exchange existe
  const { data: exchange, error } = await supabase.from("exchanges").select("*").eq("id", params.id).single()

  if (error || !exchange) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<ExchangeDetailsSkeleton />}>
        <ExchangeDetails exchangeId={params.id} />
        <AssetsList exchangeId={params.id} />
      </Suspense>
    </div>
  )
}

