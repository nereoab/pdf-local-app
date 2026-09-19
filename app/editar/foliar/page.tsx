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
  BookOpen,
  Layers,
  FileDigit,
  Briefcase,
  Sparkles,
  Sliders,
  Maximize2,
  Lock,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfFoliador = dynamic(() => import('@/components/PdfFoliador'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor empresarial de foliado y numeración PDF...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function FoliarPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = isEs
    ? [
        {
          q: '¿Qué es foliar un documento PDF y cuándo es legalmente obligatorio?',
          a: 'Foliar consiste en numerar consecutivamente cada una de las hojas (fojas) de un expediente judicial, administrativo, notarial o licitación pública. Es obligatorio en procedimientos judiciales, arbitrajes y contrataciones estatales para garantizar la integridad documental, evitar la intercalación o sustracción de documentos y facilitar la citación precisa de fojas durante diligencias.',
        },
        {
          q: '¿Qué es la numeración Bates y por qué se utiliza en litigios y auditorías internacionales?',
          a: 'El estampado Bates (Bates Numbering) es un estándar legal internacional que asigna un código identificador único correlativo (por ejemplo: PROCESO-000001, BATES-000145) a cada página de grandes volúmenes de evidencia. Es indispensable en auditorías forenses, fusiones y adquisiciones (M&A) y procesos de descubrimiento judicial (e-Discovery) para rastrear cada foja de forma inequívoca.',
        },
        {
          q: '¿Cómo funciona el modo de «Páginas Enfrentadas» (Duplex / Libro)?',
          a: 'Cuando imprimes o encuadernas un expediente a doble cara, colocar los números siempre a la derecha provocaría que en las páginas pares el número quede oculto en el lomo interior. El modo de páginas enfrentadas alterna simétricamente la posición: las páginas impares muestran el folio en el margen exterior derecho y las páginas pares en el margen exterior izquierdo.',
        },
        {
          q: '¿Cómo resuelve PDFBlack la rotación de páginas apaisadas u horizontales?',
          a: 'Muchos expedientes contienen hojas mixtas (como estados de cuenta o planos en horizontal junto a contratos en vertical). Nuestro motor empresarial lee la propiedad de rotación geométrica (0°, 90°, 180°, 270°) de cada página individual y ajusta matemáticamente el ángulo y las coordenadas del folio, garantizando que el sello aparezca siempre en la esquina visualmente correcta sin desfasarse.',
        },
        {
          q: '¿Qué ventaja aporta el «Escudo Protector Blanco» detrás del folio?',
          a: 'En contratos escaneados, planos técnicos o documentos con fondos oscuros, el texto del folio puede volverse ilegible al superponerse con membretes o sellos previos. El escudo protector dibuja una caja blanca semitransparente u opaca con micro-borde detrás del número, garantizando lectura nítida al 100% tanto en pantalla como al imprimir.',
        },
        {
          q: '¿Puedo personalizar el prefijo, ceros a la izquierda y omitir la portada?',
          a: 'Sí. Puedes definir el número inicial (por ejemplo comenzar en la foja 150), omitir la carátula o portada, seleccionar el estilo numérico con relleno de ceros (001 notarial, 000001 Bates, números romanos o arábigos clásicos) y añadir prefijos personalizados como «F° », «Folio: », «EXP-2026-» o «Causa Civil N° ».',
        },
        {
          q: '¿Es seguro foliar expedientes confidenciales o contratos con datos reservados?',
          a: '100% seguro. PDFBlack opera bajo una arquitectura Zero-Knowledge estricta: todo el cálculo de diccionarios PDF, estampación vectorial y renderizado ocurre en la memoria RAM de tu navegador mediante Web Workers. Ningún archivo, texto o folio se transmite a servidores remotos ni se almacena en la nube, cumpliendo con el RGPD, LOPD e HIPAA.',
        },
        {
          q: '¿Se degradan los textos, vectores o firmas digitales existentes en el PDF?',
          a: 'No. El foliador realiza una inyección de capa tipográfica nativa en el flujo de contenido de cada página (`page.drawText`) sin recomprimir, rasterizar ni modificar la resolución de imágenes ni vectores existentes en el documento original.',
        },
        {
          q: '¿El archivo foliado es aceptado en mesas de partes virtuales y LexNET?',
          a: 'Sí. Al generar PDFs conformes con el estándar internacional ISO 32000-1, el documento resultante es plenamente compatible con plataformas judiciales electrónicas (como LexNET en España, PJF en México, Sinoe en Perú, etc.), visores como Adobe Acrobat y sistemas de digitalización notarial.',
        },
      ]
    : [
        {
          q: 'What does page numbering (foliating) a PDF mean and when is it mandatory?',
          a: 'Foliating refers to sequentially numbering every single page or leaf of a legal, administrative, or notarial docket. It is legally mandated in court filings, public tenders, and audits to prevent document tampering, ensure complete chain of custody, and allow precise citations during proceedings.',
        },
        {
          q: 'What is Bates Numbering and why is it essential for litigation and audits?',
          a: 'Bates stamping is an international legal standard that assigns a unique, sequential alphanumeric identifier (e.g., CASE-000001, BATES-000250) to every page in large evidentiary dockets. It is vital in e-Discovery, forensic audits, and cross-border litigation to track each record unequivocally.',
        },
        {
          q: 'How does the "Facing Pages" (Duplex / Book) mode work?',
          a: 'When printing or binding two-sided documents, placing stamps in a fixed right-side corner causes even pages to have numbers obscured inside the inner spine. Facing pages mode symmetrically mirrors stamp positions: odd pages place the folio in the outer right margin, while even pages position it in the outer left margin.',
        },
        {
          q: 'How does PDFBlack handle landscape or rotated pages?',
          a: 'Real-world dockets often mix portrait contracts with landscape tables or blueprints. Our enterprise engine reads each individual page rotation metadata (0°, 90°, 180°, 270°) and mathematically compensates both the coordinates and rotation angle, ensuring stamps stay upright in the correct visual corner.',
        },
        {
          q: 'What are the benefits of the "Protective White Shield" behind numbers?',
          a: 'On scanned contracts, technical drawings, or dark backgrounds, numbering can clash with existing headers or signatures. The white shield creates a crisp vector bounding box behind the stamp, providing 100% legibility on screens and printed copies.',
        },
        {
          q: 'Can I customize prefixes, zero-padding, and skip cover pages?',
          a: 'Yes. You can choose a starting number (e.g., resume at sheet 150), exclude the cover sheet, select zero-padded formats (001 notarial, 000001 Bates, Roman numerals, standard Arabic), and define custom prefixes like "Folio: ", "EXP-2026-", or "Exhibit-".',
        },
        {
          q: 'Is it safe to number confidential legal dossiers and contracts?',
          a: '100% private and secure. PDFBlack uses a Zero-Knowledge local architecture: all PDF stream manipulations and vector text injections take place inside your browser RAM via Web Workers. No file data is ever uploaded to external cloud servers, satisfying GDPR and HIPAA standards.',
        },
        {
          q: 'Does numbering degrade existing text, vectors, or digital signatures?',
          a: 'No. The numbering engine applies non-destructive vector text injection (`page.drawText`) directly into the PDF content stream without recompressing, rasterizing, or degrading the original document assets.',
        },
        {
          q: 'Is the output accepted by electronic court filing systems (e-filing)?',
          a: 'Yes. Output files strictly adhere to the ISO 32000-1 PDF specification and are fully compatible with electronic court filing systems, Adobe Acrobat, and official notarial platforms.',
        },
      ];

  const jsonLdWebApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isEs
      ? 'Foliar PDF Gratis Online — Numeración de Páginas PDF | PDFBlack'
      : 'Number PDF Pages Online Free — Bates & Notarial Stamping | PDFBlack',
    url: isEs ? `${SITE_URL}/editar/foliar` : `${SITE_URL}/en/editar/foliar`,
    description: isEs
      ? 'Herramienta profesional para foliar y numerar páginas de documentos PDF online. Formatos notariales, foliado judicial Bates, páginas enfrentadas para encuadernación y escudo protector. 100% privado en memoria RAM.'
      : 'Professional tool to number and foliate PDF documents online. Notarial formats, legal Bates stamping, facing pages for book binding, and protective shield. 100% in-browser RAM privacy.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Foliado notarial tradicional (Folio N°, F° N°, fte/vto)',
      'Numeración judicial Bates para litigios y expedientes (BATES-000001)',
      'Modo páginas enfrentadas con alternancia simétrica para encuadernación',
      'Compensación automática de rotación de páginas en 90°, 180° y 270°',
      'Escudo protector blanco para garantizar máxima legibilidad',
      'Tipografías profesionales Helvetica, Times-Roman y Courier incrustadas',
      'Procesamiento 100% privado en memoria RAM local mediante Web Workers',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.95',
      reviewCount: '1540',
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
        item: isEs ? SITE_URL : `${SITE_URL}/en`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isEs ? 'Editar PDF' : 'Edit PDF',
        item: isEs ? `${SITE_URL}/editar` : `${SITE_URL}/en/editar`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isEs ? 'Foliar Páginas' : 'Number Pages',
        item: isEs ? `${SITE_URL}/editar/foliar` : `${SITE_URL}/en/editar/foliar`,
      },
    ],
  };

  const jsonLdHowTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isEs
      ? 'Cómo Foliar y Numerar Páginas de un Documento PDF Online'
      : 'How to Number and Foliate PDF Pages Online',
    description: isEs
      ? 'Guía paso a paso para numerar expedientes legales, notariales o corporativos con prefijos, ceros a la izquierda y páginas enfrentadas en tu navegador.'
      : 'Step-by-step tutorial to number legal, notarial, or business documents with custom prefixes, zero padding, and facing pages in your browser.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: isEs ? 'Cargar el archivo PDF' : 'Upload PDF file',
        text: isEs
          ? 'Arrastra o selecciona el documento PDF que necesitas foliar o numerar en la mesa de trabajo.'
          : 'Drag and drop or choose the PDF document you need to foliate or number into the workspace.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isEs ? 'Configurar posición, formato y modo' : 'Configure position, format, and mode',
        text: isEs
          ? 'Elige la esquina o margen deseado, el formato (Simple, Notarial 001, Bates 000001), página suelta o enfrentadas para encuadernar.'
          : 'Pick the desired corner or margin, format (Simple, Notarial 001, Bates 000001), single or facing pages for binding.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isEs ? 'Estampar y Descargar' : 'Stamp and Download',
        text: isEs
          ? 'Pulsa «Aplicar Foliado al Documento» y descarga de inmediato tu PDF con la numeración legal estampada.'
          : 'Click "Apply Page Numbering" and instantly download your legally numbered PDF file.',
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
              isEs ? 'Herramienta de foliado y numeración PDF' : 'PDF Foliating & Numbering Tool'
            }
          >
            <PdfFoliador />
          </section>

          {/* PILARES DE ARQUITECTURA E INGENIERÍA TÉCNICA */}
          <section className="pt-10 border-t border-zinc-800/80 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'INGENIERÍA DOCUMENTAL LEGAL' : 'LEGAL DOCUMENT ENGINEERING'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs
                  ? 'Estándares Notariales y Judiciales de Alta Precisión'
                  : 'High-Precision Notarial & Court Filing Standards'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                {isEs
                  ? 'Construido para estudios jurídicos, notarías, juzgados y departamentos de licitaciones públicas.'
                  : 'Engineered for law firms, notaries, court clerks, and corporate procurement teams.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <FileDigit className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Numeración Bates & Notarial' : 'Bates & Notarial Stamping'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Formatos con ceros a la izquierda (001, 000001), prefijos personalizables y notación legal frente/vuelta para protocolización.'
                    : 'Zero-padded formats (001, 000001), custom prefixes, and legal rect/verso notation for formal protocol records.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Páginas Enfrentadas (Duplex)' : 'Facing Pages (Duplex)'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Alternancia simétrica de esquinas exteriores para que los números nunca queden ocultos en el lomo tras la encuadernación.'
                    : 'Symmetrical outer-corner alternation ensuring page numbers never get hidden inside the spine after book binding.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Compensación de Giro 360°' : '360° Rotation Compensation'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Detecta la rotación individual de cada hoja (90°, 180°, 270°) y orienta el sello correctamente en planos o páginas apaisadas.'
                    : 'Detects individual page rotation (90°, 180°, 270°) and compensates coordinates for upright stamps on blueprints.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Escudo Anticolisión y Privacidad' : 'Legibility Shield & Privacy'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Caja protectora blanca para máxima visibilidad sobre membretes y ejecución 100% en RAM sin subir tus archivos a la red.'
                    : 'Protective white bounding box for maximum clarity over headers, running 100% in RAM with zero cloud uploads.'}
                </p>
              </div>
            </div>
          </section>

          {/* CATÁLOGO DE FORMATOS DE FOLIADO */}
          <section className="pt-10 border-t border-zinc-800/80 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'TIPOLOGÍAS Y ESTÁNDARES' : 'STANDARDS & FORMATS'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs ? 'Formatos de Foliación Admitidos' : 'Supported Numbering Styles'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-3">
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase">
                  {isEs ? 'Estándar Notarial (001)' : 'Notarial Standard (001)'}
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-center text-sm text-emerald-400 font-bold tracking-wider">
                  Folio N° 001
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Relleno de 3 dígitos indispensable en escrituras públicas, actas constitutivas y protocolos notariales.'
                    : '3-digit zero padding essential for official notary records, corporate bylaws, and deeds.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-3">
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase">
                  {isEs ? 'Foliado Judicial Bates' : 'Court Bates Stamping'}
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-center text-sm text-cyan-400 font-bold tracking-wider">
                  BATES-000045
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Prefijo procesal con 6 dígitos para grandes masas probatorias, litigios civiles/penales y arbitrajes.'
                    : 'Docket prefix with 6-digit padding for high-volume evidentiary dockets, litigation, and arbitration.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-3">
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase">
                  {isEs ? 'Notarial Frente y Vuelta' : 'Recto & Verso (Fte/Vto)'}
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-center text-sm text-amber-400 font-bold tracking-wider">
                  F° 1 vto (Vuelta)
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Distinción explícita de cara anterior (fte) y posterior (vto) según el sistema de fe pública tradicional.'
                    : 'Explicit distinction between front (recto) and back (verso) for traditional public notary books.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-3">
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase">
                  {isEs ? 'Informe Corporativo' : 'Corporate Report'}
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-center text-sm text-purple-400 font-bold tracking-wider">
                  Página 1 de 84
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Totalizador de páginas dinámico ideal para memorias anuales, balances contables y manuales técnicos.'
                    : 'Dynamic page counter ideal for annual reports, balance sheets, and engineering manuals.'}
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
                {isEs ? 'Cómo Foliar Páginas PDF en 3 Pasos' : 'How to Number PDF Pages in 3 Steps'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-b from-[#18181f] to-[#0a0a0d] border border-zinc-800 p-6 rounded-3xl relative space-y-3">
                <div className="text-2xl font-mono font-black text-cyan-400">01</div>
                <h3 className="text-base font-bold uppercase">
                  {isEs ? 'Carga tu Expediente' : 'Upload Your Docket'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Arrastra tu archivo PDF o selecciónalo desde tu disco local. Visualizarás la cuadrícula completa de páginas al instante.'
                    : 'Drag and drop your PDF or pick it locally. You will see the full HD page grid immediately.'}
                </p>
              </div>

              <div className="bg-gradient-to-b from-[#18181f] to-[#0a0a0d] border border-zinc-800 p-6 rounded-3xl relative space-y-3">
                <div className="text-2xl font-mono font-black text-cyan-400">02</div>
                <h3 className="text-base font-bold uppercase">
                  {isEs ? 'Personaliza Parámetros' : 'Configure Parameters'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Selecciona la posición de estampado, formato notarial/Bates, tipografía, escudo protector o modo de páginas enfrentadas.'
                    : 'Choose stamp location, notarial or Bates format, font family, protective shield, or facing pages mode.'}
                </p>
              </div>

              <div className="bg-gradient-to-b from-[#18181f] to-[#0a0a0d] border border-zinc-800 p-6 rounded-3xl relative space-y-3">
                <div className="text-2xl font-mono font-black text-cyan-400">03</div>
                <h3 className="text-base font-bold uppercase">
                  {isEs ? 'Aplica y Descarga' : 'Apply & Download'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Pulsa «Aplicar Foliado al Documento» y obtén tu archivo listo con plena validez legal y procesal en segundos.'
                    : 'Click "Apply Page Numbering" and download your legally compliant file in seconds.'}
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
                      {isEs ? 'Privacidad de Expedientes Sensibles' : 'Sensitive Docket Privacy'}
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
                          ? 'Archivos subidos a servidores en la nube'
                          : 'Files uploaded to third-party servers'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Modo Páginas Enfrentadas (Duplex)' : 'Facing Pages Duplex Mode'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? 'Sí (Alternancia simétrica de esquinas)'
                          : 'Yes (Symmetric corner alternation)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs
                          ? 'Inexistente (Posición fija)'
                          : 'Unavailable (Fixed positions only)'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Foliado Bates y Notarial 001/000001' : 'Bates & Notarial 001/000001'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? 'Sí (Ceros a la izquierda + prefijos)'
                          : 'Yes (Zero padding + custom prefix)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-amber-400" />
                      <span>
                        {isEs ? 'Solo numeración simple 1, 2, 3' : 'Only simple numbers 1, 2, 3'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Compensación de Giro en Planos' : 'Blueprint Rotation Compensation'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs ? 'Automática por cada hoja' : 'Automatic per individual sheet'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs ? 'Sellos torcidos o invertidos' : 'Crooked or inverted stamps'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Escudo Protector Blanco de Fondo' : 'White Readability Shield'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? 'Sí (Legible sobre cualquier fondo)'
                          : 'Yes (Readable over any background)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>{isEs ? 'Texto superpuesto ilegible' : 'Unreadable clashed text'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Límites de Páginas y Marcas de Agua' : 'Page Limits & Watermarks'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? 'Ilimitado • Sin marcas • Gratis'
                          : 'Unlimited • No watermarks • Free'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs
                          ? 'Cortes tras 20 págs o suscripción'
                          : 'Capped after 20 pages or paywall'}
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
                {isEs ? 'APLICACIONES PRÁCTICAS' : 'PRACTICAL APPLICATIONS'}
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
                      {isEs ? 'Expedientes Judiciales & Litigios' : 'Legal Dockets & Court Filings'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Cumplimiento procesal y sellado de fojas'
                        : 'Procedural compliance & page stamping'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Numera escritos de demanda, contestaciones y pruebas documentales correlativamente para su presentación electrónica ante tribunales y juzgados (LexNET, PJF, Poder Judicial).'
                    : 'Number court petitions, answers, and evidentiary exhibits consecutively for seamless electronic filing in state and federal court portals.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs
                        ? 'Licitaciones Públicas del Estado'
                        : 'Government & Public Procurement'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Propuestas técnicas y económicas'
                        : 'Technical & commercial bid packs'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Cumple con la estricta exigencia de foliado correlativo en sobres técnicos y financieros para evitar descalificaciones en contrataciones públicas y concursos de méritos.'
                    : 'Meet strict mandatory page foliation requirements in public bids and RFP proposals to prevent disqualification.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs ? 'Notarías & Protocolización' : 'Notaries & Protocol Registers'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Escrituras, actas y testimonios'
                        : 'Deeds, minutes, and certified copies'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Estampa números de folio en formatos 001 y notación frente/vuelta (fte/vto) para protocolizar tomos notariales y libros de registro mercantil.'
                    : 'Stamp 3-digit folio formats and recto/verso notations to protocolize official notary books and commercial registry archives.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs ? 'Auditorías Contables & Forenses' : 'Financial & Forensic Audits'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Cadena de custodia y estampación Bates'
                        : 'Chain of custody & Bates numbering'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Garantiza la trazabilidad documental de balances, facturas y libros de actas corporativas mediante códigos Bates unívocos que preservan la integridad de la prueba.'
                    : 'Ensure document traceability across balance sheets, invoices, and minutes with unique Bates stamps preserving evidentiary chain of custody.'}
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
                  ? 'Todo lo que Necesitas Saber sobre Foliar PDF'
                  : 'Everything You Need to Know About PDF Numbering'}
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
                    <div
                      className={`px-4 sm:px-5 pb-5 pt-1 text-xs text-zinc-400 font-mono leading-relaxed border-t border-zinc-800/60 transition-all duration-200 ${
                        isOpen ? 'block' : 'hidden'
                      }`}
                    >
                      {faq.a}
                    </div>
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
