'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Zap,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  HardDrive,
  CheckCircle2,
  Layers,
  Sparkles,
  FileCheck2,
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
          q: '¿Qué sucede si mi PDF ya está comprimido previamente?',
          a: 'Si un archivo ya fue optimizado al límite físico, nuestro motor detectará inteligentemente que una recompresión adicional no aportaría reducción de bytes y mantendrá la integridad original sin degradar innecesariamente imágenes ni romper fuentes.',
        },
        {
          q: '¿Hay límite de tamaño o número de archivos a comprimir?',
          a: 'No hay límites artificiales. Puedes subir múltiples archivos PDF a la vez y procesar documentos de cualquier tamaño de manera totalmente gratuita y sin necesidad de registro, descargándolos de forma individual o en un paquete .ZIP unificado.',
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
          q: 'What happens if my PDF is already heavily compressed?',
          a: 'If a document is already compressed to its theoretical limits, our engine smartly detects that further recompression yields negligible byte reduction and keeps the original stream intact without degrading image clarity.',
        },
        {
          q: 'Is there a limit on file size or batch quantity?',
          a: 'No limits. You can upload multiple PDFs at once and compress files of any size completely free with no registration required, downloading individual files or a unified .ZIP package.',
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
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="w-full max-w-7xl space-y-12">
        {/* COMPONENTE PRINCIPAL */}
        <PdfCompressor />

        {/* SECCIÓN INFORMATIVA CORPORATIVA: CARACTERÍSTICAS TÉCNICAS */}
        <section className="w-full border-t border-zinc-800 pt-12">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              {isEs ? 'INGENIERÍA DE COMPRESIÓN AVANZADA' : 'ADVANCED COMPRESSION ENGINEERING'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Optimización de Espacio sin Sacrificar Calidad'
                : 'Space Optimization Without Sacrificing Quality'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-2 max-w-2xl mx-auto">
              {isEs
                ? 'Reduce drásticamente el peso de documentos para envíos por correo, almacenamiento y carga web mediante algoritmos de compresión binaria.'
                : 'Drastically reduce document file sizes for email delivery, storage, and web publishing via binary compression algorithms.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Deflate Nivel 9 */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Deflate Nivel 9 de Flujos' : 'Level 9 Stream Deflate'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Comprime matemáticamente flujos stream de contenido, fuentes tipográficas y tablas internas sin pixelar ni degradar vectores.'
                    : 'Mathematically compresses content streams, embedded fonts, and internal tables without pixelating or degrading vectors.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Compresión sin pérdida' : 'Lossless compression'}
              </span>
            </div>

            {/* Card 2: Resampling Adaptativo */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Resampling Adaptativo DPI' : 'Adaptive DPI Resampling'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Re-codifica imágenes embebidas a 72, 96 o 150 DPI según el preset elegido, ahorrando hasta un 90% de peso en documentos escaneados.'
                    : 'Re-encodes embedded images at 72, 96, or 150 DPI per your preset, saving up to 90% file size on scanned documents.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Ahorro de hasta 90%' : 'Up to 90% size reduction'}
              </span>
            </div>

            {/* Card 3: Preservación CAD y Vectorial */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Preservación Vectorial y CAD' : 'CAD & Vector Preservation'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Mantiene coordenadas de alta precisión en planos arquitectónicos, diagramas vectoriales y tipografías sin convertirlas en mapa de bits.'
                    : 'Preserves high-precision coordinates in architectural blueprints, vector diagrams, and fonts without rasterization.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Nitidez milimétrica' : 'Millimeter precision'}
              </span>
            </div>

            {/* Card 4: Privacidad 100% Local */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Privacidad Absoluta (Cero Servidores)' : 'Zero-Server Total Privacy'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Todo el cálculo se realiza en la memoria RAM de tu equipo mediante WebAssembly y Web Workers. Ningún byte viaja por internet.'
                    : 'All optimization runs locally in your device RAM via WebAssembly and Web Workers. No bytes are sent over the internet.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Conforme a RGPD y DPA' : 'GDPR & DPA compliant'}
              </span>
            </div>
          </div>
        </section>

        {/* SECCIÓN DE PREGUNTAS FRECUENTES (FAQ ACCORDION) */}
        <section className="w-full border-t border-zinc-800 pt-12 pb-8">
          <div className="text-center mb-8">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              {isEs ? 'RESOLUCIÓN DE DUDAS TÉCNICAS' : 'TECHNICAL FAQ'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Preguntas Frecuentes sobre la Compresión de PDF'
                : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-3 font-sans">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                      <span className="text-sm font-bold text-white tracking-tight">{faq.q}</span>
                    </div>
                    <div className="p-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-zinc-400 leading-relaxed font-sans border-t border-zinc-800/60 mt-1">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
