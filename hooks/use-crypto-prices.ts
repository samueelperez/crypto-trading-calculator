"use client"

import { useEffect, useState } from "react"
import { getCryptoPrices, type CryptoPrice } from "@/lib/api/crypto-api"

export function useCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrice[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true)
        const data = await getCryptoPrices()
        setPrices(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch crypto prices"))
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()

    // In a real app, you would set up a polling interval to refresh prices
    const interval = setInterval(fetchPrices, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [])

  return { prices, loading, error }
}

