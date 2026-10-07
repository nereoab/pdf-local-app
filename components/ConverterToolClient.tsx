'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import ConverterSeoSection from '@/components/ConverterSeoSection';
import { CONVERTER_SEO_DATA } from '@/lib/converter-seo-data';

const WordPdfConverter = dynamic(() => import('@/components/WordPdfConverter'), {
  ssr: false,
  loading: () => (
    <LoadingSpinner
      text="Loading Word ↔ PDF Converter..."
      code="001 / MICROSOFT WORD & PDF DOCUMENT CONVERSION"
      title="CONVERT PDF TO WORD / WORD TO PDF"
    />
  ),
});

const ExcelPdfConverter = dynamic(() => import('@/components/ExcelPdfConverter'), {
  ssr: false,
  loading: () => (
    <LoadingSpinner
      text="Loading Excel ↔ PDF Converter..."
      code="002 / MICROSOFT EXCEL & PDF SPREADSHEET CONVERSION"
      title="CONVERT PDF TO EXCEL / EXCEL TO PDF"
    />
  ),
});

const PowerPointPdfConverter = dynamic(() => import('@/components/PowerPointPdfConverter'), {
  ssr: false,
  loading: () => (
    <LoadingSpinner
      text="Loading PowerPoint ↔ PDF Converter..."
      code="003 / POWERPOINT & PDF PRESENTATION CONVERSION"
      title="CONVERT PDF TO POWERPOINT / POWERPOINT TO PDF"
    />
  ),
});

const JpgPdfConverter = dynamic(() => import('@/components/JpgPdfConverter'), {
  ssr: false,
  loading: () => (
    <LoadingSpinner
      text="Loading JPG ↔ PDF Converter..."
      code="007 / JPG & PDF IMAGE CONVERSION"
      title="CONVERT PDF TO JPG / JPG TO PDF"
    />
  ),
});

const HtmlPdfConverter = dynamic(() => import('@/components/HtmlPdfConverter'), {
  ssr: false,
  loading: () => (
    <LoadingSpinner
      text="Loading HTML ↔ PDF Converter..."
      code="005 / HTML & PDF WEB CONVERSION"
      title="CONVERT HTML TO PDF / PDF TO HTML"
    />
  ),
});

const TextPdfConverter = dynamic(() => import('@/components/TextPdfConverter'), {
  ssr: false,
  loading: () => (
    <LoadingSpinner
      text="Loading Text ↔ PDF Converter..."
      code="004 / PLAIN TEXT EXTRACTION & CONVERSION"
      title="CONVERT PDF TO TEXT / TEXT TO PDF"
    />
  ),
});

const PdfBlackWhiteConverter = dynamic(() => import('@/components/PdfBlackWhiteConverter'), {
  ssr: false,
  loading: () => (
    <LoadingSpinner
      text="Loading Black & White PDF Converter..."
      code="006 / BLACK & WHITE DOCUMENT CONVERSION"
      title="CONVERT PDF TO BLACK & WHITE / GRAYSCALE"
    />
  ),
});

function LoadingSpinner({ text, code, title }: { text: string; code?: string; title?: string }) {
  return (
    <div className="w-full flex flex-col items-center">
      {title && (
        <div className="w-full max-w-7xl py-6 flex flex-col gap-2">
          {code && (
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
              {code}
            </span>
          )}
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-sans uppercase">
            <span>{title}</span>
          </h1>
        </div>
      )}
      <div className="flex flex-col items-center justify-center min-h-[460px] w-full border border-zinc-800 rounded-2xl bg-zinc-950/40 gap-4 font-mono">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
        <p className="text-zinc-400 font-mono text-xs">{text}</p>
      </div>
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
      case 'pdf-blanco-negro':
        return <PdfBlackWhiteConverter />;
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
