"use client"

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface Trade {
  id: string
  pair: string
  type: "buy" | "sell"
  amount: string
  price: string
  date: string
}

// Sample data - in a real app, this would come from Supabase
const recentTrades: Trade[] = [
  {
    id: "1",
    pair: "BTC/USD",
    type: "buy",
    amount: "0.25",
    price: "$42,567.89",
    date: "2023-12-15",
  },
  {
    id: "2",
    pair: "ETH/USD",
    type: "sell",
    amount: "2.5",
    price: "$2,345.67",
    date: "2023-12-14",
  },
  {
    id: "3",
    pair: "BTC/USD",
    type: "buy",
    amount: "0.15",
    price: "$41,234.56",
    date: "2023-12-12",
  },
]

export function RecentTrades() {
  return (
    <div className="space-y-4">
      {recentTrades.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No recent trades found</p>
      ) : (
        <div className="space-y-2">
          {recentTrades.map((trade) => (
            <div key={trade.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">{trade.pair}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className={cn("flex items-center", trade.type === "buy" ? "text-positive" : "text-negative")}>
                    {trade.type === "buy" ? (
                      <ArrowUpIcon className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowDownIcon className="mr-1 h-3 w-3" />
                    )}
                    {trade.type.toUpperCase()}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{trade.date}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{trade.price}</p>
                <p className="text-xs text-muted-foreground">{trade.amount}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

