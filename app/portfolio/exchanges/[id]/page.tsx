import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getUserDetails } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import { ExchangeDetails } from '@/components/portfolio/exchange-details';
import { AssetsList } from '@/components/portfolio/assets-list';
import { ExchangeDetailsSkeleton } from '@/components/portfolio/exchange-details-skeleton';
import { supabase } from '@/lib/supabase/client';

interface Params {
  id: string;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: any): Promise<Metadata> {
  if (!params.id) {
    return {
      title: 'Exchange no encontrado',
    };
  }

  try {
    if (!supabase) {
      console.error('Cliente Supabase no disponible');
      return {
        title: 'Error de conexión',
      };
    }

    const { data: exchange } = await supabase
      .from('exchanges')
      .select('name')
      .eq('id', params.id)
      .single();

    return {
      title: exchange?.name ? `${exchange.name} | Portfolio` : 'Exchange',
    };
  } catch (error) {
    console.error('Error loading exchange metadata:', error);
    return {
      title: 'Exchange',
    };
  }
}

export default async function ExchangePage({ params }: any) {
  const user = await getUserDetails();
  if (!user) {
    redirect('/login');
  }

  const exchangeId = params.id;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Detalles del Exchange</h1>
      <div className="p-4 bg-card rounded-lg shadow">
        <p>ID del Exchange: {exchangeId}</p>
        {/* Aquí iría el contenido específico del exchange */}
      </div>
    </div>
  );
}

