"use client"

import React from "react"

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveContainer({ 
  children, 
  className = "" 
}: ResponsiveContainerProps) {
  return (
    <div className={`w-full overflow-x-auto overflow-y-hidden -mx-1 px-1 ${className}`}>
      <div className="min-w-full inline-block align-middle">
        {children}
      </div>
    </div>
  )
} 