"use client"

import { useState, useEffect } from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export default function CalculatorPage() {
  const [portfolio, setPortfolio] = useState<string>("")
  const [entryPrice, setEntryPrice] = useState<string>("")
  const [stopLossPrice, setStopLossPrice] = useState<string>("")
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>("")
  const [operationType, setOperationType] = useState<string>("long")

  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    maxRisk: number
    usdtAmount: number
    leverage: number
    riskRewardRatio?: number
  } | null>(null)

  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // In a real implementation, this would fetch from your portfolio data
    // For now, we'll simulate fetching portfolio data
    const fetchPortfolioData = async () => {
      setIsLoading(true)
      try {
        // This would be replaced with actual API call to get portfolio data
        // For example: const { data } = await supabase.from('portfolio').select('total_value').single()

        // Simulating API call with timeout
        await new Promise((resolve) => setTimeout(resolve, 500))

        // For demo purposes, using a hardcoded value
        // In production, this would come from your database
        setPortfolio("10000")
      } catch (error) {
        console.error("Error fetching portfolio data:", error)
        // Set a default value if fetch fails
        setPortfolio("0")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPortfolioData()
  }, [])

  const calculatePosition = () => {
    // Reset previous results and errors
    setError(null)
    setResult(null)

    // Validate inputs are numbers and positive
    const portfolioValue = Number(portfolio)
    const entry = Number(entryPrice)
    const stopLoss = Number(stopLossPrice)
    const takeProfit = takeProfitPrice ? Number(takeProfitPrice) : null

    if (isNaN(portfolioValue) || portfolioValue <= 0) {
      setError("Portfolio amount must be a positive number")
      return
    }

    if (isNaN(entry) || entry <= 0) {
      setError("Entry price must be a positive number")
      return
    }

    if (isNaN(stopLoss) || stopLoss <= 0) {
      setError("Stop loss price must be a positive number")
      return
    }

    if (takeProfit !== null && (isNaN(takeProfit) || takeProfit <= 0)) {
      setError("Take profit price must be a positive number")
      return
    }

    // Validate stop loss position based on operation type
    if (operationType === "long" && stopLoss >= entry) {
      setError("For long positions, stop loss must be below entry price")
      return
    }

    if (operationType === "short" && stopLoss <= entry) {
      setError("For short positions, stop loss must be above entry price")
      return
    }

    // Calculate maximum risk (1% of portfolio)
    const maxRisk = portfolioValue * 0.01

    // Calculate price difference (risk per unit)
    const priceDifference = Math.abs(entry - stopLoss)

    // Calculate USDT amount to invest
    const usdtAmount = (maxRisk / priceDifference) * entry

    // Calculate leverage (position size / capital used)
    // For simplicity, we're assuming the position size is the USDT amount
    // In a real scenario, this would depend on the specific exchange's margin requirements
    const leverage = Math.ceil(portfolioValue / usdtAmount)

    // Calculate risk/reward ratio if take profit is provided
    let riskRewardRatio
    if (takeProfit !== null) {
      const reward = Math.abs(takeProfit - entry)
      const risk = Math.abs(entry - stopLoss)
      riskRewardRatio = reward / risk
    }

    // Set result
    setResult({
      maxRisk,
      usdtAmount,
      leverage: Math.min(leverage, 125), // Cap at 125x which is common max leverage
      riskRewardRatio,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Futures Position Calculator</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Position Size & Leverage Calculator</CardTitle>
          <CardDescription>
            Calculate the optimal position size and leverage for futures trading based on risk management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Portfolio Size (USDT)</Label>
                <div className="rounded-md border border-input bg-background px-3 py-2 font-medium">
                  {Number(portfolio).toLocaleString() || "Loading..."}
                </div>
                <p className="text-xs text-muted-foreground">Automatically fetched from your portfolio</p>
              </div>
            </div>

            <RadioGroup value={operationType} onValueChange={setOperationType} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="long" id="long" />
                <Label htmlFor="long" className="flex items-center">
                  <ArrowUpIcon className="mr-1 h-4 w-4 text-positive" />
                  Long
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="short" id="short" />
                <Label htmlFor="short" className="flex items-center">
                  <ArrowDownIcon className="mr-1 h-4 w-4 text-negative" />
                  Short
                </Label>
              </div>
            </RadioGroup>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="entry-price">Entry Price (USDT)</Label>
                <Input
                  id="entry-price"
                  type="number"
                  placeholder="50000"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stop-loss" className="text-negative">
                  Stop Loss Price (USDT)
                </Label>
                <Input
                  id="stop-loss"
                  type="number"
                  placeholder={operationType === "long" ? "49500" : "50500"}
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  className="border-negative/30 focus-visible:ring-negative/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="take-profit" className="text-positive">
                  Take Profit Price (USDT) (Optional)
                </Label>
                <Input
                  id="take-profit"
                  type="number"
                  placeholder={operationType === "long" ? "51000" : "49000"}
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  className="border-positive/30 focus-visible:ring-positive/30"
                />
              </div>
            </div>

            <Button onClick={calculatePosition} className="w-full">
              Calculate Position
            </Button>
          </div>

          {result && (
            <>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Max Risk (1% of Portfolio)</Label>
                  <div className="rounded-md border border-input bg-background px-3 py-2 font-medium">
                    {result.maxRisk.toFixed(2)} USDT
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Position Size</Label>
                  <div className="rounded-md border border-input bg-background px-3 py-2 font-medium">
                    {result.usdtAmount.toFixed(2)} USDT
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Recommended Leverage</Label>
                  <div className="rounded-md border border-input bg-background px-3 py-2 font-medium">
                    {result.leverage}x
                  </div>
                </div>
                {result.riskRewardRatio && (
                  <div className="space-y-2">
                    <Label>Risk/Reward Ratio</Label>
                    <div
                      className={cn(
                        "rounded-md border border-input bg-background px-3 py-2 font-medium",
                        result.riskRewardRatio >= 2
                          ? "text-positive"
                          : result.riskRewardRatio < 1
                            ? "text-negative"
                            : "",
                      )}
                    >
                      1:{result.riskRewardRatio.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-md bg-muted p-4">
                <h3 className="font-medium mb-2">Position Summary</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Based on your portfolio of {Number(portfolio).toLocaleString()} USDT, you should risk a maximum of{" "}
                  {result.maxRisk.toFixed(2)} USDT (1%) on this trade.
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  For a {operationType} position with entry at {Number(entryPrice).toLocaleString()} USDT and stop loss
                  at {Number(stopLossPrice).toLocaleString()} USDT:
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Use a position size of {result.usdtAmount.toFixed(2)} USDT</li>
                  <li>Set leverage to {result.leverage}x</li>
                  {result.riskRewardRatio && (
                    <li>
                      Your risk/reward ratio is 1:{result.riskRewardRatio.toFixed(2)}{" "}
                      {result.riskRewardRatio >= 2 ? "(Good)" : result.riskRewardRatio < 1 ? "(Poor)" : "(Acceptable)"}
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

