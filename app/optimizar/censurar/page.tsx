'use client';

import PdfRedacter from '../../../components/PdfRedacter';
import { useLanguage } from '../../../context/LanguageContext';
import { EyeOff, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function CensurarPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b] font-sans">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10 font-mono">
          <div className="flex items-center gap-3.5">
            <div className="bg-zinc-900 p-3 rounded-2xl border border-white/10">
              <EyeOff className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <Link href="/optimizar" className="hover:text-white transition-colors">
                  {isEs ? '004 / OPTIMIZAR' : '004 / OPTIMIZE'}
                </Link>
                <span>/</span>
                <span className="text-white font-bold">{isEs ? 'CENSURAR PDF' : 'REDACT PDF'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
                {isEs ? '005 / CENSURAR CONTENIDO SENSIBLE' : '005 / REDACT SENSITIVE CONTENT'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-xs text-zinc-300 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>{isEs ? 'Censura Permanente & Segura' : 'Secure & Permanent Redaction'}</span>
          </div>
        </div>

        <PdfRedacter />

        {/* SECCIÓN GUÍA DETALLADA DE USO */}
        <div className="w-full mt-16 pt-12 border-t border-white/10 flex flex-col items-center font-mono">
          <div className="text-center mb-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              {isEs ? "000 / GUÍA DE USO DETALLADA" : "000 / DETAILED USER GUIDE"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-3 font-sans">
              {isEs ? "¿Cómo usar la herramienta Censurar PDF?" : "How to use the Redact PDF tool?"}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
              {isEs 
                ? "Sigue estos 4 sencillos pasos para ocultar, tachar y remover permanentemente datos confidenciales o privados de tus archivos PDF."
                : "Follow these 4 simple steps to permanently blackout and remove private or confidential data from your PDF files."}
            </p>
          </div>

          {/* TARJETAS DE 4 PASOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full mb-12">
            {/* PASO 1 */}
            <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
              <span className="text-xs text-zinc-500 font-bold mb-3 font-mono">001 / PASO 01</span>
              <h4 className="text-sm font-bold text-white mb-2 font-sans">
                {isEs ? "1. Carga tu Archivo PDF" : "1. Upload Your PDF File"}
              </h4>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? "Arrastra tu PDF a la casilla o selecciónalo desde tu dispositivo. También puedes usar el archivo de muestra (0004.pdf) para probar instantáneamente." 
                  : "Drop your PDF into the upload area or select it from your device. You can also use the sample document (0004.pdf)."}
              </p>
            </div>

            {/* PASO 2 */}
            <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
              <span className="text-xs text-zinc-500 font-bold mb-3 font-mono">002 / PASO 02</span>
              <h4 className="text-sm font-bold text-white mb-2 font-sans">
                {isEs ? "2. Selecciona Áreas o Filtros" : "2. Select Areas or Categories"}
              </h4>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? "Usa la herramienta 'Redact' para hacer clic sobre las áreas que deseas cubrir con parches negros, o usa el panel de búsqueda para censurar por categoría." 
                  : "Use the 'Redact' tool to click over areas you want to cover with blackout patches, or use the search panel to censor by category."}
              </p>
            </div>

            {/* PASO 3 */}
            <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
              <span className="text-xs text-zinc-500 font-bold mb-3 font-mono">003 / PASO 03</span>
              <h4 className="text-sm font-bold text-white mb-2 font-sans">
                {isEs ? "3. Revisa los Parches Negros" : "3. Review Blackout Patches"}
              </h4>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? "Verifica la ubicación de los parches negros en el visor principal y en la lista de páginas para asegurarte de cubrir toda la información privada." 
                  : "Verify blackout patch placement on the main viewport and thumbnail pages to ensure all private information is fully covered."}
              </p>
            </div>

            {/* PASO 4 */}
            <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
              <span className="text-xs text-zinc-500 font-bold mb-3 font-mono">004 / PASO 04</span>
              <h4 className="text-sm font-bold text-white mb-2 font-sans">
                {isEs ? "4. Descarga el PDF Censurado" : "4. Download Redacted PDF"}
              </h4>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? "Haz clic en el botón rojo 'Censurar PDF'. Se aplicarán parches negros definitivos sobre el documento y se descargará en tu computadora." 
                  : "Click the red 'Redact PDF' button. Permanent black patches will be drawn over the document and downloaded to your device."}
              </p>
            </div>
          </div>

          {/* TARJETAS DE CARACTERÍSTICAS Y SEGURIDAD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            <div className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <h4 className="text-sm font-bold text-white font-sans">{isEs ? 'Parches Negros Definitivos' : 'Permanent Black Patches'}</h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? 'Los rectángulos de censura se incrustan de forma definitiva sobre los vectores y contenido del PDF, impidiendo su selección o copia.'
                  : 'Redaction rectangles are permanently rendered onto the PDF content, preventing text selection or data copy.'}
              </p>
            </div>

            <div className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h4 className="text-sm font-bold text-white font-sans">{isEs ? 'Categorías Automáticas' : 'Automatic Category Filters'}</h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? 'Filtra y oculta de forma instantánea tarjetas de crédito, números de teléfono, correos electrónicos o palabras clave específicas.'
                  : 'Instantly filter and cover credit card numbers, phone numbers, email addresses, or specific keyword search queries.'}
              </p>
            </div>

            <div className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h4 className="text-sm font-bold text-white font-sans">{isEs ? 'Garantía 100% Local' : '100% Local Guarantee'}</h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? 'Toda la alteración del documento se realiza en tu navegador con pdf-lib. Ninguna información sensible abandona tu equipo.'
                  : 'All PDF modification happens directly in your browser with pdf-lib. No sensitive data ever leaves your local machine.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
