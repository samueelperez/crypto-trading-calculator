import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Obtener una entrada de journal por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const supabase = createClient();

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener la entrada de journal' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Entrada de journal no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en GET journal/[id]:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

// Actualizar una entrada de journal por ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const supabase = createClient();

    const { data, error } = await supabase
      .from('journal_entries')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error al actualizar la entrada de journal' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en PUT journal/[id]:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

// Eliminar una entrada de journal por ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const supabase = createClient();

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Error al eliminar la entrada de journal' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Entrada eliminada correctamente' }
    );
  } catch (error) {
    console.error('Error en DELETE journal/[id]:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}
