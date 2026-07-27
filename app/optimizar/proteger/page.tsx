'use client';

import PdfProtector from '../../../components/PdfProtector';
import { useLanguage } from '../../../context/LanguageContext';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ProtegerPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b] font-sans">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10 font-mono">
          <div className="flex items-center gap-3.5">
            <div className="bg-zinc-900 p-3 rounded-2xl border border-white/10">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <Link href="/optimizar" className="hover:text-white transition-colors">
                  {isEs ? '004 / OPTIMIZAR' : '004 / OPTIMIZE'}
                </Link>
                <span>/</span>
                <span className="text-white font-bold">{isEs ? 'PROTEGER PDF' : 'PROTECT PDF'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
                {isEs ? '004 / PROTEGER ARCHIVO PDF' : '004 / PROTECT PDF FILE'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-xs text-zinc-300 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>{isEs ? 'Cifrado AES 256-bit & Permisos' : '256-bit AES Encryption & Permissions'}</span>
          </div>
        </div>

        <PdfProtector />

        {/* SECCIÓN GUÍA DETALLADA DE USO */}
        <div className="w-full mt-16 pt-12 border-t border-white/10 flex flex-col items-center font-mono">
          <div className="text-center mb-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              {isEs ? "000 / GUÍA DE USO DETALLADA" : "000 / DETAILED USER GUIDE"}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-3 font-sans">
              {isEs ? "¿Cómo proteger un archivo PDF con contraseña?" : "How to protect a PDF with a password?"}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
              {isEs 
                ? "Sigue estos 4 sencillos pasos para asegurar la apertura, restringir la impresión o copia y rasterizar el contenido de tus documentos."
                : "Follow these 4 simple steps to secure document opening, restrict printing or copying, and rasterize content."}
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
                  ? "Selecciona el archivo PDF que deseas proteger desde tu computadora o arrástralo a la casilla de subida." 
                  : "Select the PDF file you wish to protect from your computer or drag it into the upload box."}
              </p>
            </div>

            {/* PASO 2 */}
            <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
              <span className="text-xs text-zinc-500 font-bold mb-3 font-mono">002 / PASO 02</span>
              <h4 className="text-sm font-bold text-white mb-2 font-sans">
                {isEs ? "2. Contraseña de Apertura" : "2. Set Open Password"}
              </h4>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? "Ingresa y confirma la contraseña requerida para abrir y visualizar el documento en cualquier visor PDF." 
                  : "Enter and confirm the password required to open and view the document on any PDF viewer."}
              </p>
            </div>

            {/* PASO 3 */}
            <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
              <span className="text-xs text-zinc-500 font-bold mb-3 font-mono">003 / PASO 03</span>
              <h4 className="text-sm font-bold text-white mb-2 font-sans">
                {isEs ? "3. Restringir Permisos" : "3. Restrict Permissions"}
              </h4>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? "Establece restricciones para evitar la impresión, la copia de texto o la edición, protegiéndolas con una clave de permisos." 
                  : "Set restrictions to prevent printing, text copying, or editing, securing them with a permissions password."}
              </p>
            </div>

            {/* PASO 4 */}
            <div className="flex flex-col items-start p-6 bg-[#09090b] border border-white/10 rounded-2xl hover:border-white/30 transition-all group">
              <span className="text-xs text-zinc-500 font-bold mb-3 font-mono">004 / PASO 04</span>
              <h4 className="text-sm font-bold text-white mb-2 font-sans">
                {isEs ? "4. Rasterizar e Iniciar" : "4. Rasterize & Protect"}
              </h4>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? "Activa la opción de rasterizado si deseas aplanar todo el documento en una sola capa no editable y haz clic en 'INICIAR →'." 
                  : "Enable rasterization if you want to flatten the document into a non-editable single layer and click 'INICIAR →'."}
              </p>
            </div>
          </div>

          {/* TARJETAS DE CARACTERÍSTICAS Y SEGURIDAD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            <div className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h4 className="text-sm font-bold text-white font-sans">{isEs ? 'Cifrado AES de 256 Bits' : '256-bit AES Encryption'}</h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? 'Aplica cifrado estándar militar de alta seguridad para prevenir aperturas no autorizadas del archivo.'
                  : 'Applies military-grade high security standard encryption to prevent unauthorized document opening.'}
              </p>
            </div>

            <div className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h4 className="text-sm font-bold text-white font-sans">{isEs ? 'Control de Permisos Fino' : 'Granular Permission Control'}</h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? 'Limita independientemente las acciones de impresión, copia de texto o modificación del documento.'
                  : 'Independently restrict printing, text copying, or document modification actions.'}
              </p>
            </div>

            <div className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <h4 className="text-sm font-bold text-white font-sans">{isEs ? 'Protección por Rasterizado' : 'Rasterization Protection'}</h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {isEs 
                  ? 'Combina el contenido en una capa no seleccionable para evitar que se puedan revelar datos ocultos mediante extracción.'
                  : 'Flattens content into a non-selectable layer to prevent hidden data recovery via extraction.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
