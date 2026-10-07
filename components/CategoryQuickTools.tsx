'use client';

import React from 'react';
import Link from 'next/link';
import { Merge, Scissors, Sliders, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getUrlForLanguage } from '@/lib/routes-config';

interface CategoryQuickToolsProps {
  className?: string;
  layout?: 'row' | 'grid';
}

export default function CategoryQuickTools({
  className = '',
  layout = 'row',
}: CategoryQuickToolsProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const isPt = lang === 'pt';
  const isFr = lang === 'fr';

  const quickTools = [
    {
      id: 'unir',
      name: isFr ? 'Fusionner PDF' : isPt ? 'Juntar PDF' : isEs ? 'Unir PDF' : 'Merge PDF',
      path: '/organizar/unir',
      icon: Merge,
    },
    {
      id: 'dividir',
      name: isFr ? 'Diviser PDF' : isPt ? 'Dividir PDF' : isEs ? 'Dividir PDF' : 'Split PDF',
      path: '/organizar/dividir',
      icon: Scissors,
    },
    {
      id: 'comprimir',
      name: isFr
        ? 'Compresser PDF'
        : isPt
          ? 'Comprimir PDF'
          : isEs
            ? 'Comprimir PDF'
            : 'Compress PDF',
      path: '/optimizar/comprimir',
      icon: Sliders,
    },
    {
      id: 'convertir',
      name: isFr
        ? 'Convertir PDF'
        : isPt
          ? 'Converter PDF'
          : isEs
            ? 'Convertir PDF'
            : 'Convert PDF',
      path: '/convertir',
      icon: ArrowRightLeft,
    },
  ];

  const gridClass =
    layout === 'row'
      ? 'grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3'
      : 'grid grid-cols-2 gap-2 sm:gap-2.5';

  return (
    <div
      className={`relative p-2 sm:p-2.5 rounded-2xl bg-gradient-to-b from-[#181820]/95 via-[#101015]/95 to-[#09090d]/95 border border-zinc-700/80 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden ${className}`}
    >
      {/* Línea de resplandor especular superior */}
      <div
        className="absolute top-0 inset-x-3 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className={gridClass}>
        {quickTools.map((tool) => {
          const Icon = tool.icon;
          const href = getUrlForLanguage(tool.path, lang);

          return (
            <Link
              key={tool.id}
              href={href}
              className="group/item relative flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/95 border border-zinc-700/70 hover:border-white/80 transition-all duration-200 shadow-sm hover:shadow-[0_0_18px_rgba(255,255,255,0.12)] cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-zinc-800/90 border border-zinc-600/80 group-hover/item:border-white/70 group-hover/item:bg-zinc-700/90 flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-inner">
                  <Icon className="w-3.5 h-3.5 text-zinc-200 group-hover/item:text-white group-hover/item:scale-110 transition-transform duration-200" />
                </div>
                <span className="text-xs font-bold text-zinc-200 group-hover/item:text-white tracking-tight whitespace-nowrap font-sans">
                  {tool.name}
                </span>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover/item:text-white group-hover/item:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
