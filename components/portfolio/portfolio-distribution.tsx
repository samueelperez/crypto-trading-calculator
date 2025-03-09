"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePortfolio } from "@/hooks/use-portfolio"
import { formatCurrency } from "@/lib/utils"

interface PortfolioDistributionProps {
  type: "exchange" | "asset"
}

export function PortfolioDistribution({ type }: PortfolioDistributionProps) {
  const { summary, isLoading } = usePortfolio()

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
  ]

  const data =
    type === "exchange"
      ? summary?.distribution.byExchange.map((item) => ({
          name: item.exchangeName,
          value: item.value,
          percentage: item.percentage,
        }))
      : summary?.distribution.byAsset.map((item) => ({
          name: item.symbol,
          value: item.value,
          percentage: item.percentage,
        }))

  // Si no hay datos o el portfolio está vacío
  const hasData = data && data.length > 0 && data.some((item) => item.value > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{type === "exchange" ? "Exchange Distribution" : "Asset Distribution"}</CardTitle>
        <CardDescription>
          {type === "exchange" ? "Portfolio distribution across exchanges" : "Portfolio distribution by cryptocurrency"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <p className="text-muted-foreground">Loading distribution data...</p>
          </div>
        ) : !hasData ? (
          <div className="flex justify-center items-center h-[300px]">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                  labelLine={false}
                >
                  {data?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

