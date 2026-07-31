'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, Presentation, CheckCircle2, Lock, Sparkles, Layers, Image } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PowerPointPdfConverter = dynamic(() => import('@/components/PowerPointPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para convertir PDF a PowerPoint / PowerPoint a PDF...</p>
    </div>
  ),
});

export default function PdfToPowerPointPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PowerPointPdfConverter defaultMode="pdf-to-powerpoint" />

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
                  {isEs ? '¿Qué sucede al convertir entre PDF y PowerPoint?' : 'What happens when converting between PDF and PowerPoint?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • CONVERSIÓN LOCAL BIDIRECCIONAL • 100% SIN SERVIDOR' : '🔒 ABSOLUTE PRIVACY • LOCAL BIDIRECTIONAL CONVERSION • 100% SERVER-FREE'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed mt-4">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Tus presentaciones nunca salen de tu dispositivo' : 'Your presentations never leave your device'}
                </strong>
                <p>
                  {isEs
                    ? 'La conversión entre PDF y PowerPoint se ejecuta completamente en la memoria RAM de tu navegador. Tus presentaciones corporativas — con estrategias de negocio, datos financieros o diseños de producto — nunca se transmiten a APIs externas ni servicios en la nube. Todo es local, privado e instantáneo.'
                    : 'PDF and PowerPoint conversion runs entirely in your browser RAM. Your corporate presentations — with business strategies, financial data, or product designs — are never transmitted to external APIs or cloud services. Everything is local, private, and instant.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Cada página PDF se convierte en una diapositiva PPTX editable' : 'Each PDF page becomes an editable PPTX slide'}
                </strong>
                <p>
                  {isEs
                    ? 'El motor rasteriza cada página del PDF como imagen PNG de alta resolución y la incrusta como imagen de fondo en una diapositiva PPTX usando PptxGenJS. Sobre la imagen se crean cajas de texto con el contenido textual extraído mediante pdf.js — haciendo el texto editable mientras se preserva la maquetación visual original.'
                    : 'The engine rasterizes each PDF page as a high-resolution PNG image and embeds it as background image in a PPTX slide using PptxGenJS. Over the image, text boxes are created with text content extracted via pdf.js — making text editable while preserving the original visual layout.'}
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
                  {isEs ? 'El procedimiento técnico de conversión PDF ↔ PowerPoint paso a paso' : 'Step-by-step PDF ↔ PowerPoint conversion technical procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo el motor convierte páginas PDF en diapositivas PPTX editables' : 'How the engine converts PDF pages into editable PPTX slides'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { step: '01 / RENDERIZADO', title: isEs ? '1. Rasterización de Páginas' : '1. Page Rasterization', desc: isEs ? 'pdf.js renderiza cada página del PDF en un Canvas HTML5 de alta resolución (150-300 DPI). El Canvas se exporta como imagen PNG base64 que actuará como fondo visual de la diapositiva correspondiente.' : 'pdf.js renders each PDF page into a high-resolution HTML5 Canvas (150-300 DPI). The Canvas is exported as base64 PNG image that will serve as the visual background of the corresponding slide.' },
                { step: '02 / EXTRACCIÓN', title: isEs ? '2. Extracción de Texto' : '2. Text Extraction', desc: isEs ? 'pdf.js extrae simultáneamente el contenido textual de cada página con coordenadas X/Y normalizadas a las dimensiones de la diapositiva PPTX (25.4cm × 19.05cm en 4:3 o 33.87cm × 19.05cm en 16:9).' : 'pdf.js simultaneously extracts text content from each page with X/Y coordinates normalized to PPTX slide dimensions (25.4cm × 19.05cm in 4:3 or 33.87cm × 19.05cm in 16:9).' },
                { step: '03 / GENERACIÓN', title: isEs ? '3. Construcción PPTX con PptxGenJS' : '3. PPTX Building with PptxGenJS', desc: isEs ? 'PptxGenJS crea la presentación PPTX insertando cada imagen PNG como fondo de diapositiva y añadiendo cajas de texto transparentes con el contenido extraído en las coordenadas correctas para edición posterior.' : 'PptxGenJS creates the PPTX presentation by inserting each PNG image as slide background and adding transparent text boxes with extracted content at correct coordinates for later editing.' },
                { step: '04 / EXPORTACIÓN', title: isEs ? '4. Archivo PPTX Descargable' : '4. Downloadable PPTX File', desc: isEs ? 'El PPTX generado es un archivo OpenXML válido, completamente compatible con Microsoft PowerPoint 2016-365, LibreOffice Impress y Google Slides — listo para editar y presentar.' : 'The generated PPTX is a valid OpenXML file, fully compatible with Microsoft PowerPoint 2016-365, LibreOffice Impress, and Google Slides — ready to edit and present.' },
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

          {/* BLOQUE 3: CAPACIDADES */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
                <Presentation className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Capacidades de la conversión PDF ↔ PowerPoint' : 'PDF ↔ PowerPoint conversion capabilities'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Qué elementos se preservan y cómo se estructuran las diapositivas PPTX resultantes' : 'What elements are preserved and how the resulting PPTX slides are structured'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Image className="w-4 h-4 text-white" />
                  {isEs ? 'Fondo Visual de Alta Resolución' : 'High-Resolution Visual Background'}
                </strong>
                <p>
                  {isEs
                    ? 'Cada diapositiva tiene la página PDF completa como imagen de fondo de alta resolución — preservando la maquetación exacta, colores, gráficos y logotipos originales con máxima fidelidad visual independientemente del contenido de la página.'
                    : 'Each slide has the complete PDF page as a high-resolution background image — preserving the exact layout, colors, graphics, and original logos with maximum visual fidelity regardless of page content.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'Texto Editable Superpuesto' : 'Overlaid Editable Text'}
                </strong>
                <p>
                  {isEs
                    ? 'Sobre la imagen de fondo se crean cajas de texto transparentes con el contenido extraído del PDF. El texto queda seleccionable, editable y buscable en PowerPoint — puedes modificar frases, corregir errores tipográficos o actualizar datos sin rediseñar la diapositiva completa.'
                    : 'Over the background image, transparent text boxes are created with PDF-extracted content. Text is selectable, editable, and searchable in PowerPoint — you can modify phrases, correct typos, or update data without redesigning the entire slide.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'PPTX → PDF de Alta Fidelidad' : 'PPTX → PDF High-Fidelity'}
                </strong>
                <p>
                  {isEs
                    ? 'La conversión inversa PPTX→PDF renderiza cada diapositiva de la presentación como una página PDF de alta fidelidad, preservando fondos, imágenes, formas vectoriales, tipografías y las transiciones visuales de diseño de PowerPoint.'
                    : 'Reverse PPTX→PDF conversion renders each presentation slide as a high-fidelity PDF page, preserving backgrounds, images, vector shapes, typography, and PowerPoint design visual transitions.'}
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
                  {isEs ? 'Beneficios de la conversión PDF ↔ PowerPoint' : 'Benefits of PDF ↔ PowerPoint conversion'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Compatibilidad, edición y privacidad garantizadas en la presentación generada' : 'Compatibility, editing, and privacy guaranteed in the generated presentation'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { title: isEs ? 'Texto Completamente Editable' : 'Fully Editable Text', desc: isEs ? 'Las cajas de texto sobre cada diapositiva son editables en PowerPoint, LibreOffice e Impress.' : 'Text boxes over each slide are editable in PowerPoint, LibreOffice, and Impress.' },
                { title: isEs ? 'Fondo Visual de Alta Calidad' : 'High-Quality Visual Background', desc: isEs ? 'La imagen de fondo de cada diapositiva preserva la maquetación exacta del PDF original.' : 'Each slide background image preserves the exact layout of the original PDF.' },
                { title: isEs ? 'Compatible con PowerPoint 365' : 'PowerPoint 365 Compatible', desc: isEs ? 'El PPTX abre y edita sin errores en Microsoft PowerPoint 2016-365 y Google Slides.' : 'The PPTX opens and edits without errors in Microsoft PowerPoint 2016-365 and Google Slides.' },
                { title: isEs ? 'Formato 4:3 y 16:9' : '4:3 & 16:9 Format', desc: isEs ? 'Elige entre formato de presentación estándar 4:3 o panorámico 16:9 para el PPTX resultante.' : 'Choose between standard 4:3 or widescreen 16:9 presentation format for the PPTX result.' },
                { title: isEs ? 'Sin Límite de Diapositivas' : 'No Slide Limit', desc: isEs ? 'Convierte presentaciones de cualquier extensión sin restricciones de número de páginas.' : 'Convert presentations of any length without page count restrictions.' },
                { title: isEs ? 'Privacidad Total' : 'Total Privacy', desc: isEs ? 'Cero bytes de tu presentación enviados a servidores. Todo ocurre en tu RAM local.' : 'Zero bytes of your presentation sent to servers. Everything happens in your local RAM.' },
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
