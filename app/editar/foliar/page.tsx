'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const PdfFoliador = dynamic(() => import('@/components/PdfFoliador'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
      <p className="text-slate-400 font-medium">Cargando herramienta de foliado y numeración...</p>
    </div>
  ),
});

export default function FoliarPage() {
  return (
    <main className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
      <PdfFoliador />
    </main>
  );
}
