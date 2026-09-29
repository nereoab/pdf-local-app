# Regla de Excelencia en SEO Orgánico y Rendimiento para PDFBlack ♠️

Esta regla de observancia estricta aplica a todos los agentes que desarrollen, modifiquen o auditen páginas web, metadatos y componentes en **PDFBlack** (`my-app`).

---

## 1. Principios de Observancia Obligatoria

1. **Prohibido Crear Páginas Cliente sin Metadata Server:**
   * En Next.js App Router, todo archivo `app/**/page.tsx` con directiva `'use client'` **debe** contar obligatoriamente con su respectivo `app/**/layout.tsx` que exporte el objeto `metadata` tipado desde Next.js.
   * La metadata debe generarse a través de `@/lib/seo-metadata.ts` o incorporar el bloque canónico absoluto con `alternates.languages` bilingüe (`es` / `en`).

2. **Garantía de Rich Snippets (Schema.org JSON-LD):**
   * Toda landing page de herramienta pública debe incorporar en su cuerpo o head los schemas JSON-LD:
     * `WebApplication` / `SoftwareApplication` (con precio $0 y featureList).
     * `FAQPage` (mínimo 6 preguntas de alta intención técnica y privacidad).
     * `BreadcrumbList` (migas de pan jerárquicas).
     * `HowTo` (guía paso a paso con `HowToStep`).

3. **Arquitectura Semántica On-Page:**
   * Exactamente un único `<h1>` por página, alineado directamente con la consulta objetivo (ej. *"Unir Archivos PDF Online Gratis"*).
   * Los encabezados secundarios (`<h2>`, `<h3>`) deben responder a sub-intenciones de búsqueda (ej. *"¿Cómo unir múltiples PDFs?"*, *"Seguridad y Privacidad Zero-Knowledge"*).
   * Toda imagen debe tener un atributo `alt` descriptivo.

4. **Preservación de Core Web Vitals:**
   * La carga de bibliotecas pesadas de manipulación PDF (`pdf-lib`, `pdfjs-dist`, `tesseract.js`) **nunca debe bloquear el hilo principal**.
   * Debe utilizarse el patrón de Web Worker con transferencia zero-copy y `next/dynamic` con `ssr: false` para componentes interactivos complejos, asegurando que el First Contentful Paint (FCP) y Largest Contentful Paint (LCP) sean casi instantáneos.

5. **Sincronización con Sitemaps y GSC:**
   * Al agregar o renombrar una ruta pública, verificar su inclusión en `next-sitemap.config.js`.
   * Para auditar el impacto o corregir problemas de indexación, utilizar activamente los servidores MCP disponibles (`google-search-console` para `sc-domain:pdf-black.com` y `google-analytics` para `properties/548228704`).
