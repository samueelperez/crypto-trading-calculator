"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";

import { Navbar } from "@/components/layout/navbar";

interface ClientLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function ClientLayout({
  children,
  className = "",
}: ClientLayoutProps) {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Detectar si la app está siendo usada como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone || 
                         document.referrer.includes('android-app://');
    
    setIsPWA(isStandalone);
    
    if (isStandalone) {
      document.documentElement.classList.add('is-pwa');
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className={`min-h-screen ${isPWA ? 'safe-area-top' : ''}`}>
        <Navbar />
        <main className={`container mx-auto py-6 ${isPWA ? 'pwa-content' : ''} ${className}`}>
          {children}
        </main>
      </div>
      <Toaster />
    </ThemeProvider>
  );
} 