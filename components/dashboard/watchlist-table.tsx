"use client"

import { ArrowDownIcon, ArrowUpIcon, StarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface Cryptocurrency {
  id: string
  name: string
  symbol: string
  price: string
  change24h: number
  marketCap: string
  volume24h: string
}

// Sample data - in a real app, this would come from an API
const cryptocurrencies: Cryptocurrency[] = [
  {
    id: "1",
    name: "Bitcoin",
    symbol: "BTC",
    price: "$42,567.89",
    change24h: 2.34,
    marketCap: "$824.5B",
    volume24h: "$28.5B",
  },
  {
    id: "2",
    name: "Ethereum",
    symbol: "ETH",
    price: "$2,345.67",
    change24h: -1.23,
    marketCap: "$281.2B",
    volume24h: "$15.7B",
  },
  {
    id: "3",
    name: "Binance Coin",
    symbol: "BNB",
    price: "$345.67",
    change24h: 0.78,
    marketCap: "$57.8B",
    volume24h: "$2.1B",
  },
  {
    id: "4",
    name: "Solana",
    symbol: "SOL",
    price: "$98.76",
    change24h: 5.67,
    marketCap: "$39.2B",
    volume24h: "$3.5B",
  },
  {
    id: "5",
    name: "Cardano",
    symbol: "ADA",
    price: "$0.54",
    change24h: -2.45,
    marketCap: "$18.9B",
    volume24h: "$1.2B",
  },
]

export function WatchlistTable() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>24h Change</TableHead>
            <TableHead className="hidden md:table-cell">Market Cap</TableHead>
            <TableHead className="hidden md:table-cell">Volume (24h)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cryptocurrencies.map((crypto) => (
            <TableRow key={crypto.id}>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <StarIcon className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell>
                <div className="font-medium">{crypto.name}</div>
                <div className="text-xs text-muted-foreground">{crypto.symbol}</div>
              </TableCell>
              <TableCell>{crypto.price}</TableCell>
              <TableCell>
                <div className={cn("flex items-center", crypto.change24h > 0 ? "text-positive" : "text-negative")}>
                  {crypto.change24h > 0 ? (
                    <ArrowUpIcon className="mr-1 h-4 w-4" />
                  ) : (
                    <ArrowDownIcon className="mr-1 h-4 w-4" />
                  )}
                  {crypto.change24h > 0 ? "+" : ""}
                  {crypto.change24h}%
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{crypto.marketCap}</TableCell>
              <TableCell className="hidden md:table-cell">{crypto.volume24h}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

