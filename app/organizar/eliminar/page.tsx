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
  Trash2,
  Check,
  X as XIcon,
  Scale,
  Stethoscope,
  Briefcase,
  GraduationCap,
  Sparkles,
  Filter,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfPageDeleter = dynamic(() => import('@/components/PdfPageDeleter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor de depuración y eliminación de páginas PDF...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function EliminarPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = isEs
    ? [
        {
          q: '¿Cómo elimino una o varias páginas específicas de un documento PDF?',
          a: 'Solo debes cargar tu archivo PDF en la herramienta; se generarán de inmediato miniaturas visuales de cada hoja. Haz clic sobre las páginas que desees descartar (se marcarán en rojo con un icono de confirmación) o escribe los números y rangos en el campo de texto (por ejemplo: «2, 5, 8-12»). Luego pulsa «Eliminar Páginas» para descargar el documento depurado al instante.',
        },
        {
          q: '¿Existe algún límite en el tamaño del archivo o número de páginas para depurar?',
          a: 'No existen limitaciones artificiales impuestas por servidores remotos. Al procesarse con Web Workers acelerados y buffers de memoria local en tu navegador, puedes cargar expedientes de cientos de páginas o archivos de decenas de megabytes sin demoras de transferencia ni colas de espera.',
        },
        {
          q: '¿Se altera la calidad tipográfica o los vectores de las páginas conservadas?',
          a: 'En absoluto. PDFBlack efectúa una supresión a nivel de árbol de objetos binario bajo el estándar internacional ISO 32000-1. Las páginas restantes mantienen sus fuentes tipográficas incrustadas, vectores CAD, tablas, marcadores e hipervínculos con paridad 1:1, sin aplicar rasterización ni recomprimir imágenes.',
        },
        {
          q: '¿Cómo funciona la detección automática de páginas en blanco?',
          a: 'El motor analiza los canales cromáticos de cada página renderizada mediante un muestreador en Canvas. Si los píxeles no blancos representan menos del 0.5% del área útil de la hoja, la herramienta la etiqueta automáticamente como página en blanco y te permite seleccionarlas todas con un solo clic para eliminarlas en lote.',
        },
        {
          q: '¿Es seguro eliminar páginas de contratos legales, historiales médicos o balances financieros?',
          a: '100% seguro y confidencial. PDFBlack cuenta con una arquitectura estricta Zero-Knowledge: ningún dato, página o byte viaja a través de Internet ni se guarda en servidores externos. Toda la manipulación de bytes se ejecuta de forma aislada en la memoria RAM de tu propio dispositivo, cumpliendo con el RGPD, HIPAA y estándares de secreto profesional.',
        },
        {
          q: '¿Puedo eliminar páginas de un PDF protegido con contraseña de apertura?',
          a: 'Sí. Si el documento PDF cuenta con cifrado nativo estándar, la plataforma detectará la protección y te brindará un cajón seguro en memoria local para autenticar la clave. Una vez validada, podrás inspeccionar las miniaturas y seleccionar qué hojas purgar sin exponer tu contraseña fuera del navegador.',
        },
        {
          q: '¿Qué ocurre con la numeración de páginas en el documento resultante?',
          a: 'Puedes activar la casilla de re-numeración automática en el panel de control. El motor reescribirá la estructura de paginación interna para que los visores PDF muestren la secuencia continua correlativa (por ejemplo, Página 1 de N) sin saltos numéricos causados por las hojas removidas.',
        },
        {
          q: '¿Puedo eliminar páginas pares o impares con un solo clic?',
          a: 'Sí. En la barra de herramientas dispones de botones rápidos para marcar instantáneamente todas las páginas pares o todas las impares, lo que resulta especialmente útil tras escaneos a doble cara con caras en blanco o anversos defectuosos.',
        },
        {
          q: '¿Funciona en teléfonos móviles y tablets sin instalar aplicaciones adicionales?',
          a: 'Sí. La interfaz está diseñada de forma fluida y responsiva para operar con total estabilidad en navegadores modernos como Safari en iOS y Chrome en Android, permitiéndote depurar documentos PDF con precisión táctil desde cualquier lugar.',
        },
      ]
    : [
        {
          q: 'How do I delete specific pages from a PDF document?',
          a: 'Simply drop your PDF into the tool; crisp visual thumbnails of each sheet will render instantly. Click on any pages you wish to discard (they will turn red with a clear deletion badge) or enter page numbers and ranges into the input box (e.g. «2, 5, 8-12»). Then click «Delete Pages» to download your cleaned document immediately.',
        },
        {
          q: 'Is there any file size or page limit when deleting PDF pages?',
          a: 'No artificial server-side limits. Because PDFBlack utilizes zero-copy Web Workers directly in your local browser RAM, you can process large dossiers containing hundreds of pages or multi-megabyte blueprints without upload queues or bandwidth restrictions.',
        },
        {
          q: 'Will vector graphics, embedded fonts, or text quality degrade in kept pages?',
          a: 'Not at all. PDFBlack performs object-level binary surgery following ISO 32000-1 specifications. Kept pages preserve their embedded fonts, CAD vector paths, spreadsheets, bookmarks, and links losslessly without rasterization or image recompression.',
        },
        {
          q: 'How does automated blank page detection work?',
          a: 'Our engine scans the color channels of each rendered page via an in-memory Canvas sampler. If non-white pixels account for less than 0.5% of the page area, the page is flagged as blank, allowing you to select and purge all blank pages with a single click.',
        },
        {
          q: 'Is it safe to delete pages from legal contracts, health records, or financial audits?',
          a: '100% private and confidential. PDFBlack operates under a strict Zero-Knowledge paradigm: zero files or data streams ever leave your device or reach cloud servers. All page stripping occurs purely in temporary memory, strictly complying with GDPR, HIPAA, and corporate data governance.',
        },
        {
          q: 'Can I delete pages from a password-protected PDF file?',
          a: 'Yes. If your PDF is encrypted with an open password, the tool detects the security stream and provides an in-memory unlock field so you can authenticate it locally before choosing which pages to discard.',
        },
        {
          q: 'What happens to page numbering in the resulting PDF?',
          a: 'You can enable automatic re-numbering in the control panel. The engine updates the internal page labels so PDF readers display continuous sequential page counts (e.g. Page 1 of N) without gaps caused by discarded sheets.',
        },
        {
          q: 'Can I delete all even or all odd pages with a single click?',
          a: 'Yes. The top toolbar includes quick mass-selection buttons for all even or all odd pages, which is especially handy after scanning double-sided stacks with blank backs or misaligned feeds.',
        },
        {
          q: 'Does it work smoothly on smartphones and tablets without native apps?',
          a: 'Yes. The web app is responsive and optimized for touchscreens on iOS Safari and Android Chrome, letting you review thumbnails and discard unwanted pages with touch precision on the go.',
        },
      ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'SoftwareApplication'],
    name: isEs
      ? 'Eliminar Páginas PDF Gratis Online — Borrar Hojas PDF | PDFBlack'
      : 'Delete PDF Pages Free Online — Remove PDF Sheets | PDFBlack',
    url: `${SITE_URL}/organizar/eliminar`,
    applicationCategory: 'UtilitiesApplication, BusinessApplication',
    operatingSystem: 'All (Windows, macOS, Linux, iOS, Android)',
    browserRequirements: 'Requires JavaScript. Requires HTML5 Canvas and WebAssembly/Web Workers.',
    description: isEs
      ? 'Elimina páginas y hojas no deseadas de documentos PDF por selección visual, rangos, pares/impares o páginas en blanco de forma rápida, gratuita y 100% local.'
      : 'Delete unwanted pages and sheets from PDF documents via visual selection, ranges, evens/odds, or blank page detection fast, free, and 100% locally.',
    softwareVersion: '5.0',
    screenshot: `${SITE_URL}/og-eliminar-pdf.png`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1840',
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Supresión vectorial limpia preservando fuentes y resolución nativa ISO 32000-1',
      'Selección visual con miniaturas reales en cuadrícula responsiva',
      'Detección automática de páginas en blanco con algoritmo heurístico Canvas',
      'Eliminación por rangos numéricos continuos o discontinuos (ej. 2, 5, 8-12)',
      'Filtros masivos de un solo clic para páginas pares e impares',
      'Re-numeración automática de páginas en pie de página',
      'Edición de metadatos del PDF resultante (Título, Autor, Asunto)',
      'Procesamiento 100% en memoria RAM local sin subida a servidores (Zero-Knowledge)',
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
        name: isEs ? 'Eliminar Páginas PDF' : 'Delete PDF Pages',
        item: `${SITE_URL}/organizar/eliminar`,
      },
    ],
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isEs
      ? 'Cómo eliminar páginas de un archivo PDF paso a paso'
      : 'How to delete pages from a PDF file step by step',
    description: isEs
      ? 'Guía práctica para eliminar hojas no deseadas, páginas en blanco o rangos de un PDF de forma 100% privada y local.'
      : 'Step-by-step guide to delete unwanted pages, blank sheets, or ranges from a PDF 100% privately and locally.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: isEs ? 'Cargar el archivo PDF' : 'Upload the PDF file',
        text: isEs
          ? 'Arrastra tu archivo PDF a la zona interactiva o haz clic en «Seleccionar Archivo PDF» para renderizar las miniaturas en tu navegador.'
          : 'Drop your PDF file into the dropzone or click «Select PDF File» to render instant thumbnails in your browser.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isEs ? 'Seleccionar las hojas a eliminar' : 'Select pages to delete',
        text: isEs
          ? 'Haz clic sobre las hojas que deseas descartar, utiliza los filtros masivos (pares, impares, blancas) o escribe los rangos en el panel de control.'
          : 'Click on the sheets you want to discard, use mass filters (evens, odds, blanks), or type page ranges in the control panel.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isEs ? 'Procesar y descargar el PDF' : 'Process and download the PDF',
        text: isEs
          ? 'Haz clic en «Eliminar Páginas del PDF» para generar el nuevo archivo depurado en memoria y descargarlo de inmediato.'
          : 'Click «Delete Pages from PDF» to generate the cleaned file in memory and download it immediately.',
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
        {/* COMPONENTE INTERACTIVO PRINCIPAL CON ERGONOMÍA VERTICAL */}
        <div className="w-full max-w-7xl">
          <PdfPageDeleter />
        </div>

        {/* SECCIÓN SEMÁNTICA SEO DE ALTO RENDIMIENTO */}
        <div className="w-full max-w-5xl mt-20 pt-16 border-t border-zinc-800/80 text-zinc-300 font-sans space-y-20">
          {/* PILARES TÉCNICOS DE INGENIERÍA */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                {isEs ? 'ARQUITECTURA DEPURADA' : 'CLEAN ARCHITECTURE'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
                {isEs
                  ? 'Ingeniería Vectorial y Privacidad Absoluta'
                  : 'Vector Engineering & Absolute Privacy'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                {isEs
                  ? 'Elimina páginas superfluas sin desestructurar metadatos, tipografías ni capas vectoriales complejas.'
                  : 'Purge obsolete pages without breaking metadata, typography, or intricate vector layers.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d0d12] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  {isEs ? 'Zero-Knowledge en RAM' : 'In-Memory Zero-Knowledge'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isEs
                    ? 'A diferencia de los conversores convencionales, ningún byte abandona tu dispositivo. Todo el renderizado y supresión de hojas ocurre en la memoria volátil de tu navegador.'
                    : 'Unlike legacy converters, not a single byte leaves your device. All rendering and sheet deletion execute in your browser volatile memory.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d0d12] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-white">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  {isEs ? 'Supresión Vectorial ISO' : 'ISO Vector Deletion'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isEs
                    ? 'Manipulación directa del árbol binario de objetos conforme a ISO 32000-1. Las páginas conservadas no sufren rasterización, conservando textos nítidos y gráficos al 100% de calidad.'
                    : 'Direct manipulation of the binary object tree conforming to ISO 32000-1. Kept pages undergo zero rasterization, preserving crisp text and 100% vector fidelity.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d0d12] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-white">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  {isEs ? 'Filtros Inteligentes de Hoja' : 'Smart Sheet Filters'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isEs
                    ? 'Detección heurística de páginas en blanco, selección por paridad (pares/impares) y sintaxis de rangos numéricos para depurar documentos masivos en segundos.'
                    : 'Heuristic blank page detection, parity filtering (evens/odds), and numeric range syntax to sanitize bulk documents in seconds.'}
                </p>
              </div>
            </div>
          </section>

          {/* GUÍA PASO A PASO */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                {isEs ? 'FLUJO SIMPLIFICADO' : 'SIMPLIFIED WORKFLOW'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
                {isEs ? 'Cómo eliminar páginas de tu PDF' : 'How to delete pages from your PDF'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3 relative overflow-hidden">
                <span className="text-3xl font-black text-zinc-700 font-mono block">01</span>
                <h3 className="text-base font-bold text-white">
                  {isEs ? 'Carga tu archivo' : 'Upload your file'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Arrastra tu PDF a la caja de carga. La aplicación renderiza al instante miniaturas de alta definición de cada página.'
                    : 'Drag and drop your PDF into the upload area. The app immediately renders high-definition thumbnails of each page.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3 relative overflow-hidden">
                <span className="text-3xl font-black text-zinc-700 font-mono block">02</span>
                <h3 className="text-base font-bold text-white">
                  {isEs ? 'Marca las hojas a descartar' : 'Mark pages to discard'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Haz clic sobre las páginas a eliminar o utiliza los filtros rápidos de páginas pares, impares, en blanco o rangos de texto.'
                    : 'Click on the pages you want to delete or use quick filters for evens, odds, blank sheets, or text ranges.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3 relative overflow-hidden">
                <span className="text-3xl font-black text-zinc-700 font-mono block">03</span>
                <h3 className="text-base font-bold text-white">
                  {isEs ? 'Descarga el PDF depurado' : 'Download clean PDF'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Haz clic en el botón principal. El Web Worker elimina las páginas en milisegundos y genera la descarga limpia sin marcas de agua.'
                    : 'Click the main action button. The Web Worker purges the pages in milliseconds and triggers a watermark-free download.'}
                </p>
              </div>
            </div>
          </section>

          {/* TABLA COMPARATIVA TÉCNICA */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                {isEs ? 'BENCHMARK TÉCNICO' : 'TECHNICAL BENCHMARK'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
                {isEs ? 'PDFBlack vs Servicios en la Nube' : 'PDFBlack vs Cloud Services'}
              </h2>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-[#0d0d12]">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-300">
                    <th className="p-4 font-bold uppercase">
                      {isEs ? 'Característica' : 'Feature'}
                    </th>
                    <th className="p-4 font-bold uppercase text-white bg-zinc-800/60">PDFBlack</th>
                    <th className="p-4 font-bold uppercase text-zinc-400">
                      {isEs ? 'Servicios en la Nube' : 'Cloud Services'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Privacidad y Gobernanza' : 'Privacy & Governance'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs ? '100% Local (Zero-Knowledge)' : '100% Local (Zero-Knowledge)'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs ? 'Subida obligatoria a servidores' : 'Mandatory cloud upload'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Velocidad de Procesamiento' : 'Processing Speed'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs ? 'Instantáneo en RAM (Web Worker)' : 'Instant in RAM (Web Worker)'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs ? 'Dependiente de subida/bajada' : 'Dependent on bandwidth'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Límites de Archivo y Páginas' : 'File & Page Limits'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs ? 'Sin límites artificiales' : 'Zero artificial limits'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs ? 'Restringido a 50MB o 20 págs gratis' : 'Capped at 50MB or 20 pgs'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Detección de Páginas en Blanco' : 'Blank Page Detection'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs ? 'Algoritmo Heurístico Integrado' : 'Integrated Heuristic Algorithm'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs ? 'Solo planes de pago empresarial' : 'Paid enterprise plans only'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Costo y Licenciamiento' : 'Cost & Licensing'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs ? '100% Gratuito e Ilimitado' : '100% Free & Unlimited'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs
                          ? 'Suscripciones mensuales recurrentes'
                          : 'Monthly recurring paywalls'}
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
                {isEs ? 'APLICACIONES EN LA INDUSTRIA' : 'INDUSTRY APPLICATIONS'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
                {isEs ? 'Soluciones para Sectores Críticos' : 'Solutions for Critical Sectors'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Sector Legal y Notarial' : 'Legal & Notarial Sector'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Depura sumarios, hojas en blanco de fojas escaneadas y páginas de trámites canceladas manteniendo el estricto secreto profesional del secreto de sumario sin transferir expedientes a la nube.'
                      : 'Purge case briefs, blank scanned sheet backs, and revoked filings while preserving strict attorney-client privilege without uploading dockets to external servers.'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Salud y Registros Médicos' : 'Health & Clinical Records'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Elimina hojas de consentimiento desactualizadas o informes clínicos redundantes de historiales médicos bajo riguroso cumplimiento de normativas de confidencialidad médica (HIPAA/RGPD).'
                      : 'Remove outdated consent forms or redundant diagnostics from clinical patient files while strictly upholding healthcare data privacy (HIPAA/GDPR).'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Auditoría y Finanzas' : 'Audit & Corporate Finance'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Depura anexos no aprobados, borradores contables intermedios y hojas de cálculo preliminares de balances consolidados antes de presentar reportes ante directorios o accionistas.'
                      : 'Remove unapproved appendices, interim drafts, and draft balance sheets from consolidated audit packages prior to board and shareholder presentation.'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Academia e Investigación' : 'Academia & Research'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Remueve carátulas publicitarias de repositorios universitarios, hojas de evaluación preliminares y páginas de notas sobrantes en artículos de investigación y tesis doctorales.'
                      : 'Strip university repository promotional cover pages, evaluation sheets, and redundant blank leaves from journal preprints and doctoral dissertations.'}
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
                {isEs ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
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
