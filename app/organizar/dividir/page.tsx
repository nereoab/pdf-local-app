'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Scissors,
  FileArchive,
  Check,
  X as XIcon,
  Scale,
  Stethoscope,
  Briefcase,
  GraduationCap,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfSplitter = dynamic(() => import('@/components/PdfSplitter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor de corte y división de documentos PDF...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function DividirPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = isEs
    ? [
        {
          q: '¿Existe algún límite en el tamaño del archivo o número de páginas para dividir?',
          a: 'No existen límites artificiales impuestos por servidores. Gracias al motor Web Worker con transferencia de memoria zero-copy de PDFBlack, puedes dividir archivos de cientos de páginas o decenas de megabytes directamente en la memoria RAM de tu navegador, sin esperas de subida ni colas de procesamiento.',
        },
        {
          q: '¿Se pierde calidad tipográfica o resolución vectorial al dividir el documento PDF?',
          a: 'En absoluto. La extracción se ejecuta a nivel de árbol de objetos binario bajo el estándar internacional ISO 32000-1. Se preservan intactas las fuentes incrustadas, hipervínculos, capas vectoriales de planos CAD y tablas matemáticas sin aplicar rasterización ni recomprimir imágenes.',
        },
        {
          q: '¿Cómo funciona la división por rangos personalizados y cómo especificarlos?',
          a: 'Puedes definir múltiples rangos independientes (por ejemplo: «1-4», «7», «10-15»). Cada rango generará un archivo PDF individualizado, o si lo prefieres, puedes activar la casilla para fusionar todos los rangos seleccionados en un único documento continuo.',
        },
        {
          q: '¿Qué es el modo de división en bloques fijos de páginas (Chunks)?',
          a: 'Este modo te permite descomponer un documento voluminoso en partes iguales automáticamente (por ejemplo, fragmentar un libro o expediente de 100 páginas en submódulos de 10 páginas cada uno). El sistema genera todas las particiones y las empaqueta en un ZIP listo para descarga con un solo clic.',
        },
        {
          q: '¿Es seguro dividir contratos confidenciales, informes médicos o nóminas?',
          a: '100% seguro y confidencial. PDFBlack cuenta con arquitectura Zero-Knowledge: ningún dato, archivo o byte sale de tu ordenador ni se envía a servidores remotos. Toda la fragmentación y empaquetado ocurre en la memoria volátil de tu navegador, cumpliendo estrictamente con el RGPD, HIPAA y estándares corporativos de gobernanza de datos.',
        },
        {
          q: '¿Puedo dividir un archivo PDF protegido con contraseña de apertura?',
          a: 'Sí. Si el documento cuenta con cifrado estándar, PDFBlack detectará la protección y te ofrecerá un campo seguro para autenticar la clave en memoria local antes de renderizar las miniaturas y procesar las secciones elegidas, sin exponer la contraseña externamente.',
        },
        {
          q: '¿Cómo se descargan los archivos cuando genero múltiples partes?',
          a: 'Si la división genera 2 o más archivos, PDFBlack los empaqueta al instante en un único archivo comprimido .ZIP para descargarlos con un solo clic de forma ordenada. También puedes optar por descargar cada sección de forma individualizada si así lo prefieres.',
        },
        {
          q: '¿Puedo extraer únicamente las páginas pares o impares de mi PDF?',
          a: 'Sí. En la pestaña de Extracción de Páginas dispones de filtros directos para seleccionar con un solo clic todas las páginas impares (anversos) o pares (reversos), ideal para flujos de digitalización o preparación de impresión física a doble cara.',
        },
        {
          q: '¿Funciona en teléfonos móviles iPhone o dispositivos Android?',
          a: 'Sí. PDFBlack es una aplicación web progresiva y responsive optimizada para funcionar en smartphones y tablets modernas mediante Safari, Chrome o Firefox móvil, ejecutando la división localmente con la misma velocidad y privacidad que en un ordenador de escritorio.',
        },
      ]
    : [
        {
          q: 'Is there any file size or page limit when splitting PDF documents?',
          a: 'No artificial server limits. Thanks to PDFBlack zero-copy Web Worker architecture, you can split PDF files containing hundreds of pages or large multi-megabyte dossiers directly in your local browser RAM without upload delays or queue wait times.',
        },
        {
          q: 'Will vector graphics, embedded fonts, or text clarity lose quality?',
          a: 'Not at all. Extraction operates at the binary PDF object tree level following ISO 32000-1 specifications. Embedded fonts, hyperlinks, CAD drawing vectors, and data tables are copied losslessly without rasterizing or recompressing images.',
        },
        {
          q: 'How does custom range splitting work and how can I specify them?',
          a: 'You can define multiple independent ranges (e.g. «1-4», «7», «10-15»). Each range generates a separate PDF file, or alternatively, you can check the option to merge all selected ranges into a single unified extracted document.',
        },
        {
          q: 'What is the fixed-size page chunk splitting mode?',
          a: 'Fixed-chunk mode allows you to automatically divide large documents into equal segments (e.g. splitting a 100-page dossier into 10-page chunks). The system partitions all segments and packages them into a ZIP archive ready for 1-click download.',
        },
        {
          q: 'Is it safe to split confidential contracts, medical dossiers, or payroll?',
          a: '100% confidential and secure. PDFBlack operates with a Zero-Knowledge architecture: zero files or data streams ever leave your device or reach cloud servers. All parsing, partitioning, and packaging runs in local browser memory, complying strictly with GDPR and HIPAA.',
        },
        {
          q: 'Can I split a password-protected PDF file?',
          a: 'Yes. If your document requires an open password, PDFBlack detects the encrypted stream and presents an in-memory unlock drawer so you can authenticate it locally before configuring thumbnails and partitions.',
        },
        {
          q: 'How are split files downloaded when multiple parts are generated?',
          a: 'When splitting produces 2 or more files, PDFBlack instantly packages them into a tidy .ZIP compressed archive for effortless 1-click download. You can also download parts individually if preferred.',
        },
        {
          q: 'Can I extract only even or odd pages from my PDF document?',
          a: 'Yes. Under the Page Extraction tab you have single-click filters to isolate all odd pages (front sides) or even pages (back sides), ideal for scanning workflows and physical duplex print prep.',
        },
        {
          q: 'Does it work on iPhone or Android mobile devices without installing apps?',
          a: 'Yes. PDFBlack is a progressive responsive web app built for mobile Safari, Chrome, and Firefox on phones and tablets, processing all splits in local device memory without native app installation.',
        },
      ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'SoftwareApplication'],
    name: isEs
      ? 'Dividir PDF Gratis Online — Separar y Extraer Páginas PDF | PDFBlack'
      : 'Split PDF Online Free — Separate & Extract PDF Pages | PDFBlack',
    url: `${SITE_URL}/organizar/dividir`,
    applicationCategory: 'UtilitiesApplication, BusinessApplication',
    operatingSystem: 'All (Windows, macOS, Linux, iOS, Android)',
    browserRequirements: 'Requires JavaScript. Requires HTML5 Canvas and WebAssembly/Web Workers.',
    description: isEs
      ? 'Separa, corta y extrae páginas de documentos PDF por rangos, pares/impares o bloques fijos de forma rápida, gratuita y 100% local. Sin límites ni marcas de agua.'
      : 'Separate, cut, and extract pages from PDF documents by custom ranges, even/odd, or fixed chunks fast, free, and 100% locally. Zero limits and no watermarks.',
    softwareVersion: '5.0',
    screenshot: `${SITE_URL}/og-dividir-pdf.png`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1980',
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Extracción vectorial sin pérdida manteniendo resolución nativa ISO 32000-1',
      'División por rangos personalizados continuos o discontinuos (ej. 1-3, 5, 8-12)',
      'Extracción de páginas pares o impares con un solo clic',
      'División en bloques fijos de páginas (chunks de N páginas)',
      'Empaquetado instantáneo en archivo comprimido ZIP',
      'Previsualización interactiva con miniaturas reales en alta resolución',
      'Desbloqueo seguro de documentos PDF protegidos con contraseña en memoria',
      'Procesamiento 100% en memoria RAM local sin subida a servidores (Zero-Knowledge)',
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

  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isEs ? 'Inicio' : 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isEs ? 'Organizar PDF' : 'Organize PDF',
        item: `${SITE_URL}/organizar`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isEs ? 'Dividir PDF' : 'Split PDF',
        item: `${SITE_URL}/organizar/dividir`,
      },
    ],
  };

  const howToStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isEs
      ? 'Cómo dividir un archivo PDF online gratis'
      : 'How to split PDF files online for free',
    description: isEs
      ? 'Aprende a separar y extraer páginas de un documento PDF por rangos o bloques con PDFBlack sin subir archivos a la nube.'
      : 'Learn how to separate and extract pages from a PDF document by ranges or chunks with PDFBlack with zero cloud upload.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: isEs ? 'Selecciona o arrastra el archivo PDF' : 'Select or drag your PDF file',
        text: isEs
          ? 'Haz clic en Seleccionar Archivo PDF o arrastra el documento que desees dividir a la zona de carga.'
          : 'Click Select PDF File or drag the document you want to split into the upload area.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isEs
          ? 'Elige el modo de división y ajusta rangos'
          : 'Choose split mode and set ranges',
        text: isEs
          ? 'Selecciona entre rangos personalizados, extracción de páginas individuales (pares/impares) o división en bloques fijos.'
          : 'Select between custom ranges, individual page extraction (even/odd), or fixed-size page chunks.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isEs ? 'Divide y descarga tus documentos' : 'Split and download your files',
        text: isEs
          ? 'Haz clic en Dividir PDF. El motor compilará las partes en memoria y podrás descargarlas de forma individual o en un archivo ZIP sin marcas de agua.'
          : 'Click Split PDF. The engine compiles all parts in RAM for immediate download as individual PDFs or a ZIP archive without watermarks.',
      },
    ],
  };

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      {/* JSON-LD Structured Data for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToStructuredData) }}
      />

      <div className="w-full max-w-7xl">
        {/* COMPONENTE PRINCIPAL DE DIVISIÓN */}
        <PdfSplitter />

        {/* ── SECCIÓN DE PILARES DE INGENIERÍA DE DIVISIÓN ── */}
        <section className="w-full mt-16 pt-12 border-t border-zinc-800">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E8DFCF] block mb-2">
              {isEs ? 'ARQUITECTURA DE DIVISIÓN PROFESIONAL' : 'PROFESSIONAL SPLIT ARCHITECTURE'}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Partición y Extracción Documental de Alta Precisión'
                : 'High-Precision Document Partitioning & Extraction'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-3 max-w-2xl mx-auto leading-relaxed">
              {isEs
                ? 'Diseñado para despachos jurídicos, hospitales, notarías y corporaciones que requieren máxima velocidad de corte, estructura de páginas impecable y confidencialidad absoluta.'
                : 'Engineered for law firms, medical centers, notary offices, and enterprises requiring maximum slicing speed, pristine page structure, and absolute confidentiality.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pilar 1: Extracción Vectorial sin Pérdida */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Extracción Vectorial sin Pérdida' : 'Lossless Vector Extraction'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Preserva tipografías incrustadas, coordenadas de planos CAD y tablas contables sin rasterizar gráficos ni degradar resolución.'
                    : 'Preserves embedded fonts, CAD blueprint coordinates, and financial spreadsheets without rasterizing graphics or degrading resolution.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Estándar ISO 32000-1 nativo' : 'Native ISO 32000-1 standard'}
              </span>
            </div>

            {/* Pilar 2: Rangos e Intervalos Flexibles */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Scissors className="w-5 h-5 text-[#FAF6EE]" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Rangos e Intervalos Flexibles' : 'Flexible Ranges & Intervals'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Divide por intervalos específicos («1-5, 8, 12-20»), extrae páginas pares/impares o trocea automáticamente en bloques fijos de N hojas.'
                    : 'Split by custom ranges («1-5, 8, 12-20»), isolate even/odd pages, or automatically partition into fixed chunks of N sheets.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Control quirúrgico de páginas' : 'Surgical page control'}
              </span>
            </div>

            {/* Pilar 3: Empaquetado ZIP Instantáneo */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <FileArchive className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Empaquetado ZIP Instantáneo' : 'Instant ZIP Packaging'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Agrupa todas las partes generadas en un archivo comprimido .ZIP estructurado para su descarga en un solo clic sin saturar tu navegador.'
                    : 'Bundles all generated sub-documents into a neat structured .ZIP archive for effortless 1-click download without browser freeze.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Descarga directa y ordenada' : 'Organized direct download'}
              </span>
            </div>

            {/* Pilar 4: Privacidad Absoluta Zero-Server */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? '100% en RAM (Zero-Knowledge)' : '100% In-RAM (Zero-Knowledge)'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Todo el corte y segmentación binaria se procesa en el hilo Web Worker de tu navegador. Ningún documento viaja a la nube ni se registra en servidores.'
                    : 'All slicing and binary parsing runs inside your browser Web Worker thread. Zero document transmission to remote servers or cloud storage.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Cumplimiento RGPD y HIPAA' : 'GDPR & HIPAA compliant'}
              </span>
            </div>
          </div>
        </section>

        {/* ── GUÍA VISUAL PASO A PASO (HOWTO) ── */}
        <section className="w-full mt-14 pt-12 border-t border-zinc-800">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              {isEs ? 'FLUJO DE TRABAJO INTUITIVO' : 'INTUITIVE WORKFLOW'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs ? 'Cómo Dividir Archivos PDF en 3 Pasos' : 'How to Split PDF Files in 3 Steps'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto font-sans">
            <div className="bg-[#121217] border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white font-extrabold font-mono mb-4 text-base">
                01
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">
                  {isEs ? 'Cargar Documento' : 'Upload Document'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {isEs
                    ? 'Selecciona tu archivo PDF desde tu equipo o arrástralo directamente a la bandeja de trabajo para cargar la vista previa.'
                    : 'Select your PDF file from your device or drag it into the dropzone to load thumbnail previews.'}
                </p>
              </div>
            </div>

            <div className="bg-[#121217] border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#FAF6EE] font-extrabold font-mono mb-4 text-base">
                02
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">
                  {isEs ? 'Definir Rangos o Filtros' : 'Define Ranges or Filters'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {isEs
                    ? 'Indica los rangos de hojas a extraer, filtra por pares/impares o define particiones en bloques fijos con la ayuda visual del panel interactivo.'
                    : 'Enter custom page ranges, filter even/odd pages, or set fixed chunk partitions with interactive visual feedback.'}
                </p>
              </div>
            </div>

            <div className="bg-[#121217] border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400 font-extrabold font-mono mb-4 text-base">
                03
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">
                  {isEs ? 'Partición y Descarga' : 'Split & Download'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {isEs
                    ? 'Pulsa Dividir PDF. El motor compilará las partes en memoria RAM y estarán listas para descarga inmediata individual o empaquetadas en un archivo ZIP.'
                    : 'Click Split PDF. The engine compiles all segments in RAM, ready for instant download individually or in a clean ZIP bundle.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── TABLA COMPARATIVA TÉCNICA: PDFBlack vs SERVICIOS EN LA NUBE ── */}
        <section className="w-full mt-14 pt-12 border-t border-zinc-800">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E8DFCF] block mb-2">
              {isEs ? 'ANÁLISIS COMPARATIVO DE INGENIERÍA' : 'COMPARATIVE ENGINEERING ANALYSIS'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'PDFBlack vs Herramientas Convencionales en la Nube'
                : 'PDFBlack vs Traditional Cloud-Based Tools'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-3 max-w-2xl mx-auto leading-relaxed">
              {isEs
                ? 'Comprueba por qué el corte y división local en memoria RAM supera a las plataformas que transmiten tus documentos a servidores externos.'
                : 'Discover why local in-browser memory execution outperforms traditional web services that upload sensitive files to external servers.'}
            </p>
          </div>

          <div className="w-full overflow-x-auto rounded-2xl border border-zinc-800 shadow-2xl">
            <table className="w-full text-left font-sans text-xs sm:text-sm border-collapse bg-[#121217]">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#16161d] font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="p-4 sm:p-5 font-bold">
                    {isEs ? 'Característica / Capacidad' : 'Feature / Capability'}
                  </th>
                  <th className="p-4 sm:p-5 font-bold text-emerald-400 bg-emerald-950/20 border-x border-zinc-800/80">
                    PDFBlack (100% Local)
                  </th>
                  <th className="p-4 sm:p-5 font-bold text-zinc-400">
                    {isEs ? 'Conversores en Servidor' : 'Cloud Converters'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    {isEs ? 'Privacidad y Confidencialidad' : 'Privacy & Confidentiality'}
                    <span className="block text-[11px] text-zinc-400 font-normal font-mono mt-0.5">
                      {isEs
                        ? 'Tratamiento de documentos sensibles y bancarios'
                        : 'Handling of sensitive and banking files'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-950/20 border-x border-zinc-800/80 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {isEs ? 'Zero-Knowledge (Cero Servidores)' : 'Zero-Knowledge (Zero Servers)'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-zinc-400 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 text-red-400">
                      <XIcon className="w-4 h-4 text-red-400" />
                      {isEs ? 'Subida y almacenamiento en la nube' : 'Upload & cloud storage'}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    {isEs ? 'Límites de Peso y Número de Hojas' : 'File Size & Page Limits'}
                    <span className="block text-[11px] text-zinc-400 font-normal font-mono mt-0.5">
                      {isEs
                        ? 'Restricciones artificiales impuestas por servidores'
                        : 'Artificial limits enforced by servers'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-950/20 border-x border-zinc-800/80 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {isEs
                        ? 'Ilimitado (Sujeto solo a tu RAM)'
                        : 'Unlimited (Bounded by local RAM)'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-zinc-400 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 text-zinc-400">
                      {isEs ? 'Limitado a 15–50 MB o de pago' : 'Capped at 15–50 MB or paid tier'}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    {isEs ? 'Modalidades Avanzadas de Partición' : 'Advanced Partition Modes'}
                    <span className="block text-[11px] text-zinc-400 font-normal font-mono mt-0.5">
                      {isEs
                        ? 'Rangos múltiples, bloques fijos de páginas y pares/impares'
                        : 'Multi-ranges, fixed chunks & even/odd filters'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-950/20 border-x border-zinc-800/80 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {isEs
                        ? 'Rangos, Bloques Fijos y Filtro Par/Impar'
                        : 'Ranges, Chunks & Even/Odd'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-zinc-400 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 text-red-400">
                      <XIcon className="w-4 h-4 text-red-400" />
                      {isEs
                        ? 'Solo 1 rango básico en versión gratis'
                        : 'Single basic range on free tier'}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    {isEs ? 'Empaquetado Comprimido ZIP' : 'ZIP Archive Compression'}
                    <span className="block text-[11px] text-zinc-400 font-normal font-mono mt-0.5">
                      {isEs
                        ? 'Descarga simultánea y ordenada de múltiples archivos'
                        : 'Simultaneous organized multi-file download'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-950/20 border-x border-zinc-800/80 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {isEs
                        ? 'Generación local instantánea en 1 clic'
                        : 'Instant local 1-click generation'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-zinc-400 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 text-zinc-400">
                      {isEs
                        ? 'Descargas lentas una a una o con retraso'
                        : 'Slow single downloads or delays'}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    {isEs ? 'Fidelidad Vectorial y Planos CAD' : 'Vector & CAD Blueprint Fidelity'}
                    <span className="block text-[11px] text-zinc-400 font-normal font-mono mt-0.5">
                      {isEs
                        ? 'Conservación de fuentes, curvas matemáticas y capas'
                        : 'Preservation of fonts, curves, and layers'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-950/20 border-x border-zinc-800/80 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {isEs
                        ? '100% Vectorial ISO 32000-1 nativo'
                        : '100% Native ISO 32000-1 vector'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-zinc-400 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 text-zinc-400">
                      {isEs
                        ? 'Riesgo de rasterización o compresión'
                        : 'Risk of rasterization & degradation'}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    {isEs ? 'Costo y Requisitos de Registro' : 'Cost & Sign-Up Requirements'}
                    <span className="block text-[11px] text-zinc-400 font-normal font-mono mt-0.5">
                      {isEs
                        ? 'Acceso sin cuenta bancaria, tarjetas ni suscripciones'
                        : 'Access without credit cards or subscriptions'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-950/20 border-x border-zinc-800/80 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {isEs ? '100% Gratuito y sin registro' : '100% Free & no registration'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-zinc-400 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 text-red-400">
                      <XIcon className="w-4 h-4 text-red-400" />
                      {isEs
                        ? 'Límites diarios o suscripción de pago'
                        : 'Daily limits or paid subscriptions'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── CASOS DE USO PROFESIONALES ── */}
        <section className="w-full mt-14 pt-12 border-t border-zinc-800">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E8DFCF] block mb-2">
              {isEs ? 'APLICACIONES EN ENTORNOS EXIGENTES' : 'MISSION-CRITICAL APPLICATIONS'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Casos de Uso Profesionales y Sectoriales'
                : 'Professional and Enterprise Use Cases'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
            {/* Caso 1: Jurídico y Notarial */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 transition-all">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-amber-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEs
                      ? 'Despachos Jurídicos, Tribunales y Notarías'
                      : 'Law Firms, Courts & Notaries'}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {isEs
                      ? 'Autos procesales, testimonios y anexos probatorios'
                      : 'Pleadings, testimony & evidence exhibits'}
                  </span>
                </div>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {isEs
                  ? 'Separa legajos judiciales voluminosos para remitir exclusivamente las resoluciones judiciales o anexos probatorios pertinentes a cada parte procesal. La ejecución local en RAM asegura el secreto profesional de sumario y el cumplimiento estricto del RGPD.'
                  : 'Separate large judicial case files to submit only relevant rulings or evidence exhibits to each party. Local browser RAM execution guarantees strict attorney-client privilege and GDPR data protection compliance.'}
              </p>
            </div>

            {/* Caso 2: Hospitalario y Sanitario */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 transition-all">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sky-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEs
                      ? 'Centros Médicos y Gestión Hospitalaria'
                      : 'Medical Centers & Hospital Care'}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {isEs
                      ? 'Historiales clínicos, informes de alta y analíticas'
                      : 'Medical records, discharge letters & labs'}
                  </span>
                </div>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {isEs
                  ? 'Desglosa expedientes clínicos completos para aislar analíticas de laboratorio, recetas o informes de alta para pacientes y aseguradoras sin enviar historiales médicos con información sensible a servidores en la nube (conforme a normativa HIPAA).'
                  : 'Partition comprehensive medical records to isolate lab tests, prescriptions, or discharge summaries for patients and insurers without transmitting sensitive health data to cloud servers (HIPAA compliant).'}
              </p>
            </div>

            {/* Caso 3: Arquitectura e Ingeniería */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 transition-all">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-emerald-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEs
                      ? 'Ingeniería, Arquitectura y Licitaciones'
                      : 'Engineering, Architecture & Bids'}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {isEs
                      ? 'Planos CAD, pliegos técnicos y memorias de obra'
                      : 'CAD blueprints, technical specs & bills'}
                  </span>
                </div>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {isEs
                  ? 'Extrae planos topográficos o capítulos específicos de pliegos de contratación pública de cientos de páginas conservando la nitidez de capas vectoriales para contratistas y jefes de obra sin desconfigurar la escala original.'
                  : 'Extract surveying blueprints or specific chapters from large public tender dossiers while preserving mathematical CAD vector layers for subcontractors without scale distortion.'}
              </p>
            </div>

            {/* Caso 4: Docencia y Educación */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 transition-all">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-purple-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEs
                      ? 'Docencia, Universidades e Investigación'
                      : 'Education, Universities & Academia'}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {isEs
                      ? 'Capítulos de libros, papers científicos y tesis'
                      : 'Book chapters, scientific papers & theses'}
                  </span>
                </div>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {isEs
                  ? 'Segmenta libros de texto extensos en lecturas semanales o separa artículos científicos y bibliografías de tesis doctorales para su distribución a alumnos o publicación en repositorios académicos.'
                  : 'Segment large textbooks into weekly readings or separate research papers and thesis appendices for student distribution or institutional repository publication.'}
              </p>
            </div>
          </div>
        </section>

        {/* ── ACORDEÓN DE PREGUNTAS FRECUENTES (FAQ) ── */}
        <section className="w-full border-t border-zinc-800 mt-14 pt-12 pb-10">
          <div className="text-center mb-8">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              {isEs ? 'RESOLUCIÓN DE DUDAS TÉCNICAS' : 'TECHNICAL FAQ'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Preguntas Frecuentes sobre la División de PDF'
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
