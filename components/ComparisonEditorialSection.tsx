'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Shield,
  Zap,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ServerOff,
  Cpu,
} from 'lucide-react';
import { ComparisonPageData } from '@/lib/comparisons/types';
import ComparisonTable from './ComparisonTable';
import SpotlightCard from './SpotlightCard';

interface ComparisonEditorialSectionProps {
  data: ComparisonPageData;
  lang?: 'es' | 'en';
}

export default function ComparisonEditorialSection({
  data,
  lang = 'es',
}: ComparisonEditorialSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const isEs = lang === 'es';

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <article className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans space-y-16">
      {/* ── NAVEGACIÓN SUPERIOR ── */}
      <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
        <Link
          href={isEs ? '/' : '/en'}
          className="inline-flex items-center gap-1.5 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {isEs ? 'Inicio' : 'Home'}
        </Link>
        <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-400 font-mono text-[11px]">
          {isEs ? 'Auditoría Técnica Independiente' : 'Independent Technical Audit'}
        </span>
      </div>

      {/* ── CABECERA / HERO ── */}
      <header className="text-center space-y-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-mono text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          {data.badge}
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {data.h1}
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {data.subtitle}
        </p>
      </header>

      {/* ── RESUMEN EJECUTIVO ── */}
      <SpotlightCard className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-[#09090b] p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono">
              {isEs
                ? 'Resumen Ejecutivo: El cambio de paradigma'
                : 'Executive Summary: The Paradigm Shift'}
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              {isEs
                ? 'Computación en Cliente (Client-Side WASM) vs Servidores en la Nube'
                : 'Client-Side WASM vs Cloud-Based Architecture'}
            </p>
          </div>
        </div>
        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
          {data.executiveSummary}
        </p>
      </SpotlightCard>

      {/* ── DIFERENCIAS CLAVE (4 CARDS) ── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {isEs ? '4 Diferencias Técnicas Fundamentales' : '4 Core Technical Differences'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            {isEs
              ? 'Por qué procesar tus archivos en memoria RAM cambia radicalmente la seguridad y la velocidad.'
              : 'Why in-memory RAM processing radically changes security and performance.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.keyDifferences.map((diff, idx) => (
            <SpotlightCard
              key={idx}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 sm:p-6 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  0{idx + 1} / {diff.title}
                </span>
                <ServerOff className="w-4 h-4 text-zinc-500" />
              </div>

              <div className="space-y-2 text-xs sm:text-sm">
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-200">
                  <span className="font-bold text-emerald-400 block mb-1">
                    PDFBlack (100% Local):
                  </span>
                  {diff.pdfblack}
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-400">
                  <span className="font-bold text-zinc-300 block mb-1">{data.competitorName}:</span>
                  {diff.competitor}
                </div>
              </div>

              <p className="text-xs text-zinc-400 pt-1 border-t border-zinc-800/60 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <strong>{isEs ? 'Ventaja:' : 'Benefit:'}</strong> {diff.benefit}
                </span>
              </p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ── TABLA COMPARATIVA COMPLETA ── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {isEs ? 'Matriz Comparativa Detallada' : 'Detailed Comparison Matrix'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            {isEs
              ? 'Contraste punto por punto de privacidad, límites, capacidades y costo.'
              : 'Feature-by-feature breakdown of privacy, limits, capabilities, and pricing.'}
          </p>
        </div>

        <ComparisonTable
          features={data.features}
          competitorName={data.competitorName}
          lang={lang}
        />
      </section>

      {/* ── POR QUÉ CAMBIARSE A PDFBLACK (3 RAZONES) ── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {isEs
              ? `¿Por qué miles de usuarios se cambian de ${data.competitorName} a PDFBlack?`
              : `Why are users switching from ${data.competitorName} to PDFBlack?`}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.whySwitchReasons.map((reason, idx) => (
            <SpotlightCard
              key={idx}
              className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-3"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-800/70 border border-zinc-700/50 flex items-center justify-center text-emerald-400">
                {idx === 0 && <Shield className="w-5 h-5" />}
                {idx === 1 && <Zap className="w-5 h-5" />}
                {idx === 2 && <Lock className="w-5 h-5" />}
              </div>
              <h3 className="text-base font-bold text-white">{reason.title}</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{reason.desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ── EL VEREDICTO ── */}
      <section className="rounded-2xl border border-emerald-900/40 bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-900/60 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-4 relative z-10">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
            {isEs ? 'CONCLUSIÓN TÉCNICA' : 'TECHNICAL CONCLUSION'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{data.verdictTitle}</h2>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">{data.verdictText}</p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-zinc-400">
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              100% Client-Side WASM
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {isEs ? 'Sin Registro' : 'No Registration'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {isEs ? 'Gratis para Siempre' : 'Free Forever'}
            </span>
          </div>
        </div>
      </section>

      {/* ── PREGUNTAS FRECUENTES (FAQS CON ACORDEÓN) ── */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {isEs ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            {isEs
              ? 'Respuestas directas a las dudas habituales sobre privacidad y arquitectura.'
              : 'Direct answers regarding security, privacy, and architecture.'}
          </p>
        </div>

        <div className="space-y-3">
          {data.faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden transition-colors hover:border-zinc-700"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-white focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'transform rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/40 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── HERRAMIENTAS RECOMENDADAS (CTAs DIRECTOS) ── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {isEs
              ? 'Pruébalo ahora mismo: Herramientas Populares'
              : 'Try it right now: Popular Tools'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            {isEs
              ? 'Sin registro, sin descargas previas y sin subir archivos a la nube.'
              : 'No sign-up, no downloads, and zero cloud uploads.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.recommendedTools.map((tool, idx) => (
            <Link
              key={idx}
              href={tool.path}
              className="group block p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:border-emerald-500/40 transition-all shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                  {tool.category}
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                {tool.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
