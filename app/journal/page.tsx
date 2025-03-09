"use client"

import { Suspense } from "react"

import { JournalEntryList } from "@/components/journal/journal-entry-list"
import { JournalStats } from "@/components/journal/journal-stats"
import { NewEntryButton } from "@/components/journal/new-entry-button"
import { JournalSkeleton } from "@/components/journal/journal-skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export default function JournalPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Trading Journal</h1>
        <NewEntryButton />
      </div>

      <Suspense fallback={<JournalSkeleton />}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <JournalStats />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Journal Entries</CardTitle>
            <CardDescription>Record and review your trading decisions</CardDescription>
          </CardHeader>
          <CardContent>
            <JournalEntryList
              onDelete={(id) => {
                // Aquí implementamos la lógica para eliminar una entrada
                toast({
                  title: "Entry deleted",
                  description: "The journal entry has been successfully deleted.",
                })
              }}
            />
          </CardContent>
        </Card>
      </Suspense>
    </div>
  )
}

