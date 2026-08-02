'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, ShieldAlert, AlertTriangle, ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfWatermark = dynamic(() => import('@/components/PdfWatermark'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para añadir marca de agua a PDF...</p>
    </div>
  )
});

export default function MarcaAguaPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfWatermark />

        {/* ESTRUCTURA INFORMATIVA EN 4 PUNTOS CON ESTILO PDFBLACK */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* SECCIÓN 1: CÓMO USAR LA HERRAMIENTA */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo poner un sello de agua' : '1. How to add a watermark'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  es: 'Sube tu archivo PDF arrastrándolo a la zona de carga. Las miniaturas se cargarán en una cuadrícula 4x4.',
                  en: 'Upload your PDF by dragging it to the upload zone. Thumbnails will load in a 4x4 grid.'
                },
                {
                  step: '02',
                  es: 'Elige el tipo de sello: Texto (escribe tu mensaje como "CONFIDENCIAL") o Imagen (sube un logo PNG).',
                  en: 'Choose the stamp type: Text (write your message like "CONFIDENTIAL") or Image (upload a PNG logo).'
                },
                {
                  step: '03',
                  es: 'Ajusta la posición en la matriz 3x3, opacidad (%), ángulo de rotación, tamaño y color en tiempo real.',
                  en: 'Adjust position in 3x3 matrix, opacity (%), rotation angle, size, and color in real time.'
                },
                {
                  step: '04',
                  es: 'Haz clic en "Poner Sello de Agua →" para procesar con Web Worker y descargar el documento.',
                  en: 'Click "Add Watermark →" to process with Web Worker and download your document.'
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
                  isEs ? 'Añadir sellos de texto como "CONFIDENCIAL", "BORRADOR" o "COPIA".' : 'Add text stamps like "CONFIDENTIAL", "DRAFT", or "COPY".',
                  isEs ? 'Usar tu logotipo corporativo en PNG o JPG como marca de agua.' : 'Use your corporate logo in PNG or JPG as watermark.',
                  isEs ? 'Ajustar la opacidad (10% a 100%) y ángulo de inclinación (-90° a +90°).' : 'Adjust opacity (10% to 100%) and rotation angle (-90° to +90°).',
                  isEs ? 'Estampar en todas las páginas o definir rangos específicos (ej: 1, 3-5).' : 'Stamp across all pages or specific ranges (e.g., 1, 3-5).',
                  isEs ? 'Desbloquear PDFs protegidos con contraseña antes de sellar.' : 'Unlock password-protected PDFs before watermarking.'
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
                  isEs ? 'Usa opacidad entre 20% y 40% para no tapar el contenido del documento.' : 'Use opacity between 20% and 40% so text remains readable.',
                  isEs ? 'Para marcas con imágenes, usa PNGs con fondo transparente.' : 'For image watermarks, use PNGs with transparent background.',
                  isEs ? 'La inclinación a -45° es el estándar corporativo para documentos.' : '-45° tilt is the corporate standard for confidential docs.',
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
                {isEs ? '3. ¿Qué sucede con tu documento al sellarlo?' : '3. What happens to your document when watermarking?'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖥️ {isEs ? 'Procesamiento 100% Local en Web Worker' : '100% Local Web Worker Processing'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'El estampado vectorial de sellos e imágenes se ejecuta en la RAM de tu navegador sin subirse a ningún servidor.' : 'Vector stamp and image processing runs in browser RAM without uploading to servers.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">💧 {isEs ? 'Sello Integrado como Contenido Real' : 'Stamp Embedded as Real Content'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'El sello se incrusta como objeto nativo del PDF, visible en cualquier visor (Adobe, Chrome, Edge).' : 'The watermark is embedded as a native PDF object, visible in any viewer.'}
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
                  q: isEs ? '¿El sello de agua se puede quitar fácilmente del PDF generado?' : 'Can the watermark be easily removed from the generated PDF?',
                  a: isEs 
                    ? 'No. El sello se incrusta vectorialmente en las capas internas del PDF. Sin herramientas avanzadas de edición estructural, el sello no puede ser eliminado por los usuarios finales.'
                    : 'No. The watermark is vectorially embedded into internal PDF layers. Without structural PDF editors, end users cannot remove it.'
                },
                {
                  q: isEs ? '¿Puedo poner sellos diferentes en páginas pares e impares?' : 'Can I place watermarks on specific pages only?',
                  a: isEs
                    ? 'Sí. Puedes seleccionar la opción "Páginas específicas" e indicar rangos exactos como "1, 3-5, 8" para estampar la marca solo en esas hojas.'
                    : 'Yes. You can select "Specific pages" option and type exact ranges like "1, 3-5, 8" to stamp only those sheets.'
                },
                {
                  q: isEs ? '¿Mis documentos o logotipos se envían a algún servidor?' : 'Are my documents or logos sent to any server?',
                  a: isEs
                    ? 'No. Todo el procesamiento se realiza 100% en tu navegador usando Web Workers. Ningún byte sale de tu equipo.'
                    : 'No. All processing happens 100% inside your browser using Web Workers. No bytes leave your machine.'
                },
                {
                  q: isEs ? '¿Puedo poner marcas de agua en un PDF protegido con contraseña?' : 'Can I watermark a password-protected PDF?',
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