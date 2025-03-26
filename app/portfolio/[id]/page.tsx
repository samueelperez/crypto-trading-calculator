// Importaciones necesarias
import React from 'react'
import { Metadata } from 'next'
import { getUserDetails } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Usar any para evitar errores de tipado en Next.js 15.1
export default async function PortfolioDetailPage({ params }: any) {
  // Verificar autenticación
  const user = await getUserDetails()
  if (!user) {
    redirect('/login')
  }

  const portfolioId = params.id

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Detalles del Portafolio</h1>
      <div className="p-4 bg-card rounded-lg shadow">
        <p>ID del Portafolio: {portfolioId}</p>
        {/* Aquí iría el contenido específico del portafolio */}
      </div>
    </div>
  )
}

// Metadata dinámica
export async function generateMetadata({ params }: any): Promise<Metadata> {
  return {
    title: `Portafolio ${params.id} | Crypto Trading Platform`,
    description: 'Detalles y seguimiento de tu portafolio de criptomonedas',
  }
} 