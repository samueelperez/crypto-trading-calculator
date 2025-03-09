import { supabase } from "./client"
import type { Exchange, Asset } from "@/types/portfolio"

// Función de utilidad para reintentos
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Si es el último intento, no esperar
      if (attempt === maxRetries) break

      // Si es un error de autorización, no reintentar
      if (error && typeof error === "object" && "code" in error) {
        if (
          error.code === "PGRST301" || // No autorizado
          error.code === "42501" || // Permiso denegado
          error.code === "3D000"
        ) {
          // Base de datos no existe
          break
        }
      }

      // Esperar con retardo exponencial
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)))
    }
  }

  throw lastError
}

// Servicio de Exchanges
export const exchangeService = {
  // Obtener todos los exchanges
  async getAll(): Promise<Exchange[]> {
    return withRetry(async () => {
      console.log("Attempting to fetch exchanges from Supabase...")

      try {
        // Hacer la consulta directamente sin verificación previa
        const { data, error } = await supabase.from("exchanges").select("*").order("name")

        if (error) {
          console.error("Error fetching exchanges:", error)

          // Verificar si es un error de permisos
          if (error.code === "PGRST301" || error.code === "42501") {
            throw new Error(`No tienes autorización para acceder a la tabla exchanges: ${error.message}`)
          }

          // Verificar si la tabla no existe
          if (error.code === "42P01") {
            throw new Error(`La tabla 'exchanges' no existe en la base de datos: ${error.message}`)
          }

          throw error
        }

        console.log(`Successfully fetched ${data?.length || 0} exchanges`)
        return data || []
      } catch (err) {
        console.error("Exception in getAll exchanges:", err)
        throw err
      }
    })
  },

  // Obtener un exchange por ID
  async getById(id: string): Promise<Exchange | null> {
    return withRetry(async () => {
      const { data, error } = await supabase.from("exchanges").select("*").eq("id", id).single()

      if (error) {
        console.error("Error fetching exchange by ID:", error)
        throw error
      }

      return data
    })
  },

  // Crear un nuevo exchange
  async create(exchange: Omit<Exchange, "id" | "created_at">): Promise<Exchange> {
    return withRetry(async () => {
      const { data, error } = await supabase.from("exchanges").insert([exchange]).select().single()

      if (error) {
        console.error("Error creating exchange:", error)
        throw error
      }

      return data
    })
  },

  // Actualizar un exchange existente
  async update(id: string, exchange: Partial<Exchange>): Promise<Exchange> {
    return withRetry(async () => {
      const { data, error } = await supabase.from("exchanges").update(exchange).eq("id", id).select().single()

      if (error) {
        console.error("Error updating exchange:", error)
        throw error
      }

      return data
    })
  },

  // Eliminar un exchange
  async delete(id: string): Promise<void> {
    return withRetry(async () => {
      const { error } = await supabase.from("exchanges").delete().eq("id", id)

      if (error) {
        console.error("Error deleting exchange:", error)
        throw error
      }
    })
  },
}

// Servicio de Assets
export const assetService = {
  // Obtener todos los assets
  async getAll(): Promise<Asset[]> {
    return withRetry(async () => {
      const { data, error } = await supabase.from("assets").select("*").order("symbol")

      if (error) {
        console.error("Error fetching assets:", error)
        throw error
      }

      return data || []
    })
  },

  // Obtener assets por exchange ID
  async getByExchangeId(exchangeId: string): Promise<Asset[]> {
    return withRetry(async () => {
      const { data, error } = await supabase.from("assets").select("*").eq("exchange_id", exchangeId).order("symbol")

      if (error) {
        console.error("Error fetching assets by exchange ID:", error)
        throw error
      }

      return data || []
    })
  },

  // Obtener un asset por ID
  async getById(id: string): Promise<Asset | null> {
    return withRetry(async () => {
      const { data, error } = await supabase.from("assets").select("*").eq("id", id).single()

      if (error) {
        console.error("Error fetching asset by ID:", error)
        throw error
      }

      return data
    })
  },

  // Crear un nuevo asset
  async create(asset: Omit<Asset, "id" | "last_updated">): Promise<Asset> {
    return withRetry(async () => {
      const assetWithTimestamp = {
        ...asset,
        last_updated: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("assets").insert([assetWithTimestamp]).select().single()

      if (error) {
        console.error("Error creating asset:", error)
        throw error
      }

      return data
    })
  },

  // Actualizar un asset existente
  async update(id: string, asset: Partial<Asset>): Promise<Asset> {
    return withRetry(async () => {
      console.log("Updating asset with ID:", id, "Data:", asset)

      // If we're updating the logo, keep other asset properties
      const updatePayload = {
        ...asset,
        // Only add last_updated if we're not just updating the logo
        ...(asset.logo_url && Object.keys(asset).length === 1 ? {} : { last_updated: new Date().toISOString() }),
      }

      const { data, error } = await supabase.from("assets").update(updatePayload).eq("id", id).select().single()

      if (error) {
        console.error("Error updating asset:", error)
        throw error
      }

      console.log("Asset updated successfully:", data)
      return data
    })
  },

  // Eliminar un asset
  async delete(id: string): Promise<void> {
    return withRetry(async () => {
      const { error } = await supabase.from("assets").delete().eq("id", id)

      if (error) {
        console.error("Error deleting asset:", error)
        throw error
      }
    })
  },
}

