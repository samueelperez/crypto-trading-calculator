import Link from "next/link"
import { ArrowRight, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="w-full py-24 md:py-32 lg:py-40 flex-grow flex items-center">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center text-center space-y-10 max-w-3xl mx-auto">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <TrendingUp className="h-12 w-12 text-primary" />
            </div>
            
            <div className="space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Trading de criptomonedas <span className="text-primary">simplificado</span>
              </h1>
              <p className="text-xl text-muted-foreground md:text-2xl max-w-2xl mx-auto">
                La plataforma que necesitas para optimizar tus estrategias de trading y llevar tu inversión al siguiente nivel.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button asChild size="lg" className="px-8">
                <Link href="/login">
                  Crear cuenta
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login?mode=login">
                  Iniciar sesión
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

