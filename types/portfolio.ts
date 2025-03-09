import type { Database } from "./supabase"

// Tipos básicos de Supabase
export type Exchange = Database["public"]["Tables"]["exchanges"]["Row"]
export type Asset = Database["public"]["Tables"]["assets"]["Row"]

// Tipos extendidos con propiedades calculadas
export interface ExchangeWithAssets extends Exchange {
  assets: AssetWithValue[]
  totalValue: number
}

export interface AssetWithValue extends Asset {
  currentPrice: number
  currentValue: number
  profitLoss: number
  profitLossPercentage: number
  lastUpdated: Date
  logo_url?: string // Añadimos logo_url como propiedad en memoria, no en la base de datos
}

export interface PortfolioSummary {
  totalValue: number
  totalInvestment: number
  totalProfitLoss: number
  profitLossPercentage: number
  lastUpdated: Date
  distribution: {
    byExchange: {
      exchangeId: string
      exchangeName: string
      value: number
      percentage: number
    }[]
    byAsset: {
      symbol: string
      value: number
      percentage: number
    }[]
  }
}

export interface CryptoPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  last_updated: string
}

