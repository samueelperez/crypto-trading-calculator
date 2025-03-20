import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// GET: Obtener una entrada de journal por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Convertir el string ID a UUID o número según corresponda
    const entryId = params.id
    
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .match({ id: entryId })
      .single()

    if (error) {
      console.error('Error al obtener entrada:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Entrada no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en GET journal/[id]:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar una entrada de journal
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const entryId = params.id

    const { data, error } = await supabase
      .from('journal_entries')
      .update(body)
      .match({ id: entryId })
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar entrada:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en PUT journal/[id]:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar una entrada de journal
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const entryId = params.id

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .match({ id: entryId })

    if (error) {
      console.error('Error al eliminar entrada:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Entrada eliminada correctamente' })
  } catch (error) {
    console.error('Error en DELETE journal/[id]:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
