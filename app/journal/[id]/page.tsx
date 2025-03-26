// Importaciones necesarias
import React from 'react'
import { Metadata } from 'next'
import { getUserDetails } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Usar any para evitar errores de tipado en Next.js 15.1
export default async function JournalEntryPage({ params }: any) {
  // Verificar autenticación
  const user = await getUserDetails()
  if (!user) {
    redirect('/login')
  }

  const entryId = params.id

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Entrada del Diario</h1>
      <div className="p-4 bg-card rounded-lg shadow">
        <p>ID de la entrada: {entryId}</p>
        {/* Aquí iría el contenido específico de la entrada */}
      </div>
    </div>
  )
}

// Metadata dinámica
export async function generateMetadata({ params }: any): Promise<Metadata> {
  return {
    title: `Entrada ${params.id} | Diario de Trading`,
    description: 'Detalles de tu entrada en el diario de trading',
  }
} 