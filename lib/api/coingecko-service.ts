// Cache para almacenar resultados y reducir llamadas a la API
let coinListCache: CoinInfo[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 1000 * 60 * 60 // 1 hora

export interface CoinInfo {
  id: string
  symbol: string
  name: string
  image: string
  current_price?: number
}

// Configuration flag to completely disable API calls
const USE_MOCK_DATA_ONLY = true

// Clase del servicio
class CoinGeckoService {
  // Método para obtener lista de monedas
  async getCoinsList(): Promise<CoinInfo[]> {
    const now = Date.now()

    // Usar caché si está disponible y es reciente
    if (coinListCache && now - lastFetchTime < CACHE_DURATION) {
      return coinListCache
    }

    try {
      // Always use mock data in this environment to avoid CORS issues
      const data = await simulateCoinGeckoAPI()

      // Actualizar caché
      coinListCache = data
      lastFetchTime = now

      return data
    } catch (error) {
      console.error("Error fetching coins list:", error)
      // Si hay un error pero tenemos caché, usarla aunque esté vencida
      if (coinListCache) return coinListCache
      throw error
    }
  }

  // Método para buscar monedas
  async searchCoins(term: string): Promise<CoinInfo[]> {
    if (!term.trim()) return []

    const coins = await this.getCoinsList()
    const lowerTerm = term.toLowerCase()

    // Caso especial para USDT y otras stablecoins
    if (lowerTerm === "usdt" || lowerTerm === "tether") {
      const usdt = coins.find((coin) => coin.symbol.toLowerCase() === "usdt" || coin.id.toLowerCase() === "tether")
      if (usdt) {
        return [
          usdt,
          ...coins.filter(
            (coin) =>
              coin.id !== "tether" &&
              coin.symbol.toLowerCase() !== "usdt" &&
              (coin.symbol.toLowerCase().includes(lowerTerm) || coin.name.toLowerCase().includes(lowerTerm)),
          ),
        ].slice(0, 10)
      }
    }

    // Filtrar por símbolo o nombre
    return coins.filter(
      (coin) => coin.symbol.toLowerCase().includes(lowerTerm) || coin.name.toLowerCase().includes(lowerTerm),
    )
  }
}

// Función para simular datos de la API de CoinGecko
async function simulateCoinGeckoAPI(): Promise<CoinInfo[]> {
  // Simular un pequeño retraso de red
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Lista de las principales criptomonedas con sus logos
  return [
    {
      id: "bitcoin",
      symbol: "btc",
      name: "Bitcoin",
      image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
      current_price: 42000,
    },
    {
      id: "ethereum",
      symbol: "eth",
      name: "Ethereum",
      image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
      current_price: 2300,
    },
    {
      id: "tether",
      symbol: "usdt",
      name: "Tether",
      image: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
      current_price: 1,
    },
    {
      id: "usd-coin",
      symbol: "usdc",
      name: "USD Coin",
      image: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
      current_price: 1,
    },
    {
      id: "binancecoin",
      symbol: "bnb",
      name: "BNB",
      image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
      current_price: 320,
    },
    {
      id: "solana",
      symbol: "sol",
      name: "Solana",
      image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
      current_price: 95,
    },
    {
      id: "ripple",
      symbol: "xrp",
      name: "XRP",
      image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
      current_price: 0.52,
    },
    {
      id: "cardano",
      symbol: "ada",
      name: "Cardano",
      image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
      current_price: 0.43,
    },
    {
      id: "dogecoin",
      symbol: "doge",
      name: "Dogecoin",
      image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
      current_price: 0.12,
    },
    {
      id: "polkadot",
      symbol: "dot",
      name: "Polkadot",
      image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png",
      current_price: 7.1,
    },
    {
      id: "avalanche-2",
      symbol: "avax",
      name: "Avalanche",
      image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
      current_price: 30,
    },
    {
      id: "matic-network",
      symbol: "matic",
      name: "Polygon",
      image: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png",
      current_price: 1.2,
    },
    {
      id: "chainlink",
      symbol: "link",
      name: "Chainlink",
      image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
      current_price: 15,
    },
    {
      id: "litecoin",
      symbol: "ltc",
      name: "Litecoin",
      image: "https://assets.coingecko.com/coins/images/2/large/litecoin.png",
      current_price: 80,
    },
    {
      id: "uniswap",
      symbol: "uni",
      name: "Uniswap",
      image: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png",
      current_price: 7,
    },
    {
      id: "stellar",
      symbol: "xlm",
      name: "Stellar",
      image: "https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png",
      current_price: 0.12,
    },
    {
      id: "cosmos",
      symbol: "atom",
      name: "Cosmos",
      image: "https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png",
      current_price: 10,
    },
    {
      id: "tron",
      symbol: "trx",
      name: "TRON",
      image: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png",
      current_price: 0.09,
    },
    {
      id: "monero",
      symbol: "xmr",
      name: "Monero",
      image: "https://assets.coingecko.com/coins/images/69/large/monero_logo.png",
      current_price: 160,
    },
    {
      id: "algorand",
      symbol: "algo",
      name: "Algorand",
      image: "https://assets.coingecko.com/coins/images/4380/large/download.png",
      current_price: 0.2,
    },
    {
      id: "filecoin",
      symbol: "fil",
      name: "Filecoin",
      image: "https://assets.coingecko.com/coins/images/12817/large/filecoin.png",
      current_price: 5,
    },
    {
      id: "tezos",
      symbol: "xtz",
      name: "Tezos",
      image: "https://assets.coingecko.com/coins/images/976/large/Tezos-logo.png",
      current_price: 1.1,
    },
    {
      id: "aave",
      symbol: "aave",
      name: "Aave",
      image: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png",
      current_price: 90,
    },
    {
      id: "maker",
      symbol: "mkr",
      name: "Maker",
      image: "https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png",
      current_price: 1500,
    },
    {
      id: "compound-governance-token",
      symbol: "comp",
      name: "Compound",
      image: "https://assets.coingecko.com/coins/images/10775/large/COMP.png",
      current_price: 50,
    },
    {
      id: "synthetix-network-token",
      symbol: "snx",
      name: "Synthetix",
      image: "https://assets.coingecko.com/coins/images/3406/large/SNX.png",
      current_price: 3,
    },
    {
      id: "yearn-finance",
      symbol: "yfi",
      name: "yearn.finance",
      image: "https://assets.coingecko.com/coins/images/11849/large/yfi-192x192.png",
      current_price: 8000,
    },
    {
      id: "decentraland",
      symbol: "mana",
      name: "Decentraland",
      image: "https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png",
      current_price: 0.4,
    },
    {
      id: "the-sandbox",
      symbol: "sand",
      name: "The Sandbox",
      image: "https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg",
      current_price: 0.5,
    },
    {
      id: "axie-infinity",
      symbol: "axs",
      name: "Axie Infinity",
      image: "https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png",
      current_price: 7,
    },
  ]
}

// Exportar una instancia del servicio para uso en toda la aplicación
export const coinGeckoService = new CoinGeckoService()

