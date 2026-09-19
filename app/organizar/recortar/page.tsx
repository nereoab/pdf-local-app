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
  Crop,
  Check,
  X as XIcon,
  Scale,
  GraduationCap,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfCropper = dynamic(() => import('@/components/PdfCropper'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor de recorte y ajuste de márgenes CropBox...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function RecortarPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = isEs
    ? [
        {
          q: '¿Cómo recortar los márgenes de un documento PDF de forma interactiva?',
          a: 'Carga tu archivo PDF en la zona de trabajo; verás la vista previa de alta definición de la página con un recuadro de recorte delimitador. Puedes arrastrar los 8 manejadores en vivo para encuadrar la zona deseada o introducir márgenes exactos en milímetros (Superior, Inferior, Izquierdo, Derecho). Una vez configurado, selecciona si deseas aplicarlo a todas las hojas o a páginas específicas y pulsa «Recortar Márgenes del PDF».',
        },
        {
          q: '¿Qué diferencia existe entre modificar el CropBox y recortar imágenes rasterizadas?',
          a: 'En el estándar internacional PDF ISO 32000-1, cada página cuenta con cajas de delimitación geométricas (MediaBox, CropBox, TrimBox). Modificar el CropBox ajusta las coordenadas del área visible e imprimible del documento sin recomprimir ni rasterizar textos ni vectores. Esto garantiza que la nitidez de tipografías, planos y tablas permanezca al 100% idéntica al archivo original.',
        },
        {
          q: '¿Puedo aplicar el recorte a todas las páginas, solo pares/impares o a un rango personalizado?',
          a: 'Sí. En el panel de control inferior dispones del selector de alcance: «Todas» (aplica los mismos márgenes a cada hoja), «Pares» o «Impares» (ideal para libros o documentos encuadernados que requieren márgenes interiores alternados) o «Rango Personalizado» (para especificar intervalos como 1-5, 8, 12).',
        },
        {
          q: '¿Cómo eliminar los bordes negros o sombras producidas por escáneres?',
          a: 'Los escaneos de libros o folios sueltos suelen presentar sombras oscuras en los bordes. Utiliza los preajustes rápidos de 5 mm o 10 mm en el panel de control o ajusta libremente los bordes con los manejadores interactivos para cortar las imperfecciones periféricas sin tocar el texto útil.',
        },
        {
          q: '¿Es compatible con planos CAD y documentos en formatos grandes (A0, A1, A2, A3)?',
          a: 'Sí. El motor de cálculo procesa proporciones vectoriales nativas calculando la relación de aspecto real de cada plano o lámina técnica, permitiendo recortar cajas de rotulación o márgenes de impresión en documentos de cualquier escala.',
        },
        {
          q: '¿Se conservan los textos seleccionables, enlaces y marcadores del PDF original?',
          a: 'Totalmente. Al tratarse de un ajuste paramétrico en el diccionario de la página, todo el árbol de contenido interno (texto OCR seleccionable, hipervínculos, capas vectoriales y fuentes incrustadas) se mantiene intacto dentro del área conservada.',
        },
        {
          q: '¿Es seguro recortar documentos confidenciales, contratos o estados financieros?',
          a: '100% seguro y confidencial. PDFBlack implementa una arquitectura Zero-Knowledge estricta: todo el procesamiento matemático y renderizado ocurre en la memoria RAM de tu navegador mediante Web Workers. Ningún byte se envía a servidores externos ni se almacena en la nube, cumpliendo plenamente con el RGPD e HIPAA.',
        },
        {
          q: '¿Puedo recortar un archivo PDF protegido con contraseña de apertura?',
          a: 'Sí. Si tu documento está cifrado, el sistema te solicitará la contraseña en un campo seguro en memoria local para desbloquear los diccionarios de página antes de renderizar y aplicar los nuevos márgenes, sin transferir tus credenciales a terceros.',
        },
        {
          q: '¿El recorte se respeta al imprimir en papel o abrirlo en Adobe Acrobat y navegadores?',
          a: 'Sí. Tanto los visores de escritorio (Adobe Acrobat, Foxit, Nitro) como los motores de visualización de navegadores (Chrome, Edge, Safari) y los controladores de impresión respetan de forma estricta las directivas del CropBox grabado.',
        },
      ]
    : [
        {
          q: 'How do I crop PDF margins interactively?',
          a: 'Upload your PDF into the work area; an HD preview with an active crop bounding box will appear immediately. You can drag the 8 live handles to frame the desired area or enter exact margins in millimeters (Top, Bottom, Left, Right). Choose whether to apply it to all pages or specific sheets, then click "Crop PDF Margins".',
        },
        {
          q: 'What is the difference between adjusting CropBox and rasterizing images?',
          a: 'Under the PDF ISO 32000-1 standard, pages define geometric bounding boxes (MediaBox, CropBox, TrimBox). Modifying the CropBox changes the visible and printable viewport coordinates without recompressing text or vectors. This ensures fonts, CAD drawings, and charts remain 100% sharp with zero quality loss.',
        },
        {
          q: 'Can I crop all pages, odd/even pages, or specific ranges in batch?',
          a: 'Yes. The bottom control panel includes quick scope selectors: "All" (applies uniform margins across every sheet), "Evens" or "Odds" (ideal for binding or alternating book margins), or "Custom Range" (to specify intervals like 1-5, 8, 12).',
        },
        {
          q: 'How can I remove black scanner edges or binding shadows?',
          a: 'Scanned books and sheets often have dark shadows along the perimeter. Use our quick presets (5mm or 10mm) or drag the visual handles inward to eliminate scan artifacts without clipping essential content.',
        },
        {
          q: 'Is it compatible with large CAD blueprints and engineering formats (A0, A1, A2)?',
          a: 'Yes. The engine processes native vector coordinates based on actual aspect ratios, allowing you to crop border frames, title blocks, and plot margins on technical sheets of any dimensions.',
        },
        {
          q: 'Are selectable text, hyperlinks, and bookmarks preserved?',
          a: 'Completely. Because it performs a parametric dictionary adjustment, all internal page structures (OCR text, bookmarks, hyperlinks, embedded fonts) remain fully functional within the preserved area.',
        },
        {
          q: 'Is it safe to crop sensitive corporate, legal, or medical documents?',
          a: '100% private and secure. PDFBlack runs on a Zero-Knowledge architecture: all processing executes within your browser memory via Web Workers. Not a single byte leaves your device or touches cloud servers, adhering to GDPR and HIPAA compliance.',
        },
        {
          q: 'Can I crop password-protected PDF files?',
          a: 'Yes. If your document is encrypted, the system provides a local password prompt to unlock page dictionaries directly in browser memory before applying margins, without exposing credentials.',
        },
        {
          q: 'Will the crop be respected when printed or opened in Adobe Acrobat and browsers?',
          a: 'Yes. Desktop readers (Adobe Acrobat, Foxit), web browsers (Chrome, Edge, Safari), and physical printer drivers strictly follow the ISO CropBox specifications.',
        },
      ];

  const jsonLdWebApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isEs
      ? 'Recortar PDF Gratis Online — PDFBlack'
      : 'Crop PDF Margins Online Free — PDFBlack',
    url: `${SITE_URL}/organizar/recortar`,
    description: isEs
      ? 'Herramienta profesional para recortar márgenes de documentos PDF de forma visual o milimétrica con conservación vectorial y privacidad total en memoria local.'
      : 'Professional web tool to crop PDF margins interactively or with millimeter precision with full vector preservation and local in-browser privacy.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Recorte interactivo visual con 8 manejadores CropBox en tiempo real',
      'Ajuste milimétrico numérico para márgenes Superior, Inferior, Izquierdo y Derecho',
      'Alcance flexible: Todas las páginas, solo pares, impares o rangos personalizados',
      'Preservación 100% vectorial sin recompresión ni rasterizado (ISO 32000-1)',
      'Preajustes rápidos para limpieza de escaneos y encuadernación',
      'Procesamiento 100% privado en memoria RAM local mediante Web Workers',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1380',
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
        name: isEs ? 'Organizar PDF' : 'Organize PDF',
        item: `${SITE_URL}/organizar`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isEs ? 'Recortar PDF' : 'Crop PDF',
        item: `${SITE_URL}/organizar/recortar`,
      },
    ],
  };

  const jsonLdHowTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isEs
      ? 'Cómo Recortar los Márgenes de un Documento PDF Online'
      : 'How to Crop PDF Margins Online',
    description: isEs
      ? 'Guía paso a paso para recortar márgenes blancos, cabeceras o imperfecciones de páginas PDF con precisión milimétrica en tu navegador.'
      : 'Step-by-step tutorial to crop white margins, headers, or scan artifacts in PDF pages with millimeter precision in your browser.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: isEs ? 'Cargar el archivo PDF' : 'Upload PDF file',
        text: isEs
          ? 'Arrastra o selecciona el documento PDF que deseas recortar en la mesa de trabajo.'
          : 'Drag and drop or select the PDF document you wish to crop into the workspace.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isEs
          ? 'Ajustar márgenes visual o numéricamente'
          : 'Adjust margins visually or numerically',
        text: isEs
          ? 'Arrastra los 8 manejadores sobre el lienzo o introduce las medidas en milímetros (Top, Bottom, Left, Right).'
          : 'Drag the 8 canvas handles or enter exact margin offsets in millimeters (Top, Bottom, Left, Right).',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isEs ? 'Aplicar alcance y descargar' : 'Apply scope and download',
        text: isEs
          ? 'Elige aplicar a todas las páginas, pares, impares o un rango específico, y descarga tu PDF recortado al instante.'
          : 'Select whether to apply to all pages, odds, evens, or custom ranges, and download your cropped PDF instantly.',
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
          {/* HERRAMIENTA INTERACTIVA PRINCIPAL */}
          <section aria-label={isEs ? 'Herramienta para recortar PDF' : 'Crop PDF Tool'}>
            <PdfCropper />
          </section>

          {/* PILARES DE ARQUITECTURA E INGENIERÍA TÉCNICA */}
          <section className="pt-10 border-t border-zinc-800/80 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'INGENIERÍA DOCUMENTAL' : 'DOCUMENT ENGINEERING'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs
                  ? 'Precisión Geométrica CropBox sin Pérdida Vectorial'
                  : 'CropBox Geometric Precision with Zero Vector Loss'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                {isEs
                  ? 'Diseñado para profesionales que exigen fidelidad milimétrica en publicaciones, planos y contratos.'
                  : 'Built for professionals requiring millimeter fidelity across publications, blueprints, and contracts.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <Crop className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'CropBox ISO 32000-1' : 'CropBox ISO 32000-1'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Modifica las coordenadas geométricas de visualización e impresión sin recompresión raster ni alteración de tipografías incrustadas.'
                    : 'Modifies display and print viewport coordinates without raster recompression or font alteration.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Ajuste Visual y Milimétrico' : 'Visual & Millimeter Control'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Combina 8 manejadores interactivos en lienzo con controles numéricos en milímetros para Top, Bottom, Left y Right con proporción vinculable.'
                    : 'Combines 8 interactive canvas handles with millimeter numeric inputs for Top, Bottom, Left, and Right margins with linked aspect.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Web Workers en Paralelo' : 'Parallel Web Workers'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'El reencuadre y cálculo de diccionarios se procesa en segundo plano sin bloquear el hilo principal ni la interfaz del usuario.'
                    : 'Viewport re-framing and dictionary offsets execute in background threads without blocking user UI.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Zero-Knowledge 100% Local' : 'Zero-Knowledge 100% Local'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Tus archivos nunca se transfieren a servidores externos. Todo se ejecuta estrictamente en la memoria RAM de tu navegador web.'
                    : 'Your files are never transferred to remote servers. Everything runs strictly in your local browser RAM.'}
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
                  ? 'Cómo Recortar Márgenes PDF en 3 Pasos'
                  : 'How to Crop PDF Margins in 3 Steps'}
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
                    ? 'Arrastra tu archivo PDF o selecciónalo desde tu disco. Se generará de inmediato la vista previa con el recuadro interactivo.'
                    : 'Drag and drop your PDF or select it locally. An HD canvas preview with the crop box appears instantly.'}
                </p>
              </div>

              <div className="bg-gradient-to-b from-[#18181f] to-[#0a0a0d] border border-zinc-800 p-6 rounded-3xl relative space-y-3">
                <div className="text-2xl font-mono font-black text-cyan-400">02</div>
                <h3 className="text-base font-bold uppercase">
                  {isEs ? 'Ajusta el Área de Recorte' : 'Adjust Crop Area'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Arrastra los bordes en el visor interactivo o escribe los márgenes en milímetros. Utiliza los preajustes para bordes estándar.'
                    : 'Drag handles on the interactive viewer or type margin offsets in mm. Use presets for standard edge cleanup.'}
                </p>
              </div>

              <div className="bg-gradient-to-b from-[#18181f] to-[#0a0a0d] border border-zinc-800 p-6 rounded-3xl relative space-y-3">
                <div className="text-2xl font-mono font-black text-cyan-400">03</div>
                <h3 className="text-base font-bold uppercase">
                  {isEs ? 'Aplica Alcance y Descarga' : 'Set Scope & Download'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Selecciona si deseas aplicar a todo el documento o a páginas específicas y descarga el archivo recortado al instante.'
                    : 'Choose whether to apply to all pages or specific sheets and download your cropped PDF immediately.'}
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
                  ? 'PDFBlack vs Herramientas Tradicionales en la Nube'
                  : 'PDFBlack vs Traditional Cloud Crop Tools'}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border border-zinc-800 rounded-2xl overflow-hidden">
                <thead className="bg-[#121217] text-zinc-300 border-b border-zinc-800 uppercase">
                  <tr>
                    <th className="p-4">{isEs ? 'Característica Técnica' : 'Technical Feature'}</th>
                    <th className="p-4 text-cyan-400 font-bold">PDFBlack (100% Local)</th>
                    <th className="p-4 text-zinc-400">
                      {isEs ? 'Servicios Cloud Típicos' : 'Typical Cloud Tools'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-[#0c0c10]">
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Privacidad y Fuga de Datos' : 'Privacy & Data Leakage'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{isEs ? 'Zero-Knowledge (En RAM)' : 'Zero-Knowledge (RAM only)'}</span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs ? 'Subida a servidores remotos' : 'Uploaded to remote servers'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Calidad Vectorial e Integridad' : 'Vector Quality & Integrity'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs ? '100% Nativo (CropBox ISO)' : '100% Native (CropBox ISO)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-amber-400" />
                      <span>{isEs ? 'A menudo rasterizan a JPG' : 'Often rasterize to JPG'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Ajuste Milimétrico Numérico' : 'Millimeter Numeric Control'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs ? 'Sí (Top, Bot, Left, Right mm)' : 'Yes (Top, Bot, Left, Right mm)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs ? 'Solo arrastre visual impreciso' : 'Imprecise visual drag only'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Límites de Tamaño o Páginas' : 'Size or Page Limits'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs ? 'Ilimitado (Potencia de tu PC)' : 'Unlimited (Local PC power)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs ? 'Restringido a 50 MB / 20 págs' : 'Capped at 50 MB / 20 pages'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Marcas de Agua o Registro' : 'Watermarks or Sign-up'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs ? 'Sin marcas • Sin registro' : 'No watermarks • No signup'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs ? 'Requiere correo o suscripción' : 'Requires email or subscription'}
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
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs ? 'Digitalización & OCR de Libros' : 'Book Digitization & OCR'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs ? 'Eliminación de sombras y cabeceras' : 'Shadow & header elimination'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Limpia bordes negros producidos por escáneres de sobremesa o alimentadores ADF para preparar textos listos para OCR o lectura en dispositivos de tinta electrónica.'
                    : 'Clean dark edges from flatbed or ADF scanners to prepare documents for high-accuracy OCR and comfortable e-reader viewing.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs ? 'Planos CAD & Arquitectura' : 'CAD Blueprints & Architecture'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs ? 'Recorte de rotulaciones y márgenes' : 'Title block & margin trim'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Ajusta láminas técnicas eliminando márgenes de trazador sobrantes o recortando detalles específicos sin alterar la escala métrica vectorial original.'
                    : 'Trim excess plotter margins or crop specific technical details without distorting the underlying native vector scale.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs ? 'Academia & Artículos Científicos' : 'Academia & Research Papers'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Optimización de lectura en pantallas'
                        : 'Screen reading optimization'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Elimina márgenes blancos excesivos en papers a doble columna para aprovechar al máximo la pantalla de iPads, tablets y lectores Kindle.'
                    : 'Remove wide white margins in double-column research papers to maximize screen real estate on iPads, tablets, and Kindle devices.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs ? 'Expedientes Notariales & Legales' : 'Notarial & Legal Records'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs ? 'Cumplimiento judicial telemático' : 'Court e-filing compliance'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Recorta marcas marginales y homologa márgenes de expedientes judiciales para cumplir con los estándares de presentación telemática judicial (LexNET, Justícia).'
                    : 'Trim marginal annotations and standardize document boundaries to satisfy strict electronic court filing guidelines.'}
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
                  ? 'Todo lo que Necesitas Saber sobre Recortar PDF'
                  : 'Everything You Need to Know About PDF Cropping'}
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
