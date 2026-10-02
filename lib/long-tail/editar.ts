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

  'borrar-marca-de-agua-pdf-online': {
    slug: 'borrar-marca-de-agua-pdf-online',
    category: 'editar',
    toolKey: 'quitar-marca-agua',
    badge: 'Remoción Limpia de Marcas',
    h1: 'Borrar Marca de Agua de un PDF Online Gratis — Eliminar Sellos y Logos',
    subtitle:
      'Aprende cómo borrar una marca de agua de un PDF sin alterar la tipografía ni desconfigurar párrafos. Elimina sellos de borrador, logos y textos sobrepuestos molestos de forma 100% privada.',
    metaTitle: 'Borrar Marca de Agua PDF Online Gratis — Quitar Sellos y Logos | PDFBlack',
    metaDescription:
      '¿Cómo borrar una marca de agua de un PDF? Remueve marcas de agua, sellos de borrador y logos en documentos PDF online gratis sin dejar rastro. 100% privado en tu navegador.',
    keywords: [
      'borrar marca de agua pdf',
      'como borrar marca de agua de un pdf',
      'quitar marca de agua pdf online gratis',
      'eliminar marca de agua de un documento pdf',
      'borrar sello de agua pdf',
      'quitar sellos en pdf',
      'borrar marca de agua de pdf gratis',
    ],
    parentPath: '/editar/quitar-marca-agua',
    parentName: 'Quitar Marca de Agua',
    specifications: [
      {
        feature: 'Tipos de marcas',
        value: 'Sellos de texto y logos PNG/JPEG',
        note: 'Detecta y limpia capas sobrepuestas',
      },
      {
        feature: 'Integridad del texto',
        value: '100% Preservada',
        note: 'El contenido subyacente y fuentes se mantienen intactos',
      },
      {
        feature: 'Seguridad',
        value: '100% Local en RAM',
        note: 'Tus contratos e historiales nunca tocan servidores externos',
      },
      {
        feature: 'Procesamiento',
        value: 'Por lotes o página individual',
        note: 'Remueve marcas en cientos de páginas en segundos',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Carga el documento con marca',
        desc: 'Arrastra el PDF que contiene el sello o logotipo no deseado.',
      },
      {
        step: 2,
        title: 'Selecciona el área o capa del sello',
        desc: 'Identifica la marca de agua con el visor interactivo de PDFBlack.',
      },
      {
        step: 3,
        title: 'Descarga tu PDF limpio',
        desc: 'Obtén tu documento impecable sin marcas ni suscripciones premium.',
      },
    ],
    benefits: [
      {
        title: 'Presentación Profesional Inmediata',
        desc: 'Presenta cotizaciones, informes y proyectos sin marcas invasivas de software.',
      },
      {
        title: 'Ahorro Económico Total',
        desc: 'Evita adquirir suscripciones mensuales de software costoso para una tarea puntual.',
      },
    ],
    faqs: [
      {
        q: '¿Cómo borrar una marca de agua de un PDF sin pagar licencias?',
        a: 'Con PDFBlack puedes abrir tu archivo en el navegador y eliminar marcas de agua de texto o imagen directamente con WebAssembly de manera gratuita e ilimitada.',
      },
      {
        q: '¿Se desalinean las tablas o fuentes al borrar el sello?',
        a: 'No. El motor aísla exclusivamente los operadores vectoriales o capas de imagen de la marca, dejando intacto el texto de fondo.',
      },
    ],
    relatedSolutions: [
      'quitar-marca-agua-camscanner',
      'editar-texto-pdf-sin-desconfigurar',
      'foliar-expediente-judicial',
    ],
    esEquivalentSlug: 'borrar-marca-de-agua-pdf-online',
    enEquivalentSlug: 'erase-watermark-from-pdf-online',
  },

  'foliar-expediente-judicial-pdf': {
    slug: 'foliar-expediente-judicial-pdf',
    category: 'editar',
    toolKey: 'foliar',
    badge: 'Normativa Procesal Electrónica',
    h1: 'Foliar Expediente Judicial en PDF — Foliación Electrónica Correlativa',
    subtitle:
      'Numera escritos, demandas y anexos para mesas de partes del Poder Judicial y fiscalías. Foliado en esquina superior derecha con formato regulado (Fs. 001) y orden correlativo o inverso.',
    metaTitle: 'Foliar Expediente Judicial en PDF Online Gratis — Foliación Procesal | PDFBlack',
    metaDescription:
      'Foliación electrónica de expedientes judiciales en PDF conforme a directivas procesales. Numera fojas correlativas con total privacidad y secreto profesional.',
    keywords: [
      'foliar expediente judicial pdf',
      'foliar un expediente judicial en pdf',
      'foliacion electronica pdf',
      'como foliar un pdf para el poder judicial',
      'numerar hojas de expediente judicial',
      'foliar escrito judicial pdf',
      'foliacion poder judicial',
    ],
    parentPath: '/editar/foliar',
    parentName: 'Foliar PDF',
    specifications: [
      {
        feature: 'Formato de folios',
        value: 'Correlativo (1, 2, 3...) o Prefijo (Fs. 001)',
        note: 'Configuración flexible para juzgados civiles, penales y laborales',
      },
      {
        feature: 'Ubicación regulada',
        value: 'Esquina superior derecha',
        note: 'Cumple estándares obligatorios de mesas de partes electrónicas',
      },
      {
        feature: 'Secreto profesional',
        value: '100% en Navegador (WASM)',
        note: 'Expedientes confidenciales nunca se transmiten por internet',
      },
      {
        feature: 'Dirección de foliado',
        value: 'Progresivo o Inverso',
        note: 'Soporta foliación de atrás hacia adelante para cuadernos de pruebas',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Carga tu escrito o expediente',
        desc: 'Arrastra el PDF compilado con los medios probatorios y anexos.',
      },
      {
        step: 2,
        title: 'Configura la numeración de folios',
        desc: 'Define el folio inicial, prefijo ("Fs. "), formato de ceros y posición.',
      },
      {
        step: 3,
        title: 'Descarga tu expediente foliado',
        desc: 'Listo para presentar ante la mesa de partes virtual sin riesgo de observaciones procesales.',
      },
    ],
    benefits: [
      {
        title: 'Cero Observaciones en Mesa de Partes',
        desc: 'Evita el rechazo de tus escritos por defectos o inconsistencias en la numeración de fojas.',
      },
      {
        title: 'Privacidad Legal Inviolable',
        desc: 'Garantiza el secreto profesional del abogado al procesar el caso íntegramente en la RAM local.',
      },
    ],
    faqs: [
      {
        q: '¿Cómo foliar un expediente judicial en PDF correctamente?',
        a: 'La directiva procesal estipula colocar el número en la esquina superior derecha con el prefijo "Fs. " o número correlativo legible, asegurando que no tape encabezados.',
      },
      {
        q: '¿Se puede empezar a foliar desde un número específico como Fs. 150?',
        a: 'Sí. Puedes definir cualquier número de inicio y el algoritmo continuará la secuencia automáticamente hasta la última foja.',
      },
    ],
    relatedSolutions: [
      'foliar-expediente-judicial',
      'foliar-pdf-de-atras-hacia-adelante',
      'censurar-datos-personales-pdf',
    ],
    esEquivalentSlug: 'foliar-expediente-judicial-pdf',
    enEquivalentSlug: 'bates-number-legal-documents-pdf',
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

  'erase-watermark-from-pdf-online': {
    slug: 'erase-watermark-from-pdf-online',
    category: 'editar',
    toolKey: 'quitar-marca-agua',
    badge: 'Clean Overlay Removal',
    h1: 'Erase Watermark from PDF Online Free — Remove Stamps & Logos',
    subtitle:
      'Learn how to remove unwanted watermarks, draft stamps, and background overlay logos from PDF documents while preserving original typography and formatting with complete privacy.',
    metaTitle: 'Erase Watermark from PDF Online Free — Remove Stamps | PDFBlack',
    metaDescription:
      'Erase watermarks, stamps, and overlay logos from PDF files cleanly online. 100% client-side privacy in your browser with zero data leaks and no sign-up.',
    keywords: [
      'erase watermark from pdf online',
      'remove watermark from pdf free',
      'delete pdf watermark stamp',
      'clear watermark from pdf document',
      'how to remove watermark from pdf',
      'delete draft stamp from pdf',
    ],
    parentPath: '/en/remove-watermark',
    parentName: 'Remove Watermark',
    specifications: [
      {
        feature: 'Watermark Types',
        value: 'Vector stamps & PNG/JPEG overlays',
        note: 'Detects and strips overlaying layers cleanly',
      },
      {
        feature: 'Text Integrity',
        value: '100% Untouched',
        note: 'Underlying document paragraphs and fonts remain unaltered',
      },
      {
        feature: 'Security',
        value: '100% Client-Side RAM',
        note: 'Proprietary contracts never leave your local browser',
      },
      {
        feature: 'Scope',
        value: 'Batch or individual pages',
        note: 'Removes marks across multi-page files in seconds',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Upload watermarked PDF',
        desc: 'Drag and drop the document containing the unwanted stamp or logo.',
      },
      {
        step: 2,
        title: 'Select watermark region',
        desc: 'Use the interactive canvas to highlight the watermark layer to eliminate.',
      },
      {
        step: 3,
        title: 'Download clean PDF',
        desc: 'Save your spotless document instantly with zero software subscriptions.',
      },
    ],
    benefits: [
      {
        title: 'Instant Professional Delivery',
        desc: 'Deliver client presentations and academic reports free from intrusive app logos.',
      },
      {
        title: 'Cost-Free Utility',
        desc: 'Skip expensive recurring subscriptions for simple one-off document cleanups.',
      },
    ],
    faqs: [
      {
        q: 'How do I erase a watermark without distorting underlying tables?',
        a: 'PDFBlack targets the specific graphical operator stream associated with the watermark, leaving text glyphs and tabular gridlines intact.',
      },
      {
        q: 'Is my document uploaded to a cloud server?',
        a: 'No. All processing executes in your browser RAM using WebAssembly; no data ever leaves your computer.',
      },
    ],
    relatedSolutions: [
      'remove-camscanner-watermark',
      'edit-pdf-text-without-formatting-loss',
      'bates-numbering-legal-pdf',
    ],
    esEquivalentSlug: 'borrar-marca-de-agua-pdf-online',
    enEquivalentSlug: 'erase-watermark-from-pdf-online',
  },

  'bates-number-legal-documents-pdf': {
    slug: 'bates-number-legal-documents-pdf',
    category: 'editar',
    toolKey: 'foliar',
    badge: 'Legal Discovery & Court Filing',
    h1: 'Bates Number Legal Documents & Court Exhibits in PDF — 100% Private',
    subtitle:
      'Apply sequential Bates stamping and numbering to legal briefs, discovery exhibits, and trial bundles with custom prefixes, zero padding, and court-compliant positioning.',
    metaTitle: 'Bates Number Legal Documents & Exhibits Online Free | PDFBlack',
    metaDescription:
      'Add sequential Bates numbering to legal PDFs and court discovery files. 100% client-side privacy protecting attorney-client privileged documents.',
    keywords: [
      'bates number legal documents pdf',
      'bates stamp pdf online free',
      'court exhibit numbering pdf',
      'legal document bates stamping',
      'sequential page numbering legal pdf',
      'bates stamping without adobe',
    ],
    parentPath: '/en/bates-numbering',
    parentName: 'Bates Numbering',
    specifications: [
      {
        feature: 'Numbering Formats',
        value: 'Sequential (1, 2, 3...) or Prefix (Fs. 001, CONF-0001)',
        note: 'Fully customizable prefix and zero padding',
      },
      {
        feature: 'Placement',
        value: 'Top Right, Bottom Right, or Custom Corner',
        note: 'Meets court discovery and electronic filing mandates',
      },
      {
        feature: 'Attorney-Client Privilege',
        value: 'Strict Zero-Knowledge RAM',
        note: 'Privileged discovery evidence never touches third-party clouds',
      },
      {
        feature: 'Direction',
        value: 'Ascending or Reverse',
        note: 'Supports reverse numbering for chronological court filings',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Upload legal discovery PDF',
        desc: 'Drag your consolidated brief, trial bundle, or documentary evidence.',
      },
      {
        step: 2,
        title: 'Configure Bates parameters',
        desc: 'Set prefix, starting number, font style, and margin position.',
      },
      {
        step: 3,
        title: 'Download stamped brief',
        desc: 'Get your fully indexed filing ready for immediate court submission.',
      },
    ],
    benefits: [
      {
        title: 'Compliance with Court E-Filing Rules',
        desc: 'Satisfy judicial requirements for electronic evidence without costly software licenses.',
      },
      {
        title: 'Absolute Confidentiality',
        desc: 'Safeguard attorney work product with in-browser WebAssembly processing.',
      },
    ],
    faqs: [
      {
        q: 'Can I start Bates numbering from an offset number like Page 250?',
        a: 'Yes. You can define any starting integer and custom prefix, and the numbering advances sequentially.',
      },
      {
        q: 'Does it support Bates numbering in reverse order?',
        a: 'Yes. Reverse numbering is supported for jurisdictions and court records that index from back to front.',
      },
    ],
    relatedSolutions: [
      'bates-numbering-legal-pdf',
      'reverse-bates-numbering-pdf',
      'redact-pdf-free-permanently',
    ],
    esEquivalentSlug: 'foliar-expediente-judicial-pdf',
    enEquivalentSlug: 'bates-number-legal-documents-pdf',
  },
};

export const EDITAR_PAIRS: Record<string, string> = {
  'convertir-pdf-escaneado-a-texto-seleccionable': 'searchable-ocr-pdf-without-uploading',
  'poner-marca-agua-borrador-confidencial': 'watermark-draft-confidential-pdf',
  'borrar-marca-de-agua-pdf-online': 'erase-watermark-from-pdf-online',
  'foliar-expediente-judicial-pdf': 'bates-number-legal-documents-pdf',
};
