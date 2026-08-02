'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Sparkles, AlertTriangle, ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfWatermarkRemover = dynamic(() => import('@/components/PdfWatermarkRemover'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para quitar marca de agua de PDF...</p>
    </div>
  )
});

export default function QuitarMarcaAguaPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfWatermarkRemover />

        {/* ESTRUCTURA INFORMATIVA EN 4 PUNTOS CON ESTILO PDFBLACK */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* SECCIÓN 1: CÓMO USAR LA HERRAMIENTA */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo quitar un sello de agua' : '1. How to remove a watermark'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  es: 'Sube tu archivo PDF que contiene marcas de agua. Las miniaturas se cargarán en una cuadrícula 4x4.',
                  en: 'Upload your PDF containing watermarks. Thumbnails will load in a 4x4 grid.'
                },
                {
                  step: '02',
                  es: 'Ingresa las palabras clave a buscar (ej: "CONFIDENCIAL", "BORRADOR") o usa el modo por capas.',
                  en: 'Type target keywords to remove (e.g., "CONFIDENTIAL", "DRAFT") or use layer mode.'
                },
                {
                  step: '03',
                  es: 'Revisa las marcas de borrado en la cuadrícula de miniaturas para confirmar qué páginas se depurarán.',
                  en: 'Review eraser badges on thumbnail cards to confirm pages to be cleaned.'
                },
                {
                  step: '04',
                  es: 'Haz clic en "Quitar Sello de Agua →" para procesar con Web Worker y descargar el PDF limpio.',
                  en: 'Click "Remove Watermark →" to process with Web Worker and download clean PDF.'
                }
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">
                    Paso {item.step}
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {isEs ? item.es : item.en}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: LIMITACIONES Y CONSEJOS ÚTILES */}
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
                {[
                  isEs ? 'Eliminar marcas de agua de texto (como "CONFIDENCIAL" o "BORRADOR") repetidas.' : 'Remove text watermarks (like "CONFIDENTIAL" or "DRAFT") repeated across pages.',
                  isEs ? 'Eliminar sellos de imagen (logos, marcas de propiedad) en diccionarios XObject.' : 'Remove image stamps (logos, ownership seals) in XObject dictionaries.',
                  isEs ? 'Eliminar capas opcionales (OCG) y metadatos /PieceInfo de sellos.' : 'Remove optional content layers (OCG) and /PieceInfo metadata.',
                  isEs ? 'Mantener intactos el texto, imágenes y tablas del documento original.' : 'Keep original document text, images, and tables intact.',
                  isEs ? 'Desbloquear PDFs protegidos con contraseña antes de quitar sellos.' : 'Unlock password-protected PDFs before removing stamps.'
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                  💡 {isEs ? 'CONSEJOS' : 'TIPS'}
                </h4>
                {[
                  isEs ? 'Marcas impresas en papel y escaneadas requieren la herramienta OCR o Censurar.' : 'Paper-printed scanned marks require OCR or Redact tool.',
                  isEs ? 'Separa palabras clave con comas para eliminar sellos complejos.' : 'Separate keywords with commas to remove complex multi-word stamps.',
                  isEs ? 'Guarda una copia de seguridad del PDF original antes de depurar.' : 'Keep a backup of the original PDF before cleaning.',
                  isEs ? 'Estampa metadatos de Título y Autor en las Opciones Avanzadas.' : 'Stamp Title and Author metadata in Advanced Options.'
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: ¿QUÉ SUCEDE CON TU DOCUMENTO? */}
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '3. ¿Qué sucede con tu documento al quitar marcas?' : '3. What happens to your document when removing watermarks?'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖥️ {isEs ? 'Procesamiento 100% Local en Web Worker' : '100% Local Web Worker Processing'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'La inspección de flujos y eliminación de objetos se ejecuta en la RAM de tu navegador sin subirse a ningún servidor.' : 'Stream inspection and object removal runs in browser RAM without uploading to servers.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🧹 {isEs ? 'Eliminación Selectiva y Segura' : 'Selective & Safe Removal'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Solo se vacían los objetos y textos coincidentes con las marcas de agua. El resto del contenido se preserva intacto.' : 'Only matching watermark objects and text streams are emptied. Remaining content is preserved.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🔒 {isEs ? 'Privacidad e Integridad Garantizada' : 'Privacy & Integrity Guaranteed'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Tu archivo original nunca es modificado ni sobrescrito. La descarga genera un nuevo PDF limpio al instante.' : 'Your original file is never modified or overwritten. Download generates a clean new PDF.'}
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: PREGUNTAS FRECUENTES (FAQ) - ACORDEÓN INTERACTIVO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '4. Preguntas frecuentes (FAQ)' : '4. Frequently Asked Questions (FAQ)'}
              </h2>
            </div>

            <div className="space-y-3 font-sans">
              {[
                {
                  q: isEs ? '¿Cómo sabe la herramienta qué texto eliminar como marca de agua?' : 'How does the tool know which text to remove as watermark?',
                  a: isEs 
                    ? 'El algoritmo analiza el árbol de objetos del PDF (capas OCG, recursos XObject y comandos de texto en flujos). Además, puedes escribir palabras clave exactas para eliminar textos específicos.'
                    : 'The algorithm scans the PDF object tree (OCG layers, XObject resources, text stream commands). You can also type exact keywords to target specific texts.'
                },
                {
                  q: isEs ? '¿Se pueden eliminar sellos escaneados en papel?' : 'Can scanned paper stamps be removed?',
                  a: isEs
                    ? 'No automáticamente. Si la marca de agua está fusionada dentro de los píxeles de una imagen escaneada, usa la herramienta "Censurar PDF" o "OCR" para procesar el documento.'
                    : 'Not automatically. If the watermark is merged into pixels of a scanned image, use the "Redact PDF" or "OCR" tool to process.'
                },
                {
                  q: isEs ? '¿Mis documentos se envían a algún servidor?' : 'Are my documents sent to any server?',
                  a: isEs
                    ? 'No. Todo el procesamiento se realiza 100% en tu navegador usando Web Workers. Ningún byte sale de tu equipo.'
                    : 'No. All processing happens 100% inside your browser using Web Workers. No bytes leave your machine.'
                },
                {
                  q: isEs ? '¿Puedo quitar marcas de agua de un PDF protegido con contraseña?' : 'Can I remove watermarks from a password-protected PDF?',
                  a: isEs
                    ? 'Sí. Al cargar un PDF encriptado, aparecerá un widget inline de clave. Ingresa la contraseña de apertura una vez para desbloquear el visor y proceder.'
                    : 'Yes. Upon loading an encrypted PDF, an inline key widget will appear. Enter the open password once to unlock the viewer and proceed.'
                }
              ].map((faq, idx) => (
                <details 
                  key={idx} 
                  className="group bg-zinc-900/60 border border-white/5 rounded-xl transition-all duration-200 overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold text-xs sm:text-sm text-white select-none group-hover:text-zinc-200">
                    <span>{faq.q}</span>
                    <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-300 flex-shrink-0 ml-2" />
                  </summary>
                  <div className="px-4 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3 font-sans">
                    {faq.a}
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