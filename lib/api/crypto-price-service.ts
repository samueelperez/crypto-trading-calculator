import type { CryptoPrice } from "@/types/portfolio"

// Cache de precios para reducir llamadas innecesarias a la API
const priceCache: Record<string, { price: CryptoPrice; timestamp: number }> = {}
// Increase the cache TTL significantly
const CACHE_TTL = 300000 // 5 minutes

// Configuration flag to completely disable API calls
const USE_MOCK_DATA_ONLY = true // Set to true to avoid all external API calls

// Lista de stablecoins conocidas (todas deberían valer $1.00)
const STABLECOINS = [
  'usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdp', 'usdd', 'gusd', 'frax', 'lusd', 'susd'
];

/**
 * Verifica si un símbolo pertenece a una stablecoin conocida
 */
const isStablecoin = (symbol: string): boolean => {
  return STABLECOINS.includes(symbol.toLowerCase());
};

export const cryptoPriceService = {
  // Obtener precios actuales para una lista de símbolos
  async getPrices(symbols: string[]): Promise<Record<string, CryptoPrice>> {
    console.log("CryptoPriceService: Getting prices for", symbols);
    
    // Si no hay símbolos, retornar objeto vacío
    if (!symbols || symbols.length === 0) {
      return {};
    }
    
    // Verificar si podemos usar la caché
    const now = Date.now();
    const cachedPrices: Record<string, CryptoPrice> = {};
    let needToFetchSymbols: string[] = [];
    
    // Verificar qué símbolos necesitamos obtener
    for (const symbol of symbols) {
      // Si es una stablecoin, usamos precio fijo de $1.00
      if (isStablecoin(symbol)) {
        cachedPrices[symbol] = {
          current_price: 1.0,
          price_change_percentage_24h: 0,
          last_updated: new Date().toISOString(),
          is_stablecoin: true
        };
        continue;
      }
      
      // Para otras cryptos, revisamos la caché
      const cacheKey = `price_${symbol.toLowerCase()}`;
      const cachedItem = priceCache[symbol];
      
      if (cachedItem && now - cachedItem.timestamp < CACHE_TTL) {
        cachedPrices[symbol] = cachedItem.price;
      } else {
        needToFetchSymbols.push(symbol);
      }
    }
    
    // Si todos los símbolos están en caché, retornar inmediatamente
    if (needToFetchSymbols.length === 0) {
      return cachedPrices;
    }
    
    try {
      // Filtrar símbolos que necesitan actualización
      const symbolsToFetch = needToFetchSymbols.filter(
        (symbol) => !priceCache[symbol] || now - priceCache[symbol].timestamp > CACHE_TTL,
      )

      if (symbolsToFetch.length > 0) {
        // Always use mock data in this environment to avoid CORS issues
        const data = await simulatePriceApiCall(symbolsToFetch)

        // Actualizar cache
        data.forEach((price) => {
          priceCache[price.symbol] = {
            price,
            timestamp: now,
          }
        })
      }

      // Construir respuesta con todos los precios
      const result: Record<string, CryptoPrice> = {}
      symbols.forEach((symbol) => {
        if (priceCache[symbol]) {
          result[symbol] = priceCache[symbol].price
        }
      })

      return result
    } catch (error) {
      console.error("Error fetching crypto prices:", error)
      // Return cached data if available, otherwise return empty object
      const result: Record<string, CryptoPrice> = {}
      symbols.forEach((symbol) => {
        if (priceCache[symbol]) {
          result[symbol] = priceCache[symbol].price
        }
      })
      return result
    }
  },

  // Obtener precio para un símbolo específico
  async getPrice(symbol: string): Promise<CryptoPrice | null> {
    try {
      const prices = await this.getPrices([symbol])
      return prices[symbol] || null
    } catch (error) {
      console.error(`Error getting price for ${symbol}:`, error)
      // Return cached price if available
      return priceCache[symbol]?.price || null
    }
  },

  // Forzar actualización del cache
  invalidateCache() {
    Object.keys(priceCache).forEach((key) => {
      delete priceCache[key]
    })
  },
}

// Función auxiliar para simular llamada a API
async function simulatePriceApiCall(symbols: string[]): Promise<CryptoPrice[]> {
  // Simulamos un retraso para imitar una API real, but shorter
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Generamos precios simulados
  return symbols.map((symbol) => {
    // Precios base para algunas criptomonedas comunes
    const basePrices: Record<string, number> = {
      BTC: 42000,
      ETH: 2300,
      BNB: 350,
      SOL: 95,
      XRP: 0.5,
      ADA: 0.55,
      DOGE: 0.08,
      DOT: 12,
      AVAX: 30,
      MATIC: 1.2,
      LINK: 15,
      UNI: 7,
      LTC: 80,
      SNX: 3.5,
      ATOM: 10,
      ALGO: 0.2,
      FIL: 5,
      NEAR: 4,
      FTM: 0.5,
      AAVE: 90,
      MKR: 1500,
      COMP: 50,
      YFI: 8000,
      SUSHI: 1.2,
      CRV: 0.6,
      BAL: 5.5,
      REN: 0.15,
      KNC: 0.7,
      ZRX: 0.3,
      BAND: 1.5,
      OCEAN: 0.4,
      ALPHA: 0.1,
      BADGER: 2.5,
      PERP: 0.8,
      RUNE: 4.2,
      LUNA: 0.5,
      CAKE: 2.3,
      "1INCH": 0.4,
      REEF: 0.005,
      ANKR: 0.03,
      SAND: 0.5,
      MANA: 0.4,
      AXS: 7,
      THETA: 1.2,
      VET: 0.03,
      HBAR: 0.07,
      EGLD: 45,
      ICP: 8,
      FLOW: 0.8,
      EOS: 0.7,
      NEO: 12,
      KSM: 40,
      DASH: 35,
      ZEC: 30,
      XMR: 160,
      USDT: 1,
      USDC: 1,
      DAI: 1,
      BUSD: 1,
      UST: 1,
      TUSD: 1,
      USDP: 1,
      GUSD: 1,
      USDN: 1,
      FRAX: 1,
    }

    // Imágenes para algunas criptomonedas comunes
    const images: Record<string, string> = {
      BTC: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
      ETH: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
      BNB: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
      SOL: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
      XRP: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
      ADA: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
      DOGE: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
      DOT: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png",
      AVAX: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
      MATIC: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png",
      LINK: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
      UNI: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png",
      LTC: "https://assets.coingecko.com/coins/images/2/large/litecoin.png",
      SNX: "https://assets.coingecko.com/coins/images/3406/large/SNX.png",
      USDT: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
      USDC: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
      DAI: "https://assets.coingecko.com/coins/images/9956/large/4943.png",
      BUSD: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png",
    }

    // Precio base o aleatorio si no está en la lista
    const basePrice = basePrices[symbol.toUpperCase()] || 10 + Math.random() * 100

    // Añadir variación aleatoria de ±3%
    const randomVariation = Math.random() * 6 - 3
    const price = basePrice * (1 + randomVariation / 100)

    return {
      id: symbol.toLowerCase(),
      symbol: symbol.toUpperCase(),
      name: getCryptoName(symbol) || `${symbol.toUpperCase()} Coin`,
      current_price: price,
      price_change_percentage_24h: randomVariation,
      last_updated: new Date().toISOString(),
      image:
        images[symbol.toUpperCase()] ||
        `https://ui-avatars.com/api/?name=${symbol.toUpperCase()}&background=random&color=fff&size=128&bold=true`,
    }
  })
}

// Nombres para algunas criptomonedas comunes
function getCryptoName(symbol: string): string | null {
  const names: Record<string, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    BNB: "Binance Coin",
    SOL: "Solana",
    XRP: "XRP",
    ADA: "Cardano",
    DOGE: "Dogecoin",
    DOT: "Polkadot",
    AVAX: "Avalanche",
    MATIC: "Polygon",
    LINK: "Chainlink",
    UNI: "Uniswap",
    LTC: "Litecoin",
    SNX: "Synthetix",
    ATOM: "Cosmos",
    ALGO: "Algorand",
    FIL: "Filecoin",
    NEAR: "NEAR Protocol",
    FTM: "Fantom",
    AAVE: "Aave",
    MKR: "Maker",
    COMP: "Compound",
    YFI: "yearn.finance",
    SUSHI: "SushiSwap",
    CRV: "Curve DAO Token",
    BAL: "Balancer",
    REN: "Ren",
    KNC: "Kyber Network Crystal",
    ZRX: "0x",
    BAND: "Band Protocol",
    OCEAN: "Ocean Protocol",
    ALPHA: "Alpha Finance Lab",
    BADGER: "Badger DAO",
    PERP: "Perpetual Protocol",
    RUNE: "THORChain",
    LUNA: "Terra",
    CAKE: "PancakeSwap",
    "1INCH": "1inch",
    REEF: "Reef",
    ANKR: "Ankr",
    SAND: "The Sandbox",
    MANA: "Decentraland",
    AXS: "Axie Infinity",
    THETA: "Theta Network",
    VET: "VeChain",
    HBAR: "Hedera",
    EGLD: "MultiversX",
    ICP: "Internet Computer",
    FLOW: "Flow",
    EOS: "EOS",
    NEO: "NEO",
    KSM: "Kusama",
    DASH: "Dash",
    ZEC: "Zcash",
    XMR: "Monero",
    USDT: "Tether",
    USDC: "USD Coin",
    DAI: "Dai",
    BUSD: "Binance USD",
    UST: "TerraUSD",
    TUSD: "TrueUSD",
    USDP: "Pax Dollar",
    GUSD: "Gemini Dollar",
    USDN: "Neutrino USD",
    FRAX: "Frax",
  }

  return names[symbol.toUpperCase()] || null
}

