import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// GET /api/journal - Obtener todas las entradas del diario
export async function GET(request: NextRequest) {
  try {
    // Extraer parámetros de consulta
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const asset = searchParams.get('asset')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : undefined

    console.log('GET /api/journal - Parámetros:', { status, type, asset, startDate, endDate, limit })

    // Crear cliente de Supabase
    const supabase = createClient(cookies())

    // Construir consulta
    let query = supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false })

    // Aplicar filtros si existen
    if (status) {
      query = query.eq('status', status)
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (asset) {
      query = query.ilike('asset', `%${asset}%`)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    if (limit) {
      query = query.limit(limit)
    }

    // Ejecutar consulta
    const { data: entries, error } = await query

    // Manejar errores de la consulta
    if (error) {
      console.error('Error al obtener entradas del journal:', error)
      return NextResponse.json(
        { error: `Error al obtener entradas del journal: ${error.message}` },
        { status: 400 }
      )
    }

    // Devolver resultados
    console.log(`GET /api/journal - Se encontraron ${entries?.length || 0} entradas`)
    return NextResponse.json({ entries: entries || [] })
  } catch (e) {
    // Capturar y registrar cualquier error no manejado
    const error = e as Error
    console.error('Error no manejado en GET /api/journal:', error)
    return NextResponse.json(
      { error: `Error interno del servidor: ${error.message}` },
      { status: 500 }
    )
  }
}

// POST /api/journal - Crear una nueva entrada en el diario
export async function POST(request: NextRequest) {
  try {
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

    console.log('POST /api/journal - Datos recibidos:', body)

    // Validar campos requeridos
    const requiredFields = [
      'type', 'asset', 'entry_price', 'stop_loss', 
      'position_size', 'leverage', 'risk_amount', 'risk_percentage', 'status'
    ]
    
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json(
          { error: `Falta el campo requerido: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validar valores numéricos
    const numericFields = ['entry_price', 'stop_loss', 'position_size', 'leverage', 'risk_amount', 'risk_percentage']
    for (const field of numericFields) {
      if (isNaN(Number(body[field]))) {
        return NextResponse.json(
          { error: `El campo ${field} debe ser un número válido` },
          { status: 400 }
        )
      }
    }

    // Validar status
    if (!['planned', 'open', 'closed', 'cancelled'].includes(body.status)) {
      return NextResponse.json(
        { error: 'El estado debe ser uno de: planned, open, closed, cancelled' },
        { status: 400 }
      )
    }

    // Crear cliente de Supabase
    const supabase = createClient(cookies())

    // Guardar en la base de datos
    const entryData = {
      type: body.type,
      asset: body.asset,
      entry_price: body.entry_price,
      stop_loss: body.stop_loss,
      take_profit: body.take_profit || null,
      position_size: body.position_size,
      leverage: body.leverage,
      risk_amount: body.risk_amount,
      risk_percentage: body.risk_percentage,
      status: body.status,
      notes: body.notes || null,
      exit_price: body.exit_price || null,
      profit_loss: body.profit_loss || null,
      created_at: new Date().toISOString(),
      closed_at: body.closed_at || null,
    }

    const { data: entry, error } = await supabase
      .from('journal_entries')
      .insert(entryData)
      .select()
      .single()

    // Manejar errores de la inserción
    if (error) {
      console.error('Error al insertar entrada en el journal:', error)
      return NextResponse.json(
        { error: `Error al crear entrada: ${error.message}` },
        { status: 400 }
      )
    }

    // Revalidar la ruta del journal para actualizar la vista
    revalidatePath('/journal')

    // Devolver la entrada creada
    console.log('POST /api/journal - Entrada creada con ID:', entry?.id)
    return NextResponse.json({ entry }, { status: 201 })
  } catch (e) {
    // Capturar y registrar cualquier error no manejado
    const error = e as Error
    console.error('Error no manejado en POST /api/journal:', error)
    return NextResponse.json(
      { error: `Error interno del servidor: ${error.message}` },
      { status: 500 }
    )
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