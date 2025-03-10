import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { PageProps } from 'next'

import { ExchangeDetails } from "@/components/portfolio/exchange-details"
import { AssetsList } from "@/components/portfolio/assets-list"
import { ExchangeDetailsSkeleton } from "@/components/portfolio/exchange-details-skeleton"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Definir el tipo de parámetros correctamente para Next.js 15
export default async function ExchangeDetailsPage({ params }: { params: { id: string } }) {
  // Verificar si tenemos un ID válido
  if (!params.id) {
    notFound()
  }

  try {
    const supabase = createServerSupabaseClient()

    // Verificar si el exchange existe
    const { data: exchange, error } = await supabase.from("exchanges").select("*").eq("id", params.id).single()

    if (error || !exchange) {
      console.error("Error fetching exchange:", error)
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
  } catch (error) {
    console.error("Error in ExchangeDetailsPage:", error)
    notFound()
  }
}

