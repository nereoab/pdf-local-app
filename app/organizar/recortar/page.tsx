'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, Crop, CheckCircle2, Lock, Sparkles, Layers, Move } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfCropper = dynamic(() => import('@/components/PdfCropper'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para recortar páginas PDF...</p>
    </div>
  ),
});

export default function RecortarPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfCropper />

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
                  {isEs ? '¿Qué sucede con tu PDF al recortar márgenes de sus páginas?' : 'What happens to your PDF when cropping its page margins?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • RECORTE VÍA MEDIABOX • 100% LOCAL' : '🔒 ABSOLUTE PRIVACY • MEDIABOX CROP • 100% LOCAL'}
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
                    ? 'El recorte de páginas se ejecuta completamente en la memoria RAM de tu navegador mediante pdf-lib. Tus documentos confidenciales — contratos, planos técnicos, presentaciones — se procesan localmente sin ser transmitidos a ningún servidor externo. Privacidad y seguridad absolutas.'
                    : 'Page cropping runs entirely in your browser RAM using pdf-lib. Your confidential documents — contracts, technical blueprints, presentations — are processed locally without being transmitted to any external server. Absolute privacy and security.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Recorte no destructivo mediante modificación del CropBox/MediaBox' : 'Non-destructive crop via CropBox/MediaBox modification'}
                </strong>
                <p>
                  {isEs
                    ? 'El recorte PDF nativo funciona modificando el campo `CropBox` (o `MediaBox`) de cada página en el diccionario de la página — un rectángulo que define el área visible al renderizar. El contenido fuera del área recortada sigue existiendo en el stream de la página pero queda oculto. La operación es reversible y no degrada calidad.'
                    : 'Native PDF cropping works by modifying the `CropBox` (or `MediaBox`) field of each page in the page dictionary — a rectangle defining the visible area when rendering. Content outside the cropped area still exists in the page stream but is hidden. The operation is reversible and does not degrade quality.'}
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
                  {isEs ? 'El procedimiento técnico de recorte de páginas PDF paso a paso' : 'Step-by-step technical PDF page cropping procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo el motor ajusta las cajas de visualización de cada página del documento' : 'How the engine adjusts the view boxes of each document page'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { step: '01 / ANÁLISIS', title: isEs ? '1. Lectura del MediaBox' : '1. MediaBox Reading', desc: isEs ? 'pdf-lib deserializa la página y lee el `MediaBox` — el rectángulo base que define las dimensiones físicas totales de la página en puntos PDF (1 punto = 1/72 pulgada). Este es el límite máximo de recorte disponible.' : 'pdf-lib deserializes the page and reads the `MediaBox` — the base rectangle defining total physical page dimensions in PDF points (1 point = 1/72 inch). This is the maximum available crop boundary.' },
                { step: '02 / SELECCIÓN', title: isEs ? '2. Definición del Área' : '2. Area Definition', desc: isEs ? 'El usuario define el área a conservar mediante el visor interactivo — arrastrando el recuadro de recorte o introduciendo valores exactos de margen (superior, inferior, izquierdo, derecho) en milímetros o puntos PDF.' : 'The user defines the area to keep via the interactive viewer — dragging the crop box or entering exact margin values (top, bottom, left, right) in millimeters or PDF points.' },
                { step: '03 / MODIFICACIÓN', title: isEs ? '3. Escritura del CropBox' : '3. CropBox Writing', desc: isEs ? 'pdf-lib escribe el nuevo `CropBox` en el diccionario de cada página seleccionada con las coordenadas calculadas. El visor PDF usará este rectángulo para determinar el área visible — ocultando el contenido fuera de él.' : 'pdf-lib writes the new `CropBox` in each selected page dictionary with the calculated coordinates. The PDF viewer uses this rectangle to determine the visible area — hiding content outside it.' },
                { step: '04 / EXPORTACIÓN', title: isEs ? '4. PDF Recortado Listo' : '4. Cropped PDF Ready', desc: isEs ? 'Se serializa un nuevo PDF 1.7 estándar con el `CropBox` ajustado en cada página. El documento resultante muestra solo el área definida en cualquier visor, con calidad de contenido intacta.' : 'A new standard PDF 1.7 is serialized with the adjusted `CropBox` on each page. The resulting document shows only the defined area in any viewer, with content quality intact.' },
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

          {/* BLOQUE 3: OPCIONES DE RECORTE */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Crop className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Opciones de recorte y formatos de página soportados' : 'Crop options and supported page formats'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Flexibilidad de recorte para documentos de cualquier formato y tamaño' : 'Crop flexibility for documents of any format and size'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'Recorte por Márgenes Uniformes' : 'Uniform Margin Crop'}
                </strong>
                <p>
                  {isEs
                    ? 'Define márgenes iguales en todos los lados (superior, inferior, izquierdo, derecho) en milímetros para eliminar espacios en blanco excesivos de documentos escaneados. Ideal para reducir márgenes de PDFs generados desde Word o LibreOffice con bordes demasiado amplios.'
                    : 'Define equal margins on all sides (top, bottom, left, right) in millimeters to remove excessive white space from scanned documents. Ideal for reducing margins of PDFs generated from Word or LibreOffice with overly wide borders.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Move className="w-4 h-4 text-white" />
                  {isEs ? 'Recorte con Visor Interactivo' : 'Interactive Viewer Crop'}
                </strong>
                <p>
                  {isEs
                    ? 'Usa el visor interactivo para arrastrar el recuadro de recorte directamente sobre la página. El motor calcula automáticamente las coordenadas del `CropBox` en puntos PDF con precisión sub-punto. La vista previa en tiempo real muestra el resultado final antes de procesar.'
                    : 'Use the interactive viewer to drag the crop box directly over the page. The engine automatically calculates `CropBox` coordinates in PDF points with sub-point precision. Real-time preview shows the final result before processing.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Aplicar a Todas o Páginas Específicas' : 'Apply to All or Specific Pages'}
                </strong>
                <p>
                  {isEs
                    ? 'Aplica el mismo recorte a todas las páginas del documento a la vez, o define áreas de recorte diferentes para páginas pares e impares — útil para documentos a doble cara donde los márgenes de encuadernación varían entre páginas izquierda y derecha.'
                    : 'Apply the same crop to all document pages at once, or define different crop areas for even and odd pages — useful for double-sided documents where binding margins vary between left and right pages.'}
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
                  {isEs ? 'Beneficios del PDF recortado resultante' : 'Benefits of the resulting cropped PDF'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Calidad, compatibilidad y eficiencia en el documento con márgenes ajustados' : 'Quality, compatibility, and efficiency in the margin-adjusted document'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { title: isEs ? 'Recorte No Destructivo' : 'Non-Destructive Crop', desc: isEs ? 'El contenido original del stream de página permanece intacto. Solo el CropBox visible se modifica.' : 'Original page stream content remains intact. Only the visible CropBox is modified.' },
                { title: isEs ? 'Calidad Lossless' : 'Lossless Quality', desc: isEs ? 'Ninguna imagen, fuente o vector se recodifica durante el proceso de recorte.' : 'No image, font, or vector is re-encoded during the cropping process.' },
                { title: isEs ? 'Menor Área de Impresión' : 'Smaller Print Area', desc: isEs ? 'El recorte reduce el área visible de la página — ideal para ajustar documentos a formatos de impresión estándar sin márgenes excesivos.' : 'Crop reduces the visible page area — ideal for fitting documents to standard print formats without excessive margins.' },
                { title: isEs ? 'Compatible con Todos los Visores' : 'All Viewers Compatible', desc: isEs ? 'El PDF recortado abre correctamente en Adobe, Chrome, Edge, Foxit, iOS y Android.' : 'Cropped PDF opens correctly in Adobe, Chrome, Edge, Foxit, iOS, and Android.' },
                { title: isEs ? 'Documentos Escaneados' : 'Scanned Documents', desc: isEs ? 'Ideal para eliminar el exceso de fondo blanco en PDFs escaneados con cama plana.' : 'Ideal for removing excess white background in flatbed-scanned PDF documents.' },
                { title: isEs ? 'Privacidad Total' : 'Total Privacy', desc: isEs ? 'Cero bytes enviados a servidores. El recorte ocurre completamente en tu RAM local.' : 'Zero bytes sent to servers. Cropping happens completely in your local RAM.' },
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
