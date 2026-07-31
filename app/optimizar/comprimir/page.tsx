'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, Zap, CheckCircle2, Lock, Sparkles, Layers, Sliders } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfCompressor = dynamic(() => import('@/components/PdfCompressor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para comprimir archivos PDF...</p>
    </div>
  ),
});

export default function ComprimirPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfCompressor />

        {/* SECCIÓN INFORMATIVA DETALLADA */}
        <div className="space-y-12 text-zinc-300 font-sans border-t border-white/10 pt-12 mt-12">

          {/* BLOQUE 1: PRIVACIDAD */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? '¿Qué sucede con tu PDF al comprimirlo para reducir su tamaño?' : 'What happens to your PDF when compressing it to reduce its size?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • COMPRESIÓN LOCAL EN CANVAS • 100% SIN SERVIDOR' : '🔒 ABSOLUTE PRIVACY • LOCAL CANVAS COMPRESSION • 100% SERVER-FREE'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Tu documento nunca sale de tu dispositivo' : 'Your document never leaves your device'}
                </strong>
                <p>
                  {isEs
                    ? 'La compresión del PDF se ejecuta completamente en la memoria RAM de tu navegador. Tus documentos confidenciales — facturas, contratos, estados de cuenta, expedientes médicos — se comprimen localmente sin ser transmitidos a ningún servidor externo. Todo el procesamiento es privado, seguro e instantáneo en tu equipo.'
                    : 'PDF compression runs entirely in your browser RAM. Your confidential documents — invoices, contracts, bank statements, medical records — are compressed locally without being transmitted to any external server. All processing is private, secure, and instant on your machine.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Reducción de hasta un 90% mediante recompresión JPEG y limpieza binaria' : 'Up to 90% reduction via JPEG recompression and binary cleanup'}
                </strong>
                <p>
                  {isEs
                    ? 'El compresor actúa sobre las fuentes de peso principales del PDF: re-codifica imágenes JPEG incrustadas a calidades ajustables (40-95%), elimina metadatos redundantes, limpia streams de objetos no referenciados y aplica compresión deflate a los streams de contenido de página.'
                    : 'The compressor acts on the main PDF weight sources: re-encodes embedded JPEG images at adjustable quality (40-95%), removes redundant metadata, cleans unreferenced object streams, and applies deflate compression to page content streams.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: PROCEDIMIENTO TÉCNICO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El procedimiento técnico de compresión de PDF paso a paso' : 'Step-by-step technical PDF compression procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo el motor identifica y recomprime los recursos de mayor peso del documento' : 'How the engine identifies and recompresses the heaviest document resources'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { step: '01 / DIAGNÓSTICO', title: isEs ? '1. Análisis de Recursos' : '1. Resource Analysis', desc: isEs ? 'pdf-lib deserializa el PDF e identifica los objetos de mayor tamaño: streams de imágenes JPEG/PNG incrustadas, fuentes embebidas no usadas, metadatos XMP, streams de datos no comprimidos y objetos huérfanos.' : 'pdf-lib deserializes the PDF and identifies the largest objects: embedded JPEG/PNG image streams, unused embedded fonts, XMP metadata, uncompressed data streams, and orphaned objects.' },
                { step: '02 / RECOMPRESIÓN', title: isEs ? '2. Re-codificación JPEG vía Canvas' : '2. JPEG Re-encoding via Canvas', desc: isEs ? 'Cada imagen JPEG incrustada se renderiza en un Canvas 2D y se re-exporta con la calidad JPEG seleccionada por el usuario (40-95%). Esta operación, ejecutada en tu CPU local, es la que genera la mayor reducción de tamaño.' : 'Each embedded JPEG image is rendered in a 2D Canvas and re-exported with the user-selected JPEG quality (40-95%). This operation, executed on your local CPU, generates the largest size reduction.' },
                { step: '03 / LIMPIEZA', title: isEs ? '3. Purga de Metadatos y Objetos' : '3. Metadata & Object Purge', desc: isEs ? 'Se eliminan metadatos XMP redundantes, comentarios de aplicación, campos de formulario vacíos, objetos no referenciados, fuentes embebidas no usadas y streams de datos duplicados que aumentan el tamaño sin aportar contenido visible.' : 'Redundant XMP metadata, application comments, empty form fields, unreferenced objects, unused embedded fonts, and duplicate data streams are removed — increasing size without contributing visible content.' },
                { step: '04 / EXPORTACIÓN', title: isEs ? '4. PDF Comprimido Descargable' : '4. Compressed PDF Download', desc: isEs ? 'Se serializa un nuevo PDF 1.7 optimizado con todos los streams recomprimidos y el catálogo limpiado. El motor reporta la reducción porcentual final antes de ofrecer la descarga.' : 'A new optimized PDF 1.7 is serialized with all recompressed streams and cleaned catalog. The engine reports the final percentage reduction before offering the download.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">{item.step}</span>
                    <h3 className="font-bold text-white text-sm mb-2 font-sans">{item.title}</h3>
                    <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BLOQUE 3: NIVELES DE COMPRESIÓN */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Sliders className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Niveles de compresión y balance calidad vs. tamaño' : 'Compression levels and quality vs. size balance'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Elige el nivel de compresión según el uso final del documento' : 'Choose the compression level based on the final document use'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'Compresión Baja (JPEG 85-95%)' : 'Low Compression (JPEG 85-95%)'}
                </strong>
                <p>
                  {isEs
                    ? 'Calidad máxima con reducción moderada de tamaño (10-40%). Ideal para documentos con imágenes de alta calidad que serán impresos a gran formato — planos arquitectónicos, catálogos de productos o presentaciones con fotografías profesionales. El texto y los gráficos vectoriales se mantienen perfectos.'
                    : 'Maximum quality with moderate size reduction (10-40%). Ideal for high-quality image documents that will be printed at large format — architectural blueprints, product catalogs, or presentations with professional photos. Text and vector graphics remain perfect.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Zap className="w-4 h-4 text-white" />
                  {isEs ? 'Compresión Media (JPEG 60-84%)' : 'Medium Compression (JPEG 60-84%)'}
                </strong>
                <p>
                  {isEs
                    ? 'Balance óptimo entre calidad y reducción de tamaño (40-70%). Perfecto para documentos de uso general destinados a compartir por email, sistemas de gestión documental o archivado digital donde la legibilidad es importante pero el tamaño limita el envío o almacenamiento.'
                    : 'Optimal balance between quality and size reduction (40-70%). Perfect for general-use documents intended for email sharing, document management systems, or digital archiving where readability is important but size limits sending or storage.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Compresión Alta (JPEG 40-59%)' : 'High Compression (JPEG 40-59%)'}
                </strong>
                <p>
                  {isEs
                    ? 'Máxima reducción de tamaño posible (60-90%). Adecuada para documentos de texto con imágenes que serán visualizados en pantalla o enviados por plataformas con límites estrictos de tamaño de archivo — formularios digitalizados, facturas simples o documentos de texto con imágenes de referencia.'
                    : 'Maximum possible size reduction (60-90%). Suitable for text documents with images that will be viewed on screen or sent via platforms with strict file size limits — digitized forms, simple invoices, or text documents with reference images.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 4: BENEFICIOS */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Beneficios del PDF comprimido resultante' : 'Benefits of the resulting compressed PDF'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Reducción de tamaño con calidad, compatibilidad y privacidad garantizadas' : 'Size reduction with guaranteed quality, compatibility, and privacy'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { title: isEs ? 'Hasta 90% de Reducción' : 'Up to 90% Reduction', desc: isEs ? 'En documentos con imágenes JPEG de alta resolución, la reducción puede alcanzar hasta el 90% del tamaño original.' : 'In documents with high-resolution JPEG images, reduction can reach up to 90% of the original size.' },
                { title: isEs ? 'Texto Vectorial Intacto' : 'Vector Text Intact', desc: isEs ? 'El texto y los gráficos vectoriales no se ven afectados por la compresión JPEG — permanecen perfectamente legibles.' : 'Text and vector graphics are unaffected by JPEG compression — they remain perfectly readable.' },
                { title: isEs ? 'Compatible con Todos los Visores' : 'All Viewers Compatible', desc: isEs ? 'El PDF comprimido abre correctamente en Adobe, Chrome, Edge, Foxit, iOS y Android sin errores.' : 'Compressed PDF opens correctly in Adobe, Chrome, Edge, Foxit, iOS, and Android without errors.' },
                { title: isEs ? 'Informe de Reducción' : 'Reduction Report', desc: isEs ? 'El motor reporta el tamaño original vs. final y el porcentaje de reducción antes de descargar.' : 'The engine reports original vs. final size and reduction percentage before downloading.' },
                { title: isEs ? 'Niveles Ajustables' : 'Adjustable Levels', desc: isEs ? 'Elige entre compresión baja, media o alta según tus necesidades de calidad y tamaño objetivo.' : 'Choose between low, medium, or high compression based on your quality and target size needs.' },
                { title: isEs ? 'Privacidad Total' : 'Total Privacy', desc: isEs ? 'Cero bytes enviados a servidores. Toda la compresión ocurre en tu CPU y RAM locales.' : 'Zero bytes sent to servers. All compression happens on your local CPU and RAM.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-bold text-xs block mb-1 font-sans">{item.title}</strong>
                    <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
