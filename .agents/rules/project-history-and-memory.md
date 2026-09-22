# Memoria Histórica y Bitácora del Proyecto PDFBlack ♠️

Esta regla persistente documenta el estado operativo, registros externos, infraestructura y antecedentes clave del proyecto para que todos los agentes mantengan continuidad entre sesiones.

---

## 1. Bitácora de Backlinks Activos y Registros Externos (20 de Septiembre de 2026)

| # | Plataforma | Autoridad (DA/DR) | Tipo de Enlace / Registro | URL Exacta Registrada | Estado |
|---|---|---|---|---|---|
| 1 | **GitHub (Repo)** | **DA 96** | About oficial y link directo del repositorio | `https://github.com/nereoab/pdf-local-app` | 🟢 Activo |
| 2 | **Product Hunt** | **DA 91** | Perfil oficial de Maker con link a Website | `https://www.producthunt.com/@nereo2710` | 🟢 Activo |
| 3 | **Hashnode** | **DA 86** | Perfil de ingeniería con botón Website y bio | `https://hashnode.com/@pdfblack` | 🟢 Activo |
| 4 | **AlternativeTo** | **DA 85** | Ficha de software alternativa a iLovePDF/Adobe (ID: `8ab2ca27-fffa-4d44-aa0e-b941b5756e59`) | 🟡 En moderación |
| 5 | **Devpost (Software)** | **DA 82** | Ficha completa de proyecto con 3 enlaces hacia pdf-black.com | `https://devpost.com/software/pdfblack-free-client-side-pdf-tools-suite` | 🟢 Activo |
| 6 | **Devpost (Perfil)** | **DA 82** | Perfil de desarrollador con enlace a Website | `https://devpost.com/markusarcangel` | 🟢 Activo |
| 7 | **Uneed.best** | **DR 75** | Ficha de producto en cola de lanzamiento oficial (ID: `53901`) | `https://www.uneed.best/tool/pdfblack` | 🟡 En cola de lanzamiento |

---

## 2. Infraestructura, Dominios y Analítica

* **Dominio Principal de Producción:** `https://pdf-black.com`
* **Dominio de Respaldo Firebase:** `https://pdfblack-proy.web.app`
* **Proyecto Firebase:** `pdfblack-proy` (Hosting + Cloud Run para SSR)
* **Google Analytics 4 (GA4):**
  * Propiedad ID: `548228704`
  * Measurement ID: `G-L18LM8EQYJ`
* **Google Search Console:**
  * Propiedad de dominio: `sc-domain:pdf-black.com`
  * Sitemap oficial enviado y descargado por Google: `https://pdf-black.com/sitemap.xml` (186 URLs enviadas el 2026-09-20T16:31:38Z)

---

## 3. Identidad de Marca y Favicons

* **Estilo Aprobado:** Fondo blanco con As de espadas negro prominente (75% del área útil) y borde sutil exterior `#d4d4d8`.
* **Archivos Oficiales:**
  * `public/favicon.ico` y `app/favicon.ico` (ICO multi-resolución: 16x16, 32x32, 48x48)
  * `public/icon.png` y `app/icon.png` (48x48 px según estándar de Google Search)
  * `public/icon-192.png` y `public/icon-512.png` (Android / PWA)
  * `public/apple-touch-icon.png` (180x180 px en lienzo sólido)
* **Script regenerador:** `scripts/generate-all-favicons.mjs`

---

## 4. Instrucción para Agentes
Siempre que se realicen nuevos registros de backlinks, modificaciones de analítica o decisiones críticas de infraestructura, actualizar este documento para mantener la memoria persistente del proyecto.
