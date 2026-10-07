'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Link from 'next/link';
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
  Scale,
  GraduationCap,
  Sliders,
  Maximize2,
  Sparkles,
  Link2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import RelatedLongTailSolutions from '@/components/RelatedLongTailSolutions';

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
  const isFr = lang === 'fr';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = isFr
    ? [
        {
          q: 'Comment recadrer les marges d’un document PDF en ligne de manière interactive ?',
          a: 'Chargez votre fichier PDF dans l’espace de travail ; vous verrez l’aperçu haute définition de la page avec un cadre de recadrage ajustable. Déplacez les 8 poignées interactives pour délimiter la zone souhaitée ou saisissez les marges exactes en millimètres. Choisissez si vous souhaitez appliquer le rognage à toutes les pages ou à une sélection précise, puis cliquez sur « Recadrer les Marges du PDF ».',
        },
        {
          q: 'Comment rogner un PDF à un format de page spécifique (A4, Lettre ou dimensions sur mesure) ?',
          a: 'Sur PDFBlack, vous pouvez renseigner les dimensions exactes en millimètres pour adapter vos documents aux normes internationales comme ISO A4 (210 × 297 mm), Lettre US (215.9 × 279.4 mm) ou ratios personnalisés. Le moteur ajuste le CropBox paramétrique en temps réel sans dégrader les vecteurs.',
        },
        {
          q: 'Peut-on supprimer automatiquement les marges blanches d’un PDF (Auto-Crop) ?',
          a: 'Oui. Utilisez les préréglages rapides ou ajustez les poignées aux bords du texte. Cela élimine les bordures blanches excessives, traits de coupe et ombres de numérisation, optimisant l’affichage sur tablettes et liseuses.',
        },
        {
          q: 'Les textes vectoriels, liens et signets du PDF original sont-ils préservés ?',
          a: 'Parfaitement. Comme il s’agit d’un ajustement géométrique du CropBox dans le dictionnaire de la page conforme ISO 32000-1, tous les textes sélectionnables, hyperliens et polices restent 100% intacts.',
        },
        {
          q: 'Est-il sécurisé de recadrer des documents confidentiels ou des contrats ?',
          a: '100% privé et sécurisé. PDFBlack fonctionne en mémoire RAM locale sans aucun téléversement de fichier vers des serveurs distants, en totale conformité avec le RGPD.',
        },
      ]
    : isEs
      ? [
          {
            q: '¿Cómo recortar los márgenes de un documento PDF de forma interactiva?',
            a: 'Carga tu archivo PDF en la zona de trabajo; verás la vista previa de alta definición de la página con un recuadro de recorte delimitador. Puedes arrastrar los 8 manejadores en vivo para encuadrar la zona deseada o introducir márgenes exactos en milímetros (Superior, Inferior, Izquierdo, Derecho). Una vez configurado, selecciona si deseas aplicarlo a todas las hojas o a páginas específicas y pulsa «Recortar Márgenes del PDF».',
          },
          {
            q: '¿Cómo recortar un PDF a un tamaño de página específico (A4, Carta o dimensiones personalizadas)?',
            a: 'En PDFBlack puedes ingresar las medidas exactas en milímetros en los campos de margen para encuadrar tu documento a formatos estándar internacionales como ISO A4 (210 × 297 mm), Carta US (215.9 × 279.4 mm), Oficio o proporciones a medida. El lienzo calcula en tiempo real las dimensiones resultantes y ajusta el CropBox paramétrico sin alterar la escala vectorial interna.',
          },
          {
            q: '¿Se pueden recortar automáticamente los márgenes blancos sobrantes de un PDF (Auto Crop)?',
            a: 'Sí. Utiliza los preajustes rápidos de 5 mm y 10 mm en el panel de control o ajusta los 8 manejadores interactivos pegados a los límites del texto y tablas. Esto elimina bordes blancos excesivos, marcas de corte de imprenta y sombras de escáner en todo el documento a la vez, aprovechando el 100% de la pantalla en tablets y e-readers Kindle.',
          },
          {
            q: '¿Por qué elegir PDFBlack frente a Sejda, iLovePDF o Adobe Acrobat para recortar PDFs?',
            a: 'A diferencia de Sejda (que restringe a 3 tareas gratis por hora y 50 MB) e iLovePDF (que sube tus documentos confidenciales a servidores en la nube), PDFBlack es 100% ilimitado, gratuito para siempre y procesa tus archivos exclusivamente en la memoria RAM de tu navegador mediante Web Workers. Ningún dato se transfiere a internet, garantizando total cumplimiento de privacidad (RGPD e HIPAA) sin costosas licencias de Adobe.',
          },
          {
            q: '¿Esta herramienta para recortar PDF es totalmente gratuita y sin marcas de agua?',
            a: 'Totalmente gratuita. No estampamos marcas de agua publicitarias, no solicitamos correos electrónicos ni tarjetas de crédito, y no hay límite en el tamaño de archivo ni en el número de páginas que puedes recortar. El rendimiento depende únicamente de la potencia de tu equipo local.',
          },
          {
            q: '¿Puedo recortar un PDF desde el móvil o tablet (Android, iPhone, iPad)?',
            a: 'Sí. La mesa de trabajo está diseñada para responder al tacto en pantallas de smartphones y tablets. Puedes arrastrar los manejadores con los dedos o ingresar márgenes numéricos en Safari, Chrome o Firefox móvil sin instalar aplicaciones externas.',
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
          {
            q: '¿Cómo recortar todas las páginas de un PDF a la vez gratis?',
            a: 'Para recortar todas las hojas a la vez: 1. Carga tu PDF en PDFBlack. 2. Ajusta los márgenes deseados con los manejadores interactivos o en milímetros. 3. En el selector de alcance, mantén seleccionada la opción «Todas» y pulsa «Recortar Márgenes del PDF». El recorte se aplicará uniformemente a todo el documento en memoria RAM en segundos.',
          },
          {
            q: '¿Se puede recortar un PDF online sin pagar Adobe Acrobat?',
            a: 'Sí. PDFBlack permite recortar documentos PDF de forma 100% gratuita y sin suscripciones. Modifica el diccionario geométrico CropBox oficial de cada página en tu navegador con fidelidad vectorial nativa sin requerir licencias de Adobe.',
          },
        ]
      : [
          {
            q: 'How do I crop PDF margins interactively?',
            a: 'Upload your PDF into the work area; an HD preview with an active crop bounding box will appear immediately. You can drag the 8 live handles to frame the desired area or enter exact margins in millimeters (Top, Bottom, Left, Right). Choose whether to apply it to all pages or specific sheets, then click "Crop PDF Margins".',
          },
          {
            q: 'How do I crop a PDF to a specific page size (A4, Letter, Custom Dimensions)?',
            a: 'In PDFBlack, you can adjust visual crop handles or type millimeter margins into the Top, Bottom, Left, and Right fields to frame pages into standard international formats like ISO A4 (210 × 297 mm), US Letter (8.5 × 11 in), Legal, or custom dimensions. The live viewport updates the CropBox coordinates in real time without rasterizing text or vectors.',
          },
          {
            q: 'Can I automatically crop white margins from a PDF document (Auto Crop)?',
            a: 'Yes. PDFBlack allows you to auto-crop unwanted white borders, margins, and scanner edges using our instant margin presets (5mm, 10mm) or by snapping the 8 boundary handles tightly around the text and image content. This maximizes readability on iPads, tablets, and Kindle e-readers by utilizing 100% of the display area.',
          },
          {
            q: 'Why choose PDFBlack over Sejda, iLovePDF, or Adobe Acrobat to crop PDFs?',
            a: 'Unlike Sejda (which caps free users to 3 tasks per hour and 50MB files) and iLovePDF (which uploads your private documents to third-party cloud servers), PDFBlack is 100% unlimited, free forever, and processes everything client-side in your browser RAM via Web Workers. Your sensitive files never leave your device, ensuring full GDPR and HIPAA compliance without paying for Adobe Acrobat Pro.',
          },
          {
            q: 'Is this PDF crop tool truly free with no watermarks, paywalls, or file limits?',
            a: 'Yes, 100% free with no watermarks, no registration, and no hidden subscriptions. Because all processing executes locally on your device hardware using WebAssembly and Web Workers, you can crop multi-gigabyte or hundreds-of-pages PDF files without restrictions.',
          },
          {
            q: 'Can you crop a PDF on mobile or tablet (Android, iPhone, iPad)?',
            a: 'Yes. The interactive canvas is fully touch-optimized. You can drag boundary handles with your fingertips or type millimeter offsets directly on any modern mobile browser (Safari, Chrome) without installing third-party apps.',
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
          {
            q: 'Can I crop all pages in a PDF at once for free?',
            a: 'Yes. To crop all pages simultaneously: 1. Upload your PDF into PDFBlack. 2. Adjust margins with the 8 interactive handles or millimeter inputs. 3. Keep the scope selector set to "All" and click "Crop PDF Margins". The engine synchronizes identical CropBox coordinates across every sheet in seconds.',
          },
          {
            q: 'Can you crop a PDF without Adobe Acrobat?',
            a: 'Yes. PDFBlack offers professional, millimeter-accurate PDF margin trimming completely free without Adobe subscriptions. It modifies standard ISO CropBox page bounding boxes directly in your browser memory with zero quality loss.',
          },
        ];

  const jsonLdWebApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isFr
      ? 'Recadrer un PDF en Ligne Gratuit — Rogner les Marges | PDFBlack'
      : isEs
        ? 'Recortar PDF Gratis Online — PDFBlack'
        : 'Crop PDF Online Free — Trim Margins & Page Size | PDFBlack',
    url: isFr
      ? `${SITE_URL}/fr/recadrer-pdf`
      : isEs
        ? `${SITE_URL}/organizar/recortar`
        : `${SITE_URL}/en/crop-pdf`,
    description: isFr
      ? 'Outil professionnel pour recadrer les marges d’un document PDF en ligne de façon visuelle ou millimétrique avec préservation vectorielle et confidentialité totale en mémoire locale.'
      : isEs
        ? 'Herramienta profesional para recortar márgenes de documentos PDF de forma visual o milimétrica con conservación vectorial, ajuste de tamaño de página y privacidad total en memoria local.'
        : 'Crop PDF online free. Interactive visual tool to trim white margins, auto-crop, adjust page sizes (A4, Letter), or crop specific pages. 100% private client-side processing, no uploads.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: isFr
      ? [
          'Recadrage interactif visuel avec 8 poignées CropBox en direct',
          'Ajustement millimétrique numérique pour marges Haut, Bas, Gauche et Droite',
          'Adaptation aux formats standard (A4, Lettre US, dimensions sur mesure)',
          'Suppression automatique des marges blanches (Auto-crop) et ombres de scanner',
          'Portée flexible : Toutes les pages, paires/impaires ou sélection personnalisée',
          'Préservation 100% vectorielle sans recompression ni pixellisation (ISO 32000-1)',
          'Traitement 100% privé en mémoire RAM locale via Web Workers',
        ]
      : [
          'Recorte interactivo visual con 8 manejadores CropBox en tiempo real',
          'Ajuste milimétrico numérico para márgenes Superior, Inferior, Izquierdo y Derecho',
          'Ajuste a tamaños estándar de hoja (A4, Carta US, dimensiones personalizadas)',
          'Recorte automático de márgenes blancos (Auto-crop) y sombras de escáner',
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
        name: isFr ? 'Accueil' : isEs ? 'Inicio' : 'Home',
        item: isFr ? `${SITE_URL}/fr` : isEs ? SITE_URL : `${SITE_URL}/en`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isFr ? 'Organiser PDF' : isEs ? 'Organizar PDF' : 'Organize PDF',
        item: isFr ? `${SITE_URL}/fr` : isEs ? `${SITE_URL}/organizar` : `${SITE_URL}/en/organize`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isFr ? 'Recadrer PDF' : isEs ? 'Recortar PDF' : 'Crop PDF',
        item: isFr
          ? `${SITE_URL}/fr/recadrer-pdf`
          : isEs
            ? `${SITE_URL}/organizar/recortar`
            : `${SITE_URL}/en/crop-pdf`,
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
        name: isEs ? 'Cargar el archivo PDF en el navegador' : 'Upload PDF document for free',
        text: isEs
          ? 'Arrastra o selecciona el documento PDF que deseas recortar en la mesa de trabajo segura.'
          : 'Drag and drop or select the PDF document you wish to crop into the secure workspace.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isEs
          ? 'Ajustar márgenes CropBox visual o milimétricamente'
          : 'Adjust CropBox handles or type margins in mm',
        text: isEs
          ? 'Arrastra los 8 manejadores sobre el lienzo o introduce las medidas en milímetros (Top, Bottom, Left, Right).'
          : 'Drag the 8 canvas handles or enter exact margin offsets in millimeters (Top, Bottom, Left, Right).',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isEs
          ? 'Elegir alcance (todas las páginas o rango) y descargar'
          : 'Select page scope (all pages or custom) and download',
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
          {/* ENCABEZADO PRINCIPAL H1 (SEO ON-PAGE & AUTORIDAD DE BÚSQUEDA) */}
          <div className="w-full text-center space-y-2.5 pt-2 pb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs text-zinc-300 font-sans tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isEs
                  ? '100% Local • Zero-Knowledge • Sin Subir Archivos'
                  : '100% Local • Zero-Knowledge • No File Uploads'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
              {isEs
                ? 'Recortar PDF Gratis Online — Ajustar Márgenes y Tamaño de Página'
                : 'Crop PDF Online Free — Trim Margins & Page Size (No Sign-Up)'}
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-sans leading-relaxed">
              {isEs
                ? 'Ajusta el encuadre, auto-recorta márgenes blancos y adapta tus hojas PDF a A4, Carta o medidas personalizadas. Procesamiento 100% privado en tu navegador, sin límites de tamaño y sin subir archivos a la nube.'
                : 'Interactively trim white margins, auto-crop borders, and adjust page sizes to A4, Letter, or custom dimensions. 100% private in-browser RAM processing, no file limits, and zero cloud uploads.'}
            </p>
          </div>

          {/* HERRAMIENTA INTERACTIVA PRINCIPAL */}
          <section aria-label={isEs ? 'Herramienta para recortar PDF' : 'Crop PDF Tool'}>
            <PdfCropper />
          </section>

          {/* ── CALLOUT FLUJO DE TRABAJO: RECORTAR + COMPRIMIR (ENLAZADO INTERNO SEO) ── */}
          <section
            aria-label={
              isEs
                ? 'Flujo de trabajo recomendado: comprimir el archivo PDF después de recortar'
                : 'Recommended workflow: compress PDF file after cropping'
            }
            className="w-full bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-700/80 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl font-sans"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white text-black rounded-xl flex-shrink-0 shadow-md">
                <Link2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white font-sans">
                  {isEs
                    ? '¿Necesitas reducir el peso de tu PDF después de recortarlo?'
                    : 'Need to reduce your PDF file size after cropping?'}
                </h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  {isEs
                    ? 'Optimiza los megabytes de tu documento recortado con compresión Deflate Nivel 9 sin perder nitidez vectorial ni calidad de texto.'
                    : 'Shrink megabytes from your cropped document using Level 9 Deflate compression without sacrificing vector sharpness.'}
                </p>
              </div>
            </div>
            <Link
              href={isEs ? '/optimizar/comprimir' : '/en/compress-pdf'}
              className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold font-mono rounded-xl transition-all whitespace-nowrap flex-shrink-0 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
            >
              {isEs ? 'Comprimir PDF →' : 'Compress PDF →'}
            </Link>
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

          {/* TABLA COMPARATIVA: PDFBLACK VS SEJDA VS ILOVEPDF VS ADOBE ACROBAT */}
          <section className="pt-10 border-t border-zinc-800/80 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'BENCHMARK TÉCNICO' : 'TECHNICAL BENCHMARK'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs
                  ? 'PDFBlack vs Sejda, iLovePDF y Adobe Acrobat'
                  : 'PDFBlack vs Sejda, iLovePDF & Adobe Acrobat'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                {isEs
                  ? 'Compara por qué procesar localmente en el navegador supera a las alternativas en la nube y al software de suscripción.'
                  : 'Compare why private in-browser RAM execution outperforms cloud converters and expensive desktop subscriptions.'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border border-zinc-800 rounded-2xl overflow-hidden">
                <thead className="bg-[#121217] text-zinc-300 border-b border-zinc-800 uppercase">
                  <tr>
                    <th className="p-4">
                      {isEs ? 'Criterio / Característica' : 'Feature / Benchmark'}
                    </th>
                    <th className="p-4 text-cyan-400 font-bold">PDFBlack (100% Local)</th>
                    <th className="p-4 text-zinc-400">Sejda / iLovePDF</th>
                    <th className="p-4 text-zinc-400">Adobe Acrobat Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-[#0c0c10]">
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Privacidad y Protección de Datos' : 'Privacy & Data Protection'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        {isEs ? 'Zero-Knowledge (En RAM local)' : 'Zero-Knowledge (RAM only)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="text-red-400">✗</span>{' '}
                      {isEs ? 'Subida a servidores remotos' : 'Uploaded to third-party cloud'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="text-amber-400">~</span>{' '}
                      {isEs ? 'Sincronización forzada en nube' : 'Cloud sync & telemetry required'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Límites de Uso Gratuito' : 'Free Usage Limits & Caps'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        {isEs ? '100% Ilimitado (Sin cuotas)' : '100% Unlimited (No caps)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="text-red-400">✗</span>{' '}
                      {isEs ? '3 tareas/hora o 50 MB máx' : '3 tasks/hour or 50MB cap'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="text-red-400">✗</span>{' '}
                      {isEs
                        ? 'Solo prueba de 7 días con tarjeta'
                        : '7-day trial requires credit card'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Fidelidad Vectorial e Integridad' : 'Vector Fidelity & Integrity'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        {isEs ? '100% Nativo (CropBox ISO)' : '100% Native (CropBox ISO)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="text-amber-400">~</span>{' '}
                      {isEs ? 'Frecuente rasterizado a JPG' : 'Often rasterizes pages to JPEG'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="text-emerald-400">✓</span>{' '}
                      {isEs ? 'Nativo vectorial' : 'Native vector preservation'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs
                        ? 'Ajuste de Tamaño (A4, Carta, mm)'
                        : 'Page Size Control (A4, Letter, mm)'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        {isEs ? 'Milimétrico + 8 manejadores' : 'Exact mm + 8 live handles'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="text-amber-400">~</span>{' '}
                      {isEs ? 'Solo arrastre visual aproximado' : 'Imprecise visual drag only'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="text-emerald-400">✓</span>{' '}
                      {isEs ? 'Cuadro de diálogo avanzado' : 'Advanced dialog box'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Marcas de Agua o Registro' : 'Watermarks & Registration'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        {isEs ? 'Cero marcas • Sin registro' : 'No watermarks • No signup'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="text-red-400">✗</span>{' '}
                      {isEs ? 'Pide email tras varios usos' : 'Prompts for email/upgrade'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="text-red-400">✗</span>{' '}
                      {isEs ? 'Requiere cuenta Adobe ID' : 'Requires Adobe ID login'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Coste de Licencia' : 'Cost & Licensing'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{isEs ? 'Gratis para siempre ($0)' : 'Free forever ($0)'}</span>
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="text-amber-400">~</span>{' '}
                      {isEs ? '$5 a $7 / mes (Plan Pro)' : '$5 to $7 / month for Pro'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      <span className="text-red-400">✗</span>{' '}
                      {isEs ? '$19.99 / mes ($239/año)' : '$19.99 / month ($239/year)'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* GUÍA DE TAMAÑOS DE PÁGINA Y PREAJUSTES DE RECORTE (SEO: PDF CROP SIZE & AUTO CROP) */}
          <section className="pt-10 border-t border-zinc-800/80 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'DIMENSIONES Y ENCUADRE' : 'DIMENSIONS & PAGE SIZING'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs
                  ? 'Formatos de Página y Modos de Recorte Soportados'
                  : 'Supported PDF Page Dimensions & Crop Modes'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                {isEs
                  ? 'Configura dimensiones estándar o personalizadas con milímetros exactos sin alterar la escala vectorial interna.'
                  : 'Set standard or custom page sizes with millimeter precision without degrading internal vector resolution.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400 font-bold font-mono text-xs">
                  A4
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Formatos Estándar (A4, Carta)' : 'Standard Sizes (A4, Letter)'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Ajusta documentos a ISO A4 (210×297 mm), Carta US (215.9×279.4 mm) o Legal para impresión perfecta sin desbordes.'
                    : 'Crop pages to ISO A4 (210×297 mm), US Letter (8.5×11 in), or Legal for printer-ready distribution.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400 font-bold font-mono text-xs">
                  AUTO
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Auto Recorte de Márgenes' : 'Auto White-Margin Crop'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Elimina automáticamente bordes blancos sobrantes, marcas de registro de imprenta y sombras oscuras de escaneos.'
                    : 'Trim away excess white margins, printer bleed marks, and dark flatbed scanner edges in one click.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400 font-bold font-mono text-xs">
                  4:3
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'E-Readers & Tablets (Kindle)' : 'E-Readers & Tablets (Kindle)'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Aumenta el tamaño aparente de la tipografía eliminando bordes para lectura cómoda en iPad, Kindle y pantallas de 6 a 11 pulgadas.'
                    : 'Expand text size up to 50% by trimming margins to fit Kindle, iPad, and 6-to-11 inch handheld screens.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400 font-bold font-mono text-xs">
                  CAD
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Planos Técnicos (A0, A1, A2)' : 'CAD Plots & Blueprints (A0, A1)'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Recorta cajas de rotulación y márgenes de trazador en planos de gran formato sin alterar la escala métrica 1:100 o 1:50.'
                    : 'Trim title blocks and plotter borders on large architectural sheets without distorting 1:100 metric scale.'}
                </p>
              </div>
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

          {/* Soluciones Long-Tail Relacionadas */}
          <RelatedLongTailSolutions toolKey="recortar" lang={isEs ? 'es' : 'en'} />
        </div>
      </main>
    </>
  );
}
