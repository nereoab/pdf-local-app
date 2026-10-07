import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles, Layers } from 'lucide-react';
import { LONG_TAIL_SOLUTIONS_FR } from '@/lib/long-tail-registry';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Solutions et Démarches PDF Spécifiques',
  description:
    'Catalogue de flux et guides PDF adaptés aux exigences des tribunaux, concours et entreprises. 100% privé sans envoi de fichiers sur le cloud.',
  alternates: {
    canonical: `${SITE_URL}/fr/solutions`,
    languages: {
      fr: `${SITE_URL}/fr/solutions`,
      'fr-FR': `${SITE_URL}/fr/solutions`,
      es: `${SITE_URL}/soluciones`,
      en: `${SITE_URL}/en/solutions`,
      pt: `${SITE_URL}/pt/solutions`,
      'x-default': `${SITE_URL}/en/solutions`,
    },
  },
  openGraph: {
    title: 'Répertoire des Solutions PDF Spécifiques | PDFBlack',
    description:
      'Catalogue de flux de travail PDF sécurisés pour démarches administratives et conformité RGPD.',
    url: `${SITE_URL}/fr/solutions`,
    siteName: 'PDFBlack',
    locale: 'fr_FR',
    type: 'website',
  },
};

const CATEGORY_NAMES: Record<string, string> = {
  optimizar: 'Optimisation et Sécurité',
  editar: 'Édition, Numérotation et OCR',
  organizar: 'Organisation des Pages',
  convertir: 'Conversion de Formats',
};

export default function SolutionsDirectoryPageFr() {
  const allSolutions = Object.values(LONG_TAIL_SOLUTIONS_FR);
  const categories = ['optimizar', 'editar', 'organizar', 'convertir'] as const;

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Répertoire des Solutions PDF Spécifiques',
    description: 'Catalogue complet de démarches PDF 100% sécurisées dans le navigateur',
    numberOfItems: allSolutions.length,
    itemListElement: allSolutions.map((sol, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: sol.h1.split('—')[0].trim(),
      url: `${SITE_URL}/fr/solutions/${sol.slug}`,
    })),
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <div className="max-w-7xl mx-auto space-y-12">
        {/* EN-TÊTE */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>RÉPERTOIRE OFFICIEL DE CAS D’USAGE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-sans">
            Solutions et Démarches PDF Spécifiques
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Guides pas-à-pas et flux préconfigurés pour répondre aux exigences des portails
            officiels, tribunaux, universités et entreprises. Vos documents sont traités
            exclusivement dans votre navigateur (WASM) pour une confidentialité totale conforme au
            RGPD.
          </p>
        </div>

        {/* LISTING PAR CATÉGORIES */}
        {categories.map((catKey) => {
          const items = allSolutions.filter((s) => s.category === catKey);
          if (items.length === 0) return null;

          return (
            <section key={catKey} className="space-y-6 pt-6 border-t border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight uppercase font-sans">
                  {CATEGORY_NAMES[catKey] || catKey}
                </h2>
                <span className="text-xs font-mono text-zinc-500">({items.length} solutions)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((sol) => (
                  <Link
                    key={sol.slug}
                    href={`/fr/solutions/${sol.slug}`}
                    className="group flex flex-col justify-between p-5 rounded-2xl bg-[#121217] border border-zinc-800/90 hover:border-zinc-500/80 transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-300 group-hover:text-white group-hover:border-zinc-500 transition-colors">
                          {sol.badge}
                        </span>
                        <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 mb-1.5 font-sans">
                        {sol.h1.split('—')[0].trim()}
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono line-clamp-2 leading-relaxed">
                        {sol.subtitle}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                      <span>Outil : {sol.parentName}</span>
                      <span className="text-emerald-400 font-semibold group-hover:underline">
                        Voir la solution →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
