'use client';

import { Suspense, useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, animate } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Unlock,
  EyeOff,
  FileText,
  HardDrive,
  Clock,
  Sparkles,
  Sliders,
  Activity,
  GitCompare,
  CheckCircle2,
} from 'lucide-react';
import SpotlightCard from '@/components/SpotlightCard';

function OptimizarContent() {
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

  const optimizationTools = [
    {
      id: 'comprimir',
      tagEs: '001 / COMPRIMIR TAMAÑO',
      tagEn: '001 / COMPRESS SIZE',
      titleEs: 'Comprimir PDF',
      titleEn: 'Compress PDF',
      descEs: 'Reduce el peso de tu archivo optimizando la calidad máxima del documento.',
      descEn: 'Reduce file size while optimizing for maximal PDF quality.',
      icon: Sliders,
      path: '/optimizar/comprimir',
    },
    {
      id: 'reparar',
      tagEs: '002 / REPARAR Y RECUPERAR',
      tagEn: '002 / REPAIR RECOVERY',
      titleEs: 'Reparar PDF',
      titleEn: 'Repair PDF',
      descEs: 'Sube un PDF dañado o corrupto e intentaremos reparar e integrar sus datos.',
      descEn: 'Upload a corrupt PDF and we will try to fix and recover it.',
      icon: Activity,
      path: '/optimizar/reparar',
    },
    {
      id: 'desbloquear',
      tagEs: '003 / DESBLOQUEAR ACCESO',
      tagEn: '003 / UNLOCK ACCESS',
      titleEs: 'Desbloquear PDF',
      titleEn: 'Unlock PDF',
      descEs: 'Remueve la seguridad y contraseñas para usar y copiar tus PDFs libremente.',
      descEn: 'Remove PDF password security, giving freedom to use your PDFs.',
      icon: Unlock,
      path: '/optimizar/desbloquear',
    },
    {
      id: 'proteger',
      tagEs: '004 / PROTEGER CIFRADO',
      tagEn: '004 / PROTECT ENCRYPTION',
      titleEs: 'Proteger PDF',
      titleEn: 'Protect PDF',
      descEs: 'Encripta tu archivo PDF con contraseña para proteger datos confidenciales.',
      descEn: 'Encrypt your PDF with a password to keep sensitive data confidential.',
      icon: Lock,
      path: '/optimizar/proteger',
    },
    {
      id: 'censurar',
      tagEs: '005 / CENSURAR PRIVADO',
      tagEn: '005 / REDACT SENSITIVE',
      titleEs: 'Censurar PDF',
      titleEn: 'Redact PDF',
      descEs: 'Remueve contenido confidencial o sensible de las páginas de tu PDF.',
      descEn: 'Remove sensitive content and text from PDF documents.',
      icon: EyeOff,
      path: '/optimizar/censurar',
    },
    {
      id: 'comparar',
      tagEs: '006 / COMPARAR DIFERENCIAS',
      tagEn: '006 / COMPARE DIFFERENCES',
      titleEs: 'Comparar PDF',
      titleEn: 'Compare PDF',
      descEs: 'Muestra fácilmente las diferencias y cambios entre dos archivos PDF similares.',
      descEn: 'Easily display the differences between two similar PDF files.',
      icon: GitCompare,
      path: '/optimizar/comparar',
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
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {isEs ? '004 / HERRAMIENTAS DE OPTIMIZAR PDF' : '004 / PDF OPTIMIZATION TOOLS'}
                  </h1>
                  {/* INSIGNIA DE CONFIANZA MONOCROMÁTICA */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-white text-xs font-mono font-bold shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    {isEs ? '100% Local • Cero Servidores' : '100% Local • Zero Servers'}
                  </span>
                </div>
                <p className="text-zinc-300 text-xs sm:text-sm font-mono mt-1">
                  {isEs
                    ? 'Reduce el peso o repara la integridad de tu archivo PDF:'
                    : 'Reduce file size or repair the integrity of your PDF file:'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono">
              <KpiPill
                icon={FileText}
                title={isEs ? 'Archivos' : 'Files'}
                value={15}
                tooltip={
                  isEs ? 'Tus archivos optimizados esta semana' : 'Files optimized this week'
                }
                color="text-white"
              />
              <KpiPill
                icon={HardDrive}
                title={isEs ? 'Ahorrado' : 'Saved'}
                value={4.8}
                decimals={1}
                suffix=" GB"
                tooltip={isEs ? 'Espacio en disco comprimido' : 'Compressed disk space'}
                color="text-zinc-200"
              />
              <KpiPill
                icon={Clock}
                title={isEs ? 'Tiempo' : 'Time'}
                value={35}
                suffix=" min"
                tooltip={
                  isEs ? 'Tiempo ahorrado en tu sesión actual' : 'Time saved in current session'
                }
                color="text-zinc-200"
              />
            </div>
          </div>

          {/* CUADRÍCULA DE HERRAMIENTAS DE OPTIMIZACIÓN (FULL-WIDTH 3 COLUMNAS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-10">
            {optimizationTools.map((tool) => {
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

          {/* ENCABEZADO DE GUÍA TÉCNICA Y PRIVACIDAD */}
          <div className="w-full mt-14 mb-8 pt-8 border-t border-zinc-800 flex flex-col items-center text-center font-mono">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs font-bold rounded-full mb-3 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              {isEs ? '100% SEGURO • CERO SERVIDORES' : '100% SECURE • ZERO SERVERS'}
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2 font-sans">
              {isEs
                ? 'Cómo funciona el procesamiento local de tus archivos'
                : 'How local file processing works'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 font-mono max-w-2xl">
              {isEs
                ? 'Conoce el flujo de trabajo, consejos prácticos, protección de datos y preguntas frecuentes.'
                : 'Learn about the workflow, practical tips, data protection, and frequently asked questions.'}
            </p>
          </div>

          {/* SECCIÓN DE 4 PUNTOS ESTANDARIZADA MONOCROMÁTICA */}
          <div className="w-full space-y-8 font-sans">
            {/* 1. CÓMO FUNCIONA PASO A PASO */}
            <SpotlightCard className="bg-gradient-to-b from-[#18181f] via-[#111116] to-[#0a0a0d] border border-zinc-600 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3.5 mb-6 border-b border-zinc-700/80 pb-4">
                <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-500 text-white shadow-md">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  {isEs
                    ? '1. Cómo optimizar, proteger y reparar archivos PDF paso a paso'
                    : '1. How to optimize, protect, and repair PDF files step by step'}
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
                    es: 'El motor analiza el flujo de datos y estructura interna del PDF.',
                    en: 'The engine parses data streams and internal PDF structure.',
                  },
                  {
                    step: '03',
                    es: 'Aplica la compresión, clave de cifrado o censura de datos sensibles.',
                    en: 'Apply compression, encryption password, or redaction of sensitive data.',
                  },
                  {
                    step: '04',
                    es: 'Descarga tu archivo optimizado y protegido de forma inmediata.',
                    en: 'Download your optimized and secured file immediately.',
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
                      ? 'Comprimir el tamaño de archivo reduciendo metadatos y optimizando imágenes.'
                      : 'Compress file size by reducing metadata and optimizing images.',
                    isEs
                      ? 'Cifrar documentos con contraseña robusta mediante estándares criptográficos.'
                      : 'Encrypt documents with strong passwords using cryptographic standards.',
                    isEs
                      ? 'Reparar estructuras de PDF dañadas o con índices de páginas corruptos.'
                      : 'Repair damaged PDF structures or corrupted page indices.',
                    isEs
                      ? 'Censurar y ocultar información confidencial de forma 100% permanente.'
                      : 'Redact and hide confidential information permanently.',
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
                      ? 'Elige compresión equilibrada para mantener alta nitidez en gráficos técnicos.'
                      : 'Choose balanced compression to maintain high crispness in technical graphics.',
                    isEs
                      ? 'Guarda tus contraseñas en un lugar seguro antes de proteger archivos confidenciales.'
                      : 'Store your passwords safely before protecting confidential documents.',
                    isEs
                      ? 'La censura elimina de raíz las capas vectoriales impidiendo la copia del texto.'
                      : 'Redaction removes vector layers permanently, preventing text copying.',
                    isEs
                      ? 'Todo el análisis y compresión se completa 100% en la memoria RAM de tu equipo.'
                      : 'All analysis and compression run 100% locally in your device RAM.',
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
                    ? '3. ¿Qué sucede con tu documento al optimizarlo?'
                    : '3. What happens to your document when optimizing it?'}
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
                      ? 'Tus archivos se comprimen, reparan, cifran o censuran exclusivamente en tu navegador. Cero bytes abandonan tu dispositivo.'
                      : 'Your files are compressed, repaired, encrypted, or redacted exclusively in your browser. Zero bytes leave your device.'}
                  </p>
                </SpotlightCard>
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-xs block flex items-center gap-2 font-mono">
                    <Lock className="w-4 h-4 text-white" />
                    {isEs ? 'Seguridad y confidencialidad' : 'Security & confidentiality'}
                  </strong>
                  <p className="text-xs text-zinc-300 font-normal">
                    {isEs
                      ? 'Las operaciones de clave y redacción permanente ocultan datos sensibles o protegen documentos sin intermediarios.'
                      : 'Key and redaction operations hide sensitive data or protect documents with zero intermediaries.'}
                  </p>
                </SpotlightCard>
                <SpotlightCard className="bg-zinc-800/80 p-5 rounded-2xl border border-zinc-600 space-y-2 shadow-md">
                  <strong className="text-white font-bold text-xs block flex items-center gap-2 font-mono">
                    <Sparkles className="w-4 h-4 text-white" />
                    {isEs ? 'Descarga directa' : 'Direct download'}
                  </strong>
                  <p className="text-xs text-zinc-300 font-normal">
                    {isEs
                      ? 'Al finalizar el proceso, la memoria RAM libera automáticamente todos los buffers y el archivo queda descargado.'
                      : 'Upon completion, browser RAM automatically purges all buffers and the file is ready immediately.'}
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
                    qEs: '¿Cómo funciona la compresión sin enviar el archivo a un servidor?',
                    qEn: 'How does compression work without sending the file to a server?',
                    aEs: 'Se ejecuta un motor local en WebAssembly que reescribe y optimiza los flujos de compresión y elementos gráficos directamente en tu navegador.',
                    aEn: 'A local WebAssembly engine runs in your browser, rewriting and optimizing compression streams and graphics directly.',
                  },
                  {
                    qEs: '¿La censura de texto es verdaderamente irreversible?',
                    qEn: 'Is text redaction truly permanent and irreversible?',
                    aEs: 'Sí. El contenido censurado se destruye a nivel vectorial dentro del archivo PDF, impidiendo que el texto original sea extraído o copiado.',
                    aEn: 'Yes. Redacted content is destroyed at the vector level inside the PDF, preventing any extraction or copying.',
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

export default function OptimizarPage() {
  return (
    <Suspense fallback={null}>
      <OptimizarContent />
    </Suspense>
  );
}
