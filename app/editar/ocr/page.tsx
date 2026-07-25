'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const PdfOcr = dynamic(() => import('@/components/PdfOcr'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
      <p className="text-slate-400 font-medium">Cargando herramienta de OCR y reconocimiento de texto...</p>
    </div>
  ),
});

export default function OcrPage() {
  return (
    <main className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-100px)]">
      <PdfOcr />
    </main>
  );
}
