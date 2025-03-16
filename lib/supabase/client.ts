import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Obtener variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Error: Variables de entorno de Supabase no están definidas correctamente.',
    {
      supabaseUrl: supabaseUrl ? 'Definido' : 'No definido',
      supabaseKey: supabaseKey ? 'Definido' : 'No definido',
    }
  )
}

// Crear cliente de Supabase solo si tenemos las variables requeridas
export const supabase = supabaseUrl && supabaseKey 
  ? createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
  : null

// Función para verificar si las credenciales están disponibles
export function checkSupabaseCredentials(): boolean {
  return !!supabaseUrl && !!supabaseKey
}

// Función para obtener un cliente garantizado (lanza error si no está disponible)
export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Cliente Supabase no disponible. Verifica las variables de entorno.')
  }
  return supabase
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

