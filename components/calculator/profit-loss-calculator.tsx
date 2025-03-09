"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"

export function ProfitLossCalculator() {
  const [positionType, setPositionType] = useState<string>("long")
  const [entryPrice, setEntryPrice] = useState<string>("42000")
  const [exitPrice, setExitPrice] = useState<string>("45000")
  const [positionSize, setPositionSize] = useState<string>("1000")
  const [leverage, setLeverage] = useState<string>("1")
  const [profitLoss, setProfitLoss] = useState<string>("")
  const [profitLossPercentage, setProfitLossPercentage] = useState<string>("")

  const calculateProfitLoss = () => {
    const entry = Number.parseFloat(entryPrice)
    const exit = Number.parseFloat(exitPrice)
    const size = Number.parseFloat(positionSize)
    const lev = Number.parseFloat(leverage)

    if (isNaN(entry) || isNaN(exit) || isNaN(size) || isNaN(lev)) {
      setProfitLoss("Invalid input")
      setProfitLossPercentage("Invalid input")
      return
    }

    let pl: number
    let plPercentage: number

    if (positionType === "long") {
      pl = size * ((exit - entry) / entry) * lev
      plPercentage = ((exit - entry) / entry) * 100 * lev
    } else {
      pl = size * ((entry - exit) / entry) * lev
      plPercentage = ((entry - exit) / entry) * 100 * lev
    }

    setProfitLoss(`$${pl.toFixed(2)}`)
    setProfitLossPercentage(`${plPercentage.toFixed(2)}%`)
  }

  return (
    <div className="space-y-6">
      <RadioGroup value={positionType} onValueChange={setPositionType} className="flex space-x-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="long" id="long" />
          <Label htmlFor="long">Long</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="short" id="short" />
          <Label htmlFor="short">Short</Label>
        </div>
      </RadioGroup>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="entry-price">Entry Price ($)</Label>
          <Input id="entry-price" type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exit-price">Exit Price ($)</Label>
          <Input id="exit-price" type="number" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position-size">Position Size ($)</Label>
          <Input
            id="position-size"
            type="number"
            value={positionSize}
            onChange={(e) => setPositionSize(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="leverage">Leverage (x)</Label>
          <Input id="leverage" type="number" value={leverage} onChange={(e) => setLeverage(e.target.value)} />
        </div>
      </div>

      <Button onClick={calculateProfitLoss} className="w-full">
        Calculate
      </Button>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Profit/Loss</Label>
          <div
            className={`rounded-md border border-input bg-background px-3 py-2 ${profitLoss.startsWith("$-") ? "text-negative" : "text-positive"}`}
          >
            {profitLoss || "—"}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Profit/Loss Percentage</Label>
          <div
            className={`rounded-md border border-input bg-background px-3 py-2 ${profitLossPercentage.startsWith("-") ? "text-negative" : "text-positive"}`}
          >
            {profitLossPercentage || "—"}
          </div>
        </div>
      </div>
    </div>
  )
}

