'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Zap,
  Wrench,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  HardDrive,
  Database,
  Binary,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfRepairer = dynamic(() => import('@/components/PdfRepairer'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor de reconstrucción y recuperación estructural de PDF...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

import { buildFullToolSchemas } from '@/lib/seo-metadata';

export default function RepararPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const faqs = isEs
    ? [
        {
          q: '¿Cómo reparar un archivo PDF dañado o corrupto que no abre?',
          a: 'Para reparar un archivo PDF corrupto: 1. Carga tu documento dañado en PDFBlack. 2. El motor forense escanea los bytes binarios y reconstruye la tabla xref y los objetos /Page perdidos. 3. Descarga de inmediato tu PDF reparado con texto seleccionable, tablas y fotos recuperadas sin marcas de agua.',
        },
        {
          q: '¿Por qué Adobe Acrobat dice que el archivo está dañado y no se puede reparar?',
          a: 'Acrobat aplica directivas de seguridad muy estrictas: si el puntero de la tabla xref final está corrupto o faltan los últimos bytes del archivo, bloquea la apertura por precaución. Nuestro motor barre el archivo secuencialmente desde el inicio rescatando todos los objetos /Page, /Font y /XObject existentes aunque el pie de página (trailer) se haya perdido.',
        },
        {
          q: '¿Cuál es la diferencia entre Smart Repair y Deep Rescue?',
          a: 'Smart Repair realiza una reconstrucción estructural quirúrgica reparando cabeceras, tablas de referencias cruzadas y remitiendo objetos intactos. Deep Rescue entra en acción cuando el documento tiene daños catastróficos: extrae flujos de texto crudo, decodifica imágenes incrustadas y reensambla páginas nuevas desde cero para salvar la mayor cantidad posible de información.',
        },
        {
          q: '¿Es seguro subir archivos con información confidencial o contable dañada?',
          a: 'Totalmente seguro. PDFBlack funciona con arquitectura 100% local en tu navegador. Ni el archivo dañado ni el documento reparado se envían jamás a servidores externos ni quedan almacenados en la nube. Todo el proceso de reconstrucción binaria ocurre en la memoria RAM de tu equipo.',
        },
        {
          q: '¿Se conservan las fuentes tipográficas y los gráficos vectoriales al reparar?',
          a: 'Sí. A diferencia de soluciones básicas que convierten el PDF en capturas de pantalla de baja calidad, PDFBlack mantiene los trazados vectoriales, definiciones tipográficas e imágenes originales siempre que los flujos stream binarios no estén destruidos a nivel físico.',
        },
        {
          q: '¿Puedo reparar múltiples documentos PDF dañados simultáneamente?',
          a: 'Sí. Puedes añadir múltiples archivos a la cola de procesamiento. El Web Worker reparará cada archivo de manera aislada y podrás descargarlos individualmente o empaquetados en un único archivo comprimido .ZIP.',
        },
      ]
    : [
        {
          q: 'How to repair a damaged or corrupted PDF file that cannot be opened?',
          a: 'To repair a damaged PDF file: 1. Upload your unopenable document to PDFBlack. 2. The forensic engine parses raw binary streams and rebuilds corrupted xref tables and missing /Page dictionaries. 3. Download your recovered PDF with intact selectable text, tables, and images instantly.',
        },
        {
          q: 'Why does Adobe Acrobat report that the file is damaged and cannot be repaired?',
          a: 'Acrobat enforces strict compliance: if the final xref offset is broken or trailing bytes are missing, it blocks opening entirely. Our engine sweeps the file sequentially from byte 0, recovering all /Page, /Font, and /XObject dictionaries even when the trailer is completely lost.',
        },
        {
          q: 'What is the difference between Smart Repair and Deep Rescue?',
          a: 'Smart Repair executes a surgical structural rebuild fixing headers, cross-reference tables, and trailers. Deep Rescue activates on catastrophic corruption: it sweeps raw byte streams, salvages embedded images, and reassembles pages from scratch to recover maximum data.',
        },
        {
          q: 'Is it safe to repair sensitive financial or legal documents on PDFBlack?',
          a: '100% safe. PDFBlack operates with 100% client-side architecture in your browser. Neither your damaged file nor the recovered PDF is ever uploaded to external servers or stored in the cloud. Binary parsing takes place purely in local RAM.',
        },
        {
          q: 'Are fonts and vector graphics preserved during repair?',
          a: 'Yes. Unlike simple converters that rasterize pages into blurry images, PDFBlack preserves native vector paths, font dictionaries, and high-resolution images as long as stream objects are intact.',
        },
        {
          q: 'Can I repair multiple damaged PDF documents at once?',
          a: 'Yes. You can queue multiple corrupted files. The Web Worker recovers each document in isolation, allowing individual downloads or a combined .ZIP archive.',
        },
      ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const schemas = buildFullToolSchemas({
    category: 'optimizar',
    toolSlug: 'reparar',
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
        <PdfRepairer />

        {/* SECCIÓN INFORMATIVA CORPORATIVA: CARACTERÍSTICAS TÉCNICAS */}
        <section className="w-full border-t border-zinc-800 pt-12">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              {isEs ? 'INGENIERÍA DE RECUPERACIÓN ESTRUCTURAL' : 'STRUCTURAL RECOVERY ENGINEERING'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Restauración Forense de Documentos PDF Dañados'
                : 'Forensic Restoration for Damaged PDF Documents'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-2 max-w-2xl mx-auto">
              {isEs
                ? 'Recupera archivos ilegibles por descargas interrumpidas, discos dañados o cierres inesperados de aplicaciones.'
                : 'Recover unreadable files from interrupted downloads, storage corruption, or application crashes.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: XRef Rebuild */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Reconstrucción XRef y Trailer' : 'XRef & Trailer Rebuild'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Regenera índices de objetos y punteros de bytes perdidos, permitiendo que lectores como Acrobat y navegadores vuelvan a abrir el documento.'
                    : 'Regenerates lost object indexes and byte offsets, enabling readers like Acrobat and browsers to open the document again.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Solución a errores de apertura' : 'Resolves opening errors'}
              </span>
            </div>

            {/* Card 2: Rescate de Streams */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Binary className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Rescate de Streams Huérfanos' : 'Orphaned Stream Salvage'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Inspecciona y extrae flujos de datos comprimidos (FlateDecode) aislados para rescatar imágenes incrustadas y párrafos enteros sin pérdida.'
                    : 'Inspects and extracts isolated compressed data streams (FlateDecode) to salvage embedded images and paragraphs losslessly.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Recuperación profunda' : 'Deep data extraction'}
              </span>
            </div>

            {/* Card 3: Deep Rescue */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Reensamblaje Vectorial' : 'Vector Reassembly'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Cuando la estructura de páginas está destruida, nuestro motor recompila un nuevo PDF limpio inyectando el contenido recuperado en páginas nuevas.'
                    : 'When page structure is destroyed, our engine compiles a clean new PDF injecting recovered assets into fresh pages.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Máxima tasa de éxito' : 'Highest recovery rate'}
              </span>
            </div>

            {/* Card 4: 100% Local Enterprise */}
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
                    ? 'Todo el análisis y rescate se realiza en la memoria de tu equipo mediante Web Workers aislados. Tus documentos dañados nunca salen de tu control.'
                    : 'All diagnostics and salvage occur in your device memory via sandboxed Web Workers. Your damaged files never leave your control.'}
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
                ? 'Preguntas Frecuentes sobre la Reparación de PDF'
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
      </div>
    </main>
  );
}
