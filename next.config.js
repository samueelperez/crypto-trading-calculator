/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // Solo mantener configuración válida para Next.js 15.1
  experimental: {
    optimizeCss: true,
  },
  
  // Opciones estándar
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig); 