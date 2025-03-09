"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function RiskRewardCalculator() {
  const [entryPrice, setEntryPrice] = useState<string>("42000")
  const [stopLossPrice, setStopLossPrice] = useState<string>("41000")
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>("45000")
  const [riskRewardRatio, setRiskRewardRatio] = useState<string>("")
  const [potentialProfit, setPotentialProfit] = useState<string>("")
  const [potentialLoss, setPotentialLoss] = useState<string>("")

  const calculateRiskReward = () => {
    const entry = Number.parseFloat(entryPrice)
    const stopLoss = Number.parseFloat(stopLossPrice)
    const takeProfit = Number.parseFloat(takeProfitPrice)

    if (isNaN(entry) || isNaN(stopLoss) || isNaN(takeProfit)) {
      setRiskRewardRatio("Invalid input")
      setPotentialProfit("Invalid input")
      setPotentialLoss("Invalid input")
      return
    }

    const risk = Math.abs(entry - stopLoss)
    const reward = Math.abs(takeProfit - entry)
    const ratio = reward / risk

    setRiskRewardRatio(ratio.toFixed(2))
    setPotentialProfit(`$${reward.toFixed(2)}`)
    setPotentialLoss(`$${risk.toFixed(2)}`)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="entry-price">Entry Price ($)</Label>
          <Input id="entry-price" type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stop-loss-price">Stop Loss Price ($)</Label>
          <Input
            id="stop-loss-price"
            type="number"
            value={stopLossPrice}
            onChange={(e) => setStopLossPrice(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="take-profit-price">Take Profit Price ($)</Label>
          <Input
            id="take-profit-price"
            type="number"
            value={takeProfitPrice}
            onChange={(e) => setTakeProfitPrice(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={calculateRiskReward} className="w-full">
        Calculate
      </Button>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Risk/Reward Ratio</Label>
          <div className="rounded-md border border-input bg-background px-3 py-2">{riskRewardRatio || "—"}</div>
        </div>
        <div className="space-y-2">
          <Label>Potential Profit</Label>
          <div className="rounded-md border border-input bg-background px-3 py-2 text-positive">
            {potentialProfit || "—"}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Potential Loss</Label>
          <div className="rounded-md border border-input bg-background px-3 py-2 text-negative">
            {potentialLoss || "—"}
          </div>
        </div>
      </div>
    </div>
  )
}

