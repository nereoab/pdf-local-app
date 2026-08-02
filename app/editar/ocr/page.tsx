'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, ScanText, AlertTriangle, ChevronDown, HelpCircle, Zap, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfOcr = dynamic(() => import('@/components/PdfOcr'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando motor de reconocimiento óptico de caracteres...</p>
    </div>
  ),
});

export default function OcrPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const faqItems = isEs ? [
    {
      q: '¿Qué tipo de archivos PDF funcionan con el OCR?',
      a: 'El OCR está diseñado para PDFs escaneados que contienen imágenes de texto (no texto seleccionable). Si el PDF ya tiene texto seleccionable, no necesita OCR. Funciona mejor con documentos a 300 DPI o superior.',
    },
    {
      q: '¿En cuántos idiomas puede reconocer texto?',
      a: 'El motor soporta 10 idiomas: Español, Inglés, Francés, Alemán, Portugués, Italiano, Chino Simplificado, Japonés, Árabe y Ruso. Selecciona el idioma antes de iniciar para obtener la máxima precisión.',
    },
    {
      q: '¿Qué significa "capa de texto invisible"?',
      a: 'El OCR añade una capa de texto sobre la imagen original del PDF. Esta capa es invisible por defecto (0% de opacidad), por lo que el documento se ve exactamente igual, pero ahora puedes buscar, seleccionar y copiar texto.',
    },
    {
      q: '¿Mis documentos se suben a algún servidor?',
      a: 'No. El procesamiento OCR ocurre completamente en tu navegador gracias al motor Tesseract WASM. Tus archivos nunca salen de tu dispositivo. Es 100% privado y local.',
    },
    {
      q: '¿Cuál es la precisión del reconocimiento de texto?',
      a: 'Con documentos bien escaneados (300+ DPI, buena iluminación, texto impreso estándar), la precisión supera el 95%. Documentos borrosos, torcidos o con fuentes manuscritas pueden tener menor precisión.',
    },
    {
      q: '¿Puedo procesar solo algunas páginas de un documento grande?',
      a: 'Sí. En "Páginas a Procesar" puedes elegir "Todas las páginas" o especificar un rango personalizado como "1, 3-5, 10". Esto es especialmente útil para documentos muy extensos.',
    },
  ] : [
    {
      q: 'What type of PDF files work with OCR?',
      a: 'OCR is designed for scanned PDFs containing images of text (not selectable text). If the PDF already has selectable text, OCR is not needed. It works best with documents at 300 DPI or higher.',
    },
    {
      q: 'How many languages can it recognize?',
      a: 'The engine supports 10 languages: Spanish, English, French, German, Portuguese, Italian, Simplified Chinese, Japanese, Arabic, and Russian. Select the language before starting for maximum accuracy.',
    },
    {
      q: 'What does "invisible text layer" mean?',
      a: 'OCR adds a text layer on top of the original PDF image. This layer is invisible by default (0% opacity), so the document looks exactly the same, but you can now search, select, and copy text.',
    },
    {
      q: 'Are my documents uploaded to any server?',
      a: 'No. OCR processing happens entirely in your browser using the Tesseract WASM engine. Your files never leave your device. It\'s 100% private and local.',
    },
    {
      q: 'What is the text recognition accuracy?',
      a: 'With well-scanned documents (300+ DPI, good lighting, standard printed text), accuracy exceeds 95%. Blurry, skewed, or handwritten documents may have lower accuracy.',
    },
    {
      q: 'Can I process only some pages of a large document?',
      a: 'Yes. Under "Pages to Process" you can choose "All pages" or specify a custom range like "1, 3-5, 10". This is especially useful for very long documents.',
    },
  ];

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfOcr />

        {/* ══════════════════════════════════════════════
            4 SECCIONES INFORMATIVAS + FAQ ACCORDION
            ══════════════════════════════════════════════ */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">

          {/* ── SECCIÓN 1: CÓMO USAR ── */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <ScanText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo aplicar OCR a un PDF' : '1. How to OCR a PDF'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  textEs: 'Sube tu PDF escaneado arrastrándolo a la zona de carga o haciendo clic en "Seleccionar Archivo PDF". El OCR funciona con PDFs que contienen imágenes, no texto seleccionable.',
                  textEn: 'Upload your scanned PDF by dragging it to the upload zone or clicking "Select PDF File". OCR works with image-based PDFs, not those with selectable text.',
                },
                {
                  step: '02',
                  textEs: 'Selecciona el idioma del documento (10 disponibles: español, inglés, chino, árabe, etc.) y el formato de salida: PDF con texto, TXT plano, o JSON con datos de posicionamiento.',
                  textEn: 'Select the document language (10 available: Spanish, English, Chinese, Arabic, etc.) and output format: searchable PDF, plain TXT, or JSON with positioning data.',
                },
                {
                  step: '03',
                  textEs: 'Ajusta las opciones avanzadas: páginas a procesar, mejora de contraste, modo numérico y metadatos del PDF resultante (título, autor, asunto).',
                  textEn: 'Adjust advanced options: pages to process, contrast enhancement, numeric mode, and output PDF metadata (title, author, subject).',
                },
                {
                  step: '04',
                  textEs: 'Haz clic en "Reconocer Texto (OCR)". El motor procesa el documento en segundo plano sin congelar el navegador. Descarga el resultado directamente.',
                  textEn: 'Click "Recognize Text (OCR)". The engine processes the document in the background without freezing the browser. Download the result directly.',
                },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">
                    {isEs ? `Paso ${item.step}` : `Step ${item.step}`}
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">{isEs ? item.textEs : item.textEn}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECCIÓN 2: LIMITACIONES Y CONSEJOS ── */}
          <div className="bg-[#09090b] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-amber-500/20 pb-4">
              <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '2. Limitaciones y consejos útiles' : '2. Limitations & useful tips'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                  ✓ {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}
                </h4>
                {(isEs ? [
                  'Convertir PDFs escaneados en documentos con texto seleccionable, buscable y copiable.',
                  'Reconocer texto en 10 idiomas incluyendo chino, japonés y árabe.',
                  'Procesar documentos de múltiples páginas con selección de rango personalizado.',
                  'Exportar el texto reconocido como PDF con capa invisible, TXT plano o JSON estructurado.',
                  'Añadir metadatos (título, autor, asunto) al PDF resultante para gestión documental.',
                ] : [
                  'Convert scanned PDFs into documents with selectable, searchable, and copyable text.',
                  'Recognize text in 10 languages including Chinese, Japanese and Arabic.',
                  'Process multi-page documents with custom page range selection.',
                  'Export recognized text as PDF with invisible layer, plain TXT, or structured JSON.',
                  'Add metadata (title, author, subject) to the output PDF for document management.',
                ]).map((text, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                  💡 {isEs ? 'CONSEJOS PARA MEJORES RESULTADOS' : 'TIPS FOR BEST RESULTS'}
                </h4>
                {(isEs ? [
                  'Usa documentos escaneados a 300 DPI o más. A menor resolución, menor precisión de reconocimiento.',
                  'Asegúrate de que el escaneo tenga buena iluminación y contraste. Evita páginas torcidas o borrosas.',
                  'Selecciona el idioma correcto antes de iniciar para maximizar la precisión del reconocimiento.',
                  'Activa "Mejorar Contraste" para documentos con texto claro o fondo grisáceo.',
                  'Para documentos financieros o facturas, activa el "Modo Numérico" para mayor precisión en cifras.',
                ] : [
                  'Use documents scanned at 300 DPI or higher. Lower resolution means lower recognition accuracy.',
                  'Ensure the scan has good lighting and contrast. Avoid skewed or blurry pages.',
                  'Select the correct language before starting to maximize recognition accuracy.',
                  'Enable "Enhance Contrast" for documents with light text or grayish background.',
                  'For financial documents or invoices, enable "Numeric Mode" for better accuracy with numbers.',
                ]).map((text, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 3: QUÉ SUCEDE CON TU DOCUMENTO ── */}
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '3. ¿Qué sucede con tu documento al aplicar OCR?' : '3. What happens to your document when OCR is applied?'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖥️ {isEs ? 'Procesamiento 100% local' : '100% local processing'}</strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'El motor Tesseract WASM corre completamente en tu navegador en un Web Worker dedicado. Tus documentos no se suben a ningún servidor ni abandonan tu dispositivo.'
                    : 'The Tesseract WASM engine runs entirely in your browser in a dedicated Web Worker. Your documents are never uploaded to any server or leave your device.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🔍 {isEs ? 'Imagen original preservada' : 'Original image preserved'}</strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'El texto reconocido se añade como una capa invisible sobre la imagen original. El documento se ve exactamente igual que antes, pero ahora el texto es seleccionable y buscable.'
                    : 'Recognized text is added as an invisible layer over the original image. The document looks exactly the same as before, but text is now selectable and searchable.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">⚡ {isEs ? 'Motor Web Worker asíncrono' : 'Async Web Worker engine'}</strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'El procesamiento OCR ocurre en un hilo de trabajo independiente (Web Worker), por lo que la interfaz permanece totalmente funcional durante el reconocimiento, incluso con documentos de 50+ páginas.'
                    : 'OCR processing occurs in an independent worker thread (Web Worker), so the interface remains fully functional during recognition, even with 50+ page documents.'}
                </p>
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 4: FAQ ACCORDION ── */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '4. Preguntas Frecuentes (FAQ)' : '4. Frequently Asked Questions (FAQ)'}
              </h2>
            </div>
            <div className="space-y-2">
              {faqItems.map((item, i) => (
                <details key={i} className="group bg-zinc-900/60 border border-white/5 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none select-none hover:bg-zinc-800/40 transition-colors">
                    <span className="text-xs font-bold text-white pr-4">{item.q}</span>
                    <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0 group-open:rotate-180 transition-transform duration-200" />
                  </summary>
                  <div className="px-5 pb-4 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-white/5">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}