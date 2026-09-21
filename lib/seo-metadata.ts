import type { Metadata } from 'next';
import { TOOLS_ROUTES } from './routes-config';
import type { GlossaryTerm } from './glossary/types';
import type { IndustryPageData } from './industries/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export interface ToolSeoInfo {
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  keywordsEs: string[];
  keywordsEn: string[];
}

export const TOOLS_METADATA_REGISTRY: Record<string, Record<string, ToolSeoInfo>> = {
  convertir: {
    'pdf-word': {
      titleEs: 'Convertir PDF a Word Gratis Online — DOCX 100% Editable | PDFBlack',
      titleEn: 'Convert PDF to Word Free Online — 100% Editable DOCX | PDFBlack',
      descEs:
        'Convierte tus documentos PDF a Microsoft Word (.docx) editables al 100% online gratis. Conserva tablas, columnas y fuentes originales con procesamiento 100% privado en tu navegador.',
      descEn:
        'Convert PDF documents to 100% editable Microsoft Word (.docx) files online for free. Preserves layout, tables, fonts and vectors with 100% client-side privacy.',
      keywordsEs: [
        'convertir pdf a word',
        'pdf a word gratis',
        'pdf a docx editable',
        'pasar pdf a word',
        'transformar pdf a word',
      ],
      keywordsEn: [
        'convert pdf to word',
        'pdf to word free',
        'pdf to docx editable',
        'pdf to word converter online',
        'free pdf to word',
      ],
    },
    'word-pdf': {
      titleEs: 'Convertir Word a PDF Gratis Online — Guardar DOCX en PDF | PDFBlack',
      titleEn: 'Convert Word to PDF Free Online — DOCX to High Quality PDF | PDFBlack',
      descEs:
        'Convierte documentos de Word (.doc y .docx) a PDF con fidelidad vectorial impecable. 100% gratis, sin registro y sin subir tus archivos a servidores.',
      descEn:
        'Convert Word documents (.doc and .docx) into pristine PDF files with exact formatting. 100% free, no signup, and processed privately.',
      keywordsEs: [
        'convertir word a pdf',
        'word a pdf gratis',
        'docx a pdf online',
        'guardar word como pdf',
      ],
      keywordsEn: [
        'convert word to pdf',
        'word to pdf free',
        'docx to pdf online',
        'save word as pdf',
      ],
    },
    'pdf-excel': {
      titleEs: 'Convertir PDF a Excel Gratis Online — Tablas a XLSX | PDFBlack',
      titleEn: 'Convert PDF to Excel Free Online — Extract Tables to XLSX | PDFBlack',
      descEs:
        'Extrae tablas numéricas de tus archivos PDF a hojas de cálculo de Microsoft Excel (.xlsx) con fórmulas limpias y celdas editables.',
      descEn:
        'Extract data and tables from PDF documents into editable Microsoft Excel (.xlsx) spreadsheets with pristine accuracy.',
      keywordsEs: [
        'convertir pdf a excel',
        'pdf a excel gratis',
        'extraer tablas de pdf a excel',
        'pdf a xlsx',
      ],
      keywordsEn: [
        'convert pdf to excel',
        'pdf to excel free',
        'extract pdf tables to excel',
        'pdf to xlsx',
      ],
    },
    'excel-pdf': {
      titleEs: 'Convertir Excel a PDF Gratis Online — Hojas de Cálculo a PDF | PDFBlack',
      titleEn: 'Convert Excel to PDF Free Online — Spreadsheets to PDF | PDFBlack',
      descEs:
        'Convierte tus hojas de cálculo de Excel (.xlsx, .xls) a documentos PDF perfectamente formateados y listos para imprimir.',
      descEn:
        'Convert Excel spreadsheets (.xlsx, .xls) into high-resolution, print-ready PDF files without formatting loss.',
      keywordsEs: [
        'convertir excel a pdf',
        'excel a pdf gratis',
        'xlsx a pdf',
        'pasar excel a pdf',
      ],
      keywordsEn: [
        'convert excel to pdf',
        'excel to pdf free',
        'xlsx to pdf',
        'spreadsheet to pdf',
      ],
    },
    'pdf-powerpoint': {
      titleEs: 'Convertir PDF a PowerPoint Gratis Online — Presentación PPTX | PDFBlack',
      titleEn: 'Convert PDF to PowerPoint Free Online — Slides to PPTX | PDFBlack',
      descEs:
        'Transforma cada página de tu PDF en diapositivas editables de PowerPoint (.pptx) con imágenes y textos independientes.',
      descEn:
        'Convert PDF pages into fully editable PowerPoint presentation slides (.pptx) with separate text boxes and images.',
      keywordsEs: [
        'convertir pdf a powerpoint',
        'pdf a pptx gratis',
        'pdf a presentaciones online',
      ],
      keywordsEn: ['convert pdf to powerpoint', 'pdf to pptx free', 'pdf to presentation slides'],
    },
    'powerpoint-pdf': {
      titleEs: 'Convertir PowerPoint a PDF Gratis Online — PPTX a PDF | PDFBlack',
      titleEn: 'Convert PowerPoint to PDF Free Online — PPTX to Clean PDF | PDFBlack',
      descEs:
        'Guarda presentaciones de PowerPoint (.pptx, .ppt) como documentos PDF de máxima resolución listos para proyectar o imprimir.',
      descEn:
        'Convert PowerPoint slides (.pptx, .ppt) into crisp, high-resolution PDF documents ready for sharing and printing.',
      keywordsEs: [
        'convertir powerpoint a pdf',
        'pptx a pdf gratis',
        'guardar diapositivas como pdf',
      ],
      keywordsEn: ['convert powerpoint to pdf', 'pptx to pdf free', 'slides to pdf'],
    },
    'pdf-jpg': {
      titleEs: 'Convertir PDF a JPG Gratis Online — Extraer Imágenes en Alta Calidad | PDFBlack',
      titleEn: 'Convert PDF to JPG Free Online — High Resolution Image Extraction | PDFBlack',
      descEs:
        'Convierte páginas de PDF a imágenes JPG y PNG nítidas en alta definición (300 DPI) con descarga individual o en paquete ZIP.',
      descEn:
        'Convert PDF pages into high-resolution JPG and PNG images (up to 300 DPI). Download individual images or a unified ZIP.',
      keywordsEs: [
        'convertir pdf a jpg',
        'pdf a imagen gratis',
        'extraer fotos de pdf',
        'pdf a png',
      ],
      keywordsEn: [
        'convert pdf to jpg',
        'pdf to image free',
        'pdf to png online',
        'extract images from pdf',
      ],
    },
    'jpg-pdf': {
      titleEs: 'Convertir JPG a PDF Gratis Online — Unir Imágenes en un Solo PDF | PDFBlack',
      titleEn: 'Convert JPG to PDF Free Online — Combine Images into Single PDF | PDFBlack',
      descEs:
        'Convierte imágenes JPG, PNG y WebP en un único archivo PDF ordenado. Ajusta orientación, márgenes y tamaño de página al instante.',
      descEn:
        'Convert multiple JPG, PNG, and WebP images into one organized PDF file. Customize page orientation, margins, and sizing.',
      keywordsEs: [
        'convertir jpg a pdf',
        'imagenes a pdf gratis',
        'fotos a pdf online',
        'png a pdf',
      ],
      keywordsEn: [
        'convert jpg to pdf',
        'images to pdf free',
        'photos to pdf',
        'png to pdf online',
      ],
    },
    'pdf-html': {
      titleEs: 'Convertir PDF a HTML Gratis Online — Código Web Limpio | PDFBlack',
      titleEn: 'Convert PDF to HTML Free Online — Clean Web Code & Layout | PDFBlack',
      descEs:
        'Convierte documentos PDF en páginas web HTML5 responsivas con CSS embebido y maquetación fiel.',
      descEn:
        'Convert PDF documents into responsive HTML5 web code with embedded CSS and accurate layout positioning.',
      keywordsEs: ['convertir pdf a html', 'pdf a web gratis', 'pdf to html converter'],
      keywordsEn: ['convert pdf to html', 'pdf to web code', 'pdf to html5 free'],
    },
    'html-pdf': {
      titleEs: 'Convertir HTML a PDF Gratis Online — Guardar Páginas Web en PDF | PDFBlack',
      titleEn: 'Convert HTML to PDF Free Online — Web Pages & Code to PDF | PDFBlack',
      descEs:
        'Convierte código HTML, archivos web o páginas completas en documentos PDF vectoriales con estilos CSS intactos.',
      descEn:
        'Convert HTML code and web pages into print-perfect vector PDF documents preserving CSS styles and fonts.',
      keywordsEs: ['convertir html a pdf', 'guardar html como pdf', 'pagina web a pdf gratis'],
      keywordsEn: ['convert html to pdf', 'html to pdf free', 'webpage to pdf converter'],
    },
    'pdf-texto': {
      titleEs: 'Convertir PDF a Texto Gratis Online — Extraer Texto Plano TXT | PDFBlack',
      titleEn: 'Convert PDF to Text Free Online — Extract Clean TXT Content | PDFBlack',
      descEs:
        'Extrae todo el texto seleccionable de un archivo PDF a texto plano (.txt) sin caracteres extraños ni pérdida de saltos de línea.',
      descEn:
        'Extract clean plain text (.txt) from any PDF document without garbage characters or formatting artifacts.',
      keywordsEs: ['convertir pdf a texto', 'extraer texto de pdf', 'pdf a txt gratis'],
      keywordsEn: ['convert pdf to text', 'extract text from pdf', 'pdf to txt free'],
    },
    'texto-pdf': {
      titleEs: 'Convertir Texto a PDF Gratis Online — Archivos TXT a PDF | PDFBlack',
      titleEn: 'Convert Text to PDF Free Online — Plain TXT to PDF Document | PDFBlack',
      descEs:
        'Convierte notas y archivos de texto plano (.txt) en documentos PDF tipográficamente estructurados con márgenes elegantes.',
      descEn:
        'Convert plain text notes and TXT files into cleanly typeset, elegant PDF documents with custom margins.',
      keywordsEs: ['convertir texto a pdf', 'txt a pdf gratis', 'crear pdf desde texto'],
      keywordsEn: ['convert text to pdf', 'txt to pdf free', 'create pdf from text'],
    },
    'pdf-blanco-negro': {
      titleEs:
        'Convertir PDF a Blanco y Negro Gratis Online — Grayscale y Ahorro de Tinta | PDFBlack',
      titleEn: 'Convert PDF to Black and White Free Online — Grayscale & Ink Saver | PDFBlack',
      descEs:
        'Convierte tus archivos PDF a blanco y negro puro o escala de grises (grayscale) online y 100% gratis. Ahorra tinta de impresora y reduce el peso del archivo sin salir de tu navegador.',
      descEn:
        'Convert PDF files to black and white or grayscale online for free. Save printer ink and drastically reduce file size with client-side zero-knowledge privacy.',
      keywordsEs: [
        'pdf black',
        'pdfblack',
        'convertir pdf a blanco y negro',
        'pdf a escala de grises',
        'pdf grayscale online gratis',
        'ahorrar tinta imprimir pdf',
        'pdf monocromatico',
      ],
      keywordsEn: [
        'pdf black',
        'pdfblack',
        'convert pdf to black and white',
        'pdf to grayscale',
        'black and white pdf converter',
        'grayscale pdf online free',
        'ink saver pdf',
      ],
    },
  },
  organizar: {
    unir: {
      titleEs: 'Unir PDF Gratis Online — Combinar Varios Archivos PDF en Uno | PDFBlack',
      titleEn: 'Merge PDF Free Online — Combine Multiple PDF Files into One | PDFBlack',
      descEs:
        'Une y combina múltiples archivos PDF en un solo documento en el orden exacto que desees. 100% local, rápido, sin límites de tamaño y sin registro.',
      descEn:
        'Merge and combine multiple PDF files into a single document in your desired order. 100% private, local browser processing, no size limits.',
      keywordsEs: [
        'unir pdf gratis',
        'combinar pdf online',
        'juntar archivos pdf',
        'fusionar pdf sin limite',
      ],
      keywordsEn: ['merge pdf free', 'combine pdf online', 'join pdf files', 'merge pdf unlimited'],
    },
    dividir: {
      titleEs: 'Dividir PDF Gratis Online — Separar y Extraer Páginas de PDF | PDFBlack',
      titleEn: 'Split PDF Free Online — Separate and Extract Pages from PDF | PDFBlack',
      descEs:
        'Divide un archivo PDF en documentos individuales o extrae rangos específicos de páginas al instante con previsualización interactiva.',
      descEn:
        'Split a large PDF file into individual documents or extract specific page ranges with interactive thumbnail preview.',
      keywordsEs: [
        'dividir pdf gratis',
        'separar paginas pdf',
        'extraer paginas de pdf',
        'cortar pdf online',
      ],
      keywordsEn: [
        'split pdf free',
        'separate pdf pages',
        'extract pages from pdf',
        'cut pdf online',
      ],
    },
    eliminar: {
      titleEs: 'Eliminar Páginas de PDF Gratis Online — Borrar Hojas Innecesarias | PDFBlack',
      titleEn: 'Delete PDF Pages Free Online — Remove Unwanted Pages from PDF | PDFBlack',
      descEs:
        'Elimina hojas en blanco o páginas innecesarias de tu PDF con selección visual en miniaturas y descarga instantánea.',
      descEn:
        'Delete blank pages or unwanted sheets from your PDF with visual thumbnail selection and instant download.',
      keywordsEs: ['eliminar paginas pdf', 'borrar paginas de un pdf', 'quitar hojas pdf gratis'],
      keywordsEn: ['delete pdf pages', 'remove pages from pdf', 'delete sheets from pdf free'],
    },
    reordenar: {
      titleEs: 'Ordenar Páginas de PDF Gratis Online — Reorganizar Hojas PDF | PDFBlack',
      titleEn: 'Reorder PDF Pages Free Online — Rearrange PDF Sheet Order | PDFBlack',
      descEs:
        'Arrastra y suelta las páginas de tu PDF para organizarlas en el orden correcto. Procesamiento ultrarrápido y seguro en tu memoria RAM.',
      descEn:
        'Drag and drop PDF pages to rearrange them into the perfect order. Fast and secure processing directly in your browser memory.',
      keywordsEs: ['ordenar pdf gratis', 'reorganizar paginas pdf', 'cambiar orden de paginas pdf'],
      keywordsEn: ['reorder pdf pages', 'rearrange pdf sheets', 'change pdf page order free'],
    },
    rotar: {
      titleEs: 'Rotar PDF Gratis Online — Girar Páginas 90, 180 o 270 Grados | PDFBlack',
      titleEn: 'Rotate PDF Free Online — Turn Pages 90, 180, or 270 Degrees | PDFBlack',
      descEs:
        'Corrige la orientación de tus documentos PDF y escaneos girando páginas individuales o todo el documento en 90°, 180° o 270° permanentemente.',
      descEn:
        'Fix PDF orientation by rotating individual pages or the entire document by 90, 180, or 270 degrees permanently.',
      keywordsEs: ['rotar pdf gratis', 'girar paginas pdf', 'cambiar orientacion pdf online'],
      keywordsEn: ['rotate pdf free', 'turn pdf pages', 'rotate pdf 90 degrees online'],
    },
    recortar: {
      titleEs: 'Recortar PDF Gratis Online — Ajustar Márgenes y Dimensiones | PDFBlack',
      titleEn: 'Crop PDF Free Online — Adjust Page Margins and Dimensions | PDFBlack',
      descEs:
        'Recorta márgenes blancos innecesarios o ajusta el encuadre de las páginas de tu PDF de forma visual y precisa.',
      descEn:
        'Crop away white margins and adjust PDF page frames visually with pixel-perfect bounding box controls.',
      keywordsEs: ['recortar pdf gratis', 'ajustar margenes pdf', 'crop pdf online'],
      keywordsEn: ['crop pdf free', 'adjust pdf margins', 'crop pdf pages online'],
    },
  },
  optimizar: {
    comprimir: {
      titleEs: 'Comprimir PDF Gratis Online — Reducir Tamaño sin Perder Calidad | PDFBlack',
      titleEn: 'Compress PDF Free Online — Reduce File Size without Quality Loss | PDFBlack',
      descEs:
        'Reduce drásticamente los megabytes de tus archivos PDF para enviar por correo o subir a plataformas con límite de peso. 3 niveles de compresión inteligente.',
      descEn:
        'Dramatically reduce PDF file size for email attachments and web upload limits. 3 smart compression levels with 100% crisp vector text.',
      keywordsEs: [
        'comprimir pdf gratis',
        'reducir tamano pdf',
        'bajar peso pdf online',
        'comprimir pdf para correo',
      ],
      keywordsEn: [
        'compress pdf free',
        'reduce pdf file size',
        'compress pdf for email',
        'shrink pdf size online',
      ],
    },
    reparar: {
      titleEs: 'Reparar PDF Dañado Gratis Online — Recuperar Archivos Corruptos | PDFBlack',
      titleEn: 'Repair Damaged PDF Free Online — Recover Corrupted PDF Files | PDFBlack',
      descEs:
        'Recupera y repara archivos PDF dañados que no abren o muestran errores de lectura. Reconstruye tablas cruzadas y encabezados rotos.',
      descEn:
        'Recover and fix corrupted PDF documents that fail to open or throw read errors. Reconstructs xref tables and broken headers.',
      keywordsEs: [
        'reparar pdf danado',
        'recuperar pdf corrupto gratis',
        'arreglar archivo pdf que no abre',
      ],
      keywordsEn: ['repair damaged pdf', 'fix corrupted pdf free', 'recover unreadable pdf'],
    },
    proteger: {
      titleEs: 'Proteger PDF con Contraseña Gratis Online — Cifrado Militar AES-256 | PDFBlack',
      titleEn: 'Protect PDF with Password Free Online — AES-256 Military Encryption | PDFBlack',
      descEs:
        'Protege tus documentos confidenciales con contraseñas seguras y cifrado AES de 256 bits. Bloquea apertura, impresión o copia de contenido.',
      descEn:
        'Protect sensitive PDF files with secure passwords and AES-256 bit encryption. Restrict opening, printing, and copying.',
      keywordsEs: [
        'proteger pdf con contrasena',
        'encriptar pdf gratis',
        'poner clave a pdf online',
      ],
      keywordsEn: ['protect pdf with password', 'encrypt pdf free', 'add password to pdf online'],
    },
    desbloquear: {
      titleEs: 'Desbloquear PDF Gratis Online — Quitar Contraseña y Restricciones | PDFBlack',
      titleEn: 'Unlock PDF Free Online — Remove Password & Restrictions | PDFBlack',
      descEs:
        'Elimina contraseñas y permisos de seguridad de archivos PDF para poder editarlos, imprimirlos y compartirlos libremente.',
      descEn:
        'Remove security passwords and permission restrictions from PDF documents to freely print, edit, and share them.',
      keywordsEs: [
        'desbloquear pdf gratis',
        'quitar contrasena pdf online',
        'remover clave de pdf',
      ],
      keywordsEn: ['unlock pdf free', 'remove pdf password online', 'unlock protected pdf'],
    },
    censurar: {
      titleEs: 'Censurar PDF Gratis Online — Ocultar Datos Confidenciales | PDFBlack',
      titleEn: 'Redact PDF Free Online — Black Out Confidential Information | PDFBlack',
      descEs:
        'Censura texto sensible, números de tarjeta o datos personales en tu PDF de forma permanente e irrecuperable en memoria RAM.',
      descEn:
        'Permanently redact sensitive text, credit cards, and personal data from PDF documents directly in browser memory.',
      keywordsEs: ['censurar pdf gratis', 'ocultar texto pdf confidencial', 'redactar pdf online'],
      keywordsEn: ['redact pdf free', 'black out text in pdf', 'sanitize confidential pdf'],
    },
    comparar: {
      titleEs: 'Comparar Dos PDFs Gratis Online — Detectar Diferencias Visuales | PDFBlack',
      titleEn: 'Compare Two PDFs Free Online — Visual Difference Detection | PDFBlack',
      descEs:
        'Compara dos versiones de un documento PDF lado a lado y resalta cambios en textos, imágenes y diseño con precisión milimétrica.',
      descEn:
        'Compare two versions of a PDF document side-by-side with automatic visual highlighting of changes, text, and layout edits.',
      keywordsEs: ['comparar dos pdf', 'ver diferencias en pdf gratis', 'comparador de pdf online'],
      keywordsEn: [
        'compare two pdfs',
        'find differences in pdf free',
        'pdf comparison tool online',
      ],
    },
  },
  editar: {
    texto: {
      titleEs: 'Editar Texto de PDF Gratis Online — Editor Nativo en Navegador | PDFBlack',
      titleEn: 'Edit PDF Text Free Online — Native In-Browser PDF Editor | PDFBlack',
      descEs:
        'Edita textos existentes, añade nuevos párrafos, formas y anotaciones en tus archivos PDF con fuentes incrustadas sin salir del navegador.',
      descEn:
        'Edit existing text, insert new paragraphs, shapes, and annotations in your PDF files directly in your browser without software installs.',
      keywordsEs: [
        'editar texto pdf gratis',
        'editor de pdf online sin registro',
        'modificar texto en pdf',
      ],
      keywordsEn: ['edit pdf text free', 'online pdf editor no signup', 'modify text in pdf'],
    },
    foliar: {
      titleEs: 'Foliar PDF Gratis Online — Añadir Números de Página a PDF | PDFBlack',
      titleEn: 'Number PDF Pages Free Online — Add Page Numbers to PDF | PDFBlack',
      descEs:
        'Inserta números de página o folios personalizados a tus expedientes PDF. Personaliza fuente, posición, formato de numeración y prefijos.',
      descEn:
        'Add customized page numbering and bates stamps to your PDF documents. Select custom placement, font size, and prefix formats.',
      keywordsEs: [
        'foliar pdf gratis',
        'numerar paginas pdf online',
        'poner folios a pdf',
        'numerar hojas pdf',
      ],
      keywordsEn: [
        'number pdf pages free',
        'add page numbers to pdf',
        'bates numbering pdf online',
        'paginate pdf',
      ],
    },
    'marca-agua': {
      titleEs: 'Poner Marca de Agua a PDF Gratis Online — Sello de Agua Personalizado | PDFBlack',
      titleEn: 'Watermark PDF Free Online — Add Custom Text or Image Stamp | PDFBlack',
      descEs:
        'Añade marcas de agua con texto (CONFIDENCIAL, COPIA) o tu logo en imagen PNG a todas las páginas de tu PDF con opacidad y rotación ajustable.',
      descEn:
        'Apply custom text or image watermarks (CONFIDENTIAL, DRAFT) to your PDF documents with adjustable opacity, angle, and position.',
      keywordsEs: [
        'poner marca de agua pdf',
        'agregar sello de agua a pdf',
        'watermark pdf gratis',
      ],
      keywordsEn: ['watermark pdf free', 'add watermark to pdf', 'stamp pdf online'],
    },
    'quitar-marca-agua': {
      titleEs: 'Quitar Marca de Agua de PDF Gratis Online — Eliminar Sellos de Agua | PDFBlack',
      titleEn: 'Remove Watermark from PDF Free Online — Delete Stamps and Logos | PDFBlack',
      descEs:
        'Remueve marcas de agua, sellos y logos superpuestos de tus documentos PDF de forma limpia conservando el texto de fondo intacto.',
      descEn:
        'Remove watermarks, stamps, and overlay logos from PDF documents cleanly while preserving the underlying text and vectors.',
      keywordsEs: [
        'quitar marca de agua pdf gratis',
        'eliminar sello de agua de pdf',
        'borrar marca de agua pdf',
      ],
      keywordsEn: [
        'remove watermark from pdf free',
        'delete watermark from pdf',
        'erase stamp from pdf online',
      ],
    },
    firmar: {
      titleEs: 'Firmar PDF Gratis Online — Firma Digital y Rúbrica en PDF | PDFBlack',
      titleEn: 'Sign PDF Free Online — Digital Signature & Electronic Signatures | PDFBlack',
      descEs:
        'Firma contratos y documentos PDF con tu rúbrica dibujada, firma en imagen o certificado. Cumplimiento legal y privacidad total en tu dispositivo.',
      descEn:
        'Sign PDF contracts and agreements with drawn signatures, signature images, or certificates. 100% legal compliance and privacy.',
      keywordsEs: [
        'firmar pdf gratis',
        'firma digital pdf online',
        'firmar documento pdf sin programa',
      ],
      keywordsEn: [
        'sign pdf free',
        'digital signature pdf online',
        'sign contracts pdf without software',
      ],
    },
    ocr: {
      titleEs: 'OCR PDF Gratis Online — Reconocer Texto en PDF Escaneado | PDFBlack',
      titleEn: 'OCR PDF Free Online — Optical Character Recognition for Scanned PDF | PDFBlack',
      descEs:
        'Convierte documentos escaneados e imágenes de PDF en texto 100% seleccionable, copiable y con capacidad de búsqueda con motor OCR multilingüe.',
      descEn:
        'Transform scanned PDF documents and images into searchable, selectable text with our high-accuracy multilingual OCR engine.',
      keywordsEs: [
        'ocr pdf gratis',
        'reconocimiento de texto pdf',
        'hacer pdf buscable online',
        'extraer texto de escaneo',
      ],
      keywordsEn: [
        'ocr pdf free',
        'optical character recognition pdf',
        'make pdf searchable online',
        'scanned pdf to text',
      ],
    },
  },
};

/**
 * Genera la metadata completa de Next.js para una herramienta en un idioma dado.
 */
export function buildToolMetadata(
  category: string,
  toolSlug: string,
  lang: 'es' | 'en' = 'es',
): Metadata {
  const info = TOOLS_METADATA_REGISTRY[category]?.[toolSlug];
  const isEs = lang === 'es';

  const title = info
    ? isEs
      ? info.titleEs
      : info.titleEn
    : `${toolSlug.toUpperCase()} — PDFBlack`;
  const description = info
    ? isEs
      ? info.descEs
      : info.descEn
    : 'Herramienta PDF gratuita, rápida y 100% privada en tu navegador.';
  const keywords = info ? (isEs ? info.keywordsEs : info.keywordsEn) : ['pdf gratis', 'pdf tools'];

  const matchingTool = TOOLS_ROUTES.find(
    (t) =>
      (t.category === category || t.categoryEn === category) &&
      (t.slugEs === toolSlug || t.slugEn === toolSlug),
  );

  const esUrl = matchingTool
    ? `${SITE_URL}${matchingTool.pathEs}`
    : `${SITE_URL}/${category}/${toolSlug}`;
  const enUrl = matchingTool
    ? `${SITE_URL}${matchingTool.pathEn}`
    : `${SITE_URL}/en/${category}/${toolSlug}`;
  const canonicalUrl = isEs ? esUrl : enUrl;

  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(
    title.split('—')[0].trim(),
  )}&badge=${encodeURIComponent(category.toUpperCase())}&category=${encodeURIComponent(
    category,
  )}&lang=${lang}`;

  return {
    title,
    description,
    keywords,
    authors: [{ name: 'PDFBlack Team' }],
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: esUrl,
        en: enUrl,
        'x-default': esUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'PDFBlack',
      locale: isEs ? 'es_ES' : 'en_US',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export interface CategoryHubInfo {
  categoryEs: string;
  categoryEn: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  keywordsEs: string[];
  keywordsEn: string[];
  badge: string;
}

export const CATEGORY_HUBS_METADATA: Record<string, CategoryHubInfo> = {
  organizar: {
    categoryEs: 'organizar',
    categoryEn: 'organize',
    titleEs: 'Organizar PDF Gratis — Unir, Dividir, Rotar, Recortar y Reordenar | PDFBlack',
    titleEn: 'Organize PDF Files Online for Free — Merge, Split, Rotate & Reorder | PDFBlack',
    descEs:
      'Reestructura y organiza tus documentos PDF al instante: une múltiples archivos, divide por páginas, gira la orientación, recorta márgenes y elimina hojas innecesarias. Procesamiento 100% privado en tu navegador sin registro.',
    descEn:
      'Free client-side tools to organize your PDF documents. Merge, split, delete, rotate, crop, and reorder pages 100% privately in your browser without file size limits.',
    keywordsEs: [
      'organizar pdf gratis',
      'unir pdf',
      'dividir pdf',
      'rotar pdf',
      'recortar pdf',
      'eliminar paginas pdf',
      'reordenar paginas pdf',
      'organize pdf free online',
    ],
    keywordsEn: [
      'organize pdf',
      'merge pdf free',
      'split pdf online',
      'delete pdf pages',
      'rotate pdf',
      'reorder pdf pages',
      'crop pdf',
      'private pdf tools',
    ],
    badge: 'ORGANIZAR',
  },
  optimizar: {
    categoryEs: 'optimizar',
    categoryEn: 'optimize',
    titleEs: 'Optimizar PDF Gratis — Comprimir, Desbloquear, Proteger y Reparar | PDFBlack',
    titleEn: 'Optimize PDF Files Online for Free — Compress, Protect & Repair | PDFBlack',
    descEs:
      'Suite completa de herramientas para optimizar archivos PDF gratis: reduce tamaño, desbloquea permisos, protege con contraseña AES-256, censura datos confidenciales y repara archivos dañados. 100% local en tu navegador con privacidad absoluta.',
    descEn:
      'Compress, protect, unlock, redact, and repair PDF files locally in your browser with zero file uploads and complete privacy.',
    keywordsEs: [
      'optimizar pdf gratis',
      'comprimir pdf',
      'desbloquear pdf',
      'proteger pdf',
      'censurar pdf',
      'reparar pdf',
      'comparar pdf',
      'herramientas optimizar pdf',
      'optimize pdf free',
    ],
    keywordsEn: [
      'optimize pdf',
      'compress pdf free',
      'protect pdf password',
      'unlock pdf',
      'redact pdf',
      'repair pdf',
      'zero upload pdf optimizer',
    ],
    badge: 'OPTIMIZAR',
  },
  editar: {
    categoryEs: 'editar',
    categoryEn: 'edit',
    titleEs: 'Editar PDF Gratis Online — Texto, Firma, OCR y Marcas de Agua | PDFBlack',
    titleEn: 'Edit PDF Files Online for Free — Text, Sign, OCR & Watermark | PDFBlack',
    descEs:
      'Edita documentos PDF directamente en tu navegador web: modifica texto, añade firmas digitales y sellos, numera folios, inserta marcas de agua y aplica OCR para hacer texto seleccionable. 100% privado en memoria RAM, gratis y sin límites.',
    descEn:
      'Edit text, sign documents, apply OCR, number pages, and add watermarks to PDF files 100% privately in your browser without file uploads.',
    keywordsEs: [
      'editar pdf gratis',
      'editor pdf online',
      'firmar pdf gratis',
      'ocr pdf',
      'foliar paginas pdf',
      'marca de agua pdf',
      'modificar texto pdf',
      'edit pdf free online',
    ],
    keywordsEn: [
      'edit pdf',
      'online pdf editor',
      'sign pdf free',
      'ocr pdf',
      'bates numbering',
      'watermark pdf',
      'edit pdf in browser',
    ],
    badge: 'EDITAR',
  },
  convertir: {
    categoryEs: 'convertir',
    categoryEn: 'convert',
    titleEs: 'Convertir PDF Gratis Online — Word, Excel, PowerPoint, JPG | PDFBlack',
    titleEn: 'Convert PDF to Word, Excel, PPT, JPG & HTML Online for Free | PDFBlack',
    descEs:
      'Convierte archivos PDF a Word, Excel, PowerPoint, imágenes JPG, HTML y Texto online gratis. Motor de conversión de alta fidelidad sin registros ni marcas de agua.',
    descEn:
      'Convert PDF documents to and from Word, Excel, PowerPoint, JPG, HTML, and Text. 100% client-side conversion preserving formatting, tables, and vectors without server uploads.',
    keywordsEs: [
      'convertir pdf gratis',
      'convertir pdf a word',
      'convertir word a pdf',
      'convertir pdf a excel',
      'convertir excel a pdf',
      'convertir pdf a powerpoint',
      'convertir powerpoint a pdf',
      'convertir pdf a jpg',
      'convertir jpg a pdf',
      'convertir pdf a texto',
      'convertir texto a pdf',
      'convertir pdf a html',
      'convertir html a pdf',
      'pdf converter free online',
    ],
    keywordsEn: [
      'convert pdf',
      'pdf to word free',
      'pdf to excel',
      'pdf to powerpoint',
      'pdf to jpg',
      'word to pdf',
      'excel to pdf',
      'free pdf converter',
    ],
    badge: 'CONVERTIR',
  },
};

/**
 * Genera la metadata completa de Next.js para una página Hub de Categoría en un idioma dado.
 */
export function buildCategoryHubMetadata(
  category:
    | 'organizar'
    | 'optimizar'
    | 'editar'
    | 'convertir'
    | 'organize'
    | 'optimize'
    | 'edit'
    | 'convert',
  lang: 'es' | 'en' = 'es',
): Metadata {
  const normalizedCat =
    category === 'organize'
      ? 'organizar'
      : category === 'optimize'
        ? 'optimizar'
        : category === 'edit'
          ? 'editar'
          : category === 'convert'
            ? 'convertir'
            : category;

  const info = CATEGORY_HUBS_METADATA[normalizedCat];
  const isEs = lang === 'es';

  const title = info
    ? isEs
      ? info.titleEs
      : info.titleEn
    : `${normalizedCat.toUpperCase()} — PDFBlack`;
  const description = info
    ? isEs
      ? info.descEs
      : info.descEn
    : 'Herramientas PDF gratuitas, rápidas y 100% privadas en tu navegador.';
  const keywords = info ? (isEs ? info.keywordsEs : info.keywordsEn) : ['pdf gratis', 'pdf tools'];

  const esUrl = `${SITE_URL}/${info?.categoryEs || normalizedCat}`;
  const enUrl = `${SITE_URL}/en/${info?.categoryEn || normalizedCat}`;
  const canonicalUrl = isEs ? esUrl : enUrl;

  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(
    title.split('—')[0].trim(),
  )}&badge=${encodeURIComponent(info?.badge || normalizedCat.toUpperCase())}&category=${encodeURIComponent(
    normalizedCat,
  )}&lang=${lang}`;

  return {
    title,
    description,
    keywords,
    authors: [{ name: 'PDFBlack Team' }],
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: esUrl,
        en: enUrl,
        'x-default': esUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'PDFBlack',
      locale: isEs ? 'es_ES' : 'en_US',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Genera el JSON-LD Schema estructurado con WebApplication y AggregateRating (5 estrellas).
 */
export function buildToolStructuredData(
  category: string,
  toolSlug: string,
  lang: 'es' | 'en' = 'es',
) {
  const info = TOOLS_METADATA_REGISTRY[category]?.[toolSlug];
  const isEs = lang === 'es';
  const title = info ? (isEs ? info.titleEs : info.titleEn) : `${toolSlug} — PDFBlack`;
  const description = info
    ? isEs
      ? info.descEs
      : info.descEn
    : 'Free, fast, and 100% private PDF tool in your browser.';

  const matchingTool = TOOLS_ROUTES.find(
    (t) =>
      (t.category === category || t.categoryEn === category) &&
      (t.slugEs === toolSlug || t.slugEn === toolSlug),
  );
  const url = isEs
    ? matchingTool
      ? `${SITE_URL}${matchingTool.pathEs}`
      : `${SITE_URL}/${category}/${toolSlug}`
    : matchingTool
      ? `${SITE_URL}${matchingTool.pathEn}`
      : `${SITE_URL}/en/${category}/${toolSlug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: title,
    url,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires modern browser with WebAssembly',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1428',
      bestRating: '5',
      worstRating: '1',
    },
    description,
  };
}

/**
 * Genera el esquema BreadcrumbList para Google Search.
 */
export function buildBreadcrumbStructuredData(
  category: string,
  toolSlug: string,
  lang: 'es' | 'en' = 'es',
) {
  const isEs = lang === 'es';
  const info = TOOLS_METADATA_REGISTRY[category]?.[toolSlug];
  const toolName = info
    ? isEs
      ? info.titleEs.split('—')[0].trim()
      : info.titleEn.split('—')[0].trim()
    : toolSlug;

  const categoryNames: Record<string, { es: string; en: string }> = {
    convertir: { es: 'Convertir PDF', en: 'Convert PDF' },
    organizar: { es: 'Organizar PDF', en: 'Organize PDF' },
    optimizar: { es: 'Optimizar PDF', en: 'Optimize PDF' },
    editar: { es: 'Editar PDF', en: 'Edit PDF' },
    convert: { es: 'Convertir PDF', en: 'Convert PDF' },
    organize: { es: 'Organizar PDF', en: 'Organize PDF' },
    optimize: { es: 'Optimizar PDF', en: 'Optimize PDF' },
    edit: { es: 'Editar PDF', en: 'Edit PDF' },
  };

  const matchingTool = TOOLS_ROUTES.find(
    (t) =>
      (t.category === category || t.categoryEn === category) &&
      (t.slugEs === toolSlug || t.slugEn === toolSlug),
  );

  const catName = categoryNames[category]?.[lang] || category;
  const homeUrl = isEs ? SITE_URL : `${SITE_URL}/en`;
  const catUrl = isEs
    ? `${SITE_URL}/${matchingTool?.category || category}`
    : `${SITE_URL}/en/${matchingTool?.categoryEn || category}`;
  const toolUrl = isEs
    ? matchingTool
      ? `${SITE_URL}${matchingTool.pathEs}`
      : `${SITE_URL}/${category}/${toolSlug}`
    : matchingTool
      ? `${SITE_URL}${matchingTool.pathEn}`
      : `${SITE_URL}/en/${category}/${toolSlug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isEs ? 'Inicio' : 'Home',
        item: homeUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: catName,
        item: catUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: toolName,
        item: toolUrl,
      },
    ],
  };
}

/**
 * Genera el esquema HowTo con pasos secuenciales para activar el carrusel de instrucciones en Google.
 */
export function buildHowToStructuredData(
  category: string,
  toolSlug: string,
  lang: 'es' | 'en' = 'es',
  customSteps?: Array<{ title: string; desc: string }>,
) {
  const isEs = lang === 'es';
  const info = TOOLS_METADATA_REGISTRY[category]?.[toolSlug];
  const title = info
    ? isEs
      ? `Cómo usar ${info.titleEs.split('—')[0].trim()} online gratis`
      : `How to use ${info.titleEn.split('—')[0].trim()} online for free`
    : `How to use ${toolSlug}`;
  const description = info ? (isEs ? info.descEs : info.descEn) : '';

  const defaultStepsEs = [
    {
      title: 'Selecciona o arrastra tus archivos PDF',
      desc: 'Haz clic en el área de carga o arrastra tus documentos PDF directamente desde tu computadora o dispositivo móvil.',
    },
    {
      title: 'Configura las opciones de la herramienta',
      desc: 'Ajusta los parámetros específicos de la herramienta según tus preferencias o necesidades de formato.',
    },
    {
      title: 'Procesa y descarga tu documento',
      desc: 'Pulsa el botón de acción para compilar tu documento localmente en memoria y descárgalo al instante sin límites.',
    },
  ];

  const defaultStepsEn = [
    {
      title: 'Select or drag your PDF files',
      desc: 'Click the upload zone or drag and drop your PDF documents directly from your computer or mobile device.',
    },
    {
      title: 'Configure tool settings',
      desc: 'Adjust specific tool parameters according to your preferences or output document requirements.',
    },
    {
      title: 'Process and download your document',
      desc: 'Click the action button to compile your document locally in memory and download it instantly without limits.',
    },
  ];

  const steps =
    customSteps && customSteps.length > 0 ? customSteps : isEs ? defaultStepsEs : defaultStepsEn;

  const matchingTool = TOOLS_ROUTES.find(
    (t) =>
      (t.category === category || t.categoryEn === category) &&
      (t.slugEs === toolSlug || t.slugEn === toolSlug),
  );
  const toolUrl = isEs
    ? matchingTool
      ? `${SITE_URL}${matchingTool.pathEs}`
      : `${SITE_URL}/${category}/${toolSlug}`
    : matchingTool
      ? `${SITE_URL}${matchingTool.pathEn}`
      : `${SITE_URL}/en/${category}/${toolSlug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description,
    totalTime: 'PT1M',
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: '0',
    },
    supply: [
      {
        '@type': 'HowToSupply',
        name: isEs ? 'Documentos PDF' : 'PDF Documents',
      },
    ],
    tool: [
      {
        '@type': 'HowToTool',
        name: isEs ? 'Navegador Web con WebAssembly' : 'Web Browser with WebAssembly',
      },
    ],
    step: steps.map((s, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: s.title,
      text: s.desc,
      url: `${toolUrl}#step-${idx + 1}`,
    })),
  };
}

/**
 * Genera el esquema DefinedTerm para Google AI Overviews, Perplexity y motores de respuesta AEO.
 */
export function buildDefinedTermSchema({
  term,
  definition,
  url,
  inDefinedTermSetUrl,
  lang = 'es',
}: {
  term: string;
  definition: string;
  url: string;
  inDefinedTermSetUrl: string;
  lang?: 'es' | 'en';
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term,
    description: definition,
    url,
    inDefinedTermSet: inDefinedTermSetUrl,
    inLanguage: lang,
  };
}

/**
 * Genera la metadata del Índice del Glosario Técnico en español o inglés.
 */
export function buildGlossaryIndexMetadata(lang: 'es' | 'en' = 'es'): Metadata {
  const isEs = lang === 'es';
  const title = isEs
    ? 'Glosario Técnico de PDF — Conceptos, Estándares ISO y Seguridad | PDFBlack'
    : 'Technical PDF Glossary — Specifications, ISO Standards & Security | PDFBlack';
  const description = isEs
    ? 'Centro de recursos técnicos sobre PDF: conoce qué es la numeración Bates, diferencias entre PDF/A y PDF estándar, cifrado militar AES-256, censura binaria y arquitectura Zero-Knowledge.'
    : 'Comprehensive technical PDF knowledge hub: discover Bates numbering, PDF/A versus standard PDF, AES-256 military encryption, forensic redaction, and client-side zero-knowledge architecture.';
  const canonicalUrl = isEs ? `${SITE_URL}/glosario` : `${SITE_URL}/en/glossary`;
  const esUrl = `${SITE_URL}/glosario`;
  const enUrl = `${SITE_URL}/en/glossary`;
  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(
    isEs ? 'Glosario Técnico PDF' : 'Technical PDF Glossary',
  )}&badge=${encodeURIComponent('CENTRO DE RECURSOS')}&category=tecnologia&lang=${lang}`;

  return {
    title,
    description,
    keywords: isEs
      ? [
          'glosario pdf',
          'conceptos tecnicos pdf',
          'estandares iso pdf',
          'seguridad en pdf',
          'cifrado pdf explicacion',
        ]
      : [
          'pdf glossary',
          'technical pdf terms',
          'pdf iso standards',
          'pdf cryptography',
          'bates numbering explained',
        ],
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: esUrl,
        en: enUrl,
        'x-default': esUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'PDFBlack',
      locale: isEs ? 'es_ES' : 'en_US',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Genera el esquema FAQPage para Google Search y People Also Ask (PAA).
 */
export function buildFaqStructuredData(faqs?: Array<{ q: string; a: string }>) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

/**
 * Genera la suite completa de esquemas Schema.org para una herramienta (WebApplication, Breadcrumb, HowTo, FAQPage).
 */
export function buildFullToolSchemas({
  category,
  toolSlug,
  lang = 'es',
  faqs,
  steps,
}: {
  category: string;
  toolSlug: string;
  lang?: 'es' | 'en';
  faqs?: Array<{ q: string; a: string }>;
  steps?: Array<{ title: string; desc: string }>;
}) {
  return {
    webApp: buildToolStructuredData(category, toolSlug, lang),
    breadcrumb: buildBreadcrumbStructuredData(category, toolSlug, lang),
    howTo: buildHowToStructuredData(category, toolSlug, lang, steps),
    faq: buildFaqStructuredData(faqs),
  };
}

/**
 * Genera el esquema DefinedTermSet para la página índice del glosario.
 */
export function buildDefinedTermSetSchema(terms: GlossaryTerm[], lang: 'es' | 'en' = 'es') {
  const isEs = lang === 'es';
  const url = isEs ? `${SITE_URL}/glosario` : `${SITE_URL}/en/glossary`;
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: isEs
      ? 'Glosario Técnico de Estándares y Seguridad PDF'
      : 'Technical PDF & Document Security Glossary',
    description: isEs
      ? 'Enciclopedia y centro de recursos de estándares de documentos PDF, criptografía y procesamiento legal.'
      : 'Technical encyclopedia of PDF document standards, cryptography, and legal document processing.',
    url,
    inLanguage: lang,
    hasDefinedTerm: terms.map((t) => ({
      '@type': 'DefinedTerm',
      name: isEs ? t.term : t.termEn,
      description: t.blufDefinition,
      url: `${url}/${isEs ? t.slug : t.slugEn}`,
    })),
  };
}

/**
 * Genera el esquema BreadcrumbList para un término específico del glosario.
 */
export function buildGlossaryBreadcrumbSchema(term: GlossaryTerm, lang: 'es' | 'en' = 'es') {
  const isEs = lang === 'es';
  const homeUrl = isEs ? SITE_URL : `${SITE_URL}/en`;
  const glossaryUrl = isEs ? `${SITE_URL}/glosario` : `${SITE_URL}/en/glossary`;
  const termUrl = isEs
    ? `${SITE_URL}/glosario/${term.slug}`
    : `${SITE_URL}/en/glossary/${term.slugEn}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isEs ? 'Inicio' : 'Home',
        item: homeUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isEs ? 'Glosario Técnico' : 'Technical Glossary',
        item: glossaryUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isEs ? term.term : term.termEn,
        item: termUrl,
      },
    ],
  };
}

/**
 * Genera la metadata completa con hreflang 100% recíproco para una página de término del glosario.
 */
export function buildGlossaryTermMetadata(term: GlossaryTerm, lang: 'es' | 'en' = 'es'): Metadata {
  const isEs = lang === 'es';
  const title = term.metaTitle;
  const description = term.metaDescription;
  const canonicalUrl = isEs
    ? `${SITE_URL}/glosario/${term.slug}`
    : `${SITE_URL}/en/glossary/${term.slugEn}`;
  const esUrl = `${SITE_URL}/glosario/${term.slug}`;
  const enUrl = `${SITE_URL}/en/glossary/${term.slugEn}`;
  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(
    isEs ? term.term : term.termEn,
  )}&badge=${encodeURIComponent(term.badge)}&category=${term.category}&lang=${lang}`;

  return {
    title,
    description,
    keywords: term.keywords,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: esUrl,
        en: enUrl,
        'x-default': esUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'PDFBlack',
      locale: isEs ? 'es_ES' : 'en_US',
      type: 'article',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Genera la metadata del Hub de Soluciones por Industria (B2B SEO).
 */
export function buildIndustryHubMetadata(lang: 'es' | 'en' = 'es'): Metadata {
  const isEs = lang === 'es';
  const title = isEs
    ? 'Soluciones PDF por Industria: Cumplimiento Legal, Salud y Finanzas | PDFBlack'
    : 'Industry PDF Solutions: Legal, Healthcare & Finance Compliance | PDFBlack';
  const description = isEs
    ? 'Descubre cómo despachos de abogados, hospitales, firmas de auditoría y administraciones públicas procesan documentos PDF con 100% privacidad local sin subir archivos a la nube.'
    : 'Discover how law firms, hospitals, accounting firms, and government agencies process sensitive PDF documents with 100% client-side zero-knowledge privacy.';
  const canonicalUrl = isEs ? `${SITE_URL}/industrias` : `${SITE_URL}/en/industries`;
  const esUrl = `${SITE_URL}/industrias`;
  const enUrl = `${SITE_URL}/en/industries`;
  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(
    isEs ? 'Soluciones PDF por Industria' : 'Industry PDF Solutions',
  )}&badge=${encodeURIComponent('ENTERPRISE & B2B')}&category=organizar&lang=${lang}`;

  return {
    title,
    description,
    keywords: isEs
      ? [
          'pdf para empresas',
          'software pdf por sector',
          'pdf cumplimiento normativo',
          'pdf despacho abogados',
          'pdf sector salud hipaa',
          'pdf finanzas auditoria',
        ]
      : [
          'enterprise pdf solutions',
          'industry compliant pdf',
          'law firm pdf software',
          'hipaa compliant pdf editor',
          'financial services pdf security',
          'government pdf data sovereignty',
        ],
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: esUrl,
        en: enUrl,
        'x-default': esUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'PDFBlack',
      locale: isEs ? 'es_ES' : 'en_US',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Genera la metadata completa con hreflang 100% recíproco para una página de industria específica.
 */
export function buildIndustryMetadata(
  industry: IndustryPageData,
  lang: 'es' | 'en' = 'es',
): Metadata {
  const isEs = lang === 'es';
  const title = isEs ? industry.metaTitle : industry.metaTitleEn;
  const description = isEs ? industry.metaDescription : industry.metaDescriptionEn;
  const canonicalUrl = isEs
    ? `${SITE_URL}/industrias/${industry.slug}`
    : `${SITE_URL}/en/industries/${industry.slugEn}`;
  const esUrl = `${SITE_URL}/industrias/${industry.slug}`;
  const enUrl = `${SITE_URL}/en/industries/${industry.slugEn}`;
  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(
    isEs ? industry.name : industry.nameEn,
  )}&badge=${encodeURIComponent(industry.heroBadge)}&category=organizar&lang=${lang}`;

  return {
    title,
    description,
    keywords: isEs ? industry.keywords : industry.keywordsEn,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: esUrl,
        en: enUrl,
        'x-default': esUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'PDFBlack',
      locale: isEs ? 'es_ES' : 'en_US',
      type: 'article',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Genera el esquema Service / ProfessionalService para páginas B2B de industria.
 */
export function buildIndustryServiceSchema(industry: IndustryPageData, lang: 'es' | 'en' = 'es') {
  const isEs = lang === 'es';
  const url = isEs
    ? `${SITE_URL}/industrias/${industry.slug}`
    : `${SITE_URL}/en/industries/${industry.slugEn}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: isEs ? industry.h1 : industry.h1En,
    serviceType: 'Confidential Document Security & Private PDF Processing',
    provider: {
      '@type': 'Organization',
      name: 'PDFBlack',
      url: SITE_URL,
    },
    description: isEs ? industry.metaDescription : industry.metaDescriptionEn,
    audience: {
      '@type': 'Audience',
      audienceType: isEs ? industry.name : industry.nameEn,
    },
    url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: isEs
        ? 'Procesamiento ilimitado y gratuito sin registro'
        : 'Unlimited free client-side processing',
    },
  };
}

/**
 * Genera el esquema BreadcrumbList para una página de industria.
 */
export function buildIndustryBreadcrumbSchema(
  industry: IndustryPageData,
  lang: 'es' | 'en' = 'es',
) {
  const isEs = lang === 'es';
  const homeUrl = isEs ? SITE_URL : `${SITE_URL}/en`;
  const hubUrl = isEs ? `${SITE_URL}/industrias` : `${SITE_URL}/en/industries`;
  const pageUrl = isEs
    ? `${SITE_URL}/industrias/${industry.slug}`
    : `${SITE_URL}/en/industries/${industry.slugEn}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isEs ? 'Inicio' : 'Home',
        item: homeUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isEs ? 'Industrias' : 'Industries',
        item: hubUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isEs ? industry.name : industry.nameEn,
        item: pageUrl,
      },
    ],
  };
}
