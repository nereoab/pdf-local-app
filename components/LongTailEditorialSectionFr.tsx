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
import { LongTailSolution, LONG_TAIL_SOLUTIONS_FR } from '@/lib/long-tail-registry';

interface Props {
  solution: LongTailSolution;
}

export default function LongTailEditorialSectionFr({ solution }: Props) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <section className="mt-16 w-full max-w-5xl mx-auto px-4 pb-20 text-neutral-800 dark:text-neutral-200">
      {/* ─── BREADCRUMBS ─── */}
      <nav
        aria-label="Fil d'Ariane"
        className="mb-6 text-sm text-neutral-500 dark:text-neutral-400 flex items-center space-x-2"
      >
        <Link href="/fr" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
          Accueil
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

      {/* ─── BADGE & EN-TÊTE ÉDITORIAL ─── */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 mb-3 border border-emerald-200 dark:border-emerald-800/60">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{solution.badge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-3">
          {solution.h1}
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
          {solution.subtitle}
        </p>
      </div>

      {/* ─── TABLEAU DES SPÉCIFICATIONS TECHNIQUES ─── */}
      {solution.specifications && solution.specifications.length > 0 && (
        <div className="mb-12 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-sm">
          <div className="bg-neutral-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Spécifications Techniques et Prérequis
            </h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Norme ISO 32000-1
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-neutral-100/50 dark:bg-neutral-800/30 text-neutral-600 dark:text-neutral-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Paramètre
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Spécification / Valeur
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Détail Technique
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

      {/* ─── GUIDE PAS À PAS ILLUSTRÉ ─── */}
      <div className="mb-12">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
          Instructions Étape par Étape
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
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ENCADRÉ CONFIDENTIALITÉ & SÉCURITÉ TECHNIQUE (RGPD & WASM) ─── */}
      <div className="mb-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/20 dark:to-neutral-900 border border-emerald-200/80 dark:border-emerald-800/40 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
              Confidentialité Absolue : Traitement 100% Local dans le Navigateur (RGPD)
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
              Contrairement aux convertisseurs web traditionnels qui envoient vos fichiers
              confidentiels vers des serveurs cloud distants,{' '}
              <strong className="font-semibold text-neutral-900 dark:text-white">
                PDFBlack exécute tous les calculs et modifications directement dans votre navigateur
                grâce à WebAssembly et aux Web Workers
              </strong>
              . Vos documents ne quittent jamais votre appareil, garantissant une conformité stricte
              avec le Règlement Général sur la Protection des Données (RGPD - Règlement UE 2016/679)
              et les préconisations de la CNIL.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 px-3 py-2 rounded-lg">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>0 octet téléversé</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 px-3 py-2 rounded-lg">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Conforme RGPD & CNIL</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 px-3 py-2 rounded-lg">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Sans limite de taille</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── AVANTAGES CLÉS POUR LES PROFESSIONNELS ─── */}
      {solution.benefits && solution.benefits.length > 0 && (
        <div className="mb-12">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
            Pourquoi Choisir PDFBlack pour vos Démarches
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {solution.benefits.map((b, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  {b.title}
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── FOIRE AUX QUESTIONS (FAQ) ─── */}
      {solution.faqs && solution.faqs.length > 0 && (
        <div className="mb-14">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Questions Fréquentes</span>
          </h3>
          <div className="space-y-3">
            {solution.faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm sm:text-base">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-500' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── CALL TO ACTION FINAL ─── */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <h3 className="text-xl font-bold mb-2">
            Prêt à traiter vos documents en toute sécurité ?
          </h3>
          <p className="text-sm text-neutral-300 max-w-xl">
            Aucune inscription requise, aucune limite de taille et protection totale de vos données.
          </p>
        </div>
        <Link
          href={solution.parentPath}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition-colors shrink-0 shadow-lg shadow-emerald-500/20"
        >
          <span>Lancer {solution.parentName}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ─── CLUSTER THÉMATIQUE : SOLUTIONS ASSOCIÉES ─── */}
      {solution.relatedSolutions && solution.relatedSolutions.length > 0 && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8 mt-12">
          <p className="text-xs uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
            Autres solutions et démarches associées :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {solution.relatedSolutions.map((relSlug) => {
              const rel = LONG_TAIL_SOLUTIONS_FR[relSlug];
              if (!rel) return null;
              return (
                <Link
                  key={relSlug}
                  href={`/fr/solutions/${relSlug}`}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 hover:border-emerald-500/50 transition-colors block text-left group"
                >
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1 truncate">
                    {rel.badge}
                  </div>
                  <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                    {rel.h1.split('—')[0].trim()}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
