import Link from "next/link"
import { ArrowRight, BarChart3, BookOpen, Calculator } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="container mx-auto space-y-12 py-8">
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Advanced Crypto Trading Platform</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Track your trades, analyze market data, and optimize your trading strategy with our comprehensive suite of
          tools.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button asChild size="lg">
            <Link href="/portfolio">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-primary" />
            <CardTitle className="mt-4">Real-time Dashboard</CardTitle>
            <CardDescription>
              Monitor cryptocurrency markets with real-time data and customizable charts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Track price movements, volume, and market trends for informed trading decisions.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <BookOpen className="h-8 w-8 text-primary" />
            <CardTitle className="mt-4">Trading Journal</CardTitle>
            <CardDescription>Record and analyze your trading history to improve your strategy.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Document trades, add notes, and review performance metrics to identify patterns.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/journal">Open Journal</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <Calculator className="h-8 w-8 text-primary" />
            <CardTitle className="mt-4">Risk Calculator</CardTitle>
            <CardDescription>Calculate position sizes, risk-reward ratios, and potential outcomes.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Optimize your risk management with advanced calculation tools for better results.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/calculator">Use Calculator</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  )
}

