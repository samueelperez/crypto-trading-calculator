import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

import { ExchangeDetails } from '@/components/portfolio/exchange-details';
import { AssetsList } from '@/components/portfolio/assets-list';
import { ExchangeDetailsSkeleton } from '@/components/portfolio/exchange-details-skeleton';
import { supabase } from '@/lib/supabase/client';

interface Params {
  id: string;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
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

export default async function ExchangeDetailsPage({ params }: { params: Params }) {
  if (!params.id) {
    notFound();
  }

  try {
    if (!supabase) {
      throw new Error('Cliente Supabase no disponible');
    }

    const { data: exchange, error } = await supabase
      .from('exchanges')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !exchange) {
      console.error('Error loading exchange:', error);
      notFound();
    }

    return (
      <div className="space-y-8">
        <Suspense fallback={<ExchangeDetailsSkeleton />}>
          <ExchangeDetails exchangeId={params.id} />
        </Suspense>
        <Suspense fallback={<div>Cargando activos...</div>}>
          <AssetsList exchangeId={params.id} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error in exchange details page:', error);
    throw error;
  }
}

