#!/usr/bin/env node
/**
 * SEO Audit Engine for PDFBlack ♠️
 * Analizador estático de salud SEO On-Page para Next.js App Router.
 * Verifica: Layouts con Metadata en páginas cliente, inyección de Schema.org,
 * jerarquía de encabezados h1 y cobertura de metadatos.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_DIR = path.resolve(__dirname, '../app');

const results = {
  totalPages: 0,
  clientPages: 0,
  clientPagesWithLayoutMetadata: 0,
  clientPagesMissingLayoutMetadata: [],
  pagesWithSchema: 0,
  pagesWithFaqSchema: 0,
  pagesWithWebApplicationSchema: 0,
  pagesWithHowToSchema: 0,
  pagesWithBreadcrumbsSchema: 0,
  h1Anomalies: [],
};

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Excluir directorios internos de api y admin
      if (entry.name === 'api' || entry.name === 'admin' || entry.name === 'node_modules') {
        continue;
      }
      scanDir(fullPath);
    } else if (entry.isFile() && entry.name === 'page.tsx') {
      results.totalPages++;
      auditPage(fullPath);
    }
  }
}

function auditPage(pagePath) {
  const content = fs.readFileSync(pagePath, 'utf-8');
  const isClient = content.includes("'use client'") || content.includes('"use client"');
  const pageDir = path.dirname(pagePath);
  const relPath = path.relative(APP_DIR, pagePath).replace(/\\/g, '/');

  if (isClient) {
    results.clientPages++;
    const layoutPath = path.join(pageDir, 'layout.tsx');
    if (fs.existsSync(layoutPath)) {
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      if (layoutContent.includes('metadata') || layoutContent.includes('generateMetadata')) {
        results.clientPagesWithLayoutMetadata++;
      } else {
        results.clientPagesMissingLayoutMetadata.push({
          relPath,
          reason: 'layout.tsx sin export metadata',
        });
      }
    } else {
      results.clientPagesMissingLayoutMetadata.push({
        relPath,
        reason: 'Falta layout.tsx en el directorio',
      });
    }
  }

  // Comprobar esquemas JSON-LD
  const hasSchema = content.includes('application/ld+json') || content.includes('@context');
  if (hasSchema) {
    results.pagesWithSchema++;
    if (content.includes('FAQPage')) results.pagesWithFaqSchema++;
    if (content.includes('WebApplication') || content.includes('SoftwareApplication'))
      results.pagesWithWebApplicationSchema++;
    if (content.includes('HowTo')) results.pagesWithHowToSchema++;
    if (content.includes('BreadcrumbList')) results.pagesWithBreadcrumbsSchema++;
  }

  // Comprobar encabezados <h1>
  const h1Matches = content.match(/<h1[\s>]/g) || [];
  if (h1Matches.length === 0) {
    results.h1Anomalies.push({ relPath, issue: 'Cero <h1> detectados en el componente' });
  } else if (h1Matches.length > 1) {
    results.h1Anomalies.push({ relPath, issue: `Múltiples <h1> detectados (${h1Matches.length})` });
  }
}

console.log('♠️ Iniciando Auditoría de Arquitectura SEO On-Page para PDFBlack...\n');
scanDir(APP_DIR);

console.log('====================================================');
console.log('       REPORTE DE SALUD SEO ON-PAGE (PDFBlack)       ');
console.log('====================================================');
console.log(`Total de páginas (page.tsx) analizadas:  ${results.totalPages}`);
console.log(`Páginas interactivas ('use client'):     ${results.clientPages}`);
console.log(`  - Con layout.tsx de metadata server:   ${results.clientPagesWithLayoutMetadata}`);
console.log(
  `  - Pendientes / sin layout de metadata: ${results.clientPagesMissingLayoutMetadata.length}`,
);
console.log('----------------------------------------------------');
console.log('COBERTURA DE DATOS ESTRUCTURADOS (Schema.org JSON-LD):');
console.log(`  - Páginas con JSON-LD activo:          ${results.pagesWithSchema}`);
console.log(`  - Schema WebApplication / SoftwareApp: ${results.pagesWithWebApplicationSchema}`);
console.log(`  - Schema FAQPage (Rich Snippets PAA):  ${results.pagesWithFaqSchema}`);
console.log(`  - Schema HowTo (Paso a paso):          ${results.pagesWithHowToSchema}`);
console.log(`  - Schema BreadcrumbList (Migas de pan): ${results.pagesWithBreadcrumbsSchema}`);
console.log('----------------------------------------------------');

if (results.clientPagesMissingLayoutMetadata.length > 0) {
  console.log('⚠️  Páginas cliente sin metadata server aislada (layout.tsx):');
  results.clientPagesMissingLayoutMetadata.slice(0, 10).forEach((item) => {
    console.log(`   - ${item.relPath} (${item.reason})`);
  });
  if (results.clientPagesMissingLayoutMetadata.length > 10) {
    console.log(`   ... y ${results.clientPagesMissingLayoutMetadata.length - 10} más.`);
  }
} else {
  console.log('✅ Cobertura perfecta: 100% de páginas cliente cuentan con metadata server.');
}

console.log('====================================================\n');
