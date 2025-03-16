"use client"

import { useState, useEffect, useRef } from "react"
import { userSettingsService } from "@/lib/supabase/user-settings-service"
import { eventBus, EVENTS } from "@/lib/event-bus"
import { supabase } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { RefreshCcwIcon, DatabaseIcon, AlertCircleIcon, WrenchIcon } from "lucide-react"

export function PositionSizeCalculator() {
  const [accountSize, setAccountSize] = useState<string>("10000")
  const [riskPercentage, setRiskPercentage] = useState<string>("1")
  const [entryPrice, setEntryPrice] = useState<string>("42000")
  const [stopLossPrice, setStopLossPrice] = useState<string>("41000")
  const [positionSize, setPositionSize] = useState<string>("")
  const [riskAmount, setRiskAmount] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [usingPortfolioValue, setUsingPortfolioValue] = useState<boolean>(false)
  const [dataSource, setDataSource] = useState<"supabase" | "localStorage" | "default">("default")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [diagnosticInfo, setDiagnosticInfo] = useState<string | null>(null)
  
  // Usar un ref para rastrear los intentos de carga
  const loadAttempts = useRef(0);
  const maxAttempts = 3;

  // Verificar directamente en Supabase
  const verifySupabaseValue = async () => {
    setDiagnosticInfo("Consultando Supabase directamente...");
    setIsLoading(true);
    
    try {
      // Consulta directa a Supabase
      if (!supabase) {
        setDiagnosticInfo("Error: Cliente de Supabase no disponible");
        return;
      }
      
      // Consulta explícita a la tabla global_settings
      const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .eq("id", "global")
        .single();
      
      if (error) {
        setDiagnosticInfo(`Error consultando Supabase: ${error.message} (${error.code})`);
        console.error("Error consultando Supabase:", error);
        
        // Intentar consultar todas las tablas para diagnóstico
        const { data: tables } = await supabase.rpc('get_tables');
        if (tables) {
          setDiagnosticInfo(`Tablas disponibles: ${JSON.stringify(tables)}`);
        }
        
        return;
      }
      
      if (!data) {
        setDiagnosticInfo("No se encontró el registro 'global' en Supabase.");
        
        // Intentar crear el registro
        const insertResult = await createGlobalRecord();
        if (insertResult.success) {
          setDiagnosticInfo(insertResult.message);
        } else {
          setDiagnosticInfo(`Error: ${insertResult.message}`);
        }
        return;
      }
      
      // Mostrar todos los datos encontrados para diagnóstico
      setDiagnosticInfo(`Registro encontrado en Supabase:
        ID: ${data.id}
        Capital Inicial: ${data.initial_capital || 0}
        Valor Portfolio: ${data.portfolio_value || 0}
        Moneda: ${data.currency || 'USD'}
        Actualizado: ${data.updated_at || 'N/A'}
        Datos completos: ${JSON.stringify(data)}
      `);
      
      // Asegurarnos de que portfolio_value sea un número
      const portfolioValue = typeof data.portfolio_value === 'number' 
        ? data.portfolio_value 
        : typeof data.portfolio_value === 'string'
          ? parseFloat(data.portfolio_value)
          : 0;
      
      // Si hay un valor válido, usarlo
      if (portfolioValue && portfolioValue > 0) {
        console.log("VALOR ENCONTRADO EN SUPABASE:", portfolioValue);
        setAccountSize(portfolioValue.toString());
        setUsingPortfolioValue(true);
        setDataSource("supabase");
        
        toast({
          title: "Valor cargado correctamente",
          description: `Valor del portfolio: $${portfolioValue.toLocaleString()}`
        });
      }
      
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Error desconocido";
      setDiagnosticInfo(`Error en consulta directa: ${errorMsg}`);
      console.error("Error en consulta directa:", e);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Crear registro global si no existe
  const createGlobalRecord = async (): Promise<{success: boolean, message: string}> => {
    try {
      if (!supabase) {
        return {success: false, message: "Cliente de Supabase no disponible"};
      }
      
      // Intentar obtener el valor de localStorage para usar como valor inicial
      let portfolioValue = 0;
      if (typeof window !== 'undefined') {
        const storedValue = localStorage.getItem('user_settings_portfolio_value');
        if (storedValue) {
          portfolioValue = Number(storedValue);
        }
      }
      
      // Si no hay valor en localStorage, usar un valor predeterminado
      if (portfolioValue <= 0) {
        portfolioValue = 10000;
      }
      
      const { data, error } = await supabase
        .from("global_settings")
        .insert([{
          id: "global",
          initial_capital: 10000,
          portfolio_value: portfolioValue,
          currency: "USD"
        }])
        .select();
      
      if (error) {
        return {
          success: false, 
          message: `Error creando registro: ${error.message}`
        };
      }
      
      return {
        success: true, 
        message: `Registro global creado con éxito. Valor portfolio: ${portfolioValue}`
      };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Error desconocido";
      return {success: false, message: errorMsg};
    }
  };
  
  // Forzar actualización del valor en Supabase
  const forceUpdateSupabaseValue = async () => {
    setIsLoading(true);
    setDiagnosticInfo("Forzando actualización en Supabase...");
    
    try {
      // Obtener valor actual
      const currentValue = Number(accountSize);
      if (isNaN(currentValue) || currentValue <= 0) {
        setDiagnosticInfo("Valor inválido para actualizar");
        return;
      }
      
      if (!supabase) {
        setDiagnosticInfo("Cliente de Supabase no disponible");
        return;
      }
      
      // Verificar si existe el registro
      const { data: existingData, error: checkError } = await supabase
        .from("global_settings")
        .select("id")
        .eq("id", "global")
        .single();
      
      if (checkError || !existingData) {
        // Crear nuevo registro
        const createResult = await createGlobalRecord();
        if (!createResult.success) {
          setDiagnosticInfo(`Error creando registro: ${createResult.message}`);
          return;
        }
      }
      
      // Actualizar el registro
      const { data, error } = await supabase
        .from("global_settings")
        .update({ portfolio_value: currentValue })
        .eq("id", "global")
        .select();
      
      if (error) {
        setDiagnosticInfo(`Error actualizando valor: ${error.message}`);
        return;
      }
      
      setDiagnosticInfo(`Valor actualizado con éxito en Supabase: ${currentValue}`);
      
      toast({
        title: "Valor guardado en Supabase",
        description: `Se ha guardado el valor ${currentValue} en la base de datos.`
      });
      
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Error desconocido";
      setDiagnosticInfo(`Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cargar el valor del portfolio con reintentos automáticos
  const loadPortfolioValue = async (attempt = 0): Promise<boolean> => {
    if (attempt === 0) {
      setIsLoading(true);
      setErrorMessage(null);
    }
    
    try {
      console.log(`Intento ${attempt + 1}/${maxAttempts}: Cargando valor del portfolio...`);
      
      // Obtener directamente desde Supabase a través del servicio
      const portfolioValue = await userSettingsService.getPortfolioValue();
      console.log("Valor obtenido de Supabase:", portfolioValue);
      
      // Validar explícitamente que sea un número y sea mayor que cero
      if (typeof portfolioValue === 'number' && portfolioValue > 0) {
        console.log("Valor de portfolio válido encontrado:", portfolioValue);
        setAccountSize(portfolioValue.toString());
        setUsingPortfolioValue(true);
        setDataSource("supabase");
        
        // Solo mostrar el toast en el primer intento
        if (attempt === 0) {
          toast({
            title: "Tamaño de cuenta actualizado",
            description: `Se ha cargado el valor de tu portfolio: $${portfolioValue.toLocaleString()} desde Supabase.`,
          });
        }
        
        setIsLoading(false);
        return true;
      } else {
        console.log("No se encontró valor de portfolio en Supabase o es 0");
        
        // Intentar localStorage como respaldo
        const portfolioValueKey = 'user_settings_portfolio_value';
        if (typeof window !== 'undefined') {
          const storedValue = localStorage.getItem(portfolioValueKey);
          if (storedValue) {
            const localValue = Number(storedValue);
            if (localValue > 0) {
              console.log("Valor encontrado en localStorage:", localValue);
              setAccountSize(localValue.toString());
              setUsingPortfolioValue(true);
              setDataSource("localStorage");
              
              if (attempt === 0) {
                toast({
                  title: "Tamaño de cuenta actualizado",
                  description: `Se ha cargado el valor de tu portfolio: $${localValue.toLocaleString()} desde localStorage.`,
                });
              }
              
              setIsLoading(false);
              return true;
            }
          }
        }
        
        // Si llegamos aquí y tenemos intentos restantes, reintentar después de un retraso
        if (attempt < maxAttempts - 1) {
          console.log(`Reintentando en 1 segundo (intento ${attempt + 1}/${maxAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return loadPortfolioValue(attempt + 1);
        }
        
        console.log("Agotados todos los intentos, usando valor por defecto");
        setDataSource("default");
        setUsingPortfolioValue(false);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error(`Error en intento ${attempt + 1}/${maxAttempts}:`, error);
      setErrorMessage(error instanceof Error ? error.message : "Error desconocido al cargar el valor");
      
      // Intentar localStorage como último recurso
      try {
        const portfolioValueKey = 'user_settings_portfolio_value';
        if (typeof window !== 'undefined') {
          const storedValue = localStorage.getItem(portfolioValueKey);
          if (storedValue) {
            const localValue = Number(storedValue);
            if (localValue > 0) {
              console.log("Fallback a localStorage después de error:", localValue);
              setAccountSize(localValue.toString());
              setUsingPortfolioValue(true);
              setDataSource("localStorage");
              setIsLoading(false);
              return true;
            }
          }
        }
      } catch (e) {
        console.error("Error accediendo a localStorage:", e);
      }
      
      // Si tenemos intentos restantes, reintentar
      if (attempt < maxAttempts - 1) {
        console.log(`Reintentando después de error (intento ${attempt + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadPortfolioValue(attempt + 1);
      }
      
      setIsLoading(false);
      return false;
    }
  };
  
  // Cargar valores inmediatamente y también cuando se monte el componente
  useEffect(() => {
    // Incrementar contador de intentos
    loadAttempts.current += 1;
    console.log(`Carga inicial del componente (intento #${loadAttempts.current})`);
    
    // SOLUCIÓN DIRECTA: Consultar inmediatamente Supabase
    const loadDirectFromSupabase = async () => {
      console.log("CARGA DIRECTA: Consultando Supabase...");
      
      if (!supabase) {
        console.error("CARGA DIRECTA: Cliente de Supabase no disponible");
        return false;
      }
      
      try {
        // Consulta directa a la tabla global_settings
        const { data, error } = await supabase
          .from("global_settings")
          .select("portfolio_value")
          .eq("id", "global")
          .single();
        
        if (error) {
          console.error("CARGA DIRECTA: Error consultando Supabase:", error);
          return false;
        }
        
        if (!data) {
          console.log("CARGA DIRECTA: No se encontró el registro global");
          return false;
        }
        
        // Procesar el valor
        const portfolioValue = typeof data.portfolio_value === 'number' 
          ? data.portfolio_value 
          : typeof data.portfolio_value === 'string'
            ? parseFloat(data.portfolio_value)
            : 0;
        
        console.log("CARGA DIRECTA: Valor encontrado:", portfolioValue);
        
        if (portfolioValue > 0) {
          console.log("CARGA DIRECTA: Actualizando valor de la cuenta");
          setAccountSize(portfolioValue.toString());
          setUsingPortfolioValue(true);
          setDataSource("supabase");
          
          toast({
            title: "Valor cargado correctamente",
            description: `Valor del portfolio: $${portfolioValue.toLocaleString()}`
          });
          
          return true;
        }
        
        return false;
      } catch (e) {
        console.error("CARGA DIRECTA: Error inesperado:", e);
        return false;
      }
    };
    
    // Ejecutar carga directa inmediatamente
    loadDirectFromSupabase().then(success => {
      if (!success) {
        console.log("CARGA DIRECTA: Falló, intentando métodos alternativos");
        // Intentar verificar directamente como respaldo
        setTimeout(verifySupabaseValue, 500);
      }
    });
    
    // Función asíncrona directa para cargar datos desde Supabase (método original)
    const directLoadValue = async () => {
      setIsLoading(true);
      try {
        if (!supabase) {
          console.error("Cliente de Supabase no disponible");
          return;
        }
        
        // Consulta directa a la tabla
        const { data, error } = await supabase
          .from("global_settings")
          .select("portfolio_value")
          .eq("id", "global")
          .single();
          
        if (error) {
          console.error("Error cargando directamente:", error);
          return;
        }
        
        // Procesar el valor numérico
        let portfolioValue = 0;
        if (data && typeof data.portfolio_value !== 'undefined') {
          if (typeof data.portfolio_value === 'number') {
            portfolioValue = data.portfolio_value;
          } else if (typeof data.portfolio_value === 'string') {
            portfolioValue = parseFloat(data.portfolio_value);
          }
        }
        
        console.log("Valor cargado directamente de Supabase:", portfolioValue);
        
        // Si tenemos un valor válido, usarlo
        if (portfolioValue > 0) {
          setAccountSize(portfolioValue.toString());
          setUsingPortfolioValue(true);
          setDataSource("supabase");
          
          toast({
            title: "Tamaño de cuenta actualizado",
            description: `Valor cargado directamente: $${portfolioValue.toLocaleString()}`
          });
        }
      } catch (e) {
        console.error("Error en carga directa:", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Intentar cargar directamente después de un breve retraso
    setTimeout(directLoadValue, 1000);
    
    // Configurar escuchas de eventos
    const unsubscribeRefresh = eventBus.subscribe(EVENTS.PORTFOLIO_REFRESHED, () => {
      console.log("Evento PORTFOLIO_REFRESHED recibido en calculadora");
      setTimeout(loadPortfolioValue, 1000);
    });
    
    const unsubscribeValueUpdated = eventBus.subscribe(EVENTS.PORTFOLIO_VALUE_UPDATED, (data) => {
      console.log("Evento PORTFOLIO_VALUE_UPDATED recibido:", data);
      setTimeout(loadPortfolioValue, 800);
    });
    
    // Limpiar escuchas
    return () => {
      unsubscribeRefresh();
      unsubscribeValueUpdated();
    };
  }, []);
  
  // Función para refrescar manualmente
  const refreshPortfolioValue = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Forzar recarga desde Supabase (sin usar caché)
      console.log("Recarga manual solicitada");
      
      const success = await loadPortfolioValue();
      
      if (!success) {
        console.log("La recarga manual no pudo obtener un valor válido");
        // Intentar directamente
        verifySupabaseValue();
      }
    } catch (error) {
      console.error("Error en recarga manual:", error);
      setErrorMessage(error instanceof Error ? error.message : "Error desconocido");
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo obtener el valor del portfolio. Verifica la conexión con Supabase.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePositionSize = () => {
    const account = Number.parseFloat(accountSize)
    const risk = Number.parseFloat(riskPercentage)
    const entry = Number.parseFloat(entryPrice)
    const stopLoss = Number.parseFloat(stopLossPrice)

    if (isNaN(account) || isNaN(risk) || isNaN(entry) || isNaN(stopLoss) || entry === stopLoss) {
      setPositionSize("Entrada inválida")
      setRiskAmount("Entrada inválida")
      return
    }

    const riskAmountValue = account * (risk / 100)
    const priceDifference = Math.abs(entry - stopLoss)
    const riskPerUnit = priceDifference / entry
    const positionSizeValue = riskAmountValue / (riskPerUnit * entry)

    setRiskAmount(`$${riskAmountValue.toFixed(2)}`)
    setPositionSize(`$${positionSizeValue.toFixed(2)}`)
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start text-sm">
          <AlertCircleIcon className="h-4 w-4 text-red-500 mt-0.5 mr-2" />
          <div>
            <p className="font-medium text-red-800">Error al cargar el valor del portfolio:</p>
            <p className="text-red-700">{errorMessage}</p>
            <p className="text-red-600 mt-1">Usando valor por defecto.</p>
          </div>
        </div>
      )}
      
      {diagnosticInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
          <p className="font-medium text-blue-800">Diagnóstico:</p>
          <pre className="mt-1 text-blue-700 whitespace-pre-wrap">{diagnosticInfo}</pre>
        </div>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="account-size">Tamaño de Cuenta ($)</Label>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refreshPortfolioValue}
                disabled={isLoading}
                className="h-6 px-2"
                title="Actualizar valor desde Supabase"
              >
                <RefreshCcwIcon className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="ml-1 text-xs">Actualizar</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={verifySupabaseValue}
                disabled={isLoading}
                className="h-6 px-2"
                title="Verificar valor en Supabase"
              >
                <DatabaseIcon className="h-3 w-3" />
                <span className="ml-1 text-xs">Verificar DB</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={forceUpdateSupabaseValue}
                disabled={isLoading}
                className="h-6 px-2"
                title="Forzar guardado del valor actual en Supabase"
              >
                <WrenchIcon className="h-3 w-3" />
                <span className="ml-1 text-xs">Forzar</span>
              </Button>
            </div>
          </div>
          <Input 
            id="account-size" 
            type="number" 
            value={accountSize} 
            onChange={(e) => {
              setAccountSize(e.target.value);
              setUsingPortfolioValue(false);
              setDataSource("default");
            }}
            className={usingPortfolioValue ? "border-primary" : ""}
          />
          {usingPortfolioValue && (
            <div className="flex items-center text-xs text-muted-foreground">
              {dataSource === "supabase" && <DatabaseIcon className="h-3 w-3 mr-1" />}
              <span>
                {dataSource === "supabase" 
                  ? "Usando valor del portfolio desde Supabase" 
                  : "Usando valor guardado del portfolio"}
              </span>
            </div>
          )}
          
          {/* Información de depuración */}
          <div className="text-xs text-muted-foreground mt-1">
            <p>Valor actual: {accountSize}</p>
            <p>Fuente: {dataSource}</p>
            <p>Usando portfolio: {usingPortfolioValue ? 'Sí' : 'No'}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="risk-percentage">Porcentaje de Riesgo (%)</Label>
          <Input
            id="risk-percentage"
            type="number"
            value={riskPercentage}
            onChange={(e) => setRiskPercentage(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="entry-price">Precio de Entrada ($)</Label>
          <Input id="entry-price" type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stop-loss-price">Precio de Stop Loss ($)</Label>
          <Input
            id="stop-loss-price"
            type="number"
            value={stopLossPrice}
            onChange={(e) => setStopLossPrice(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={calculatePositionSize} className="w-full">
        Calcular
      </Button>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tamaño de Posición</Label>
          <div className="rounded-md border border-input bg-background px-3 py-2">{positionSize || "—"}</div>
        </div>
        <div className="space-y-2">
          <Label>Cantidad de Riesgo</Label>
          <div className="rounded-md border border-input bg-background px-3 py-2">{riskAmount || "—"}</div>
        </div>
      </div>
    </div>
  )
}

