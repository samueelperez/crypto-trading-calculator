"use client"

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MarketStat {
  name: string
  value: string
  change: number
  trend: "up" | "down" | "neutral"
}

const marketStats: MarketStat[] = [
  {
    name: "Bitcoin",
    value: "$42,567.89",
    change: 2.34,
    trend: "up",
  },
  {
    name: "Ethereum",
    value: "$2,345.67",
    change: -1.23,
    trend: "down",
  },
  {
    name: "Market Cap",
    value: "$1.89T",
    change: 0.78,
    trend: "up",
  },
  {
    name: "24h Volume",
    value: "$78.5B",
    change: 5.67,
    trend: "up",
  },
]

export function CryptoMarketOverview() {
  return (
    <>
      {marketStats.map((stat) => (
        <Card key={stat.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p
              className={cn(
                "flex items-center text-xs",
                stat.trend === "up" && "text-positive",
                stat.trend === "down" && "text-negative",
              )}
            >
              {stat.trend === "up" ? (
                <ArrowUpIcon className="mr-1 h-4 w-4" />
              ) : stat.trend === "down" ? (
                <ArrowDownIcon className="mr-1 h-4 w-4" />
              ) : null}
              {stat.change > 0 ? "+" : ""}
              {stat.change}%
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  )
}

