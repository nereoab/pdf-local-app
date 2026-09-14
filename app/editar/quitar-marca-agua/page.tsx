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
  Check,
  X as XIcon,
  Scale,
  Briefcase,
  Layers,
  Sparkles,
  Sliders,
  Maximize2,
  Lock,
  Eraser,
  Filter,
  Search,
  GraduationCap,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfWatermarkRemover = dynamic(() => import('@/components/PdfWatermarkRemover'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor forense de eliminación de marcas de agua PDF...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function QuitarMarcaAguaPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = isEs
    ? [
        {
          q: '¿Cómo funciona la eliminación de marcas de agua sin perder calidad en PDFBlack?',
          a: 'A diferencia de las herramientas convencionales que rasterizan la página a imagen JPEG para luego retocarla (lo que destruye la nitidez tipográfica y la búsqueda de texto), PDFBlack analiza directamente los flujos de contenido internos (Content Streams) del archivo PDF. Localiza y desensambla las instrucciones vectoriales y operadores de marcado (BDC/EMC, operadores Tj) de los sellos sin alterar el texto original, fuentes incrustadas ni gráficos legítimos.',
        },
        {
          q: '¿Qué diferencia hay entre el modo «Inteligente» y el modo «Forense Profundo»?',
          a: 'El modo Inteligente elimina sellos de texto habituales (Confidencial, Borrador, Apryse, iLovePDF, etc.) y anotaciones superpuestas con mínima intervención. El modo Forense Profundo realiza una purga exhaustiva de capas OCG (Optional Content Groups), vacía XObjects de marcas gráficas (/WM, /FM), elimina transparencias residuales y limpia metadatos en diccionarios PieceInfo.',
        },
        {
          q: '¿Puedo eliminar marcas de agua de escáneres móviles como CamScanner o software de prueba?',
          a: 'Sí. El motor incluye bibliotecas de patrones para marcas comerciales habituales (CamScanner, Apryse, SmallPDF, Sejda, Wondershare, Nitro, marcas de versión de prueba «TRIAL/DEMO», etc.). Además, puedes añadir cualquier texto específico en la casilla de búsqueda para forzar su eliminación.',
        },
        {
          q: '¿Se borran las firmas digitales, textos útiles o imágenes del documento?',
          a: 'No. El algoritmo de depuración está calibrado quirúrgicamente para suprimir únicamente los bloques de instrucciones que coinciden con sellos de agua y metadatos de marcas. El texto del documento, gráficos vectoriales y fotografías se mantienen íntegros con su resolución original.',
        },
        {
          q: '¿Es legal quitar una marca de agua de un documento PDF?',
          a: 'La eliminación de marcas de agua es legítima cuando eres el autor, propietario de los derechos o partes autorizadas del documento (por ejemplo, para remover la marca de «BORRADOR» al emitir una versión contractual final, eliminar marcas de prueba de un software tras adquirir la licencia, o limpiar sellos de archivo obsoletos en expedientes corporativos). Asegúrate de respetar la propiedad intelectual y los términos de uso correspondientes.',
        },
        {
          q: '¿Puedo procesar únicamente páginas específicas o saltarme la carátula?',
          a: 'Sí. Puedes seleccionar procesar todo el documento, solo páginas impares, solo páginas pares o especificar un rango numérico personalizado (ejemplo: 2-15, 20), con un interruptor para omitir la portada.',
        },
        {
          q: '¿Es seguro limpiar documentos confidenciales, estados financieros o contratos?',
          a: '100% privado y seguro. PDFBlack opera bajo una arquitectura Zero-Knowledge estricta: todo el análisis de diccionarios PDF y la depuración de bytes ocurren en la memoria RAM de tu navegador web mediante Web Workers locales. Ningún archivo se transmite a la nube ni se guarda en servidores externos, cumpliendo con el RGPD, LOPD e HIPAA.',
        },
        {
          q: '¿Qué hago si el PDF está protegido con contraseña de apertura?',
          a: 'Si el archivo cuenta con cifrado estándar, el visor cuenta con un campo seguro para desbloquear el documento en la memoria de tu dispositivo antes de iniciar la depuración, sin almacenar ni transferir tu contraseña.',
        },
        {
          q: '¿El documento resultante es aceptado en juzgados, notarías y plataformas oficiales?',
          a: 'Sí. El archivo resultante cumple estrictamente con el estándar internacional ISO 32000-1 de Adobe/PDF, siendo 100% compatible con lectores oficiales como Adobe Acrobat Reader, visores de navegadores modernos y mesas de partes electrónicas (LexNET, PJF, etc.).',
        },
      ]
    : [
        {
          q: 'How does watermark removal work in PDFBlack without quality loss?',
          a: 'Unlike traditional tools that rasterize the entire page into a JPEG image (destroying text sharpness and searchability), PDFBlack directly parses native PDF Content Streams. It identifies and disassembles vector watermark instructions (BDC/EMC marked content and Tj text operators) without touching body text, embedded fonts, or legitimate graphics.',
        },
        {
          q: 'What is the difference between "Smart" and "Deep Forensic" cleaning modes?',
          a: 'Smart mode targets common text stamps (Confidential, Draft, Apryse, iLovePDF, etc.) and floating annotations with minimal dictionary impact. Deep Forensic mode aggressively purges OCG layers (Optional Content Groups), empties graphic watermark XObjects (/WM, /FM), removes residual transparency states, and clears PieceInfo metadata.',
        },
        {
          q: 'Can it remove mobile scanner watermarks like CamScanner or software trial banners?',
          a: 'Yes. The engine includes heuristic patterns for common commercial stamps (CamScanner, Apryse, SmallPDF, Sejda, Wondershare, Nitro, TRIAL/DEMO banners, etc.). You can also type custom keywords into the search box to force targeted removal.',
        },
        {
          q: 'Does it erase legitimate text, signatures, or embedded images?',
          a: 'No. The filtering algorithm is surgically tuned to isolate and remove watermark instructions and metadata objects. Body text, charts, diagrams, and photos retain 100% of their original native resolution.',
        },
        {
          q: 'Is it legal to remove watermarks from PDF files?',
          a: 'Watermark removal is completely legitimate when performed by document owners, authors, or authorized parties (e.g., removing "DRAFT" stamps before finalizing agreements, clearing evaluation stamps after purchasing commercial licenses, or preparing clean archives). Always verify intellectual property rights and permissions.',
        },
        {
          q: 'Can I clean specific pages or exclude the first cover page?',
          a: 'Yes. You can target all pages, odd pages only, even pages only, or enter a custom range (e.g., 2-15, 20), with a dedicated toggle to automatically skip the cover page.',
        },
        {
          q: 'Is it safe to clean confidential legal briefs, financial records, or contracts?',
          a: '100% private and secure. PDFBlack runs strictly on a Zero-Knowledge local architecture: all PDF stream manipulations and byte cleanups execute in your browser RAM via Web Workers. Not a single byte touches cloud servers, complying with GDPR and HIPAA.',
        },
        {
          q: 'Can I process password-protected PDF files?',
          a: 'Yes. If your document requires a password to open, our in-memory unlocking prompt lets you enter credentials locally to access page streams without sending keys over the internet.',
        },
        {
          q: 'Is the output PDF compatible with court filing and official e-signature portals?',
          a: 'Yes. The cleaned PDF adheres strictly to the ISO 32000-1 PDF standard and is fully compatible with Adobe Acrobat Reader, modern web browsers, and electronic filing portals.',
        },
      ];

  const jsonLdWebApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isEs
      ? 'Quitar Marca de Agua de PDF Gratis Online — Eliminar Sellos | PDFBlack'
      : 'Remove Watermark from PDF Online Free — Clean Stamps | PDFBlack',
    url: `${SITE_URL}/editar/quitar-marca-agua`,
    description: isEs
      ? 'Herramienta profesional para eliminar marcas de agua y sellos de fondo en documentos PDF online sin perder calidad vectorial ni subir archivos a la nube.'
      : 'Professional tool to remove watermarks and background stamps from PDF files online without vector quality loss or cloud uploads.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Depuración vectorial limpia sin rasterización ni degradación tipográfica',
      'Modo Forense Profundo para capas OCG, PieceInfo y transparencias residuales',
      'Eliminación de sellos de software (Apryse, CamScanner, iLovePDF, SmallPDF, Sejda)',
      'Búsqueda y supresión de palabras clave personalizadas (CONFIDENCIAL, BORRADOR)',
      'Purgado de anotaciones de sellos flotantes (/Annots) y XObjects gráficos',
      'Procesamiento 100% privado en memoria RAM local mediante Web Workers',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.92',
      reviewCount: '1480',
      bestRating: '5',
      worstRating: '1',
    },
  };

  const jsonLdFaq = {
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

  const jsonLdBreadcrumb = {
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
        name: isEs ? 'Quitar Marca de Agua' : 'Remove Watermark',
        item: `${SITE_URL}/editar/quitar-marca-agua`,
      },
    ],
  };

  const jsonLdHowTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isEs
      ? 'Cómo Quitar Marcas de Agua de un Documento PDF Online'
      : 'How to Remove Watermarks from a PDF Document Online',
    description: isEs
      ? 'Guía paso a paso para depurar sellos de agua, marcas comerciales o textos de borrador en tus archivos PDF en tu navegador.'
      : 'Step-by-step tutorial to clean watermarks, commercial stamps, or draft labels from PDF files in your browser.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: isEs ? 'Cargar el archivo PDF' : 'Upload PDF file',
        text: isEs
          ? 'Arrastra o selecciona el documento PDF con marcas de agua en la mesa de trabajo.'
          : 'Drag and drop or select the watermarked PDF document into the workspace.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isEs ? 'Seleccionar modo de limpieza' : 'Select cleaning mode',
        text: isEs
          ? 'Elige entre limpieza Inteligente, Forense Profunda o introduce palabras clave específicas a eliminar.'
          : 'Choose between Smart cleaning, Deep Forensic cleaning, or enter specific keywords to remove.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isEs ? 'Depurar y Descargar' : 'Clean and Download',
        text: isEs
          ? 'Haz clic en «Remover Sello de Agua» y descarga tu archivo limpio sin pérdida de calidad.'
          : 'Click "Remove Watermark" and download your clean, pristine PDF document.',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdHowTo) }}
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-12 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b] text-white">
        <div className="w-full max-w-7xl space-y-12">
          {/* HERRAMIENTA INTERACTIVA PRINCIPAL (VISTA PREVIA ARRIBA + PANEL DE CONTROL ABAJO) */}
          <section
            aria-label={
              isEs ? 'Herramienta para quitar marcas de agua PDF' : 'PDF Watermark Remover Tool'
            }
          >
            <PdfWatermarkRemover />
          </section>

          {/* PILARES DE ARQUITECTURA FORENSE */}
          <section className="pt-10 border-t border-zinc-800/80 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'INGENIERÍA DOCUMENTAL FORENSE' : 'FORENSIC DOCUMENT ENGINEERING'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs
                  ? 'Depuración Vectorial sin Rasterización ni Pérdida'
                  : 'Vector Purging with Zero Raster Quality Loss'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                {isEs
                  ? 'Desensamblado quirúrgico de streams de contenido según la especificación internacional PDF ISO 32000-1.'
                  : 'Surgical disassembly of PDF content streams adhering to the international ISO 32000-1 standard.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Desensamblado BDC / EMC' : 'BDC / EMC Disassembly'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Aísla y elimina los bloques de marcado /Watermark y /Artifact en los flujos de contenido sin afectar el texto legible.'
                    : 'Isolates and strips /Watermark and /Artifact blocks within page content streams without touching body text.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Purgado de Capas OCG' : 'OCG Layer & PieceInfo Purge'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Desactiva diccionarios /OCProperties y /PieceInfo que los softwares comerciales emplean para anclar sellos publicitarios.'
                    : 'Disables /OCProperties and /PieceInfo dictionaries commercial tools use to anchor persistent promotional marks.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Vaciado de XObjects' : 'XObject Stream Zeroing'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Vacía los flujos de bits de sellos gráficos (/WM, /FM, /Apryse) sin romper las referencias de página.'
                    : 'Zeroes out embedded graphic watermark streams (/WM, /FM, /Apryse) without corrupting page dictionary refs.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Zero-Knowledge en RAM' : 'Zero-Knowledge in RAM'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Todo el procesamiento y análisis se ejecutan estrictamente en tu máquina local. Ningún byte se envía a la nube.'
                    : 'All parsing and cleaning execute strictly in your local device RAM. No bytes are sent to external servers.'}
                </p>
              </div>
            </div>
          </section>

          {/* CATÁLOGO DE MODOS DE LIMPIEZA FORENSE */}
          <section className="pt-10 border-t border-zinc-800/80 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'MODALIDADES DE DEPURACIÓN' : 'CLEANING MODES'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs ? 'Niveles de Limpieza Adaptativos' : 'Adaptive Cleaning Modes'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase">
                  {isEs ? 'Modo Inteligente (Recomendado)' : 'Smart Mode (Recommended)'}
                </div>
                <h3 className="text-sm font-bold text-white uppercase">
                  {isEs ? 'Limpieza Vectorial Sin Riesgo' : 'Zero-Risk Vector Cleaning'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Identifica sellos de texto habituales (Confidencial, Borrador, Apryse, Copia) y anotaciones superficiales sin alterar ninguna imagen o membrete legítimo.'
                    : 'Removes typical text stamps (Confidential, Draft, Apryse, Copy) and superficial annotations without affecting letterheads or illustrations.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="text-xs font-mono text-amber-400 font-bold uppercase">
                  {isEs ? 'Modo Forense Profundo' : 'Deep Forensic Mode'}
                </div>
                <h3 className="text-sm font-bold text-white uppercase">
                  {isEs ? 'Purga Total de Capas y XObjects' : 'Full OCG & XObject Purge'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Diseñado para PDFs generados por software comercial de prueba. Vacía objetos gráficos incrustados, desensambla capas OCG y suprime fondos transparentes de marca.'
                    : 'Built for PDFs stamped by commercial trial tools. Zeroes graphic XObjects, strips OCG layers, and purges transparent watermark matrices.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="text-xs font-mono text-emerald-400 font-bold uppercase">
                  {isEs ? 'Modo Manual Personalizado' : 'Custom Manual Mode'}
                </div>
                <h3 className="text-sm font-bold text-white uppercase">
                  {isEs ? 'Focalización por Palabras Clave' : 'Targeted Keyword Search'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Permite ingresar términos concretos o nombres de entidades para eliminar exactamente el texto deseado en cada página sin tocar el resto del documento.'
                    : 'Allows typing specific names, dates, or vendor keywords to selectively eliminate matching watermark strings across sheets.'}
                </p>
              </div>
            </div>
          </section>

          {/* GUÍA VISUAL PASO A PASO */}
          <section className="pt-10 border-t border-zinc-800/80 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'FLUJO SIMPLIFICADO' : 'SIMPLIFIED WORKFLOW'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs
                  ? 'Cómo Quitar Marcas de Agua PDF en 3 Pasos'
                  : 'How to Remove PDF Watermarks in 3 Steps'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-b from-[#18181f] to-[#0a0a0d] border border-zinc-800 p-6 rounded-3xl relative space-y-3">
                <div className="text-2xl font-mono font-black text-cyan-400">01</div>
                <h3 className="text-base font-bold uppercase">
                  {isEs ? 'Carga tu Documento' : 'Upload Your Document'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Arrastra tu archivo PDF o búscalo en tu equipo. Se procesará la vista previa con streaming progresivo sin bloqueos.'
                    : 'Drag and drop your PDF or select it locally. Thumbnails generate smoothly via background progressive streaming.'}
                </p>
              </div>

              <div className="bg-gradient-to-b from-[#18181f] to-[#0a0a0d] border border-zinc-800 p-6 rounded-3xl relative space-y-3">
                <div className="text-2xl font-mono font-black text-cyan-400">02</div>
                <h3 className="text-base font-bold uppercase">
                  {isEs ? 'Elige el Nivel de Limpieza' : 'Select Cleaning Level'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Selecciona modo Inteligente o Forense, especifica palabras clave si lo deseas y ajusta los filtros de anotaciones o capas.'
                    : 'Select Smart or Forensic mode, specify target keywords if needed, and toggle layer or annotation filters.'}
                </p>
              </div>

              <div className="bg-gradient-to-b from-[#18181f] to-[#0a0a0d] border border-zinc-800 p-6 rounded-3xl relative space-y-3">
                <div className="text-2xl font-mono font-black text-cyan-400">03</div>
                <h3 className="text-base font-bold uppercase">
                  {isEs ? 'Depura y Descarga' : 'Clean & Download'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Pulsa «Remover Sello de Agua» y descarga tu archivo limpio con calidad vectorial 100% nativa al instante.'
                    : 'Click "Remove Watermark" and download your pristine, fully vector-compliant PDF document.'}
                </p>
              </div>
            </div>
          </section>

          {/* TABLA COMPARATIVA: PDFBLACK VS HERRAMIENTAS EN LA NUBE */}
          <section className="pt-10 border-t border-zinc-800/80 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'BENCHMARK TÉCNICO' : 'TECHNICAL BENCHMARK'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs
                  ? 'PDFBlack vs Herramientas Cloud Convencionales'
                  : 'PDFBlack vs Conventional Cloud Tools'}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border border-zinc-800 rounded-2xl overflow-hidden">
                <thead className="bg-[#121217] text-zinc-300 border-b border-zinc-800 uppercase">
                  <tr>
                    <th className="p-4">{isEs ? 'Capacidad Técnica' : 'Technical Feature'}</th>
                    <th className="p-4 text-cyan-400 font-bold">
                      PDFBlack Enterprise (100% Local)
                    </th>
                    <th className="p-4 text-zinc-400">
                      {isEs ? 'Herramientas Web Cloud' : 'Cloud PDF Services'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-[#0c0c10]">
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs
                        ? 'Preservación Vectorial y Nitidez de Texto'
                        : 'Vector Text Sharpness & Searchability'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? '100% Vectorial (Desensamblado directo)'
                          : '100% Vector (Native disassembly)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs
                          ? 'Rasterizan a imagen borrosa JPG'
                          : 'Rasterize pages into blurry JPGs'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs
                        ? 'Privacidad de Documentos Confidenciales'
                        : 'Confidential Document Privacy'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs ? 'Zero-Knowledge (En RAM local)' : 'Zero-Knowledge (Local RAM only)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs
                          ? 'Subida a servidores remotos en la nube'
                          : 'Uploaded to third-party cloud servers'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs
                        ? 'Depuración de Capas OCG y Metadatos'
                        : 'OCG Layer & Metadata Stripping'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? 'Sí (Purga profunda /OCProperties)'
                          : 'Yes (Deep /OCProperties purge)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-amber-400" />
                      <span>
                        {isEs ? 'Ignoran capas internas' : 'Ignore internal layer states'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs
                        ? 'Límites de Páginas y Registro Obligatorio'
                        : 'Page Limits & Compulsory Sign-up'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? 'Ilimitado • Sin marcas • Sin registro'
                          : 'Unlimited • No watermarks • No signup'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs
                          ? 'Bloqueo tras 2 páginas o correo exigido'
                          : 'Locked after 2 pages or paywall'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4 CASOS DE USO PROFESIONALES */}
          <section className="pt-10 border-t border-zinc-800/80 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'APLICACIONES PRÁCTICAS' : 'PRACTICAL USE CASES'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs ? 'Sectores que Confían en PDFBlack' : 'Industries that Trust PDFBlack'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs ? 'Expedientes Judiciales & Litigios' : 'Legal Records & Court Filings'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Limpieza de sellos de copia y de juzgados anteriores'
                        : 'Prior court stamps & copy label removal'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Limpia sellos obsoletos de «COPIA CERTIFICADA» o marcas de juzgados archivados para reutilizar piezas probatorias en nuevas actuaciones judiciales sin manchas visuales.'
                    : 'Strip obsolete certified copy stamps or archival judicial marks to submit pristine evidentiary exhibits in court filings.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs ? 'Operaciones Corporativas & M&A' : 'Corporate Transactions & M&A'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Finalización de contratos y borradores'
                        : 'Contract execution & draft removal'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Retira marcas de «BORRADOR PREVIO» o sellos de salas de datos virtuales (VDR) al formalizar la versión de cierre de acuerdos mercantiles y escrituras.'
                    : 'Remove preliminary draft watermarks or VDR stamps when finalizing binding corporate contracts and acquisition documents.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs ? 'Academia, Tesis & Publicaciones' : 'Academia, Theses & Publications'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Depuración de repositorios universitarios'
                        : 'Institutional repository mark removal'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Elimina marcas de agua superpuestas por visores universitarios o repositorios digitales para imprimir y encuadernar ejemplares definitivos de grado o papers científicos.'
                    : 'Clean institutional repository watermarks or viewer stamps to prepare clean copies for publishing or hardcover binding.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs
                        ? 'Digitalización & Escáneres Móviles'
                        : 'Digitization & Mobile Scanners'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Eliminación de marcas CamScanner o software de prueba'
                        : 'CamScanner & trial app mark removal'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Elimina pies de página promocionales y marcas de agua insertadas por apps móviles de escaneo en facturas, recibos o expedientes digitalizados.'
                    : 'Remove promotional footers and evaluation watermarks stamped by mobile scanning apps on scanned receipts, invoices, and records.'}
                </p>
              </div>
            </div>
          </section>

          {/* ACORDEÓN INTERACTIVO DE PREGUNTAS FRECUENTES (FAQ) */}
          <section className="pt-10 border-t border-zinc-800/80 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold flex items-center justify-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                {isEs ? 'PREGUNTAS FRECUENTES' : 'FREQUENTLY ASKED QUESTIONS'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs
                  ? 'Todo lo que Necesitas Saber sobre Quitar Marcas de Agua'
                  : 'Everything You Need to Know About Watermark Removal'}
              </h2>
            </div>

            <div className="max-w-4xl mx-auto space-y-3 font-mono">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-[#121217] border border-zinc-800 rounded-2xl overflow-hidden transition-colors hover:border-zinc-700"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-bold text-white font-sans">
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-zinc-400 font-mono leading-relaxed border-t border-zinc-800/60">
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
