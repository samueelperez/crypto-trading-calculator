"use client"

import { ArrowDownIcon, ArrowUpIcon, MoreHorizontalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface JournalEntry {
  id: string
  date: string
  pair: string
  type: "buy" | "sell"
  entryPrice: string
  exitPrice: string
  result: "profit" | "loss"
  pnl: string
  notes: string
}

interface JournalEntryListProps {
  onDelete?: (id: string) => void
}

// Sample data - in a real app, this would come from Supabase
const journalEntries: JournalEntry[] = [
  {
    id: "1",
    date: "2023-12-15",
    pair: "BTC/USD",
    type: "buy",
    entryPrice: "$41,234.56",
    exitPrice: "$42,567.89",
    result: "profit",
    pnl: "+$1,333.33",
    notes: "Entered on support bounce with increasing volume. Exit at resistance.",
  },
  {
    id: "2",
    date: "2023-12-10",
    pair: "ETH/USD",
    type: "sell",
    entryPrice: "$2,456.78",
    exitPrice: "$2,345.67",
    result: "profit",
    pnl: "+$111.11",
    notes: "Short at resistance with bearish divergence. Covered at support.",
  },
  {
    id: "3",
    date: "2023-12-05",
    pair: "BTC/USD",
    type: "buy",
    entryPrice: "$42,567.89",
    exitPrice: "$41,234.56",
    result: "loss",
    pnl: "-$1,333.33",
    notes: "Entered too early before confirmation. Stop loss hit on sudden drop.",
  },
]

export function JournalEntryList({ onDelete }: JournalEntryListProps) {
  return (
    <div className="space-y-4">
      {journalEntries.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No journal entries found</p>
      ) : (
        <div className="space-y-4">
          {journalEntries.map((entry) => (
            <div key={entry.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={cn(
                      "flex items-center rounded-full px-2 py-1 text-xs font-medium",
                      entry.type === "buy" ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative",
                    )}
                  >
                    {entry.type === "buy" ? (
                      <ArrowUpIcon className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowDownIcon className="mr-1 h-3 w-3" />
                    )}
                    {entry.type.toUpperCase()}
                  </div>
                  <span className="font-medium">{entry.pair}</span>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete && onDelete(entry.id)}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Entry Price</p>
                  <p className="font-medium">{entry.entryPrice}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Exit Price</p>
                  <p className="font-medium">{entry.exitPrice}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Result</p>
                  <p className={cn("font-medium", entry.result === "profit" ? "text-positive" : "text-negative")}>
                    {entry.result.charAt(0).toUpperCase() + entry.result.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">P&L</p>
                  <p className={cn("font-medium", entry.result === "profit" ? "text-positive" : "text-negative")}>
                    {entry.pnl}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm">{entry.notes}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

