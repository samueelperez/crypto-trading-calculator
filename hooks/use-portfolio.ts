"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Exchange, Asset, ExchangeWithAssets, AssetWithValue, PortfolioSummary } from "@/types/portfolio"
import { exchangeService, assetService } from "@/lib/supabase/portfolio-service"
import { cryptoPriceService } from "@/lib/api/crypto-price-service"
import { checkSupabaseCredentials } from "@/lib/supabase/client"
import { eventBus, EVENTS } from "@/lib/event-bus"
import { userSettingsService } from "@/lib/supabase/user-settings-service"

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
  const [initialCapital, setInitialCapital] = useState(0)

  // Usar refs para evitar dependencias que cambien en cada renderizado
  const exchangesRef = useRef<Exchange[]>([])
  const assetsRef = useRef<Asset[]>([])
  const loadingRef = useRef(true)
  const initialLoadDone = useRef(false)
  const portfolioWithPricesRef = useRef<ExchangeWithAssets[]>([])

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
      // Si no hay credenciales, retornar error
      if (!hasCredentials) {
        const credentialsError = new Error(
          "Missing Supabase credentials. Please check your environment variables.",
        )
        setError(credentialsError)
        return { exchanges: [], assets: [] }
      }

      // Si estamos desconectados, no intentar cargar datos
      if (isOffline) {
        setError(new Error("You are offline. Please check your internet connection and try again."))
        return { exchanges: exchangesRef.current, assets: assetsRef.current }
      }

      loadingRef.current = true
      setIsLoading(true)

      try {
        console.log("Fetching exchanges...")
        const exchanges = await exchangeService.getAll()
        console.log(`Loaded ${exchanges.length} exchanges`)

        // Guardar exchanges inmediatamente
        exchangesRef.current = exchanges
        setExchanges(exchanges)

        // Cargar assets para cada exchange
        console.log("Fetching assets for all exchanges...")
        const allAssets: Asset[] = []
        
        for (const exchange of exchanges) {
          console.log(`Fetching assets for exchange: ${exchange.name} (${exchange.id})`)
          const exchangeAssets = await assetService.getByExchangeId(exchange.id)
          console.log(`Loaded ${exchangeAssets.length} assets for ${exchange.name}`)
          allAssets.push(...exchangeAssets)
        }

        // Guardar assets inmediatamente
        assetsRef.current = allAssets
        setAssets(allAssets)

        console.log(`Total: ${exchanges.length} exchanges with ${allAssets.length} assets`)
        return { exchanges, assets: allAssets }
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

  // Función para verificar si un símbolo es una stablecoin
  const isStablecoin = (symbol: string): boolean => {
    const stablecoins = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdp', 'usdd', 'gusd', 'frax', 'lusd', 'susd'];
    return stablecoins.includes(symbol.toLowerCase());
  }

  // Cargar el capital inicial al inicio
  useEffect(() => {
    const loadInitialCapital = async () => {
      try {
        const amount = await userSettingsService.getInitialCapital();
        console.log("Loaded initial capital:", amount);
        setInitialCapital(amount);
      } catch (error) {
        console.error("Error loading initial capital:", error);
      }
    };
    
    loadInitialCapital();
  }, []);

  // Escuchar actualizaciones de configuración
  useEffect(() => {
    const settingsUpdatedUnsubscribe = eventBus.subscribe(
      EVENTS.SETTINGS_UPDATED,
      (data) => {
        if (data && 'initialCapital' in data) {
          console.log("Settings updated, new initial capital:", data.initialCapital);
          setInitialCapital(data.initialCapital);
          // Forzar actualización de precios para reflejar el nuevo capital inicial
          updatePrices().catch(err => {
            console.error("Error updating prices after settings change:", err);
          });
        }
      }
    );
    
    return () => {
      settingsUpdatedUnsubscribe();
    };
  }, []);

  // Función para actualizar precios
  const updatePrices = useCallback(async () => {
    if (isOffline) {
      return { success: false, error: "No internet connection" }
    }

    // Solo actualizar si tenemos assets
    if (assetsRef.current.length === 0) {
      return { success: true, message: "No assets to update" }
    }

    try {
      loadingRef.current = true

      console.log("Getting unique symbols from assets...")
      // Obtener lista única de símbolos
      const symbols = Array.from(new Set(assetsRef.current.map((asset) => asset.symbol)))

      if (symbols.length === 0) {
        return { success: true, message: "No symbols to update" }
      }

      console.log(`Fetching prices for ${symbols.length} symbols:`, symbols)
      // Obtener precios para todos los símbolos a la vez
      const prices = await cryptoPriceService.getPrices(symbols)
      console.log("Prices fetched:", Object.keys(prices).length, "symbols")

      // Mapear los precios actualizados a los assets
      let totalPortfolioValue = 0
      let totalInvestment = 0

      console.log("Updating portfolio with prices...")
      const updatedPortfolio = portfolioWithPricesRef.current.map((exchange) => {
        let exchangeValue = 0
        let exchangeInvestment = 0

        const updatedAssets = exchange.assets.map((asset) => {
          const symbol = asset.symbol;
          const isAssetStablecoin = isStablecoin(symbol);
          const quantity = Number(asset.quantity)
          const purchasePrice = Number(asset.purchase_price_avg)
          const investmentValue = quantity * purchasePrice
          
          exchangeInvestment += investmentValue
          totalInvestment += investmentValue

          // Para stablecoins, usar siempre $1.00
          if (isAssetStablecoin) {
            const stablecoinValue = quantity * 1.0
            exchangeValue += stablecoinValue
            totalPortfolioValue += stablecoinValue
            
            console.log(`Updated ${symbol} (stablecoin): price=1.00, value=${stablecoinValue}`)
            
            return {
              ...asset,
              currentPrice: 1.0,
              currentValue: stablecoinValue,
              profitLoss: 0, // No hay ganancia/pérdida en stablecoins
              profitLossPercentage: 0,
              lastUpdated: new Date(),
            }
          }
          
          // Si tenemos precio de la API, usarlo
          const price = prices[symbol]
          if (price) {
            const currentPrice = price.current_price
            const currentValue = quantity * currentPrice
            const profitLoss = currentValue - investmentValue
            const profitLossPercentage = investmentValue > 0 ? (profitLoss / investmentValue) * 100 : 0

            exchangeValue += currentValue
            totalPortfolioValue += currentValue

            console.log(`Updated ${symbol}: price=${currentPrice}, value=${currentValue}`)

            // Retornar asset actualizado
            return {
              ...asset,
              currentPrice,
              currentValue,
              profitLoss,
              profitLossPercentage,
              lastUpdated: new Date(),
            }
          }

          // Si no tenemos precio, mantener los valores actuales pero actualizar la fecha
          const fallbackPrice = Number(asset.purchase_price_avg)
          const fallbackValue = quantity * fallbackPrice
          exchangeValue += fallbackValue
          totalPortfolioValue += fallbackValue

          console.log(`No price found for ${symbol}, using fallback: ${fallbackPrice}`)

          return {
            ...asset,
            currentPrice: fallbackPrice,
            currentValue: fallbackValue,
            profitLoss: 0,
            profitLossPercentage: 0,
            lastUpdated: new Date(),
          }
        })

        // Retornar exchange actualizado
        return {
          ...exchange,
          assets: updatedAssets,
          totalValue: exchangeValue,
        }
      })

      // Actualizar el estado
      portfolioWithPricesRef.current = updatedPortfolio
      setPortfolioWithPrices(updatedPortfolio)

      // Crear objeto de resumen
      const summary: PortfolioSummary = {
        totalValue: totalPortfolioValue,
        totalInvestment: initialCapital,
        totalProfitLoss: totalPortfolioValue - initialCapital,
        profitLossPercentage: initialCapital > 0 ? ((totalPortfolioValue - initialCapital) / initialCapital) * 100 : 0,
        lastUpdated: new Date(),
        distribution: {
          byExchange: updatedPortfolio.map((exchange) => ({
            exchangeId: exchange.id,
            exchangeName: exchange.name,
            value: exchange.totalValue,
            percentage: totalPortfolioValue > 0 ? (exchange.totalValue / totalPortfolioValue) * 100 : 0,
          })),
          byAsset: [],
        },
      }

      // Calcular distribución por asset
      const assetDistribution = []
      const assetTotals = new Map<string, number>()

      // Agregar valores por símbolo a través de todos los exchanges
      updatedPortfolio.forEach((exchange) => {
        exchange.assets.forEach((asset) => {
          const currentTotal = assetTotals.get(asset.symbol) || 0
          assetTotals.set(asset.symbol, currentTotal + asset.currentValue)
        })
      })

      // Convertir a array de distribución
      assetTotals.forEach((value, symbol) => {
        assetDistribution.push({
          symbol,
          value,
          percentage: totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0,
        })
      })

      // Ordenar por valor (de mayor a menor)
      summary.distribution.byAsset = assetDistribution.sort((a, b) => b.value - a.value)

      setSummary(summary)
      setLastUpdated(new Date())

      console.log("Portfolio updated with prices:", {
        totalValue: totalPortfolioValue,
        totalInvestment: initialCapital,
        exchanges: updatedPortfolio.length,
        assets: assetsRef.current.length,
      })

      // Publicar evento de actualización de precios
      eventBus.publish(EVENTS.PORTFOLIO_REFRESHED, updatedPortfolio)

      return { success: true }
    } catch (error) {
      console.error("Error updating prices:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update prices",
      }
    } finally {
      loadingRef.current = false
    }
  }, [isOffline, assetsRef, portfolioWithPricesRef, initialCapital])

  // Inicializar datos solo una vez al cargar la página
  useEffect(() => {
    // Evitar cargar datos múltiples veces
    if (initialLoadDone.current) return

    // Marcar como inicializado para evitar múltiples cargas
    initialLoadDone.current = true

    console.log("Initial portfolio data load started")
    
    // Cargar datos inmediatamente y actualizar la UI
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Cargar datos básicos
        const { exchanges: loadedExchanges, assets: loadedAssets } = await loadPortfolioData()
        
        console.log(`Loaded ${loadedExchanges.length} exchanges and ${loadedAssets.length} assets`)
        
        // Formatear datos con la estructura correcta para mostrarlos inmediatamente
        // incluso antes de obtener precios actualizados
        const initialPortfolio: ExchangeWithAssets[] = []
        
        for (const exchange of loadedExchanges) {
          // Filtrar assets de este exchange
          const exchangeAssets = loadedAssets.filter(asset => asset.exchange_id === exchange.id)
          
          // Crear assets con valores iniciales basados en el precio de compra
          const assetsWithValues: AssetWithValue[] = exchangeAssets.map(asset => {
            const quantity = Number(asset.quantity)
            const purchasePrice = Number(asset.purchase_price_avg)
            const initialValue = quantity * purchasePrice
            
            return {
              ...asset,
              currentPrice: purchasePrice, // Inicialmente usamos el precio de compra
              currentValue: initialValue,
              profitLoss: 0,
              profitLossPercentage: 0,
              lastUpdated: new Date()
            }
          })
          
          // Calcular valor total inicial
          const totalValue = assetsWithValues.reduce((sum, asset) => sum + asset.currentValue, 0)
          
          // Agregar el exchange con sus assets al portfolio
          initialPortfolio.push({
            ...exchange,
            assets: assetsWithValues,
            totalValue
          })
        }
        
        // Actualizar el estado para mostrar los datos inmediatamente
        console.log("Setting initial portfolio data with", initialPortfolio.length, "exchanges")
        setPortfolioWithPrices(initialPortfolio)
        portfolioWithPricesRef.current = initialPortfolio
        
        // Si hay assets, actualizar los precios (pero no bloquear la UI)
        if (loadedAssets.length > 0) {
          console.log("Fetching updated prices for initial load")
          // No esperamos aquí para que la UI se actualice más rápido
          updatePrices().catch(err => {
            console.error("Error updating prices during initial load:", err)
          })
        }
      } catch (error) {
        console.error("Error in initial portfolio load:", error)
        setError(error instanceof Error ? error : new Error("Failed to load initial portfolio data"))
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
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
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setRetryCount((prev) => prev + 1);
    
    try {
      // Limpiar cualquier error previo
      setError(null);
      
      // Obtener datos actualizados de exchanges
      console.log("Fetching exchanges from database...")
      const exchangesData = await exchangeService.getAll();
      
      if (!exchangesData) {
        throw new Error("No se pudieron cargar los exchanges");
      }
      
      // Actualizar las referencias internas
      exchangesRef.current = exchangesData;
      setExchanges(exchangesData);
      
      // Inicializar array de exchanges con assets
      const exchangesWithAssets: ExchangeWithAssets[] = [];
      const allLoadedAssets: Asset[] = [];
      
      // Para cada exchange, obtener sus assets
      for (const exchange of exchangesData) {
        console.log(`Fetching assets for exchange ${exchange.id} (${exchange.name})...`)
        const exchangeAssets = await assetService.getByExchangeId(exchange.id);
        allLoadedAssets.push(...exchangeAssets);
        
        // Inicializar con valores por defecto basados en precio de compra
        const assetsWithValues: AssetWithValue[] = exchangeAssets.map((asset) => {
          const quantity = Number(asset.quantity);
          const purchasePrice = Number(asset.purchase_price_avg);
          const initialValue = quantity * purchasePrice;
          
          return {
            ...asset,
            currentPrice: purchasePrice,
            currentValue: initialValue,
            profitLoss: 0,
            profitLossPercentage: 0,
            lastUpdated: new Date(),
          };
        });
        
        // Calcular valor inicial (basado en precio de compra)
        const exchangeValue = assetsWithValues.reduce((sum, asset) => sum + asset.currentValue, 0);
        
        // Añadir exchange con sus assets al array
        exchangesWithAssets.push({
          ...exchange,
          assets: assetsWithValues,
          totalValue: exchangeValue,
        });
      }
      
      console.log("Setting portfolio data with exchanges:", exchangesWithAssets.length)
      
      // Actualizar el estado de assets
      assetsRef.current = allLoadedAssets;
      setAssets(allLoadedAssets);
      
      // Actualizar estado del portfolio
      portfolioWithPricesRef.current = exchangesWithAssets;
      setPortfolioWithPrices(exchangesWithAssets);
      
      // Actualizar fecha de la última carga
      setLastUpdated(new Date());
      
      // Ahora actualizar los precios si hay assets
      if (allLoadedAssets.length > 0) {
        console.log("Updating prices for refreshed data")
        await updatePrices();
      }

      // Notificar a todos los componentes que escuchan eventos que los datos se han refrescado
      eventBus.publish(EVENTS.PORTFOLIO_REFRESHED, portfolioWithPricesRef.current);
      
      // Retornar éxito para que los componentes puedan reaccionar
      return true;
    } catch (error) {
      console.error("Error refreshing portfolio data:", error);
      setError(error instanceof Error ? error : new Error("Failed to refresh portfolio data"));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updatePrices]);

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
      throw new Error("Cannot add asset while offline");
    }

    try {
      // Verificar si ya existe un asset con el mismo símbolo en el mismo exchange
      const existingAssets = await assetService.getByExchangeId(asset.exchange_id);
      const existingAsset = existingAssets.find(
        (a) => a.symbol.toLowerCase() === asset.symbol.toLowerCase()
      );

      if (existingAsset) {
        throw new Error(`Asset with symbol ${asset.symbol} already exists in exchange ${asset.exchange_id}`);
      }

      // Agregar el asset a la base de datos
      const newAsset = await assetService.create(asset);

      // Actualizar el estado local inmediatamente para una respuesta más rápida en la UI
      const updatedAssets = [...assetsRef.current, newAsset];
      assetsRef.current = updatedAssets;
      setAssets(updatedAssets);

      // Actualizar también portfolioWithPrices para que la UI se actualice
      const newExchangeWithAssets: ExchangeWithAssets = {
        ...exchangesRef.current.find(ex => ex.id === asset.exchange_id)!,
        assets: [newAsset],
        totalValue: newAsset.currentValue,
      };
      setPortfolioWithPrices((prev) => [...prev, newExchangeWithAssets]);

      return newAsset;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add asset";
      throw new Error(errorMessage);
    }
  }

  const updateAsset = async (id: string, asset: Partial<Asset>) => {
    if (isOffline) {
      throw new Error("Cannot update asset while offline");
    }

    try {
      console.log(`Updating asset with ID: ${id}`, asset);
      
      // Obtener el asset original antes de actualizarlo
      const originalAsset = assetsRef.current.find(a => a.id === id);
      if (!originalAsset) {
        throw new Error(`Asset with ID ${id} not found`);
      }
      
      // Actualizar el asset en la base de datos
      const updatedAsset = await assetService.update(id, asset);
      
      // Calcular nuevos valores basados en los cambios
      const quantity = asset.quantity !== undefined ? Number(asset.quantity) : Number(originalAsset.quantity);
      const purchasePrice = asset.purchase_price_avg !== undefined 
        ? Number(asset.purchase_price_avg) 
        : Number(originalAsset.purchase_price_avg);
      
      // Actualizar el estado local inmediatamente para una respuesta más rápida en la UI
      const updatedAssets = assetsRef.current.map((a) => {
        if (a.id === id) {
          return { ...a, ...asset };
        }
        return a;
      });
      
      assetsRef.current = updatedAssets;
      setAssets(updatedAssets);
      
      // Encontrar el exchange al que pertenece este asset
      const exchangeId = originalAsset.exchange_id;
      const exchange = portfolioWithPricesRef.current.find(ex => ex.id === exchangeId);
      
      if (!exchange) {
        throw new Error(`Exchange for asset ${id} not found`);
      }
      
      // Actualizar portfolioWithPrices con valores actualizados
      const updatedPortfolio = portfolioWithPricesRef.current.map((ex) => {
        if (ex.id === exchangeId) {
          // Actualizar el asset dentro de este exchange
          const updatedExchangeAssets = ex.assets.map((a) => {
            if (a.id === id) {
              // Calcular nuevos valores para el asset
              const updatedAssetWithValues = {
                ...a,
                ...asset,
                // Mantener el precio actual si está disponible
                currentPrice: a.currentPrice || purchasePrice,
                // Recalcular el valor actual basado en cantidad y precio
                currentValue: quantity * (a.currentPrice || purchasePrice),
                // Recalcular ganancia/pérdida
                profitLoss: quantity * (a.currentPrice || purchasePrice) - (quantity * purchasePrice),
                // Recalcular porcentaje
                profitLossPercentage: purchasePrice > 0 
                  ? ((a.currentPrice || purchasePrice) - purchasePrice) / purchasePrice * 100 
                  : 0,
                lastUpdated: new Date()
              };
              
              return updatedAssetWithValues;
            }
            return a;
          });
          
          // Recalcular el valor total del exchange
          const totalValue = updatedExchangeAssets.reduce(
            (sum, a) => sum + a.currentValue, 
            0
          );
          
          return {
            ...ex,
            assets: updatedExchangeAssets,
            totalValue
          };
        }
        return ex;
      });
      
      // Actualizar el estado global
      portfolioWithPricesRef.current = updatedPortfolio;
      setPortfolioWithPrices(updatedPortfolio);
      
      // Publicar eventos para notificar a los componentes
      eventBus.publish(EVENTS.ASSET_UPDATED, {
        asset: updatedAsset,
        exchangeId,
        portfolioData: updatedPortfolio
      });
      
      // Actualizar precios para obtener valores actualizados desde la API
      updatePrices().catch(err => {
        console.error("Error updating prices after asset update:", err);
      });
      
      return updatedAsset;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update asset";
      throw new Error(errorMessage);
    }
  }

  const deleteAsset = async (id: string) => {
    if (isOffline) {
      throw new Error("Cannot delete asset while offline");
    }

    try {
      // Eliminar el asset de la base de datos
      await assetService.delete(id);

      // Actualizar el estado local inmediatamente para una respuesta más rápida en la UI
      const updatedAssets = assetsRef.current.filter((a) => a.id !== id);
      assetsRef.current = updatedAssets;
      setAssets(updatedAssets);

      // Actualizar también portfolioWithPrices para que la UI se actualice
      const updatedPortfolio = portfolioWithPricesRef.current.map((ex) => ({
        ...ex,
        assets: ex.assets.filter((a) => a.id !== id),
      }));
      setPortfolioWithPrices(updatedPortfolio);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete asset";
      throw new Error(errorMessage);
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
    retryCount,
    isOffline,
    initialCapital,
    loadPortfolioData,
    updatePrices,
    refreshPrices,
    refreshData,
    addExchange,
    updateExchange,
    deleteExchange,
    addAsset,
    updateAsset,
    deleteAsset,
    updateInitialCapital: async (amount: number) => {
      const success = await userSettingsService.updateInitialCapital(amount);
      if (success) {
        setInitialCapital(amount);
        // Publicar evento para otros componentes
        eventBus.publish(EVENTS.SETTINGS_UPDATED, { initialCapital: amount });
        // Actualizar precios para reflejar el cambio
        await updatePrices();
      }
      return success;
    },
  }
}