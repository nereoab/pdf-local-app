'use client';

import WordPdfConverter from '../../../components/WordPdfConverter';
import { useLanguage } from '../../../context/LanguageContext';
import { FileText, ShieldCheck, RefreshCw, Lock, Sparkles } from 'lucide-react';
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
        <div className="mb-16">
          <WordPdfConverter defaultMode="word-to-pdf" />
        </div>

        {/* SECCIÓN INFORMATIVA DETALLADA */}
        <div className="space-y-12 text-zinc-300 font-sans border-t border-white/10 pt-12">
          
          {/* BLOQUE 1: PRIVACIDAD Y QUÉ SUCEDE CON SUS ARCHIVOS */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? '¿Qué sucede exactamente con tu archivo al convertirlo entre Word y PDF?' : 'What exactly happens to your file when converting between Word and PDF?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 CONVERSIÓN DE ALTA PRECISIÓN • 100% PROCESAMIENTO LOCAL' : '🔒 HIGH PRECISION CONVERSION • 100% LOCAL PROCESSING'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? '1. Conversión de Word (.docx) a PDF' : '1. Word (.docx) to PDF Conversion'}
                </strong>
                <p>
                  {isEs 
                    ? 'El motor analiza las etiquetas OpenXML del archivo Word (párrafos, tipografías, sangrías y tablas) y las recompila en un documento PDF vectorial limpio. Todo el diseño y formato visual se fija de forma profesional garantizando que se vea idéntico en cualquier dispositivo.'
                    : 'The engine parses OpenXML tags from the Word file (paragraphs, fonts, indents, and tables) recompiling them into a clean vector PDF. Visual layout freezes professionally to look identical across all screens.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  {isEs ? '2. Conversión de PDF a Word (.docx)' : '2. PDF to Word (.docx) Conversion'}
                </strong>
                <p>
                  {isEs 
                    ? 'Extrae las coordenadas tridimensionales de texto e imágenes del PDF, reconstruyendo párrafos continuos y celdas de tablas editables en Microsoft Word o Google Docs sin distorsionar el documento original.'
                    : 'Extracts 3D text and image coordinates from the PDF, rebuilding continuous paragraphs and editable table cells in Microsoft Word or Google Docs without distorting layout.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: GUÍA DE USO PASO A PASO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Aprende a usar la herramienta en 3 sencillos pasos' : 'Learn how to use the tool in 3 simple steps'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Guía rápida de conversión de documentos' : 'Quick document conversion guide'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 font-mono text-xs">
              
              {/* PASO 1 */}
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">01 / SELECCIÓN</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '1. Elige el Modo o Arrastra' : '1. Choose Mode or Drop File'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs 
                      ? 'Selecciona el modo (Word a PDF o PDF a Word) arriba, o simplemente suelta tu archivo en la zona de carga; el sistema detectará el formato automáticamente.' 
                      : 'Select mode above or drop your file in the box; the system auto-detects format.'}
                  </p>
                </div>
              </div>

              {/* PASO 2 */}
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">02 / PROCESAMIENTO</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '2. Clic en Convertir' : '2. Click Convert'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs 
                      ? 'Haz clic en el botón principal. Nuestro motor decodificará las fuentes y maquetación en tiempo real dentro de la memoria RAM de tu navegador.' 
                      : 'Click the action button. Our engine decodes fonts and layout in real-time inside your browser RAM.'}
                  </p>
                </div>
              </div>

              {/* PASO 3 */}
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">03 / DESCARGA</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '3. Descarga tu Resultado' : '3. Download Result'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs 
                      ? 'Obtén inmediatamente tu PDF convertido o tu archivo de Word editable listo para usar de forma 100% privada.' 
                      : 'Get your converted PDF or editable Word document immediately, 100% private and ready to use.'}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

