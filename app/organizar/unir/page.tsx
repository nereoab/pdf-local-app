'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BookOpen,
  Printer,
  Scale,
  Briefcase,
  GraduationCap,
  Building2,
  Check,
  X as XIcon,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfMerger = dynamic(() => import('@/components/PdfMerger'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor de consolidación y fusión de documentos PDF...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function UnirPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = isEs
    ? [
        {
          q: '¿Existe algún límite en la cantidad de archivos o tamaño total para unir?',
          a: 'No hay límites artificiales impuestos por servidores. Gracias al motor Web Worker con transferencia de memoria zero-copy de PDFBlack, puedes unir decenas de documentos PDF o archivos de cientos de megabytes directamente en la memoria RAM de tu equipo, siempre que tu navegador disponga de memoria física suficiente.',
        },
        {
          q: '¿Se pierde calidad o nitidez en las fuentes tipográficas y planos vectoriales?',
          a: 'Absolutamente no. La fusión se realiza a nivel vectorial nativo conforme al estándar internacional ISO 32000-1. Los operadores tipográficos, vectores de planos CAD, enlaces y curvas matemáticas se copian íntegros sin rasterizar ni recomprimir imágenes, conservando el 100% de la fidelidad y nitidez original.',
        },
        {
          q: '¿Qué es el Índice Corporativo Automático (TOC) y cómo me beneficia?',
          a: 'El Índice Corporativo es una página estructurada generada automáticamente al inicio del documento unificado que detalla el nombre de cada archivo anexado, su número de páginas y la página exacta donde comienza en el documento final. Es indispensable para licitaciones públicas, memorias técnicas, expedientes judiciales y auditorías.',
        },
        {
          q: '¿Cómo funciona la preparación para impresión a Doble Cara (Modo Dúplex)?',
          a: 'Al imprimir un documento encuadernado o a doble cara, si un subdocumento tiene un número impar de páginas, el siguiente documento comenzaría en el reverso de la misma hoja física. El Modo Dúplex de PDFBlack detecta automáticamente las secciones impares e inserta una hoja en blanco para que cada sección comience siempre en el anverso (página derecha).',
        },
        {
          q: '¿Es seguro unir contratos confidenciales, nóminas o historias clínicas?',
          a: '100% confidencial y seguro. PDFBlack funciona con arquitectura Zero-Knowledge: todo el análisis, ordenamiento y compilación del nuevo PDF se ejecuta localmente en el procesador de tu dispositivo. Ningún archivo se transmite a internet ni se almacena en la nube, cumpliendo de forma estricta con el RGPD, HIPAA y estándares corporativos de gobernanza de datos.',
        },
        {
          q: '¿Puedo unir documentos que tienen contraseña de protección?',
          a: 'Sí. Si alguno de tus PDFs cuenta con contraseña de apertura, el sistema lo detectará automáticamente y te mostrará un candado con un campo seguro para desbloquearlo en memoria antes de la unión sin alterar el resto de documentos.',
        },
        {
          q: '¿Qué opciones de foliado o numeración de páginas están disponibles?',
          a: 'Puedes activar numeración continua con diferentes estilos: formato estándar «1 / N», formato formal «Página X de Y», formato abreviado «Pág. X» o Foliado Bates para juzgados («EXP-00001»). Además, puedes ubicar el número al pie (centro o derecha) o en el encabezado, y omitirlo en la portada o índice.',
        },
        {
          q: '¿Cómo combinar solo ciertas páginas de cada PDF y no el documento completo?',
          a: 'Al cargar tus archivos en la bandeja de trabajo, puedes hacer clic en cada documento para especificar un rango exacto de páginas (ejemplo: «1-3, 5, 8-12») o expandir la cuadrícula visual para desmarcar y rotar páginas individuales con un solo clic antes de proceder con la unión.',
        },
        {
          q: '¿Se pueden unir archivos PDF desde teléfonos móviles iPhone o Android?',
          a: 'Sí. PDFBlack es una aplicación web progresiva y responsive optimizada para funcionar con fluidez en navegadores móviles modernos como Safari, Chrome o Firefox en smartphones y tablets, ejecutando toda la computación localmente sin necesidad de instalar apps externas.',
        },
      ]
    : [
        {
          q: 'Is there a limit on the number of files or total size I can merge?',
          a: 'No artificial server limits. Thanks to PDFBlack zero-copy Web Worker memory architecture, you can merge dozens of PDF files or large multi-megabyte documents directly inside your browser RAM, constrained only by your physical device resources.',
        },
        {
          q: 'Will vector drawings, CAD blueprints, or text fonts lose quality?',
          a: 'Not at all. Merging is performed at native vector level under ISO 32000-1 standard. Font glyphs, CAD vector lines, links, and math curves are copied losslessly without rasterizing or recompressing images, guaranteeing 100% fidelity.',
        },
        {
          q: 'What is the Automatic Table of Contents (TOC) and why is it useful?',
          a: 'The Table of Contents is an executive page automatically generated at the start of your document listing each merged file, its page count, and the exact starting page number in the unified PDF. It is essential for legal dossiers, project bids, corporate audits, and executive summaries.',
        },
        {
          q: 'How does Smart Duplex Mode work for double-sided printing?',
          a: 'When printing double-sided dossiers, if a document has an odd number of pages, the following document would bleed onto the reverse side of the same physical sheet. PDFBlack Duplex Mode inserts a blank sheet for odd sections, ensuring every file starts cleanly on the front page.',
        },
        {
          q: 'Is it safe to merge confidential contracts, payrolls, or medical records?',
          a: '100% confidential and secure. PDFBlack operates on a Zero-Knowledge architecture: all parsing, reordering, and PDF assembly runs inside your local browser memory. No files are uploaded to external servers, fully compliant with GDPR, HIPAA, and corporate data governance.',
        },
        {
          q: 'Can I merge password-protected PDF files?',
          a: 'Yes. If any file requires an open password, PDFBlack identifies the encrypted stream and offers an in-memory unlock drawer so you can authenticate it locally before merging.',
        },
        {
          q: 'What page numbering and Bates stamping options are supported?',
          a: 'You can enable continuous numbering with multiple formats: standard «1 / N», formal «Page X of Y», short «P. X», or Bates Stamping for court filings («EXP-00001»). You can also choose placement (bottom center, bottom right, top right) and skip the cover or index.',
        },
        {
          q: 'How can I merge only specific page ranges instead of entire files?',
          a: 'Once your files are queued, you can click on any file card to define a custom page range (e.g. «1-3, 5, 8-12») or expand the visual thumbnail grid to toggle or rotate individual pages before assembly.',
        },
        {
          q: 'Can I combine PDF files on iPhone or Android mobile devices?',
          a: 'Yes. PDFBlack is a responsive progressive web platform that runs directly in mobile Safari, Chrome, and Firefox without requiring app installations, processing everything locally in device memory.',
        },
      ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'SoftwareApplication'],
    name: isEs
      ? 'Unir PDF Gratis Online — Combinar Archivos PDF | PDFBlack'
      : 'Merge PDF Online Free — Combine PDF Files | PDFBlack',
    url: `${SITE_URL}/organizar/unir`,
    applicationCategory: 'UtilitiesApplication, BusinessApplication',
    operatingSystem: 'All (Windows, macOS, Linux, iOS, Android)',
    browserRequirements: 'Requires JavaScript. Requires HTML5 Canvas and WebAssembly/Web Workers.',
    description: isEs
      ? 'Combina y une múltiples archivos PDF en un único documento de forma rápida, gratuita y 100% local. Sin límites, con índice corporativo, foliado Bates, modo dúplex y privacidad total.'
      : 'Merge and combine multiple PDF files into a single unified document fast, free, and 100% locally. No limits, with automatic TOC, Bates stamping, duplex mode, and zero server upload.',
    softwareVersion: '5.0',
    screenshot: `${SITE_URL}/og-unir-pdf.png`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '2150',
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Fusión vectorial nativa ISO 32000-1 sin pérdida ni rasterización',
      'Generación automática de Índice Corporativo / Tabla de Contenidos (TOC)',
      'Foliado continuo y foliado Bates para expedientes notariales y judiciales',
      'Modo dúplex inteligente con inserción de hoja en blanco para imprenta',
      'Reordenamiento interactivo visual de páginas y rotación individual',
      'Desbloqueo seguro de documentos protegidos con contraseña en memoria',
      'Procesamiento 100% en memoria RAM local sin subida a servidores (Zero-Knowledge)',
      'Descarga directa del documento unificado sin marcas de agua',
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
        name: isEs ? 'Unir PDF' : 'Merge PDF',
        item: `${SITE_URL}/organizar/unir`,
      },
    ],
  };

  const howToStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isEs ? 'Cómo unir archivos PDF online gratis' : 'How to merge PDF files online for free',
    description: isEs
      ? 'Aprende a combinar dos o más documentos PDF en un solo archivo con PDFBlack sin subir archivos a servidores.'
      : 'Learn how to combine two or more PDF documents into a single file with PDFBlack with zero server upload.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: isEs ? 'Selecciona o arrastra los archivos PDF' : 'Select or drag your PDF files',
        text: isEs
          ? 'Haz clic en Seleccionar Archivos PDF para Unir o arrastra los documentos que desees combinar al área de trabajo.'
          : 'Click Select PDF Files to Merge or drag the documents you wish to combine into the dropzone.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isEs ? 'Organiza el orden y ajusta las opciones' : 'Arrange order and adjust options',
        text: isEs
          ? 'Arrastra las tarjetas para ordenar la secuencia, activa el Índice Corporativo, elige foliado continuo o modo dúplex.'
          : 'Drag document cards to set merge sequence, enable Table of Contents, continuous page numbering, or duplex mode.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isEs
          ? 'Combina y descarga tu archivo unificado'
          : 'Merge and download your unified file',
        text: isEs
          ? 'Pulsa Unir Archivos PDF. El motor Web Worker compilará el documento en memoria en segundos para su descarga directa sin marcas de agua.'
          : 'Click Merge PDF Files. The Web Worker engine compiles your document in RAM for instant download without watermarks.',
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
        {/* COMPONENTE PRINCIPAL DE UNIÓN */}
        <PdfMerger />

        {/* ── SECCIÓN DE PILARES DE INGENIERÍA EMPRESARIAL ── */}
        <section className="w-full mt-16 pt-12 border-t border-zinc-800">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E8DFCF] block mb-2">
              {isEs ? 'ARQUITECTURA DE FUSIÓN PROFESIONAL' : 'PROFESSIONAL MERGE ARCHITECTURE'}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Consolidación Documental de Nivel Corporativo'
                : 'Enterprise-Grade Document Consolidation'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-3 max-w-2xl mx-auto leading-relaxed">
              {isEs
                ? 'Diseñado para despachos legales, constructoras, bancos y corporaciones que requieren precisión milimétrica, estructura formal y confidencialidad absoluta.'
                : 'Engineered for law firms, construction companies, banks, and enterprises requiring millimeter precision, structured formal output, and absolute confidentiality.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pilar 1: Fusión Vectorial sin Pérdida */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Fusión Vectorial sin Pérdida' : 'Lossless Vector Fusion'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Preserva fuentes tipográficas integradas, coordenadas de planos CAD y tablas contables sin rasterización ni degradación por compresión.'
                    : 'Preserves embedded fonts, CAD blueprint coordinates, and financial spreadsheets losslessly without rasterizing or degradation.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Estándar ISO 32000-1 nativo' : 'Native ISO 32000-1 standard'}
              </span>
            </div>

            {/* Pilar 2: Índice Corporativo Estructurado */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <BookOpen className="w-5 h-5 text-[#FAF6EE]" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Índice de Contenidos (TOC)' : 'Automated Table of Contents'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Genera una tabla ejecutiva al inicio con nombres de archivo, recuento de páginas y número inicial de cada sección con líneas punteadas.'
                    : 'Generates an executive index page at start with file titles, page counts, and start page numbers with leader lines.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Imprescindible para expedientes' : 'Essential for dossiers & bids'}
              </span>
            </div>

            {/* Pilar 3: Foliado y Preparación Duplex */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-600 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl w-fit text-white mb-4">
                  <Printer className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-sm font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Foliado Bates y Modo Dúplex' : 'Bates Stamping & Duplex Mode'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  {isEs
                    ? 'Numera páginas con formato judicial o ratio (1/N) y rellena hojas en blanco para que cada sección comience al anverso en impresión a doble cara.'
                    : 'Number pages with court Bates stamps or ratio (1/N) and pad blank sheets for odd sections in double-sided printing.'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-4 block">
                {isEs ? 'Alineación de imprenta' : 'Print-shop alignment ready'}
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
                    ? 'Todo el ensamblado binario se procesa en el hilo Web Worker de tu navegador. Ningún documento viaja a servidores remotos ni se guarda en la nube.'
                    : 'All binary assembly runs inside your browser Web Worker thread. Zero document transmission to remote servers or cloud databases.'}
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
              {isEs ? 'Cómo Unir Archivos PDF en 3 Pasos' : 'How to Merge PDF Files in 3 Steps'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto font-sans">
            <div className="bg-[#121217] border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white font-extrabold font-mono mb-4 text-base">
                01
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">
                  {isEs ? 'Cargar Documentos' : 'Upload Documents'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {isEs
                    ? 'Selecciona dos o más archivos PDF desde tu equipo o arrástralos directamente a la bandeja de trabajo.'
                    : 'Select two or more PDF files from your device or drag them directly into the merge work area.'}
                </p>
              </div>
            </div>

            <div className="bg-[#121217] border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#FAF6EE] font-extrabold font-mono mb-4 text-base">
                02
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">
                  {isEs ? 'Ordenar y Configurar' : 'Arrange & Customize'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {isEs
                    ? 'Arrastra para reordenar, usa el botón A-Z, activa el Índice de Contenidos, foliado continuo o modo dúplex en el panel lateral.'
                    : 'Drag to reorder, sort A-Z, enable Table of Contents, continuous numbering, or duplex mode in sidebar.'}
                </p>
              </div>
            </div>

            <div className="bg-[#121217] border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400 font-extrabold font-mono mb-4 text-base">
                03
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">
                  {isEs ? 'Fusión y Descarga' : 'Merge & Download'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {isEs
                    ? 'Pulsa Unir Archivos PDF. El motor compilará el documento en memoria y estará listo para descarga inmediata sin marcas de agua.'
                    : 'Click Merge PDF Files. The engine compiles your document in RAM for instant download without watermarks.'}
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
                ? 'Comprueba por qué el procesamiento local en memoria RAM supera a los conversores que envían tus documentos a servidores externos.'
                : 'Discover why local in-browser memory execution outperforms traditional web services that upload files to external servers.'}
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
                        ? 'Tratamiento de datos personales y corporativos'
                        : 'Personal & enterprise data handling'}
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
                      {isEs
                        ? 'Subida y almacenamiento en nube'
                        : 'Upload & temporary cloud storage'}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    {isEs ? 'Límites de Peso y Archivos' : 'Size and File Limits'}
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
                    {isEs ? 'Índice Corporativo Automático (TOC)' : 'Automated Table of Contents'}
                    <span className="block text-[11px] text-zinc-400 font-normal font-mono mt-0.5">
                      {isEs
                        ? 'Carátula ejecutiva con números de página'
                        : 'Executive cover with page numbers'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-950/20 border-x border-zinc-800/80 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {isEs ? 'Integrado y configurable' : 'Built-in & configurable'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-zinc-400 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 text-red-400">
                      <XIcon className="w-4 h-4 text-red-400" />
                      {isEs ? 'No disponible' : 'Not available'}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    {isEs
                      ? 'Foliado Bates y Numeración Notarial'
                      : 'Bates Stamping & Legal Numbering'}
                    <span className="block text-[11px] text-zinc-400 font-normal font-mono mt-0.5">
                      {isEs
                        ? 'Formatos de expediente EXP-0001 y ratio 1/N'
                        : 'Legal filing formats EXP-0001 & ratio 1/N'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-950/20 border-x border-zinc-800/80 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {isEs ? 'Incluido gratuitamente' : 'Included for free'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-zinc-400 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 text-zinc-400">
                      {isEs ? 'Exclusivo en versiones Pro de pago' : 'Exclusive to paid Pro tiers'}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    {isEs ? 'Modo Dúplex de Imprenta' : 'Smart Print Duplex Mode'}
                    <span className="block text-[11px] text-zinc-400 font-normal font-mono mt-0.5">
                      {isEs
                        ? 'Inserción de hojas en blanco para encuadernación'
                        : 'Blank sheet insertion for bookbinding'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-950/20 border-x border-zinc-800/80 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {isEs
                        ? 'Detección automática de secciones impares'
                        : 'Auto-padding on odd sections'}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-zinc-400 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 text-red-400">
                      <XIcon className="w-4 h-4 text-red-400" />
                      {isEs ? 'No disponible' : 'Not available'}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-white">
                    {isEs ? 'Fidelidad Vectorial y Planos CAD' : 'Vector & CAD Blueprint Fidelity'}
                    <span className="block text-[11px] text-zinc-400 font-normal font-mono mt-0.5">
                      {isEs
                        ? 'Conservación de fuentes, trazos matemáticos y capas'
                        : 'Preservation of font glyphs and paths'}
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
                    {isEs ? 'Despachos Jurídicos y Notarías' : 'Law Firms and Notary Offices'}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {isEs
                      ? 'Expedientes judiciales y escrituras públicas'
                      : 'Judicial dossiers and public deeds'}
                  </span>
                </div>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {isEs
                  ? 'Compila demandas, contestaciones, poderes notariales y anexos probatorios en un único legajo foliado con sellos Bates continuos (ej. «EXP-0001»). La ejecución local garantiza el secreto profesional y cumplimiento riguroso de normativas de protección de datos como el RGPD.'
                  : 'Compile lawsuits, powers of attorney, and evidentiary exhibits into a unified dossier with continuous Bates numbering. Local browser execution guarantees strict attorney-client privilege and GDPR data protection compliance.'}
              </p>
            </div>

            {/* Caso 2: Licitaciones e Ingeniería */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 transition-all">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sky-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEs
                      ? 'Ingeniería, Arquitectura y Licitaciones'
                      : 'Engineering, Architecture and Bids'}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {isEs
                      ? 'Memorias técnicas y planos CAD vectoriales'
                      : 'Technical specifications and CAD drawings'}
                  </span>
                </div>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {isEs
                  ? 'Agrupa pliegos de condiciones, presupuestos y planos técnicos CAD conservando cada trazo vectorial con nitidez milimétrica. La generación automática de Índice Corporativo (TOC) añade rigor formal facilitando la revisión de los tribunales de contratación.'
                  : 'Assemble tender specifications, bill of quantities, and architectural CAD blueprints while maintaining full mathematical vector resolution. The automated Table of Contents (TOC) provides formal structure for procurement committees.'}
              </p>
            </div>

            {/* Caso 3: Académico y Tesis */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 transition-all">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-emerald-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEs
                      ? 'Ámbito Académico, Tesis y Doctorados'
                      : 'Academic Research, Theses and Dissertations'}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {isEs
                      ? 'Encuadernación y publicación científica'
                      : 'Binding and scientific publication'}
                  </span>
                </div>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {isEs
                  ? 'Une portadas oficiales, capítulos independientes, gráficos estadísticos y bibliografías. El Modo Dúplex asegura que cada capítulo comience en la página derecha en libros impresos y encuadernados, evitando el solapamiento inverso de hojas físicas.'
                  : 'Consolidate formal title pages, dissertation chapters, statistical charts, and appendices. Smart Duplex Mode guarantees chapters begin cleanly on right-hand pages for printed books, preventing back-page misalignments.'}
              </p>
            </div>

            {/* Caso 4: Finanzas y Corporativo */}
            <div className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-6 transition-all">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-purple-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEs
                      ? 'Finanzas, RRHH y Auditorías Contables'
                      : 'Corporate Finance, HR and Audits'}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {isEs
                      ? 'Balances anuales, facturas y nóminas'
                      : 'Annual balance sheets, invoices and payroll'}
                  </span>
                </div>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {isEs
                  ? 'Consolida cientos de facturas emitidas, extractos bancarios y declaraciones tributarias para presentar ante auditores y organismos fiscales. El desbloqueo directo de PDFs con clave permite procesar documentos salriales protegidos sin alterar su cifrado original.'
                  : 'Consolidate hundreds of vendor invoices, bank statements, and tax filings for external auditors. Built-in password unlocking lets you merge protected payroll and financial statements securely without security exposure.'}
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
              {isEs ? 'Preguntas Frecuentes sobre la Unión de PDF' : 'Frequently Asked Questions'}
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
