"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export function Navbar() {
  const pathname = usePathname()
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    // Detectar si la app está siendo usada como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone || 
                         document.referrer.includes('android-app://');
    
    setIsPWA(isStandalone);
  }, []);

  return (
    <header className={`border-b bg-background ${isPWA ? 'safe-area-top' : ''}`}>
      <div className="flex h-16 items-center px-4 sm:px-6">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center">
            <Image
              src="/icons/icon-72x72.png"
              alt="Crypto Trading"
              width={40}
              height={40}
              className="mr-2"
            />
            <span className="hidden font-bold sm:inline-block">
              Crypto Trading
            </span>
          </Link>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold">CryptoTrader</span>
            </Link>
            <nav className="mt-6 flex flex-col space-y-4">
              <Link
                href="/dashboard"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground/80",
                  pathname === "/dashboard" ? "text-foreground" : "text-foreground/60",
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/journal"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground/80",
                  pathname === "/journal" ? "text-foreground" : "text-foreground/60",
                )}
              >
                Journal
              </Link>
              <Link
                href="/calculator"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground/80",
                  pathname === "/calculator" ? "text-foreground" : "text-foreground/60",
                )}
              >
                Calculator
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/" className="mr-6 flex items-center space-x-2 md:hidden">
              <span className="font-bold">CryptoTrader</span>
            </Link>
          </div>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

