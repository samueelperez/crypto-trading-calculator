"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

// Sample data for profit over time - in a real app, this would come from an API
const sampleData = [
  { date: "2023-01-01", profit: -500 },
  { date: "2023-02-01", profit: 300 },
  { date: "2023-03-01", profit: 1200 },
  { date: "2023-04-01", profit: 800 },
  { date: "2023-05-01", profit: 1500 },
  { date: "2023-06-01", profit: 2200 },
  { date: "2023-07-01", profit: 1800 },
  { date: "2023-08-01", profit: 2500 },
  { date: "2023-09-01", profit: 3200 },
  { date: "2023-10-01", profit: 2800 },
  { date: "2023-11-01", profit: 3500 },
  { date: "2023-12-01", profit: 4200 },
]

export function PriceChart() {
  const [data, setData] = useState(sampleData)
  const [initialCapital, setInitialCapital] = useState<number | null>(null)

  useEffect(() => {
    // Cargar el capital inicial desde localStorage
    const savedCapital = localStorage.getItem("initialCapital")
    if (savedCapital) {
      const capital = Number.parseFloat(savedCapital)
      setInitialCapital(capital)

      // Recalcular los datos de profit basados en el capital inicial
      const newData = sampleData.map((item) => {
        // En un caso real, aquí calcularías el profit basado en el capital inicial
        // y los datos reales de tu portfolio
        return {
          ...item,
          // Ajustamos el profit para que sea relativo al capital inicial
          profit: item.profit,
          // Añadimos el valor total (capital inicial + profit)
          total: capital + item.profit,
        }
      })
      setData(newData)
    }
  }, [])

  // Definir la configuración del gráfico solo con total
  const chartConfig = {
    total: {
      label: "Total Value",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <ChartContainer config={chartConfig} className="h-full w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString("en-US", { month: "short" })
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            domain={["auto", "auto"]} // Permite valores negativos y positivos
          />
          <Tooltip content={<ChartTooltipContent />} />
          {initialCapital !== null && (
            <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={2} dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

