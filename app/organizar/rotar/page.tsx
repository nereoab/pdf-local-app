'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  Check,
  X as XIcon,
  Scale,
  Stethoscope,
  Briefcase,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import RelatedLongTailSolutions from '@/components/RelatedLongTailSolutions';

const PdfRotator = dynamic(() => import('@/components/PdfRotator'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor de rotación y orientación de páginas PDF...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function RotarPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = isEs
    ? [
        {
          q: '¿Cómo rotar una sola página o todo el documento PDF de forma permanente?',
          a: 'Carga tu archivo PDF; se mostrarán de inmediato las miniaturas de cada hoja con su orientación actual. En cada tarjeta puedes pulsar los iconos de giro (+90° o -90°) para rotar páginas individuales, o recurrir a los botones de rotación masiva en el panel de control inferior para girar todo el documento a la vez. Al descargar el PDF, la orientación queda grabada permanentemente.',
        },
        {
          q: '¿Existe algún límite en el tamaño del archivo o cantidad de páginas a rotar?',
          a: 'No existen limitaciones artificiales impuestas por servidores. Al procesarse con Web Workers dedicados y flujos de transferencia de memoria en tu navegador, puedes rotar manual o masivamente archivos de cientos de páginas o planos técnicos pesados sin esperas ni límites de ancho de banda.',
        },
        {
          q: '¿Se pierde calidad o nitidez en textos, vectores o planos CAD al rotar?',
          a: 'En absoluto. PDFBlack modifica exclusivamente el atributo de matriz de transformación `/Rotate` en el diccionario de la página según el estándar ISO 32000-1. No se aplica rasterización ni recompresión de imágenes, preservando el 100% de la nitidez tipográfica y vectorial original.',
        },
        {
          q: '¿Qué hace la función de «Normalizar Horizontales»?',
          a: 'Esta utilidad detecta de forma automática todas las páginas que posean dimensiones apaisadas (anchura mayor que altura, como diapositivas o planos) y las orienta verticalmente a 90° con un solo clic, permitiendo una lectura uniforme en visores estándar.',
        },
        {
          q: '¿Puedo rotar páginas por rangos de texto específicos (por ejemplo: 1, 3, 5-8)?',
          a: 'Sí. En el panel de control dispones de un campo de selección por rango. Puedes escribir páginas o intervalos separados por comas y luego aplicar giros de +90° o -90° exclusivamente a esas hojas seleccionadas en un solo paso.',
        },
        {
          q: '¿Es seguro rotar documentos confidenciales, planos de ingeniería o balances contables?',
          a: '100% seguro y privado. PDFBlack funciona con arquitectura Zero-Knowledge: ningún dato o byte sale de tu ordenador ni se almacena en la nube. Todo el proceso ocurre en la memoria volátil de tu navegador, cumpliendo estrictamente con el RGPD, HIPAA y estándares corporativos de confidencialidad.',
        },
        {
          q: '¿Puedo rotar un PDF protegido con contraseña de apertura?',
          a: 'Sí. Si el archivo cuenta con cifrado estándar, el sistema lo detectará y te ofrecerá un cajón seguro en memoria para autenticar la clave antes de renderizar y aplicar la nueva orientación, sin exponer tu contraseña externamente.',
        },
        {
          q: '¿La rotación es permanente al abrir el PDF en Acrobat, navegadores o el móvil?',
          a: 'Sí. La modificación se inscribe formalmente en la cabecera interna de cada objeto de página del PDF. Al abrir el archivo descargado en Adobe Acrobat, Foxit, Chrome, Safari o imprimirlo físicamente, conservará la orientación elegida de forma indeleble.',
        },
        {
          q: '¿Funciona en teléfonos móviles iPhone o dispositivos Android?',
          a: 'Sí. La plataforma está optimizada para pantallas táctiles y navegadores móviles modernos como Safari en iOS y Chrome en Android, permitiéndote girar hojas con precisión táctil sin necesidad de instalar aplicaciones nativas.',
        },
      ]
    : [
        {
          q: 'How do I rotate a single page or the entire PDF permanently?',
          a: 'Drop your PDF into the tool; crisp thumbnails of each page render instantly with current orientation markers. On each card you can click rotate buttons (+90° or -90°) to rotate single pages, or use mass rotation buttons in the bottom control panel to rotate all sheets at once. The orientation is permanently saved when you download.',
        },
        {
          q: 'Is there any file size or page limit when rotating PDF documents?',
          a: 'No artificial server-side limits. Because PDFBlack utilizes zero-copy Web Workers directly in local browser RAM, you can rotate large technical dossiers containing hundreds of pages or high-res CAD blueprints without upload queues.',
        },
        {
          q: 'Will vector graphics, embedded fonts, or blueprints lose quality?',
          a: 'Not at all. PDFBlack modifies only the `/Rotate` matrix attribute in the page object dictionary under ISO 32000-1 specifications. Zero rasterization or image recompression occurs, preserving 100% vector fidelity and font sharpness.',
        },
        {
          q: 'What does the «Normalize Landscapes» feature do?',
          a: 'It automatically detects all pages with landscape dimensions (width greater than height, such as presentation slides or blueprints) and rotates them 90° into portrait layout with a single click for uniform viewing.',
        },
        {
          q: 'Can I rotate pages by specific text ranges (e.g. 1, 3, 5-8)?',
          a: 'Yes. The control panel includes a text range selector where you can type comma-separated page numbers or hyphenated intervals and apply +90° or -90° rotation solely to those targeted sheets in one go.',
        },
        {
          q: 'Is it safe to rotate confidential corporate documents, blueprints, or audits?',
          a: '100% confidential and secure. PDFBlack operates under a strict Zero-Knowledge paradigm: zero files or data streams ever leave your device. All rotation operations execute in your browser volatile memory, complying strictly with GDPR and HIPAA.',
        },
        {
          q: 'Can I rotate a password-protected PDF document?',
          a: 'Yes. If your document requires an open password, the tool detects encryption and presents an in-memory unlock drawer so you can authenticate locally before inspecting thumbnails and configuring rotation.',
        },
        {
          q: 'Is the rotation permanent when opening in Adobe Acrobat or printing?',
          a: 'Yes. Rotation parameters are permanently written into the internal PDF page tree. When opened in Adobe Acrobat, mobile viewers, or sent to a physical printer, all pages will retain the exact configured rotation forever.',
        },
        {
          q: 'Does it work smoothly on smartphones and tablets without native apps?',
          a: 'Yes. The interface is responsive and touch-optimized for iOS Safari and Android Chrome, letting you rotate and inspect documents with touch precision wherever you are.',
        },
      ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'SoftwareApplication'],
    name: isEs
      ? 'Rotar PDF Gratis Online — Girar Páginas y Cambiar Orientación PDF | PDFBlack'
      : 'Rotate PDF Online Free — Rotate Pages & Change PDF Orientation | PDFBlack',
    url: isEs ? `${SITE_URL}/organizar/rotar` : `${SITE_URL}/en/rotate-pdf`,
    applicationCategory: 'UtilitiesApplication, BusinessApplication',
    operatingSystem: 'All (Windows, macOS, Linux, iOS, Android)',
    browserRequirements: 'Requires JavaScript. Requires HTML5 Canvas and WebAssembly/Web Workers.',
    description: isEs
      ? 'Gira y cambia la orientación de páginas PDF de forma rápida, gratuita y 100% local. Rota hojas individuales o todo el documento a 90°, 180° o 270° de forma permanente.'
      : 'Rotate and change orientation of PDF pages fast, free, and 100% locally. Rotate single pages or full documents to 90°, 180°, or 270° permanently.',
    softwareVersion: '5.0',
    screenshot: `${SITE_URL}/og-rotar-pdf.png`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1920',
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Modificación permanente de atributo de orientación ISO 32000-1 sin rasterizar',
      'Rotación individual por página (+90°, -90°) con previsualización en vivo',
      'Rotación masiva de todo el documento a 90°, 180° y 270° en un solo clic',
      'Normalización automática inteligente de páginas apaisadas / horizontales',
      'Selección de páginas por paridad (pares e impares) o por rangos de texto',
      'Re-numeración automática en pie de página y edición de metadatos',
      'Desbloqueo seguro de documentos PDF protegidos con contraseña en memoria',
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
        item: isEs ? SITE_URL : `${SITE_URL}/en`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isEs ? 'Organizar PDF' : 'Organize PDF',
        item: isEs ? `${SITE_URL}/organizar` : `${SITE_URL}/en/organize`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isEs ? 'Rotar Páginas PDF' : 'Rotate PDF Pages',
        item: isEs ? `${SITE_URL}/organizar/rotar` : `${SITE_URL}/en/rotate-pdf`,
      },
    ],
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isEs
      ? 'Cómo rotar páginas de un archivo PDF paso a paso'
      : 'How to rotate pages of a PDF file step by step',
    description: isEs
      ? 'Guía práctica para girar y cambiar la orientación de páginas individuales o masivas de un PDF de forma 100% privada.'
      : 'Step-by-step guide to rotate and change orientation of individual or bulk PDF pages 100% privately.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: isEs ? 'Cargar el archivo PDF' : 'Upload the PDF file',
        text: isEs
          ? 'Arrastra tu archivo PDF a la zona de carga para renderizar al instante las miniaturas de cada hoja.'
          : 'Drag your PDF file into the dropzone to instantly render page thumbnails.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isEs ? 'Configurar la rotación' : 'Configure rotation',
        text: isEs
          ? 'Gira hojas individuales en sus tarjetas o utiliza los botones de rotación masiva (+90°, -90°, 180° o normalizar apaisadas).'
          : 'Rotate individual sheets on their cards or use mass rotation buttons (+90°, -90°, 180°, or normalize landscapes).',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isEs ? 'Guardar y descargar el PDF' : 'Save and download the PDF',
        text: isEs
          ? 'Haz clic en «Guardar Cambios y Rotar PDF» para grabar la orientación de forma permanente en memoria y descargar tu archivo.'
          : 'Click «Save Changes & Rotate PDF» to permanently encode orientation in memory and download your file.',
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
          <PdfRotator />
        </div>

        {/* SECCIÓN SEMÁNTICA SEO DE ALTO RENDIMIENTO */}
        <div className="w-full max-w-5xl mt-20 pt-16 border-t border-zinc-800/80 text-zinc-300 font-sans space-y-20">
          {/* PILARES TÉCNICOS DE INGENIERÍA */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                {isEs ? 'ORIENTACIÓN VECTORIAL' : 'VECTOR ORIENTATION'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
                {isEs
                  ? 'Rotación Nativa Sin Pérdida de Calidad'
                  : 'Native Rotation With Zero Quality Loss'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                {isEs
                  ? 'Gira documentos sin recomprimir ni rasterizar fuentes, gráficos CAD o tablas de datos.'
                  : 'Rotate documents without recompressing or rasterizing fonts, CAD schematics, or tables.'}
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
                    ? 'Procesamiento en la memoria volátil de tu navegador sin transferencia a servidores externos, garantizando privacidad total para documentos sensibles.'
                    : 'Processing runs in local browser memory with zero cloud transfer, ensuring total confidentiality for sensitive files.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d0d12] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-white">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  {isEs ? 'Matriz /Rotate ISO' : 'ISO /Rotate Matrix'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isEs
                    ? 'Ajuste del atributo de transformación binaria según la norma ISO 32000-1. La rotación es permanente en cualquier visor y conserva nitidez 1:1.'
                    : 'Modification of the binary transform attribute following ISO 32000-1. The rotation is permanent across all viewers with 1:1 visual fidelity.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d0d12] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-white">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  {isEs ? 'Normalización Inteligente' : 'Smart Normalization'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isEs
                    ? 'Detección automática de páginas apaisadas y herramientas masivas de giro para alinear expedientes escaneados en segundos.'
                    : 'Automatic detection of landscape sheets and bulk tools to align mixed-orientation scanned dossiers in seconds.'}
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
                {isEs ? 'Cómo rotar tus páginas en 3 pasos' : 'How to rotate your pages in 3 steps'}
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
                    ? 'Arrastra tu PDF a la herramienta para generar miniaturas HD con la orientación actual de cada hoja.'
                    : 'Drag and drop your PDF into the tool to generate HD thumbnails with current page orientation.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3 relative overflow-hidden">
                <span className="text-3xl font-black text-zinc-700 font-mono block">02</span>
                <h3 className="text-base font-bold text-white">
                  {isEs ? 'Gira y orienta' : 'Rotate and orient'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Gira hojas sueltas usando los botones de tarjeta o aplica giros masivos a 90°, 180° o por selección.'
                    : 'Rotate single pages using card buttons or apply mass rotations at 90°, 180°, or targeted selections.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3 relative overflow-hidden">
                <span className="text-3xl font-black text-zinc-700 font-mono block">03</span>
                <h3 className="text-base font-bold text-white">
                  {isEs ? 'Descarga permanente' : 'Permanent download'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Haz clic en el botón principal para codificar la nueva orientación en el archivo y descargarlo al instante.'
                    : 'Click the main button to encode permanent orientation in memory and download instantly.'}
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
                      {isEs ? 'Privacidad y Confidencialidad' : 'Privacy & Confidentiality'}
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
                      {isEs ? 'Fidelidad Vectorial' : 'Vector Fidelity'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs
                        ? 'Matriz /Rotate sin rasterizado'
                        : '/Rotate matrix without rasterization'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs
                          ? 'Riesgo de rasterizado y compresión'
                          : 'Risk of rasterization & compression'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Normalizar Apaisadas en 1-Clic' : '1-Click Normalize Landscapes'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs ? 'Algoritmo Integrado' : 'Integrated Algorithm'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs ? 'Giro manual una por una' : 'Manual rotation one by one'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Límites de Tamaño y Páginas' : 'Size & Page Limits'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs ? 'Sin límites artificiales' : 'Zero artificial limits'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs ? 'Capped a 20 págs o suscripción' : 'Capped at 20 pages or paywall'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Costo y Licenciamiento' : 'Cost & Licensing'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs ? '100% Gratuito y Libre' : '100% Free & Open'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs ? 'Cobros recurrentes mensuales' : 'Recurring monthly paywalls'}
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
                {isEs ? 'APLICACIONES PROFESIONALES' : 'PROFESSIONAL APPLICATIONS'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
                {isEs ? 'Casos de Uso en Sectores Críticos' : 'Critical Sector Use Cases'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Ingeniería, Arquitectura y Planos' : 'Engineering, Architecture & CAD'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Orienta planos técnicos CAD apaisados o diagramas de construcción escaneados al revés, preservando cotas milimétricas y capas vectoriales.'
                      : 'Orient landscape CAD blueprints or inverted construction schematics without degrading vector line weights or scaling dimensions.'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Expedientes Judiciales y Notariales' : 'Court Filings & Legal Records'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Corrige hojas de fojas escaneadas boca abajo o en sentido horizontal en sumarios judiciales sin comprometer el secreto profesional.'
                      : 'Correct upside-down or sideways pages in scanned litigation dockets and probate records while maintaining strict confidentiality.'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Historias Clínicas y Hospitales' : 'Clinical Charts & Healthcare'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Alinea informes médicos, electros y analíticas escaneadas desalineadas para su consulta ágil por el equipo médico bajo cumplimiento HIPAA.'
                      : 'Align patient diagnostics, ECG printouts, and lab sheets for seamless clinical review under strict HIPAA compliance.'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Edición Académica y Libros' : 'Academic Publishing & Books'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Reorienta tablas estadísticas o diagramas apaisados en tesis doctorales y monografías para cumplir con estándares de presentación académica.'
                      : 'Reorient statistical tables or landscape appendices in doctoral dissertations to satisfy academic formatting standards.'}
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

          {/* Soluciones Long-Tail Relacionadas */}
          <RelatedLongTailSolutions toolKey="rotar" />
        </div>
      </main>
    </>
  );
}
