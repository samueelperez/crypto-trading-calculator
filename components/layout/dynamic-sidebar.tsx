"use client";

import dynamic from 'next/dynamic';

// Carga diferida de Sidebar para mejorar LCP
const DynamicSidebar = dynamic(() => import('@/components/layout/sidebar').then(mod => mod.Sidebar), {
  ssr: false,
  loading: () => <div className="w-64 h-screen bg-background border-r border-border" />
});

export default DynamicSidebar; 