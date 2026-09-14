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
  ShieldAlert,
  Repeat,
  Image as ImageIcon,
  Stamp,
  Award,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfWatermark = dynamic(() => import('@/components/PdfWatermark'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor empresarial de marcas de agua y sellos PDF...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function MarcaAguaPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = isEs
    ? [
        {
          q: '¿Qué es una marca de agua en un documento PDF y para qué se utiliza?',
          a: 'Una marca de agua es un texto, logotipo o sello superpuesto de forma semitransparente sobre las páginas de un documento. Se utiliza para indicar el estado legal de un archivo (por ejemplo, «CONFIDENCIAL», «BORRADOR», «COPIA NO CONTROLADA»), salvaguardar la propiedad intelectual de informes o proyectos creativos y prevenir el uso no autorizado o la filtración de información reservada.',
        },
        {
          q: '¿Qué ventaja ofrece el modo de «Mosaico Repetido» (Tiled Pattern) frente al sello único?',
          a: 'Un sello único colocado en el centro o en una esquina puede ser recortado o eliminado fácilmente mediante herramientas de edición visual. El patrón en mosaico repetido estampa una matriz diagonal que cubre la totalidad de cada hoja, haciendo prácticamente imposible recortar el documento o fotografiar fragmentos de pantalla sin que el sello de seguridad quede patente.',
        },
        {
          q: '¿Cómo resuelve PDFBlack la rotación de páginas horizontales o apaisadas?',
          a: 'Los expedientes y planos a menudo contienen páginas con rotación nativa a 90°, 180° o 270°. Nuestro motor empresarial inspecciona el diccionario geométrico de cada hoja individualmente y compensa matemáticamente las coordenadas y el ángulo del sello, garantizando que aparezca en la orientación y esquina visualmente correctas.',
        },
        {
          q: '¿Puedo insertar un logotipo con fondo transparente (PNG)?',
          a: 'Sí. El motor admite imágenes en formatos PNG y JPG con canal alfa transparente. Puedes ajustar la escala porcentual del logo, su nivel de opacidad (de 5% a 100%) y el ángulo de rotación para adaptarlo a la identidad visual de tu empresa o estudio.',
        },
        {
          q: '¿Se degradan los textos, imágenes o vectores del PDF original al estampar el sello?',
          a: 'En absoluto. PDFBlack realiza una inyección vectorial limpia sobre el flujo de contenido nativo (`page.drawText` o `page.drawImage`) sin recomprimir imágenes existentes, sin rasterizar fuentes tipográficas ni modificar la resolución del documento original.',
        },
        {
          q: '¿Puedo elegir en qué páginas colocar la marca de agua o saltarme la portada?',
          a: 'Sí. Dispones de selectores de alcance rápido: «Todas las páginas», «Solo páginas impares», «Solo páginas pares» o «Rango personalizado» (ejemplo: 1-10, 15). Además, cuentas con una casilla específica para omitir la carátula o portada con un solo clic.',
        },
        {
          q: '¿Es seguro poner marcas de agua a contratos confidenciales, balances o auditorías?',
          a: '100% seguro. PDFBlack implementa una arquitectura Zero-Knowledge estricta: todo el procesamiento, estampado y cálculo vectorial se ejecuta en la memoria RAM de tu navegador web mediante Web Workers aislados. Ningún byte se envía a servidores remotos ni se guarda en la nube, garantizando el cumplimiento del RGPD, LOPD e HIPAA.',
        },
        {
          q: '¿El sello de agua permanece visible al imprimir el PDF en papel físico?',
          a: 'Sí. Al integrarse como capa vectorial conforme al estándar internacional ISO 32000-1, la marca de agua se renderiza fielmente tanto en pantallas de alta resolución como en impresoras láser, fotocopiadoras y visores estándar como Adobe Acrobat, Edge o Chrome.',
        },
        {
          q: '¿Puedo desbloquear un PDF protegido antes de estampar la marca de agua?',
          a: 'Sí. Si tu documento requiere contraseña de apertura, el visor incluye un widget local para ingresar la clave en memoria y desbloquear las páginas directamente en tu dispositivo sin transferir tus credenciales a terceros.',
        },
      ]
    : [
        {
          q: 'What is a PDF watermark and what is it used for?',
          a: 'A watermark is a semi-transparent text, logo, or stamp superimposed across the pages of a document. It is used to declare legal status (e.g., "CONFIDENTIAL", "DRAFT", "DO NOT COPY"), protect intellectual property in technical reports or creative assets, and deter unauthorized leaks or disclosure.',
        },
        {
          q: 'What are the benefits of the "Repeating Mosaic" (Tiled) pattern over a single stamp?',
          a: 'A single corner or center stamp can easily be cropped or masked out. The repeating diagonal mosaic stamps a matrix pattern across the entire sheet surface, making it practically impossible to take screenshots or photocopy document excerpts without displaying the security watermark.',
        },
        {
          q: 'How does PDFBlack handle landscape or rotated sheets?',
          a: 'Documents frequently contain mixed portrait contracts alongside landscape tables or blueprints (90°, 180°, 270°). Our enterprise engine reads each page rotation dictionary and compensates coordinates and rotation angles so watermarks stay visually upright in the intended visual area.',
        },
        {
          q: 'Can I upload a transparent PNG logo?',
          a: 'Yes. The engine fully supports PNG with alpha channel transparency as well as JPG images. You can adjust logo scaling (10% to 100%), opacity levels, and rotation angle to align with your corporate branding standards.',
        },
        {
          q: 'Does stamping watermarks degrade text, vector sharpness, or embedded images?',
          a: 'Not at all. PDFBlack applies non-destructive vector injections directly into the PDF content stream without recompressing existing images, rasterizing fonts, or altering native document resolution.',
        },
        {
          q: 'Can I stamp specific pages or exclude the document cover sheet?',
          a: 'Yes. You can use quick scope selectors: "All Pages", "Odd Pages Only", "Even Pages Only", or "Custom Page Range" (e.g., 1-10, 15), with a dedicated toggle to automatically skip the first cover page.',
        },
        {
          q: 'Is it private and safe to watermark sensitive contracts and financial audits?',
          a: '100% private and secure. PDFBlack runs on a Zero-Knowledge local architecture: all file processing and vector rendering take place inside your browser RAM via Web Workers. Not a single byte is uploaded to cloud servers, complying with GDPR, HIPAA, and corporate confidentiality policies.',
        },
        {
          q: 'Will the watermark remain intact when physically printed?',
          a: 'Yes. Because watermarks are embedded following the ISO 32000-1 PDF standard, they print consistently on physical paper and render properly in Adobe Acrobat, Chrome, Edge, and mobile readers.',
        },
        {
          q: 'Can I unlock password-protected PDF files before watermarking?',
          a: 'Yes. If your document requires a password to open, an in-memory unlocking prompt allows you to supply credentials locally without transmitting keys to external servers.',
        },
      ];

  const jsonLdWebApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isEs
      ? 'Poner Marca de Agua en PDF Gratis Online — Sello de Agua | PDFBlack'
      : 'Add Watermark to PDF Online Free — Stamp & Logo | PDFBlack',
    url: `${SITE_URL}/editar/marca-agua`,
    description: isEs
      ? 'Herramienta profesional para poner marcas de agua y sellos de texto o imagen en PDF. Modo mosaico anti-fugas, logotipos transparentes, compensación de rotación y privacidad 100% en RAM.'
      : 'Professional web tool to add text or image watermarks to PDF files. Anti-leak repeating mosaic, transparent logos, page rotation compensation, and 100% in-browser RAM privacy.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Estampado de sellos prediseñados: CONFIDENCIAL, BORRADOR, COPIA, RESERVADO',
      'Modo Mosaico Repetido diagonal (DLP anti-filtraciones y fotocopias)',
      'Inserción de logotipos corporativos transparentes PNG / JPG',
      'Compensación automática de rotación en páginas de 90°, 180° y 270°',
      'Control de opacidad milimétrica (5% a 100%) y ángulo de -90° a +90°',
      'Tipografías corporativas incrustadas (Helvetica, Times Roman, Courier)',
      'Procesamiento 100% privado en memoria RAM local mediante Web Workers',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.94',
      reviewCount: '1620',
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
        name: isEs ? 'Marca de Agua' : 'Watermark',
        item: `${SITE_URL}/editar/marca-agua`,
      },
    ],
  };

  const jsonLdHowTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isEs
      ? 'Cómo Poner Marca de Agua a un Documento PDF Online'
      : 'How to Add Watermark to a PDF Document Online',
    description: isEs
      ? 'Guía paso a paso para añadir marcas de agua confidenciales, sellos o logotipos a tus archivos PDF en tu navegador.'
      : 'Step-by-step tutorial to add confidential watermarks, stamps, or logos to PDF files in your browser.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: isEs ? 'Cargar el archivo PDF' : 'Upload PDF file',
        text: isEs
          ? 'Arrastra o selecciona el documento PDF que deseas proteger en la zona de trabajo.'
          : 'Drag and drop or select the PDF document you want to protect in the workspace.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isEs ? 'Configurar texto o logo y formato' : 'Configure text or logo and format',
        text: isEs
          ? 'Elige texto (ej. CONFIDENCIAL) o sube tu logo, ajusta posición, ángulo, opacidad o activa el modo mosaico repetido.'
          : 'Pick text (e.g. CONFIDENTIAL) or upload your logo, adjust position, angle, opacity, or enable tiled mosaic mode.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isEs ? 'Estampar y Descargar' : 'Stamp and Download',
        text: isEs
          ? 'Haz clic en «Estampar Sello de Agua» y descarga tu archivo protegido al instante.'
          : 'Click "Apply Watermark Stamp" and immediately download your protected document.',
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
              isEs ? 'Herramienta para poner marcas de agua en PDF' : 'PDF Watermarking Tool'
            }
          >
            <PdfWatermark />
          </section>

          {/* PILARES DE ARQUITECTURA E INGENIERÍA DOCUMENTAL */}
          <section className="pt-10 border-t border-zinc-800/80 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'INGENIERÍA DOCUMENTAL' : 'DOCUMENT ENGINEERING'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs
                  ? 'Seguridad Documental y Fidelidad Vectorial Nativa'
                  : 'Document Security & Native Vector Fidelity'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                {isEs
                  ? 'Diseñado para empresas, despachos jurídicos y departamentos que exigen custodia y protección contra filtraciones.'
                  : 'Built for corporate teams, law firms, and agencies requiring strict leak prevention and data custody.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <Repeat className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Mosaico Repetido Anti-Fugas' : 'Tiled Anti-Leak Pattern'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Genera una matriz diagonal continua sobre la hoja, imposibilitando el recorte de sellos o la toma de fotos parciales sin identificación.'
                    : 'Generates a continuous diagonal matrix across sheets, thwarting cropping and partial photos without clear identification.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Compensación de Giro 360°' : '360° Rotation Adjustment'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Detecta la rotación intrínseca de páginas apaisadas (90°, 180°, 270°) y orienta el sello correctamente en planos y balances mixtos.'
                    : 'Detects intrinsic orientation on rotated sheets (90°, 180°, 270°) and compensates coordinates for perfect upright alignment.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl space-y-2.5 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-cyan-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  {isEs ? 'Inyección Vectorial Pura' : 'Pure Vector Injection'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Inyecta la capa de agua directamente en el stream de contenido ISO sin rasterizar fuentes tipográficas ni degradar imágenes originales.'
                    : 'Injects watermarks into native ISO content streams without font rasterization or image quality degradation.'}
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
                    ? 'Todo el procesamiento se realiza en la memoria RAM de tu navegador web. Ningún archivo ni texto confidencial se envía a servidores externos.'
                    : 'All processing occurs directly in your local browser RAM via Web Workers. No files ever leave your device.'}
                </p>
              </div>
            </div>
          </section>

          {/* CATÁLOGO DE TIPOLOGÍAS DE MARCAS DE AGUA */}
          <section className="pt-10 border-t border-zinc-800/80 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {isEs ? 'TIPOLOGÍAS DE PROTECCIÓN' : 'PROTECTION FORMATS'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isEs ? 'Modalidades y Estilos de Sello' : 'Stamping Styles & Modalities'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-3">
                <div className="text-xs font-mono text-red-400 font-bold uppercase">
                  {isEs ? 'Sello Confidencial M&A' : 'Confidential Stamp'}
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-center text-sm text-red-500 font-black tracking-widest uppercase">
                  CONFIDENCIAL
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Ideal para acuerdos de confidencialidad (NDA), fusiones, adquisiciones y estados contables preliminares.'
                    : 'Ideal for non-disclosure agreements (NDAs), M&A documentation, and preliminary financial statements.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-3">
                <div className="text-xs font-mono text-amber-400 font-bold uppercase">
                  {isEs ? 'Mosaico Anti-Fotocopias' : 'Anti-Copy Tiled Mosaic'}
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-center text-xs text-amber-400/80 font-bold tracking-wider uppercase">
                  COPIA NO CONTROLADA • COPIA NO CONTROLADA
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Cubre toda la página en diagonal con repetición regular, garantizando la trazabilidad ante fotos o impresiones.'
                    : 'Covers the entire sheet diagonally with repeating text, ensuring total traceability against leaks.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-3">
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase">
                  {isEs ? 'Logotipo Corporativo PNG' : 'Corporate PNG Logo'}
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center gap-2 text-cyan-400 text-xs font-mono font-bold">
                  <ImageIcon className="w-4 h-4" />
                  <span>EMPRESA LOGO</span>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Inserta la imagen institucional de tu empresa con transparencia alfa y control de escala milimétrica.'
                    : 'Embed your company logo with transparent alpha channel and precise percentage scaling.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-5 rounded-2xl space-y-3">
                <div className="text-xs font-mono text-purple-400 font-bold uppercase">
                  {isEs ? 'Borrador Legal / Anteproyecto' : 'Draft / Legal Preliminary'}
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-center text-sm text-purple-400 font-black tracking-widest uppercase">
                  BORRADOR PREVIO
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Evita que versiones preliminares de contratos o tesis se confundan con dictámenes o versiones finales.'
                    : 'Prevents draft contracts, proposals, or manuscripts from being mistaken for final executed copies.'}
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
                  ? 'Cómo Poner Marca de Agua a un PDF en 3 Pasos'
                  : 'How to Watermark a PDF in 3 Steps'}
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
                    ? 'Arrastra tu archivo PDF o selecciónalo desde tu equipo. Las miniaturas se procesarán con streaming progresivo sin esperas.'
                    : 'Drag and drop your PDF file or select it locally. Thumbnails load via progressive streaming with zero lag.'}
                </p>
              </div>

              <div className="bg-gradient-to-b from-[#18181f] to-[#0a0a0d] border border-zinc-800 p-6 rounded-3xl relative space-y-3">
                <div className="text-2xl font-mono font-black text-cyan-400">02</div>
                <h3 className="text-base font-bold uppercase">
                  {isEs ? 'Personaliza el Sello' : 'Customize Watermark'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Escribe el texto o carga tu logo, selecciona modo único o mosaico, ajusta ángulo, opacidad, color y alcance de páginas.'
                    : 'Type text or upload a logo, choose single or mosaic mode, adjust angle, opacity, color, and page scope.'}
                </p>
              </div>

              <div className="bg-gradient-to-b from-[#18181f] to-[#0a0a0d] border border-zinc-800 p-6 rounded-3xl relative space-y-3">
                <div className="text-2xl font-mono font-black text-cyan-400">03</div>
                <h3 className="text-base font-bold uppercase">
                  {isEs ? 'Estampa y Descarga' : 'Apply & Download'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Haz clic en «Estampar Sello de Agua» y obtén tu documento protegido y listo para compartir con total privacidad.'
                    : 'Click "Apply Watermark Stamp" and instantly receive your protected, leak-proof PDF document.'}
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
                          ? 'Archivos subidos a servidores remotos'
                          : 'Uploaded to third-party servers'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Modo Mosaico Repetido Diagonal' : 'Repeating Diagonal Mosaic Mode'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? 'Sí (Cobertura completa anti-capturas)'
                          : 'Yes (Full anti-screenshot coverage)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs ? 'Solo un sello estático al centro' : 'Only single centered stamp'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Compensación de Giro en Planos' : 'Page Rotation Compensation'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs ? 'Automática por cada hoja (0-270°)' : 'Automatic per page (0-270°)'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-amber-400" />
                      <span>
                        {isEs
                          ? 'Sellos torcidos en páginas apaisadas'
                          : 'Skewed stamps on landscape pages'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs
                        ? 'Soporte de Logotipos PNG con Transparencia'
                        : 'Transparent PNG Logo Support'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs ? 'Nativo con escala milimétrica' : 'Native with percentage scaling'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs ? 'A menudo de pago o fondo blanco' : 'Often paywalled or opaque'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">
                      {isEs ? 'Marcas de Agua Ajenas o Límites' : 'Third-Party Watermarks / Limits'}
                    </td>
                    <td className="p-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isEs
                          ? 'Sin marcas ajenas • Ilimitado'
                          : 'Zero third-party marks • Unlimited'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-red-400" />
                      <span>
                        {isEs ? 'Incrustan logos del servicio' : 'Service watermarks added'}
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
                {isEs ? 'Sectores que Confían en PDFBlack' : 'Industries that Rely on PDFBlack'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs ? 'Fusiones, Adquisiciones & M&A' : 'Mergers, Acquisitions & M&A'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs ? 'Salas de datos virtuales (VDR)' : 'Virtual data rooms (VDR)'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Protege balances financieros, análisis de due diligence y acuerdos de confidencialidad con sellos en mosaico para rastrear cualquier fuga de datos.'
                    : 'Safeguard financial statements, due diligence folders, and NDAs with repeating mosaic stamps to trace and prevent leaks.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs ? 'Estudios Jurídicos & Litigios' : 'Law Firms & Litigation'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Borradores y secreto profesional'
                        : 'Drafts & attorney-client privilege'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Diferencia borradores de minutas, contratos y convenios arbitrales antes de su protocolización o firma definitiva.'
                    : 'Mark draft motions, contracts, and settlement agreements before official protocolization or final execution.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs
                        ? 'Propiedad Intelectual & Creativos'
                        : 'Intellectual Property & Creatives'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Portafolios, guiones y anteproyectos'
                        : 'Portfolios, scripts & designs'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Estampa tu logotipo o marca de autor en planos arquitectónicos, catálogos o libros electrónicos para evitar plagio o uso comercial no autorizado.'
                    : 'Stamp your brand or author credit on architectural blueprints, catalogs, or eBooks to prevent plagiarism or unauthorized commercial use.'}
                </p>
              </div>

              <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-cyan-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase">
                      {isEs ? 'Auditorías Contables & Fiscales' : 'Tax & Financial Audits'}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {isEs
                        ? 'Control de copias y borradores de cierre'
                        : 'Copy control & preliminary year-end'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {isEs
                    ? 'Identifica estados contables preliminares con sellos de «COPIA NO CONTROLADA» o «DOCUMENTO AUDITADO» para estricto orden administrativo.'
                    : 'Label preliminary accounts with "UNCONTROLLED COPY" or "AUDITED DOCUMENT" stamps for strict compliance.'}
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
                  ? 'Todo lo que Necesitas Saber sobre Marcas de Agua en PDF'
                  : 'Everything You Need to Know About PDF Watermarks'}
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
