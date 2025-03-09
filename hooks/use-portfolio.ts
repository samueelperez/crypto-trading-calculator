"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Exchange, Asset, ExchangeWithAssets, AssetWithValue, PortfolioSummary } from "@/types/portfolio"
import { exchangeService, assetService } from "@/lib/supabase/portfolio-service"
import { cryptoPriceService } from "@/lib/api/crypto-price-service"
import { checkSupabaseCredentials } from "@/lib/supabase/client"

// Configuración para reintentos
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // ms

export function usePortfolio() {
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [portfolioWithPrices, setPortfolioWithPrices] = useState<ExchangeWithAssets[]>([])
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [retryCount, setRetryCount] = useState(0)
  const [isOffline, setIsOffline] = useState(false)

  // Usar refs para evitar dependencias que cambien en cada renderizado
  const exchangesRef = useRef<Exchange[]>([])
  const assetsRef = useRef<Asset[]>([])
  const loadingRef = useRef(true)
  const initialLoadDone = useRef(false)

  // Verificar estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Verificar estado inicial
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Verificación única de credenciales
  const hasCredentials = checkSupabaseCredentials()

  // Cargar exchanges y assets con reintentos controlados
  const loadPortfolioData = useCallback(
    async (retry = 0) => {
      // Si no hay credenciales, no intentar cargar datos
      if (!hasCredentials) {
        setError(new Error("Missing Supabase environment variables. Please check your configuration."))
        setIsLoading(false)
        return { exchanges: [], assets: [] }
      }

      // Si estamos offline, no intentar cargar datos
      if (isOffline) {
        setError(new Error("You are currently offline. Please check your internet connection."))
        setIsLoading(false)
        return { exchanges: exchangesRef.current, assets: assetsRef.current }
      }

      try {
        setIsLoading(true)
        loadingRef.current = true
        setError(null) // Limpiar errores anteriores al iniciar una nueva carga

        // Cargar exchanges
        console.log("Fetching exchanges from Supabase...")
        const exchangesData = await exchangeService.getAll()
        console.log("Exchanges fetched:", exchangesData)
        exchangesRef.current = exchangesData
        setExchanges(exchangesData)

        // Cargar assets
        console.log("Fetching assets from Supabase...")
        const assetsData = await assetService.getAll()
        console.log("Assets fetched:", assetsData)
        assetsRef.current = assetsData
        setAssets(assetsData)

        // Resetear contador de reintentos y error
        setRetryCount(0)

        // Actualizar el estado del portfolio con los datos cargados
        const exchangesWithAssets = exchangesData.map((exchange) => {
          const exchangeAssets = assetsData.filter((asset) => asset.exchange_id === exchange.id)
          return {
            ...exchange,
            assets: exchangeAssets.map((asset) => ({
              ...asset,
              currentPrice: 0,
              currentValue: 0,
              profitLoss: 0,
              profitLossPercentage: 0,
              lastUpdated: new Date(),
            })),
            totalValue: 0,
          }
        })

        setPortfolioWithPrices(exchangesWithAssets)

        return { exchanges: exchangesData, assets: assetsData }
      } catch (err) {
        console.error("Error loading portfolio data:", err)

        // Detectar errores de autorización
        const isAuthError =
          err instanceof Error &&
          (err.message.includes("autorización") ||
            err.message.includes("authorization") ||
            err.message.includes("permission") ||
            err.message.includes("permiso"))

        // Implementar lógica de reintentos solo si no es un error de autorización
        if (!isAuthError && retry < MAX_RETRIES) {
          console.log(`Retrying (${retry + 1}/${MAX_RETRIES}) in ${RETRY_DELAY}ms...`)

          // Esperar antes de reintentar (con retardo exponencial)
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retry)))

          // Incrementar contador de reintentos
          setRetryCount(retry + 1)

          // Reintentar
          return loadPortfolioData(retry + 1)
        }

        // Si agotamos los reintentos o es un error de autorización, establecer error
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load portfolio data. Please try again later."

        const finalMessage = isAuthError
          ? `Error de autorización: ${errorMessage}. Verifica las políticas de seguridad en Supabase.`
          : `${errorMessage} (after ${MAX_RETRIES} retries)`

        setError(new Error(finalMessage))
        return { exchanges: exchangesRef.current, assets: assetsRef.current }
      } finally {
        setIsLoading(false)
        loadingRef.current = false
      }
    },
    [hasCredentials, isOffline],
  )

  // Actualizar precios y calcular valores
  const updatePrices = useCallback(async () => {
    // No actualizar precios si no hay assets o estamos offline
    if (assetsRef.current.length === 0 || isOffline) return

    try {
      // Obtener todos los símbolos únicos
      const symbols = [...new Set(assetsRef.current.map((asset) => asset.symbol))]

      // Obtener precios actuales
      const prices = await cryptoPriceService.getPrices(symbols)

      // Calcular valores para cada asset
      const assetsWithValues: AssetWithValue[] = assetsRef.current.map((asset) => {
        const price = prices[asset.symbol]?.current_price || 0
        const currentValue = Number(asset.quantity) * price
        const investment = Number(asset.quantity) * Number(asset.purchase_price_avg)
        const profitLoss = currentValue - investment
        const profitLossPercentage = investment > 0 ? (profitLoss / investment) * 100 : 0

        // Intentar obtener el logo de los precios
        const logo_url = prices[asset.symbol]?.image || null

        return {
          ...asset,
          currentPrice: price,
          currentValue,
          profitLoss,
          profitLossPercentage,
          lastUpdated: new Date(),
          logo_url, // Añadir el logo en memoria
        }
      })

      // Agrupar assets por exchange
      const exchangesWithAssets: ExchangeWithAssets[] = exchangesRef.current.map((exchange) => {
        const exchangeAssets = assetsWithValues.filter((asset) => asset.exchange_id === exchange.id)
        const totalValue = exchangeAssets.reduce((sum, asset) => sum + asset.currentValue, 0)

        return {
          ...exchange,
          assets: exchangeAssets,
          totalValue,
        }
      })

      // Calcular resumen del portfolio
      const totalValue = exchangesWithAssets.reduce((sum, exchange) => sum + exchange.totalValue, 0)
      const totalInvestment = assetsWithValues.reduce(
        (sum, asset) => sum + Number(asset.quantity) * Number(asset.purchase_price_avg),
        0,
      )
      const totalProfitLoss = totalValue - totalInvestment
      const profitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0

      // Calcular distribución por exchange
      const byExchange = exchangesWithAssets
        .map((exchange) => ({
          exchangeId: exchange.id,
          exchangeName: exchange.name,
          value: exchange.totalValue,
          percentage: totalValue > 0 ? (exchange.totalValue / totalValue) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value)

      // Calcular distribución por asset
      const byAsset = assetsWithValues
        .reduce(
          (acc, asset) => {
            const existingIndex = acc.findIndex((item) => item.symbol === asset.symbol)

            if (existingIndex >= 0) {
              acc[existingIndex].value += asset.currentValue
            } else {
              acc.push({
                symbol: asset.symbol,
                value: asset.currentValue,
                percentage: 0, // Calculamos después
              })
            }

            return acc
          },
          [] as { symbol: string; value: number; percentage: number }[],
        )
        .map((item) => ({
          ...item,
          percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value)

      const portfolioSummary: PortfolioSummary = {
        totalValue,
        totalInvestment,
        totalProfitLoss,
        profitLossPercentage,
        lastUpdated: new Date(),
        distribution: {
          byExchange,
          byAsset,
        },
      }

      // Actualizar estado
      setPortfolioWithPrices(exchangesWithAssets)
      setSummary(portfolioSummary)
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error updating prices:", err)
      // No establecer error aquí para evitar interrumpir la experiencia del usuario
      // Los precios pueden fallar temporalmente sin afectar la funcionalidad principal
    }
  }, [isOffline])

  // Inicializar datos solo una vez al cargar la página
  useEffect(() => {
    // Evitar cargar datos múltiples veces
    if (initialLoadDone.current) return

    // Marcar como inicializado para evitar múltiples cargas
    initialLoadDone.current = true

    loadPortfolioData().then(({ assets }) => {
      if (assets.length > 0) {
        updatePrices()
      }
    })
  }, [loadPortfolioData, updatePrices])

  // Eliminar la actualización periódica automática de datos del portfolio
  // Solo mantener la actualización periódica de precios
  useEffect(() => {
    if (assetsRef.current.length === 0 || isOffline) return

    // Actualizar solo los precios cada 2 minutos, no los datos del portfolio
    const interval = setInterval(() => {
      // Solo actualizar si no estamos cargando datos
      if (!loadingRef.current) {
        updatePrices()
      }
    }, 120000)

    return () => clearInterval(interval)
  }, [updatePrices, isOffline])

  // Refrescar precios manualmente
  const refreshPrices = useCallback(() => {
    // No refrescar si estamos cargando o offline
    if (loadingRef.current || isOffline) return

    cryptoPriceService.invalidateCache()
    updatePrices()
  }, [updatePrices, isOffline])

  // Refrescar datos completos manualmente
  const refreshData = useCallback(() => {
    // No refrescar si estamos cargando o offline
    if (loadingRef.current || isOffline) return

    loadPortfolioData().then(({ assets }) => {
      if (assets.length > 0) {
        updatePrices()
      }
    })
  }, [loadPortfolioData, updatePrices, isOffline])

  // Métodos CRUD para exchanges
  const addExchange = async (exchange: Omit<Exchange, "id" | "created_at">) => {
    if (isOffline) {
      throw new Error("Cannot add exchange while offline")
    }

    try {
      const newExchange = await exchangeService.create(exchange)

      // Actualizar el estado local inmediatamente para una respuesta más rápida en la UI
      const updatedExchanges = [...exchangesRef.current, newExchange]
      exchangesRef.current = updatedExchanges
      setExchanges(updatedExchanges)

      // Actualizar también portfolioWithPrices para que la UI se actualice
      const newExchangeWithAssets: ExchangeWithAssets = {
        ...newExchange,
        assets: [],
        totalValue: 0,
      }

      setPortfolioWithPrices((prev) => [...prev, newExchangeWithAssets])

      return newExchange
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add exchange"
      throw new Error(errorMessage)
    }
  }

  const updateExchange = async (id: string, exchange: Partial<Exchange>) => {
    if (isOffline) {
      throw new Error("Cannot update exchange while offline")
    }

    try {
      // Actualizar el exchange en la base de datos
      const updatedExchange = await exchangeService.update(id, exchange)

      // Actualizar el estado local inmediatamente para una respuesta más rápida en la UI
      const updatedExchanges = exchangesRef.current.map((ex) => (ex.id === id ? { ...ex, ...exchange } : ex))
      exchangesRef.current = updatedExchanges
      setExchanges(updatedExchanges)

      // Actualizar también portfolioWithPrices para que la UI se actualice
      setPortfolioWithPrices((prev) =>
        prev.map((ex) => (ex.id === id ? { ...ex, ...exchange, assets: ex.assets } : ex)),
      )

      return updatedExchange
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update exchange"
      throw new Error(errorMessage)
    }
  }

  const deleteExchange = async (id: string) => {
    if (isOffline) {
      throw new Error("Cannot delete exchange while offline")
    }

    try {
      // Primero eliminamos el exchange de la base de datos
      await exchangeService.delete(id)

      // Actualizamos el estado local inmediatamente para una respuesta más rápida en la UI
      const updatedExchanges = exchangesRef.current.filter((exchange) => exchange.id !== id)
      exchangesRef.current = updatedExchanges
      setExchanges(updatedExchanges)

      // Actualizamos también portfolioWithPrices para que la UI se actualice
      setPortfolioWithPrices((prev) => prev.filter((exchange) => exchange.id !== id))

      // Actualizamos también los assets para eliminar los que pertenecían a este exchange
      const updatedAssets = assetsRef.current.filter((asset) => asset.exchange_id !== id)
      assetsRef.current = updatedAssets
      setAssets(updatedAssets)

      // Actualizar el resumen después de eliminar
      await updatePrices()

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete exchange"
      throw new Error(errorMessage)
    }
  }

  // Métodos CRUD para assets
  const addAsset = async (asset: Omit<Asset, "id" | "last_updated">) => {
    if (isOffline) {
      throw new Error("Cannot add asset while offline")
    }

    try {
      // Extraemos logo_url si existe
      const { logo_url, ...assetData } = asset as any

      // Guardamos el asset en la base de datos
      const newAsset = await assetService.create({
        ...assetData,
        logo_url: logo_url, // Incluir el logo_url en la creación
      })

      console.log("Asset created successfully:", newAsset)

      // Actualizar el estado local inmediatamente
      const updatedAssets = [...assetsRef.current, newAsset]
      assetsRef.current = updatedAssets
      setAssets(updatedAssets)

      // Obtener el precio actual para el nuevo asset
      let currentPrice = 0
      try {
        const price = await cryptoPriceService.getPrice(newAsset.symbol)
        currentPrice = price?.current_price || 0
        console.log(`Price fetched for ${newAsset.symbol}:`, currentPrice)
      } catch (priceError) {
        console.error(`Error fetching price for ${newAsset.symbol}:`, priceError)
      }

      // Crear el asset con valores calculados
      const assetWithValue: AssetWithValue = {
        ...newAsset,
        currentPrice,
        currentValue: Number(newAsset.quantity) * currentPrice,
        profitLoss: Number(newAsset.quantity) * (currentPrice - Number(newAsset.purchase_price_avg)),
        profitLossPercentage:
          Number(newAsset.purchase_price_avg) > 0
            ? ((currentPrice - Number(newAsset.purchase_price_avg)) / Number(newAsset.purchase_price_avg)) * 100
            : 0,
        lastUpdated: new Date(),
        logo_url,
      }

      console.log("Asset with calculated values:", assetWithValue)

      // Actualizar el portfolioWithPrices
      setPortfolioWithPrices((prev) => {
        const updated = prev.map((exchange) => {
          if (exchange.id === newAsset.exchange_id) {
            const updatedAssets = [...exchange.assets, assetWithValue]
            const totalValue = updatedAssets.reduce((sum, a) => sum + a.currentValue, 0)
            return {
              ...exchange,
              assets: updatedAssets,
              totalValue,
            }
          }
          return exchange
        })
        console.log("Updated portfolioWithPrices:", updated)
        return updated
      })

      // Actualizar el resumen después de añadir
      await updatePrices()

      return newAsset
    } catch (err) {
      console.error("Error adding asset:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to add asset"
      throw new Error(errorMessage)
    }
  }

  const updateAsset = async (id: string, asset: Partial<Asset>) => {
    if (isOffline) {
      throw new Error("Cannot update asset while offline")
    }

    try {
      console.log("Updating asset in usePortfolio:", id, asset)

      const updatedAsset = await assetService.update(id, asset)

      // Actualizar el estado local
      const updatedAssets = assetsRef.current.map((a) => (a.id === id ? { ...a, ...asset } : a))
      assetsRef.current = updatedAssets
      setAssets(updatedAssets)

      // Actualizar portfolioWithPrices
      setPortfolioWithPrices((prev) =>
        prev.map((exchange) => {
          const assetIndex = exchange.assets.findIndex((a) => a.id === id)
          if (assetIndex >= 0) {
            const updatedAssets = [...exchange.assets]
            updatedAssets[assetIndex] = {
              ...updatedAssets[assetIndex],
              ...asset,
              // Mantener los valores calculados hasta que se actualicen los precios
              currentPrice: updatedAssets[assetIndex].currentPrice,
              currentValue: updatedAssets[assetIndex].currentValue,
              profitLoss: updatedAssets[assetIndex].profitLoss,
              profitLossPercentage: updatedAssets[assetIndex].profitLossPercentage,
            }

            // Recalcular el valor total del exchange
            const totalValue = updatedAssets.reduce((sum, a) => sum + a.currentValue, 0)

            return {
              ...exchange,
              assets: updatedAssets,
              totalValue,
            }
          }
          return exchange
        }),
      )

      // Actualizar precios y valores después de la actualización
      await updatePrices()

      return updatedAsset
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update asset"
      throw new Error(errorMessage)
    }
  }

  const deleteAsset = async (id: string) => {
    if (isOffline) {
      throw new Error("Cannot delete asset while offline")
    }

    try {
      // Encontrar el asset antes de eliminarlo para saber a qué exchange pertenece
      const assetToDelete = assetsRef.current.find((a) => a.id === id)

      if (!assetToDelete) {
        throw new Error("Asset not found")
      }

      const exchangeId = assetToDelete.exchange_id

      // Eliminar el asset de la base de datos
      await assetService.delete(id)

      // Actualizar el estado local
      const updatedAssets = assetsRef.current.filter((a) => a.id !== id)
      assetsRef.current = updatedAssets
      setAssets(updatedAssets)

      // Actualizar portfolioWithPrices
      setPortfolioWithPrices((prev) =>
        prev.map((exchange) => {
          if (exchange.id === exchangeId) {
            const updatedAssets = exchange.assets.filter((a) => a.id !== id)
            const totalValue = updatedAssets.reduce((sum, a) => sum + a.currentValue, 0)
            return {
              ...exchange,
              assets: updatedAssets,
              totalValue,
            }
          }
          return exchange
        }),
      )

      // Actualizar el resumen después de eliminar
      await updatePrices()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete asset"
      throw new Error(errorMessage)
    }
  }

  return {
    exchanges,
    assets,
    portfolioWithPrices,
    summary,
    isLoading,
    error,
    lastUpdated,
    isOffline,
    retryCount,
    refreshPrices,
    refreshData,
    addExchange,
    updateExchange,
    deleteExchange,
    addAsset,
    updateAsset,
    deleteAsset,
    loadPortfolioData,
  }
}

