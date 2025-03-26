import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

// GET /api/journal - Obtener todas las entradas del diario
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // Obtener entradas del diario
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ entries: data })
  } catch (error) {
    console.error('Error al obtener entradas del diario:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/journal - Crear una nueva entrada en el diario
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const requestData = await request.json()
    
    // Insertar nueva entrada
    const { data, error } = await supabase
      .from('journal_entries')
      .insert([
        { 
          user_id: user.id,
          ...requestData 
        }
      ])
      .select()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ entry: data[0] })
  } catch (error) {
    console.error('Error al crear entrada del diario:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT /api/journal/:id - Actualizar una entrada existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const id = request.nextUrl.pathname.split('/').pop()
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID no proporcionado' },
        { status: 400 }
      )
    }
    
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // Verificar que la entrada pertenece al usuario
    const { data: existingEntry } = await supabase
      .from('journal_entries')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (!existingEntry || existingEntry.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado o entrada no encontrada' },
        { status: 403 }
      )
    }
    
    // Actualizar la entrada
    const { data, error } = await supabase
      .from('journal_entries')
      .update(body)
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('Error al actualizar entrada del diario:', error)
      return NextResponse.json(
        { error: 'Error al actualizar entrada' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Entrada actualizada correctamente',
      entry: data[0]
    })
  } catch (error) {
    console.error('Error en PUT /api/journal:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/journal/:id - Eliminar una entrada
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop()
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID no proporcionado' },
        { status: 400 }
      )
    }
    
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // Verificar que la entrada pertenece al usuario
    const { data: existingEntry } = await supabase
      .from('journal_entries')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (!existingEntry || existingEntry.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado o entrada no encontrada' },
        { status: 403 }
      )
    }
    
    // Eliminar la entrada
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error al eliminar entrada del diario:', error)
      return NextResponse.json(
        { error: 'Error al eliminar entrada' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Entrada eliminada correctamente'
    })
  } catch (error) {
    console.error('Error en DELETE /api/journal:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 