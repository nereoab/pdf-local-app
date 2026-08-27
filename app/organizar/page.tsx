'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
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

          {/* SECCIÓN: 3 PASOS PARA ORGANIZAR PDF */}
          <div className="w-full mt-14 pt-10 border-t border-zinc-800 flex flex-col items-center font-mono">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs font-bold rounded-full mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              {isEs ? '000 / PASOS DE ORGANIZACIÓN' : '000 / ORGANIZATION STEPS'}
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-8 font-sans">
              {isEs ? 'Solo 3 pasos para organizar tu PDF' : 'Only 3 steps to organize your PDF'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {/* PASO 1 */}
              <SpotlightCard className="flex flex-col items-start p-6 sm:p-7 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-zinc-300 rounded-3xl transition-all shadow-xl font-mono">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-500 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-md">
                  1
                </div>
                <h4 className="text-sm font-bold text-white mb-2 font-sans">
                  {isEs ? '1. Selecciona la herramienta' : '1. Select the tool'}
                </h4>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed font-normal">
                  {isEs
                    ? 'Elige la función exacta que deseas realizar (Unir, Dividir, Eliminar, Rotar, Reordenar o Recortar).'
                    : 'Choose the exact function you need (Merge, Split, Delete, Rotate, Reorder, or Crop).'}
                </p>
              </SpotlightCard>

              {/* PASO 2 */}
              <SpotlightCard className="flex flex-col items-start p-6 sm:p-7 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-zinc-300 rounded-3xl transition-all shadow-xl font-mono">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-500 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-md">
                  2
                </div>
                <h4 className="text-sm font-bold text-white mb-2 font-sans">
                  {isEs ? '2. Reorganiza tus páginas' : '2. Reorganize your pages'}
                </h4>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed font-normal">
                  {isEs
                    ? 'Carga tus archivos y ajusta el orden o la selección de páginas de forma visual e interactiva.'
                    : 'Upload your files and adjust page order or selection visually and interactively.'}
                </p>
              </SpotlightCard>

              {/* PASO 3 */}
              <SpotlightCard className="flex flex-col items-start p-6 sm:p-7 bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 hover:border-zinc-300 rounded-3xl transition-all shadow-xl font-mono">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-500 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-md">
                  3
                </div>
                <h4 className="text-sm font-bold text-white mb-2 font-sans">
                  {isEs ? '3. Descarga instantánea' : '3. Instant download'}
                </h4>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed font-normal">
                  {isEs
                    ? 'Obtén tu nuevo documento PDF organizado de manera privada y 100% local.'
                    : 'Get your newly organized PDF document privately and 100% locally.'}
                </p>
              </SpotlightCard>
            </div>
          </div>

          {/* SECCIÓN DETALLADA: ¿QUÉ SUCEDE CON TU ARCHIVO PDF Y EXPLICACIÓN DE HERRAMIENTAS DE ORGANIZACIÓN */}
          <div className="w-full mt-12 space-y-8 font-sans">
            {/* BLOQUE 1: ¿QUÉ SUCEDE CON TU ARCHIVO PDF? (PRIVACIDAD Y SEGURIDAD LOCAL) */}
            <SpotlightCard className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="bg-zinc-800 p-3 rounded-2xl border border-zinc-500 text-white shadow-md">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">
                    {isEs
                      ? '¿Qué sucede exactamente con tu archivo PDF al organizarlo?'
                      : 'What exactly happens to your PDF file when organized?'}
                  </h3>
                  <span className="text-xs font-mono text-zinc-200 font-bold flex items-center gap-1.5 mt-0.5">
                    <Lock className="w-3.5 h-3.5 text-white" />
                    {isEs
                      ? 'PRIVACIDAD ABSOLUTA • PROCESAMIENTO 100% LOCAL EN RAM • SIN SERVIDORES'
                      : 'ABSOLUTE PRIVACY • 100% LOCAL RAM PROCESSING • ZERO SERVERS'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                    <HardDrive className="w-4 h-4 text-white" />
                    {isEs ? '1. Ejecución Local en tu Navegador' : '1. Local Browser Execution'}
                  </strong>
                  <p className="font-normal text-zinc-300">
                    {isEs
                      ? 'Tus archivos PDF se unen, dividen, reordenan o recortan exclusivamente dentro de la memoria RAM de tu navegador. Ningún dato o página se sube a servidores externos.'
                      : 'Your PDF files are merged, split, reordered, or cropped exclusively within your browser RAM. Zero data or pages are uploaded to external servers.'}
                  </p>
                </SpotlightCard>

                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                    <Lock className="w-4 h-4 text-white" />
                    {isEs
                      ? '2. Conservación de Calidad y Vectores'
                      : '2. Quality & Vector Integrity'}
                  </strong>
                  <p className="font-normal text-zinc-300">
                    {isEs
                      ? 'Al reorganizar o extraer páginas, el contenido original (texto seleccionable, fuentes e imágenes) se conserva intacto en máxima resolución sin compresión destructiva.'
                      : 'When reorganizing or extracting pages, original content (selectable text, fonts, and images) remains intact in full resolution without lossy compression.'}
                  </p>
                </SpotlightCard>

                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-sm block flex items-center gap-2 font-mono">
                    <Sparkles className="w-4 h-4 text-white" />
                    {isEs ? '3. Purga Automática de Memoria' : '3. Automatic Memory Purge'}
                  </strong>
                  <p className="font-normal text-zinc-300">
                    {isEs
                      ? 'Una vez descargado el nuevo documento organizado o al cerrar la sesión, los datos procesados en la memoria RAM se purgan por completo inmediatamente.'
                      : 'Once the newly organized document is downloaded or session ends, processed buffers in RAM are completely purged immediately.'}
                  </p>
                </SpotlightCard>
              </div>
            </SpotlightCard>

            {/* BLOQUE 2: GUÍA EXPLICATIVA DE TODAS LAS HERRAMIENTAS DE ORGANIZACIÓN */}
            <SpotlightCard className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3.5 mb-6 border-b border-zinc-700/80 pb-4">
                <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-500 text-white shadow-md">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight font-sans">
                    {isEs
                      ? 'Herramientas disponibles en el Módulo de Organización'
                      : 'Available Tools in the Organization Module'}
                  </h3>
                  <p className="text-xs text-zinc-300 font-mono">
                    {isEs
                      ? 'Conoce en detalle las 6 funciones avanzadas para administrar la estructura de tus archivos PDF.'
                      : 'Learn in detail about the 6 advanced functions to manage your PDF files layout.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
                {organizingTools.map((tool) => (
                  <SpotlightCard
                    key={tool.id}
                    className="bg-zinc-800/80 border border-zinc-600 hover:border-white rounded-2xl p-5 transition-all flex flex-col justify-between shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-500 text-white">
                          <tool.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-300 font-bold tracking-wider">
                          {isEs ? tool.tagEs : tool.tagEn}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2">
                        {isEs ? tool.titleEs : tool.titleEn}
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                        {isEs ? tool.descEs : tool.descEn}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-700 flex items-center justify-between text-[11px] font-mono text-zinc-200 font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" /> 100% Local
                      </span>
                      <span className="text-zinc-400 font-sans font-normal">
                        {isEs ? 'Sin Servidores' : 'No Servers'}
                      </span>
                    </div>
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
