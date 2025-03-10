import { supabase } from "./client";

export type UserSettings = {
  id?: string;
  user_id?: string;
  initial_capital: number;
  currency: string;
  created_at?: Date;
  updated_at?: Date;
};

// Claves para localStorage
const STORAGE_KEYS = {
  INITIAL_CAPITAL: 'user_settings_initial_capital',
  CURRENCY: 'user_settings_currency'
};

// Valores por defecto
const DEFAULT_SETTINGS = {
  initial_capital: 0,
  currency: 'USD'
};

export const userSettingsService = {
  // Obtener configuración (completamente desde localStorage)
  async getSettings(): Promise<UserSettings> {
    return this._getLocalSettings();
  },
  
  // Actualizar capital inicial
  async updateInitialCapital(amount: number): Promise<boolean> {
    try {
      // Guardar en localStorage
      localStorage.setItem(STORAGE_KEYS.INITIAL_CAPITAL, amount.toString());
      
      // Intentar guardar en Supabase sin verificar autenticación
      try {
        // Buscar configuración existente
        const { data } = await supabase
          .from("user_settings")
          .select("id")
          .limit(1)
          .maybeSingle();
        
        if (data?.id) {
          // Actualizar registro existente
          await supabase
            .from("user_settings")
            .update({ initial_capital: amount })
            .eq("id", data.id);
        } else {
          // Crear nuevo registro
          await supabase
            .from("user_settings")
            .insert({
              initial_capital: amount,
              currency: this._getLocalSettings().currency
            });
        }
      } catch (dbError) {
        // Ignorar errores de base de datos - localStorage tiene prioridad
        console.log("No se pudo guardar en base de datos, usando solo localStorage:", dbError);
      }
      
      return true;
    } catch (error) {
      console.error("Error al guardar capital inicial:", error);
      return false;
    }
  },
  
  // Obtener capital inicial
  async getInitialCapital(): Promise<number> {
    // Primero intentar leer desde localStorage
    const localValue = this._getLocalSettings().initial_capital;
    
    // Si hay un valor local, devolverlo
    if (localValue > 0) {
      return localValue;
    }
    
    // Si no hay valor local, intentar leer desde Supabase
    try {
      const { data } = await supabase
        .from("user_settings")
        .select("initial_capital")
        .limit(1)
        .maybeSingle();
      
      // Si encontramos un valor en la base de datos, guardarlo en localStorage y devolverlo
      if (data?.initial_capital) {
        localStorage.setItem(STORAGE_KEYS.INITIAL_CAPITAL, data.initial_capital.toString());
        return data.initial_capital;
      }
    } catch (error) {
      console.log("No se pudo leer desde la base de datos:", error);
    }
    
    // Si no hay valor en ninguna parte, devolver el valor por defecto
    return DEFAULT_SETTINGS.initial_capital;
  },
  
  // Método privado para leer desde localStorage
  _getLocalSettings(): UserSettings {
    if (typeof window === 'undefined') {
      return DEFAULT_SETTINGS;
    }
    
    try {
      const initialCapital = localStorage.getItem(STORAGE_KEYS.INITIAL_CAPITAL);
      const currency = localStorage.getItem(STORAGE_KEYS.CURRENCY);
      
      return {
        initial_capital: initialCapital ? Number(initialCapital) : DEFAULT_SETTINGS.initial_capital,
        currency: currency || DEFAULT_SETTINGS.currency
      };
    } catch (error) {
      console.error("Error al leer desde localStorage:", error);
      return DEFAULT_SETTINGS;
    }
  }
};