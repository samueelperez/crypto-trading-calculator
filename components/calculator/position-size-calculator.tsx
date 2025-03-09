"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function PositionSizeCalculator() {
  const [accountSize, setAccountSize] = useState<string>("10000")
  const [riskPercentage, setRiskPercentage] = useState<string>("1")
  const [entryPrice, setEntryPrice] = useState<string>("42000")
  const [stopLossPrice, setStopLossPrice] = useState<string>("41000")
  const [positionSize, setPositionSize] = useState<string>("")
  const [riskAmount, setRiskAmount] = useState<string>("")

  const calculatePositionSize = () => {
    const account = Number.parseFloat(accountSize)
    const risk = Number.parseFloat(riskPercentage)
    const entry = Number.parseFloat(entryPrice)
    const stopLoss = Number.parseFloat(stopLossPrice)

    if (isNaN(account) || isNaN(risk) || isNaN(entry) || isNaN(stopLoss) || entry === stopLoss) {
      setPositionSize("Invalid input")
      setRiskAmount("Invalid input")
      return
    }

    const riskAmountValue = account * (risk / 100)
    const priceDifference = Math.abs(entry - stopLoss)
    const riskPerUnit = priceDifference / entry
    const positionSizeValue = riskAmountValue / (riskPerUnit * entry)

    setRiskAmount(`$${riskAmountValue.toFixed(2)}`)
    setPositionSize(`$${positionSizeValue.toFixed(2)}`)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="account-size">Account Size ($)</Label>
          <Input id="account-size" type="number" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="risk-percentage">Risk Percentage (%)</Label>
          <Input
            id="risk-percentage"
            type="number"
            value={riskPercentage}
            onChange={(e) => setRiskPercentage(e.target.value)}
          />
        </div>
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
      </div>

      <Button onClick={calculatePositionSize} className="w-full">
        Calculate
      </Button>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Position Size</Label>
          <div className="rounded-md border border-input bg-background px-3 py-2">{positionSize || "—"}</div>
        </div>
        <div className="space-y-2">
          <Label>Risk Amount</Label>
          <div className="rounded-md border border-input bg-background px-3 py-2">{riskAmount || "—"}</div>
        </div>
      </div>
    </div>
  )
}

