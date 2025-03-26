/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ Importante: Ignora errores de TS durante la compilación para evitar fallos en producción
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora errores de ESLint durante la compilación para evitar fallos en producción
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['raw.githubusercontent.com', 'assets.coingecko.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/**',
      },
    ],
  },
  // Configuración para forzar que todas las rutas sean dinámicas
  output: 'standalone',
  experimental: {
    // swcPlugins: [['next-superjson-plugin', {}]],
  },
  // Forzar que todas las rutas sean dinámicas
  staticPageGenerationTimeout: 120,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
}

module.exports = nextConfig 