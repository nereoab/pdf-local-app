'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  FileCheck2,
  Lock,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface ConverterSeoSectionProps {
  toolKey: string;
  sourceFormat: string;
  targetFormat: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  stepsEs: Array<{ title: string; desc: string }>;
  stepsEn: Array<{ title: string; desc: string }>;
  featuresEs: Array<{ title: string; desc: string }>;
  featuresEn: Array<{ title: string; desc: string }>;
  faqsEs: Array<{ q: string; a: string }>;
  faqsEn: Array<{ q: string; a: string }>;
}

export default function ConverterSeoSection({
  toolKey,
  sourceFormat,
  targetFormat,
  titleEs,
  titleEn,
  descriptionEs,
  descriptionEn,
  stepsEs,
  stepsEn,
  featuresEs,
  featuresEn,
  faqsEs,
  faqsEn,
}: ConverterSeoSectionProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const title = isEs ? titleEs : titleEn;
  const description = isEs ? descriptionEs : descriptionEn;
  const steps = isEs ? stepsEs : stepsEn;
  const features = isEs ? featuresEs : featuresEn;
  const faqs = isEs ? faqsEs : faqsEn;

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `PDFBlack - ${title}`,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description,
    featureList: features.map((f) => f.title).join(', '),
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <section className="w-full mt-24 mb-16 font-mono text-white flex flex-col items-center">
      {/* JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full max-w-5xl space-y-16">
        {/* Header descriptivo */}
        <div className="text-center space-y-4 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs text-zinc-300 font-sans tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>PDFBlack Suite • Enterprise Edition</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-white">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-3xl mx-auto font-sans leading-relaxed">
            {description}
          </p>
        </div>

        {/* Guía en 3 Pasos */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold font-sans uppercase tracking-wider text-zinc-200">
              {isEs ? '¿Cómo funciona en 3 pasos?' : 'How does it work in 3 steps?'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="relative group bg-zinc-950/70 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300 backdrop-blur-sm"
              >
                <div className="absolute top-5 right-5 text-4xl font-black text-white/[0.04] select-none">
                  0{idx + 1}
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-sm font-bold text-white mb-4 group-hover:scale-110 transition-transform">
                  {idx + 1}
                </div>
                <h4 className="text-base font-bold font-sans text-white mb-2">{step.title}</h4>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Características y Ventajas */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold font-sans uppercase tracking-wider text-zinc-200">
              {isEs ? 'Ventajas y Calidad de Conversión' : 'Features & Conversion Quality'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="bg-zinc-950/50 border border-white/5 hover:border-white/15 rounded-2xl p-5 space-y-2 transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <h4 className="text-sm font-bold font-sans text-zinc-100">{feat.title}</h4>
                </div>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Preguntas Frecuentes (FAQ) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold font-sans uppercase tracking-wider text-zinc-200">
              {isEs ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-zinc-950/70 border border-white/10 rounded-xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-sm font-sans font-medium text-zinc-200">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-white' : ''
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
                        <div className="px-5 pb-5 pt-1 text-xs text-zinc-400 font-sans leading-relaxed border-t border-white/[0.04]">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Banner de Seguridad & Privacidad */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold font-sans text-white">
              {isEs ? 'Privacidad y Seguridad Garantizada' : 'Guaranteed Privacy & Security'}
            </h4>
            <p className="text-xs text-zinc-400 font-sans">
              {isEs
                ? 'Tus archivos son procesados con cifrado SSL/TLS de 256 bits y se eliminan automáticamente de forma irreversible una vez finalizada la sesión.'
                : 'Your files are processed with 256-bit SSL/TLS encryption and are automatically and irreversibly deleted once your session is finished.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
