'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getSolutionsByToolKey } from '@/lib/long-tail-registry';

interface Props {
  toolKey: string;
  lang?: 'es' | 'en';
}

export default function RelatedLongTailSolutions({ toolKey, lang: propLang }: Props) {
  const { lang: ctxLang } = useLanguage();
  const activeLang: 'es' | 'en' = propLang || (ctxLang === 'en' ? 'en' : 'es');
  const isEs = activeLang === 'es';

  const solutions = getSolutionsByToolKey(toolKey, activeLang);

  if (!solutions || solutions.length === 0) {
    return null;
  }

  const prefix = isEs ? '/soluciones' : '/en/solutions';

  return (
    <section className="w-full max-w-7xl mx-auto mt-16 pt-12 border-t border-zinc-800/80 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 mb-3">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>
              {isEs ? 'CASOS DE USO Y SOLUCIONES FRECUENTES' : 'SPECIALIZED USE CASES & SOLUTIONS'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase font-sans">
            {isEs ? 'Soluciones y Trámites Específicos' : 'Targeted Solutions & Official Workflows'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-1 max-w-2xl">
            {isEs
              ? 'Flujos preconfigurados para cumplir requisitos de portales oficiales, juzgados, empresas y universidades con privacidad 100% local.'
              : 'Pre-configured workflows tailored for strict court filings, government portals, universities, and enterprise compliance.'}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-400 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            {isEs ? 'Procesamiento 100% en tu Navegador' : '100% In-Browser RAM Processing'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {solutions.map((sol) => (
          <Link
            key={sol.slug}
            href={`${prefix}/${sol.slug}`}
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-[#121217] border border-zinc-800/90 hover:border-zinc-500/80 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-300 group-hover:text-white group-hover:border-zinc-500 transition-colors">
                  {sol.badge}
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug mb-2 font-sans">
                {sol.h1.split('—')[0].trim()}
              </h3>

              <p className="text-zinc-400 text-xs leading-relaxed font-sans line-clamp-3">
                {sol.metaDescription}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="text-emerald-400 font-semibold group-hover:underline">
                {isEs ? 'Abrir solución gratuita →' : 'Launch free solution →'}
              </span>
              <span className="text-zinc-400">ISO 32000</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
