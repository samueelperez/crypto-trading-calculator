import { redirect } from 'next/navigation'
import { getSession, getUserDetails } from '@/lib/supabase/server'

// Función para verificar autenticación en componentes de servidor
export async function requireAuth() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return session
}

// Función para obtener perfil completo de usuario autenticado
export async function requireAuthWithProfile() {
  const userDetails = await getUserDetails()
  
  if (!userDetails) {
    redirect('/login')
  }
  
  return userDetails
}

// Función para verificar si un usuario es administrador
export async function requireAdmin() {
  const userDetails = await getUserDetails()
  
  if (!userDetails || userDetails.profile?.role !== 'admin') {
    redirect('/dashboard')
  }
  
  return userDetails
} 