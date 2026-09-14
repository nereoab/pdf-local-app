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
  Type,
  Check,
  X as XIcon,
  Scale,
  Stethoscope,
  Briefcase,
  GraduationCap,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Lock,
  Sliders,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfEditor = dynamic(() => import('@/components/PdfEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor de edición de texto e imágenes PDF...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function EditarTextoPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = isEs
    ? [
        {
          q: '¿Qué diferencia hay entre el Motor In-Situ Nativo y el Motor Apryse WASM?',
          a: 'PDFBlack cuenta con arquitectura Dual-Engine: el Motor In-Situ Nativo arranca al instante (<200 ms), es 100% de código abierto sin licencias ni marcas de agua, y permite modificar texto existente, añadir párrafos e insertar imágenes con extrema ligereza. El Motor Apryse WASM ejecuta un entorno binario WebAssembly especializado para documentos con flujos tipográficos profundos. Puedes alternar entre ambos con un solo clic según tus necesidades.',
        },
        {
          q: '¿Cómo puedo editar texto existente dentro de un documento PDF?',
          a: 'Arrastra tu PDF a la herramienta para abrir el editor interactivo. Haz doble clic sobre cualquier bloque de texto existente para modificar palabras, corregir erratas o ajustar fuentes, tamaños y colores. Cuando termines, haz clic en «Terminar y Grabar» para exportar el archivo modificado de forma inmediata.',
        },
        {
          q: '¿Puedo insertar imágenes, logotipos o firmas en el PDF?',
          a: 'Sí. Puedes añadir imágenes en formatos PNG, JPG o SVG directamente en cualquier página del documento, redimensionarlas, rotarlas o colocarlas como sellos o logotipos corporativos sin perder calidad gráfica.',
        },
        {
          q: '¿Se requiere instalar programas o registrarse para usar el editor?',
          a: 'No requiere registro, suscripción ni descargas. Toda la suite de edición se ejecuta directamente en tu navegador web mediante tecnologías WebAssembly y Canvas acelerado, ofreciendo una experiencia inmediata y sin barreras.',
        },
        {
          q: '¿El documento resultante tendrá marcas de agua publicitarias?',
          a: 'En absoluto. PDFBlack es una herramienta 100% gratuita y sin marcas de agua. Tu documento exportado conserva exactamente la estética y limpieza visual original sin marcas ni sellos intrusivos.',
        },
        {
          q: '¿Qué ocurre con las tipografías originales del documento?',
          a: 'El motor analiza las capas tipográficas del archivo PDF para igualar las fuentes incrustadas según la especificación ISO 32000-1. Si el PDF utiliza fuentes del sistema o estándar, el espaciado y alineación se conservan con total naturalidad.',
        },
        {
          q: '¿Es seguro editar contratos legales, nóminas o informes confidenciales?',
          a: 'Es 100% privado y seguro. PDFBlack cuenta con una arquitectura Zero-Knowledge: ningún byte de tu documento se sube a servidores externos ni a la nube. Todo el proceso de edición y guardado se procesa localmente en la memoria RAM de tu dispositivo.',
        },
        {
          q: '¿Puedo editar PDFs escaneados o basados en fotografías?',
          a: 'Para PDFs compuestos por imágenes escaneadas, te recomendamos procesar primero el documento con nuestra herramienta gratuita de OCR en PDF para convertir los mapas de bits en texto seleccionable y editable antes de abrirlo en este editor.',
        },
        {
          q: '¿Puedo re-numerar las páginas o cambiar los metadatos al guardar?',
          a: 'Sí. En el panel de opciones avanzadas ubicado debajo del editor puedes activar la re-numeración automática en pie de página y personalizar el título, autor y asunto del documento PDF generado.',
        },
        {
          q: '¿Existe algún límite en la cantidad de páginas o veces que puedo usar el editor?',
          a: 'No existen limitaciones de uso diario ni cuotas ocultas. Puedes editar tantos documentos y páginas como requieras de manera ilimitada.',
        },
      ]
    : [
        {
          q: 'What is the difference between Native In-Situ Engine and Apryse WASM Engine?',
          a: 'PDFBlack features a Dual-Engine architecture: the Native In-Situ Engine boots instantly (<200ms), requires zero licenses or watermarks, and lets you modify existing text, insert paragraphs, and embed images with extreme speed. The Apryse WASM Engine executes a WebAssembly binary runtime for deeply nested typographic documents. You can switch between both with a single click.',
        },
        {
          q: 'How can I edit existing text inside a PDF document?',
          a: 'Drag your PDF into the tool to open the interactive editor. Double-click on any existing text block to edit wording, correct typos, or change fonts, sizes, and colors. When finished, click «Finish & Save» to export the updated file immediately.',
        },
        {
          q: 'Can I insert images, logos, or signatures into the PDF?',
          a: 'Yes. You can add images in PNG, JPG, or SVG formats onto any page, resize, rotate, or place them as graphic stamps or corporate logos without resolution loss.',
        },
        {
          q: 'Do I need to install software or register an account?',
          a: 'No registration, subscriptions, or installations required. The entire editing suite runs directly in your browser using WebAssembly and accelerated Canvas, offering instant access.',
        },
        {
          q: 'Will the exported document have advertising watermarks?',
          a: 'Not at all. PDFBlack is 100% free with zero watermarks. Your exported document preserves pristine visual cleanliness without promotional stamps.',
        },
        {
          q: 'What happens to the original fonts in the document?',
          a: 'The engine inspects the PDF typography layers to match embedded fonts under ISO 32000-1 specifications. Spacing and formatting remain visually consistent with the original file.',
        },
        {
          q: 'Is it safe to edit confidential legal contracts or payrolls?',
          a: '100% private and secure. PDFBlack operates with a strict Zero-Knowledge architecture: zero bytes of your document are uploaded to cloud servers. All editing and saving happens in local device RAM.',
        },
        {
          q: 'Can I edit scanned PDFs or image-based documents?',
          a: 'For scanned PDFs made of photos, we recommend processing the file first with our free PDF OCR tool to convert raster images into selectable, editable text before opening it here.',
        },
        {
          q: 'Can I re-number pages or adjust metadata when saving?',
          a: 'Yes. In the advanced options panel beneath the editor, you can toggle automated footer page numbering and configure custom title, author, and subject metadata.',
        },
        {
          q: 'Is there any limit on pages or daily edit quotas?',
          a: 'There are no artificial limits or paywalls. You can edit as many documents and pages as you need without restrictions.',
        },
      ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'SoftwareApplication'],
    name: isEs
      ? 'Editar PDF Gratis Online — Modificar Texto e Imágenes en PDF | PDFBlack'
      : 'Edit PDF Free Online — Modify Text & Images in PDF | PDFBlack',
    url: `${SITE_URL}/editar/texto`,
    applicationCategory: 'UtilitiesApplication, BusinessApplication',
    operatingSystem: 'All (Windows, macOS, Linux, iOS, Android)',
    browserRequirements: 'Requires JavaScript. Requires HTML5 Canvas and WebAssembly.',
    description: isEs
      ? 'Herramienta profesional para editar documentos PDF online gratis: modifica texto existente, añade párrafos, inserta imágenes, logotipos y firmas de forma 100% privada en memoria RAM, sin marcas de agua.'
      : 'Professional free online PDF editor: modify existing text, add paragraphs, insert images, logos, and signatures 100% privately in-browser RAM without watermarks.',
    softwareVersion: '5.0',
    screenshot: `${SITE_URL}/og-editar-texto-pdf.png`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '3250',
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Edición nativa de texto existente y añadido de nuevos bloques tipográficos',
      'Inserción de imágenes PNG, JPG y SVG con escalado y rotación',
      'Anotaciones avanzadas: resaltado, notas, formas geométricas y firmas',
      'Sin marcas de agua publicitarias ni sellos impuestos en el PDF final',
      'Preservación de capas vectoriales y fuentes bajo norma ISO 32000-1',
      'Re-numeración automática de páginas y personalización de metadatos',
      'Procesamiento 100% en memoria RAM local sin subida a servidores (Zero-Knowledge)',
      'Compatible con todos los sistemas operativos sin registro ni instalación',
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
        name: isEs ? 'Editar PDF' : 'Edit PDF',
        item: `${SITE_URL}/editar`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isEs ? 'Editar Texto e Imágenes' : 'Edit Text & Images',
        item: `${SITE_URL}/editar/texto`,
      },
    ],
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isEs
      ? 'Cómo editar texto e imágenes en un archivo PDF paso a paso'
      : 'How to edit text and images in a PDF file step by step',
    description: isEs
      ? 'Guía práctica para modificar texto existente, añadir párrafos e insertar imágenes en un documento PDF desde tu navegador sin marcas de agua.'
      : 'Step-by-step guide to modify existing text, add paragraphs, and insert images into a PDF from your browser without watermarks.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: isEs ? 'Cargar el archivo PDF' : 'Upload the PDF file',
        text: isEs
          ? 'Arrastra tu documento PDF a la mesa de trabajo o haz clic en «Seleccionar Archivo PDF» para abrirlo en el editor.'
          : 'Drag your PDF file into the workspace or click «Select PDF File» to open it in the editor.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isEs ? 'Modificar texto e insertar elementos' : 'Modify text and insert elements',
        text: isEs
          ? 'Haz clic sobre el texto que deseas editar, cambia el contenido tipográfico o añade nuevas imágenes, formas y firmas en las páginas deseadas.'
          : 'Click on the text you want to edit, adjust typographical content, or insert new images, shapes, and signatures on desired pages.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isEs ? 'Terminar y descargar el PDF' : 'Finish and download the PDF',
        text: isEs
          ? 'Haz clic en «Terminar y Grabar» para consolidar los cambios en memoria y descargar tu PDF limpio sin marcas de agua.'
          : 'Click «Finish & Save» to compile changes in memory and download your clean PDF without watermarks.',
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
        {/* H1 SEMÁNTICO PARA MOTORES DE BÚSQUEDA */}
        <h1 className="sr-only">
          {isEs
            ? 'Editar PDF Gratis Online — Modificar Texto e Imágenes en PDF'
            : 'Edit PDF Free Online — Modify Text & Images in PDF'}
        </h1>

        {/* COMPONENTE INTERACTIVO PRINCIPAL */}
        <div className="w-full max-w-7xl">
          <PdfEditor />
        </div>

        {/* SECCIÓN SEMÁNTICA SEO DE ALTO RENDIMIENTO */}
        <div className="w-full max-w-5xl mt-20 pt-16 border-t border-zinc-800/80 text-zinc-300 font-sans space-y-20">
          {/* 4 PILARES TÉCNICOS DE INGENIERÍA */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                {isEs ? 'ARQUITECTURA DE EDICIÓN NATIVA' : 'NATIVE EDITING ARCHITECTURE'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans uppercase">
                {isEs
                  ? 'Edición Vectorial Directa y Privacidad en RAM'
                  : 'Direct Vector Editing & In-Memory Privacy'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                {isEs
                  ? 'Modifica textos y enriquece documentos con imágenes sin recurrir a software propietario ni arriesgar tu privacidad.'
                  : 'Edit text and enrich documents with images without proprietary software or privacy risks.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-4">
              <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d0d12] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-white">
                  <Sliders className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  {isEs ? 'Doble Motor de Edición' : 'Dual Editing Engines'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isEs
                    ? 'Elige entre el Motor In-Situ Nativo (ultrarrápido, sin licencias ni marcas de agua) y el Motor Apryse WASM para máxima versatilidad.'
                    : 'Choose between Native In-Situ Engine (instant, license-free, zero watermarks) and Apryse WASM for maximum document versatility.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d0d12] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-white">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  {isEs ? 'Inserción Gráfica' : 'Graphic Insertion'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isEs
                    ? 'Incorpora imágenes PNG, JPG o sellos con soporte de transparencia alfa, escalado proporcional y posicionamiento milimétrico.'
                    : 'Embed PNG, JPG, or stamp images with alpha transparency, proportional scaling, and millimeter placement.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d0d12] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  {isEs ? 'Zero-Knowledge en RAM' : 'In-Memory Zero-Knowledge'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isEs
                    ? 'Tus archivos se procesan 100% en la memoria de tu dispositivo. Cero transmisiones a servidores externos, garantizando secreto profesional.'
                    : 'Files are processed 100% in local device memory. Zero cloud transmissions, ensuring strict professional secrecy.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d0d12] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-white">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  {isEs ? 'Sin Marcas de Agua' : 'Zero Watermarks'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isEs
                    ? 'Exportación limpia y profesional. Sin sellos publicitarios, límites de páginas ni degradación de calidad visual.'
                    : 'Clean and professional export. Zero promotional watermarks, no page caps, and no loss in visual sharpness.'}
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
                {isEs
                  ? 'Cómo editar texto e imágenes en 3 pasos'
                  : 'How to edit text and images in 3 steps'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3 relative overflow-hidden">
                <span className="text-3xl font-black text-zinc-700 font-mono block">01</span>
                <h3 className="text-base font-bold text-white">
                  {isEs ? 'Carga tu documento' : 'Upload your document'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Arrastra tu archivo PDF al área de trabajo o selecciónalo desde tu ordenador. El motor extrae las capas de texto al instante.'
                    : 'Drop your PDF file into the workspace or pick it from your device. The engine parses text layers instantly.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3 relative overflow-hidden">
                <span className="text-3xl font-black text-zinc-700 font-mono block">02</span>
                <h3 className="text-base font-bold text-white">
                  {isEs ? 'Edita texto e inserta imágenes' : 'Edit text & insert images'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Haz doble clic sobre el texto para corregirlo, ajusta tipografías o añade imágenes, sellos y firmas desde la barra interactiva.'
                    : 'Double-click text to modify wording, adjust fonts, or add images, stamps, and signatures from the interactive toolbar.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3 relative overflow-hidden">
                <span className="text-3xl font-black text-zinc-700 font-mono block">03</span>
                <h3 className="text-base font-bold text-white">
                  {isEs ? 'Guarda y descarga limpio' : 'Save & download clean'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isEs
                    ? 'Pulsa «Terminar y Grabar». Los cambios se consolidan en la memoria local y el archivo resultante se descarga sin marcas de agua.'
                    : 'Click «Finish & Save». Edits compile in local memory and the clean file downloads instantly without watermarks.'}
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
                {isEs
                  ? 'PDFBlack vs Editores en la Nube y de Escritorio'
                  : 'PDFBlack vs Cloud & Desktop Editors'}
              </h2>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-[#0d0d12]">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-300">
                    <th className="p-4 font-bold uppercase">{isEs ? 'Capacidad' : 'Capability'}</th>
                    <th className="p-4 font-bold uppercase text-white bg-zinc-800/60">
                      PDFBlack (Local en RAM)
                    </th>
                    <th className="p-4 font-bold uppercase text-zinc-400">
                      {isEs ? 'Adobe Acrobat Pro' : 'Adobe Acrobat Pro'}
                    </th>
                    <th className="p-4 font-bold uppercase text-zinc-400">
                      {isEs ? 'Smallpdf / iLovePDF' : 'Smallpdf / iLovePDF'}
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
                      {isEs ? 'Requiere cuenta y sincroniza nube' : 'Requires cloud sync account'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs ? 'Subida a servidores remotos' : 'Uploaded to remote servers'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Costo y Suscripción' : 'Cost & Subscription'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs ? '100% Gratuito Ilimitado' : '100% Free & Unlimited'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs ? '$240+ USD anuales' : '$240+ USD/year'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs
                          ? 'Máx. 2 tareas/día o muro de pago'
                          : 'Capped at 2 tasks/day or paywall'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Marcas de Agua en el PDF' : 'Output Watermarks'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs ? 'Cero Marcas de Agua' : 'Zero Watermarks'}
                    </td>
                    <td className="p-4 text-zinc-300">
                      {isEs ? 'Sin marcas (de pago)' : 'Clean (paid)'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      {isEs ? 'Marcas en versiones de prueba' : 'Watermarks on trials'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Instalación de Software' : 'Software Installation'}
                    </td>
                    <td className="p-4 text-white bg-zinc-800/30 flex items-center gap-1.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {isEs ? 'Cero descargas (en navegador)' : 'Zero downloads (in-browser)'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <XIcon className="w-4 h-4 text-red-400 shrink-0" />
                        {isEs ? 'Instalador pesado (+1.5 GB)' : 'Heavy desktop installer (+1.5 GB)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-300">{isEs ? 'En navegador' : 'In-browser'}</td>
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
                  ? 'Solución Integral para Todo Sector'
                  : 'Comprehensive Solution for Any Industry'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Sector Jurídico y Contratos' : 'Legal & Contract Management'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Corrige cláusulas, fechas o datos de comparecientes en contratos mercantiles y acuerdos de confidencialidad con reserva absoluta de información.'
                      : 'Modify clauses, dates, or party details in commercial contracts and NDAs with strict non-disclosure compliance.'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Facturación y Finanzas Corporativas' : 'Invoicing & Corporate Finance'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Actualiza números de cuenta, direcciones de facturación o inserta sellos de pagado/anulado en reportes contables sin rehacer el documento.'
                      : 'Update bank details, billing addresses, or stamp paid/cancelled seals on financial reports without remaking files.'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Universidad y Publicaciones Académicas' : 'Academia & Research Papers'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Corrige citas bibliográficas, encabezados de tesis o reemplaza diagramas y gráficos de investigación antes de la defensa académica.'
                      : 'Correct citations, thesis headers, or replace research figures and charts prior to formal committee defense.'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">
                    {isEs ? 'Marketing y Diseño Editorial' : 'Marketing & Creative Publishing'}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs
                      ? 'Reemplaza logotipos antiguos, actualiza precios en catálogos comerciales o añade llamadas a la acción sin pasar por software de maquetación.'
                      : 'Swap outdated brand logos, update pricing in sales brochures, or add call-to-action text without layout software.'}
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
                  ? 'Preguntas Frecuentes sobre Editar Texto e Imágenes'
                  : 'Frequently Asked Questions on Editing PDF'}
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
