'use client';

import React from 'react';
import { Check, X, ShieldCheck, Zap, DollarSign, Lock } from 'lucide-react';
import { ComparisonFeature } from '@/lib/comparisons/types';

interface ComparisonTableProps {
  features: ComparisonFeature[];
  competitorName: string;
  lang?: 'es' | 'en';
}

export default function ComparisonTable({
  features,
  competitorName,
  lang = 'es',
}: ComparisonTableProps) {
  const isEs = lang === 'es';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'privacidad':
        return <Lock className="w-3.5 h-3.5 text-emerald-400" />;
      case 'seguridad':
        return <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />;
      case 'rendimiento':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'coste':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return null;
    }
  };

  const renderValue = (val: string | boolean, isPdfBlack: boolean) => {
    if (typeof val === 'boolean') {
      return val ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
          <Check className="w-3.5 h-3.5" />
          {isEs ? 'Sí / Incluido' : 'Yes / Supported'}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-950/40 text-red-400 border border-red-900/30">
          <X className="w-3.5 h-3.5" />
          {isEs ? 'No disponible' : 'Not available'}
        </span>
      );
    }
    return (
      <span
        className={`text-xs font-medium ${
          isPdfBlack ? 'text-emerald-300 font-semibold' : 'text-zinc-300'
        }`}
      >
        {val}
      </span>
    );
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[#09090b] shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-900/50">
              <th className="py-4 px-4 sm:px-6 text-xs font-mono uppercase tracking-wider text-zinc-400 w-1/2">
                {isEs ? 'Característica / Parámetro' : 'Feature / Parameter'}
              </th>
              <th className="py-4 px-4 sm:px-6 text-xs font-mono uppercase tracking-wider text-emerald-400 w-1/4 bg-emerald-950/20 border-l border-r border-emerald-900/30">
                <div className="flex items-center gap-2">
                  <span>PDFBlack</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {isEs ? '100% LOCAL' : '100% LOCAL'}
                  </span>
                </div>
              </th>
              <th className="py-4 px-4 sm:px-6 text-xs font-mono uppercase tracking-wider text-zinc-400 w-1/4">
                {competitorName}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {features.map((feature, idx) => (
              <tr
                key={idx}
                className={`transition-colors hover:bg-zinc-900/30 ${
                  feature.highlight ? 'bg-zinc-900/20' : ''
                }`}
              >
                <td className="py-4 px-4 sm:px-6">
                  <div className="flex items-center gap-2 mb-1">
                    {getCategoryIcon(feature.category)}
                    <span className="text-sm font-semibold text-white">{feature.name}</span>
                  </div>
                  {feature.description && (
                    <p className="text-xs text-zinc-500 leading-relaxed pl-5">
                      {feature.description}
                    </p>
                  )}
                </td>
                <td className="py-4 px-4 sm:px-6 bg-emerald-950/15 border-l border-r border-emerald-900/30">
                  {renderValue(feature.pdfblack, true)}
                </td>
                <td className="py-4 px-4 sm:px-6">{renderValue(feature.competitor, false)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
