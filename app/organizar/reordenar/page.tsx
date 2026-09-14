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
  LayoutGrid,
  Check,
  X as XIcon,
  Scale,
  Stethoscope,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowLeftRight,
  RotateCw,
  Copy,
  Layers,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfOrganizer = dynamic(() => import('@/components/PdfOrganizer'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando mesa de montaje y motor de organización PDF...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function ReordenarPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = isEs
    ? [
        {
          q: '¿Cómo puedo organizar y cambiar el orden de las páginas de mi PDF?',
          a: 'Arrastra uno o varios archivos PDF a la mesa de trabajo interactiva. Al instante se generarán miniaturas en alta resolución de cada página. Puedes arrastrar y soltar cualquier tarjeta a la posición que desees, rotar páginas 90°, duplicarlas, eliminar hojas innecesarias o aplicar patrones automáticos (como invertir orden o intercalar escaneos dúplex). Finalmente, haz clic en «Organizar y Descargar PDF».',
        },
        {
          q: '¿Puedo unir páginas de múltiples archivos PDF en una misma sesión?',
          a: 'Sí. A diferencia de editores básicos, nuestra mesa de montaje permite importar múltiples documentos PDF a la vez o añadir más archivos con el botón «+ Añadir PDFs». Todas las hojas se combinan en un lienzo unificado donde puedes intercalarlas y secuenciarlas libremente.',
        },
        {
          q: '¿Existe algún límite de páginas o tamaño de archivo para organizar?',
          a: 'No hay limitaciones artificiales ni muros de pago. Al procesar los documentos directamente en la memoria RAM de tu navegador mediante Web Workers dedicados y Canvas acelerado, puedes organizar sin restricciones documentos extensos de cientos de páginas.',
        },
        {
          q: '¿Se pierde calidad visual o se alteran las tipografías del PDF original?',
          a: 'En absoluto. PDFBlack realiza una reestructuración binaria del árbol de páginas (`/Pages`) conforme al estándar ISO 32000-1. Se preservan intactas las tipografías incrustadas, vectores, hipervínculos, capas y metadatos sin aplicar rasterización destructiva ni recompresión con pérdida.',
        },
        {
          q: '¿Cómo funciona la función de intercalar escaneo dúplex?',
          a: 'Si utilizaste un escáner con alimentador de una sola cara (que produce primero los anversos impares 1, 3, 5... y luego los reversos pares invertidos 6, 4, 2...), el botón «Dúplex» intercala automáticamente ambos bloques en su correlativo natural (1, 2, 3, 4, 5, 6) con un solo clic.',
        },
        {
          q: '¿Puedo rotar páginas individuales, verlas en HD o eliminarlas?',
          a: 'Sí. Cada tarjeta de página cuenta con controles directos en hover: rotación de 90° en sentido horario, botón de eliminación rápida a la papelera, e icono de lupa (Eye) para abrir una previsualización en alta definición a pantalla completa.',
        },
        {
          q: '¿Es seguro organizar contratos confidenciales, expedientes médicos o financieros?',
          a: '100% seguro y confidencial. PDFBlack opera bajo una estricta arquitectura Zero-Knowledge: ningún byte de tus documentos se envía a servidores externos ni a la nube. Todo el procesamiento y renderizado ocurre en tu dispositivo local, cumpliendo con el RGPD y estándares de privacidad corporativa.',
        },
        {
          q: '¿Puedo deshacer cambios si cometo un error al reordenar?',
          a: 'Dispones de soporte completo para deshacer y rehacer mediante los botones dedicados en la barra superior o mediante los atajos universales de teclado Ctrl+Z (Deshacer) y Ctrl+Y o Ctrl+Shift+Z (Rehacer), con hasta 25 estados de memoria.',
        },
        {
          q: '¿Puedo insertar hojas en blanco o re-numerar las páginas resultantes?',
          a: 'Sí. Con el botón «+ Hoja en Blanco» puedes agregar separadores vacíos en cualquier punto de la secuencia. Además, en el panel de control inferior puedes activar la re-numeración automática de páginas en pie de página y seleccionar el formato y alineación deseados.',
        },
      ]
    : [
        {
          q: 'How can I organize and change the order of pages in my PDF?',
          a: 'Drag one or more PDF files into the interactive workspace. High-resolution thumbnails of each page render instantly. Drag and drop any card to your desired spot, rotate pages 90°, duplicate them, remove unwanted sheets, or apply automated patterns (like reverse order or duplex interleave). Finally, click «Organize and Download PDF».',
        },
        {
          q: 'Can I combine pages from multiple PDF files in a single session?',
          a: 'Yes. Unlike basic tools, our montage deck allows importing multiple PDF documents at once or adding more files via the «+ Add PDFs» button. All sheets appear in a unified canvas where you can interleave and sequence them freely.',
        },
        {
          q: 'Is there any page count or file size limit when organizing?',
          a: 'No artificial caps or paywalls. By processing documents entirely in your browser RAM using multi-threaded Web Workers and accelerated Canvas rendering, you can smoothly organize large documents with hundreds of pages without restrictions.',
        },
        {
          q: 'Will fonts or vector paths lose quality when organizing the PDF?',
          a: 'Not at all. PDFBlack performs binary restructuring of the `/Pages` object tree strictly following ISO 32000-1 specifications. Embedded fonts, hyperlinks, vector blueprints, and metadata remain 100% intact without rasterization.',
        },
        {
          q: 'How does the duplex scan interleave feature work?',
          a: 'If you scanned double-sided sheets using a simplex feeder (producing odd front sides 1, 3, 5... followed by reversed even backs 6, 4, 2...), the «Duplex» button automatically interleaves them into continuous numerical sequence (1, 2, 3, 4, 5, 6) in one click.',
        },
        {
          q: 'Can I rotate individual sheets, preview in HD, or delete pages?',
          a: 'Yes. Each page card features hover controls: 90° clockwise rotation, quick delete trash action, and an HD zoom eye icon to inspect pages in full detail inside a modal dialog.',
        },
        {
          q: 'Is it safe to organize confidential contracts or healthcare records?',
          a: '100% confidential and secure. PDFBlack operates with a strict Zero-Knowledge architecture: zero files or data streams ever leave your machine. Everything runs locally in browser RAM, complying with GDPR, HIPAA, and corporate security guidelines.',
        },
        {
          q: 'Can I undo actions if I make a mistake while sorting pages?',
          a: 'You have full Undo and Redo support via the top bar buttons or the universal keyboard shortcuts Ctrl+Z (Undo) and Ctrl+Y / Ctrl+Shift+Z (Redo), with up to 25 history steps in local memory.',
        },
        {
          q: 'Can I insert blank pages or re-number the exported document?',
          a: 'Yes. The «+ Blank Page» button lets you insert empty divider sheets anywhere in the sequence. In the bottom control panel, you can also toggle automated footer page numbering, choosing your preferred template and placement.',
        },
      ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'SoftwareApplication'],
    name: isEs
      ? 'Organizar PDF Gratis Online — Ordenar, Unir, Rotar y Eliminar Páginas | PDFBlack'
      : 'Organize PDF Free Online — Sort, Merge, Rotate & Delete Pages | PDFBlack',
    url: `${SITE_URL}/organizar/reordenar`,
    applicationCategory: 'UtilitiesApplication, BusinessApplication',
    operatingSystem: 'All (Windows, macOS, Linux, iOS, Android)',
    browserRequirements: 'Requires JavaScript. Requires HTML5 Canvas and Web Workers.',
    description: isEs
      ? 'Herramienta profesional para organizar documentos PDF: unir múltiples archivos, ordenar páginas con arrastrar y soltar, rotar, duplicar, eliminar e intercalar escaneos dúplex. 100% local en RAM, sin límites ni marcas de agua.'
      : 'Enterprise-grade tool to organize PDF documents: combine multiple files, reorder pages via drag-and-drop, rotate, duplicate, delete, and interleave duplex scans. 100% in-browser RAM, unlimited and free.',
    softwareVersion: '5.0',
    screenshot: `${SITE_URL}/og-organizar-pdf.png`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '2480',
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Mesa de montaje interactiva tipo canvas con arrastre fluido y zoom HD',
      'Unión de múltiples archivos PDF en una sola sesión de trabajo continuo',
      'Rotación 90°/180°/270° y eliminación rápida en hover por página',
      'Inserción de páginas en blanco y duplicación de hojas en un clic',
      'Previsualización en alta resolución en modal interactivo con zoom',
      'Historial de cambios con soporte Deshacer (Ctrl+Z) y Rehacer (Ctrl+Y)',
      'Reordenamiento inteligente: invertir orden, pares e impares, escaneo dúplex',
      'Re-numeración automática en pie de página con formatos personalizables',
      'Procesamiento 100% en memoria RAM local sin subida a servidores (Zero-Knowledge)',
      'Preservación vectorial absoluta bajo estándar internacional ISO 32000-1',
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  const breadcrumbSchema = {
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
        name: isEs ? 'Organizar Páginas PDF' : 'Organize PDF Pages',
        item: `${SITE_URL}/organizar/reordenar`,
      },
    ],
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isEs
      ? 'Cómo organizar, unir, rotar y ordenar páginas de archivos PDF paso a paso'
      : 'How to organize, merge, rotate, and sort PDF pages step by step',
    description: isEs
      ? 'Guía práctica para organizar páginas de múltiples archivos PDF: ordenar, eliminar, rotar e intercalar hojas en tu navegador 100% gratis y privado.'
      : 'Step-by-step guide to organize pages from multiple PDF files: sort, delete, rotate, and interleave sheets in your browser 100% privately.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: isEs ? 'Cargar uno o múltiples archivos PDF' : 'Upload one or multiple PDF files',
        text: isEs
          ? 'Arrastra uno o varios archivos PDF a la mesa de trabajo para generar miniaturas interactivas de todas las páginas de inmediato.'
          : 'Drag and drop one or more PDF files into the workspace to generate visual interactive page thumbnails instantly.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isEs
          ? 'Organizar, rotar y secuenciar visualmente'
          : 'Organize, rotate, and sequence visually',
        text: isEs
          ? 'Arrastra y suelta tarjetas a la posición deseada, rota hojas 90°, elimina páginas innecesarias o usa patrones automáticos de inversión o intercalación dúplex.'
          : 'Drag page cards to desired spots, rotate sheets 90°, delete unwanted pages, or apply automated reversal and duplex interleave patterns.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isEs ? 'Organizar y descargar el PDF' : 'Organize and download the PDF',
        text: isEs
          ? 'Haz clic en «Organizar y Descargar PDF» para ensamblar el nuevo documento en memoria y descargarlo sin esperas.'
          : 'Click «Organize and Download PDF» to compile the document in local memory and download instantly.',
      },
    ],
  };

  return (
    <>
      {/* SCHEMAS ESTRUCTURADOS JSON-LD PARA SEO TÉCNICO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
        {/* H1 SEMÁNTICO PARA INDEXACIÓN EN MOTORES DE BÚSQUEDA */}
        <h1 className="sr-only">
          {isEs
            ? 'Organizar PDF Gratis Online — Ordenar, Unir, Rotar y Eliminar Páginas'
            : 'Organize PDF Free Online — Sort, Merge, Rotate & Delete Pages'}
        </h1>

        {/* COMPONENTE INTERACTIVO PRINCIPAL CON ERGONOMÍA VERTICAL */}
        <div className="w-full max-w-7xl">
          <PdfOrganizer />
        </div>

        {/* SECCIÓN SEMÁNTICA SEO DE ALTO RENDIMIENTO */}
        <div className="w-full max-w-5xl mt-20 pt-16 border-t border-zinc-800/80 text-zinc-300 font-sans space-y-20">
          {/* 4 PILARES TÉCNICOS DE INGENIERÍA */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                {isEs ? 'ARQUITECTURA DE MONTAJE EMPRESARIAL' : 'ENTERPRISE MONTAGE ARCHITECTURE'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
                {isEs
                  ? 'Control Documental Total y Privacidad en RAM'
                  : 'Total Document Control & In-Memory Privacy'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                {isEs
                  ? 'Organiza, une, rota y edita páginas PDF a nivel profesional sin alterar tipografías, vectores ni metadatos.'
                  : 'Organize, merge, rotate, and edit PDF pages professionally without altering fonts, vectors, or metadata.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-4">
              <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d0d12] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  {isEs ? 'Zero-Knowledge en RAM' : 'In-Memory Zero-Knowledge'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isEs
                    ? 'Todo el ensamblaje se ejecuta en la memoria local de tu navegador. Ningún byte o documento se transmite a la nube, garantizando confidencialidad legal y bancaria.'
                    : 'The entire assembly runs in local browser memory. No data streams or files are sent to cloud servers, ensuring strict legal and corporate privacy.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d0d12] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-white">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  {isEs ? 'Ensamblaje Vectorial ISO' : 'ISO Vector Assembly'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isEs
                    ? 'Reestructuración binaria del árbol de páginas bajo norma ISO 32000-1 sin recompresión ni rasterización, manteniendo nitidez tipográfica al 100%.'
                    : 'Binary tree restructuring under ISO 32000-1 without image recompression or rasterization, preserving 100% typographical and vector sharpness.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d0d12] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-white">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  {isEs ? 'Mesa Multi-Documento' : 'Multi-Doc Canvas'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isEs
                    ? 'Combina hojas de múltiples archivos PDF en un solo espacio de trabajo visual con badges identificadores de documento e inserción de páginas en blanco.'
                    : 'Combine sheets from multiple PDF files in one visual workspace with document origin badges and blank page insertion.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d0d12] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-white">
                  <ArrowLeftRight className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  {isEs ? 'Dúplex y Secuenciación' : 'Duplex & Sequencing'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isEs
                    ? 'Algoritmos en un solo clic para intercalar fajas de escaneo a doble cara, invertir orden completo o agrupar por números pares e impares.'
                    : 'Single-click algorithms to interleave double-sided scan batches, reverse entire document flows, or sort by odd and even pages.'}
                </p>
              </div>
            </div>
          </section>

          {/* GUÍA PASO A PASO */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                {isEs ? 'FLUJO PROFESIONAL' : 'PROFESSIONAL WORKFLOW'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
                {isEs
                  ? 'Cómo organizar tus documentos PDF en 3 pasos'
                  : 'How to organize your PDF documents in 3 steps'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3 relative overflow-hidden">
                <span className="text-3xl font-black text-zinc-700 font-mono block">01</span>
                <h3 className="text-base font-bold text-white">
                  {isEs ? 'Carga uno o varios PDFs' : 'Upload one or more PDFs'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Arrastra tus archivos PDF o selecciónalos desde tu ordenador. Las páginas se despliegan de inmediato como tarjetas interactivas organizables.'
                    : 'Drop your PDF files or pick them from your computer. Pages unfold immediately into interactive, customizable cards.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3 relative overflow-hidden">
                <span className="text-3xl font-black text-zinc-700 font-mono block">02</span>
                <h3 className="text-base font-bold text-white">
                  {isEs
                    ? 'Edita, rota y reordena visualmente'
                    : 'Edit, rotate, and reorder visually'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Arrastra las tarjetas para cambiar su orden, rota páginas 90°, elimina hojas innecesarias, añade páginas en blanco o intercala escaneos dúplex.'
                    : 'Drag cards to change positions, rotate sheets 90°, delete unwanted pages, insert blank sheets, or interleave duplex scans.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3 relative overflow-hidden">
                <span className="text-3xl font-black text-zinc-700 font-mono block">03</span>
                <h3 className="text-base font-bold text-white">
                  {isEs ? 'Organiza y descarga tu PDF' : 'Organize and download your PDF'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Pulsa «Organizar y Descargar PDF». El motor vectorial compila el nuevo documento en la memoria de tu dispositivo y lo descarga al instante.'
                    : 'Click «Organize and Download PDF». The vector engine compiles the new file in device memory and downloads instantly.'}
                </p>
              </div>
            </div>
          </section>

          {/* TABLA COMPARATIVA TÉCNICA */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                {isEs ? 'BENCHMARK DE RENDIMIENTO' : 'PERFORMANCE BENCHMARK'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
                {isEs
                  ? 'PDFBlack vs iLovePDF y Servicios Cloud'
                  : 'PDFBlack vs iLovePDF & Cloud Services'}
              </h2>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-[#0d0d12]">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-300">
                    <th className="p-4 font-bold uppercase">{isEs ? 'Capacidad' : 'Capability'}</th>
                    <th className="p-4 font-bold uppercase text-white bg-zinc-800/60">
                      PDFBlack (Local)
                    </th>
                    <th className="p-4 font-bold uppercase text-zinc-400">
                      {isEs ? 'iLovePDF y Herramientas Cloud' : 'iLovePDF & Cloud Tools'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Privacidad y Protección de Datos' : 'Privacy & Data Protection'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs
                        ? '100% Local en RAM (Zero-Knowledge)'
                        : '100% In-Browser RAM (Zero-Knowledge)'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs
                          ? 'Subida obligatoria a servidores externos'
                          : 'Mandatory remote server upload'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs
                        ? 'Historial Deshacer/Rehacer (Ctrl+Z / Ctrl+Y)'
                        : 'Undo/Redo History (Ctrl+Z / Ctrl+Y)'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs
                        ? '25 estados de memoria con atajos'
                        : '25 history states with key shortcuts'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs ? 'No disponible o limitado' : 'Not available or limited'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Intercalado Dúplex en 1-Clic' : '1-Click Duplex Interleave'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs ? 'Algoritmo automático integrado' : 'Built-in automated algorithm'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs
                          ? 'Reordenación manual página a página'
                          : 'Manual sheet-by-sheet sorting'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs
                        ? 'Previsualización HD en Modal con Zoom'
                        : 'Modal HD Zoom Page Preview'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs
                        ? 'Inspección en alta definición'
                        : 'High-definition full screen inspection'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs
                          ? 'Miniaturas estáticas de baja calidad'
                          : 'Static low-resolution thumbnails'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Inserción de Hojas en Blanco' : 'Blank Page Insertion'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs
                        ? 'Insertar separadores en cualquier punto'
                        : 'Insert divider pages anywhere'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs
                          ? 'Requiere crear y subir un PDF en blanco'
                          : 'Requires creating and uploading blank file'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Límites de Documentos y Coste' : 'Document Limits & Pricing'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs ? '100% Gratuito y Sin Límites' : '100% Free & Unlimited'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs
                          ? 'Capado de páginas o suscripciones de pago'
                          : 'Capped page count or premium tiers'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* CASOS DE USO PROFESIONALES */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                {isEs ? 'APLICACIONES PROFESIONALES' : 'PROFESSIONAL USE CASES'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
                {isEs
                  ? 'Optimizado para Flujos de Trabajo Exigentes'
                  : 'Optimized for High-Demand Workflows'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Bufetes Jurídicos y Notarías' : 'Law Firms & Notary Offices'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Ordena fojas de expedientes judiciales según numeración cronológica estricta, intercalando escritos y anexos periciales sin romper el secreto procesal.'
                      : 'Sequence judicial court filings in strict chronological order, interleaving pleadings and expert evidence without breaching confidentiality.'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Clínicas y Centros de Salud' : 'Clinics & Healthcare'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Compone historias clínicas ordenadas cronológicamente con analíticas, consentimientos y partes quirúrgicos cumpliendo con la privacidad HIPAA.'
                      : 'Compose patient charts chronologically with lab tests, consent waivers, and surgical reports in strict compliance with HIPAA.'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs
                      ? 'Licitaciones y Propuestas Comerciales'
                      : 'Tenders & Commercial Proposals'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Reordena pliegos técnicos, certificaciones de calidad y ofertas económicas en el orden exacto exigido por los evaluadores de licitaciones públicas.'
                      : 'Sequence tender requirements, certifications, and pricing appendices in the exact order specified by public bidding committees.'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Publicación Editorial y Universitaria' : 'Publishing & Editorial Work'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Reorganiza capítulos, índices, prólogos y carátulas de monografías o tesis doctorales antes del envío a imprenta profesional.'
                      : 'Rearrange book chapters, tables of contents, forewords, and covers of dissertations and monographs before press printing.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ACORDEÓN INTERACTIVO DE PREGUNTAS FRECUENTES (FAQ) */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                {isEs ? 'RESOLUCIÓN DE DUDAS' : 'FAQ & SUPPORT'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
                {isEs
                  ? 'Preguntas Frecuentes sobre Organizar PDF'
                  : 'Frequently Asked Questions on Organizing PDF'}
              </h2>
            </div>

            <div className="space-y-3 pt-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-zinc-800/80 bg-[#0d0d12] overflow-hidden transition-colors hover:border-zinc-700"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="text-sm font-bold text-white font-sans">{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-5 pb-5 pt-1 text-xs text-zinc-400 font-sans leading-relaxed border-t border-zinc-800/40">
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
    </>
  );
}
