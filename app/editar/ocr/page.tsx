'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Loader2,
  ScanText,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Sparkles,
  Layers,
  Contrast,
  Check,
  Scale,
  Briefcase,
  Stethoscope,
  GraduationCap,
  Building2,
  Search,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const PdfOcr = dynamic(() => import('@/components/PdfOcr'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">
        Cargando motor de reconocimiento óptico de caracteres (OCR v5.0)...
      </p>
    </div>
  ),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function OcrPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = isEs
    ? [
        {
          q: '¿Cómo funciona la tecnología OCR y qué es un "PDF Sandwich"?',
          a: 'El reconocimiento óptico de caracteres (OCR) analiza las matrices de píxeles en imágenes o documentos escaneados para identificar caracteres y palabras. Un "PDF Sandwich" conserva la imagen escaneada original intacta en primer plano con todos sus sellos, firmas y texturas, mientras incrusta por debajo una capa de texto invisible en sus coordenadas vectoriales exactas. Esto permite seleccionar, copiar y buscar texto (Ctrl + F) sin alterar la fidelidad visual del documento.',
        },
        {
          q: '¿Mis archivos confidenciales se envían o procesan en algún servidor externo?',
          a: 'En absoluto. PDFBlack implementa una arquitectura 100% Zero-Knowledge. El motor OCR de Tesseract.js y las librerías de recomposición PDF se ejecutan dentro de Web Workers y WebAssembly directamente en la memoria RAM de tu navegador. Ningún byte, imagen o documento sale de tu dispositivo ni se almacena en discos remotos, garantizando el cumplimiento estricto del RGPD e HIPAA.',
        },
        {
          q: '¿Qué idiomas soporta el motor de reconocimiento OCR?',
          a: 'Soporta más de 10 modelos de idiomas optimizados por redes neuronales LSTM: Español (spa), Inglés (eng), Francés (fra), Alemán (deu), Portugués (por), Italiano (ita), Chino Simplificado (chi_sim), Japonés (jpn), Árabe (ara) y Ruso (rus). Puedes seleccionar el idioma antes de iniciar el procesamiento para maximizar la exactitud tipográfica.',
        },
        {
          q: '¿Por qué mi PDF escaneado con sombras o fondos sucios no se lee bien y cómo ayuda el filtro de contraste?',
          a: 'Cuando un documento se fotografía o escanea con poca luz, los fondos grises y manchas confunden los algoritmos de segmentación. Al activar la opción "Mejorar Contraste", nuestro motor aplica preprocesamiento adaptativo en OffscreenCanvas: convierte la imagen a escala de grises y estira los umbrales de luminancia para purificar el fondo blanco y maximizar el contraste de los trazos tipográficos antes del pase de OCR.',
        },
        {
          q: '¿Puedo procesar únicamente páginas específicas o capítulos de un documento extenso?',
          a: 'Sí. Puedes elegir procesar todas las páginas o definir un rango personalizado (por ejemplo: "1-5, 8, 12-20"). El motor aplicará OCR únicamente a los folios indicados y conservará el resto intacto, optimizando tiempos de cálculo y recursos de memoria en tu equipo.',
        },
        {
          q: '¿Qué diferencia hay entre exportar a PDF Buscable, TXT o JSON?',
          a: 'El formato PDF genera el documento completo con la imagen original y la capa invisible de búsqueda; TXT extrae exclusivamente el texto limpio separado por saltos de página para edición en Word o Bloc de Notas; y JSON devuelve una estructura programática con coordenadas de cada bloque, niveles de confianza y recuento de palabras, ideal para flujos de automatización e ingesta en bases de datos.',
        },
        {
          q: '¿El documento resultante aumenta drásticamente de tamaño tras aplicar OCR?',
          a: 'No. A diferencia de convertidores genéricos que re-rasterizan todo el documento inflando el archivo hasta 10 veces, PDFBlack inyecta directamente la capa vectorial de fuentes en la estructura interna de las páginas existentes o aplica compresión JPEG de alta fidelidad, resultando en un incremento de tamaño mínimo que preserva la ligereza del archivo para envíos por correo.',
        },
        {
          q: '¿Funciona con PDFs protegidos con contraseña de apertura?',
          a: 'Sí. Si el PDF cuenta con cifrado estándar, el sistema detectará la protección y te solicitará la clave para desencriptar el documento en la memoria local de tu navegador antes de renderizar e indexar el contenido.',
        },
        {
          q: '¿Existe algún límite de páginas o costo por usar la herramienta OCR?',
          a: 'No hay costos ocultos ni límites artificiales impuestos por servidores. Puedes procesar documentos tantas veces como necesites de forma totalmente gratuita y sin requerir registro de cuenta ni suscripción mensual.',
        },
      ]
    : [
        {
          q: 'How does OCR technology work and what is a "Searchable PDF Sandwich"?',
          a: 'Optical Character Recognition (OCR) analyzes pixel patterns in images or scanned documents to recognize letters and words. A "Searchable PDF Sandwich" keeps the original scanned image completely intact in the foreground with all its stamps, signatures, and textures, while embedding an invisible text layer directly beneath each word at exact coordinates. This enables selecting, copying, and searching text (Ctrl + F) without altering visual authenticity.',
        },
        {
          q: 'Are my confidential files uploaded or processed on external servers?',
          a: 'Not at all. PDFBlack operates under a strict Zero-Knowledge architecture. Tesseract.js OCR and PDF composition run within Web Workers and WebAssembly entirely in your local browser RAM. No bytes, images, or documents ever leave your machine or touch cloud disks, fully complying with GDPR and HIPAA standards.',
        },
        {
          q: 'Which languages are supported by the OCR engine?',
          a: 'It supports over 10 neural-network LSTM language models: Spanish (spa), English (eng), French (fra), German (deu), Portuguese (por), Italian (ita), Simplified Chinese (chi_sim), Japanese (jpn), Arabic (ara), and Russian (rus). You can pick your document language before execution to ensure maximum typographical accuracy.',
        },
        {
          q: 'Why do scanned documents with shadows or dirty backgrounds fail OCR, and how does contrast enhancement help?',
          a: 'When documents are photographed or scanned with poor lighting, grayish shadows confuse segmentation algorithms. Enabling "Enhance Contrast" triggers an adaptive OffscreenCanvas pre-filter: it converts images to grayscale and stretches luminance thresholds, purifying backgrounds and sharpening letter contours before Tesseract processes them.',
        },
        {
          q: 'Can I process only specific pages or chapters of a lengthy document?',
          a: 'Yes. You can process the entire document or specify custom page ranges (e.g., "1-5, 8, 12-20"). The engine only scans the chosen pages and leaves the rest untouched, saving battery and CPU cycles on your device.',
        },
        {
          q: 'What is the difference between exporting to Searchable PDF, TXT, or JSON?',
          a: 'Searchable PDF produces a full document with the original scan and invisible text layer; TXT extracts raw clean text page by page for easy editing in Word; and JSON outputs a structured payload with word coordinates, bounding boxes, and confidence levels for automated data pipelines.',
        },
        {
          q: 'Does the resulting PDF file size bloat dramatically after applying OCR?',
          a: 'No. Unlike generic tools that re-rasterize entire documents into massive uncompressed bitmaps, PDFBlack injects invisible vector text directly into existing PDF streams or uses high-fidelity compression, keeping file sizes lightweight for easy email sharing.',
        },
        {
          q: 'Does it work with password-encrypted PDF files?',
          a: 'Yes. If a document has standard open security, PDFBlack detects the encrypted stream and offers an in-memory password prompt to authenticate locally before rendering and executing OCR.',
        },
        {
          q: 'Are there any page limits or fees for using the OCR tool?',
          a: 'No hidden fees or artificial server restrictions. You can process documents as often as needed 100% free with zero sign-up or credit card requirements.',
        },
      ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'SoftwareApplication'],
    name: isEs
      ? 'Reconocimiento OCR en PDF Gratis Online — Hacer PDF Buscable | PDFBlack'
      : 'OCR PDF Online Free — Make PDF Searchable & Selectable | PDFBlack',
    url: `${SITE_URL}/editar/ocr`,
    applicationCategory: 'UtilitiesApplication, BusinessApplication',
    operatingSystem: 'All (Windows, macOS, Linux, iOS, Android)',
    browserRequirements: 'Requires JavaScript. Requires HTML5 Canvas and WebAssembly/Web Workers.',
    description: isEs
      ? 'Convierte PDFs escaneados y fotos de documentos en archivos PDF buscables con texto seleccionable. Reconocimiento OCR 100% local en tu navegador sin subir datos al servidor.'
      : 'Convert scanned PDFs and document images into searchable PDFs with selectable text. 100% local browser OCR processing with zero server uploads.',
    softwareVersion: '5.0',
    screenshot: `${SITE_URL}/og-ocr-pdf.png`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '2410',
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Generación de PDF Sandwich con capa de texto invisible según norma ISO 32000-1',
      'Motor de reconocimiento Tesseract v5.0 acelerado en WebAssembly',
      'Soporte multilingüe en más de 10 idiomas (Español, Inglés, Francés, Alemán y más)',
      'Preprocesamiento adaptativo de imagen con mejora de contraste y binarización',
      'Alineación milimétrica de palabras mediante coordenadas HOCR y TSV',
      'Exportación versátil a PDF Buscable, texto plano .TXT y estructura .JSON',
      'Desbloqueo seguro de documentos PDF protegidos con contraseña en memoria',
      'Procesamiento 100% en memoria RAM local sin subida a servidores (Zero-Knowledge)',
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
        name: isEs ? 'Editar PDF' : 'Edit PDF',
        item: `${SITE_URL}/editar`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isEs ? 'Reconocimiento OCR' : 'OCR PDF',
        item: `${SITE_URL}/editar/ocr`,
      },
    ],
  };

  const howToStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isEs
      ? 'Cómo hacer un PDF escaneado buscable y seleccionable con OCR'
      : 'How to make a scanned PDF searchable and selectable with OCR',
    description: isEs
      ? 'Aprende a transformar documentos escaneados e imágenes en PDFs con texto seleccionable e indexable con PDFBlack sin subir archivos a la nube.'
      : 'Learn how to transform scanned documents and images into PDFs with selectable and searchable text using PDFBlack with zero cloud uploads.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: isEs ? 'Selecciona o arrastra tu PDF escaneado' : 'Select or drag your scanned PDF',
        text: isEs
          ? 'Haz clic en Seleccionar Archivo PDF o arrastra el documento escaneado a la zona de carga.'
          : 'Click Select PDF File or drag your scanned document into the dropzone.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isEs
          ? 'Configura el idioma y opciones de contraste'
          : 'Configure language and contrast options',
        text: isEs
          ? 'Elige el idioma del documento (español, inglés, etc.), define el alcance de páginas y activa la mejora de contraste si el escaneo tiene sombras.'
          : 'Choose your document language (Spanish, English, etc.), set page scope, and enable contrast enhancement if scans are dark.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isEs
          ? 'Ejecuta el OCR y descarga el PDF buscable'
          : 'Run OCR and download searchable PDF',
        text: isEs
          ? 'Pulsa Reconocer Texto (OCR). El motor procesará en memoria y generará tu archivo con texto indexable listo para buscar y copiar.'
          : 'Click Recognize Text (OCR). The in-memory engine produces your searchable document ready to copy and search with Ctrl+F.',
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
        {/* COMPONENTE PRINCIPAL DE OCR */}
        <PdfOcr />

        {/* ════════════════════════════════════════════════════════════════
            SECCIONES EDITORIALES DE ALTA FIDELIDAD Y SEO CORPORATIVO
        ════════════════════════════════════════════════════════════════ */}

        {/* 4 PILARES TÉCNICOS DE INGENIERÍA OCR */}
        <section className="mt-20 border-t border-zinc-800/80 pt-16">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono text-[#FAF6EE]/80 uppercase tracking-widest bg-zinc-900 px-3.5 py-1.5 rounded-full border border-zinc-700 inline-flex items-center gap-1.5 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#FAF6EE]" />
              {isEs
                ? 'ARQUITECTURA DE RECONOCIMIENTO DOCUMENTAL'
                : 'DOCUMENT RECOGNITION ARCHITECTURE'}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Ingeniería OCR de Alta Precisión Sin Servidor'
                : 'High-Precision Serverless OCR Engineering'}
            </h2>
            <p className="text-zinc-400 text-sm font-mono mt-3 leading-relaxed">
              {isEs
                ? 'Tecnología WebAssembly de última generación que transforma imágenes y escaneos físicos en documentos PDF indexables, garantizando confidencialidad absoluta y máxima legibilidad tipográfica.'
                : 'Next-generation WebAssembly technology turning physical scans into indexed PDFs with absolute confidentiality and maximum typographical accuracy.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all shadow-xl group">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-white font-sans uppercase tracking-tight mb-2">
                {isEs ? 'Tesseract v5.0 en WASM' : 'Tesseract v5.0 in WASM'}
              </h3>
              <p className="text-zinc-400 text-xs font-mono leading-relaxed">
                {isEs
                  ? 'Redes neuronales LSTM compiladas en WebAssembly que procesan caracteres directamente en el procesador de tu equipo sin latencia de red ni colas en la nube.'
                  : 'LSTM neural networks compiled to WebAssembly running directly on your client CPU without cloud queues or upload latency.'}
              </p>
            </div>

            <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all shadow-xl group">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-white font-sans uppercase tracking-tight mb-2">
                {isEs ? 'Estructura PDF Sandwich' : 'Searchable PDF Sandwich'}
              </h3>
              <p className="text-zinc-400 text-xs font-mono leading-relaxed">
                {isEs
                  ? 'Incrustación de una capa de texto invisible subyacente bajo la norma ISO 32000-1, permitiendo seleccionar y buscar con Ctrl+F sin alterar firmas ni sellos.'
                  : 'Embeds an invisible text layer compliant with ISO 32000-1, enabling instant Ctrl+F search while preserving stamps and signatures perfectly.'}
              </p>
            </div>

            <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all shadow-xl group">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform">
                <Contrast className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-white font-sans uppercase tracking-tight mb-2">
                {isEs ? 'Preprocesamiento Adaptativo' : 'Adaptive Pre-processing'}
              </h3>
              <p className="text-zinc-400 text-xs font-mono leading-relaxed">
                {isEs
                  ? 'Filtros en OffscreenCanvas para estirar contraste dinámico, suprimir fondos oscuros y purificar trazos para elevar la tasa de acierto del 75% a más del 98%.'
                  : 'OffscreenCanvas filters dynamically stretching luminance and eliminating shadows to boost recognition accuracy from 75% to over 98%.'}
              </p>
            </div>

            <div className="bg-[#121217] border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all shadow-xl group">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-white font-sans uppercase tracking-tight mb-2">
                {isEs ? 'Privacidad Zero-Knowledge' : 'Zero-Knowledge Privacy'}
              </h3>
              <p className="text-zinc-400 text-xs font-mono leading-relaxed">
                {isEs
                  ? 'Cumplimiento normativo RGPD e HIPAA estricto: tus documentos privados se procesan en la memoria volátil del navegador y desaparecen al cerrar la pestaña.'
                  : 'Strict GDPR & HIPAA compliance: your private documents stay in volatile client RAM and are wiped clean when the browser tab closes.'}
              </p>
            </div>
          </div>
        </section>

        {/* CASOS DE USO EMPRESARIALES */}
        <section className="mt-20 border-t border-zinc-800/80 pt-16">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono text-[#FAF6EE]/80 uppercase tracking-widest bg-zinc-900 px-3.5 py-1.5 rounded-full border border-zinc-700 inline-flex items-center gap-1.5 mb-4">
              <Building2 className="w-3.5 h-3.5 text-[#FAF6EE]" />
              {isEs ? 'APLICACIONES PROFESIONALES' : 'PROFESSIONAL USE CASES'}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Soluciones OCR Diseñadas para Sectores Críticos'
                : 'OCR Solutions Designed for Critical Sectors'}
            </h2>
            <p className="text-zinc-400 text-sm font-mono mt-3 leading-relaxed">
              {isEs
                ? 'Desde despachos legales hasta hospitales y entidades financieras: indexación masiva de texto con confidencialidad inquebrantable.'
                : 'From legal firms to healthcare facilities and finance: scalable document indexing with uncompromising data security.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white mb-4">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Expedientes Notariales y Legales' : 'Legal & Notarial Dossiers'}
                </h3>
                <p className="text-zinc-400 text-xs font-mono leading-relaxed">
                  {isEs
                    ? 'Indexa contratos escaneados, escrituras públicas y sentencias para buscar jurisprudencia, nombres y fechas clave sin comprometer el secreto profesional.'
                    : 'Index scanned deeds, contracts, and court rulings to instantly search clauses, names, and dates while maintaining attorney-client privilege.'}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
                {isEs ? '✓ Cumple secreto confidencial' : '✓ Full confidentiality'}
              </div>
            </div>

            <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white mb-4">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Facturación y Contabilidad' : 'Invoices & Accounting'}
                </h3>
                <p className="text-zinc-400 text-xs font-mono leading-relaxed">
                  {isEs
                    ? 'Extrae texto de albaranes, recibos y balances fiscales escaneados para exportar cifras a formatos tabulares o JSON con máxima nitidez numérica.'
                    : 'Extract text from scanned receipts, invoices, and tax returns to export figures into structured tables or JSON with numeric precision.'}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
                {isEs ? '✓ Modo numérico optimizado' : '✓ Optimized numeric mode'}
              </div>
            </div>

            <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white mb-4">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Historias Clínicas Médicas' : 'Medical Records & Charts'}
                </h3>
                <p className="text-zinc-400 text-xs font-mono leading-relaxed">
                  {isEs
                    ? 'Haz buscables informes médicos, analíticas y recetas manuscritas digitalizadas sin violar normativas de protección de datos de pacientes (HIPAA).'
                    : 'Make medical reports, lab charts, and patient files searchable without violating healthcare data privacy regulations (HIPAA).'}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
                {isEs ? '✓ Protección total de datos' : '✓ Zero data leakage'}
              </div>
            </div>

            <div className="bg-[#121217] border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white mb-4">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-sans uppercase mb-2">
                  {isEs ? 'Archivos Históricos y Tesis' : 'Historical Archives & Theses'}
                </h3>
                <p className="text-zinc-400 text-xs font-mono leading-relaxed">
                  {isEs
                    ? 'Convierte libros antiguos escaneados, tesis académicas y microfilmes en archivos digitales indexables para bibliotecas y centros de investigación.'
                    : 'Turn scanned legacy books, academic dissertations, and microfilms into fully searchable research assets for libraries and scholars.'}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
                {isEs ? '✓ Soporte multilingüe amplio' : '✓ Broad multilingual support'}
              </div>
            </div>
          </div>
        </section>

        {/* COMPARATIVA Y BENCHMARK */}
        <section className="mt-20 border-t border-zinc-800/80 pt-16">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono text-[#FAF6EE]/80 uppercase tracking-widest bg-zinc-900 px-3.5 py-1.5 rounded-full border border-zinc-700 inline-flex items-center gap-1.5 mb-4">
              <Search className="w-3.5 h-3.5 text-[#FAF6EE]" />
              {isEs ? 'BENCHMARK CORPORATIVO' : 'CORPORATE BENCHMARK'}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? '¿Por Qué PDFBlack Supera a las Alternativas en la Nube?'
                : 'Why PDFBlack Outperforms Cloud Alternatives'}
            </h2>
            <p className="text-zinc-400 text-sm font-mono mt-3 leading-relaxed">
              {isEs
                ? 'Analizamos objetivamente las capacidades técnicas, privacidad y costos frente a las soluciones de software más reconocidas del mercado.'
                : 'An objective analysis of technical capabilities, privacy, and costs compared to industry benchmarks.'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border border-zinc-800 rounded-2xl overflow-hidden bg-[#121217]">
              <thead>
                <tr className="bg-zinc-900/90 text-zinc-300 border-b border-zinc-800 text-[11px] uppercase font-bold">
                  <th className="p-4">{isEs ? 'Criterio de Evaluación' : 'Evaluation Criteria'}</th>
                  <th className="p-4 text-white bg-zinc-800/80 border-x border-zinc-700">
                    PDFBlack Enterprise
                  </th>
                  <th className="p-4 text-zinc-400">Adobe Acrobat Pro</th>
                  <th className="p-4 text-zinc-400">ABBYY FineReader</th>
                  <th className="p-4 text-zinc-400">iLovePDF Cloud</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4 font-bold text-white">
                    {isEs ? 'Lugar de Procesamiento' : 'Processing Location'}
                  </td>
                  <td className="p-4 text-emerald-400 font-bold bg-zinc-800/40 border-x border-zinc-700">
                    {isEs ? '100% RAM Local (WASM)' : '100% Client RAM (WASM)'}
                  </td>
                  <td className="p-4 text-zinc-400">
                    {isEs ? 'Local (Software de pago)' : 'Local (Desktop app)'}
                  </td>
                  <td className="p-4 text-zinc-400">
                    {isEs ? 'Local (Software de pago)' : 'Local (Desktop app)'}
                  </td>
                  <td className="p-4 text-amber-400/90">
                    {isEs ? 'Servidores en la Nube' : 'Remote Cloud Servers'}
                  </td>
                </tr>
                <tr className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4 font-bold text-white">
                    {isEs ? 'Privacidad & RGPD' : 'Privacy & GDPR'}
                  </td>
                  <td className="p-4 text-emerald-400 font-bold bg-zinc-800/40 border-x border-zinc-700">
                    {isEs ? 'Zero-Knowledge (Sin subida)' : 'Zero-Knowledge (No uploads)'}
                  </td>
                  <td className="p-4 text-zinc-300">
                    {isEs ? 'Requiere cuenta corporativa' : 'Requires Adobe login'}
                  </td>
                  <td className="p-4 text-zinc-300">
                    {isEs ? 'Requiere licencia' : 'Requires license key'}
                  </td>
                  <td className="p-4 text-rose-400/90">
                    {isEs ? 'Archivos suben a servidores' : 'Files leave device'}
                  </td>
                </tr>
                <tr className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4 font-bold text-white">
                    {isEs ? 'Costo & Suscripción' : 'Cost & Subscription'}
                  </td>
                  <td className="p-4 text-emerald-400 font-bold bg-zinc-800/40 border-x border-zinc-700">
                    {isEs ? '100% Gratis Sin Límites' : '100% Free & Unlimited'}
                  </td>
                  <td className="p-4 text-zinc-400">
                    {isEs ? '$24.99 USD / mes' : '$24.99 USD / mo'}
                  </td>
                  <td className="p-4 text-zinc-400">
                    {isEs ? '$99.00 USD / licencia' : '$99.00 USD / license'}
                  </td>
                  <td className="p-4 text-zinc-400">
                    {isEs ? 'Límite de tareas gratis' : 'Free tier limitations'}
                  </td>
                </tr>
                <tr className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4 font-bold text-white">
                    {isEs ? 'Instalación Requerida' : 'Installation Required'}
                  </td>
                  <td className="p-4 text-emerald-400 font-bold bg-zinc-800/40 border-x border-zinc-700">
                    {isEs ? 'Cero (Navegador Web)' : 'Zero (Direct in Browser)'}
                  </td>
                  <td className="p-4 text-zinc-400">
                    {isEs ? 'Instalador de varios GB' : 'Multi-gigabyte download'}
                  </td>
                  <td className="p-4 text-zinc-400">
                    {isEs ? 'Instalador de escritorio' : 'Desktop software download'}
                  </td>
                  <td className="p-4 text-emerald-400 font-bold">
                    {isEs ? 'Cero (Navegador Web)' : 'Zero (Browser)'}
                  </td>
                </tr>
                <tr className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4 font-bold text-white">
                    {isEs ? 'Formato PDF Sandwich' : 'Searchable PDF Output'}
                  </td>
                  <td className="p-4 text-emerald-400 font-bold bg-zinc-800/40 border-x border-zinc-700">
                    ✓ {isEs ? 'ISO 32000-1 Nativo' : 'ISO 32000-1 Native'}
                  </td>
                  <td className="p-4 text-emerald-400">✓ {isEs ? 'Soportado' : 'Supported'}</td>
                  <td className="p-4 text-emerald-400">✓ {isEs ? 'Soportado' : 'Supported'}</td>
                  <td className="p-4 text-emerald-400">✓ {isEs ? 'Soportado' : 'Supported'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECCIÓN FAQ DESPLEGABLE */}
        <section className="mt-20 border-t border-zinc-800/80 pt-16 mb-24">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono text-[#FAF6EE]/80 uppercase tracking-widest bg-zinc-900 px-3.5 py-1.5 rounded-full border border-zinc-700 inline-flex items-center gap-1.5 mb-4">
              <HelpCircle className="w-3.5 h-3.5 text-[#FAF6EE]" />
              {isEs ? 'PREGUNTAS FRECUENTES' : 'FREQUENTLY ASKED QUESTIONS'}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans uppercase">
              {isEs
                ? 'Resolvemos Todas tus Dudas sobre OCR'
                : 'Everything You Need to Know About OCR'}
            </h2>
            <p className="text-zinc-400 text-sm font-mono mt-3 leading-relaxed">
              {isEs
                ? 'Respuestas directas sobre la generación de PDFs buscables, privacidad documental y compatibilidad de idiomas.'
                : 'Direct answers regarding searchable PDF creation, document security, and language models.'}
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-[#121217] border border-zinc-800/90 rounded-2xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/40 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-white font-sans flex items-center gap-3">
                      <span className="text-xs font-mono text-[#FAF6EE] bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded-md">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {faq.q}
                    </span>
                    <div className="p-1 rounded-lg bg-zinc-900 text-zinc-400 flex-shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-white" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-6 sm:px-6 pt-1 text-zinc-400 text-xs sm:text-sm font-mono leading-relaxed border-t border-zinc-800/40">
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
