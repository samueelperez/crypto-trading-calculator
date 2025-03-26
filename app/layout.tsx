import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { defaultMetadata } from './config'
// Importamos dinámico de config pero con nombre diferente para evitar conflictos
import { dynamic as dynamicConfig } from './config'
import { AuthProvider } from '@/components/auth-provider'
import { cn } from "@/lib/utils"
import { Viewport } from "next/types"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
// Importamos directamente de las acciones del servidor que ya implementan verificaciones seguras
import { getServerSession } from "@/lib/actions/auth-actions"

import "@/app/critical-styles.css"

// Configurar fuente Inter
const inter = Inter({ subsets: ['latin'] })

// Forzar que el layout sea dinámico
export const dynamic = 'force-dynamic'

// Configuración del viewport (separada según recomendación de Next.js 15)
export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  // Solo configuramos viewport-fit: cover para el notch
  viewportFit: 'cover'
}

export const metadata: Metadata = {
  title: defaultMetadata.title,
  description: defaultMetadata.description,
  keywords: defaultMetadata.keywords,
  manifest: '/manifest.json',
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

// Añadimos 'async' a la función para poder usar await
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Usamos getServerSession de las acciones del servidor que ya implementa verificaciones seguras
  const session = await getServerSession();
  
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider initialSession={session}>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

// Crear un componente separado para el layout con navegación que se usará en todas las páginas excepto la principal
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}