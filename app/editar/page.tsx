'use client';

import { Suspense, useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, animate } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowRight,
  Edit3,
  FileText,
  Type,
  Hash,
  PenTool,
  Droplet,
  ScanText,
  ShieldCheck,
  HardDrive,
  Clock,
  Sparkles,
  Lock,
  CheckCircle2,
  Stamp,
} from 'lucide-react';
import SpotlightCard from '@/components/SpotlightCard';

function EditarContent() {
  const searchParams = useSearchParams();
  const selectedToolParam = searchParams.get('tool');

  const { lang } = useLanguage();
  const isEs = lang === 'es';

  const emptySubscribe = () => () => {};
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const editingTools = [
    {
      id: 'texto',
      tagEs: '001 / AGREGAR CONTENIDO',
      tagEn: '001 / ADD CONTENT',
      titleEs: 'Editar Texto PDF',
      titleEn: 'Edit PDF Text',
      descEs: 'Inserta párrafos, títulos y anotaciones con tipografías personalizadas.',
      descEn: 'Insert paragraphs, titles, and annotations with custom fonts.',
      icon: Type,
      path: '/editar/texto',
    },
    {
      id: 'foliar',
      tagEs: '002 / NUMERACIÓN DE HOJAS',
      tagEn: '002 / PAGE NUMBERING',
      titleEs: 'Foliar PDF',
      titleEn: 'Number PDF Pages',
      descEs: 'Numera correlativamente páginas de expedientes legales o informes técnicos.',
      descEn: 'Add consecutive page numbering for legal files or technical reports.',
      icon: Hash,
      path: '/editar/foliar',
    },
    {
      id: 'firmar',
      tagEs: '003 / FIRMA DIGITAL',
      tagEn: '003 / DIGITAL SIGNATURE',
      titleEs: 'Firmar PDF',
      titleEn: 'Sign PDF',
      descEs: 'Dibuja o sube tu firma manuscrita y posiciónala en cualquier hoja.',
      descEn: 'Draw or upload your handwritten signature and place it on any page.',
      icon: PenTool,
      path: '/editar/firmar',
    },
    {
      id: 'marca-agua',
      tagEs: '004 / SELLO DE AGUA',
      tagEn: '004 / WATERMARK STAMP',
      titleEs: 'Marca de Agua',
      titleEn: 'Watermark PDF',
      descEs: 'Aplica sellos de CONFIDENCIAL o logotipos transparentes a tus documentos.',
      descEn: 'Apply CONFIDENTIAL stamps or transparent logos to your documents.',
      icon: Droplet,
      path: '/editar/marca-agua',
    },
    {
      id: 'ocr',
      tagEs: '005 / RECONOCIMIENTO OCR',
      tagEn: '005 / OCR RECOGNITION',
      titleEs: 'OCR en PDF',
      titleEn: 'PDF OCR',
      descEs: 'Convierte documentos escaneados en texto seleccionable y editable.',
      descEn: 'Convert scanned documents into selectable and editable text.',
      icon: ScanText,
      path: '/editar/ocr',
    },
    {
      id: 'quitar-marca-agua',
      tagEs: '006 / LIMPIAR MARCAS',
      tagEn: '006 / REMOVE MARKS',
      titleEs: 'Quitar Marca de Agua',
      titleEn: 'Remove Watermark',
      descEs: 'Limpia sellos y superposiciones no deseadas de tu archivo PDF.',
      descEn: 'Clean unwanted stamps and overlays from your PDF file.',
      icon: Stamp,
      path: '/editar/quitar-marca-agua',
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12 pt-8 flex flex-col items-center justify-start relative min-h-[calc(100vh-80px)] bg-[#09090b]">
      <div className="w-full max-w-7xl relative z-10">
        <motion.div
          key="workspace-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          {/* TÍTULO DE PÁGINA Y KPI STATS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-2 pb-6 border-b border-zinc-700/80">
            <div className="flex items-center gap-3.5">
              <div className="bg-zinc-800 p-3 rounded-2xl border border-zinc-500 text-white shadow-md">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {isEs ? '001 / HERRAMIENTAS DE EDICIÓN PDF' : '001 / PDF EDITING TOOLS'}
                  </h1>
                  {/* INSIGNIA DE CONFIANZA MONOCROMÁTICA */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-white text-xs font-mono font-bold shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    {isEs ? '100% Local • Cero Servidores' : '100% Local • Zero Servers'}
                  </span>
                </div>
                <p className="text-zinc-300 text-xs sm:text-sm font-mono mt-1">
                  {isEs
                    ? 'Agrega texto, folios, firmas y marcas de agua a tu documento PDF:'
                    : 'Add text, folios, signatures, and watermarks to your PDF document:'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono">
              <KpiPill
                icon={FileText}
                title={isEs ? 'Archivos' : 'Files'}
                value={12}
                tooltip={isEs ? 'Tus archivos procesados esta semana' : 'Files processed this week'}
                color="text-white"
              />
              <KpiPill
                icon={HardDrive}
                title={isEs ? 'Ahorrado' : 'Saved'}
                value={1.2}
                decimals={1}
                suffix=" GB"
                tooltip={
                  isEs ? 'Almacenamiento optimizado localmente' : 'Locally optimized storage'
                }
                color="text-zinc-200"
              />
              <KpiPill
                icon={Clock}
                title={isEs ? 'Tiempo' : 'Time'}
                value={45}
                suffix=" min"
                tooltip={
                  isEs ? 'Tiempo ahorrado en tu sesión actual' : 'Time saved in current session'
                }
                color="text-zinc-200"
              />
            </div>
          </div>

          {/* CUADRÍCULA DE HERRAMIENTAS DE EDICIÓN (FULL-WIDTH 3 COLUMNAS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-10">
            {editingTools.map((tool) => {
              const isSelected =
                selectedToolParam === tool.id ||
                (selectedToolParam && tool.path.endsWith(selectedToolParam));

              return (
                <Link
                  key={tool.id}
                  href={tool.path}
                  className="outline-none group/card block h-full"
                >
                  <SpotlightCard
                    className={`h-full bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border ${
                      isSelected
                        ? 'border-white ring-2 ring-white/30 bg-zinc-900/90'
                        : 'border-zinc-600 hover:border-white'
                    } rounded-3xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between group-hover/card:shadow-2xl relative overflow-hidden`}
                  >
                    {/* Línea reflectiva superior */}
                    <div
                      className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
                      aria-hidden="true"
                    />

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-zinc-800 p-3 rounded-2xl border border-zinc-500 text-white shadow-md group-hover/card:scale-105 transition-transform">
                          <tool.icon className="w-5 h-5 text-white" />
                        </div>

                        <div className="bg-white text-black hover:bg-zinc-100 font-bold text-xs px-4 py-1.5 rounded-full font-sans flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] group-hover/card:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                          <span>
                            {isSelected
                              ? isEs
                                ? 'SELECCIONADO'
                                : 'SELECTED'
                              : isEs
                                ? 'Usar Ahora'
                                : 'Use Now'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-black group-hover/card:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      <div className="mb-2 font-mono">
                        <span className="text-xs text-zinc-300 font-bold tracking-wider">
                          {isEs ? tool.tagEs : tool.tagEn}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-white mb-2 tracking-tight font-sans group-hover/card:text-white">
                        {isEs ? tool.titleEs : tool.titleEn}
                      </h2>
                      <p className="text-zinc-300 text-xs font-normal leading-relaxed font-sans line-clamp-3">
                        {isEs ? tool.descEs : tool.descEn}
                      </p>
                    </div>

                    <div className="pt-4 mt-5 border-t border-zinc-700/80 flex items-center justify-between font-mono text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-200 text-[10px] font-bold shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        {isEs ? '100% Local' : '100% Local'}
                      </span>
                      <span className="text-zinc-300 group-hover/card:text-white font-bold group-hover/card:translate-x-0.5 transition-all flex items-center gap-1">
                        {isEs ? 'Iniciar →' : 'Start →'}
                      </span>
                    </div>
                  </SpotlightCard>
                </Link>
              );
            })}
          </div>

          {/* SECCIÓN DE 4 PUNTOS ESTANDARIZADA MONOCROMÁTICA */}
          <div className="w-full mt-4 space-y-8 font-sans">
            {/* 1. CÓMO FUNCIONA PASO A PASO */}
            <SpotlightCard className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3.5 mb-6 border-b border-zinc-700/80 pb-4">
                <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-500 text-white shadow-md">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  {isEs
                    ? '1. Cómo editar archivos PDF paso a paso'
                    : '1. How to edit PDF files step by step'}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    step: '01',
                    es: 'Selecciona la herramienta deseada o sube tu documento PDF.',
                    en: 'Select desired tool or upload your PDF document.',
                  },
                  {
                    step: '02',
                    es: 'El visor carga las páginas y capas de edición en la memoria local.',
                    en: 'The viewer loads pages and editing layers into local memory.',
                  },
                  {
                    step: '03',
                    es: 'Agrega texto, folios, firmas, sellos o aplica OCR según necesites.',
                    en: 'Add text, folios, signatures, watermarks or apply OCR as needed.',
                  },
                  {
                    step: '04',
                    es: 'Guarda los cambios y descarga tu PDF editado con máxima resolución.',
                    en: 'Save changes and download your edited PDF with maximum resolution.',
                  },
                ].map((item, i) => (
                  <SpotlightCard
                    key={i}
                    className="bg-zinc-800/80 border border-zinc-600 rounded-2xl p-5 flex flex-col gap-2.5 shadow-md"
                  >
                    <span className="text-[10px] font-mono font-bold text-white bg-zinc-800 border border-zinc-500 px-2.5 py-0.5 rounded-full w-fit shadow-sm">
                      Paso {item.step}
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                      {isEs ? item.es : item.en}
                    </p>
                  </SpotlightCard>
                ))}
              </div>
            </SpotlightCard>

            {/* 2. LIMITACIONES Y CONSEJOS ÚTILES */}
            <SpotlightCard className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3.5 mb-6 border-b border-zinc-700/80 pb-4">
                <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-500 text-white shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  {isEs ? '2. Limitaciones y consejos útiles' : '2. Limitations & useful tips'}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3 bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 shadow-md">
                  <h4 className="text-xs font-mono text-white font-bold uppercase tracking-wider border-b border-zinc-700 pb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}
                  </h4>
                  {[
                    isEs
                      ? 'Agregar texto nuevo, firmas manuscritas y números de folios correlativos.'
                      : 'Add new text, handwritten signatures, and sequential page numbering.',
                    isEs
                      ? 'Aplicar marcas de agua de seguridad y sellos notariales vectoriales.'
                      : 'Apply security watermarks and vector notarial stamps.',
                    isEs
                      ? 'Reconocimiento óptico de caracteres (OCR) para hacer texto seleccionable.'
                      : 'Optical character recognition (OCR) to make text selectable.',
                    isEs
                      ? 'Conservar fuentes vectoriales y maquetación original sin compresión destructiva.'
                      : 'Preserve vector fonts and original layout without lossy compression.',
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span className="text-white font-bold flex-shrink-0 mt-0.5">•</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 shadow-md">
                  <h4 className="text-xs font-mono text-zinc-200 font-bold uppercase tracking-wider border-b border-zinc-700 pb-2.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-white" />
                    {isEs ? 'CONSEJOS RECOMENDADOS' : 'RECOMMENDED TIPS'}
                  </h4>
                  {[
                    isEs
                      ? 'Usa imágenes con fondo transparente (PNG) para firmas digitales más nítidas.'
                      : 'Use transparent PNG images for sharper, professional digital signatures.',
                    isEs
                      ? 'Verifica la orientación y rango de hojas antes de foliar expedientes extensos.'
                      : 'Verify page orientation and range before numbering large dossiers.',
                    isEs
                      ? 'Emplea navegadores modernos para máximo rendimiento en la edición vectorial.'
                      : 'Use modern browsers for maximum vector editing and rendering performance.',
                    isEs
                      ? 'Todo el procesamiento se ejecuta de forma 100% local en tu memoria RAM.'
                      : 'All processing completes 100% locally in your browser RAM.',
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span className="text-zinc-200 flex-shrink-0 mt-0.5">→</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SpotlightCard>

            {/* 3. PRIVACIDAD Y PROCESAMIENTO LOCAL */}
            <SpotlightCard className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3.5 mb-6 border-b border-zinc-700/80 pb-4">
                <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-500 text-white shadow-md">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  {isEs
                    ? '3. ¿Qué sucede con tu documento al editarlo?'
                    : '3. What happens to your document when editing it?'}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-zinc-300 leading-relaxed">
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-xs block flex items-center gap-2 font-mono">
                    <HardDrive className="w-4 h-4 text-white" />
                    {isEs ? 'Procesamiento 100% local' : '100% local processing'}
                  </strong>
                  <p className="text-xs text-zinc-300 font-normal">
                    {isEs
                      ? 'La edición ocurre íntegramente en la memoria RAM de tu navegador. Ningún byte o dato confidencial sale de tu dispositivo.'
                      : 'Editing occurs strictly inside your browser RAM. Zero bytes or confidential data leave your device.'}
                  </p>
                </SpotlightCard>
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-xs block flex items-center gap-2 font-mono">
                    <Lock className="w-4 h-4 text-white" />
                    {isEs ? 'Seguridad y confidencialidad' : 'Security & confidentiality'}
                  </strong>
                  <p className="text-xs text-zinc-300 font-normal">
                    {isEs
                      ? 'Tus contratos, facturas y firmas permanecen privadas y protegidas sin rastreadores ni accesos externos.'
                      : 'Your contracts, invoices, and signatures remain private and protected without trackers.'}
                  </p>
                </SpotlightCard>
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-xs block flex items-center gap-2 font-mono">
                    <Sparkles className="w-4 h-4 text-white" />
                    {isEs ? 'Descarga directa' : 'Direct download'}
                  </strong>
                  <p className="text-xs text-zinc-300 font-normal">
                    {isEs
                      ? 'El documento resultante se genera al instante con calidad profesional y queda disponible de inmediato.'
                      : 'The resulting document generates instantly with professional quality and is ready immediately.'}
                  </p>
                </SpotlightCard>
              </div>
            </SpotlightCard>

            {/* 4. PREGUNTAS FRECUENTES */}
            <SpotlightCard className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3.5 mb-6 border-b border-zinc-700/80 pb-4">
                <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-500 text-white shadow-md">
                  <HardDrive className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  {isEs ? '4. Preguntas Frecuentes' : '4. Frequently Asked Questions'}
                </h3>
              </div>
              <div className="space-y-4">
                {[
                  {
                    qEs: '¿Las firmas y textos añadidos conservan la calidad vectorial?',
                    qEn: 'Do added signatures and text preserve vector quality?',
                    aEs: 'Sí. Todos los textos, números de folios y sellos se incrustan como vectores de alta precisión, garantizando nitidez perfecta al imprimir o hacer zoom.',
                    aEn: 'Yes. All texts, page numbers, and stamps are embedded as high-precision vectors, ensuring crisp output when printing or zooming.',
                  },
                  {
                    qEs: '¿Mis documentos editados quedan guardados en algún servidor?',
                    qEn: 'Are my edited documents saved on any server?',
                    aEs: 'No. Toda la edición se ejecuta de manera local y autónoma en tu navegador; al cerrar la pestaña los datos se purgan de inmediato.',
                    aEn: 'No. All editing runs locally and autonomously in your browser; once you close the tab, all memory buffers are purged immediately.',
                  },
                ].map((faq, i) => (
                  <SpotlightCard
                    key={i}
                    className="bg-zinc-800/80 border border-zinc-600 rounded-2xl p-5 space-y-2 shadow-md"
                  >
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="text-white font-mono font-bold">Q:</span>{' '}
                      {isEs ? faq.qEs : faq.qEn}
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed pl-5 font-normal">
                      {isEs ? faq.aEs : faq.aEn}
                    </p>
                  </SpotlightCard>
                ))}
              </div>
            </SpotlightCard>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function AnimatedCounter({
  from = 0,
  to,
  decimals = 0,
  suffix = '',
}: {
  from?: number;
  to: number;
  decimals?: number;
  suffix?: string;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(from, to, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate(value: number) {
          node.textContent = value.toFixed(decimals) + suffix;
        },
      });
      return () => controls.stop();
    }
  }, [from, to, decimals, suffix]);
  return (
    <span ref={nodeRef}>
      {from.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function KpiPill({
  icon: Icon,
  title,
  value,
  decimals = 0,
  suffix = '',
  tooltip,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
  decimals?: number;
  suffix?: string;
  tooltip?: string;
  color?: string;
}) {
  return (
    <div className="relative group/kpi">
      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 hover:border-white rounded-full transition-all cursor-help font-mono shadow-sm">
        <Icon className={`w-3.5 h-3.5 ${color || 'text-white'}`} />
        <span className="text-xs font-bold text-white">
          <AnimatedCounter to={value} decimals={decimals} suffix={suffix} />
        </span>
        <span className="text-[10px] text-zinc-300 font-bold uppercase">{title}</span>
      </div>

      {tooltip && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-800 border border-zinc-600 rounded-xl text-[10px] font-mono text-zinc-100 opacity-0 group-hover/kpi:opacity-100 transition-opacity duration-200 pointer-events-none shadow-2xl whitespace-nowrap z-50">
          {tooltip}
        </div>
      )}
    </div>
  );
}

export default function EditarPage() {
  return (
    <Suspense fallback={null}>
      <EditarContent />
    </Suspense>
  );
}
