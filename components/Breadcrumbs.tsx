'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BreadcrumbSegment {
  label: string;
  labelEn: string;
  href: string;
}

// Mapa de rutas a nombres legibles
const ROUTE_MAP: Record<string, { label: string; labelEn: string }> = {
  editar: { label: 'Editar PDF', labelEn: 'Edit PDF' },
  organizar: { label: 'Organizar PDF', labelEn: 'Organize PDF' },
  convertir: { label: 'Convertir PDF', labelEn: 'Convert PDF' },
  optimizar: { label: 'Optimizar PDF', labelEn: 'Optimize PDF' },
  texto: { label: 'Editar Texto', labelEn: 'Edit Text' },
  'marca-agua': { label: 'Marca de Agua', labelEn: 'Watermark' },
  foliar: { label: 'Foliar Páginas', labelEn: 'Page Numbers' },
  firma: { label: 'Firmar PDF', labelEn: 'Sign PDF' },
  ocr: { label: 'OCR PDF', labelEn: 'OCR PDF' },
  'quitar-marca-agua': { label: 'Quitar Marca de Agua', labelEn: 'Remove Watermark' },
  unir: { label: 'Unir PDF', labelEn: 'Merge PDF' },
  dividir: { label: 'Dividir PDF', labelEn: 'Split PDF' },
  eliminar: { label: 'Eliminar Páginas', labelEn: 'Delete Pages' },
  reordenar: { label: 'Reordenar PDF', labelEn: 'Reorder PDF' },
  rotar: { label: 'Rotar PDF', labelEn: 'Rotate PDF' },
  recortar: { label: 'Recortar PDF', labelEn: 'Crop PDF' },
  comprimir: { label: 'Comprimir PDF', labelEn: 'Compress PDF' },
  reparar: { label: 'Reparar PDF', labelEn: 'Repair PDF' },
  desbloquear: { label: 'Desbloquear PDF', labelEn: 'Unlock PDF' },
  proteger: { label: 'Proteger PDF', labelEn: 'Protect PDF' },
  censurar: { label: 'Censurar PDF', labelEn: 'Redact PDF' },
  comparar: { label: 'Comparar PDF', labelEn: 'Compare PDF' },
  privacidad: { label: 'Política de Privacidad', labelEn: 'Privacy Policy' },
  terminos: { label: 'Términos y Condiciones', labelEn: 'Terms & Conditions' },
  'aviso-legal': { label: 'Aviso Legal', labelEn: 'Legal Notice' },
  dpa: { label: 'DPA', labelEn: 'DPA' },
  faq: { label: 'FAQ', labelEn: 'FAQ' },
  contacto: { label: 'Contacto', labelEn: 'Contact' },
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbSegment[] = [{ label: 'Inicio', labelEn: 'Home', href: '/' }];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const mapped = ROUTE_MAP[segment];
    if (mapped) {
      breadcrumbs.push({
        label: mapped.label,
        labelEn: mapped.labelEn,
        href: currentPath,
      });
    }
  }

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav
      aria-label={isEs ? 'Ruta de navegación' : 'Breadcrumb'}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2"
    >
      <ol
        className="flex flex-wrap items-center gap-1 text-[11px] font-mono text-zinc-500"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1" itemScope itemType="https://schema.org/ListItem">
              {i > 0 && <ChevronRight className="w-3 h-3 text-zinc-600 flex-shrink-0" aria-hidden="true" />}
              {isLast ? (
                <span className="text-zinc-400 font-medium" aria-current="page" itemProp="name">
                  {i === 0 ? <Home className="w-3.5 h-3.5 inline mr-0.5" aria-hidden="true" /> : null}
                  {isEs ? crumb.label : crumb.labelEn}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-white transition-colors inline-flex items-center"
                  itemProp="item"
                >
                  {i === 0 ? <Home className="w-3 h-3 mr-0.5" aria-hidden="true" /> : null}
                  <span itemProp="name">{isEs ? crumb.label : crumb.labelEn}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(i + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}