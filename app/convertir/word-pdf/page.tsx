'use client';

import WordPdfConverter from '../../../components/WordPdfConverter';
import { useLanguage } from '../../../context/LanguageContext';
import { FileText, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function WordToPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-16 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        
        {/* ENCABEZADO DE NAVEGACIÓN Y TÍTULO */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="bg-zinc-900 p-3 rounded-2xl border border-white/10">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono">
              <Link href="/convertir" className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                {isEs ? 'Convertir PDF' : 'Convert PDF'}
              </Link>
              <span className="text-zinc-600 text-xs">/</span>
              <span className="text-white text-xs font-bold">{isEs ? 'Word a PDF / PDF a Word (2 en 1)' : 'Word to PDF / PDF to Word (2 in 1)'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {isEs ? 'CONVERTIR WORD Y PDF (CONVERSOR DUAL 2 EN 1)' : 'CONVERT WORD & PDF (2-IN-1 DUAL CONVERTER)'}
            </h1>
          </div>
        </div>

        {/* HERRAMIENTA INTERACTIVA 2 EN 1 */}
        <div className="mb-12">
          <WordPdfConverter defaultMode="word-to-pdf" />
        </div>

        {/* SECCIÓN INFORMATIVA DE 4 PUNTOS (ESTÁNDAR MÓDULO OPTIMIZAR) */}
        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          
          {/* 1. CÓMO FUNCIONA PASO A PASO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEs ? '1. Cómo convertir de Word a PDF' : '1. How to convert Word to PDF'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', es: 'Sube tu documento Microsoft Word (.docx/.doc) a la zona de carga.', en: 'Upload your Microsoft Word document (.docx/.doc) to the upload zone.' },
                { step: '02', es: 'El motor analiza el contenido OpenXML, párrafos y estructura.', en: 'The engine analyzes OpenXML content, paragraphs, and structure.' },
                { step: '03', es: 'Configura las Opciones Avanzadas (orientación, tamaño de papel, marca de agua).', en: 'Configure Advanced Options (orientation, paper size, watermark).' },
                { step: '04', es: 'Haz clic en "Convertir a PDF Corporativo" y descarga tu archivo.', en: 'Click "Convert to Corporate PDF" and download your file.' },
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
                  isEs ? 'Generar PDFs vectoriales de alta resolución para impresión corporativa.' : 'Generate high-resolution vector PDFs for corporate printing.',
                  isEs ? 'Ajustar la orientación entre Vertical u Horizontal libremente.' : 'Adjust page orientation between Portrait or Landscape freely.',
                  isEs ? 'Seleccionar el tamaño de hoja exacto (A4, Carta o Oficio/Legal).' : 'Select exact paper size (A4, Letter, or Legal).',
                  isEs ? 'Incrustar marcas de agua como CONFIDENCIAL o BORRADOR.' : 'Embed watermarks like CONFIDENTIAL or DRAFT.',
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
                  isEs ? 'Revisa la vista previa de miniaturas en 3x4 antes de descargar.' : 'Review the 3x4 thumbnail preview before downloading.',
                  isEs ? 'Asegúrate de que tu documento Word use fuentes estándar (Helvetica, Times).' : 'Ensure your Word document uses standard fonts (Helvetica, Times).',
                  isEs ? 'El documento resultante mantendrá la paginación de forma consistente.' : 'The resulting document will maintain consistent pagination.',
                  isEs ? 'Todo el procesamiento es 100% privado y se ejecuta en memoria.' : 'All processing is 100% private and runs in memory.',
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
                <p className="text-[11px]">{isEs ? 'La conversión se procesa localmente en la memoria de tu navegador sin subir archivos.' : 'Conversion is processed locally in your browser memory without uploading files.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🔒 {isEs ? 'Inmutabilidad vectorial' : 'Vectorial immutability'}</strong>
                <p className="text-[11px]">{isEs ? 'El PDF resultante congela el diseño para evitar modificaciones no autorizadas.' : 'The resulting PDF freezes layout to prevent unauthorized modifications.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📥 {isEs ? 'Descarga directa e instantánea' : 'Direct & instant download'}</strong>
                <p className="text-[11px]">{isEs ? 'Obtienes el PDF convertido al instante sin colas de espera ni restricciones.' : 'You get the converted PDF instantly with no queues or restrictions.'}</p>
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
                  qEs: '¿El documento PDF generado es imprimible y compatible?',
                  qEn: 'Is the generated PDF document printable and compatible?',
                  aEs: 'Sí, el PDF cumple con el estándar ISO-19005 (PDF/A) y es completamente compatible con cualquier visor como Adobe Acrobat, navegadores web e impresoras.',
                  aEn: 'Yes, the PDF complies with ISO-19005 (PDF/A) standard and is fully compatible with any viewer like Adobe Acrobat, web browsers, and printers.',
                },
                {
                  qEs: '¿Mis archivos Word o información interna quedan guardados?',
                  qEn: 'Are my Word files or internal information saved?',
                  aEs: 'No. Todo el procesamiento se realiza en la memoria RAM y se borra inmediatamente al cerrar la página.',
                  aEn: 'No. All processing occurs in RAM memory and is cleared immediately upon closing the page.',
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
    </div>
  );
}
