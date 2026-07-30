'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const PdfOcr = dynamic(() => import('@/components/PdfOcr'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta de OCR y reconocimiento de texto...</p>
    </div>
  ),
});

export default function OcrPage() {
  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <PdfOcr />
    </main>
  );
}

