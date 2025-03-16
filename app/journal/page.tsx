import { Suspense } from "react"
import { JournalEntryList } from "@/components/journal/journal-entry-list"
import { JournalSkeleton } from "@/components/journal/journal-skeleton"
import { JournalStats } from "@/components/journal/journal-stats"
import { NewEntryButton } from "@/components/journal/new-entry-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

// Esta directiva asegura que la página se renderice dinámicamente en cada solicitud
export const dynamic = "force-dynamic"

export default function JournalPage() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diario de Trading</h1>
          <p className="text-muted-foreground">
            Registra y analiza tus operaciones para mejorar tu rendimiento
          </p>
        </div>
        <NewEntryButton />
      </div>

      <Separator className="my-6" />

      <Tabs defaultValue="all" className="w-full">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="planned">Planificadas</TabsTrigger>
            <TabsTrigger value="open">Abiertas</TabsTrigger>
            <TabsTrigger value="closed">Cerradas</TabsTrigger>
            <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6 space-y-8">
          <TabsContent value="all" className="space-y-4">
            <Suspense fallback={<JournalSkeleton />}>
              <JournalEntryList status={undefined} />
            </Suspense>
          </TabsContent>
          <TabsContent value="planned" className="space-y-4">
            <Suspense fallback={<JournalSkeleton />}>
              <JournalEntryList status="planned" />
            </Suspense>
          </TabsContent>
          <TabsContent value="open" className="space-y-4">
            <Suspense fallback={<JournalSkeleton />}>
              <JournalEntryList status="open" />
            </Suspense>
          </TabsContent>
          <TabsContent value="closed" className="space-y-4">
            <Suspense fallback={<JournalSkeleton />}>
              <JournalEntryList status="closed" />
            </Suspense>
          </TabsContent>
          <TabsContent value="cancelled" className="space-y-4">
            <Suspense fallback={<JournalSkeleton />}>
              <JournalEntryList status="cancelled" />
            </Suspense>
          </TabsContent>
        </div>
      </Tabs>

      <div className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Estadísticas</h2>
        <Suspense fallback={<JournalSkeleton />}>
          <JournalStats />
        </Suspense>
      </div>
    </div>
  )
}

