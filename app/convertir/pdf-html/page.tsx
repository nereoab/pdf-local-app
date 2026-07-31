'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Cpu, Code, CheckCircle2, Lock, Sparkles, Layers, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const HtmlPdfConverter = dynamic(() => import('@/components/HtmlPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para convertir PDF a HTML / HTML a PDF...</p>
    </div>
  ),
});

export default function PdfToHtmlPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <HtmlPdfConverter defaultMode="pdf-to-html" />

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
                  {isEs ? '¿Qué sucede al convertir entre PDF y HTML?' : 'What happens when converting between PDF and HTML?'}
                </h2>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {isEs ? '🔒 PRIVACIDAD ABSOLUTA • CONVERSIÓN BIDIRECCIONAL LOCAL • 100% SIN SERVIDOR' : '🔒 ABSOLUTE PRIVACY • LOCAL BIDIRECTIONAL CONVERSION • 100% SERVER-FREE'}
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
                    ? 'La conversión entre PDF y HTML se ejecuta completamente en la memoria RAM de tu navegador. Tus documentos — reportes web, páginas de documentación, formularios digitales — se convierten localmente sin ser enviados a ningún servidor externo. Todo es local, privado e instantáneo.'
                    : 'PDF to HTML conversion runs entirely in your browser RAM. Your documents — web reports, documentation pages, digital forms — are converted locally without being sent to any external server. Everything is local, private, and instant.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Conversión PDF→HTML via extracción de estructura semántica' : 'PDF→HTML conversion via semantic structure extraction'}
                </strong>
                <p>
                  {isEs
                    ? 'El motor extrae el texto con coordenadas, detecta jerarquías de encabezados por tamaño de fuente, identifica tablas por alineación columnar y extrae imágenes. El resultado se codifica en HTML5 semántico con CSS inline para máxima fidelidad visual — listo para publicar en cualquier página web o sistema CMS.'
                    : 'The engine extracts text with coordinates, detects heading hierarchies by font size, identifies tables by columnar alignment, and extracts images. The result is encoded in semantic HTML5 with inline CSS for maximum visual fidelity — ready to publish on any webpage or CMS system.'}
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
                  {isEs ? 'El procedimiento técnico de conversión PDF ↔ HTML paso a paso' : 'Step-by-step PDF ↔ HTML conversion technical procedure'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Cómo el motor analiza la estructura del PDF y la reconstruye en HTML5 semántico' : 'How the engine analyzes the PDF structure and rebuilds it into semantic HTML5'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { step: '01 / ANÁLISIS', title: isEs ? '1. Extracción de Elementos' : '1. Element Extraction', desc: isEs ? 'pdf.js extrae todos los fragmentos de texto con coordenadas X/Y y tamaño de fuente, las imágenes incrustadas decodificadas y los bordes de tabla detectados por análisis columnar de coordenadas de texto.' : 'pdf.js extracts all text fragments with X/Y coordinates and font size, decoded embedded images, and table borders detected by columnar text coordinate analysis.' },
                { step: '02 / CLASIFICACIÓN', title: isEs ? '2. Detección de Jerarquía' : '2. Hierarchy Detection', desc: isEs ? 'El motor clasifica cada bloque de texto: encabezados H1-H6 por tamaño de fuente relativo, párrafos de cuerpo, elementos de lista (detectados por sangría y puntos de viñeta) y tablas (detectadas por alineación columnar repetitiva).' : 'The engine classifies each text block: H1-H6 headings by relative font size, body paragraphs, list elements (detected by indentation and bullet points), and tables (detected by repetitive columnar alignment).' },
                { step: '03 / GENERACIÓN', title: isEs ? '3. Codificación HTML5' : '3. HTML5 Encoding', desc: isEs ? 'Cada elemento clasificado se codifica en la etiqueta HTML semántica correcta — `<h1>...<h6>`, `<p>`, `<ul>/<li>`, `<table>/<tr>/<td>`, `<img>` — con CSS inline de posición, tamaño de fuente y color para máxima fidelidad visual.' : 'Each classified element is encoded in the correct semantic HTML tag — `<h1>...<h6>`, `<p>`, `<ul>/<li>`, `<table>/<tr>/<td>`, `<img>` — with inline position, font-size, and color CSS for maximum visual fidelity.' },
                { step: '04 / EXPORTACIÓN', title: isEs ? '4. Archivo HTML Descargable' : '4. Downloadable HTML File', desc: isEs ? 'Se genera un archivo HTML5 completo con el CSS embebido e imágenes en base64 o como archivos separados, listo para abrirse en cualquier navegador o integrarse en sistemas CMS, wikis o plataformas de documentación.' : 'A complete HTML5 file is generated with embedded CSS and images as base64 or separate files, ready to open in any browser or integrate into CMS systems, wikis, or documentation platforms.' },
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
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isEs ? 'Capacidades de la conversión PDF ↔ HTML' : 'PDF ↔ HTML conversion capabilities'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Elementos del documento PDF que se preservan en el HTML semántico resultante' : 'PDF document elements preserved in the resulting semantic HTML'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  {isEs ? 'HTML5 Semántico y Accesible' : 'Semantic & Accessible HTML5'}
                </strong>
                <p>
                  {isEs
                    ? 'El HTML generado usa etiquetas semánticas HTML5 correctas — `<header>`, `<main>`, `<section>`, `<article>`, `<table>` — que mejoran la indexación SEO, la accesibilidad con lectores de pantalla y la compatibilidad con sistemas de gestión de contenido modernos.'
                    : 'Generated HTML uses correct HTML5 semantic tags — `<header>`, `<main>`, `<section>`, `<article>`, `<table>` — improving SEO indexing, screen reader accessibility, and compatibility with modern content management systems.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Globe className="w-4 h-4 text-white" />
                  {isEs ? 'HTML → PDF de Alta Fidelidad' : 'HTML → PDF High-Fidelity'}
                </strong>
                <p>
                  {isEs
                    ? 'La conversión inversa HTML→PDF usa el motor de renderizado CSS del navegador para rasterizar la página HTML al tamaño A4 y exportarla como PDF. Se preservan las tipografías web, los colores CSS, las imágenes y la maquetación CSS Grid/Flexbox en el PDF resultante.'
                    : 'Reverse HTML→PDF conversion uses the browser CSS rendering engine to rasterize the HTML page to A4 size and export it as PDF. Web fonts, CSS colors, images, and CSS Grid/Flexbox layout are preserved in the resulting PDF.'}
                </p>
              </div>

              <div className="bg-zinc-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                <strong className="text-white font-bold text-sm block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  {isEs ? 'Imágenes en Base64 o Separadas' : 'Images as Base64 or Separate'}
                </strong>
                <p>
                  {isEs
                    ? 'Las imágenes del PDF se pueden incrustar directamente en el HTML como datos base64 — generando un archivo HTML autocontenido sin dependencias externas — o exportar como archivos PNG separados en una carpeta de activos referenciada por el HTML.'
                    : 'PDF images can be embedded directly in the HTML as base64 data — generating a self-contained HTML file without external dependencies — or exported as separate PNG files in an assets folder referenced by the HTML.'}
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
                  {isEs ? 'Beneficios de la conversión PDF ↔ HTML' : 'Benefits of PDF ↔ HTML conversion'}
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  {isEs ? 'Indexabilidad, accesibilidad y privacidad garantizadas en el HTML generado' : 'Indexability, accessibility, and privacy guaranteed in the generated HTML'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              {[
                { title: isEs ? 'HTML5 Semántico' : 'Semantic HTML5', desc: isEs ? 'El HTML resultante es semánticamente correcto — compatible con motores de búsqueda, lectores de pantalla y CMS.' : 'The resulting HTML is semantically correct — compatible with search engines, screen readers, and CMS.' },
                { title: isEs ? 'Indexable por Google' : 'Google Indexable', desc: isEs ? 'El texto extraído es completamente indexable por Google, Bing y otros buscadores para SEO.' : 'Extracted text is fully indexable by Google, Bing, and other search engines for SEO.' },
                { title: isEs ? 'Compatible con Todos los Navegadores' : 'All Browsers Compatible', desc: isEs ? 'El HTML5 generado abre y muestra correctamente en Chrome, Firefox, Safari y Edge.' : 'Generated HTML5 opens and displays correctly in Chrome, Firefox, Safari, and Edge.' },
                { title: isEs ? 'Tablas Editables' : 'Editable Tables', desc: isEs ? 'Las tablas del PDF se convierten en elementos `<table>` HTML editables con estilos CSS aplicados.' : 'PDF tables are converted into editable HTML `<table>` elements with applied CSS styles.' },
                { title: isEs ? 'HTML Autocontenido' : 'Self-Contained HTML', desc: isEs ? 'Las imágenes en base64 generan un HTML sin dependencias externas — todo en un único archivo.' : 'Base64 images generate dependency-free HTML — everything in a single file.' },
                { title: isEs ? 'Privacidad Total' : 'Total Privacy', desc: isEs ? 'Cero bytes enviados a servidores. La conversión ocurre completamente en tu RAM local.' : 'Zero bytes sent to servers. Conversion happens completely in your local RAM.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-bold text-xs block mb-1 font-sans">{item.title}</strong>
                    <span className="text-zinc-400 text-[11px] leading-rasked font-sans">{item.desc}</span>
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
