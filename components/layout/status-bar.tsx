"use client"

import { useEffect, useState } from "react"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

interface StatusBarProps {
  className?: string
}

export function StatusBar({ className = "" }: StatusBarProps) {
  const [isPWA, setIsPWA] = useState(false)
  const [btcPrice, setBtcPrice] = useState("45,321.50")
  const [trend, setTrend] = useState<"up" | "down" | null>("up")
  const [showData, setShowData] = useState(false)

  useEffect(() => {
    // Detectar si la app está siendo usada como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://');
    
    setIsPWA(isStandalone);
    
    if (isStandalone) {
      // Solo mostrar datos cuando estamos en modo PWA
      setShowData(true);
      
      // Simular cambios de precio (en una app real, esto sería una API real)
      const interval = setInterval(() => {
        const random = Math.random();
        if (random > 0.5) {
          setBtcPrice("45,380.75");
          setTrend("up");
        } else {
          setBtcPrice("45,290.30");
          setTrend("down");
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, []);

  if (!isPWA || !showData) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50 flex justify-between px-5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Contenido a la izquierda del notch */}
      <div className="text-xs font-semibold flex items-center -mt-2.5">
        <span className="mr-1">BTC</span>
        <span className={trend === "up" ? "text-positive" : "text-negative"}>
          ${btcPrice}
        </span>
        {trend === "up" ? (
          <ArrowUpIcon className="h-3 w-3 text-positive" />
        ) : (
          <ArrowDownIcon className="h-3 w-3 text-negative" />
        )}
      </div>
      
      {/* Contenido a la derecha del notch */}
      <div className="text-xs font-semibold flex items-center -mt-2.5">
        <div className="bg-primary/10 rounded-full py-0.5 px-2">
          <span className="text-primary">+2.4%</span>
        </div>
      </div>
    </div>
  )
} 