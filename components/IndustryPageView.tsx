'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Shield,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  HelpCircle,
  FileCheck,
  Lock,
  Cpu,
  ServerOff,
} from 'lucide-react';
import { IndustryPageData } from '@/lib/industries/types';
import SpotlightCard from './SpotlightCard';

interface IndustryPageViewProps {
  data: IndustryPageData;
  lang?: 'es' | 'en';
}

export default function IndustryPageView({ data, lang = 'es' }: IndustryPageViewProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const isEs = lang === 'es';

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const hubHref = isEs ? '/industrias' : '/en/industries';
  const challenges = isEs ? data.challenges : data.challengesEn;
  const keyBenefits = isEs ? data.keyBenefits : data.keyBenefitsEn;
  const faqs = isEs ? data.faqs : data.faqsEn;

  return (
    <article className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans space-y-16">
      {/* ── BREADCRUMB & NAVEGACIÓN ── */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center justify-between font-mono text-xs text-zinc-400"
      >
        <ol className="flex items-center gap-2 flex-wrap">
          <li>
            <Link
              href={isEs ? '/' : '/en'}
              className="hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              {isEs ? 'Inicio' : 'Home'}
            </Link>
          </li>
          <li className="text-zinc-600">/</li>
          <li>
            <Link
              href={hubHref}
              className="hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full"
            >
              {isEs ? 'Industrias' : 'Industries'}
            </Link>
          </li>
          <li className="text-zinc-600">/</li>
          <li className="text-zinc-300 font-semibold truncate max-w-[200px] sm:max-w-none">
            {isEs ? data.name : data.nameEn}
          </li>
        </ol>

        <span className="hidden sm:inline-block bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-400 font-mono text-[11px]">
          {data.heroBadge}
        </span>
      </nav>

      {/* ── HERO HEADER ── */}
      <header className="space-y-4 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-mono text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          {data.heroBadge}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {isEs ? data.h1 : data.h1En}
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
          {isEs ? data.subtitle : data.subtitleEn}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4">
          {data.stats.map((st, sIdx) => (
            <div
              key={sIdx}
              className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 text-center"
            >
              <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">
                {st.value}
              </div>
              <div className="text-[11px] sm:text-xs text-zinc-400 font-mono mt-0.5">
                {isEs ? st.label : st.labelEn}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ── NORMAS Y ESTÁNDARES DE CUMPLIMIENTO ── */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 text-white font-semibold text-xl">
          <FileCheck className="w-5 h-5 text-emerald-400" />
          <h2>
            {isEs
              ? 'Marcos Normativos y Estándares Aplicables'
              : 'Regulatory Frameworks & Compliance Standards'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.complianceStandards.map((std, idx) => (
            <div
              key={idx}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded uppercase inline-block">
                  {std.badge}
                </span>
                <h3 className="text-base font-bold text-zinc-100">{std.name}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{std.description}</p>
              </div>
              <div className="pt-2 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500 truncate">
                {std.authority}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DESAFÍOS DEL SECTOR VS SOLUCIÓN LOCAL ── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-white font-semibold text-xl">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h2>
            {isEs
              ? 'Riesgos de la Nube Tradicional vs Solución Local en Memoria RAM'
              : 'Traditional Cloud Risks vs On-Device RAM Execution'}
          </h2>
        </div>

        <div className="space-y-4">
          {challenges.map((ch, cIdx) => (
            <div
              key={cIdx}
              className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                {ch.problem}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1 text-xs">
                <div className="bg-rose-950/20 border border-rose-900/40 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-rose-400 block">
                    {isEs ? 'Riesgo con Herramientas Cloud' : 'Cloud Vendor Risk'}
                  </span>
                  <p className="text-rose-200/90 leading-relaxed">{ch.risk}</p>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-900/40 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block">
                    {isEs ? 'Garantía PDFBlack (Zero-Knowledge)' : 'PDFBlack Guarantee'}
                  </span>
                  <p className="text-emerald-200/90 leading-relaxed">{ch.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HERRAMIENTAS RECOMENDADAS PARA ESTA INDUSTRIA ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold text-xl">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h2>
              {isEs
                ? 'Herramientas PDF Especializadas para este Sector'
                : 'Specialized PDF Tools for this Sector'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.recommendedTools.map((tool, tIdx) => {
            const toolHref = isEs ? tool.pathEs : tool.pathEn;
            const toolName = isEs ? tool.name : tool.nameEn;
            const toolReason = isEs ? tool.reason : tool.reasonEn;

            return (
              <SpotlightCard
                key={tIdx}
                className="bg-zinc-950/80 border border-zinc-800/80 hover:border-emerald-500/40 p-5 rounded-2xl flex flex-col justify-between group transition-all"
              >
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded uppercase inline-block">
                    {tool.badge}
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {toolName}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{toolReason}</p>
                </div>

                <div className="pt-4 mt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-500">
                    {isEs ? '100% en Navegador' : '100% In-Browser'}
                  </span>
                  <Link
                    href={toolHref}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group-hover:translate-x-0.5"
                  >
                    {isEs ? 'Abrir Herramienta' : 'Open Tool'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </section>

      {/* ── BENEFICIOS ARQUITECTÓNICOS CLAVE ── */}
      <section className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 text-white font-semibold text-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <h2>
            {isEs
              ? 'Ventajas Operativas para Equipos Corporativos'
              : 'Operational Advantages for Enterprise Teams'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {keyBenefits.map((ben, bIdx) => (
            <div key={bIdx} className="space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
                {bIdx + 1}
              </div>
              <h3 className="text-sm font-bold text-zinc-100">{ben.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{ben.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACORDEÓN DE PREGUNTAS FRECUENTES (FAQ) ── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-white font-semibold text-xl">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <h2>
            {isEs
              ? 'Preguntas Frecuentes sobre Seguridad y Cumplimiento'
              : 'Security & Compliance Frequently Asked Questions'}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, fIdx) => {
            const isOpen = openFaq === fIdx;
            return (
              <div
                key={fIdx}
                className="border border-zinc-800 rounded-2xl bg-zinc-900/50 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(fIdx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-semibold text-zinc-100">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-zinc-400 transition-transform duration-200 shrink-0 ${
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
                    >
                      <div className="px-5 pb-5 text-sm text-zinc-400 border-t border-zinc-800/60 pt-4 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER INTERNO: AUDITORÍA EN VIVO ── */}
      <footer className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-900/40 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-950/20">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold uppercase">
            <Lock className="w-3.5 h-3.5" />
            {isEs ? 'Auditoría Técnica Independiente' : 'Independent Technical Audit'}
          </div>
          <h3 className="text-2xl font-bold text-white">
            {isEs
              ? 'Sin Registro, Sin Cuotas y Sin Servidores'
              : 'No Signup, No Subscriptions, Zero Cloud'}
          </h3>
          <p className="text-sm text-zinc-400 max-w-xl">
            {isEs
              ? 'Prueba el motor local de PDFBlack con tus documentos confidenciales y comprueba que ninguna información sale de tu equipo.'
              : 'Test PDFBlack with your confidential files and verify that zero bytes travel across the internet.'}
          </p>
        </div>

        <Link
          href={isEs ? data.recommendedTools[0].pathEs : data.recommendedTools[0].pathEn}
          className="shrink-0 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-3.5 rounded-full text-sm transition-all shadow-lg shadow-emerald-500/20 hover:scale-105"
        >
          {isEs ? 'Comenzar Ahora' : 'Start Now'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </footer>
    </article>
  );
}
