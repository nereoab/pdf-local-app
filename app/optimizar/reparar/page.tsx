'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, Eye, Wrench, CheckCircle2, Lock, Sparkles, FileCheck, Layers } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfRepairer = dynamic(() => import('@/components/PdfRepairer'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para reparar archivos PDF...</p>
    </div>
  ),
});

export default function RepararPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfRepairer />

        {/* SECCIÓN INFORMATIVA DETALLADA */}
        <div className="space-y-12 text-zinc-300 font-sans border-t border-white/10 pt-12 mt-12">
          
          {/* BLOQUE 1: PRIVACIDAD Y QUÉ SUCEDE CON SUS ARCHIVOS */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? '¿Qué sucede exactamente con tus archivos al repararlos?' : 'What exactly happens to your files when repaired?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • 100% PROCESAMIENTO LOCAL' : '🔒 ABSOLUTE PRIVACY • 100% LOCAL PROCESSING'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Tus documentos nunca salen de tu dispositivo' : 'Your documents never leave your device'}
                </strong>
                <p>
                  {isEs 
                    ? 'A diferencia de otros servicios en línea, tus archivos PDF dañados NUNCA se cargan a ningún servidor ni almacenamiento en la nube. Todo el diagnóstico, lectura binaria y reconstrucción se ejecuta en tiempo real dentro de la memoria RAM de tu propio navegador web.'
                    : 'Unlike other online converters, your damaged PDF files are NEVER uploaded to external cloud servers. All diagnosis, binary reading, and rebuilding run inside your local browser RAM.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Destrucción inmediata de memoria' : 'Immediate memory purge'}
                </strong>
                <p>
                  {isEs 
                    ? 'Una vez finalizada la reparación y descargado el archivo restituido, no queda ningún rastro. Al cerrar la pestaña o refrescar la página, el navegador purga por completo el espacio en memoria, garantizando confidencialidad absoluta en documentos legales, contables o personales.'
                    : 'Once repair completes and you download the file, no traces remain. Closing the tab purges memory completely, ensuring total privacy for legal, financial, or personal records.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: PROCEDIMIENTO TÉCNICO DE REPARACIÓN PASO A PASO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El procedimiento técnico de reparación paso a paso' : 'Step-by-step technical repair procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo nuestro motor analiza y restaura la estructura binaria de tu PDF' : 'How our engine analyzes and restores the binary structure of your PDF'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">01 / DIAGNÓSTICO</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '1. Escaneo de Cabecera Binaria' : '1. Binary Header Scan'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs 
                      ? 'Analizamos el binario buscando la firma oficial %PDF-. Eliminamos bytes nulos o basura introducida durante descargas interrumpidas.' 
                      : 'Scans the binary file searching for the official %PDF- signature, removing corrupted leading bytes.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">02 / RE-INDEXADO</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '2. Reconstrucción de Tabla XRef' : '2. XRef Table Rebuild'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs 
                      ? 'Reconstruimos el mapa de referencias cruzadas que conecta páginas, fuentes y gráficos, corrigiendo punteros desalineados o desincronizados.' 
                      : 'Rebuilds the cross-reference map connecting pages, fonts, and graphics to fix misaligned pointers.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">03 / SANITIZACIÓN</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '3. Sanitización de Objetos' : '3. Object Sanitization'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs 
                      ? 'Depuramos elementos huérfanos, diccionarios malformados o metadatos corruptos que causan bloqueos al abrir el archivo en Adobe o Chrome.' 
                      : 'Purges orphaned elements, malformed dictionaries, or corrupt metadata causing reader crashes.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">04 / EMPAQUETADO</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '4. Re-ensamblado PDF 1.7' : '4. PDF 1.7 Repackaging'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs 
                      ? 'Generamos un nuevo documento estándar optimizado con corrientes de objetos comprimidas y diccionario trailer 100% válido.' 
                      : 'Generates a clean, optimized standard document with object streams and valid trailer dictionary.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BLOQUE 3: EL MOTOR DE RENDERIZADO TOLERANTE A FALLOS */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El Motor de Renderizado: ¿Cómo rescata páginas muy dañadas?' : 'The Rendering Engine: How does it rescue severely damaged pages?'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Tecnología de rescate visual mediante Mozilla pdfjs-dist y Canvas 2D' : 'Visual rescue tech via Mozilla pdfjs-dist and Canvas 2D'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'Procesamiento de Bajo Nivel' : 'Low-Level Processing'}
                </strong>
                <p>
                  {isEs 
                    ? 'Cuando el código vectorial de una página está irreparablemente fragmentado, nuestro sistema activa el Motor de Renderizado Profundo. Este interpreta los datos gráficos primarios ignorando errores sintácticos de nivel superior.'
                    : 'When a page vector code is severely fragmented, our system triggers the Deep Rendering Engine, interpreting raw graphics data while ignoring top-level syntax errors.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Reconstrucción en Canvas High-DPI' : 'High-DPI Canvas Reconstruction'}
                </strong>
                <p>
                  {isEs 
                    ? 'Cada página rescatada se proyecta sobre un lienzo digital de alta definición (Canvas 2.0x). Esto garantiza que textos, esquemas, firmas e imágenes se mantengan totalmente nítidos y legibles.'
                    : 'Rescued pages are drawn on a high-definition digital canvas (2.0x DPI scale), ensuring text, blueprints, signatures, and images remain sharp.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-white" />
                  {isEs ? 'Generación de Nuevo Documento' : 'New Document Generation'}
                </strong>
                <p>
                  {isEs 
                    ? 'Las capas visuales reconstruidas se integran dentro de una nueva estructura PDF 1.7 sin defectos, permitiéndote abrir, imprimir o enviar el archivo reparado sin que ningún visor vuelva a marcar error.'
                    : 'Reconstructed visual layers are compiled into a brand new defect-free PDF 1.7 file, allowing you to open, print, or email it smoothly.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 4: PROCESO DE MEJORA Y OPTIMIZACIÓN DEL PDF FINAL */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Proceso de mejora y optimización del PDF resultante' : 'Improvement and optimization process of the resulting PDF'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Beneficios y mejoras aplicadas al archivo restituido' : 'Benefits and enhancements applied to the restored document'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Máxima Compatibilidad' : 'Max Compatibility'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Funciona en Adobe Acrobat, Foxit, Chrome, Edge, iOS y Android.' : 'Works across Adobe Acrobat, Foxit, Chrome, Edge, iOS, and Android.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Apertura Ultrarrápida' : 'Ultra-Fast Loading'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Optimiza la velocidad de carga linealizando el árbol de páginas.' : 'Optimizes reading load speed by linearizing page trees.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Limpieza de Código' : 'Clean Code Standard'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Elimina scripts corruptos y streams binarios defectuosos.' : 'Purges corrupt scripts and defective binary streams.'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
