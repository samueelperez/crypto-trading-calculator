import { supabase } from "./client";

export type UserSettings = {
  id?: string;
  user_id?: string;
  initial_capital: number;
  currency: string;
  created_at?: Date;
  updated_at?: Date;
};

export const userSettingsService = {
  // Obtener la configuración del usuario actual
  async getSettings(): Promise<UserSettings | null> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error("Error getting user:", userError);
      return null;
    }
    
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userData.user.id)
      .single();
    
    if (error) {
      // Si no existe un registro, creamos uno con valores por defecto
      if (error.code === "PGRST116") {
        return this.createSettings({
          initial_capital: 0,
          currency: "USD"
        });
      }
      console.error("Error getting user settings:", error);
      return null;
    }
    
    return data;
  },
  
  // Crear configuración inicial
  async createSettings(settings: Omit<UserSettings, "id" | "user_id">): Promise<UserSettings | null> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error("Error getting user:", userError);
      return null;
    }
    
    const { data, error } = await supabase
      .from("user_settings")
      .insert({
        ...settings,
        user_id: userData.user.id
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating user settings:", error);
      return null;
    }
    
    return data;
  },
  
  // Actualizar configuración
  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings | null> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error("Error getting user:", userError);
      return null;
    }
    
    // Obtener el ID del registro actual
    const { data: currentSettings, error: settingsError } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", userData.user.id)
      .single();
    
    if (settingsError) {
      // Si no existe, crear un nuevo registro
      if (settingsError.code === "PGRST116") {
        return this.createSettings({
          initial_capital: settings.initial_capital || 0,
          currency: settings.currency || "USD"
        });
      }
      console.error("Error getting current settings:", settingsError);
      return null;
    }
    
    // Actualizar el registro existente
    const { data, error } = await supabase
      .from("user_settings")
      .update(settings)
      .eq("id", currentSettings.id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating user settings:", error);
      return null;
    }
    
    return data;
  },
  
  // Actualizar únicamente el capital inicial
  async updateInitialCapital(amount: number): Promise<boolean> {
    const result = await this.updateSettings({ initial_capital: amount });
    return result !== null;
  },
  
  // Obtener únicamente el valor del capital inicial
  async getInitialCapital(): Promise<number> {
    const settings = await this.getSettings();
    return settings?.initial_capital || 0;
  }
};