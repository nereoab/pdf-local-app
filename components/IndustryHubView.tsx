'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  Scale,
  HeartPulse,
  Landmark,
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  ServerOff,
  Cpu,
  Lock,
} from 'lucide-react';
import { getAllIndustries } from '@/lib/industries/data';
import SpotlightCard from './SpotlightCard';

interface IndustryHubViewProps {
  lang?: 'es' | 'en';
}

const SECTOR_ICONS: Record<string, React.ReactNode> = {
  legal: <Scale className="w-5 h-5 text-amber-400" />,
  salud: <HeartPulse className="w-5 h-5 text-emerald-400" />,
  finanzas: <Landmark className="w-5 h-5 text-blue-400" />,
  gobierno: <Building2 className="w-5 h-5 text-purple-400" />,
};

export default function IndustryHubView({ lang = 'es' }: IndustryHubViewProps) {
  const isEs = lang === 'es';
  const industries = getAllIndustries();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans space-y-16">
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
          {isEs ? 'Cumplimiento Normativo B2B' : 'B2B Enterprise Compliance'}
        </span>
      </div>

      {/* ── HERO HEADER ── */}
      <header className="text-center space-y-5 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-mono text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          {isEs ? 'SOLUCIONES CORPORATIVAS POR INDUSTRIA' : 'ENTERPRISE INDUSTRY SOLUTIONS'}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {isEs ? (
            <>
              Software PDF Seguro para <span className="text-emerald-400">Sectores Regulados</span>
            </>
          ) : (
            <>
              Secure PDF Software for <span className="text-emerald-400">Regulated Industries</span>
            </>
          )}
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-3xl mx-auto">
          {isEs
            ? 'Despachos de abogados, centros hospitalarios, firmas de auditoría y administraciones públicas eligen PDFBlack para eliminar de raíz el riesgo de fuga de datos en la nube. Procesamiento 100% en memoria RAM local con WebAssembly.'
            : 'Law firms, hospitals, audit firms, and government agencies choose PDFBlack to eliminate cloud data leakage risks. 100% on-device local RAM processing via client-side WebAssembly.'}
        </p>
      </header>

      {/* ── GRID DE INDUSTRIAS (4 CARDS) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {industries.map((item, idx) => {
          const detailHref = isEs ? `/industrias/${item.slug}` : `/en/industries/${item.slugEn}`;
          return (
            <motion.div
              key={item.slug}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.08 }}
            >
              <SpotlightCard className="h-full bg-zinc-950/70 border border-zinc-800/80 hover:border-emerald-500/40 p-6 sm:p-8 rounded-3xl flex flex-col justify-between transition-all group">
                <div className="space-y-5">
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono font-semibold text-zinc-200">
                      {SECTOR_ICONS[item.slug]}
                      {isEs ? item.name : item.nameEn}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded uppercase">
                      {item.heroBadge}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <Link
                      href={detailHref}
                      className="group-hover:text-emerald-400 transition-colors"
                    >
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                        {isEs ? item.h1 : item.h1En}
                      </h2>
                    </Link>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                      {isEs ? item.subtitle : item.subtitleEn}
                    </p>
                  </div>

                  {/* Compliance Standards Badges */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                    <span className="text-[11px] font-mono uppercase text-zinc-500 block">
                      {isEs
                        ? 'Normativas y Estándares Aplicables:'
                        : 'Applicable Compliance Standards:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.complianceStandards.map((std, sIdx) => (
                        <span
                          key={sIdx}
                          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-mono px-2.5 py-1 rounded-lg"
                        >
                          {std.badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-6 mt-6 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-500">
                    {isEs
                      ? `${item.recommendedTools.length} herramientas clave`
                      : `${item.recommendedTools.length} key tools`}
                  </span>
                  <Link
                    href={detailHref}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group-hover:translate-x-1 duration-200"
                  >
                    {isEs ? 'Ver Solución del Sector' : 'Explore Sector Solution'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>

      {/* ── TABLA COMPARATIVA: CLOUD TRADICIONAL VS ZERO-KNOWLEDGE ── */}
      <section className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            {isEs ? 'Matriz de Riesgo Empresarial' : 'Enterprise Risk Matrix'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {isEs
              ? '¿Por qué la nube tradicional es un riesgo en sectores regulados?'
              : 'Why Traditional Cloud Editors Pose Legal Risks'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs font-mono uppercase text-zinc-400">
                <th className="py-4 px-4">
                  {isEs ? 'Factor de Cumplimiento' : 'Compliance Factor'}
                </th>
                <th className="py-4 px-4 text-rose-400">
                  {isEs ? 'Servicios Cloud (iLovePDF / Adobe Web)' : 'Legacy Cloud Services'}
                </th>
                <th className="py-4 px-4 text-emerald-400">
                  {isEs ? 'PDFBlack (Zero-Knowledge Local)' : 'PDFBlack (Client-Side WASM)'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              <tr>
                <td className="py-4 px-4 font-semibold text-white">
                  {isEs ? 'Tránsito de Archivos en Red' : 'Network File Transmission'}
                </td>
                <td className="py-4 px-4 flex items-center gap-2 text-rose-300">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    {isEs ? 'Se suben a servidores remotos' : 'Uploaded to remote cloud servers'}
                  </span>
                </td>
                <td className="py-4 px-4 items-center gap-2 text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">
                      {isEs
                        ? '0 bytes transmitidos (100% en RAM local)'
                        : '0 bytes sent (100% local RAM)'}
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-semibold text-white">
                  {isEs ? 'Obligación de Contratos DPA / BAA' : 'DPA & BAA Contract Obligations'}
                </td>
                <td className="py-4 px-4 flex items-center gap-2 text-rose-300">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    {isEs
                      ? 'Obligatorio firmar acuerdos con el proveedor'
                      : 'Mandatory third-party vendor DPA'}
                  </span>
                </td>
                <td className="py-4 px-4 items-center gap-2 text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">
                      {isEs
                        ? 'Exento (no hay tratamiento externo)'
                        : 'Exempt (zero external processing)'}
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-semibold text-white">
                  {isEs ? 'Riesgo de Filtración o Hackeo Remoto' : 'Remote Data Breach & Leak Risk'}
                </td>
                <td className="py-4 px-4 flex items-center gap-2 text-rose-300">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    {isEs
                      ? 'Sujeto a brechas en servidores del proveedor'
                      : 'Subject to vendor infrastructure breaches'}
                  </span>
                </td>
                <td className="py-4 px-4 items-center gap-2 text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">
                      {isEs
                        ? 'Nulo (no existen copias en disco externo)'
                        : 'Zero (no server disk persistence)'}
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-semibold text-white">
                  {isEs ? 'Uso sin Conexión (Air-Gapped)' : 'Offline / Air-Gapped Operation'}
                </td>
                <td className="py-4 px-4 flex items-center gap-2 text-rose-300">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    {isEs
                      ? 'Imposible (requiere Internet constante)'
                      : 'Impossible (requires continuous cloud)'}
                  </span>
                </td>
                <td className="py-4 px-4 items-center gap-2 text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">
                      {isEs
                        ? 'Disponible tras primera carga en caché'
                        : 'Fully functional offline in browser cache'}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── BANNER AUDITORÍA EN VIVO ── */}
      <section className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-900/40 rounded-3xl p-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 text-emerald-400 text-xs font-mono font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          {isEs ? 'DEMOSTRABLE ANTE AUDITORES DE TI' : 'VERIFIABLE BY IT SECURITY AUDITORS'}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          {isEs
            ? 'Verifícalo tú mismo en la pestaña Network de tu navegador'
            : 'Audit it yourself in your browser Network tab'}
        </h2>
        <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
          {isEs
            ? 'Abre las herramientas de desarrollo con F12, ve a la pestaña "Red" y procesa cualquier archivo confidencial. Verás cero peticiones salientes con el contenido de tus documentos.'
            : 'Press F12, open the Network tab, and process any confidential document. You will see zero outbound HTTP requests carrying your file bytes.'}
        </p>
        <div className="pt-2">
          <Link
            href={isEs ? '/optimizar/censurar' : '/en/redact-pdf'}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-3 rounded-full text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            {isEs ? 'Probar Censura Forense Privada' : 'Test Private Forensic Redaction'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
