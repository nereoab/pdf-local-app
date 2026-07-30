'use client';

import PdfCompressor from '../../../components/PdfCompressor';
import { useLanguage } from '../../../context/LanguageContext';
import { ShieldCheck, Cpu, Zap, CheckCircle2, Lock, Sparkles, BarChart2, Image as ImageIcon } from 'lucide-react';

export default function ComprimirPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-16 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">

        {/* HERRAMIENTA INTERACTIVA */}
        <div className="mb-16">
          <PdfCompressor />
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
                  {isEs ? '¿Qué sucede exactamente con tus archivos al comprimirlos?' : 'What exactly happens to your files when compressed?'}
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
                    ? 'A diferencia de compresores en línea tradicionales, tus archivos PDF NUNCA se cargan a ningún servidor remoto ni almacenamiento en la nube. Todo el análisis de imágenes, el reencuadre de objetos y la recompresión se ejecuta en tiempo real dentro de la memoria RAM de tu propio navegador web.'
                    : 'Unlike traditional online compressors, your PDF files are NEVER uploaded to any remote server or cloud storage. All image analysis, object reframing, and recompression run in real time inside your browser RAM.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Destrucción inmediata de memoria' : 'Immediate memory purge'}
                </strong>
                <p>
                  {isEs
                    ? 'Una vez finalizada la compresión y descargado el archivo optimizado, no queda ningún rastro en disco ni en servidores. Al cerrar la pestaña o refrescar la página, el navegador purga completamente el espacio en memoria, garantizando confidencialidad absoluta en documentos corporativos, legales o financieros.'
                    : 'Once compression finishes and you download the optimized file, no traces remain on disk or servers. Closing the tab purges all memory completely, ensuring total privacy for corporate, legal, or financial documents.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: PROCEDIMIENTO TÉCNICO DE COMPRESIÓN PASO A PASO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El procedimiento técnico de compresión paso a paso' : 'Step-by-step technical compression procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo nuestro motor analiza y reduce el peso binario de tu PDF sin perder calidad' : 'How our engine analyzes and reduces binary PDF weight without quality loss'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">

              {/* PASO 1 */}
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">01 / ANÁLISIS</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '1. Inventario de Recursos' : '1. Resource Inventory'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Escaneamos el árbol de objetos del PDF e identificamos imágenes, fuentes embebidas, streams comprimidos y metadatos redundantes que pueden reducirse sin afectar el contenido.'
                      : 'Scans the PDF object tree identifying images, embedded fonts, compressed streams, and redundant metadata that can be reduced without affecting content.'}
                  </p>
                </div>
              </div>

              {/* PASO 2 */}
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">02 / IMÁGENES</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '2. Recompresión de Imágenes' : '2. Image Recompression'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Aplicamos el nivel de calidad JPEG seleccionado (alta, media, baja) a cada imagen embebida. Las imágenes monocromáticas se convierten a escala de grises para maximizar la reducción.'
                      : 'Applies the selected JPEG quality level (high, medium, low) to each embedded image. Monochromatic images are converted to grayscale to maximize reduction.'}
                  </p>
                </div>
              </div>

              {/* PASO 3 */}
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">03 / LIMPIEZA</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '3. Poda de Metadatos' : '3. Metadata Pruning'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Eliminamos el diccionario XMP, comentarios de versión, thumbnails incrustados, historial de edición y referencias a software de creación que inflan el archivo sin aportarle valor funcional.'
                      : 'Purges XMP dictionary, version comments, embedded thumbnails, edit history, and software references that inflate file size without functional value.'}
                  </p>
                </div>
              </div>

              {/* PASO 4 */}
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-2 block font-mono">04 / EMPAQUETADO</span>
                  <h3 className="font-bold text-white text-sm mb-2 font-sans">
                    {isEs ? '4. Re-ensamblado PDF 1.7' : '4. PDF 1.7 Repackaging'}
                  </h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    {isEs
                      ? 'Generamos un nuevo documento PDF estándar con corrientes de objetos comprimidas en formato Flate/Deflate y un diccionario trailer 100% válido y compatible con cualquier visor.'
                      : 'Generates a new standard PDF with object streams compressed in Flate/Deflate format and a 100% valid trailer dictionary compatible with any viewer.'}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* BLOQUE 3: EL MOTOR DE COMPRESIÓN ADAPTATIVA */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'El Motor Adaptativo: ¿Cómo mantiene la calidad visual?' : 'The Adaptive Engine: How does it maintain visual quality?'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Tecnología de análisis perceptual de imagen y compresión Flate/JPEG progresivo' : 'Perceptual image analysis and progressive Flate/JPEG compression technology'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-white" />
                  {isEs ? 'Análisis Perceptual de Imagen' : 'Perceptual Image Analysis'}
                </strong>
                <p>
                  {isEs
                    ? 'Nuestro motor evalúa cada imagen embebida usando métricas de calidad perceptual antes de recomprimirla, adaptando automáticamente el factor de compresión para preservar nitidez en zonas críticas como texto en imágenes y gráficos vectoriales rasterizados.'
                    : 'Our engine evaluates each embedded image using perceptual quality metrics before recompression, automatically adapting the compression factor to preserve sharpness in critical zones like text-in-images and rasterized vector graphics.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Zap className="w-4 h-4 text-white" />
                  {isEs ? 'Compresión Flate de Objetos' : 'Flate Object Compression'}
                </strong>
                <p>
                  {isEs
                    ? 'Los streams de texto, paths y diccionarios de fuentes se comprimen con el algoritmo Flate/Deflate (zlib), el mismo estándar usado en archivos ZIP. Esto reduce drasticamente el espacio de código sin tocar el contenido visual ni la seleccionabilidad del texto.'
                    : 'Text streams, paths, and font dictionaries are compressed with Flate/Deflate (zlib), the same standard used in ZIP files. This drastically reduces code space without touching visual content or text selectability.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  {isEs ? 'Texto 100% Seleccionable' : '100% Selectable Text'}
                </strong>
                <p>
                  {isEs
                    ? 'El proceso de compresión solo actúa sobre las imágenes y los streams de bytes. Las fuentes, el texto vectorial y la estructura de páginas permanecen intactos, garantizando que el archivo resultante sea 100% buscable, copiable e indexable por motores de búsqueda.'
                    : 'Compression only acts on images and byte streams. Fonts, vector text, and page structure remain intact, ensuring the output is 100% searchable, copyable, and indexable by search engines.'}
                </p>
              </div>
            </div>
          </div>

          {/* BLOQUE 4: BENEFICIOS DEL PDF COMPRIMIDO */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Ventajas del PDF optimizado resultante' : 'Advantages of the resulting optimized PDF'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Beneficios directos aplicados al archivo comprimido' : 'Direct benefits applied to the compressed file'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Reducción de hasta el 90%' : 'Up to 90% Reduction'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Archivos hasta 10x más pequeños sin pérdida apreciable de calidad visual.' : 'Files up to 10x smaller without appreciable visual quality loss.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Compatible con Correo Electrónico' : 'Email Compatible'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Supera fácilmente los límites de adjunto de Gmail (25 MB) y Outlook (20 MB).' : 'Easily passes Gmail (25 MB) and Outlook (20 MB) attachment size limits.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Carga Ultrarrápida en Web' : 'Ultra-Fast Web Loading'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'PDFs más ligeros se renderizan en navegadores y visores móviles en milisegundos.' : 'Lighter PDFs render in browsers and mobile viewers in milliseconds.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Máxima Compatibilidad' : 'Max Compatibility'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Funciona en Adobe Acrobat, Foxit, Chrome, Edge, iOS y Android sin problemas.' : 'Works across Adobe Acrobat, Foxit, Chrome, Edge, iOS, and Android.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Texto Siempre Seleccionable' : 'Always Selectable Text'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'El contenido textual queda 100% buscable, copiable e indexable por Google.' : 'Text content remains 100% searchable, copyable, and indexable by Google.'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold text-xs block mb-1 font-sans">{isEs ? 'Subida más Rápida a Portales' : 'Faster Portal Uploads'}</strong>
                  <span className="text-zinc-400 text-[11px] leading-relaxed font-sans">{isEs ? 'Cumple los límites de peso de plataformas gubernamentales, universitarias o bancarias.' : 'Meets government, university, or banking platform size upload limits.'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
