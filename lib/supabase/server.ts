import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Database } from "../database.types"

/**
 * Crea un cliente de Supabase para usar en el servidor
 */
export function createClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: { path: string; maxAge: number; domain?: string }) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookies in read-only mode (e.g. in middleware)
            console.error('Error setting cookie', error)
          }
        },
        remove(name: string, options: { path: string; domain?: string }) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
            // Handle cookies in read-only mode
            console.error('Error removing cookie', error)
          }
        },
      },
    }
  )
}

