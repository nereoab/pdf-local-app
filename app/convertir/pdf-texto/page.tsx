'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import ConverterSeoSection from '@/components/ConverterSeoSection';
import { CONVERTER_SEO_DATA } from '@/lib/converter-seo-data';

const TextPdfConverter = dynamic(() => import('@/components/TextPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando conversor PDF ↔ Texto...</p>
    </div>
  ),
});

export default function PdfTextPage() {
  const seoData = CONVERTER_SEO_DATA['pdf-texto'];

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl flex flex-col items-center">
        <TextPdfConverter defaultMode="pdf-to-text" />
        {seoData && <ConverterSeoSection {...seoData} />}
      </div>
    </main>
  );
}
