import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Lista de User-Agents de robots de búsqueda para no forzar redirección arbitraria ──
const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'baiduspider',
  'slurp',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
];

function isSearchBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot));
}

/**
 * Detecta el idioma preferido a partir de la cabecera Accept-Language del navegador.
 * Interpreta ponderaciones de calidad (q=0.9) ordenando por prioridad real del usuario.
 */
function parseAcceptLanguage(
  acceptLanguageHeader: string | null,
): 'es' | 'en' | 'pt' | 'fr' | 'zh' {
  if (!acceptLanguageHeader) return 'en';

  try {
    const languages = acceptLanguageHeader
      .split(',')
      .map((item) => {
        const [lang, qVal] = item.trim().split(';q=');
        return {
          lang: lang.trim().toLowerCase(),
          q: qVal ? parseFloat(qVal) : 1.0,
        };
      })
      .sort((a, b) => b.q - a.q);

    for (const { lang } of languages) {
      if (lang.startsWith('es')) return 'es';
      if (lang.startsWith('pt')) return 'pt';
      if (lang.startsWith('fr')) return 'fr';
      if (lang.startsWith('zh')) return 'zh';
      if (lang.startsWith('en')) return 'en';
    }
  } catch {
    // Si la cabecera está malformada, fallback seguro a inglés
  }

  return 'en';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Interceptar exclusivamente la raíz '/' (www.pdf-black.com o pdf-black.com)
  if (pathname === '/') {
    const userAgent = request.headers.get('user-agent') || '';

    // 1. Robots de Búsqueda (Googlebot, Bingbot, etc.):
    // Redirigir permanentemente a la versión canónica x-default (/en) con HTTP 308 para consolidar autoridad
    if (isSearchBot(userAgent)) {
      return NextResponse.redirect(new URL('/en', request.url), 308);
    }

    // 2. Preferencia de Usuario Manual Persistida en Cookie:
    // Si el usuario ya pulsó explícitamente un idioma, respetamos su decisión al 100%
    const langCookie = request.cookies.get('pdfblack-lang')?.value;
    if (langCookie === 'es') {
      return NextResponse.redirect(new URL('/es', request.url), 308);
    }
    if (langCookie === 'pt') {
      return NextResponse.redirect(new URL('/pt', request.url), 308);
    }
    if (langCookie === 'fr') {
      return NextResponse.redirect(new URL('/fr', request.url), 308);
    }
    if (langCookie === 'zh') {
      return NextResponse.redirect(new URL('/zh', request.url), 308);
    }
    if (langCookie === 'en') {
      return NextResponse.redirect(new URL('/en', request.url), 308);
    }

    // 3. Detección Inteligente por Accept-Language (Idioma del Sistema / Navegador):
    const acceptLang = request.headers.get('accept-language');
    const detectedLang = parseAcceptLanguage(acceptLang);

    if (detectedLang === 'es') {
      return NextResponse.redirect(new URL('/es', request.url), 308);
    }
    if (detectedLang === 'pt') {
      return NextResponse.redirect(new URL('/pt', request.url), 308);
    }
    if (detectedLang === 'fr') {
      return NextResponse.redirect(new URL('/fr', request.url), 308);
    }
    if (detectedLang === 'zh') {
      return NextResponse.redirect(new URL('/zh', request.url), 308);
    }

    // Por defecto internacional (Inglés para EE.UU., Europa, Asia y resto del mundo)
    return NextResponse.redirect(new URL('/en', request.url), 308);
  }

  return NextResponse.next();
}

export const config = {
  // Aplicar únicamente a la raíz '/' para 0ms de sobrecarga en herramientas
  matcher: ['/'],
};
