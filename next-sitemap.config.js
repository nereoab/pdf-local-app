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
  exclude: ['/api/*', '/admin/*'],
  generateIndexSitemap: false,
  changefreq: 'weekly',
  priority: 0.7,
  transform: async (config, path) => {
    let priority = config.priority;
    let changefreq = config.changefreq;

    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (
      path.startsWith('/editar') ||
      path.startsWith('/organizar') ||
      path.startsWith('/convertir') ||
      path.startsWith('/optimizar')
    ) {
      priority = 0.9;
      changefreq = 'weekly';
    } else if (
      path.startsWith('/privacidad') ||
      path.startsWith('/terminos') ||
      path.startsWith('/aviso-legal') ||
      path.startsWith('/dpa')
    ) {
      priority = 0.3;
      changefreq = 'monthly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
