/**
 * Servicio para gestionar las entradas del diario de trading (journal)
 */

import { SupabaseClient } from '@supabase/supabase-js';

// Tipos para las entradas del journal
export interface JournalEntry {
  id?: string;
  user_id?: string;
  type: 'long' | 'short';
  asset: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number | null;
  position_size: number;
  leverage: number;
  risk_amount: number;
  risk_percentage: number;
  exit_price?: number | null;
  profit_loss?: number | null;
  status: 'planned' | 'open' | 'closed' | 'cancelled';
  notes?: string;
  created_at?: string;
  closed_at?: string | null;
}

export interface JournalFilter {
  status?: 'planned' | 'open' | 'closed' | 'cancelled';
  type?: 'long' | 'short';
  asset?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// Función auxiliar para manejar respuestas JSON de manera segura
async function handleJsonResponse<T>(response: Response, defaultValue: T): Promise<T> {
  try {
    // Si la respuesta no es exitosa, lanzar un error
    if (!response.ok) {
      let errorMessage = `Error HTTP: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            // Si no podemos analizar como JSON, usar el texto de error directamente
            errorMessage = errorText;
          }
        }
      } catch (e) {
        console.error('No se pudo obtener el texto de error:', e);
      }
      throw new Error(errorMessage);
    }

    // Verificar el tipo de contenido
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('La respuesta no es JSON:', contentType);
      return defaultValue;
    }

    // Obtener el texto de la respuesta
    const text = await response.text();
    
    // Si la respuesta está vacía, devolver el valor predeterminado
    if (!text || text.trim() === '') {
      console.warn('La respuesta está vacía');
      return defaultValue;
    }

    // Intentar analizar el texto como JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Error al analizar JSON:', e, 'Texto recibido:', text);
      throw new Error('Error al analizar la respuesta JSON del servidor');
    }
  } catch (error) {
    console.error('Error en handleJsonResponse:', error);
    throw error;
  }
}

/**
 * Obtiene todas las entradas del diario de trading con filtros opcionales
 */
export async function getJournalEntries(filters: JournalFilter = {}): Promise<JournalEntry[]> {
  try {
    console.log('Obteniendo entradas del journal con filtros:', filters);
    
    // Construir los parámetros de consulta a partir de los filtros
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.asset) queryParams.append('asset', filters.asset);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const url = `/api/journal${queryString}`;
    
    console.log('Realizando petición GET a:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    
    console.log('Estado de la respuesta:', response.status, response.statusText);
    
    const data = await handleJsonResponse<{ entries?: JournalEntry[] }>(response, { entries: [] });
    
    // Asegurarnos de que entries siempre sea un array, incluso si la API devuelve null o undefined
    const entries = data.entries || [];
    console.log(`Se obtuvieron ${entries.length} entradas del journal`);
    
    return entries;
  } catch (error) {
    console.error('Error en getJournalEntries:', error);
    // En caso de error, devolvemos un array vacío en lugar de propagar el error
    return [];
  }
}

/**
 * Obtiene una entrada específica del diario por su ID
 */
export async function getJournalEntry(id: string): Promise<JournalEntry> {
  try {
    console.log('Obteniendo entrada del journal con ID:', id);
    
    const response = await fetch(`/api/journal/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    
    console.log('Estado de la respuesta:', response.status, response.statusText);
    
    const data = await handleJsonResponse<{ entry?: JournalEntry }>(response, { entry: undefined });
    
    if (!data.entry) {
      throw new Error('No se encontró la entrada del diario con el ID especificado');
    }
    
    return data.entry;
  } catch (error) {
    console.error('Error en getJournalEntry:', error);
    throw error;
  }
}

/**
 * Crea una nueva entrada en el diario de trading
 */
export async function createJournalEntry(
  entry: Omit<JournalEntry, 'id' | 'user_id' | 'created_at'>
): Promise<JournalEntry> {
  try {
    console.log('Creando nueva entrada en el journal:', entry);
    
    const response = await fetch('/api/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    
    console.log('Estado de la respuesta:', response.status, response.statusText);
    
    const data = await handleJsonResponse<{ entry?: JournalEntry }>(response, { entry: undefined });
    
    if (!data.entry) {
      throw new Error('La respuesta no contiene la entrada creada');
    }
    
    return data.entry;
  } catch (error) {
    console.error('Error en createJournalEntry:', error);
    throw error;
  }
}

/**
 * Actualiza una entrada existente en el diario
 */
export async function updateJournalEntry(
  id: string,
  updates: Partial<JournalEntry>
): Promise<JournalEntry> {
  try {
    console.log('Actualizando entrada del journal con ID:', id, 'Actualizaciones:', updates);
    
    const response = await fetch(`/api/journal/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    console.log('Estado de la respuesta:', response.status, response.statusText);
    
    const data = await handleJsonResponse<{ entry?: JournalEntry }>(response, { entry: undefined });
    
    if (!data.entry) {
      throw new Error('La respuesta no contiene la entrada actualizada');
    }
    
    return data.entry;
  } catch (error) {
    console.error('Error en updateJournalEntry:', error);
    throw error;
  }
}

/**
 * Elimina una entrada del diario
 */
export async function deleteJournalEntry(id: string): Promise<{ message: string }> {
  try {
    console.log('Eliminando entrada del journal con ID:', id);
    
    const response = await fetch(`/api/journal/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Estado de la respuesta:', response.status, response.statusText);
    
    const data = await handleJsonResponse<{ message?: string }>(response, { message: 'Entrada eliminada' });
    
    return { message: data.message || 'Entrada eliminada' };
  } catch (error) {
    console.error('Error en deleteJournalEntry:', error);
    throw error;
  }
}

/**
 * Cierra una operación abierta
 */
export async function closeTradeEntry(
  id: string, 
  closePrice: number, 
  notes?: string
): Promise<JournalEntry> {
  try {
    console.log('Cerrando operación con ID:', id, 'Precio de cierre:', closePrice);
    
    // Primero obtener la entrada para calcular el resultado
    const entry = await getJournalEntry(id);
    
    // Verificar que se puede cerrar
    if (entry.status !== 'open') {
      throw new Error('Solo se pueden cerrar operaciones abiertas');
    }
    
    // Calcular profit/loss
    let profitLoss = 0;
    
    if (entry.type === 'long') {
      // Para posiciones largas: (precio_salida - precio_entrada) / precio_entrada * tamaño_posición
      profitLoss = ((closePrice - entry.entry_price) / entry.entry_price) * entry.position_size;
    } else {
      // Para posiciones cortas: (precio_entrada - precio_salida) / precio_entrada * tamaño_posición
      profitLoss = ((entry.entry_price - closePrice) / entry.entry_price) * entry.position_size;
    }
    
    // Si hay apalancamiento, multiplicar el P&L por el apalancamiento
    profitLoss *= entry.leverage;
    
    // Actualizar la entrada
    const updates = {
      status: 'closed' as const,
      exit_price: closePrice,
      profit_loss: profitLoss,
      closed_at: new Date().toISOString(),
      notes: notes ? `${entry.notes ? entry.notes + '\n\n' : ''}Cierre: ${notes}` : entry.notes,
    };
    
    return await updateJournalEntry(id, updates);
  } catch (error) {
    console.error('Error en closeTradeEntry:', error);
    throw error;
  }
}

/**
 * Cancela una operación planificada
 */
export async function cancelPlannedTrade(
  id: string,
  reason?: string
): Promise<JournalEntry> {
  try {
    console.log('Cancelando operación planificada con ID:', id);
    
    // Verificar que la operación existe y está planificada
    const entry = await getJournalEntry(id);
    
    if (entry.status !== 'planned') {
      throw new Error('Solo se pueden cancelar operaciones planificadas');
    }
    
    // Actualizar el estado a cancelado
    const updates = {
      status: 'cancelled' as const,
      notes: reason 
        ? `${entry.notes ? entry.notes + '\n\n' : ''}Cancelada: ${reason}` 
        : entry.notes,
    };
    
    return await updateJournalEntry(id, updates);
  } catch (error) {
    console.error('Error en cancelPlannedTrade:', error);
    throw error;
  }
}

/**
 * Activa una operación planificada (cambia a estado 'open')
 */
export async function activatePlannedTrade(
  id: string,
  actualEntryPrice?: number,
  notes?: string
): Promise<JournalEntry> {
  try {
    console.log('Activando operación planificada con ID:', id);
    
    // Verificar que la operación existe y está planificada
    const entry = await getJournalEntry(id);
    
    if (entry.status !== 'planned') {
      throw new Error('Solo se pueden activar operaciones planificadas');
    }
    
    // Actualizar el estado a abierto
    const updates: Partial<JournalEntry> = {
      status: 'open' as const,
      notes: notes 
        ? `${entry.notes ? entry.notes + '\n\n' : ''}Activación: ${notes}` 
        : entry.notes,
    };
    
    // Si se proporciona un precio de entrada real diferente, actualizarlo
    if (actualEntryPrice && actualEntryPrice !== entry.entry_price) {
      updates.entry_price = actualEntryPrice;
    }
    
    return await updateJournalEntry(id, updates);
  } catch (error) {
    console.error('Error en activatePlannedTrade:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas resumidas del diario de trading
 */
export async function getJournalStats(): Promise<{
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageProfit: number;
  averageLoss: number;
  profitLossRatio: number;
  totalProfitLoss: number;
  bestTrade?: JournalEntry;
  worstTrade?: JournalEntry;
}> {
  try {
    console.log('Obteniendo estadísticas del journal');
    
    // Intentar obtener estadísticas de la API
    try {
      const response = await fetch('/api/journal/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      
      console.log('Estado de la respuesta stats:', response.status, response.statusText);
      
      const data = await handleJsonResponse<{ stats?: any }>(response, { stats: undefined });
      
      if (data.stats) {
        console.log('Estadísticas obtenidas de la API');
        return data.stats;
      }
    } catch (apiError) {
      console.error('Error al obtener estadísticas de la API, calculando localmente:', apiError);
    }
    
    // Si la API falla, calculamos estadísticas localmente
    console.log('Calculando estadísticas localmente');
    
    // Obtener todas las operaciones cerradas
    const closedTrades = await getJournalEntries({ status: 'closed' });
    
    if (closedTrades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        averageProfit: 0,
        averageLoss: 0,
        profitLossRatio: 0,
        totalProfitLoss: 0,
      };
    }
    
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
    let bestTrade: JournalEntry | undefined;
    let worstTrade: JournalEntry | undefined;
    
    if (closedTrades.length > 0) {
      bestTrade = closedTrades.reduce((best, trade) => 
        (trade.profit_loss || 0) > (best.profit_loss || 0) ? trade : best, closedTrades[0]);
      
      worstTrade = closedTrades.reduce((worst, trade) => 
        (trade.profit_loss || 0) < (worst.profit_loss || 0) ? trade : worst, closedTrades[0]);
    }
    
    return {
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
  } catch (error) {
    console.error('Error en getJournalStats:', error);
    // En caso de error, devolvemos estadísticas vacías
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      averageProfit: 0,
      averageLoss: 0,
      profitLossRatio: 0,
      totalProfitLoss: 0,
    };
  }
} 