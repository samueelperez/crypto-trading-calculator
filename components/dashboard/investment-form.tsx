"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSignIcon } from "lucide-react";
import { userSettingsService } from "@/lib/supabase/user-settings-service";
import { toast } from "@/components/ui/use-toast";
import { eventBus, EVENTS } from "@/lib/event-bus";

interface InvestmentFormProps {
  onUpdate?: (amount: number) => void;
}

export function InvestmentForm({ onUpdate }: InvestmentFormProps) {
  const [initialCapital, setInitialCapital] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Cargar el valor actual cuando el componente se monta
  useState(() => {
    const loadInitialCapital = async () => {
      try {
        const current = await userSettingsService.getInitialCapital();
        if (current > 0) {
          setInitialCapital(current.toString());
        }
      } catch (error) {
        console.error("Error loading initial capital:", error);
      }
    };
    
    loadInitialCapital();
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const amount = Number(initialCapital.replace(/,/g, ""));
      
      if (isNaN(amount) || amount < 0) {
        toast({
          variant: "destructive",
          title: "Valor inválido",
          description: "Por favor, introduce un número positivo"
        });
        return;
      }
      
      const success = await userSettingsService.updateInitialCapital(amount);
      
      if (success) {
        toast({
          title: "Inversión inicial actualizada",
          description: "El valor ha sido guardado correctamente"
        });
        
        // Notificar a otros componentes
        eventBus.publish(EVENTS.SETTINGS_UPDATED, { initialCapital: amount });
        
        // Notificar al padre
        if (onUpdate) {
          onUpdate(amount);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar el valor"
        });
      }
    } catch (error) {
      console.error("Error saving initial capital:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al guardar el valor"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Establecer Inversión Inicial</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <DollarSignIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="10000"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Este valor se usará para calcular el rendimiento de tu portafolio
          </p>
        </form>
      </CardContent>
    </Card>
  );
} 