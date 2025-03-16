import { supabase } from "./client";

export type UserSettings = {
  initial_capital: number;
  portfolio_value: number;
  currency: string;
};

// ID global para los ajustes (sin usuario)
const GLOBAL_SETTINGS_ID = 'global';

// Claves para almacenamiento local (respaldo)
const STORAGE_KEYS = {
  INITIAL_CAPITAL: 'user_settings_initial_capital',
  PORTFOLIO_VALUE: 'user_settings_portfolio_value',
  CURRENCY: 'user_settings_currency'
};

// Valores por defecto
const DEFAULT_SETTINGS = {
  initial_capital: 0,
  portfolio_value: 0,
  currency: 'USD'
};

// Verificar que supabase no sea nulo
const getSafeSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase client no está disponible");
  }
  return supabase;
};

// Función auxiliar para convertir valores desconocidos a número
const safeParseNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
};

// Función auxiliar para convertir valores desconocidos a string
const safeParseString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
};

export const userSettingsService = {
  // Obtener configuración
  async getSettings(): Promise<UserSettings> {
    try {
      // Intentar obtener de Supabase primero
      const client = getSafeSupabase();
      console.log("Obteniendo configuración de Supabase...");
      
      const { data, error } = await client
        .from("global_settings")
        .select("*")
        .eq("id", GLOBAL_SETTINGS_ID)
        .single();
      
      if (error) {
        console.error("Error al obtener ajustes de Supabase:", error);
        return this._getLocalSettings();
      }
      
      if (!data) {
        console.log("No se encontraron ajustes en Supabase, usando localStorage");
        return this._getLocalSettings();
      }
      
      console.log("Ajustes obtenidos de Supabase:", data);
      
      // Convertir a números para evitar problemas de tipo
      const settings: UserSettings = {
        initial_capital: safeParseNumber(data.initial_capital),
        portfolio_value: safeParseNumber(data.portfolio_value),
        currency: safeParseString(data.currency) || 'USD'
      };
      
      console.log("Datos convertidos:", settings);
      
      // Guardar también en localStorage como respaldo
      this._saveLocalSettings(settings);
      
      return settings;
    } catch (error) {
      console.error("Error en getSettings:", error);
      return this._getLocalSettings();
    }
  },
  
  // Crear o actualizar configuración
  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      // Guardar en localStorage primero como respaldo
      const currentSettings = this._getLocalSettings();
      const updatedSettings = {
        ...currentSettings,
        ...settings
      };
      this._saveLocalSettings(updatedSettings);
      
      const client = getSafeSupabase();
      
      // Intentar verificar si existe el registro global
      const { data: existingData, error: checkError } = await client
        .from("global_settings")
        .select("id")
        .eq("id", GLOBAL_SETTINGS_ID)
        .single();
      
      if (checkError || !existingData) {
        console.log("No existe el registro global, creándolo...");
        // No existe, crear un nuevo registro
        const { data, error } = await client
          .from("global_settings")
          .insert([
            {
              id: GLOBAL_SETTINGS_ID,
              ...updatedSettings
            }
          ])
          .select()
          .single();
          
        if (error) {
          console.error("Error al crear ajustes globales:", error);
          return updatedSettings;
        }
        
        console.log("Ajustes globales creados en Supabase:", data);
        return updatedSettings;
      } else {
        console.log("Actualizando registro global existente...");
        // Existe, actualizar
        const { data, error } = await client
          .from("global_settings")
          .update(settings)
          .eq("id", GLOBAL_SETTINGS_ID)
          .select()
          .single();
          
        if (error) {
          console.error("Error al actualizar ajustes globales:", error);
          return updatedSettings;
        }
        
        console.log("Ajustes globales actualizados en Supabase:", data);
        return updatedSettings;
      }
    } catch (error) {
      console.error("Error en updateSettings:", error);
      // Al menos devolver los datos guardados en localStorage
      return this._getLocalSettings();
    }
  },
  
  // Actualizar capital inicial
  async updateInitialCapital(amount: number): Promise<boolean> {
    try {
      console.log("Actualizando capital inicial a:", amount);
      const result = await this.updateSettings({ initial_capital: amount });
      return result !== null;
    } catch (error) {
      console.error("Error en updateInitialCapital:", error);
      // Intentar guardar al menos en localStorage
      this._saveLocalSettings({
        ...this._getLocalSettings(),
        initial_capital: amount
      });
      return false;
    }
  },
  
  // Obtener capital inicial
  async getInitialCapital(): Promise<number> {
    try {
      const settings = await this.getSettings();
      return settings.initial_capital;
    } catch (error) {
      console.error("Error obteniendo capital inicial:", error);
      return this._getLocalSettings().initial_capital;
    }
  },
  
  // Guardar valor del portfolio
  async updatePortfolioValue(amount: number): Promise<boolean> {
    console.log("Guardando valor de portfolio en Supabase:", amount);
    
    try {
      // Siempre guardar en localStorage como respaldo
      this._saveLocalSettings({
        ...this._getLocalSettings(),
        portfolio_value: amount
      });
      
      const result = await this.updateSettings({ portfolio_value: amount });
      return result !== null;
    } catch (error) {
      console.error("Error guardando valor de portfolio:", error);
      return false;
    }
  },
  
  // Obtener valor del portfolio
  async getPortfolioValue(): Promise<number> {
    try {
      console.log("Obteniendo valor del portfolio...");
      
      // Obtener settings de Supabase
      const settings = await this.getSettings();
      console.log("Valor del portfolio obtenido:", settings.portfolio_value);
      
      return settings.portfolio_value;
    } catch (error) {
      console.error("Error obteniendo valor de portfolio:", error);
      return this._getLocalSettings().portfolio_value;
    }
  },
  
  // Método para verificar si Supabase está disponible
  async testSupabaseConnection(): Promise<boolean> {
    try {
      const client = getSafeSupabase();
      const { error } = await client
        .from("global_settings")
        .select("id")
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error("Error verificando conexión a Supabase:", error);
      return false;
    }
  },
  
  // Consulta directa a la base de datos
  async getPortfolioValueDirect(): Promise<number> {
    try {
      const client = getSafeSupabase();
      
      const { data, error } = await client
        .from("global_settings")
        .select("portfolio_value")
        .eq("id", GLOBAL_SETTINGS_ID)
        .single();
      
      if (error || !data) {
        console.error("Error en consulta directa:", error);
        return 0;
      }
      
      // Asegurar que se retorne un número
      return safeParseNumber(data.portfolio_value);
    } catch (error) {
      console.error("Error en getPortfolioValueDirect:", error);
      return 0;
    }
  },
  
  // Métodos privados para manejo de localStorage
  _getLocalSettings(): UserSettings {
    if (typeof window === 'undefined') {
      return DEFAULT_SETTINGS;
    }
    
    try {
      const initialCapital = localStorage.getItem(STORAGE_KEYS.INITIAL_CAPITAL);
      const portfolioValue = localStorage.getItem(STORAGE_KEYS.PORTFOLIO_VALUE);
      const currency = localStorage.getItem(STORAGE_KEYS.CURRENCY);
      
      return {
        initial_capital: initialCapital ? Number(initialCapital) : DEFAULT_SETTINGS.initial_capital,
        portfolio_value: portfolioValue ? Number(portfolioValue) : DEFAULT_SETTINGS.portfolio_value,
        currency: currency || DEFAULT_SETTINGS.currency
      };
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return DEFAULT_SETTINGS;
    }
  },
  
  _saveLocalSettings(settings: Partial<UserSettings>): void {
    if (typeof window === 'undefined') return;
    
    try {
      if (settings.initial_capital !== undefined) {
        localStorage.setItem(STORAGE_KEYS.INITIAL_CAPITAL, settings.initial_capital.toString());
      }
      
      if (settings.portfolio_value !== undefined) {
        localStorage.setItem(STORAGE_KEYS.PORTFOLIO_VALUE, settings.portfolio_value.toString());
      }
      
      if (settings.currency !== undefined) {
        localStorage.setItem(STORAGE_KEYS.CURRENCY, settings.currency);
      }
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }
};