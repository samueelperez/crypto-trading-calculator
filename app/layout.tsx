import type React from "react"
import type { Metadata } from "next/types"
import { Inter } from "next/font/google"
import dynamic from 'next/dynamic'

import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/layout/navbar"
// Carga diferida de Sidebar para mejorar LCP
const Sidebar = dynamic(() => import('@/components/layout/sidebar').then(mod => mod.Sidebar), {
  ssr: false,
  loading: () => <div className="w-64 h-screen bg-background border-r border-border" />
})
import { Toaster } from "@/components/ui/toaster"

import "@/app/globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Mejora FCP
  preload: true
})

export const metadata: Metadata = {
  title: 'Crypto Trading Platform',
  description: 'Una plataforma completa para trading de criptomonedas',
  manifest: '/manifest.json',
  themeColor: '#2563EB',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CryptoTrading',
    startupImage: [
      {
        url: '/splashscreens/iphone5_splash.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)'
      },
      {
        url: '/splashscreens/iphone6_splash.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)'
      },
      {
        url: '/splashscreens/iphoneplus_splash.png',
        media: '(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)'
      },
      {
        url: '/splashscreens/iphonex_splash.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)'
      },
      {
        url: '/splashscreens/ipad_splash.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)'
      },
      {
        url: '/splashscreens/ipadpro1_splash.png',
        media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)'
      },
      {
        url: '/splashscreens/ipadpro2_splash.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)'
      }
    ]
  },
  formatDetection: {
    telephone: false
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/icons/apple-icon-180x180.png', sizes: '180x180' },
      { url: '/icons/apple-icon-192x192.png', sizes: '192x192' },
      { url: '/icons/apple-icon-512x512.png', sizes: '512x512' }
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#2563EB'
      }
    ]
  },
  other: {
    'apple-mobile-web-app-capable': 'yes'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Precarga de recursos críticos */}
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Inlining estilos críticos */}
        <style jsx global>{`
          :root {
            --background: 224 71% 4%;
            --foreground: 213 31% 91%;
          }
        `}</style>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 p-6">{children}</main>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}