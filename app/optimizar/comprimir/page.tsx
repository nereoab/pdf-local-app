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
import RelatedLongTailSolutions from '@/components/RelatedLongTailSolutions';

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

import { buildFullToolSchemas } from '@/lib/seo-metadata';

export default function ComprimirPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  // FAQs calibradas para Posición Cero (Featured Snippet) y PAA
  const faqs = isEs
    ? [
        {
          q: '¿Cómo reducir el tamaño de un PDF a menos de 1 MB o 2 MB para enviar por correo?',
          a: 'Para reducir el peso de tu PDF para Gmail o Outlook: 1. Arrastra tu documento a la caja de compresión de PDFBlack. 2. Selecciona el perfil «Para Correo (<2 MB)» o compresión equilibrada. 3. Pulsa Descargar. El motor Deflate Nivel 9 reduce el tamaño hasta un 80% manteniendo el texto y las firmas vectoriales nítidas.',
        },
        {
          q: '¿Cómo logra PDFBlack comprimir archivos PDF online gratis sin perder calidad?',
          a: 'PDFBlack utiliza una arquitectura híbrida inteligente: aplica el algoritmo matemático Deflate Nivel 9 a los flujos de contenido y fuentes vectoriales sin rasterizar el texto, mientras que recodifica las imágenes incrustadas a la resolución óptima seleccionada (72, 96 o 150 DPI) sin introducir artefactos visuales.',
        },
        {
          q: '¿Es seguro comprimir archivos PDF confidenciales en PDFBlack?',
          a: '100% privado y confidencial. A diferencia de otros sitios que suben tus documentos a servidores externos en la nube, PDFBlack procesa todo localmente en la memoria RAM de tu navegador mediante Web Workers. Ningún archivo ni dato sale de tu computadora, cumpliendo con RGPD e HIPAA.',
        },
        {
          q: '¿Por qué mi archivo PDF pesa tanto y cómo bajarle los megabytes?',
          a: 'Un PDF pesa demasiado debido a imágenes en alta resolución sin comprimir, flujos de fuentes duplicadas o metadatos innecesarios. PDFBlack elimina diccionarios redundantes, limpia capas invisibles y compacta los flujos binarios para reducir los megabytes al mínimo posible.',
        },
        {
          q: '¿Es compatible con planos CAD y documentos con millones de vectores?',
          a: 'Sí. A diferencia de otros compresores que pixelan y vuelven borrosos los planos técnicos de arquitectura o ingeniería, PDFBlack conserva intactas las coordenadas vectoriales y aplica compresión matemática profunda sin pérdida.',
        },
        {
          q: '¿Hay límite de tamaño o número de archivos PDF a comprimir?',
          a: 'No hay límites artificiales. Puedes procesar múltiples documentos PDF pesados a la vez de forma 100% gratuita y sin registro, descargándolos individualmente o agrupados en un archivo .ZIP.',
        },
      ]
    : [
        {
          q: 'How to reduce PDF file size to under 1 MB or 2 MB for email attachment?',
          a: 'To shrink your PDF for Gmail or Outlook: 1. Drag your document into the PDFBlack compression dropzone. 2. Choose the "For Email (<2 MB)" or balanced compression preset. 3. Click Download. The Level 9 Deflate engine compresses files by up to 80% while keeping text and vector stamps perfectly sharp.',
        },
        {
          q: 'How does PDFBlack compress PDF files without losing text or image quality?',
          a: 'PDFBlack uses a smart hybrid engine: it applies lossless Level 9 Deflate compression to vector instructions and embedded font glyphs without rasterization, while optimizing bitmap photos to your selected target DPI (72, 96, or 150 DPI) without introducing visible artifacts.',
        },
        {
          q: 'Is it safe to compress confidential legal, medical, and financial PDFs?',
          a: '100% secure and confidential. Unlike traditional tools that upload your files to third-party cloud servers, PDFBlack processes all documents locally in your browser memory via Web Workers. Not a single byte ever leaves your device, fully GDPR and HIPAA compliant.',
        },
        {
          q: 'Why is my PDF file size so large and how can I shrink it?',
          a: 'PDFs bloat due to uncompressed high-resolution images, duplicated embedded font subsets, and residual metadata. PDFBlack strips redundant dictionaries, purges invisible layers, and compacts binary content streams to reduce file size to the theoretical minimum.',
        },
        {
          q: 'Is it compatible with CAD blueprints and dense architectural drawings?',
          a: 'Yes. Unlike tools that rasterize blueprints into fuzzy JPEG images, PDFBlack preserves native vector geometries and applies mathematical coordinate compression without resolution loss.',
        },
        {
          q: 'Is there a file size or batch quantity limit when compressing PDFs?',
          a: 'No artificial limits. You can process multiple large PDF files simultaneously completely free with no registration required, downloading individual files or a unified .ZIP archive.',
        },
      ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const schemas = buildFullToolSchemas({
    category: 'optimizar',
    toolSlug: 'comprimir',
    lang: isEs ? 'es' : 'en',
    faqs,
  });

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.webApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.howTo) }}
      />
      {schemas.faq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.faq) }}
        />
      )}

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

                  <div
                    className={`px-5 pb-5 pt-1 text-xs text-zinc-400 leading-relaxed font-sans border-t border-zinc-800/60 mt-1 transition-all duration-200 ${
                      isOpen ? 'block' : 'hidden'
                    }`}
                  >
                    {faq.a}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Soluciones Long-Tail Relacionadas */}
        <RelatedLongTailSolutions toolKey="comprimir" />
      </div>
    </main>
  );
}
