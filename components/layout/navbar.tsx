"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, User, LogOut } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navbar() {
  const pathname = usePathname()
  const [isPWA, setIsPWA] = useState(false)
  const { user, signOut, isLoading } = useAuth()

  useEffect(() => {
    // Detectar si la app está siendo usada como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone || 
                         document.referrer.includes('android-app://');
    
    setIsPWA(isStandalone);
  }, []);

  const getUserInitials = () => {
    if (!user?.email) return "CT"
    return user.email.substring(0, 2).toUpperCase()
  }

  return (
    <header className={`border-b bg-background ${isPWA ? 'pt-[env(safe-area-inset-top)]' : ''}`} style={{ height: isPWA ? 'calc(4rem + env(safe-area-inset-top))' : '4rem' }}>
      <div className="h-16 flex items-center px-4 sm:px-6">
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
              {user ? (
                <>
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
                  <Link
                    href="/portfolio"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-foreground/80",
                      pathname === "/portfolio" ? "text-foreground" : "text-foreground/60",
                    )}
                  >
                    Portfolio
                  </Link>
                  <Link
                    href="/profile"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-foreground/80",
                      pathname === "/profile" ? "text-foreground" : "text-foreground/60",
                    )}
                  >
                    Perfil
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground/80 text-left"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-foreground/80",
                      pathname === "/login" ? "text-foreground" : "text-foreground/60",
                    )}
                  >
                    Iniciar sesión
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {user && (
              <nav className="hidden md:flex items-center space-x-4">
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
                <Link
                  href="/portfolio"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-foreground/80",
                    pathname === "/portfolio" ? "text-foreground" : "text-foreground/60",
                  )}
                >
                  Portfolio
                </Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <ModeToggle />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()} disabled={isLoading}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              pathname !== "/login" && (
                <Button asChild size="sm">
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

