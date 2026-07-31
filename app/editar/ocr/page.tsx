'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Search, AlertTriangle } from 'lucide-react';
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

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfOcr />

        {/* ══════════════════════════════════════════════
            3 SECCIONES INFORMATIVAS CONSISTENTES
            ══════════════════════════════════════════════ */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">

          {/* ── SECCIÓN 1: CÓMO USAR LA HERRAMIENTA ── */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Search className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo aplicar OCR a un PDF' : '1. How to OCR a PDF'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', textEs: 'Sube tu PDF escaneado (imagen) arrastrándolo a la zona de carga. El OCR funciona con PDFs que contienen imágenes, no texto.', textEn: 'Upload your scanned PDF (image-based) by dragging it to the upload zone. OCR works with PDFs containing images, not text.' },
                { step: '02', textEs: 'Selecciona el idioma del documento (español, inglés, francés, etc.) para que el motor reconozca correctamente los caracteres.', textEn: 'Select the document language (Spanish, English, French, etc.) so the engine correctly recognizes the characters.' },
                { step: '03', textEs: 'Haz clic en "Iniciar OCR" o "Reconocer Texto". El motor analizará cada página y extraerá el texto de las imágenes.', textEn: 'Click "Start OCR" or "Recognize Text". The engine will analyze each page and extract text from images.' },
                { step: '04', textEs: 'Descarga el PDF resultante. Ahora podrás buscar, seleccionar y copiar texto dentro del documento.', textEn: 'Download the resulting PDF. You will now be able to search, select, and copy text within the document.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">Paso {item.step}</span>
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
                <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">✓ {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}</h4>
                {[
                  isEs ? 'Convertir PDFs escaneados en documentos con texto seleccionable y buscable.' : 'Convert scanned PDFs into documents with selectable and searchable text.',
                  isEs ? 'Reconocer texto en más de 100 idiomas diferentes (español, inglés, francés, chino, árabe, etc.).' : 'Recognize text in over 100 different languages (Spanish, English, French, Chinese, Arabic, etc.).',
                  isEs ? 'Procesar documentos de múltiples páginas en una sola operación.' : 'Process multi-page documents in a single operation.',
                  isEs ? 'El texto reconocido se añade como una capa invisible sobre la imagen original sin alterarla visualmente.' : 'Recognized text is added as an invisible layer over the original image without visually altering it.',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">💡 {isEs ? 'CONSEJOS PARA MEJORES RESULTADOS' : 'TIPS FOR BEST RESULTS'}</h4>
                {[
                  isEs ? 'Usa documentos escaneados a 300 DPI o más. A menor resolución, menor precisión de reconocimiento.' : 'Use documents scanned at 300 DPI or higher. Lower resolution means lower recognition accuracy.',
                  isEs ? 'Asegúrate de que el escaneo tenga buena iluminación y contraste. Evita páginas torcidas o borrosas.' : 'Ensure the scan has good lighting and contrast. Avoid skewed or blurry pages.',
                  isEs ? 'Selecciona el idioma correcto antes de iniciar. Mezclar idiomas en un mismo documento puede reducir la precisión.' : 'Select the correct language before starting. Mixing languages in the same document may reduce accuracy.',
                  isEs ? 'Documentos con fuentes estándar (Arial, Times New Roman) y texto impreso tienen más del 95% de precisión.' : 'Documents with standard fonts (Arial, Times New Roman) and printed text have over 95% accuracy.',
                ].map((text, i) => (
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
                <strong className="text-white font-bold text-xs block">
                  🖥️ {isEs ? 'Procesamiento 100% local' : '100% local processing'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'El reconocimiento de texto se ejecuta completamente en tu navegador usando un motor WASM. Tus documentos no se suben a ningún servidor.'
                    : 'Text recognition runs entirely in your browser using a WASM engine. Your documents are never uploaded to any server.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  🔍 {isEs ? 'Imagen original preservada' : 'Original image preserved'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'El texto reconocido se añade como una capa invisible. La imagen escaneada original permanece visualmente intacta.'
                    : 'Recognized text is added as an invisible layer. The original scanned image remains visually intact.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  📥 {isEs ? 'Descarga directa y segura' : 'Direct & secure download'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'El PDF con OCR se genera localmente y se descarga directamente a tu equipo. Ahora podrás buscar y copiar texto del documento.'
                    : 'The OCR-processed PDF is generated locally and downloads directly to your device. You can now search and copy text from the document.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}