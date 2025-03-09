"use client"

import type React from "react"

import { ArrowDownIcon, ArrowUpIcon, PercentIcon, TrendingUpIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface JournalStat {
  name: string
  value: string
  change: number
  trend: "up" | "down" | "neutral"
  icon: React.ElementType
}

// Sample data - in a real app, this would be calculated from Supabase data
const journalStats: JournalStat[] = [
  {
    name: "Win Rate",
    value: "68%",
    change: 5,
    trend: "up",
    icon: PercentIcon,
  },
  {
    name: "Profit Factor",
    value: "2.3",
    change: 0.4,
    trend: "up",
    icon: TrendingUpIcon,
  },
  {
    name: "Avg. Win",
    value: "$450",
    change: 50,
    trend: "up",
    icon: ArrowUpIcon,
  },
  {
    name: "Avg. Loss",
    value: "$200",
    change: -20,
    trend: "down",
    icon: ArrowDownIcon,
  },
]

export function JournalStats() {
  return (
    <>
      {journalStats.map((stat) => (
        <Card key={stat.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
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
              {stat.change}
              {typeof stat.change === "number" && !stat.name.includes("Factor") ? "%" : ""}
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  )
}

