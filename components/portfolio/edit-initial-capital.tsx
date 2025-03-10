"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSignIcon } from "lucide-react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";

export function EditInitialCapital() {
  const { initialCapital, updateInitialCapital } = usePortfolio();
  const [value, setValue] = useState(initialCapital.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const numValue = Number(value.replace(/,/g, ""));
      if (isNaN(numValue)) {
        toast({
          variant: "destructive",
          title: "Valor inválido",
          description: "Por favor, introduce un número válido"
        });
        return;
      }
      
      const success = await updateInitialCapital(numValue);
      if (success) {
        toast({
          title: "Capital inicial actualizado",
          description: "Tu portafolio reflejará el nuevo valor de inversión"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error al actualizar",
          description: "No se pudo actualizar el capital inicial"
        });
      }
    } catch (error) {
      console.error("Error actualizando capital inicial:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al actualizar el capital inicial"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Inversión Inicial</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <DollarSignIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="pl-9"
              placeholder="Introduce tu inversión inicial"
            />
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Establece tu inversión inicial total para comparar con el valor actual
        </p>
        
        <div className="mt-4 rounded-md bg-muted p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Valor actual:</span>
            <span className="text-lg font-bold">{formatCurrency(initialCapital)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 