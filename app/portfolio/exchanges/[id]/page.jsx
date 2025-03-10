import { Suspense } from "react"
import { notFound } from "next/navigation"

import { ExchangeDetails } from "@/components/portfolio/exchange-details"
import { AssetsList } from "@/components/portfolio/assets-list"
import { ExchangeDetailsSkeleton } from "@/components/portfolio/exchange-details-skeleton"
import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * Exchange details page component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.params - URL parameters
 * @param {string} props.params.id - Exchange ID from URL
 */
export default async function ExchangeDetailsPage(props) {
  // Extract the exchange ID from params
  const { id } = props.params;
  
  const supabase = createServerSupabaseClient()

  // Verify if the exchange exists
  const { data: exchange, error } = await supabase
    .from("exchanges")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !exchange) {
    console.error("Error fetching exchange:", error)
    notFound()
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<ExchangeDetailsSkeleton />}>
        <ExchangeDetails exchangeId={id} />
        <AssetsList exchangeId={id} />
      </Suspense>
    </div>
  )
} 