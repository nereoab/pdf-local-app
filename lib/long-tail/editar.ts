import { LongTailSolution } from './types';

export const EDITAR_SOLUTIONS_ES: Record<string, LongTailSolution> = {
  'convertir-pdf-escaneado-a-texto-seleccionable': {
    slug: 'convertir-pdf-escaneado-a-texto-seleccionable',
    category: 'editar',
    toolKey: 'ocr',
    badge: 'Reconocimiento Óptico de Caracteres Local',
    h1: 'Convertir PDF Escaneado a Texto Seleccionable y Buscable — OCR Local',
    subtitle:
      'Transforma documentos escaneados, fotocopias y fotos de libros en archivos PDF con capa de texto real con Tesseract WASM. Busca palabras con Ctrl+F y copia fragmentos sin subir nada a la nube.',
    metaTitle: 'OCR PDF: Convertir Escaneo a Texto Buscable Online Gratis | PDFBlack',
    metaDescription:
      'Aplica OCR a PDFs escaneados para buscar, copiar y seleccionar texto. Motor de inteligencia artificial local en tu navegador sin límite de privacidad.',
    keywords: [
      'convertir pdf escaneado a texto seleccionable',
      'ocr pdf online gratis',
      'hacer pdf buscable',
      'reconocer texto en pdf escaneado',
      'extraer texto de imagen pdf ocr',
    ],
    parentPath: '/editar/ocr',
    parentName: 'OCR PDF',
    specifications: [
      {
        feature: 'Motor de IA',
        value: 'Tesseract v5 WebAssembly',
        note: 'Ejecuta modelos neuronales en tu procesador',
      },
      {
        feature: 'Idiomas reconocidos',
        value: 'Español, Inglés y multilingüe',
        note: 'Alta precisión con tildes, eñes y caracteres latinos',
      },
      {
        feature: 'Salida',
        value: 'PDF con capa de texto invisible',
        note: 'Mantiene la apariencia original del papel escaneado',
      },
      {
        feature: 'Privacidad',
        value: '100% Sin servidores',
        note: 'Documentos notariales e historiales médicos seguros',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Carga el documento escaneado',
        desc: 'Arrastra el PDF que contiene imágenes o fotos de páginas impresas.',
      },
      {
        step: 2,
        title: 'Selecciona el idioma del documento',
        desc: 'Elige el idioma principal para calibrar el diccionario de reconocimiento.',
      },
      {
        step: 3,
        title: 'Descarga tu PDF buscable',
        desc: 'Abre el nuevo archivo y comprueba cómo puedes buscar con Ctrl+F y seleccionar texto.',
      },
    ],
    benefits: [
      {
        title: 'Búsqueda Instantánea en Documentos Notariales',
        desc: 'Encuentra nombres, fechas o cláusulas en expedientes de 100 páginas en un segundo.',
      },
      {
        title: 'Copia Directa a Word o Correo',
        desc: 'Deja de transcribir a mano textos de libros o resoluciones gubernamentales.',
      },
    ],
    faqs: [
      {
        q: '¿Se altera la imagen del documento escaneado?',
        a: 'No. El OCR incrusta una capa de texto transparente sobre la imagen para mantener la fidelidad visual original.',
      },
      {
        q: '¿Funciona con escaneos torcidos o de baja resolución?',
        a: 'El motor incluye preprocesamiento adaptativo de binarización y corrección de contraste para maximizar la lectura.',
      },
    ],
    relatedSolutions: [
      'editar-texto-pdf-sin-desconfigurar',
      'convertir-pdf-a-word-editable',
      'quitar-marca-agua-camscanner',
    ],
    esEquivalentSlug: 'convertir-pdf-escaneado-a-texto-seleccionable',
    enEquivalentSlug: 'searchable-ocr-pdf-without-uploading',
  },

  'poner-marca-agua-borrador-confidencial': {
    slug: 'poner-marca-agua-borrador-confidencial',
    category: 'editar',
    toolKey: 'marca-agua',
    badge: 'Protección de Propiedad Intelectual',
    h1: 'Poner Marca de Agua «Borrador» o «Confidencial» en PDF — Personalizable',
    subtitle:
      'Añade sellos traslúcidos diagonales de «CONFIDENCIAL», «BORRADOR», «COPIA NO CONTROLADA» o tu logotipo corporativo en todas las páginas de tus documentos oficiales.',
    metaTitle: 'Añadir Marca de Agua a PDF Online Gratis y Personalizado | PDFBlack',
    metaDescription:
      'Agrega marcas de agua de texto o imagen a cualquier archivo PDF. Ajusta tipografía, opacidad, rotación y posición 100% privado en tu navegador.',
    keywords: [
      'poner marca de agua borrador confidencial',
      'agregar marca de agua pdf online',
      'sello confidencial en pdf',
      'marca de agua diagonal pdf gratis',
      'poner logotipo como marca de agua en pdf',
    ],
    parentPath: '/editar/marca-agua',
    parentName: 'Marca de Agua PDF',
    specifications: [
      {
        feature: 'Tipos de marca',
        value: 'Texto vectorial o Imagen PNG',
        note: 'Soporta transparencias y rotación a 45°',
      },
      {
        feature: 'Ubicación',
        value: 'Sobre o debajo del texto',
        note: 'Permite lectura fluida sin tapar información',
      },
      {
        feature: 'Alcance',
        value: 'Todas las páginas o rango',
        note: 'Aplica a todo el documento o páginas específicas',
      },
      {
        feature: 'Seguridad',
        value: '100% Local en RAM',
        note: 'Borradores de proyectos y patentes a salvo',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Arrastra tu documento',
        desc: 'Carga el contrato o informe previo a su distribución.',
      },
      {
        step: 2,
        title: 'Configura la marca de agua',
        desc: 'Escribe «CONFIDENCIAL», elige color, tamaño y nivel de transparencia.',
      },
      {
        step: 3,
        title: 'Descarga el PDF protegido',
        desc: 'Obtén tu documento con la marca indeleble en cada hoja.',
      },
    ],
    benefits: [
      {
        title: 'Evita Uso No Autorizado de Borradores',
        desc: 'Asegura que nadie confunda una propuesta preliminar con un acuerdo definitivo.',
      },
      {
        title: 'Refuerza la Identidad Corporativa',
        desc: 'Imprime el logotipo de tu despacho o empresa en informes destinados a clientes.',
      },
    ],
    faqs: [
      {
        q: '¿Se puede borrar fácilmente la marca de agua agregada?',
        a: 'La marca se inscribe formalmente en los flujos de contenido de cada página, requiriendo software especializado para retirarla.',
      },
      {
        q: '¿Tapa el texto del contrato?',
        a: 'Puedes calibrar la opacidad (ej. 15% o 25%) para que sea visible pero permita leer perfectamente el texto debajo.',
      },
    ],
    relatedSolutions: [
      'foliar-expediente-judicial',
      'firmar-pdf-sin-imprimir',
      'quitar-marca-agua-camscanner',
    ],
    esEquivalentSlug: 'poner-marca-agua-borrador-confidencial',
    enEquivalentSlug: 'watermark-draft-confidential-pdf',
  },
};

export const EDITAR_SOLUTIONS_EN: Record<string, LongTailSolution> = {
  'searchable-ocr-pdf-without-uploading': {
    slug: 'searchable-ocr-pdf-without-uploading',
    category: 'editar',
    toolKey: 'ocr',
    badge: 'Local Optical Character Recognition',
    h1: 'Convert Scanned PDF to Searchable Text with OCR — 100% Local AI',
    subtitle:
      'Transform photocopies, scanned books, and paper receipts into searchable, selectable PDF documents via client-side Tesseract WASM. Search with Ctrl+F and copy text without cloud uploads.',
    metaTitle: 'OCR PDF: Make Scanned PDF Searchable Online Free | PDFBlack',
    metaDescription:
      'Apply high-accuracy OCR to scanned PDFs to search, copy, and select text. Local artificial intelligence engine running in your browser with zero data leaks.',
    keywords: [
      'searchable ocr pdf without uploading',
      'make scanned pdf searchable free',
      'convert scanned pdf to text ocr',
      'free local ocr pdf',
      'extract text from scanned document',
    ],
    parentPath: '/en/ocr-pdf',
    parentName: 'OCR PDF',
    specifications: [
      {
        feature: 'AI Engine',
        value: 'Tesseract v5 WebAssembly',
        note: 'Neural network execution directly on your CPU',
      },
      {
        feature: 'Language Support',
        value: 'English, Spanish & Multilingual',
        note: 'High accuracy on legal, financial, and medical typography',
      },
      {
        feature: 'Output Format',
        value: 'PDF with invisible text layer',
        note: 'Retains original scanned paper appearance',
      },
      {
        feature: 'Privacy',
        value: '100% Serverless execution',
        note: 'Safe for medical charts, legal records, and tax filings',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Upload scanned document',
        desc: 'Drag and drop the PDF containing scanned paper or image pages.',
      },
      {
        step: 2,
        title: 'Select primary language',
        desc: 'Choose the document language to calibrate dictionary recognition.',
      },
      {
        step: 3,
        title: 'Download searchable PDF',
        desc: 'Open your new file and search terms with Ctrl+F or copy text cleanly.',
      },
    ],
    benefits: [
      {
        title: 'Instant Keyword Discovery',
        desc: 'Locate dates, names, or clauses across 100-page historical dossiers in seconds.',
      },
      {
        title: 'Eliminate Manual Transcription',
        desc: 'Copy excerpts directly into Word or spreadsheets without manual typing.',
      },
    ],
    faqs: [
      {
        q: 'Is the visual appearance of the scan degraded?',
        a: 'No. The OCR engine overlays an invisible, aligned text layer directly atop the original scan.',
      },
      {
        q: 'Does it handle crooked or low-contrast paper scans?',
        a: 'Adaptive binarization and contrast enhancement run before recognition to maximize accuracy.',
      },
    ],
    relatedSolutions: [
      'edit-pdf-text-without-formatting-loss',
      'convert-pdf-to-editable-word-doc',
      'remove-camscanner-watermark',
    ],
    esEquivalentSlug: 'convertir-pdf-escaneado-a-texto-seleccionable',
    enEquivalentSlug: 'searchable-ocr-pdf-without-uploading',
  },

  'watermark-draft-confidential-pdf': {
    slug: 'watermark-draft-confidential-pdf',
    category: 'editar',
    toolKey: 'marca-agua',
    badge: 'Intellectual Property Protection',
    h1: 'Add «CONFIDENTIAL» or «DRAFT» Watermark to PDF — Fully Customizable',
    subtitle:
      'Stamp translucent diagonal text such as «CONFIDENTIAL», «DRAFT», «PRELIMINARY», or your custom corporate company logo across every page of your PDF documents.',
    metaTitle: 'Add Watermark to PDF Online Free & Customizable | PDFBlack',
    metaDescription:
      'Add custom text or image watermarks to any PDF document. Control font, opacity, rotation, and position with 100% in-browser privacy.',
    keywords: [
      'watermark draft confidential pdf',
      'add watermark to pdf free online',
      'confidential stamp on pdf',
      'diagonal watermark pdf',
      'add company logo watermark to pdf',
    ],
    parentPath: '/en/watermark-pdf',
    parentName: 'Watermark PDF',
    specifications: [
      {
        feature: 'Watermark Types',
        value: 'Vector text or PNG image',
        note: 'Supports custom opacity and 45° diagonal angle',
      },
      {
        feature: 'Layer Positioning',
        value: 'Above or beneath text',
        note: 'Ensures background reading without obscuring content',
      },
      {
        feature: 'Coverage Scope',
        value: 'All pages or targeted range',
        note: 'Apply to entire dossier or specific appendix',
      },
      {
        feature: 'Security',
        value: '100% Client-side RAM',
        note: 'Trade secrets and patent drafts remain completely private',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Upload your document',
        desc: 'Drag the contract or technical brief prior to distribution.',
      },
      {
        step: 2,
        title: 'Configure your stamp',
        desc: 'Type «CONFIDENTIAL», select font color, size, and transparency level.',
      },
      {
        step: 3,
        title: 'Download watermarked PDF',
        desc: 'Get your protected document with durable watermarks across all pages.',
      },
    ],
    benefits: [
      {
        title: 'Prevent Premature Draft Circulation',
        desc: 'Ensure stakeholders never mistake a preliminary draft for an approved contract.',
      },
      {
        title: 'Brand Distinction',
        desc: 'Brand technical reports and client deliverables with your firm’s logo.',
      },
    ],
    faqs: [
      {
        q: 'Can recipients easily erase the watermark?',
        a: 'The watermark is baked into the content stream matrix of each page, preventing casual removal.',
      },
      {
        q: 'Will the watermark obstruct legibility?',
        a: 'You can adjust transparency down to 15%–25% so text underneath remains effortless to read.',
      },
    ],
    relatedSolutions: [
      'bates-numbering-legal-pdf',
      'sign-pdf-online-without-printing',
      'remove-camscanner-watermark',
    ],
    esEquivalentSlug: 'poner-marca-agua-borrador-confidencial',
    enEquivalentSlug: 'watermark-draft-confidential-pdf',
  },
};

export const EDITAR_PAIRS: Record<string, string> = {
  'convertir-pdf-escaneado-a-texto-seleccionable': 'searchable-ocr-pdf-without-uploading',
  'poner-marca-agua-borrador-confidencial': 'watermark-draft-confidential-pdf',
};
