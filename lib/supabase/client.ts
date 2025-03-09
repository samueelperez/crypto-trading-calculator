import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Replace the current supabase client creation with a singleton pattern

// Create a singleton instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null

// Usar valores por defecto para evitar errores durante la inicialización
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Function to get the Supabase client instance
export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance

  // Create a new instance if one doesn't exist
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return supabaseInstance
})()

// Función para verificar si las credenciales están configuradas
export function checkSupabaseCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Verificar que las variables existan y no estén vacías
  return Boolean(url && url.trim() !== "" && key && key.trim() !== "")
}

// Función para verificar si el cliente tiene acceso a la base de datos
export async function testSupabaseConnection() {
  try {
    // Intentar una consulta simple para verificar la conexión
    const { data, error } = await supabase.from("exchanges").select("count", { count: "exact", head: true })

    if (error) {
      console.error("Error testing Supabase connection:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error("Exception testing Supabase connection:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error connecting to Supabase",
    }
  }
}

