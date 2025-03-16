import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/journal/stats
 * Obtiene estadísticas resumidas del diario de trading
 */
export async function GET() {
  try {
    console.log('GET /api/journal/stats');

    // Crear cliente de Supabase usando el cliente local
    const supabase = createClient(cookies());

    // Obtener todas las operaciones cerradas
    const { data: closedTrades, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('status', 'closed')
      .order('created_at', { ascending: false });

    // Manejar error de consulta
    if (error) {
      console.error('Error al obtener operaciones cerradas:', error);
      return NextResponse.json(
        { error: `Error al obtener estadísticas: ${error.message}` },
        { status: 400 }
      );
    }

    // Si no hay operaciones cerradas, devolver estadísticas vacías
    if (!closedTrades || closedTrades.length === 0) {
      console.log('No hay operaciones cerradas para calcular estadísticas');
      return NextResponse.json({
        stats: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          averageProfit: 0,
          averageLoss: 0,
          profitLossRatio: 0,
          totalProfitLoss: 0,
        }
      });
    }

    console.log(`Calculando estadísticas para ${closedTrades.length} operaciones cerradas`);

    // Calcular estadísticas
    const winningTrades = closedTrades.filter(trade => (trade.profit_loss || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.profit_loss || 0) <= 0);
    
    const totalProfitLoss = closedTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
    
    const averageProfit = winningTrades.length 
      ? winningTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0) / winningTrades.length 
      : 0;
    
    const averageLoss = losingTrades.length 
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0)) / losingTrades.length 
      : 0;
    
    // Encontrar la mejor y peor operación
    let bestTrade = null;
    let worstTrade = null;
    
    if (closedTrades.length > 0) {
      bestTrade = closedTrades.reduce((best, trade) => 
        (trade.profit_loss || 0) > (best.profit_loss || 0) ? trade : best, closedTrades[0]);
      
      worstTrade = closedTrades.reduce((worst, trade) => 
        (trade.profit_loss || 0) < (worst.profit_loss || 0) ? trade : worst, closedTrades[0]);
    }
    
    const stats = {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / closedTrades.length) * 100,
      averageProfit,
      averageLoss,
      profitLossRatio: averageLoss ? averageProfit / averageLoss : 0,
      totalProfitLoss,
      bestTrade,
      worstTrade,
    };
    
    console.log('Estadísticas calculadas:', {
      totalTrades: stats.totalTrades,
      winningTrades: stats.winningTrades,
      losingTrades: stats.losingTrades,
      winRate: stats.winRate.toFixed(2) + '%',
      totalProfitLoss: stats.totalProfitLoss.toFixed(2),
    });
    
    // Devolver estadísticas
    return NextResponse.json({ stats });
  } catch (e) {
    // Capturar y registrar cualquier error no manejado
    const error = e as Error;
    console.error('Error no manejado en GET /api/journal/stats:', error);
    return NextResponse.json(
      { error: `Error interno del servidor: ${error.message}` },
      { status: 500 }
    );
  }
} 