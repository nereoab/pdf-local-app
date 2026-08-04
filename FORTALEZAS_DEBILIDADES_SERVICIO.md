# 📊 PDFBlack — Fortalezas y Debilidades por Aspecto (Énfasis en Servicio al Usuario)

**Fecha**: 2 de agosto de 2026  
**Versión**: PDFBlack v0.1.0  
**Sitio**: [pdfblack.com](https://pdfblack.com)

---

## ÍNDICE

1. [Visión General](#1-visión-general)
2. [Servicio al Usuario](#2-servicio-al-usuario)
3. [Onboarding y Primera Experiencia](#3-onboarding-y-primera-experiencia)
4. [Funcionalidad y Herramientas](#4-funcionalidad-y-herramientas)
5. [Seguridad y Privacidad](#5-seguridad-y-privacidad)
6. [Rendimiento y Velocidad](#6-rendimiento-y-velocidad)
7. [UX/UI y Accesibilidad](#7-uxui-y-accesibilidad)
8. [SEO y Descubribilidad](#8-seo-y-descubribilidad)
9. [Calidad Técnica y DevOps](#9-calidad-técnica-y-devops)
10. [Resumen Ejecutivo](#10-resumen-ejecutivo)

---

## 1. VISIÓN GENERAL

PDFBlack es una aplicación web de procesamiento de PDF **100% gratuita y 100% local** (client-side). No requiere registro, no impone límites de tamaño, y nunca sube archivos a servidores externos. Ofrece 24 herramientas en 4 categorías: Editar, Organizar, Convertir y Optimizar.

---

## 2. SERVICIO AL USUARIO

### 2.1 FORTALEZAS

| # | Fortaleza | Evidencia |
|:---|:---|:---|
| 1 | **100% gratuito sin restricciones** | Sin paywalls, sin límites de tamaño, sin marcas de agua en output, sin necesidad de registro. El usuario puede usar todas las herramientas inmediatamente. |
| 2 | **Sin fricción de registro obligatorio** | El botón "REGISTRARSE" en el header está etiquetado como "100% OPCIONAL • SIN COSTO". El modal de registro deja claro que todas las herramientas funcionan sin cuenta. |
| 3 | **Privacidad como promesa central** | El mensaje "Procesamiento 100% local en tu navegador" se repite consistentemente en: página principal, footer, FAQ, páginas de herramientas, certificado de redacción. El usuario sabe exactamente qué ocurre con sus archivos. |
| 4 | **Transparencia técnica** | Cada grupo de herramientas (Editar, Organizar, Convertir, Optimizar) tiene una sección "🔒 Proceso Binario y Seguridad" que explica en detalle qué sucede con el archivo a nivel técnico (RAM, content streams, objetos PDF). Esto genera confianza en usuarios técnicos y legales. |
| 5 | **Documentación legal completa** | 5 páginas legales: Política de Privacidad, Términos y Condiciones, Aviso Legal, DPA (Data Processing Agreement), y banner de cookies GDPR. Cumplimiento normativo básico cubierto. |
| 6 | **Página de FAQ** (`/faq`) | Aunque limitada (5 preguntas), cubre las dudas más críticas: privacidad de archivos, límites de tamaño, funcionamiento offline, calidad de compresión, y gratuidad. |
| 7 | **Página de Contacto** (`/contacto`) | Formulario con nombre, email y mensaje. Promete "respuesta rápida en menos de 24 horas". Feedback visual con animación de éxito al enviar. |
| 8 | **Sistema de registro con email de confirmación** | El flujo de registro genera contraseña segura automática (12 caracteres con `crypto.getRandomValues`), permite copiarla al portapapeles, y prepara un correo de bienvenida HTML profesional con diseño oscuro. |
| 9 | **Banner de cookies GDPR-friendly** | 3 opciones granulares: "Aceptar Todas", "Solo Esenciales", "Personalizar". Consentimiento guardado por 1 año en localStorage. Incluye enlace a Política de Privacidad. |
| 10 | **Breadcrumbs con Schema.org** | Navegación jerárquica en todas las páginas interiores con datos estructurados `BreadcrumbList` para SEO y orientación del usuario. |
| 11 | **Notificaciones toast (Sonner)** | Feedback visual para acciones: archivo cargado, errores de formato, registro exitoso, contraseña copiada, mensaje enviado. |
| 12 | **Soporte multi-idioma (ES/EN)** | Toda la interfaz está traducida: navegación, herramientas, FAQ, contacto, legal, auth modal, cookies, breadcrumbs, página principal. Cambio de idioma con un solo clic en el header. |
| 13 | **Detección automática de idioma del navegador** | El `LanguageContext` infiere el idioma inicial del `navigator.language` del usuario. |
| 14 | **Prompt de "¿Cerrar sesión?"** | Al hacer clic en el avatar del usuario, se muestra un `confirm()` antes de cerrar sesión, evitando cierres accidentales. |

### 2.2 DEBILIDADES

| # | Debilidad | Severidad | Evidencia |
|:---|:---|:---|:---|
| 1 | **El formulario de contacto no envía emails reales** | 🔴 CRÍTICA | `handleSubmit` solo marca `setSubmitted(true)` y muestra un toast. No hay llamada a API, no hay envío a servidor, no hay `fetch()`. Los mensajes de los usuarios **se pierden**. El email `soporte@pdfblack.com` mostrado en la página probablemente no existe o no se monitorea. |
| 2 | **El servicio de email es una simulación** | 🔴 CRÍTICA | `emailService.ts` tiene el envío real comentado (`/* ... */`). Todos los correos quedan en `localStorage` con estado `pending`. El código incluye comentarios: "Descomentar cuando se configure SMTP" y "Cuando tengamos el dominio, recibirás un correo". El usuario cree que recibirá un email de confirmación pero **nunca lo recibe**. |
| 3 | **Contraseñas almacenadas en texto plano en localStorage** | 🔴 CRÍTICA | `useAuthStore.ts` guarda `password` sin hashear en `localStorage` bajo la clave `pdfblack-auth`. Cualquier persona con acceso al navegador puede leer las contraseñas. Incumple OWASP ASVS 2.9.2 y cualquier estándar de seguridad básico. |
| 4 | **FAQ extremadamente limitado (solo 5 preguntas)** | 🟠 ALTA | Solo cubre: privacidad, límites, offline, calidad de compresión, gratuidad. Faltan preguntas críticas como: ¿cómo firmar?, ¿qué formatos soporta?, ¿cómo censurar datos sensibles?, ¿qué navegadores son compatibles?, ¿cómo recuperar contraseña?, ¿la firma es legalmente vinculante? |
| 5 | **Sin buscador en FAQ ni documentación** | 🟠 ALTA | Las 5 preguntas están en un acordeón estático. No hay campo de búsqueda para filtrar preguntas. |
| 6 | **Sin página de documentación o guías de uso** | 🟠 ALTA | No existe `/docs`, `/help`, `/tutorials`, ni `/support`. Cada página de herramienta tiene instrucciones breves, pero no hay guías detalladas con capturas de pantalla, videos, o casos de uso. |
| 7 | **Sin chat en vivo ni chatbot** | 🟡 MEDIA | No hay Intercom, Crisp, Tidio, ni chatbot básico. El único canal es el formulario de contacto (que no funciona). |
| 8 | **Sin sistema de tickets o seguimiento** | 🟡 MEDIA | Al enviar el formulario de contacto, el usuario no recibe número de ticket, confirmación por email, ni enlace para hacer seguimiento. |
| 9 | **Sin página de estado (status page)** | 🟡 MEDIA | No hay `status.pdfblack.com` ni indicador de disponibilidad del servicio. Si algo falla, el usuario no sabe si es problema suyo o del sitio. |
| 10 | **Sin changelog o release notes** | 🟡 MEDIA | El usuario no sabe qué funcionalidades son nuevas, qué bugs se corrigieron, o qué mejoras se hicieron. |
| 11 | **"Respuesta rápida en menos de 24 horas" es publicidad falsa** | 🔴 CRÍTICA | La página de contacto promete respuesta en <24h, pero no hay sistema de envío real de mensajes. Esto es información engañosa para el usuario. |
| 12 | **El aviso de "correo de confirmación pendiente" puede generar desconfianza** | 🟠 ALTA | Después del registro, el modal muestra: "El correo de confirmación se enviará cuando configuremos el dominio y el servidor de email corporativo." Esto transmite amateurismo y falta de preparación. |
| 13 | **Sin página de "Acerca de" o "Equipo"** | 🟡 MEDIA | No hay información sobre quién está detrás de PDFBlack. Los usuarios empresariales necesitan saber quién provee el servicio. |
| 14 | **Sin blog o centro de recursos** | 🟡 MEDIA | Sin contenido educativo sobre PDF, guías de mejores prácticas, o casos de uso. Oportunidad perdida de SEO y fidelización. |
| 15 | **Sin integración con redes sociales** | 🟡 BAJA | No hay enlaces a Twitter/X, LinkedIn, GitHub, o Discord en el footer. La comunidad no tiene dónde congregarse. |
| 16 | **Sin página de precios ni comparativa** | 🟡 BAJA | Aunque es gratuito, una página de comparativa con competidores (iLovePDF, Smallpdf, Adobe) ayudaría a convertir usuarios que dudan. |
| 17 | **Sin onboarding interactivo** | 🟡 BAJA | No hay tour guiado, tooltips, o wizard de bienvenida para nuevos usuarios. |
| 18 | **Sin encuestas de satisfacción** | 🟡 BAJA | No hay NPS, CSAT, o formulario de feedback post-uso. |

---

## 3. ONBOARDING Y PRIMERA EXPERIENCIA

### 3.1 FORTALEZAS

| # | Fortaleza | Detalle |
|:---|:---|:---|
| 1 | **Hero claro y directo** | "Procesamiento PDF local. Sin servidores, privacidad total." — El usuario entiende la propuesta de valor en 2 segundos. |
| 2 | **Zona de carga prominente (Dropzone)** | Área de arrastrar y soltar con animación, icono de nube animado, y texto claro "Arrastra tu archivo PDF aquí o haz clic". Ocupa ~50% del viewport inicial. |
| 3 | **Drag & Drop global** | Al arrastrar un archivo a cualquier parte de la página, aparece un overlay de pantalla completa "Suelta tu PDF en cualquier lugar". Experiencia muy pulida. |
| 4 | **CTA principal "Seleccionar PDF"** | Botón blanco prominente con icono. Sin distracciones. |
| 5 | **Badge de confianza inmediato** | "100% GRATIS • SIN REGISTRO • SIN TARJETA" visible debajo de la dropzone. Reduce ansiedad del usuario. |
| 6 | **4 categorías con numeración estilo índice** | "001 / Edición visual directa", "002 / Estructura y organizador", etc. Transmite organización y profesionalismo. |
| 7 | **Vista previa del PDF cargado** | Al cargar un archivo, se muestra un iframe con el PDF y botón para quitarlo. El usuario ve inmediatamente que su archivo está listo. |

### 3.2 DEBILIDADES

| # | Debilidad | Severidad |
|:---|:---|:---|
| 1 | **Sin indicador de formatos aceptados en la dropzone** | 🟡 MEDIA |
| 2 | **Sin ejemplo de PDF de prueba** para que el usuario explore sin subir archivo propio | 🟡 MEDIA |
| 3 | **La barra de progreso de carga es simulada** (usa `Math.random()` para animar) | 🟡 BAJA |
| 4 | **Sin tooltips o ayuda contextual** en la interfaz | 🟡 MEDIA |

---

## 4. FUNCIONALIDAD Y HERRAMIENTAS

### 4.1 FORTALEZAS

| # | Fortaleza |
|:---|:---|
| 1 | **24 herramientas completas** — cobertura excepcional para ser gratuito |
| 2 | **Cifrado AES-256 profesional** conforme a ISO 32000-2:2020 (PDF 2.0) |
| 3 | **Censura TrueRedact v3** — doble modo precision+raster sin equivalente gratuito |
| 4 | **Reparación de PDF** con diagnóstico binario de 5 categorías |
| 5 | **OCR local** con Tesseract WASM |
| 6 | **Detección de PDF/A real** (inspección de catálogo de objetos) |
| 7 | **15 patrones geográficos** de detección de datos sensibles (ES, US, UK, DE, BR, AR, MX, CO, CL, PE + internacionales) |
| 8 | **Certificado de redacción** con cadena de custodia SHA-256 descargable |
| 9 | **Procesamiento 100% offline** después de cargar la página |
| 10 | **Sin límite de tamaño de archivo** (limitado solo por RAM del dispositivo) |

### 4.2 DEBILIDADES

| # | Debilidad | Severidad |
|:---|:---|:---|
| 1 | **Sin API REST** — no permite automatización ni integración con otros sistemas | 🔴 CRÍTICA |
| 2 | **Sin procesamiento por lotes** — solo un archivo a la vez | 🟠 ALTA |
| 3 | **Firma solo trazada** (dibujo), sin validez legal eIDAS/PKI | 🔴 CRÍTICA |
| 4 | **Conversión PDF→Office limitada** — reconstrucción por coordenadas, imprecisa en layouts complejos | 🟠 ALTA |
| 5 | **Sin soporte para formatos adicionales**: CAD, SVG, EPUB | 🟡 MEDIA |
| 6 | **Tesseract WASM ~10MB** — penaliza la carga inicial para todos los usuarios | 🟠 ALTA |
| 7 | **11 de 18 workers sin tests unitarios** | 🟠 ALTA |
| 8 | **Sin caché de resultados** — cada operación recalcula desde cero | 🟡 MEDIA |
| 9 | **Sin compresión de fuentes ni eliminación de objetos duplicados** | 🟡 BAJA |
| 10 | **El editor de texto no usa métricas reales de fuente** (factor fijo 0.55) | 🟡 BAJA |

---

## 5. SEGURIDAD Y PRIVACIDAD

### 5.1 FORTALEZAS

| # | Fortaleza |
|:---|:---|
| 1 | **Procesamiento 100% local** — archivos nunca salen del navegador |
| 2 | **CSP (Content Security Policy)** granular: `default-src 'self'`, `object-src 'none'`, `worker-src 'self' blob:` |
| 3 | **HSTS** con `max-age=63072000; includeSubDomains; preload` |
| 4 | **Headers de seguridad** en 2 capas: `next.config.ts` + `vercel.json` |
| 5 | **Cifrado AES-256 conforme a ISO 32000-2** con algoritmo 2.B de derivación de clave |
| 6 | **Web Crypto API** para todas las operaciones criptográficas |
| 7 | **Sanitización de metadatos** (title, author, subject, keywords, producer) |
| 8 | **Cadena de custodia SHA-256** con certificado de redacción descargable |
| 9 | **Audit log** con tipos de eventos y metadata |
| 10 | **Docker con usuario no-root** (UID 1001) |
| 11 | **Sin recolección de datos** — GDPR-friendly por diseño |
| 12 | **No rastrea, no perfila, no comparte datos** |

### 5.2 DEBILIDADES

| # | Debilidad | Severidad |
|:---|:---|:---|
| 1 | **Contraseñas en texto plano en localStorage** (`useAuthStore`) | 🔴 CRÍTICA |
| 2 | **Sin autenticación de dos factores (2FA/MFA)** | 🟠 ALTA |
| 3 | **Sin protección contra fuerza bruta** en login | 🟠 ALTA |
| 4 | **localStorage como único backend** — datos accesibles por cualquier script en el mismo origen | 🟠 ALTA |
| 5 | **Sin cifrado de datos en reposo** (todo en localStorage sin cifrar) | 🟡 MEDIA |
| 6 | **Sin política de retención de datos** documentada | 🟡 MEDIA |
| 7 | **Sin auditoría de accesos** (quién accedió, desde qué IP) | 🟡 MEDIA |
| 8 | **`'unsafe-eval'` y `'unsafe-inline'` en CSP** (necesarios para WASM/Tailwind pero reducen seguridad) | 🟡 MEDIA |
| 9 | **Sin notificación de brechas de seguridad** (no hay mecanismo para notificar a usuarios) | 🟡 MEDIA |
| 10 | **Sin botón "Reportar vulnerabilidad"** ni programa de bug bounty | 🟡 BAJA |

---

## 6. RENDIMIENTO Y VELOCIDAD

### 6.1 FORTALEZAS

| # | Fortaleza |
|:---|:---|
| 1 | **18 Web Workers** — operaciones pesadas nunca bloquean el hilo principal (UI siempre responsiva) |
| 2 | **Comlink 4.4** — comunicación tipada y zero-copy con workers |
| 3 | **Preconexiones DNS** en `<head>`: `fonts.googleapis.com`, `fonts.gstatic.com`, `cdnjs.cloudflare.com`, `cdn.syncfusion.com` |
| 4 | **Caché agresiva para estáticos**: `max-age=31536000, immutable` |
| 5 | **Docker multi-stage** — imagen final Alpine ~150MB |
| 6 | **Vercel serverless** — escalado automático |
| 7 | **Lazy loading de componentes** con `dynamic(() => import(...), { ssr: false })` |
| 8 | **Skeletons** durante carga de tabla de historial |

### 6.2 DEBILIDADES

| # | Debilidad | Severidad |
|:---|:---|:---|
| 1 | **Tesseract WASM ~10MB** carga para todos los usuarios, no solo los de OCR | 🟠 ALTA |
| 2 | **pdfjs-dist worker ~1.5MB** adicional | 🟠 ALTA |
| 3 | **Sin caché de resultados** — IndexedDB no utilizado | 🟡 MEDIA |
| 4 | **Sin Service Worker** (no es PWA completa, no hay modo offline avanzado) | 🟡 MEDIA |
| 5 | **RAM del navegador como límite** (~2-4GB por pestaña) — no advertido al usuario | 🟡 MEDIA |
| 6 | **OffscreenCanvas no disponible en Safari < 16.4** — fallback no implementado | 🟡 MEDIA |
| 7 | **Sin Image Lazy Loading** en vistas previas | 🟡 BAJA |
| 8 | **Sin compresión Brotli** (verificar configuración de Vercel) | 🟡 BAJA |

---

## 7. UX/UI Y ACCESIBILIDAD

### 7.1 FORTALEZAS

| # | Fortaleza |
|:---|:---|
| 1 | **Diseño visual premium** — tema oscuro consistente, tipografía, espaciado |
| 2 | **Animaciones fluidas** con Framer Motion (transiciones, hover, entrada/salida) |
| 3 | **Arquitectura de información excelente** — 4 categorías con numeración 001-004, dropdowns con ítems claros |
| 4 | **Drag & Drop global con overlay** — implementación muy pulida |
| 5 | **Responsive Design** (TailwindCSS 4) — funciona en móvil, tablet y desktop |
| 6 | **Breadcrumbs** en todas las páginas interiores con Schema.org |
| 7 | **Header sticky** con glassmorphism (`backdrop-blur-xl`) |
| 8 | **Navegación por teclado** — menús dropdown con hover, botones con focus visible |
| 9 | **Skip-to-content link** para lectores de pantalla (WCAG 2.1) |
| 10 | **Atributos ARIA extensivos**: `aria-label`, `aria-expanded`, `aria-haspopup`, `aria-current`, `aria-live`, `aria-modal`, `role` |
| 11 | **Focus trap en modal de autenticación** — Tab y Shift+Tab ciclan dentro del modal |
| 12 | **Cierre de modal con Escape** — comportamiento esperado |
| 13 | **Modo oscuro por defecto** — buen contraste, reduce fatiga visual |
| 14 | **Sonner toasts** con rich colors y posición bottom-right |
| 15 | **Skeletons** durante carga de datos |
| 16 | **Landmarks semánticos**: `<header role="banner">`, `<main id="main-content">`, `<footer role="contentinfo">`, `<nav>`, `<section>`, `<article>` |
| 17 | **Indicador de "cargando"** con spinner animado y texto descriptivo |
| 18 | **Botón de copiar contraseña** con feedback visual (check verde) |

### 7.2 DEBILIDADES

| # | Debilidad | Severidad |
|:---|:---|:---|
| 1 | **Sin tooltips ni ayuda contextual** en botones o herramientas | 🟡 MEDIA |
| 2 | **Sin atajos de teclado** (ej: Ctrl+O para abrir archivo) | 🟡 BAJA |
| 3 | **Sin modo de alto contraste** adicional para usuarios con discapacidad visual | 🟡 BAJA |
| 4 | **Sin soporte para reducir animaciones** (`prefers-reduced-motion`) | 🟡 BAJA |
| 5 | **Tabla de archivos recientes no es responsive en móvil** (scroll horizontal) | 🟡 BAJA |
| 6 | **Algunos textos son muy pequeños** (10px-11px en tooltips y labels) | 🟡 BAJA |
| 7 | **No verificado con lectores de pantalla reales** (NVDA, JAWS, VoiceOver) | 🟡 MEDIA |
| 8 | **Sin indicador de foco visible consistente** en todos los elementos interactivos | 🟡 MEDIA |
| 9 | **El iframe del visor PDF no tiene fallback accesible** para usuarios sin soporte de PDF embebido | 🟡 BAJA |

---

## 8. SEO Y DESCUBRIBILIDAD

### 8.1 FORTALEZAS

| # | Fortaleza |
|:---|:---|
| 1 | **JSON-LD Structured Data**: `WebApplication`, `BreadcrumbList`, `FAQPage` |
| 2 | **Open Graph** completo: title, description, url, siteName, locale, type |
| 3 | **Twitter Cards**: `summary_large_image` con `@pdfblack` |
| 4 | **Canonical URLs** con alternates `es/en` |
| 5 | **Sitemap automático** con `next-sitemap` |
| 6 | **Robots.txt** con reglas de indexación |
| 7 | **Meta keywords** (10+ términos) |
| 8 | **Metadatos completos** en `layout.tsx`: generator, applicationName, creator, publisher, authors |
| 9 | **14 redirects** en `vercel.json` para mantener SEO de rutas antiguas |
| 10 | **Apple Web App** capaz con statusBarStyle |
| 11 | **Títulos de página descriptivos** con template `%s | PDFBlack` |

### 8.2 DEBILIDADES

| # | Debilidad | Severidad |
|:---|:---|:---|
| 1 | **Sin blog ni contenido indexable** — solo herramientas y páginas estáticas | 🟡 MEDIA |
| 2 | **Sin página de "Todas las herramientas"** con estructura de silo SEO | 🟡 MEDIA |
| 3 | **Google Search Console no verificado** (placeholder en layout) | 🟡 MEDIA |
| 4 | **Sin Analytics** (Plausible/Sentry están en `.env.example` pero no implementados) | 🟡 MEDIA |

---

## 9. CALIDAD TÉCNICA Y DEVOPS

### 9.1 FORTALEZAS

| # | Fortaleza |
|:---|:---|
| 1 | **CI/CD con 5 jobs**: Lint → Type Check → Tests → Build → Docker → Deploy Vercel |
| 2 | **GitHub Actions** con concurrency control |
| 3 | **Docker multi-stage** optimizado |
| 4 | **ESLint** + **Prettier** + **Husky** + **lint-staged** |
| 5 | **Jest** con 7 suites de tests |
| 6 | **TypeScript** con modo estricto implícito |
| 7 | **Bundle Analyzer** para optimización de tamaño |
| 8 | **`docker-compose.yml`** con servicio dev (hot-reload) y prod |
| 9 | **`.env.example`** documentando todas las variables de entorno |
| 10 | **HEALTHCHECK** en Dockerfile |

### 9.2 DEBILIDADES

| # | Debilidad | Severidad |
|:---|:---|:---|
| 1 | **39% cobertura de tests** — threshold definido en 60% pero no cumplido | 🟠 ALTA |
| 2 | **11 de 18 workers sin tests** | 🟠 ALTA |
| 3 | **Sin tests E2E** (Playwright, Cypress) | 🟠 ALTA |
| 4 | **README es el template por defecto de `create-next-app`** | 🟠 ALTA |
| 5 | **Sin documentación de arquitectura** (`ARCHITECTURE.md`) | 🟠 ALTA |
| 6 | **Sin guías de contribución** (`CONTRIBUTING.md`) | 🟡 MEDIA |
| 7 | **Sin CHANGELOG** | 🟡 MEDIA |
| 8 | **Sentry y Plausible configurados en `.env.example` pero no implementados** | 🟡 MEDIA |

---

## 10. RESUMEN EJECUTIVO

### 10.1 Resumen de Fortalezas (Diferenciadores Clave)

| Área | Calificación | Comentario |
|:---|---|:---|
| **Privacidad y Seguridad** | ⭐⭐⭐⭐⭐ | Zero-trust client-side. AES-256 ISO 32000-2. Sin equivalente gratuito. |
| **Cantidad de Herramientas** | ⭐⭐⭐⭐⭐ | 24 herramientas cubriendo todas las necesidades comunes de PDF. |
| **Diseño UX/UI** | ⭐⭐⭐⭐⭐ | Estética premium, animaciones fluidas, arquitectura de información excelente. |
| **Transparencia** | ⭐⭐⭐⭐ | Explicaciones técnicas detalladas. Documentación legal completa. |
| **DevOps y CI/CD** | ⭐⭐⭐⭐ | Pipeline completo, Docker, headers de seguridad. |
| **Accesibilidad** | ⭐⭐⭐⭐ | ARIA extensivo, focus trap, skip-to-content, navegación por teclado. |
| **SEO** | ⭐⭐⭐⭐ | JSON-LD, Open Graph, Twitter Cards, sitemap, canonical. |
| **Multi-idioma** | ⭐⭐⭐⭐ | ES/EN completo con detección automática de idioma. |

### 10.2 Resumen de Debilidades (Gaps Críticos)

| # | Debilidad | Impacto en el Usuario | Severidad |
|:---|:---|:---|:---|
| 1 | Formulario de contacto no envía emails | **El usuario cree que pidió soporte pero nadie lo leerá** | 🔴 CRÍTICA |
| 2 | Email de confirmación nunca se envía | **El usuario espera un correo que nunca llega** | 🔴 CRÍTICA |
| 3 | Contraseñas en texto plano en localStorage | **Las credenciales del usuario son visibles para cualquiera con acceso al navegador** | 🔴 CRÍTICA |
| 4 | "Respuesta en <24h" es información falsa | **Pérdida de confianza cuando el usuario no recibe respuesta** | 🔴 CRÍTICA |
| 5 | FAQ de solo 5 preguntas | **El usuario no encuentra respuestas a dudas comunes** | 🟠 ALTA |
| 6 | Sin documentación ni guías de uso | **El usuario no sabe cómo usar herramientas avanzadas** | 🟠 ALTA |
| 7 | Sin API REST | **Empresas no pueden integrar PDFBlack en sus flujos de trabajo** | 🔴 CRÍTICA |
| 8 | Firma sin validez legal (eIDAS) | **Documentos firmados no son legalmente vinculantes** | 🔴 CRÍTICA |
| 9 | Sin procesamiento por lotes | **Usuarios con muchos archivos pierden tiempo** | 🟠 ALTA |
| 10 | 39% cobertura de tests | **Riesgo de bugs y regresiones en herramientas no probadas** | 🟠 ALTA |
| 11 | Sin chat en vivo ni chatbot | **El usuario no tiene ayuda inmediata cuando tiene problemas** | 🟡 MEDIA |
| 12 | Sin página de estado | **El usuario no sabe si el servicio está caído o es problema suyo** | 🟡 MEDIA |
| 13 | Sin changelog | **El usuario no sabe qué hay de nuevo o qué se arregló** | 🟡 MEDIA |

### 10.3 Matriz de Prioridades para Mejora de Servicio al Usuario

| Prioridad | Acción | Esfuerzo | Impacto |
|:---|:---|---:|:---|
| 🔴 DÍA 1 | **Hacer funcional el formulario de contacto** — conectar a API real o servicio como Formspree/EmailJS | 2 horas | Crítico |
| 🔴 DÍA 1 | **Eliminar o dejar claro que no se envían emails aún** — eliminar la promesa falsa de "respuesta en 24h" y "recibirás un correo" | 1 hora | Crítico |
| 🔴 SEMANA 1 | **Hashear contraseñas con bcryptjs o PBKDF2** antes de guardar en localStorage | 3 horas | Crítico |
| 🔴 SEMANA 1 | **Configurar SMTP real** y descomentar código de `emailService.ts` | 4 horas | Crítico |
| 🟠 SEMANA 2 | **Expandir FAQ a 20+ preguntas** cubriendo todos los temas comunes | 8 horas | Alto |
| 🟠 SEMANA 2 | **Crear página de documentación** (`/docs`) con guías por herramienta | 16 horas | Alto |
| 🟠 MES 1 | **Implementar chat en vivo** (Crisp, Tidio, o chatbot simple) | 8 horas | Alto |
| 🟠 MES 1 | **Crear página de estado** (`status.pdfblack.com`) | 4 horas | Alto |
| 🟡 MES 2 | **Implementar sistema de tickets** (integración con email) | 16 horas | Medio |
| 🟡 MES 2 | **Crear blog y centro de recursos** | 20 horas | Medio |
| 🟡 MES 3 | **Implementar onboarding interactivo** (tour guiado) | 24 horas | Medio |

### 10.4 Veredicto Final sobre Servicio al Usuario

**Calificación actual: 4.5/10**

PDFBlack tiene una base excelente: la interfaz es premium, las herramientas son potentes, y el modelo de privacidad es genuinamente superior al de sus competidores. Sin embargo, **el servicio al usuario es actualmente su punto más débil**:

- **Lo que funciona**: Diseño, accesibilidad, multi-idioma, transparencia técnica, documentación legal, navegación.
- **Lo que falla**: Canales de soporte (el formulario de contacto no envía nada), comunicación post-registro (los emails de confirmación nunca se envían), seguridad de credenciales (contraseñas en texto plano), documentación de ayuda (FAQ casi vacío, sin guías), y disponibilidad de ayuda en tiempo real (sin chat, sin chatbot).

**Para un MVP (v0.1.0), es aceptable.** Pero para retener usuarios y ganar confianza, las 4 debilidades críticas (#1-#4) deben resolverse **antes de cualquier campaña de marketing o lanzamiento público**. Un usuario que intenta contactar soporte y no recibe respuesta, o que espera un email de confirmación que nunca llega, es un usuario perdido permanentemente.

---

**Reporte generado tras análisis de 12 archivos de servicio al usuario (~2,100 líneas de código):** `emailService.ts`, `AuthModal.tsx`, `SharedLayout.tsx`, `CookieConsent.tsx`, `Breadcrumbs.tsx`, `faq/page.tsx`, `contacto/page.tsx`, `useAuthStore.ts`, `useActivityStore.ts`, `app/layout.tsx`, `app/page.tsx`, `censurar/page.tsx`.