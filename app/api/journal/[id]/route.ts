import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

/**
 * GET /api/journal/:id
 * Recupera una entrada específica del diario por su ID
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id
    console.log(`GET /api/journal/${id}`)

    // Validar ID
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere un ID válido' },
        { status: 400 }
      )
    }

    // Crear cliente de Supabase usando el cliente local
    const supabase = createClient(cookies())

    // Obtener entrada por ID
    const { data: entry, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id as any)
      .single()

    // Manejar error de consulta
    if (error) {
      console.error(`Error al obtener entrada con ID ${id}:`, error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Entrada no encontrada' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: `Error al obtener entrada: ${error.message}` },
        { status: 400 }
      )
    }

    // Verificar si se encontró la entrada
    if (!entry) {
      return NextResponse.json(
        { error: 'Entrada no encontrada' },
        { status: 404 }
      )
    }

    // Devolver la entrada encontrada
    return NextResponse.json({ entry })
  } catch (e) {
    // Capturar y registrar cualquier error no manejado
    const error = e as Error
    console.error(`Error no manejado en GET /api/journal/[id]:`, error)
    return NextResponse.json(
      { error: `Error interno del servidor: ${error.message}` },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/journal/:id
 * Actualiza una entrada existente del diario
 */
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id
    console.log(`PUT /api/journal/${id}`)

    // Validar ID
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere un ID válido' },
        { status: 400 }
      )
    }

    // Parsear el cuerpo de la solicitud
    let body;
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: 'El cuerpo de la solicitud no es un JSON válido' },
        { status: 400 }
      )
    }

    console.log(`PUT /api/journal/${id} - Datos de actualización:`, body)

    // Crear cliente de Supabase usando el cliente local
    const supabase = createClient(cookies())

    // Verificar que la entrada existe
    const { data: existingEntry, error: fetchError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('id', id as any)
      .single()

    if (fetchError || !existingEntry) {
      console.error(`Error al verificar entrada con ID ${id}:`, fetchError)
      return NextResponse.json(
        { error: 'Entrada no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar la entrada
    const { data: updatedEntry, error: updateError } = await supabase
      .from('journal_entries')
      .update(body)
      .eq('id', id as any)
      .select()
      .single()

    // Manejar error de actualización
    if (updateError) {
      console.error(`Error al actualizar entrada con ID ${id}:`, updateError)
      return NextResponse.json(
        { error: `Error al actualizar entrada: ${updateError.message}` },
        { status: 400 }
      )
    }

    // Revalidar la ruta del journal para actualizar la vista
    revalidatePath('/journal')

    // Devolver la entrada actualizada
    console.log(`PUT /api/journal/${id} - Entrada actualizada correctamente`)
    return NextResponse.json({ entry: updatedEntry })
  } catch (e) {
    // Capturar y registrar cualquier error no manejado
    const error = e as Error
    console.error(`Error no manejado en PUT /api/journal/[id]:`, error)
    return NextResponse.json(
      { error: `Error interno del servidor: ${error.message}` },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/journal/:id
 * Elimina una entrada del diario
 */
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id
    console.log(`DELETE /api/journal/${id}`)

    // Validar ID
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere un ID válido' },
        { status: 400 }
      )
    }

    // Crear cliente de Supabase usando el cliente local
    const supabase = createClient(cookies())

    // Verificar que la entrada existe
    const { data: existingEntry, error: fetchError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('id', id as any)
      .single()

    if (fetchError || !existingEntry) {
      console.error(`Error al verificar entrada con ID ${id}:`, fetchError)
      return NextResponse.json(
        { error: 'Entrada no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar la entrada
    const { error: deleteError } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id as any)

    // Manejar error de eliminación
    if (deleteError) {
      console.error(`Error al eliminar entrada con ID ${id}:`, deleteError)
      return NextResponse.json(
        { error: `Error al eliminar entrada: ${deleteError.message}` },
        { status: 400 }
      )
    }

    // Revalidar la ruta del journal para actualizar la vista
    revalidatePath('/journal')

    // Devolver confirmación de eliminación
    return NextResponse.json({ message: 'Entrada eliminada correctamente' })
  } catch (e) {
    // Capturar y registrar cualquier error no manejado
    const error = e as Error
    console.error(`Error no manejado en DELETE /api/journal/[id]:`, error)
    return NextResponse.json(
      { error: `Error interno del servidor: ${error.message}` },
      { status: 500 }
    )
  }
} 