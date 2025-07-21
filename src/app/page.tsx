'use client'

import { useState } from 'react'
import { Calculator } from 'lucide-react'

interface LossOption {
  label: string
  value: string
  amount: number
}

const lossOptions: LossOption[] = [
  { label: '$300', value: '300', amount: 300 },
  { label: '$170', value: '170', amount: 170 },
  { label: '$130', value: '130', amount: 130 },
]

const leverageOptions = [10, 20, 50]

export default function Home() {
  const [entryPrice, setEntryPrice] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [selectedLoss, setSelectedLoss] = useState<string>('')
  const [positionSize, setPositionSize] = useState<number>(0)
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(0)
  const [potentialProfit, setPotentialProfit] = useState<number>(0)
  const [potentialLoss, setPotentialLoss] = useState<number>(0)
  const [positionsByLeverage, setPositionsByLeverage] = useState<{ [key: string]: number }>({})

  const calculatePosition = () => {
    const entry = parseFloat(entryPrice)
    const stop = parseFloat(stopLoss)
    const target = parseFloat(targetPrice)

    if (!selectedLoss) {
      alert('Por favor selecciona cuánto quieres perder')
      return
    }

    if (isNaN(entry) || isNaN(stop) || isNaN(target)) {
      alert('Por favor, completa todos los campos con valores válidos')
      return
    }

    if (entry <= 0 || stop <= 0 || target <= 0) {
      alert('Los precios deben ser mayores a 0')
      return
    }

    if (stop >= entry && target <= entry) {
      alert('El stop loss debe estar por debajo del precio de entrada y el objetivo por encima')
      return
    }

    // Obtener la pérdida deseada
    const selectedLossOption = lossOptions.find(option => option.value === selectedLoss)
    const desiredLoss = selectedLossOption?.amount || 0

    // Calcular el porcentaje de pérdida al stop loss
    const priceDifference = Math.abs(entry - stop)
    const lossPercentage = priceDifference / entry

    // Calcular el tamaño de posición total necesario
    const positionSizeValue = desiredLoss / lossPercentage
    setPositionSize(positionSizeValue)

    // Calcular ratio riesgo/recompensa
    const potentialGain = Math.abs(target - entry)
    const gainPercentage = potentialGain / entry
    const riskReward = gainPercentage / lossPercentage
    setRiskRewardRatio(riskReward)

    // Calcular ganancia/pérdida potencial
    const profit = positionSizeValue * gainPercentage
    const loss = positionSizeValue * lossPercentage
    setPotentialProfit(profit)
    setPotentialLoss(loss)

    // Calcular margen requerido para cada apalancamiento
    const positionsCalc: { [key: string]: number } = {}
    leverageOptions.forEach(leverage => {
      positionsCalc[`${leverage}x`] = positionSizeValue / leverage
    })
    setPositionsByLeverage(positionsCalc)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="w-8 h-8 text-primary mr-2" />
            <h1 className="text-3xl font-bold text-foreground">
              Calculadora de Trading
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Calcula el tamaño de posición para perder exactamente lo que quieres
          </p>
        </div>

        {/* Inputs */}
        <div className="bg-card rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Precios
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Precio de entrada
              </label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ej: 4.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Take profit (objetivo)
              </label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ej: 9.00"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Stop loss
              </label>
              <input
                type="number"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ej: 3.00"
              />
            </div>
            
            <div></div>
          </div>
        </div>

        {/* Loss Selection */}
        <div className="bg-card rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            ¿Cuánto quieres perder?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {lossOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedLoss(option.value)}
                className={`px-4 py-3 rounded-md border transition-colors ${
                  selectedLoss === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calculate Button */}
        <div className="text-center mb-8">
          <button
            onClick={calculatePosition}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors"
          >
            Calcular Posición
          </button>
        </div>

        {/* Results */}
        {positionSize > 0 && (
          <>
            <div className="bg-card rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Resultados
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Tamaño de posición total
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    ${positionSize.toFixed(2)}
                  </p>
                </div>

                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Ratio R/R
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {riskRewardRatio.toFixed(2)}:1
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Ganancia potencial
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      ${potentialProfit.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Pérdida potencial
                    </p>
                    <p className="text-xl font-bold text-destructive">
                      ${potentialLoss.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Leverage Options */}
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Margen requerido por apalancamiento
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leverageOptions.map((leverage) => (
                  <div key={leverage} className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      {leverage}x
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      ${positionsByLeverage[`${leverage}x`]?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 