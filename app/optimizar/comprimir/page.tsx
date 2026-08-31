'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Zap,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  HelpCircle,
  HardDrive,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfCompressor = dynamic(() => import('@/components/PdfCompressor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando motor de compresión de PDF...</p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function ComprimirPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  // FAQs data
  const faqs = isEs
    ? [
        {
          q: '¿Cómo logra PDFBlack comprimir archivos PDF sin perder calidad en el texto?',
          a: 'PDFBlack utiliza una estrategia híbrida avanzada: aplica el algoritmo Deflate Nivel 9 a las estructuras vectoriales y fuentes del documento, preservando la nitidez matemática al 100%, mientras que re-codifica y optimiza las imágenes incrustadas según la resolución seleccionada (72, 96 o 150 DPI).',
        },
        {
          q: '¿Mis archivos PDF se suben a algún servidor en internet?',
          a: 'No. El procesamiento de PDFBlack es 100% local en tu navegador mediante WebAssembly y Web Workers. Tus documentos nunca abandonan tu computadora ni pasan por la nube, garantizando máxima privacidad corporativa y confidencialidad.',
        },
        {
          q: '¿Qué perfil de compresión debo elegir para enviar archivos por correo electrónico?',
          a: 'Para enviar documentos por correo electrónico, WhatsApp o portales con límite de 2 a 5 MB, recomendamos el preset «Para Correo» o «Alta (Máxima Compresión)». Este perfil optimiza imágenes a 96 DPI y comprime flujos con Deflate Nivel 9 asegurando texto 100% legible.',
        },
        {
          q: '¿Es compatible con planos CAD y documentos con millones de vectores?',
          a: 'Sí. A diferencia de otros compresores que rasterizan y pixelan los planos, PDFBlack mantiene los trazos vectoriales y aplica compresión matemática profunda sin pérdida, reduciendo megabytes de coordenadas sin alterar la precisión técnica.',
        },
        {
          q: '¿Hay límite de tamaño o número de archivos a comprimir?',
          a: 'No hay límites artificiales. Puedes subir múltiples archivos PDF a la vez y procesar documentos de cualquier tamaño de manera totalmente gratuita y sin necesidad de registro.',
        },
      ]
    : [
        {
          q: 'How does PDFBlack compress PDF files without losing text quality?',
          a: 'PDFBlack uses an advanced hybrid engine: it applies Level 9 Deflate compression to vector coordinates and fonts preserving 100% crispness, while selectively downsampling embedded images according to your chosen DPI (72, 96, or 150 DPI).',
        },
        {
          q: 'Are my PDF files uploaded to any remote server?',
          a: 'No. PDFBlack operates 100% locally in your browser using WebAssembly and Web Workers. Your files never leave your device, ensuring maximum confidentiality and compliance.',
        },
        {
          q: 'Which compression profile is best for email attachments?',
          a: 'For email, WhatsApp, or portals with 2-5 MB limits, choose the "For Email" or "High (Maximum Compression)" preset. It optimizes images to 96 DPI while maintaining 100% legible text.',
        },
        {
          q: 'Is it compatible with CAD blueprints and vector-dense documents?',
          a: 'Yes. Unlike tools that rasterize and blur technical drawings, PDFBlack preserves native vector paths and applies lossless coordinate compression.',
        },
        {
          q: 'Is there a limit on file size or batch quantity?',
          a: 'No limits. You can upload multiple PDFs at once and compress files of any size completely free with no registration required.',
        },
      ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isEs ? 'Comprimir PDF Gratis Online — PDFBlack' : 'Compress PDF Online Free — PDFBlack',
    url: `${SITE_URL}/optimizar/comprimir`,
    description: isEs
      ? 'Comprime y reduce el tamaño de tus archivos PDF online gratis sin perder calidad ni nitidez. Procesamiento 100% local en tu navegador con Deflate Nivel 9.'
      : 'Compress and reduce PDF file size online for free with no quality loss. 100% local in-browser processing with Deflate Level 9.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Compresión Deflate Nivel 9 sin pérdida',
      'Preservación de texto vectorial nítido',
      'Procesamiento por lotes (Batch) con descarga ZIP',
      'Presets para Correo (<2 MB), Web y Planos CAD',
      'Procesamiento 100% local y privado',
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
        <div className="w-full max-w-7xl">
          <PdfCompressor />

          {/* SECCIÓN INFORMATIVA DE VALOR Y PREGUNTAS FRECUENTES (SEO) */}
          <section className="mt-16 pt-12 border-t border-zinc-800/80 font-sans">
            {/* CARACTERÍSTICAS DESTACADAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mb-4 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-tight mb-2">
                  {isEs ? 'Privacidad 100% Local' : '100% Local Privacy'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Tus archivos se procesan en la memoria de tu dispositivo mediante WebAssembly. Ningún dato se sube a servidores externos.'
                    : 'Your files are processed locally via WebAssembly. No data is ever uploaded to external servers.'}
                </p>
              </div>

              <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mb-4 shadow-sm">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-tight mb-2">
                  {isEs ? 'Deflate Nivel 9 Inteligente' : 'Smart Deflate Level 9'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Algoritmo de compresión máxima que reduce el tamaño de vectores, fuentes y tablas sin pixelar letras ni degradar diagramas CAD.'
                    : 'Maximum compression algorithm that reduces vector and font size without blurring text or technical CAD diagrams.'}
                </p>
              </div>

              <div className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mb-4 shadow-sm">
                  <HardDrive className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-tight mb-2">
                  {isEs ? 'Procesamiento en Lote (ZIP)' : 'Batch Processing (ZIP)'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Comprime decenas de archivos PDF en segundos y descárgalos individualmente o en un paquete ZIP unificado con un solo clic.'
                    : 'Compress dozens of PDF files in seconds and download them individually or as a unified ZIP package.'}
                </p>
              </div>
            </div>

            {/* SECCIÓN DE PREGUNTAS FRECUENTES (FAQ) */}
            <div className="max-w-4xl mx-auto bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

              <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-4">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest font-bold block">
                    {isEs ? 'RESOLUCIÓN DE DUDAS' : 'FREQUENTLY ASKED QUESTIONS'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">
                    {isEs
                      ? 'Preguntas Frecuentes sobre la Compresión de PDF'
                      : 'Frequently Asked Questions about PDF Compression'}
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-zinc-800 rounded-2xl bg-[#121217] overflow-hidden transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-800/40 transition-colors"
                      >
                        <span className="text-sm font-bold text-white tracking-tight">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        )}
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-4 pb-4 pt-1 text-xs text-zinc-400 font-mono leading-relaxed border-t border-zinc-800/50"
                          >
                            {faq.a}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
