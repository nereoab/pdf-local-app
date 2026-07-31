'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, Image, CheckCircle2, Lock, Sparkles, Layers, Sliders } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const JpgPdfConverter = dynamic(() => import('@/components/JpgPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para convertir PDF a JPG / JPG a PDF...</p>
    </div>
  ),
});

export default function PdfToJpgPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <JpgPdfConverter defaultMode="pdf-to-jpg" />

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
                  {isEs ? '¿Qué sucede al convertir entre PDF e imágenes JPG?' : 'What happens when converting between PDF and JPG images?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • RENDERIZADO CANVAS 2D LOCAL • 100% SIN SERVIDOR' : '🔒 ABSOLUTE PRIVACY • LOCAL 2D CANVAS RENDERING • 100% SERVER-FREE'}
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
                    ? 'La conversión entre PDF y JPG se ejecuta completamente en la memoria RAM de tu navegador mediante pdf.js y la API Canvas 2D del navegador. Tus documentos confidenciales — contratos, planos, fotos — se convierten localmente sin ser transmitidos a ningún servidor externo. Privacidad garantizada.'
                    : 'PDF to JPG conversion runs entirely in your browser RAM using pdf.js and the browser Canvas 2D API. Your confidential documents — contracts, blueprints, photos — are converted locally without being transmitted to any external server. Privacy guaranteed.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Rasterización de alta resolución vía Canvas 2D y pdf.js' : 'High-resolution rasterization via Canvas 2D and pdf.js'}
                </strong>
                <p>
                  {isEs
                    ? 'pdf.js renderiza cada página del PDF en un elemento Canvas HTML5 de alta resolución (150-300 DPI configurable). El Canvas renderizado se exporta como imagen JPEG o PNG usando `canvas.toDataURL()` — un método nativo del navegador que no requiere servidores ni librerías externas de codificación de imagen.'
                    : 'pdf.js renders each PDF page into a high-resolution HTML5 Canvas element (150-300 DPI configurable). The rendered Canvas is exported as JPEG or PNG image using `canvas.toDataURL()` — a native browser method requiring no external servers or image encoding libraries.'}
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
                  {isEs ? 'El procedimiento técnico de conversión PDF ↔ JPG paso a paso' : 'Step-by-step PDF ↔ JPG conversion technical procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo el motor renderiza cada página del PDF en un canvas de alta resolución y lo exporta como imagen' : 'How the engine renders each PDF page into a high-resolution canvas and exports it as an image'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { step: '01 / CARGA', title: isEs ? '1. Inicialización de pdf.js' : '1. pdf.js Initialization', desc: isEs ? 'pdf.js (motor WebAssembly de Mozilla) carga el archivo PDF y deserializa su árbol de objetos en memoria, preparando el contexto de renderizado para cada página con escala de pixel ratio adaptada a la pantalla del dispositivo.' : 'pdf.js (Mozilla WebAssembly engine) loads the PDF file and deserializes its object tree in memory, preparing the render context for each page with pixel ratio scale adapted to the device screen.' },
                { step: '02 / RENDERIZADO', title: isEs ? '2. Rasterización en Canvas 2D' : '2. Canvas 2D Rasterization', desc: isEs ? 'pdf.js renderiza cada página en un Canvas HTML5 con el DPI especificado (150-300 DPI). El renderizado incluye texto antialiased, imágenes decodificadas, vectores con suavizado y corrección de color ICC para máxima fidelidad visual.' : 'pdf.js renders each page into an HTML5 Canvas with the specified DPI (150-300 DPI). Rendering includes antialiased text, decoded images, smoothed vectors, and ICC color correction for maximum visual fidelity.' },
                { step: '03 / EXPORTACIÓN', title: isEs ? '3. Codificación JPEG/PNG' : '3. JPEG/PNG Encoding', desc: isEs ? 'El método nativo `canvas.toDataURL("image/jpeg", quality)` del navegador codifica el Canvas renderizado como JPEG con la calidad seleccionada (0.6-1.0). Para PNG se usa `toDataURL("image/png")` que garantiza transparencia sin pérdidas.' : 'The native browser method `canvas.toDataURL("image/jpeg", quality)` encodes the rendered Canvas as JPEG with the selected quality (0.6-1.0). For PNG, `toDataURL("image/png")` is used guaranteeing lossless transparency.' },
                { step: '04 / DESCARGA', title: isEs ? '4. Imágenes + ZIP Descargable' : '4. Images + ZIP Download', desc: isEs ? 'Cada página genera una imagen independiente nombrada con el número de página. Si son múltiples imágenes, se empaquetan en un ZIP usando JSZip para descarga en un solo clic con todas las páginas.' : 'Each page generates an independent image named with the page number. If multiple images, they are packaged in a ZIP using JSZip for single-click download with all pages.' },
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

          {/* BLOQUE 3: OPCIONES DE CALIDAD */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Sliders className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Opciones de resolución y calidad de imagen' : 'Image resolution and quality options'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Control completo sobre DPI, formato y calidad JPEG de las imágenes generadas' : 'Full control over DPI, format, and JPEG quality of generated images'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Image className="w-4 h-4 text-white" />
                  {isEs ? 'Resolución DPI Configurable' : 'Configurable DPI Resolution'}
                </strong>
                <p>
                  {isEs
                    ? 'Elige la resolución de renderizado entre 72 DPI (web), 150 DPI (uso general) y 300 DPI (calidad de impresión profesional). A mayor DPI, mayor resolución de píxeles y mayor tamaño de archivo. El ratio de escala del canvas se ajusta automáticamente a la densidad de píxeles del monitor.'
                    : 'Choose rendering resolution between 72 DPI (web), 150 DPI (general use), and 300 DPI (professional print quality). Higher DPI means higher pixel resolution and larger file size. Canvas scale ratio is automatically adjusted to the monitor pixel density.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'JPG vs PNG: Cuándo Usar Cada Formato' : 'JPG vs PNG: When to Use Each Format'}
                </strong>
                <p>
                  {isEs
                    ? 'JPG es ideal para páginas con fotografías e imágenes complejas — menor tamaño de archivo con calidad visual similar. PNG es preferible para páginas con texto, gráficos lineales o áreas con fondo transparente — garantiza nitidez perfecta en bordes de texto sin artefactos de compresión JPEG.'
                    : 'JPG is ideal for pages with photographs and complex images — smaller file size with similar visual quality. PNG is preferable for pages with text, line graphics, or areas with transparent background — guaranteeing perfect sharpness on text edges without JPEG compression artifacts.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Selección de Páginas a Convertir' : 'Page Selection for Conversion'}
                </strong>
                <p>
                  {isEs
                    ? 'Convierte todas las páginas del PDF, un rango específico (ej. "2-8") o páginas individuales seleccionadas desde miniaturas. Cada página se exporta como una imagen independiente con nombre secuencial — o todas empaquetadas en un ZIP para descarga cómoda.'
                    : 'Convert all PDF pages, a specific range (e.g. "2-8"), or individual pages selected from thumbnails. Each page is exported as an independent image with sequential naming — or all packed in a ZIP for convenient download.'}
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
                  {isEs ? 'Beneficios de la conversión PDF ↔ JPG/PNG' : 'Benefits of PDF ↔ JPG/PNG conversion'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Calidad de renderizado, compatibilidad y privacidad garantizadas' : 'Rendering quality, compatibility, and privacy guaranteed'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { title: isEs ? 'Hasta 300 DPI de Resolución' : 'Up to 300 DPI Resolution', desc: isEs ? 'Calidad de impresión profesional disponible para cada imagen exportada de las páginas PDF.' : 'Professional print quality available for each image exported from PDF pages.' },
                { title: isEs ? 'JPG y PNG Soportados' : 'JPG & PNG Supported', desc: isEs ? 'Elige entre JPEG (menor tamaño) y PNG (sin pérdidas, ideal para texto y gráficos nítidos).' : 'Choose between JPEG (smaller size) and PNG (lossless, ideal for sharp text and graphics).' },
                { title: isEs ? 'Descarga en ZIP' : 'ZIP Download', desc: isEs ? 'Múltiples páginas se empaquetan en un ZIP automáticamente para descarga en un clic.' : 'Multiple pages are automatically packaged in a ZIP for single-click download.' },
                { title: isEs ? 'Compatible con Cualquier Visor' : 'Any Viewer Compatible', desc: isEs ? 'Las imágenes generadas son compatibles con cualquier aplicación de visualización de imágenes.' : 'Generated images are compatible with any image viewing application.' },
                { title: isEs ? 'Sin Límite de Páginas' : 'No Page Limit', desc: isEs ? 'Convierte documentos de cualquier extensión en imágenes sin restricciones de número de páginas.' : 'Convert documents of any length into images without page count restrictions.' },
                { title: isEs ? 'Privacidad Total' : 'Total Privacy', desc: isEs ? 'Cero bytes enviados a servidores. El renderizado ocurre completamente en tu Canvas local.' : 'Zero bytes sent to servers. Rendering happens completely on your local Canvas.' },
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
