/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración existente
  // ...
  
  // Configurar PWA si está incluida
  // ...
  
  // Especificar que ciertas rutas sean dinámicas
  experimental: {
    // Opciones experimentales existentes
    optimizeCss: true,
    
    // Añadir directorios de solo servidor para rutas que usan cookies
    serverComponentsExternalPackages: [],
  },
  
  // Configuración para rutas dinámicas
  dynamicRoutes: {
    '/profile': { dynamic: 'force-dynamic' },
    '/auth/debug': { dynamic: 'force-dynamic' },
    '/auth/verify': { dynamic: 'force-dynamic' },
    '/calculator': { dynamic: 'force-dynamic' },
    '/': { dynamic: 'force-dynamic' },
  },
};

// Para rutas de API, asegurarse que sean dinámicas
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA(nextConfig); 