'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import ConverterSeoSection from '@/components/ConverterSeoSection';
import { CONVERTER_SEO_DATA } from '@/lib/converter-seo-data';

const WordPdfConverter = dynamic(() => import('@/components/WordPdfConverter'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading Word ↔ PDF Converter..." />,
});

const ExcelPdfConverter = dynamic(() => import('@/components/ExcelPdfConverter'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading Excel ↔ PDF Converter..." />,
});

const PowerPointPdfConverter = dynamic(() => import('@/components/PowerPointPdfConverter'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading PowerPoint ↔ PDF Converter..." />,
});

const JpgPdfConverter = dynamic(() => import('@/components/JpgPdfConverter'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading JPG ↔ PDF Converter..." />,
});

const HtmlPdfConverter = dynamic(() => import('@/components/HtmlPdfConverter'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading HTML ↔ PDF Converter..." />,
});

const TextPdfConverter = dynamic(() => import('@/components/TextPdfConverter'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading Text ↔ PDF Converter..." />,
});

function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">{text}</p>
    </div>
  );
}

export default function ConverterToolClient({ toolKey }: { toolKey: string }) {
  const seoData = CONVERTER_SEO_DATA[toolKey];

  const renderConverter = () => {
    switch (toolKey) {
      case 'pdf-word':
        return <WordPdfConverter defaultMode="pdf-to-word" />;
      case 'word-pdf':
        return <WordPdfConverter defaultMode="word-to-pdf" />;
      case 'pdf-excel':
        return <ExcelPdfConverter defaultMode="pdf-to-excel" />;
      case 'excel-pdf':
        return <ExcelPdfConverter defaultMode="excel-to-pdf" />;
      case 'pdf-powerpoint':
        return <PowerPointPdfConverter defaultMode="pdf-to-powerpoint" />;
      case 'powerpoint-pdf':
        return <PowerPointPdfConverter defaultMode="powerpoint-to-pdf" />;
      case 'pdf-jpg':
        return <JpgPdfConverter defaultMode="pdf-to-jpg" />;
      case 'jpg-pdf':
        return <JpgPdfConverter defaultMode="jpg-to-pdf" />;
      case 'pdf-html':
        return <HtmlPdfConverter defaultMode="pdf-to-html" />;
      case 'html-pdf':
        return <HtmlPdfConverter defaultMode="html-to-pdf" />;
      case 'pdf-texto':
        return <TextPdfConverter defaultMode="pdf-to-text" />;
      case 'texto-pdf':
        return <TextPdfConverter defaultMode="text-to-pdf" />;
      default:
        return <WordPdfConverter defaultMode="pdf-to-word" />;
    }
  };

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl flex flex-col items-center">
        {renderConverter()}
        {seoData && <ConverterSeoSection {...seoData} />}
      </div>
    </main>
  );
}
