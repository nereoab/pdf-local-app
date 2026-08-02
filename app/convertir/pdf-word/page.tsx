'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, FileText, AlertTriangle, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const WordPdfConverter = dynamic(() => import('@/components/WordPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando conversor PDF ↔ Word...</p>
    </div>
  ),
});

export default function PdfWordPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <WordPdfConverter defaultMode="pdf-to-word" />

        {/* SECCIÓN INFORMATIVA DE 4 PUNTOS (ESTÁNDAR MÓDULO OPTIMIZAR) */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* 1. CÓMO FUNCIONA PASO A PASO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo convertir de PDF a Word' : '1. How to convert PDF to Word'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', es: 'Sube tu archivo PDF a la zona de carga interactiva.', en: 'Upload your PDF file to the interactive upload zone.' },
                { step: '02', es: 'El motor analiza la maquetación, fuentes y tablas del PDF.', en: 'The engine analyzes the layout, fonts, and tables of the PDF.' },
                { step: '03', es: 'Configura el formato de salida (.docx/.rtf) y maquetación.', en: 'Configure output format (.docx/.rtf) and layout settings.' },
                { step: '04', es: 'Haz clic en "Convertir a Word Editable" y descarga tu archivo.', en: 'Click "Convert to Editable Word" and download your file.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">
                    Paso {item.step}
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">{isEs ? item.es : item.en}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. LIMITACIONES Y CONSEJOS ÚTILES */}
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
                  isEs ? 'Extraer párrafos continuos editables en Microsoft Word y LibreOffice.' : 'Extract continuous editable paragraphs in Microsoft Word and LibreOffice.',
                  isEs ? 'Preservar tablas con celdas estructuradas y alineación de columnas.' : 'Preserve tables with structured cells and column alignment.',
                  isEs ? 'Extraer e incluir imágenes embebidas en el documento final.' : 'Extract & include embedded images into the output document.',
                  isEs ? 'Exportar como estándar OpenXML (.docx) o Rich Text (.rtf).' : 'Export as standard OpenXML (.docx) or Rich Text (.rtf).',
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
                  isEs ? 'Para documentos escaneados sin texto digital, aplica OCR previamente.' : 'For scanned documents without digital text, run OCR first.',
                  isEs ? 'Selecciona "Texto Fluido" para editar cómodamente el contenido de lectura.' : 'Select "Flowing Text" to comfortably edit reading content.',
                  isEs ? 'El procesamiento se realiza en la memoria RAM de forma 100% confidencial.' : 'Processing runs in RAM memory 100% confidentially.',
                  isEs ? 'Conserva el archivo PDF original sin modificar ningún byte.' : 'Preserves the original PDF file without altering any byte.',
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. PRIVACIDAD Y SEGURIDAD */}
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '3. ¿Qué sucede con tu documento al convertirlo?' : '3. What happens to your document when converting it?'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖥️ {isEs ? 'Procesamiento 100% local' : '100% local processing'}</strong>
                <p className="text-[11px]">{isEs ? 'La conversión se ejecuta en la RAM. Ningún dato o archivo se envía a servidores externos.' : 'Conversion runs in RAM. No data or file is uploaded to external servers.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📄 {isEs ? 'Estructura OpenXML nativa' : 'Native OpenXML structure'}</strong>
                <p className="text-[11px]">{isEs ? 'Genera un empaquetado XML limpio compatible con todas las versiones de Office.' : 'Generates a clean XML package compatible with all Office versions.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📥 {isEs ? 'Descarga inmediata y privada' : 'Immediate & private download'}</strong>
                <p className="text-[11px]">{isEs ? 'El archivo Word resultante está listo al instante sin registros ni marcas de agua forzadas.' : 'The resulting Word file is ready instantly with no sign-ups or forced watermarks.'}</p>
              </div>
            </div>
          </div>

          {/* 4. PREGUNTAS FRECUENTES */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '4. Preguntas Frecuentes' : '4. Frequently Asked Questions'}
              </h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  qEs: '¿El documento de Word resultante es totalmente editable?',
                  qEn: 'Is the resulting Word document fully editable?',
                  aEs: 'Sí, puedes modificar textos, agregar o eliminar párrafos, cambiar fuentes, ajustar tablas y editar imágenes directamente en Microsoft Word, Google Docs o LibreOffice.',
                  aEn: 'Yes, you can modify text, add or delete paragraphs, change fonts, adjust tables, and edit images directly in Microsoft Word, Google Docs, or LibreOffice.',
                },
                {
                  qEs: '¿Es seguro convertir archivos con información confidencial?',
                  qEn: 'Is it safe to convert files with confidential information?',
                  aEs: 'Totalmente. La conversión se procesa íntegramente en la memoria de tu dispositivo mediante un motor JSZip y PDF.js local, garantizando privacidad absoluta.',
                  aEn: 'Totally. Conversion processes entirely in your device memory via local JSZip and PDF.js engines, guaranteeing absolute privacy.',
                },
              ].map((faq, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 space-y-1.5">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="text-blue-400 font-mono">Q:</span> {isEs ? faq.qEs : faq.qEn}
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed pl-5">
                    {isEs ? faq.aEs : faq.aEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
