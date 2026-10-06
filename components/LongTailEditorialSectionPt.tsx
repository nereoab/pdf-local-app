'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { LongTailSolution } from '@/lib/long-tail-registry';

interface Props {
  solution: LongTailSolution;
}

export default function LongTailEditorialSectionPt({ solution }: Props) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <section className="mt-16 w-full max-w-5xl mx-auto px-4 pb-20 text-neutral-800 dark:text-neutral-200">
      {/* ─── BREADCRUMBS ─── */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-sm text-neutral-500 dark:text-neutral-400 flex items-center space-x-2"
      >
        <Link href="/pt" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
          Início
        </Link>
        <span>/</span>
        <Link
          href={solution.parentPath}
          className="hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          {solution.parentName}
        </Link>
        <span>/</span>
        <span className="text-neutral-900 dark:text-neutral-100 font-medium truncate max-w-xs sm:max-w-md">
          {solution.h1.split('—')[0].trim()}
        </span>
      </nav>

      {/* ─── BADGE & ENCABEZADO EDITORIAL ─── */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 mb-3 border border-emerald-200 dark:border-emerald-800/60">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{solution.badge}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-3">
          {solution.h1}
        </h2>
        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
          {solution.subtitle}
        </p>
      </div>

      {/* ─── TECHNICAL SPECIFICATIONS TABLE ─── */}
      {solution.specifications && solution.specifications.length > 0 && (
        <div className="mb-12 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-sm">
          <div className="bg-neutral-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Especificações Técnicas e Requisitos
            </h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Padrão ISO 32000-1
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-neutral-100/50 dark:bg-neutral-800/30 text-neutral-600 dark:text-neutral-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Parâmetro
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Especificação / Valor
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Detalhe Técnico
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {solution.specifications.map((spec, i) => (
                  <tr
                    key={i}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-medium text-neutral-900 dark:text-neutral-200">
                      {spec.feature}
                    </td>
                    <td className="px-6 py-3.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      {spec.value}
                    </td>
                    <td className="px-6 py-3.5 text-neutral-500 dark:text-neutral-400">
                      {spec.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ILLUSTRATED HOW-TO STEP-BY-STEP GUIDE ─── */}
      <div className="mb-12">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
          Instruções Passo a Passo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {solution.steps.map((s) => (
            <div
              key={s.step}
              className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 flex flex-col justify-between hover:border-emerald-500/50 transition-colors shadow-sm"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-900 dark:text-neutral-100 mb-4 border border-neutral-200 dark:border-neutral-700">
                  {s.step}
                </div>
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  {s.title}
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TECHNICAL PRIVACY & SECURITY BOX (LGPD & WASM) ─── */}
      <div className="mb-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/20 dark:to-neutral-900 border border-emerald-200/80 dark:border-emerald-800/40 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
              Privacidade Absoluta: Processamento 100% no Navegador (LGPD)
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
              Ao contrário de conversores web legados que enviam seus arquivos confidenciais para
              servidores em nuvem,{' '}
              <strong className="font-semibold text-neutral-900 dark:text-white">
                o PDFBlack executa toda a renderização e manipulação diretamente no seu navegador
                usando WebAssembly e Web Workers
              </strong>
              . Seus documentos nunca saem do seu computador ou celular, garantindo total
              conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018) e sigilo
              profissional.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {solution.benefits.map((b, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {b.title}:
                    </span>{' '}
                    {b.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── FREQUENTLY ASKED QUESTIONS (FAQS) ─── */}
      {solution.faqs && solution.faqs.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Perguntas Frequentes sobre {solution.h1.split('—')[0].trim()}
            </h3>
          </div>
          <div className="space-y-3">
            {solution.faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-left font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 flex items-center justify-between gap-4 cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/80 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── CALL TO ACTION BOTTOM ─── */}
      <div className="p-8 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="text-center sm:text-left">
          <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
            Pronto para usar a ferramenta?
          </h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Gratuito, instantâneo e sem necessidade de criar conta ou instalar programas.
          </p>
        </div>
        <Link
          href={solution.parentPath}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 shrink-0"
        >
          <span>Acessar {solution.parentName}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
