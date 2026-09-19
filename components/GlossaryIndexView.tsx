'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  ArrowRight,
  Shield,
  FileCheck,
  Cpu,
  Scale,
  Sparkles,
  ArrowLeft,
  Terminal,
} from 'lucide-react';
import { GlossaryCategory, GlossaryTerm } from '@/lib/glossary/types';
import { getAllGlossaryTerms } from '@/lib/glossary/data';
import SpotlightCard from './SpotlightCard';

interface GlossaryIndexViewProps {
  lang?: 'es' | 'en';
}

const CATEGORY_ICONS: Record<GlossaryCategory, React.ReactNode> = {
  legal: <Scale className="w-4 h-4 text-amber-400" />,
  seguridad: <Shield className="w-4 h-4 text-emerald-400" />,
  estandares: <FileCheck className="w-4 h-4 text-blue-400" />,
  tecnologia: <Cpu className="w-4 h-4 text-purple-400" />,
};

export default function GlossaryIndexView({ lang = 'es' }: GlossaryIndexViewProps) {
  const isEs = lang === 'es';
  const allTerms = useMemo(() => getAllGlossaryTerms(lang), [lang]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    return [
      { id: 'all', label: isEs ? 'Todos los Conceptos' : 'All Concepts' },
      { id: 'legal', label: isEs ? 'Práctica Jurídica' : 'Legal & Procedural' },
      { id: 'seguridad', label: isEs ? 'Seguridad & Cifrado' : 'Security & Encryption' },
      { id: 'estandares', label: isEs ? 'Estándares ISO' : 'ISO Standards' },
      { id: 'tecnologia', label: isEs ? 'Tecnología & Zero-Knowledge' : 'Tech & Zero-Knowledge' },
    ];
  }, [isEs]);

  const filteredTerms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allTerms.filter((term) => {
      const matchesCat = selectedCategory === 'all' || term.category === selectedCategory;
      if (!matchesCat) return false;

      if (!query) return true;

      const nameMatch =
        term.term.toLowerCase().includes(query) || term.termEn.toLowerCase().includes(query);
      const blufMatch = term.blufDefinition.toLowerCase().includes(query);
      const standardMatch = term.standardReference?.toLowerCase().includes(query) || false;
      const kwMatch = term.keywords.some((kw) => kw.toLowerCase().includes(query));

      return nameMatch || blufMatch || standardMatch || kwMatch;
    });
  }, [allTerms, searchQuery, selectedCategory]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans space-y-12">
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
          {isEs ? 'Recurso Educativo & Normativo' : 'Technical & Regulatory Hub'}
        </span>
      </div>

      {/* ── HERO HEADER ── */}
      <header className="text-center space-y-5 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-mono text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          {isEs ? 'CENTRO DE CONOCIMIENTO TÉCNICO' : 'TECHNICAL KNOWLEDGE REPOSITORY'}
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {isEs ? (
            <>
              Glosario Técnico de <span className="text-emerald-400">Estándares ISO</span> y
              Seguridad en PDF
            </>
          ) : (
            <>
              Technical PDF Glossary: <span className="text-emerald-400">ISO Standards</span> &
              Security
            </>
          )}
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          {isEs
            ? 'Guías de referencia exhaustivas sobre especificaciones de archivo, indexación judicial probatoria, algoritmos de cifrado y procesamiento Zero-Knowledge en el navegador.'
            : 'Comprehensive reference guides on document specifications, forensic legal indexing, cryptographic primitives, and client-side Zero-Knowledge execution.'}
        </p>
      </header>

      {/* ── BUSCADOR & FILTROS ── */}
      <div className="space-y-5 max-w-3xl mx-auto">
        {/* Input con icono */}
        <div className="relative">
          <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isEs
                ? 'Buscar por concepto, norma ISO, algoritmo o aplicación legal...'
                : 'Search by concept, ISO standard, cipher, or legal application...'
            }
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 hover:text-white bg-zinc-800 px-2 py-1 rounded"
            >
              ESC
            </button>
          )}
        </div>

        {/* Categorías (Pills) */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-lg shadow-emerald-500/20'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {cat.id !== 'all' && CATEGORY_ICONS[cat.id as GlossaryCategory]}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RESULTADOS / TARJETAS DE TÉRMINOS ── */}
      {filteredTerms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {filteredTerms.map((item, index) => {
            const detailHref = isEs ? `/glosario/${item.slug}` : `/en/glossary/${item.slugEn}`;
            return (
              <motion.div
                key={item.slug}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
              >
                <SpotlightCard className="h-full bg-zinc-950/70 border border-zinc-800/80 hover:border-emerald-500/40 p-6 sm:p-7 rounded-2xl flex flex-col justify-between transition-all group">
                  <div className="space-y-4">
                    {/* Top Metadata */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                        {CATEGORY_ICONS[item.category]}
                        {item.categoryLabel}
                      </span>
                      {item.standardReference && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded truncate max-w-[170px]">
                          {item.standardReference}
                        </span>
                      )}
                    </div>

                    {/* Term Title */}
                    <div>
                      <Link
                        href={detailHref}
                        className="group-hover:text-emerald-400 transition-colors"
                      >
                        <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                          {isEs ? item.term : item.termEn}
                        </h2>
                      </Link>
                      <p className="text-xs font-mono text-zinc-500 mt-0.5">
                        {isEs ? `Ref: ${item.slug}` : `Ref: ${item.slugEn}`}
                      </p>
                    </div>

                    {/* BLUF Capsule (Answer Engine Highlight) */}
                    <div className="bg-zinc-900/90 border-l-2 border-emerald-500 p-3.5 rounded-r-xl">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold mb-1">
                        <Sparkles className="w-3 h-3" />
                        {isEs ? 'Definición Directa (BLUF)' : 'Direct Answer (BLUF)'}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                        {item.blufDefinition}
                      </p>
                    </div>

                    {/* Technical Specs Preview */}
                    {item.specifications && item.specifications.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60 font-mono text-[11px]">
                        <div>
                          <span className="text-zinc-500 block text-[10px]">
                            {item.specifications[0].label}
                          </span>
                          <span className="text-zinc-300 font-medium truncate block">
                            {item.specifications[0].value}
                          </span>
                        </div>
                        {item.specifications[1] && (
                          <div>
                            <span className="text-zinc-500 block text-[10px]">
                              {item.specifications[1].label}
                            </span>
                            <span className="text-zinc-300 font-medium truncate block">
                              {item.specifications[1].value}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-6 mt-4 border-t border-zinc-800/60 flex items-center justify-between">
                    <Link
                      href={item.relatedTool.path}
                      className="text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                    >
                      <Terminal className="w-3 h-3 text-zinc-500" />
                      <span className="truncate max-w-[140px] sm:max-w-[180px]">
                        {item.relatedTool.name}
                      </span>
                    </Link>
                    <Link
                      href={detailHref}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group-hover:translate-x-0.5 duration-200"
                    >
                      {isEs ? 'Ver Especificación' : 'View Specification'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl max-w-xl mx-auto space-y-3">
          <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-300">
            {isEs ? 'No se encontraron términos coincidentes' : 'No matching concepts found'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {isEs
              ? 'Prueba modificando los términos de búsqueda o selecciona la categoría "Todos los Conceptos".'
              : 'Try modifying your search criteria or select the "All Concepts" category filter.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="text-xs text-emerald-400 hover:underline font-mono pt-2 inline-block"
          >
            {isEs ? 'Restablecer filtros' : 'Reset filters'}
          </button>
        </div>
      )}

      {/* ── BANNER INFERIOR: ARQUITECTURA PRIVADA ── */}
      <section className="bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-950 border border-emerald-900/30 rounded-3xl p-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 text-emerald-400 text-xs font-mono font-semibold">
          <Shield className="w-3.5 h-3.5" />
          {isEs
            ? 'ARQUITECTURA CLIENT-SIDE ZERO-KNOWLEDGE'
            : 'CLIENT-SIDE ZERO-KNOWLEDGE ARCHITECTURE'}
        </div>
        <h2 className="text-2xl font-bold text-white">
          {isEs
            ? 'Todos los estándares aplicados en tu propia memoria RAM'
            : 'All document standards compiled directly inside your local RAM'}
        </h2>
        <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
          {isEs
            ? 'A diferencia de plataformas en la nube que suben y conservan copias de tus archivos, PDFBlack procesa todos los algoritmos vectoriales y criptográficos de forma local con WebAssembly sin enviar datos a servidores externos.'
            : 'Unlike legacy cloud tools that upload and retain copies of your sensitive files, PDFBlack executes all vector and cryptographic algorithms locally in WebAssembly without ever transmitting raw bytes.'}
        </p>
        <div className="pt-2">
          <Link
            href={isEs ? '/convertir/pdf-word' : '/en/convert/pdf-to-word'}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-3 rounded-full text-sm transition-colors shadow-lg shadow-emerald-500/20"
          >
            {isEs ? 'Probar Conversor de Documentos' : 'Try Document Engine'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
