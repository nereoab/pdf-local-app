'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Type, AlertTriangle, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfEditor = dynamic(() => import('@/components/PdfEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando motor de edición de texto PDF...</p>
    </div>
  ),
});

export default function EditarTextoPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfEditor />

        {/* ══════════════════════════════════════════════
            3 SECCIONES INFORMATIVAS CONSISTENTES
            ══════════════════════════════════════════════ */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">

          {/* ── SECCIÓN 1: CÓMO USAR LA HERRAMIENTA ── */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Type className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo usar el Editor de Texto' : '1. How to use the Text Editor'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', textEs: 'Sube tu archivo PDF arrastrándolo a la zona de carga o haciendo clic en "Seleccionar Archivo PDF".', textEn: 'Upload your PDF by dragging it to the upload zone or clicking "Select PDF File".' },
                { step: '02', textEs: 'En la barra superior del editor, pulsa el botón "Editar texto" (ícono T) para activar el modo de edición de contenido.', textEn: 'In the editor top toolbar, click the "Edit Text" button (T icon) to activate content editing mode.' },
                { step: '03', textEs: 'Haz clic sobre cualquier bloque de texto para seleccionarlo. Aparecerá un cuadro de edición donde puedes escribir tu nuevo contenido.', textEn: 'Click on any text block to select it. An edit box will appear where you can type your new content.' },
                { step: '04', textEs: 'Cuando termines, haz clic en "Terminar y Grabar →" para guardar los cambios y descargar el PDF editado.', textEn: 'When done, click "Finish & Save →" to save changes and download the edited PDF.' },
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
                  isEs ? 'Editar texto existente en bloques nativos del PDF (texto seleccionable).' : 'Edit existing text in native PDF blocks (selectable text).',
                  isEs ? 'Cambiar contenido de palabras, frases o párrafos completos.' : 'Change the content of words, phrases, or entire paragraphs.',
                  isEs ? 'Ajustar el estilo del texto: negrita, cursiva, tamaño y color.' : 'Adjust text style: bold, italic, size, and color.',
                  isEs ? 'Añadir cuadros de texto, anotaciones, formas y firmas.' : 'Add text boxes, annotations, shapes, and signatures.',
                  isEs ? 'Insertar nuevas imágenes y eliminar imágenes existentes.' : 'Insert new images and delete existing images.',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">💡 {isEs ? 'CONSEJOS' : 'TIPS'}</h4>
                {[
                  isEs ? 'Si el texto está dentro de una imagen escaneada, primero usa la herramienta OCR para hacerlo reconocible.' : 'If text is inside a scanned image, use the OCR tool first to make it recognizable.',
                  isEs ? 'Para PDFs protegidos con contraseña de edición, usa primero la herramienta "Desbloquear PDF".' : 'For PDFs protected with an edit password, first use the "Unlock PDF" tool.',
                  isEs ? 'El layout y los márgenes del documento original no se pueden modificar con esta herramienta.' : 'The original document layout and margins cannot be modified with this tool.',
                  isEs ? 'Guarda tu trabajo frecuentemente si estás haciendo muchas ediciones.' : 'Save your work frequently if you are making many edits.',
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
                {isEs ? '3. ¿Qué sucede con tu documento al editarlo?' : '3. What happens to your document when you edit it?'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  🖥️ {isEs ? 'Procesamiento 100% local' : '100% local processing'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'Tu PDF se carga y edita completamente en la memoria RAM de tu navegador. No se envía ningún dato a servidores externos.'
                    : 'Your PDF loads and edits entirely in your browser RAM. No data is sent to external servers.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  ✏️ {isEs ? 'Edición nativa del PDF' : 'Native PDF editing'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'Las modificaciones se escriben directamente como objetos de contenido estándar en el archivo PDF, preservando fuentes y formato original.'
                    : 'Modifications are written directly as standard content objects in the PDF file, preserving fonts and original formatting.'}
                </p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">
                  📥 {isEs ? 'Descarga directa y segura' : 'Direct & secure download'}
                </strong>
                <p className="text-[11px]">
                  {isEs
                    ? 'El PDF editado se genera como un archivo local en tu navegador y se descarga directamente a tu equipo sin intermediarios.'
                    : 'The edited PDF is generated as a local file in your browser and downloads directly to your device with no intermediaries.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}