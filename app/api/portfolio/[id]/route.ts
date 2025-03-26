import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Params = { id: string }

// GET /api/portfolio/:id - Obtener detalles de un portafolio
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // Obtener datos del portafolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (portfolioError) {
      return NextResponse.json({ error: portfolioError.message }, { status: 500 })
    }
    
    if (!portfolio) {
      return NextResponse.json({ error: 'Portafolio no encontrado' }, { status: 404 })
    }
    
    // Llamar a la función para calcular el balance
    const { data: balance, error: balanceError } = await supabase
      .rpc('calculate_portfolio_balance', { portfolio_id: id })
    
    if (balanceError) {
      return NextResponse.json({ error: balanceError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      portfolio,
      balance: balance || []
    })
  } catch (error) {
    console.error('Error al obtener portafolio:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT /api/portfolio/:id - Actualizar un portafolio
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // Verificar que el portafolio pertenece al usuario
    const { data: existingPortfolio } = await supabase
      .from('portfolios')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (!existingPortfolio || existingPortfolio.user_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado o portafolio no encontrado' }, { status: 403 })
    }
    
    // Actualizar portafolio
    const { data, error } = await supabase
      .from('portfolios')
      .update(body)
      .eq('id', id)
      .select()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: 'Portafolio actualizado correctamente',
      portfolio: data[0]
    })
  } catch (error) {
    console.error('Error al actualizar portafolio:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE /api/portfolio/:id - Eliminar un portafolio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // Verificar que el portafolio pertenece al usuario
    const { data: existingPortfolio } = await supabase
      .from('portfolios')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (!existingPortfolio || existingPortfolio.user_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado o portafolio no encontrado' }, { status: 403 })
    }
    
    // Eliminar portafolio
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: 'Portafolio eliminado correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar portafolio:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 