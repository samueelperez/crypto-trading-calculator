import { createClient } from "@supabase/supabase-js"
import { createBrowserClient } from '@supabase/ssr'
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

// Cliente para uso en componentes del lado del cliente
export const createClientBrowser = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Obtener la sesión actual en el navegador
export const getClientSession = async () => {
  const supabase = createClientBrowser()
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error("Error al obtener sesión en cliente:", error.message)
      return null
    }
    return session
  } catch (error) {
    console.error("Error inesperado al obtener sesión en cliente:", error)
    return null
  }
}

// Obtener el usuario actual en el navegador
export const getClientUser = async () => {
  const supabase = createClientBrowser()
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error("Error al obtener usuario en cliente:", error.message)
      return null
    }
    return user
  } catch (error) {
    console.error("Error inesperado al obtener usuario en cliente:", error)
    return null
  }
}

