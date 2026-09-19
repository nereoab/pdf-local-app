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
  BookOpen,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Scale,
  Cpu,
  Layers,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { GlossaryCategory, GlossaryTerm } from '@/lib/glossary/types';
import { getGlossaryTerm } from '@/lib/glossary/data';
import SpotlightCard from './SpotlightCard';

interface GlossaryTermViewProps {
  term: GlossaryTerm;
  lang?: 'es' | 'en';
}

const CATEGORY_ICONS: Record<GlossaryCategory, React.ReactNode> = {
  legal: <Scale className="w-4 h-4 text-amber-400" />,
  seguridad: <Shield className="w-4 h-4 text-emerald-400" />,
  estandares: <FileCheck className="w-4 h-4 text-blue-400" />,
  tecnologia: <Cpu className="w-4 h-4 text-purple-400" />,
};

export default function GlossaryTermView({ term, lang = 'es' }: GlossaryTermViewProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const isEs = lang === 'es';

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const glossaryHomeHref = isEs ? '/glosario' : '/en/glossary';

  return (
    <article className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans space-y-14">
      {/* ── NAVEGACIÓN Y BREADCRUMB ── */}
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
              href={glossaryHomeHref}
              className="hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full"
            >
              {isEs ? 'Glosario' : 'Glossary'}
            </Link>
          </li>
          <li className="text-zinc-600">/</li>
          <li className="text-zinc-300 font-semibold truncate max-w-[200px] sm:max-w-none">
            {isEs ? term.term : term.termEn}
          </li>
        </ol>

        <span className="hidden sm:inline-block bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-400 font-mono text-[11px]">
          {term.standardReference || (isEs ? 'Especificación Técnica' : 'Technical Spec')}
        </span>
      </nav>

      {/* ── HERO / ENCABEZADO PRINCIPAL ── */}
      <header className="space-y-4 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-mono text-xs font-semibold">
            {CATEGORY_ICONS[term.category]}
            {term.categoryLabel}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[11px]">
            {term.badge}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {isEs ? term.term : term.termEn}
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed font-sans">
          {term.metaDescription}
        </p>
      </header>

      {/* ── BLOQUE AEO: DIRECT ANSWER CAPSULE (BLUF) ── */}
      <section
        aria-label="Direct Answer Definition"
        className="relative bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/20"
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500 text-zinc-950 font-mono text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            {isEs ? 'Respuesta Directa (Definición BLUF)' : 'Direct Answer (BLUF Definition)'}
          </div>
          {term.standardReference && (
            <span className="text-xs font-mono text-emerald-400/90 font-medium hidden md:inline-block">
              {term.standardReference}
            </span>
          )}
        </div>

        <p className="text-base sm:text-lg text-white font-medium leading-relaxed font-sans">
          {term.blufDefinition}
        </p>

        {term.standardReference && (
          <div className="mt-4 pt-3 border-t border-emerald-800/30 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>
              {isEs ? 'Norma de referencia internacional:' : 'International Reference Standard:'}{' '}
              <strong className="text-emerald-300 font-semibold">{term.standardReference}</strong>
            </span>
          </div>
        )}
      </section>

      {/* ── ESPECIFICACIONES TÉCNICAS (SPECS GRID) ── */}
      {term.specifications && term.specifications.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2>{isEs ? 'Ficha de Parámetros Técnicos' : 'Technical Specifications Sheet'}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {term.specifications.map((spec, i) => (
              <div
                key={i}
                className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4.5 hover:border-zinc-700 transition-colors"
              >
                <div className="text-xs font-mono uppercase text-zinc-400 mb-1">{spec.label}</div>
                <div className="text-sm font-semibold text-zinc-100 font-mono">{spec.value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── EXPLICACIÓN TÉCNICA DETALLADA (EDITORIAL) ── */}
      <section className="space-y-5 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2 text-white font-semibold text-lg">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2>
            {isEs
              ? 'Análisis Técnico y Arquitectura de Datos'
              : 'Technical Analysis & Data Architecture'}
          </h2>
        </div>
        <div className="text-zinc-300 text-base leading-relaxed space-y-4 font-sans">
          <p>{term.fullExplanation}</p>
        </div>
      </section>

      {/* ── CASOS DE USO Y APLICACIONES PRÁCTICAS ── */}
      {term.practicalApplication && (
        <section className="space-y-5">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2>{term.practicalApplication.title}</h2>
          </div>
          <p className="text-sm text-zinc-400">{term.practicalApplication.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {term.practicalApplication.useCases.map((useCase, idx) => (
              <div
                key={idx}
                className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4.5 flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                    {idx + 1}
                  </span>
                </div>
                <span className="text-sm text-zinc-300 leading-snug">{useCase}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── ERRORES COMUNES Y CONFUSIONES (PITFALLS) ── */}
      {term.commonPitfalls && term.commonPitfalls.length > 0 && (
        <section className="bg-amber-950/20 border border-amber-900/40 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-lg">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2>
              {isEs
                ? 'Errores Críticos y Conceptos Erróneos Frecuentes'
                : 'Common Pitfalls & Critical Misconceptions'}
            </h2>
          </div>
          <ul className="space-y-3 pt-1">
            {term.commonPitfalls.map((pitfall, pIdx) => (
              <li
                key={pIdx}
                className="flex items-start gap-3 text-sm text-zinc-300 leading-relaxed"
              >
                <span className="text-amber-400 font-mono text-base select-none shrink-0">•</span>
                <span>{pitfall}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── PREGUNTAS FRECUENTES (FAQ ACCORDION) ── */}
      {term.faqs && term.faqs.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-white font-semibold text-xl">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <h2>
              {isEs
                ? 'Preguntas Frecuentes sobre este Concepto'
                : 'Frequently Asked Questions about this Concept'}
            </h2>
          </div>

          <div className="space-y-3">
            {term.faqs.map((faq, fIdx) => {
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
                    <span className="text-sm sm:text-base font-semibold text-zinc-100">
                      {faq.q}
                    </span>
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
      )}

      {/* ── TARJETA DE HERRAMIENTA VINCULADA (TOOL CTA) ── */}
      {term.relatedTool && (
        <section className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 border-2 border-emerald-500/40 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-950/20">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              {isEs ? 'Herramienta PDFBlack Relacionada' : 'Related PDFBlack Tool'}
            </div>
            <h3 className="text-2xl font-bold text-white">{term.relatedTool.name}</h3>
            <p className="text-sm text-zinc-400 max-w-xl">{term.relatedTool.desc}</p>
          </div>

          <Link
            href={term.relatedTool.path}
            className="shrink-0 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-3.5 rounded-full text-sm transition-all shadow-lg shadow-emerald-500/20 hover:scale-105"
          >
            {isEs ? 'Abrir Herramienta' : 'Open Tool'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      {/* ── TÉRMINOS Y ESTÁNDARES RELACIONADOS (INTERLINKING) ── */}
      {term.relatedTerms && term.relatedTerms.length > 0 && (
        <footer className="pt-6 border-t border-zinc-800/80 space-y-4">
          <h3 className="text-sm font-mono uppercase text-zinc-400 tracking-wider">
            {isEs ? 'Conceptos y Estándares Relacionados' : 'Related Concepts & Standards'}
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {term.relatedTerms.map((relSlug) => {
              const relTerm = getGlossaryTerm(relSlug, lang);
              if (!relTerm) return null;
              const relHref = isEs ? `/glosario/${relTerm.slug}` : `/en/glossary/${relTerm.slugEn}`;
              return (
                <Link
                  key={relSlug}
                  href={relHref}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/40 text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all inline-flex items-center gap-1.5"
                >
                  <BookOpen className="w-3 h-3 text-emerald-400" />
                  <span>{isEs ? relTerm.term : relTerm.termEn}</span>
                </Link>
              );
            })}
          </div>
        </footer>
      )}
    </article>
  );
}
