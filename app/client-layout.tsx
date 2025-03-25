"use client";

import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import DynamicSidebar from "@/components/layout/dynamic-sidebar";
import { Toaster } from "@/components/ui/toaster";

export default function ClientLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <style jsx global>{`
        :root {
          --background: 224 71% 4%;
          --foreground: 213 31% 91%;
        }
      `}</style>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1">
          <DynamicSidebar />
          <main className={`flex-1 p-6 ${className}`}>{children}</main>
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  );
} 