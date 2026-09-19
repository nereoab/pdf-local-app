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
      path.startsWith('/en/txt-')
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
      { href: `${config.siteUrl}${enPath}`, hreflang: 'x-default', hrefIsAbsolute: true },
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
