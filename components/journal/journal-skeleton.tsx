import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function JournalSkeleton() {
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

