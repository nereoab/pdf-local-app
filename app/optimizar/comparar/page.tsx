'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Zap,
  GitCompare,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  HardDrive,
  CheckCircle2,
  Sliders,
  Layers,
  Hash,
  Scale,
  Eye,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfComparator = dynamic(() => import('@/components/PdfComparator'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor corporativo de comparación forense de PDF...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function CompararPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const faqs = isEs
    ? [
        {
          q: '¿Cómo funciona la comparación entre dos archivos PDF en PDFBlack?',
          a: 'PDFBlack utiliza un motor corporativo v4.0 basado en el algoritmo Myers Diff de espacio lineal con recorte previo de prefijos y sufijos comunes. El motor extrae las coordenadas reales de cada palabra y sus trazados tipográficos, detectando qué fragmentos fueron eliminados, insertados o desplazados entre el Documento Base (A) y el Documento Modificado (B) a velocidad de milisegundos.',
        },
        {
          q: '¿Por qué la herramienta se limita estrictamente a comparar dos archivos (Doc A vs Doc B)?',
          a: 'En entornos legales, notariales y de auditoría corporativa, la comparación rigurosa de documentos siempre se fundamenta en un esquema binario: una versión de referencia contractual (Documento A o Base) frente a una versión revisada o enmendada (Documento B). Limitar el flujo a dos archivos garantiza un análisis inequívoco, cálculo preciso de porcentajes de similitud y generación de informes forenses certificados.',
        },
        {
          q: '¿Qué es y cómo se utiliza la Cortina Deslizante (Curtain Slider)?',
          a: 'La Cortina Deslizante es un visor interactivo que superpone milimétricamente la página del Documento A y del Documento B. Al arrastrar el control divisor de izquierda a derecha con el ratón o el dedo, puedes visualizar de inmediato desplazamientos sutiles de firmas, logotipos cambiados, variaciones de interlineado o saltos de párrafo que un lector de texto convencional no detectaría.',
        },
        {
          q: '¿Es seguro comparar documentos confidenciales o contratos comerciales en PDFBlack?',
          a: 'Es 100% seguro y confidencial. PDFBlack procesa ambos documentos enteramente dentro de tu navegador web mediante Web Workers locales. Ninguna página, imagen ni fragmento de texto es enviado a servidores externos ni guardado en la nube. Tus datos permanecen en la memoria RAM de tu dispositivo.',
        },
        {
          q: '¿Qué alteraciones estructurales detecta el motor además del texto?',
          a: 'El motor audita cambios en el número de páginas, variaciones en las dimensiones o márgenes (ej. de A4 Portrait a Carta o Landscape), adición o sustitución de tipografías integradas, conteo de recursos gráficos (imágenes incrustadas) y metadatos del documento (Autor, Título, Productor, Software generador).',
        },
        {
          q: '¿Cómo se garantiza la validez pericial de los informes de auditoría descargados?',
          a: 'Tanto el informe PDF ejecutivo como los reportes TXT y JSON incluyen los hashes criptográficos SHA-256 calculados directamente sobre los bytes binarios de cada archivo PDF mediante la Web Crypto API. Esto permite demostrar de manera forense e incontrovertible qué archivos exactos fueron objeto del análisis comparativo.',
        },
      ]
    : [
        {
          q: 'How does the PDF comparison engine work in PDFBlack?',
          a: 'PDFBlack runs an enterprise v4.0 engine based on the linear-space Myers Diff algorithm with common prefix and suffix pruning. It extracts exact viewport coordinates and typography for each word, detecting deleted, added, or relocated text between Base Document (A) and Modified Document (B) in milliseconds.',
        },
        {
          q: 'Why is the tool strictly limited to comparing two files (Doc A vs Doc B)?',
          a: 'In legal, corporate, and audit compliance, rigorous document comparison is inherently binary: a baseline master document (Document A) against a revised draft (Document B). Restricting the workflow to strictly two files ensures unambiguous diff tracking, accurate similarity percentages, and certified audit reports.',
        },
        {
          q: 'What is the Interactive Curtain Slider and how do I use it?',
          a: 'The Curtain Slider is an interactive split overlay that aligns pages from Document A and Document B. Dragging the divider line left and right allows you to immediately detect subtle signature shifts, modified logos, font kerning changes, or paragraph relocations that standard text comparators miss.',
        },
        {
          q: 'Is it safe to compare confidential contracts or legal files on PDFBlack?',
          a: '100% secure. PDFBlack processes both PDF files entirely client-side within your browser via dedicated Web Workers. No page, text, or image is ever uploaded to remote servers or stored in the cloud. Your data resides solely in local RAM.',
        },
        {
          q: 'What structural changes does the engine detect besides text?',
          a: 'The engine audits page count deltas, dimensions and margin shifts (e.g. A4 Portrait to Letter or Landscape), added or removed font families, embedded graphic resource counts, and document metadata (Author, Title, Producer, Creation date).',
        },
        {
          q: 'How does PDFBlack ensure the forensic validity of the exported reports?',
          a: 'Both executive PDF reports and TXT/JSON audits feature independent SHA-256 cryptographic hashes calculated directly over the binary bytes of both PDF documents via native Web Crypto API, providing verifiable proof of integrity.',
        },
      ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isEs ? 'Comparar PDF Online Gratis — PDFBlack' : 'Compare PDF Online Free — PDFBlack',
    url: `${SITE_URL}/optimizar/comparar`,
    applicationCategory: 'BusinessApplication, UtilityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    description: isEs
      ? 'Compara dos versiones de un documento PDF y detecta cambios de texto, alteraciones visuales, variaciones de fuentes y páginas con motor Myers Diff y hashes SHA-256. 100% local.'
      : 'Compare two versions of a PDF document to detect text changes, visual shifts, font modifications and page differences with Myers Diff and SHA-256 hashes. 100% local.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Comparación estricta de dos documentos PDF (Doc A vs Doc B)',
      'Algoritmo Myers Diff de espacio lineal y alto rendimiento',
      'Cortina deslizante interactiva (Curtain Slider) para inspección visual',
      'Mapa de calor (Heatmap) de diferencias pixel a pixel',
      'Hashes criptográficos SHA-256 para auditoría legal forense',
      'Exportación de informes ejecutivos en PDF, TXT y JSON',
      'Procesamiento 100% local en navegador sin subida a servidores',
    ],
  };

  const faqStructuredData = {
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <div className="w-full max-w-7xl space-y-12">
        {/* COMPONENTE PRINCIPAL */}
        <PdfComparator />

        {/* SECCIÓN INFORMATIVA CORPORATIVA: CARACTERÍSTICAS DE NIVEL EMPRESARIAL */}
        <section className="w-full border-t border-zinc-800 pt-12">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              {isEs ? 'INGENIERÍA FORENSE DE DOCUMENTOS' : 'FORENSIC DOCUMENT ENGINEERING'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Control y Auditoría de Cambios en Documentos PDF'
                : 'Control & Change Auditing in PDF Documents'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-2 max-w-2xl mx-auto">
              {isEs
                ? 'Diseñado para auditorías legales, cotejo de contratos, balances financieros y control de versiones con estricta privacidad.'
                : 'Engineered for legal audits, contract vetting, financial statements and version control with strict privacy.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Myers Diff */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Motor Myers de Alta Eficiencia' : 'High-Efficiency Myers Diff'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Algoritmo de espacio lineal O(N + D²) con recorte de prefijo y sufijo idénticos. Compara documentos densos de cientos de páginas sin saturar memoria RAM.'
                    : 'Linear-space O(N + D²) algorithm with common prefix and suffix trimming. Compares dense documents without memory spikes.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Sin límites de tamaño' : 'Zero memory bottlenecks'}
              </span>
            </div>

            {/* Card 2: SHA-256 Forense */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Hash className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Auditoría Criptográfica SHA-256' : 'SHA-256 Cryptographic Audit'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Cálculo de huella digital criptográfica independiente sobre los bytes binarios de ambos archivos. Validez probatoria para cumplimiento normativo y peritajes.'
                    : 'Independent cryptographic fingerprint calculation over both raw binaries. Evidentiary validity for compliance and legal audits.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Validez legal probatoria' : 'Forensic integrity trail'}
              </span>
            </div>

            {/* Card 3: Cortina y Detección Visual */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Cortina Deslizante & Heatmap' : 'Curtain Slider & Heatmap'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Inspección visual interactiva mediante deslizador antes/después y mapa de calor pixel a pixel para descubrir firmas alteradas, sellos o desplazamientos tipográficos.'
                    : 'Interactive visual inspection with before/after curtain slider and pixel heatmap to uncover altered signatures, logos, or typography shifts.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Precisión micrométrica' : 'Pixel-accurate overlays'}
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
                    ? 'Todo el procesamiento se ejecuta en la memoria de tu equipo mediante Web Workers aislados. Ningún documento o palabra viaja por internet.'
                    : 'All processing occurs locally in your device memory via sandboxed Web Workers. No document or word ever touches external servers.'}
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
                ? 'Preguntas Frecuentes sobre la Comparación de PDF'
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
