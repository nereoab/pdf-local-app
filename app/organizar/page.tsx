'use client';

import { Suspense, useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, animate } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowRight,
  FolderOpen,
  FileText,
  Scissors,
  RotateCw,
  Trash2,
  Merge,
  LayoutGrid,
  Crop,
  ShieldCheck,
  HardDrive,
  Clock,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import SpotlightCard from '@/components/SpotlightCard';

function OrganizarContent() {
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

  const organizingTools = [
    {
      id: 'unir',
      tagEs: '001 / UNIR ARCHIVOS',
      tagEn: '001 / MERGE FILES',
      titleEs: 'Unir PDF',
      titleEn: 'Merge PDF',
      descEs: 'Une múltiples archivos PDF en un solo documento organizado en segundos.',
      descEn: 'Combine multiple PDF files into one organized document in seconds.',
      icon: Merge,
      path: '/organizar/unir',
    },
    {
      id: 'dividir',
      tagEs: '002 / SEPARAR EN PARTES',
      tagEn: '002 / SPLIT PAGES',
      titleEs: 'Dividir Archivo PDF',
      titleEn: 'Split PDF File',
      descEs: 'Separa un PDF en varias partes de una o varias páginas según necesites.',
      descEn: 'Extract one or multiple pages into separate PDF files as needed.',
      icon: Scissors,
      path: '/organizar/dividir',
    },
    {
      id: 'eliminar',
      tagEs: '003 / BORRAR PÁGINAS',
      tagEn: '003 / REMOVE PAGES',
      titleEs: 'Eliminar Páginas PDF',
      titleEn: 'Delete PDF Pages',
      descEs: 'Selecciona y elimina las páginas no deseadas de tu archivo PDF fácilmente.',
      descEn: 'Select and remove unwanted pages from your PDF file easily.',
      icon: Trash2,
      path: '/organizar/eliminar',
    },
    {
      id: 'reordenar',
      tagEs: '004 / REORDENAR',
      tagEn: '004 / REORDER',
      titleEs: 'Reordenar PDF',
      titleEn: 'Reorder PDF',
      descEs: 'Arrastra y suelta páginas para cambiar su orden en el documento.',
      descEn: 'Drag and drop pages to change their order in the document.',
      icon: LayoutGrid,
      path: '/organizar/reordenar',
    },
    {
      id: 'rotar',
      tagEs: '005 / ROTAR PÁGINAS',
      tagEn: '005 / ROTATE PAGES',
      titleEs: 'Rotar PDF',
      titleEn: 'Rotate PDF',
      descEs: 'Gira las páginas de tu PDF fácilmente y con precisión visual.',
      descEn: 'Rotate your PDF pages easily with clear visual feedback.',
      icon: RotateCw,
      path: '/organizar/rotar',
    },
    {
      id: 'recortar',
      tagEs: '006 / RECORTAR MÁRGENES',
      tagEn: '006 / CROP MARGINS',
      titleEs: 'Recortar PDF',
      titleEn: 'Crop PDF',
      descEs: 'Recorta márgenes y ajusta encuadres de tu documento PDF.',
      descEn: 'Crop margins and adjust framing of your PDF document.',
      icon: Crop,
      path: '/organizar/recortar',
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
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {isEs ? '002 / HERRAMIENTAS DE ORGANIZAR PDF' : '002 / PDF ORGANIZATION TOOLS'}
                  </h1>
                  {/* INSIGNIA DE CONFIANZA MONOCROMÁTICA */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-white text-xs font-mono font-bold shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    {isEs ? '100% Local • Cero Servidores' : '100% Local • Zero Servers'}
                  </span>
                </div>
                <p className="text-zinc-300 text-xs sm:text-sm font-mono mt-1">
                  {isEs
                    ? 'Administra las páginas y la estructura de tu documento PDF:'
                    : 'Manage the pages and structure of your PDF document:'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono">
              <KpiPill
                icon={FileText}
                title={isEs ? 'Archivos' : 'Files'}
                value={18}
                tooltip={
                  isEs ? 'Tus archivos organizados esta semana' : 'Files organized this week'
                }
                color="text-white"
              />
              <KpiPill
                icon={HardDrive}
                title={isEs ? 'Ahorrado' : 'Saved'}
                value={2.4}
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
                value={60}
                suffix=" min"
                tooltip={
                  isEs ? 'Tiempo ahorrado en tu sesión actual' : 'Time saved in current session'
                }
                color="text-zinc-200"
              />
            </div>
          </div>

          {/* CUADRÍCULA DE HERRAMIENTAS DE ORGANIZACIÓN (FULL-WIDTH 3 COLUMNAS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-10">
            {organizingTools.map((tool) => {
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
                    ? '1. Cómo organizar archivos PDF paso a paso'
                    : '1. How to organize PDF files step by step'}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    step: '01',
                    es: 'Selecciona la herramienta deseada o sube tus documentos PDF.',
                    en: 'Select desired tool or upload your PDF documents.',
                  },
                  {
                    step: '02',
                    es: 'El motor carga las miniaturas de todas las páginas en memoria local.',
                    en: 'The engine loads thumbnails of all pages into local memory.',
                  },
                  {
                    step: '03',
                    es: 'Reordena, rota, elimina o recorta páginas en tiempo real.',
                    en: 'Reorder, rotate, delete, or crop pages in real time.',
                  },
                  {
                    step: '04',
                    es: 'Compila y descarga tu nuevo documento PDF 100% ordenado.',
                    en: 'Compile and download your new 100% organized PDF document.',
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
                      ? 'Unir múltiples documentos PDF en un solo archivo continuo y ordenado.'
                      : 'Merge multiple PDF documents into a single continuous, ordered file.',
                    isEs
                      ? 'Dividir y extraer rangos de páginas específicas hacia archivos independientes.'
                      : 'Split and extract specific page ranges into independent PDF files.',
                    isEs
                      ? 'Reordenar visualmente las páginas arrastrando y soltando miniaturas.'
                      : 'Visually reorder pages by dragging and dropping thumbnails.',
                    isEs
                      ? 'Rotar páginas individuales o documentos completos con corrección de orientación.'
                      : 'Rotate individual pages or entire documents with orientation fix.',
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
                      ? 'Revisa la vista previa de miniaturas para confirmar el orden antes de compilar.'
                      : 'Review the thumbnail preview to confirm page order before compiling.',
                    isEs
                      ? 'Para unir archivos grandes, asegúrate de que todos los PDFs estén sin contraseñas.'
                      : 'For merging large files, ensure all PDFs are unlocked and without passwords.',
                    isEs
                      ? 'El recorte de márgenes elimina espacios en blanco sin perder nitidez de texto.'
                      : 'Margin cropping trims white borders without losing vector text crispness.',
                    isEs
                      ? 'Todo el ensamblado se procesa 100% en la memoria RAM de tu navegador.'
                      : 'All assembly processes 100% locally inside your browser RAM.',
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
                    ? '3. ¿Qué sucede con tu documento al organizarlo?'
                    : '3. What happens to your document when organizing it?'}
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
                      ? 'Tus archivos se unen, dividen o reordenan estrictamente dentro de la memoria RAM de tu navegador. Cero bytes tocan servidores externos.'
                      : 'Your files are merged, split, or reordered strictly inside browser RAM. Zero bytes touch external servers.'}
                  </p>
                </SpotlightCard>
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-xs block flex items-center gap-2 font-mono">
                    <Lock className="w-4 h-4 text-white" />
                    {isEs ? 'Seguridad y confidencialidad' : 'Security & confidentiality'}
                  </strong>
                  <p className="text-xs text-zinc-300 font-normal">
                    {isEs
                      ? 'La estructura original, fuentes vectoriales e imágenes se conservan intactas en máxima calidad sin compresión destructiva.'
                      : 'Original structure, vector fonts, and images remain intact in full quality without lossy compression.'}
                  </p>
                </SpotlightCard>
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-xs block flex items-center gap-2 font-mono">
                    <Sparkles className="w-4 h-4 text-white" />
                    {isEs ? 'Descarga directa' : 'Direct download'}
                  </strong>
                  <p className="text-xs text-zinc-300 font-normal">
                    {isEs
                      ? 'El nuevo documento organizado se genera al instante y queda listo para descargar en tu dispositivo inmediatamente.'
                      : 'The newly organized document generates instantly and is ready to download to your device immediately.'}
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
                    qEs: '¿Existe algún límite de páginas o archivos para unir y organizar?',
                    qEn: 'Is there a page or file limit when merging and organizing?',
                    aEs: 'No hay límites artificiales. Puedes unir o reorganizar tantos documentos como la memoria RAM de tu dispositivo permita.',
                    aEn: 'No artificial limits. You can merge or reorganize as many documents as your device RAM allows.',
                  },
                  {
                    qEs: '¿Se pierde calidad o texto seleccionable al dividir o rotar páginas?',
                    qEn: 'Is quality or selectable text lost when splitting or rotating pages?',
                    aEs: 'No. Las operaciones de organización no rasterizan ni comprimen el contenido; conservan todas las fuentes y vectores originales.',
                    aEn: 'No. Organization operations do not rasterize or compress content; all original fonts and vectors remain intact.',
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

export default function OrganizarPage() {
  return (
    <Suspense fallback={null}>
      <OrganizarContent />
    </Suspense>
  );
}
