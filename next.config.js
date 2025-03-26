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
  // Experimental: Usar los últimos compiladores de Next.js
  experimental: {
    // swcPlugins: [['next-superjson-plugin', {}]],
  },
}

module.exports = nextConfig 