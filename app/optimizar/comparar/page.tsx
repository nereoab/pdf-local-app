'use client';

import { useState } from 'react';
import PdfComparator from '../../../components/PdfComparator';
import { useLanguage } from '../../../context/LanguageContext';
import { ShieldCheck, GitCompare, AlertTriangle, HelpCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompararPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const faqs = [
    {
      qEs: '¿Qué algoritmo usa el motor de comparación?',
      qEn: 'What algorithm does the comparison engine use?',
      aEs: 'El motor utiliza el algoritmo LCS (Longest Common Subsequence) con programación dinámica para comparar palabra por palabra. Adicionalmente, realiza comparación visual pixel a pixel con un umbral de tolerancia de 30 canales RGB, y detecta cambios estructurales como fuentes, imágenes incrustadas y metadatos del documento.',
      aEn: 'The engine uses the LCS (Longest Common Subsequence) algorithm with dynamic programming to compare word by word. Additionally, it performs pixel-by-pixel visual comparison with a 30 RGB channel tolerance threshold, and detects structural changes such as fonts, embedded images, and document metadata.',
    },
    {
      qEs: '¿Compara imágenes y gráficos dentro del PDF?',
      qEn: 'Does it compare images and graphics within the PDF?',
      aEs: 'Sí. El motor tiene dos capas de comparación: (1) texto con diff semántico y coordenadas de resaltado, y (2) comparación visual renderizando cada página a canvas y detectando píxeles diferentes. Las páginas con cambios visuales se marcan con un badge 🖼️ y el reporte incluye el porcentaje de píxeles modificados.',
      aEn: 'Yes. The engine has two comparison layers: (1) text with semantic diff and highlight coordinates, and (2) visual comparison by rendering each page to canvas and detecting different pixels. Pages with visual changes are marked with a 🖼️ badge and the report includes the percentage of modified pixels.',
    },
    {
      qEs: '¿Mis documentos salen de mi computadora?',
      qEn: 'Do my documents leave my computer?',
      aEs: 'No. Todo el procesamiento ocurre 100% en tu navegador usando Web Workers. Los PDFs se cargan en RAM, el texto se extrae localmente con pdfjs-dist, y los checksums SHA-256 se calculan con la Web Crypto API del navegador. Ningún byte se transmite a ningún servidor.',
      aEn: 'No. All processing happens 100% in your browser using Web Workers. PDFs are loaded into RAM, text is extracted locally with pdfjs-dist, and SHA-256 checksums are computed using the browser\'s Web Crypto API. No bytes are transmitted to any server.',
    },
    {
      qEs: '¿Cuál es el límite de tamaño o páginas?',
      qEn: 'What is the size or page limit?',
      aEs: 'No hay un límite estricto. El motor puede procesar documentos de cientos de páginas, pero el rendimiento depende de la RAM disponible en tu equipo. Como referencia, dos PDFs de 50 páginas cada uno se comparan en aproximadamente 15-30 segundos. Para documentos muy grandes (>200MB), recomendamos dividirlos en secciones.',
      aEn: 'There is no strict limit. The engine can process documents with hundreds of pages, but performance depends on available RAM on your device. As a reference, two 50-page PDFs are compared in approximately 15-30 seconds. For very large documents (>200MB), we recommend splitting them into sections.',
    },
    {
      qEs: '¿Puedo comparar un PDF escaneado con su versión digital?',
      qEn: 'Can I compare a scanned PDF with its digital version?',
      aEs: 'La comparación de texto solo funciona si ambos PDFs tienen texto extraíble (no imágenes escaneadas). Para PDFs escaneados, recomendamos aplicar OCR primero usando nuestra herramienta de OCR en la sección Editar, y luego comparar las versiones con texto. Alternativamente, puedes usar el modo Superposición para detectar cambios visuales entre las páginas renderizadas.',
      aEn: 'Text comparison only works if both PDFs have extractable text (not scanned images). For scanned PDFs, we recommend applying OCR first using our OCR tool in the Edit section, and then comparing the text versions. Alternatively, you can use Overlay mode to detect visual changes between rendered pages.',
    },
    {
      qEs: '¿Qué formato tiene el reporte de comparación?',
      qEn: 'What format does the comparison report have?',
      aEs: 'Ofrecemos dos formatos de reporte: (1) TXT con resumen ejecutivo, checksums SHA-256, cambios estructurales y detalle de bloques semánticos por página, y (2) PDF estilizado corporativo con portada, secciones profesionales y apéndices. Ambos se generan localmente y no requieren conexión a internet.',
      aEn: 'We offer two report formats: (1) TXT with executive summary, SHA-256 checksums, structural changes, and per-page semantic block details, and (2) Styled corporate PDF with cover page, professional sections, and appendices. Both are generated locally and require no internet connection.',
    },
  ];

  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});

  const toggleFaq = (idx: number) => {
    setOpenFaqs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-16 pt-8 flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <div className="mb-16"><PdfComparator /></div>

        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10">
          {/* Paso a paso */}
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10"><GitCompare className="w-5 h-5 text-white" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs ? '1. Cómo comparar dos PDFs' : '1. How to compare two PDFs'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', es: 'Sube el PDF original en la zona izquierda y el modificado en la derecha.', en: 'Upload the original PDF on the left zone and the modified on the right.' },
                { step: '02', es: 'El motor extrae texto por página, calcula checksums SHA-256 y aplica el algoritmo LCS.', en: 'The engine extracts text per page, computes SHA-256 checksums, and applies the LCS algorithm.' },
                { step: '03', es: 'Las diferencias se muestran con resaltado rojo/verde, navegación entre cambios y 3 modos de vista.', en: 'Differences are shown with red/green highlighting, change navigation, and 3 view modes.' },
                { step: '04', es: 'Descarga el reporte en formato TXT o PDF estilizado con desglose completo.', en: 'Download the report in TXT or styled PDF format with full breakdown.' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">
                    {isEs ? 'Paso' : 'Step'} {item.step}
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">{isEs ? item.es : item.en}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Limitaciones y consejos */}
          <div className="bg-[#09090b] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-amber-500/20 pb-4">
              <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs ? '2. Limitaciones y consejos útiles' : '2. Limitations & useful tips'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">✓ {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}</h4>
                {[
                  isEs ? 'Comparar dos versiones de un documento para detectar cambios en texto, cláusulas, fuentes e imágenes.' : 'Compare two document versions to detect changes in text, clauses, fonts, and images.',
                  isEs ? 'Visualizar diferencias con resaltado rojo/verde, navegación por cambios y scroll sincronizado.' : 'Visualize differences with red/green highlighting, change navigation, and synchronized scroll.',
                  isEs ? 'Usar modo Superposición para detectar cambios visuales y modo Unificado tipo GitHub diff.' : 'Use Overlay mode to detect visual changes and Unified mode like GitHub diff.',
                  isEs ? 'Exportar reporte TXT o PDF corporativo con checksums SHA-256, cambios estructurales y detalle semántico.' : 'Export TXT or corporate PDF report with SHA-256 checksums, structural changes, and semantic details.',
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">💡 {isEs ? 'CONSEJOS' : 'TIPS'}</h4>
                {[
                  isEs ? 'Ideal para auditoría de contratos, control de versiones, revisión de especificaciones y compliance.' : 'Ideal for contract auditing, version control, specification review, and compliance.',
                  isEs ? 'El motor compara texto extraído, fuentes e imágenes. Para PDFs escaneados, aplica OCR primero.' : 'The engine compares extracted text, fonts, and images. For scanned PDFs, apply OCR first.',
                  isEs ? 'Ambos PDFs deben ser versiones del mismo documento base para una comparación precisa.' : 'Both PDFs should be versions of the same base document for accurate comparison.',
                  isEs ? 'Usa atajos de teclado: Ctrl+Enter para comparar, Ctrl+←/→ para navegar cambios, Tab para cambiar vista.' : 'Use keyboard shortcuts: Ctrl+Enter to compare, Ctrl+←/→ to navigate changes, Tab to switch view.',
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Seguridad y privacidad */}
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30"><ShieldCheck className="w-5 h-5 text-emerald-400" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs ? '3. ¿Qué sucede con tus documentos al compararlos?' : '3. What happens to your documents when comparing them?'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🖥️ {isEs ? 'Procesamiento 100% local' : '100% local processing'}</strong>
                <p className="text-[11px]">{isEs ? 'Ambos PDFs se procesan en la RAM usando Web Workers. Ningún byte sale de tu equipo. Los checksums SHA-256 garantizan la integridad forense.' : 'Both PDFs are processed in RAM using Web Workers. No bytes leave your device. SHA-256 checksums guarantee forensic integrity.'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">🔍 {isEs ? 'Análisis semántico y visual combinado' : 'Combined semantic & visual analysis'}</strong>
                <p className="text-[11px]">{isEs ? 'Algoritmo LCS sobre texto extraído con pdfjs-dist + comparación visual pixel a pixel + detección de cambios estructurales (fuentes, imágenes, metadatos).' : 'LCS algorithm on extracted text with pdfjs-dist + pixel-by-pixel visual comparison + structural change detection (fonts, images, metadata).'}</p>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                <strong className="text-white font-bold text-xs block">📥 {isEs ? 'Reportes profesionales descargables' : 'Downloadable professional reports'}</strong>
                <p className="text-[11px]">{isEs ? 'Reporte TXT detallado y reporte PDF estilizado corporativo con portada, resumen ejecutivo y apéndices. Tus archivos originales no se modifican.' : 'Detailed TXT report and styled corporate PDF report with cover page, executive summary, and appendices. Your original files are not modified.'}</p>
              </div>
            </div>
          </div>

          {/* FAQs expandibles */}
          <div className="bg-[#09090b] border border-blue-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-blue-500/20 pb-4">
              <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/30"><HelpCircle className="w-5 h-5 text-blue-400" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs ? '4. Preguntas Frecuentes' : '4. Frequently Asked Questions'}</h2>
            </div>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/8 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-900/80 transition-colors cursor-pointer">
                    <span className="text-sm font-semibold text-white pr-4">{isEs ? faq.qEs : faq.qEn}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${openFaqs[i] ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaqs[i] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden">
                        <div className="px-4 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                          {isEs ? faq.aEs : faq.aEn}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}