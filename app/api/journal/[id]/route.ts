import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Simplificar al máximo la definición de los handlers
export async function GET(request: NextRequest, { params }: any) {
  try {
    const id = params.id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // Obtener entrada específica
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ entry: data })
  } catch (error) {
    console.error('Error al obtener entrada del diario:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT: Actualizar una entrada de journal
export async function PUT(request: NextRequest, { params }: any) {
  try {
    const id = params.id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const requestData = await request.json()
    
    // Actualizar entrada
    const { data, error } = await supabase
      .from('journal_entries')
      .update(requestData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ entry: data[0] })
  } catch (error) {
    console.error('Error al actualizar entrada del diario:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE: Eliminar una entrada de journal
export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const id = params.id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // Eliminar entrada
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar entrada del diario:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
