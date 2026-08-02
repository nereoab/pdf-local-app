'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Type, AlertTriangle, ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfEditor = dynamic(() => import('@/components/PdfEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando motor de edición de texto PDF...</p>
    </div>
  )
});

export default function EditarTextoPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfEditor />

        {/* ESTRUCTURA INFORMATIVA EN 4 PUNTOS CON ESTILO PDFBLACK */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* SECCIÓN 1: CÓMO USAR LA HERRAMIENTA */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Type className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo usar el Editor de Texto PDF' : '1. How to use the PDF Text Editor'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  es: 'Sube tu archivo PDF arrastrándolo a la zona de carga o haciendo clic en "Seleccionar Archivo PDF".',
                  en: 'Upload your PDF by dragging it to the upload zone or clicking "Select PDF File".'
                },
                {
                  step: '02',
                  es: 'En la barra superior del editor, activa el modo de edición para seleccionar cualquier bloque de texto.',
                  en: 'In the editor toolbar, activate edit mode to select any text block.'
                },
                {
                  step: '03',
                  es: 'Haz clic sobre palabras o párrafos para modificar su contenido, tamaño, color o tipografía.',
                  en: 'Click on words or paragraphs to modify content, size, color, or font.'
                },
                {
                  step: '04',
                  es: 'Haz clic en "Terminar y Grabar →" para compilar con Web Worker y descargar tu PDF editado.',
                  en: 'Click "Finish & Save →" to compile with Web Worker and download your edited PDF.'
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
                  isEs ? 'Editar texto existente en bloques nativos del PDF (texto seleccionable).' : 'Edit existing text in native PDF blocks (selectable text).',
                  isEs ? 'Cambiar contenido de palabras, frases o párrafos completos.' : 'Change content of words, phrases, or full paragraphs.',
                  isEs ? 'Ajustar estilo de texto: negrita, cursiva, tamaño, fuentes y color.' : 'Adjust text style: bold, italic, size, fonts, and color.',
                  isEs ? 'Añadir cuadros de texto, anotaciones, formas y firmas.' : 'Add text boxes, annotations, shapes, and signatures.',
                  isEs ? 'Desbloquear PDFs protegidos con contraseña antes de editar.' : 'Unlock password-protected PDFs before editing.'
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
                  isEs ? 'Si el texto es una imagen escaneada, usa primero la herramienta OCR.' : 'If text is a scanned image, use the OCR tool first.',
                  isEs ? 'Usa las Opciones Avanzadas para cambiar prefijo y metadatos.' : 'Use Advanced Options to change prefix and metadata.',
                  isEs ? 'El archivo original nunca es sobrescrito en tu dispositivo.' : 'Original file is never overwritten on your device.',
                  isEs ? 'Re-numera páginas automáticamente activando la casilla en Opciones.' : 'Re-number pages automatically checking the Options box.'
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
                {isEs ? '3. ¿Qué sucede con tu documento al editarlo?' : '3. What happens to your document when editing?'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖥️ {isEs ? 'Procesamiento 100% Local en Navegador' : '100% Local Browser Processing'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Tu PDF se carga y edita completamente en la RAM de tu equipo sin subirse a ningún servidor externo.' : 'Your PDF loads and edits entirely in your browser RAM without uploading to servers.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">✏️ {isEs ? 'Edición Nativa y Metadatos Web Worker' : 'Native Editing & Web Worker Metadata'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'Las modificaciones se escriben como objetos de contenido estándar en la estructura PDF.' : 'Modifications are written directly as standard content objects in the PDF structure.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🔒 {isEs ? 'Descarga Directa e Integridad' : 'Direct Download & Integrity'}</strong>
                <p className="text-[11px]">
                  {isEs ? 'El archivo original se mantiene intacto. El PDF editado se genera al instante como una nueva versión limpia.' : 'Original file stays intact. Edited PDF is generated instantly as a clean new version.'}
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
                  q: isEs ? '¿Se conserva la tipografía y formato original al editar texto?' : 'Are original fonts and formatting preserved when editing text?',
                  a: isEs 
                    ? 'Sí. El motor de edición Apryse analiza las capas tipográficas embebidas en el PDF para emparejar la fuente, tamaño, color e interlineado del texto original.'
                    : 'Yes. The Apryse editing engine analyzes embedded font layers in the PDF to match original font, size, color, and line spacing.'
                },
                {
                  q: isEs ? '¿Puedo modificar o agregar imágenes y firmas en el editor?' : 'Can I modify or add images and signatures in the editor?',
                  a: isEs
                    ? 'Sí. Además de editar texto, el visor te permite insertar imágenes, formas geométricas, anotaciones de resaltado y firmar documentos.'
                    : 'Yes. Besides editing text, the viewer lets you insert images, geometric shapes, highlight annotations, and sign documents.'
                },
                {
                  q: isEs ? '¿Mis documentos o datos se envían a algún servidor?' : 'Are my documents or data sent to any server?',
                  a: isEs
                    ? 'No. Todo el procesamiento se realiza 100% en tu navegador usando Web Workers. Ningún byte sale de tu equipo.'
                    : 'No. All processing happens 100% inside your browser using Web Workers. No bytes leave your machine.'
                },
                {
                  q: isEs ? '¿Puedo editar un PDF protegido con contraseña?' : 'Can I edit a password-protected PDF?',
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