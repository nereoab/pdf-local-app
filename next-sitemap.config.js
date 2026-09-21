/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: '/api/' },
      { userAgent: '*', disallow: '/admin/' },
    ],
  },
  exclude: [
    '/api/*',
    '/admin/*',
    '/icon.png',
    '/icon-192.png',
    '/favicon.ico',
    '/desbloquear',
    '/desbloquear-pdf',
    '/optimizar/comprimir-pdf',
    '/optimizar/desbloquear-pdf',
    '/optimizar/proteger-pdf',
    '/editar/firma',
    '/en/convertir*',
    '/en/organizar*',
    '/en/editar*',
    '/en/optimizar*',
    '/en/contacto',
    '/en/aviso-legal',
    '/en/privacidad',
    '/en/terminos',
  ],
  generateIndexSitemap: false,
  changefreq: 'weekly',
  priority: 0.7,
  additionalPaths: async (config) => {
    const enRoutes = [
      '/en',
      '/en/organize',
      '/en/optimize',
      '/en/edit',
      '/en/convert',
      '/en/merge-pdf',
      '/en/split-pdf',
      '/en/delete-pdf-pages',
      '/en/reorder-pdf-pages',
      '/en/rotate-pdf',
      '/en/crop-pdf',
      '/en/compress-pdf',
      '/en/repair-pdf',
      '/en/protect-pdf',
      '/en/unlock-pdf',
      '/en/redact-pdf',
      '/en/compare-pdf',
      '/en/edit-pdf',
      '/en/bates-numbering',
      '/en/watermark-pdf',
      '/en/remove-watermark',
      '/en/sign-pdf',
      '/en/ocr-pdf',
      '/en/pdf-to-word',
      '/en/word-to-pdf',
      '/en/pdf-to-excel',
      '/en/excel-to-pdf',
      '/en/pdf-to-powerpoint',
      '/en/powerpoint-to-pdf',
      '/en/pdf-to-jpg',
      '/en/jpg-to-pdf',
      '/en/pdf-to-html',
      '/en/html-to-pdf',
      '/en/pdf-to-txt',
      '/en/txt-to-pdf',
      '/en/convert-pdf-to-black-and-white',
      '/en/privacy',
      '/en/terms',
      '/en/faq',
      '/en/contact',
      '/en/legal-notice',
      '/en/dpa',
      // English Long-tail Solutions
      '/en/solutions/compress-pdf-to-200kb',
      '/en/solutions/compress-pdf-to-1mb',
      '/en/solutions/compress-pdf-to-100kb',
      '/en/solutions/remove-camscanner-watermark',
      '/en/solutions/bates-numbering-legal-pdf',
      '/en/solutions/reverse-bates-numbering-pdf',
      '/en/solutions/redact-pdf-free-permanently',
      '/en/solutions/repair-corrupted-pdf-file',
      '/en/solutions/edit-pdf-text-without-formatting-loss',
      '/en/solutions/sign-pdf-online-without-printing',
      '/en/solutions/convert-pdf-to-editable-word-doc',
      '/en/solutions/extract-tables-from-pdf-to-excel',
      // Organizar Long-tail (EN)
      '/en/solutions/merge-pdf-for-court-filings-and-bids',
      '/en/solutions/combine-thesis-chapters-pdf',
      '/en/solutions/extract-specific-pages-from-pdf',
      '/en/solutions/split-pdf-by-sections-or-chapters',
      '/en/solutions/remove-blank-pages-from-pdf',
      '/en/solutions/reverse-pdf-page-order',
      '/en/solutions/rotate-landscape-blueprints-pdf',
      '/en/solutions/crop-white-margins-pdf-for-printing',
      // Optimizar Long-tail (EN)
      '/en/solutions/compress-pdf-for-email-attachment',
      '/en/solutions/encrypt-confidential-pdf-aes256-offline',
      '/en/solutions/unlock-pdf-print-copy-permissions',
      '/en/solutions/compare-two-pdf-contract-versions',
      // Editar Long-tail (EN)
      '/en/solutions/searchable-ocr-pdf-without-uploading',
      '/en/solutions/watermark-draft-confidential-pdf',
      // Convertir Long-tail (EN)
      '/en/solutions/convert-word-to-pdf-exact-formatting',
      '/en/solutions/fit-excel-spreadsheet-to-single-page-pdf',
      '/en/solutions/combine-photos-receipts-into-one-pdf',
      '/en/solutions/convert-pdf-pages-to-high-res-jpg',
      '/en/solutions/convert-pdf-to-editable-powerpoint-slides',
      '/en/solutions/save-powerpoint-presentation-as-pdf',
      '/en/solutions/extract-plain-text-from-pdf-without-format',
      '/en/solutions/convert-txt-notes-to-formatted-pdf',
      '/en/solutions/convert-pdf-to-responsive-html-code',
      '/en/solutions/save-webpage-or-html-code-as-pdf',
      // Comparisons & Alternatives (EN)
      '/en/compare/pdfblack-vs-ilovepdf',
      '/en/compare/pdfblack-vs-smallpdf',
      '/en/alternatives/private-ilovepdf-alternative',
      '/en/alternatives/private-smallpdf-alternative',
      // Technical Glossary & Knowledge Hub (EN)
      '/en/glossary',
      '/en/glossary/bates-numbering',
      '/en/glossary/pdf-a-vs-standard-pdf',
      '/en/glossary/aes-256-pdf-encryption',
      '/en/glossary/binary-pdf-redaction',
      '/en/glossary/ocr-optical-character-recognition-pdf',
      '/en/glossary/zero-knowledge-pdf-processing',
      // B2B Enterprise & Industry Solutions (EN)
      '/en/industries',
      '/en/industries/legal',
      '/en/industries/healthcare',
      '/en/industries/finance',
      '/en/industries/government',
    ];
    const results = [];
    for (const r of enRoutes) {
      results.push(await config.transform(config, r));
    }
    return results;
  },
  transform: async (config, path) => {
    const ROUTE_PAIRS = {
      '/': '/en',
      '/organizar': '/en/organize',
      '/optimizar': '/en/optimize',
      '/editar': '/en/edit',
      '/convertir': '/en/convert',
      '/organizar/unir': '/en/merge-pdf',
      '/organizar/dividir': '/en/split-pdf',
      '/organizar/eliminar': '/en/delete-pdf-pages',
      '/organizar/reordenar': '/en/reorder-pdf-pages',
      '/organizar/rotar': '/en/rotate-pdf',
      '/organizar/recortar': '/en/crop-pdf',
      '/optimizar/comprimir': '/en/compress-pdf',
      '/optimizar/reparar': '/en/repair-pdf',
      '/optimizar/proteger': '/en/protect-pdf',
      '/optimizar/desbloquear': '/en/unlock-pdf',
      '/optimizar/censurar': '/en/redact-pdf',
      '/optimizar/comparar': '/en/compare-pdf',
      '/editar/texto': '/en/edit-pdf',
      '/editar/foliar': '/en/bates-numbering',
      '/editar/marca-agua': '/en/watermark-pdf',
      '/editar/quitar-marca-agua': '/en/remove-watermark',
      '/editar/firmar': '/en/sign-pdf',
      '/editar/ocr': '/en/ocr-pdf',
      '/convertir/pdf-word': '/en/pdf-to-word',
      '/convertir/word-pdf': '/en/word-to-pdf',
      '/convertir/pdf-excel': '/en/pdf-to-excel',
      '/convertir/excel-pdf': '/en/excel-to-pdf',
      '/convertir/pdf-powerpoint': '/en/pdf-to-powerpoint',
      '/convertir/powerpoint-pdf': '/en/powerpoint-to-pdf',
      '/convertir/pdf-jpg': '/en/pdf-to-jpg',
      '/convertir/jpg-pdf': '/en/jpg-to-pdf',
      '/convertir/pdf-html': '/en/pdf-to-html',
      '/convertir/html-pdf': '/en/html-to-pdf',
      '/convertir/pdf-texto': '/en/pdf-to-txt',
      '/convertir/texto-pdf': '/en/txt-to-pdf',
      '/convertir/pdf-blanco-negro': '/en/convert-pdf-to-black-and-white',
      '/privacidad': '/en/privacy',
      '/terminos': '/en/terms',
      '/faq': '/en/faq',
      '/contacto': '/en/contact',
      '/aviso-legal': '/en/legal-notice',
      '/dpa': '/en/dpa',
      // Soluciones Long-Tail (Spanish <-> English)
      '/soluciones/comprimir-pdf-a-200kb': '/en/solutions/compress-pdf-to-200kb',
      '/soluciones/comprimir-pdf-a-1mb': '/en/solutions/compress-pdf-to-1mb',
      '/soluciones/comprimir-pdf-a-100kb': '/en/solutions/compress-pdf-to-100kb',
      '/soluciones/quitar-marca-agua-camscanner': '/en/solutions/remove-camscanner-watermark',
      '/soluciones/foliar-expediente-judicial': '/en/solutions/bates-numbering-legal-pdf',
      '/soluciones/foliar-pdf-de-atras-hacia-adelante': '/en/solutions/reverse-bates-numbering-pdf',
      '/soluciones/censurar-datos-personales-pdf': '/en/solutions/redact-pdf-free-permanently',
      '/soluciones/reparar-pdf-danado': '/en/solutions/repair-corrupted-pdf-file',
      '/soluciones/editar-texto-pdf-sin-desconfigurar':
        '/en/solutions/edit-pdf-text-without-formatting-loss',
      '/soluciones/firmar-pdf-sin-imprimir': '/en/solutions/sign-pdf-online-without-printing',
      '/soluciones/convertir-pdf-a-word-editable': '/en/solutions/convert-pdf-to-editable-word-doc',
      '/soluciones/convertir-tabla-pdf-a-excel': '/en/solutions/extract-tables-from-pdf-to-excel',
      // Organizar Soluciones
      '/soluciones/unir-pdf-para-licitaciones-y-tramites':
        '/en/solutions/merge-pdf-for-court-filings-and-bids',
      '/soluciones/unir-capitulos-tesis-pdf': '/en/solutions/combine-thesis-chapters-pdf',
      '/soluciones/extraer-paginas-pdf-separadas': '/en/solutions/extract-specific-pages-from-pdf',
      '/soluciones/dividir-pdf-por-capitulos-rangos':
        '/en/solutions/split-pdf-by-sections-or-chapters',
      '/soluciones/quitar-hojas-en-blanco-pdf': '/en/solutions/remove-blank-pages-from-pdf',
      '/soluciones/invertir-orden-paginas-pdf': '/en/solutions/reverse-pdf-page-order',
      '/soluciones/rotar-planos-horizontales-pdf': '/en/solutions/rotate-landscape-blueprints-pdf',
      '/soluciones/recortar-margenes-blancos-pdf':
        '/en/solutions/crop-white-margins-pdf-for-printing',
      // Optimizar Soluciones
      '/soluciones/comprimir-pdf-para-correo-gmail':
        '/en/solutions/compress-pdf-for-email-attachment',
      '/soluciones/proteger-pdf-con-contrasena-sin-subir-a-nube':
        '/en/solutions/encrypt-confidential-pdf-aes256-offline',
      '/soluciones/desbloquear-pdf-para-imprimir-o-copiar':
        '/en/solutions/unlock-pdf-print-copy-permissions',
      '/soluciones/comparar-dos-versiones-contrato-pdf':
        '/en/solutions/compare-two-pdf-contract-versions',
      // Editar Soluciones
      '/soluciones/convertir-pdf-escaneado-a-texto-seleccionable':
        '/en/solutions/searchable-ocr-pdf-without-uploading',
      '/soluciones/poner-marca-agua-borrador-confidencial':
        '/en/solutions/watermark-draft-confidential-pdf',
      // Convertir Soluciones
      '/soluciones/convertir-docx-a-pdf-sin-mover-fuentes':
        '/en/solutions/convert-word-to-pdf-exact-formatting',
      '/soluciones/ajustar-hoja-excel-a-una-pagina-pdf':
        '/en/solutions/fit-excel-spreadsheet-to-single-page-pdf',
      '/soluciones/unir-fotos-e-imagenes-en-un-solo-pdf':
        '/en/solutions/combine-photos-receipts-into-one-pdf',
      '/soluciones/extraer-imagenes-pdf-alta-resolucion':
        '/en/solutions/convert-pdf-pages-to-high-res-jpg',
      '/soluciones/convertir-pdf-a-diapositivas-powerpoint':
        '/en/solutions/convert-pdf-to-editable-powerpoint-slides',
      '/soluciones/guardar-presentacion-powerpoint-a-pdf':
        '/en/solutions/save-powerpoint-presentation-as-pdf',
      '/soluciones/extraer-texto-plano-de-pdf-sin-formato':
        '/en/solutions/extract-plain-text-from-pdf-without-format',
      '/soluciones/convertir-notas-txt-a-pdf-formateado':
        '/en/solutions/convert-txt-notes-to-formatted-pdf',
      '/soluciones/convertir-pdf-a-codigo-html-responsive':
        '/en/solutions/convert-pdf-to-responsive-html-code',
      '/soluciones/guardar-pagina-web-o-codigo-html-en-pdf':
        '/en/solutions/save-webpage-or-html-code-as-pdf',
      // Comparativas y Alternativas (ES <-> EN)
      '/comparar/pdfblack-vs-ilovepdf': '/en/compare/pdfblack-vs-ilovepdf',
      '/comparar/pdfblack-vs-smallpdf': '/en/compare/pdfblack-vs-smallpdf',
      '/alternativas/alternativa-privada-a-ilovepdf':
        '/en/alternatives/private-ilovepdf-alternative',
      '/alternativas/alternativa-privada-a-smallpdf':
        '/en/alternatives/private-smallpdf-alternative',
      // Glosario Técnico y Centro de Recursos (ES <-> EN)
      '/glosario': '/en/glossary',
      '/glosario/numeracion-bates': '/en/glossary/bates-numbering',
      '/glosario/pdf-a-vs-pdf-estandar': '/en/glossary/pdf-a-vs-standard-pdf',
      '/glosario/cifrado-aes-256-pdf': '/en/glossary/aes-256-pdf-encryption',
      '/glosario/censura-binaria-pdf': '/en/glossary/binary-pdf-redaction',
      '/glosario/ocr-reconocimiento-optico-pdf':
        '/en/glossary/ocr-optical-character-recognition-pdf',
      '/glosario/procesamiento-zero-knowledge-pdf': '/en/glossary/zero-knowledge-pdf-processing',
      // Soluciones B2B por Industria (ES <-> EN)
      '/industrias': '/en/industries',
      '/industrias/legal': '/en/industries/legal',
      '/industrias/salud': '/en/industries/healthcare',
      '/industrias/finanzas': '/en/industries/finance',
      '/industrias/gobierno': '/en/industries/government',
    };

    const INVERTED_PAIRS = Object.fromEntries(
      Object.entries(ROUTE_PAIRS).map(([es, en]) => [en, es]),
    );

    let priority = config.priority;
    let changefreq = config.changefreq;

    if (path === '/' || path === '/en') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path.startsWith('/soluciones/') || path.startsWith('/en/solutions/')) {
      priority = 0.85;
      changefreq = 'weekly';
    } else if (
      path.startsWith('/comparar/') ||
      path.startsWith('/en/compare/') ||
      path.startsWith('/alternativas/') ||
      path.startsWith('/en/alternatives/')
    ) {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (
      path === '/industrias' ||
      path === '/en/industries' ||
      path.startsWith('/industrias/') ||
      path.startsWith('/en/industries/')
    ) {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (
      path === '/glosario' ||
      path === '/en/glossary' ||
      path.startsWith('/glosario/') ||
      path.startsWith('/en/glossary/')
    ) {
      priority = 0.75;
      changefreq = 'weekly';
    } else if (
      path.includes('/editar') ||
      path.includes('/organizar') ||
      path.includes('/convertir') ||
      path.includes('/optimizar') ||
      path.startsWith('/en/merge') ||
      path.startsWith('/en/split') ||
      path.startsWith('/en/delete') ||
      path.startsWith('/en/reorder') ||
      path.startsWith('/en/rotate') ||
      path.startsWith('/en/crop') ||
      path.startsWith('/en/compress') ||
      path.startsWith('/en/repair') ||
      path.startsWith('/en/protect') ||
      path.startsWith('/en/unlock') ||
      path.startsWith('/en/redact') ||
      path.startsWith('/en/compare') ||
      path.startsWith('/en/edit') ||
      path.startsWith('/en/bates') ||
      path.startsWith('/en/watermark') ||
      path.startsWith('/en/remove') ||
      path.startsWith('/en/sign') ||
      path.startsWith('/en/ocr') ||
      path.startsWith('/en/pdf-') ||
      path.startsWith('/en/word-') ||
      path.startsWith('/en/excel-') ||
      path.startsWith('/en/powerpoint-') ||
      path.startsWith('/en/jpg-') ||
      path.startsWith('/en/html-') ||
      path.startsWith('/en/txt-') ||
      path.startsWith('/en/convert-')
    ) {
      priority = 0.9;
      changefreq = 'weekly';
    } else {
      priority = 0.4;
      changefreq = 'monthly';
    }

    const isEn = path.startsWith('/en');
    const esPath = isEn ? INVERTED_PAIRS[path] || '/' : path;
    const enPath = isEn ? path : ROUTE_PAIRS[path] || '/en';

    const alternateRefs = [
      { href: `${config.siteUrl}${esPath}`, hreflang: 'es', hrefIsAbsolute: true },
      { href: `${config.siteUrl}${enPath}`, hreflang: 'en', hrefIsAbsolute: true },
      { href: `${config.siteUrl}${esPath}`, hreflang: 'x-default', hrefIsAbsolute: true },
    ];

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
      alternateRefs,
    };
  },
};
