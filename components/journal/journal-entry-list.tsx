"use client"

import { useState, useEffect } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  CheckIcon,
  Clock10Icon,
  Trash2Icon,
  XIcon,
  PlayIcon,
  BookOpenIcon
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { getJournalEntries, deleteJournalEntry, updateJournalEntry, activatePlannedTrade, cancelPlannedTrade, closeTradeEntry, type JournalEntry } from "@/lib/journal-service"

interface JournalEntryListProps {
  status?: "planned" | "open" | "closed" | "cancelled"
}

export function JournalEntryList({ status }: JournalEntryListProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"delete" | "activate" | "cancel" | "close">("delete")
  const [actionNotes, setActionNotes] = useState("")
  const [closePrice, setClosePrice] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  // Cargar entradas desde el servicio
  useEffect(() => {
    const fetchEntries = async () => {
      console.log("Iniciando carga de entradas con filtro:", status || "todas");
      setIsLoading(true)
      setLoadError(null)
      
      try {
        const filter = status ? { status } : {}
        const journalEntries = await getJournalEntries(filter)
        console.log(`Se cargaron ${journalEntries.length} entradas`);
        setEntries(journalEntries)
      } catch (error) {
        console.error("Error al cargar entradas:", error)
        setLoadError(error instanceof Error ? error.message : "Error desconocido al cargar las entradas")
        toast({
          title: "Error",
          description: "No se pudieron cargar las entradas del diario",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntries()
  }, [status, toast])

  // Abrir diálogo de acción
  const openActionDialog = (entry: JournalEntry, action: "delete" | "activate" | "cancel" | "close") => {
    setSelectedEntry(entry)
    setActionType(action)
    setActionNotes("")
    setClosePrice(entry.entry_price?.toString() || "")
    setActionDialogOpen(true)
  }

  // Ejecutar acción
  const executeAction = async () => {
    if (!selectedEntry) return

    setIsProcessing(true)
    try {
      const id = selectedEntry.id as string
      
      switch (actionType) {
        case "delete":
          await deleteJournalEntry(id)
          toast({
            title: "Entrada eliminada",
            description: "La entrada ha sido eliminada correctamente",
          })
          break
        
        case "activate":
          await activatePlannedTrade(id, undefined, actionNotes || undefined)
          toast({
            title: "Operación activada",
            description: "La operación ha sido activada correctamente",
          })
          break
        
        case "cancel":
          await cancelPlannedTrade(id, actionNotes || undefined)
          toast({
            title: "Operación cancelada",
            description: "La operación ha sido cancelada correctamente",
          })
          break
        
        case "close":
          if (!closePrice || isNaN(Number(closePrice))) {
            toast({
              title: "Precio inválido",
              description: "Por favor, ingresa un precio de cierre válido",
              variant: "destructive",
            })
            setIsProcessing(false)
            return
          }
          
          await closeTradeEntry(id, Number(closePrice), actionNotes || undefined)
          toast({
            title: "Operación cerrada",
            description: "La operación ha sido cerrada correctamente",
          })
          break
      }

      // Actualizar la lista de entradas
      const filter = status ? { status } : {}
      const updatedEntries = await getJournalEntries(filter)
      setEntries(updatedEntries)
      
      // Cerrar el diálogo
      setActionDialogOpen(false)
    } catch (error) {
      console.error(`Error al ${actionType} entrada:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `No se pudo ${actionType} la entrada`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Mostrar un estado de carga
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-5">
              <div className="flex justify-between items-start mb-1">
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-6 w-28 mb-1" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-5 py-4 bg-muted/50 flex justify-end">
              <Skeleton className="h-9 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  // Mostrar mensaje de error si hay un error al cargar
  if (loadError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error al cargar las entradas</AlertTitle>
        <AlertDescription>
          {loadError}
          <div className="mt-2">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
            >
              Reintentar
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Mostrar un mensaje si no hay entradas
  if (entries.length === 0) {
    return (
      <div className="text-center py-10">
        <BookOpenIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-semibold">No hay entradas</h3>
        <p className="text-sm text-muted-foreground">
          {status 
            ? `No tienes operaciones ${
                status === "planned" ? "planificadas" : 
                status === "open" ? "abiertas" : 
                status === "closed" ? "cerradas" : 
                "canceladas"
              }`
            : "Comienza registrando tu primera operación"
          }
        </p>
      </div>
    )
  }

  // Renderizar las entradas
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <Card key={entry.id || `temp-${Math.random()}`} className="overflow-hidden">
            <CardHeader className="p-5">
              <div className="flex justify-between items-start mb-1">
                <Badge
                  variant={
                    entry.type === "long" ? "default" : "destructive"
                  }
                  className="mb-2 h-6 rounded-sm px-2 font-medium"
                >
                  {entry.type === "long" ? (
                    <ArrowUpIcon className="mr-1 h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownIcon className="mr-1 h-3.5 w-3.5" />
                  )}
                  {entry.type === "long" ? "LONG" : "SHORT"}
                </Badge>
                <Badge
                  variant={
                    entry.status === "planned" ? "outline" :
                    entry.status === "open" ? "secondary" :
                    entry.status === "closed" && (entry.profit_loss || 0) > 0 ? "success" :
                    entry.status === "closed" ? "destructive" :
                    "outline"
                  }
                  className="h-6 rounded-sm px-2 font-medium"
                >
                  {entry.status === "planned" ? (
                    <>
                      <Clock10Icon className="mr-1 h-3.5 w-3.5" />
                      Planificada
                    </>
                  ) : entry.status === "open" ? (
                    <>
                      <PlayIcon className="mr-1 h-3.5 w-3.5" />
                      Abierta
                    </>
                  ) : entry.status === "closed" ? (
                    <>
                      <CheckIcon className="mr-1 h-3.5 w-3.5" />
                      Cerrada
                    </>
                  ) : (
                    <>
                      <XIcon className="mr-1 h-3.5 w-3.5" />
                      Cancelada
                    </>
                  )}
                </Badge>
              </div>
              <CardTitle className="text-xl tracking-normal">{entry.asset}</CardTitle>
              <CardDescription className="flex items-center">
                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                {entry.created_at ? 
                  format(new Date(entry.created_at), "d MMMM yyyy", { locale: es }) : 
                  "Fecha no disponible"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Entrada</span>
                  <span className="font-medium">{entry.entry_price?.toLocaleString() || 0} USDT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stop Loss</span>
                  <span className="font-medium text-destructive">{entry.stop_loss?.toLocaleString() || 0} USDT</span>
                </div>
                {entry.take_profit && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Take Profit</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-500">{entry.take_profit.toLocaleString()} USDT</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Posición</span>
                  <span className="font-medium">{entry.position_size?.toLocaleString() || 0} USDT ({entry.leverage || 1}x)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Riesgo</span>
                  <span className="font-medium">{entry.risk_amount?.toLocaleString() || 0} USDT ({entry.risk_percentage || 0}%)</span>
                </div>
                {entry.status === "closed" && entry.profit_loss !== null && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <span className="text-sm font-medium">Resultado</span>
                    <span className={cn(
                      "font-bold",
                      entry.profit_loss > 0 ? "text-emerald-600 dark:text-emerald-500" : 
                        entry.profit_loss < 0 ? "text-destructive" : ""
                    )}>
                      {entry.profit_loss > 0 ? "+" : ""}{entry.profit_loss.toLocaleString()} USDT
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="px-5 py-4 bg-muted/50 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">Acciones</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {entry.status === "planned" && (
                    <>
                      <DropdownMenuItem onClick={() => openActionDialog(entry, "activate")}>
                        <PlayIcon className="mr-2 h-4 w-4" />
                        Activar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openActionDialog(entry, "cancel")}>
                        <XIcon className="mr-2 h-4 w-4" />
                        Cancelar
                      </DropdownMenuItem>
                    </>
                  )}
                  {entry.status === "open" && (
                    <DropdownMenuItem onClick={() => openActionDialog(entry, "close")}>
                      <CheckIcon className="mr-2 h-4 w-4" />
                      Cerrar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => openActionDialog(entry, "delete")}
                    className="text-destructive focus:text-destructive">
                    <Trash2Icon className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Diálogo de confirmación para acciones */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "delete" ? "Eliminar entrada" : 
               actionType === "activate" ? "Activar operación" :
               actionType === "cancel" ? "Cancelar operación" :
               "Cerrar operación"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "delete" 
                ? "¿Estás seguro de que deseas eliminar esta entrada? Esta acción no se puede deshacer."
                : actionType === "activate"
                ? "Activar esta operación cambiará su estado a 'abierta'."
                : actionType === "cancel"
                ? "Cancelar esta operación cambiará su estado a 'cancelada'."
                : "Cerrar esta operación registrará el resultado final."}
            </DialogDescription>
          </DialogHeader>

          {actionType === "close" && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="close-price">Precio de cierre</Label>
                <Input
                  id="close-price"
                  type="number"
                  value={closePrice}
                  onChange={(e) => setClosePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {(actionType === "activate" || actionType === "cancel" || actionType === "close") && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="action-notes">Notas (opcional)</Label>
                <Textarea
                  id="action-notes"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Añade notas sobre esta acción..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant={actionType === "delete" ? "destructive" : "default"}
              onClick={executeAction}
              disabled={isProcessing}
            >
              {isProcessing ? "Procesando..." : 
                actionType === "delete" ? "Eliminar" : 
                actionType === "activate" ? "Activar" :
                actionType === "cancel" ? "Cancelar" :
                "Cerrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

