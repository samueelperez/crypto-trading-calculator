import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/journal/stats
 * Obtiene estadísticas resumidas del diario de trading
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener estadísticas de entradas del diario
    const { data, error } = await supabase
      .from('journal_entries')
      .select('created_at, sentiment, mood')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Procesar datos para estadísticas
    const totalEntries = data.length;
    const moodCounts = data.reduce((acc: Record<string, number>, entry) => {
      if (entry.mood) {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      }
      return acc;
    }, {});
    
    const sentimentAverage = data.reduce((sum, entry) => {
      return sum + (entry.sentiment || 0);
    }, 0) / (totalEntries || 1);
    
    // Estadísticas por semana/mes
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const entriesLastWeek = data.filter(entry => 
      new Date(entry.created_at) >= oneWeekAgo
    ).length;
    
    const entriesLastMonth = data.filter(entry => 
      new Date(entry.created_at) >= oneMonthAgo
    ).length;
    
    return NextResponse.json({ 
      totalEntries,
      moodCounts,
      sentimentAverage,
      entriesLastWeek,
      entriesLastMonth
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del diario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 