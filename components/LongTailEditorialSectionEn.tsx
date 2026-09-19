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
import { LongTailSolution, LONG_TAIL_SOLUTIONS_EN } from '@/lib/long-tail-registry';

interface Props {
  solution: LongTailSolution;
}

export default function LongTailEditorialSectionEn({ solution }: Props) {
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
        <Link href="/en" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
          Home
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

      {/* ─── BADGE & EDITORIAL HEADER ─── */}
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
              Technical Specifications & Requirements
            </h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              ISO 32000-1 Standard
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-neutral-100/50 dark:bg-neutral-800/30 text-neutral-600 dark:text-neutral-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Parameter
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Specification / Value
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Technical Detail
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
          Step-by-Step Instructions
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

      {/* ─── TECHNICAL PRIVACY & SECURITY BOX (WASM) ─── */}
      <div className="mb-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/20 dark:to-neutral-900 border border-emerald-200/80 dark:border-emerald-800/40 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
              Absolute Privacy: 100% In-Browser Client-Side Processing
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
              Unlike legacy cloud PDF web converters that upload your confidential files to
              third-party servers,{' '}
              <strong className="font-semibold text-neutral-900 dark:text-white">
                PDFBlack executes all document rendering and transformations directly in your
                browser using WebAssembly and Web Workers
              </strong>
              . Your documents never leave your computer or mobile phone, guaranteeing full
              compliance with attorney-client privilege, HIPAA healthcare standards, and GDPR
              regulations.
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
              Frequently Asked Questions about {solution.h1.split('—')[0].trim()}
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
                    className="w-full text-left px-5 py-4 font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 flex items-center justify-between gap-4 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-500 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TOPIC CLUSTER: RELATED SOLUTIONS & RETURN TO MAIN TOOL ─── */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8 mt-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Looking for the full unconstrained tool?
            </h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Access all customization settings and advanced options in {solution.parentName}.
            </p>
          </div>
          <Link
            href={solution.parentPath}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <span>Open {solution.parentName}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {solution.relatedSolutions && solution.relatedSolutions.length > 0 && (
          <div>
            <h5 className="text-xs uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
              Related Solutions & Workflow Guides:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {solution.relatedSolutions.map((relSlug) => {
                const rel = LONG_TAIL_SOLUTIONS_EN[relSlug];
                if (!rel) return null;
                return (
                  <Link
                    key={relSlug}
                    href={`/en/solutions/${relSlug}`}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 hover:border-emerald-500/50 transition-colors block text-left"
                  >
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1 truncate">
                      {rel.badge}
                    </div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-200 line-clamp-2">
                      {rel.h1.split('—')[0].trim()}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
