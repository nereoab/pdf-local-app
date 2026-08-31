import { ConverterSeoSectionProps } from '@/components/ConverterSeoSection';

export const CONVERTER_SEO_DATA: Record<string, ConverterSeoSectionProps> = {
  'pdf-word': {
    toolKey: 'pdf-word',
    sourceFormat: 'PDF',
    targetFormat: 'Word (.docx)',
    titleEs: 'Convertir PDF a Word Online con Máxima Fidelidad (DOCX)',
    titleEn: 'Convert PDF to Word Online with Maximum Fidelity (DOCX)',
    descriptionEs:
      'Transforma tus documentos PDF en archivos Microsoft Word (.docx) editables al 100%. Nuestro motor oficial de Adobe Acrobat reconstruye fuentes, maquetación, tablas, imágenes y vectores con precisión milimétrica.',
    descriptionEn:
      'Transform your PDF documents into 100% editable Microsoft Word (.docx) files. Our official Adobe Acrobat engine reconstructs fonts, layouts, tables, images, and vectors with millimeter precision.',
    stepsEs: [
      {
        title: 'Sube tu documento',
        desc: 'Arrastra o selecciona el archivo PDF desde tu dispositivo o nube.',
      },
      {
        title: 'Procesamiento de Adobe',
        desc: 'El motor analiza las capas vectoriales y reconstruye la tipografía editable.',
      },
      {
        title: 'Descarga tu Word',
        desc: 'Obtén tu archivo DOCX listo para abrir y editar en Microsoft Word.',
      },
    ],
    stepsEn: [
      {
        title: 'Upload your document',
        desc: 'Drag or select the PDF file from your device or cloud.',
      },
      {
        title: 'Adobe Processing',
        desc: 'The engine analyzes vector layers and reconstructs editable typography.',
      },
      {
        title: 'Download your Word',
        desc: 'Get your DOCX file ready to open and edit in Microsoft Word.',
      },
    ],
    featuresEs: [
      {
        title: 'Fidelidad 10/10',
        desc: 'Conserva el diseño editorial exacto, columnas y márgenes originales.',
      },
      {
        title: 'Textos 100% Editables',
        desc: 'Párrafos fluidos y fuentes integradas sin convertir texto en imágenes.',
      },
      {
        title: 'Cero Cajas Negras',
        desc: 'Procesamiento limpio sin errores de compatibilidad ni tablas rotas.',
      },
    ],
    featuresEn: [
      {
        title: '10/10 Fidelity',
        desc: 'Preserves the exact editorial layout, columns, and original margins.',
      },
      {
        title: '100% Editable Text',
        desc: 'Fluid paragraphs and integrated fonts without converting text to images.',
      },
      {
        title: 'Zero Black Boxes',
        desc: 'Clean processing without compatibility errors or broken tables.',
      },
    ],
    faqsEs: [
      {
        q: '¿El archivo Word resultante es totalmente editable?',
        a: 'Sí, todas las cajas de texto, títulos, tablas e imágenes se convierten en elementos nativos de Microsoft Word para que puedas modificarlos libremente.',
      },
      {
        q: '¿Se mantienen los formatos complejos como folletos o brochures?',
        a: 'Absolutamente. Gracias al motor oficial de Adobe Acrobat Pro, los diseños horizontales, trípticos y folletos con fondos vectoriales se respetan íntegramente.',
      },
      {
        q: '¿Mis documentos están seguros?',
        a: 'Sí. Todos los archivos se transfieren bajo cifrado TLS de 256 bits y se eliminan automáticamente de nuestros servidores.',
      },
    ],
    faqsEn: [
      {
        q: 'Is the resulting Word file fully editable?',
        a: 'Yes, all text boxes, headings, tables, and images are converted into native Microsoft Word elements so you can modify them freely.',
      },
      {
        q: 'Are complex layouts like brochures or flyers preserved?',
        a: 'Absolutely. Thanks to the official Adobe Acrobat Pro engine, landscape designs, brochures, and vector-heavy layouts are fully preserved.',
      },
      {
        q: 'Are my documents safe?',
        a: 'Yes. All files are transferred under 256-bit TLS encryption and automatically deleted from our servers.',
      },
    ],
  },
  'word-pdf': {
    toolKey: 'word-pdf',
    sourceFormat: 'Word (.docx, .doc)',
    targetFormat: 'PDF',
    titleEs: 'Convertir Word a PDF Online Gratis (DOCX a PDF)',
    titleEn: 'Convert Word to PDF Online Free (DOCX to PDF)',
    descriptionEs:
      'Convierte tus documentos de Word en archivos PDF vectoriales de alta resolución. Garantiza que cualquier persona pueda ver tu documento con las fuentes y el formato exacto en cualquier dispositivo.',
    descriptionEn:
      'Convert your Word documents into high-resolution vector PDF files. Ensure anyone can view your document with exact fonts and formatting on any device.',
    stepsEs: [
      { title: 'Sube tu archivo Word', desc: 'Selecciona tu archivo .docx o .doc.' },
      {
        title: 'Compilación Vectorial',
        desc: 'Generamos un PDF imprimible con todas las fuentes incrustadas.',
      },
      {
        title: 'Descarga instantánea',
        desc: 'Descarga tu documento PDF listo para compartir o imprimir.',
      },
    ],
    stepsEn: [
      { title: 'Upload your Word file', desc: 'Select your .docx or .doc file.' },
      { title: 'Vector Compilation', desc: 'We generate a printable PDF with all embedded fonts.' },
      { title: 'Instant Download', desc: 'Download your PDF document ready to share or print.' },
    ],
    featuresEs: [
      {
        title: 'Fuentes Incrustadas',
        desc: 'Tu PDF se verá idéntico en celulares, Mac o Windows.',
      },
      { title: 'Calidad de Impresión', desc: 'Gráficos vectoriales nítidos a 300 DPI.' },
      { title: 'Procesamiento Rápido', desc: 'Conversión en menos de 5 segundos.' },
    ],
    featuresEn: [
      { title: 'Embedded Fonts', desc: 'Your PDF will look identical on phones, Mac, or Windows.' },
      { title: 'Print Quality', desc: 'Crisp vector graphics at 300 DPI.' },
      { title: 'Fast Processing', desc: 'Conversion in less than 5 seconds.' },
    ],
    faqsEs: [
      {
        q: '¿Puedo convertir archivos .doc antiguos y .docx modernos?',
        a: 'Sí, admitimos todos los formatos de Microsoft Word desde versiones clásicas hasta las más recientes.',
      },
      {
        q: '¿Se respetan las tablas y numeración de páginas?',
        a: 'Sí, todas las tablas, pies de página, encabezados y estilos de párrafo se mantienen exactamente iguales.',
      },
    ],
    faqsEn: [
      {
        q: 'Can I convert old .doc and modern .docx files?',
        a: 'Yes, we support all Microsoft Word formats from legacy versions to the latest.',
      },
      {
        q: 'Are tables and page numbering preserved?',
        a: 'Yes, all tables, footers, headers, and paragraph styles remain identical.',
      },
    ],
  },
  'pdf-excel': {
    toolKey: 'pdf-excel',
    sourceFormat: 'PDF',
    targetFormat: 'Excel (.xlsx)',
    titleEs: 'Convertir PDF a Excel Online (Tablas a XLSX / CSV)',
    titleEn: 'Convert PDF to Excel Online (Tables to XLSX / CSV)',
    descriptionEs:
      'Extrae tablas de tus archivos PDF y conviértelas en hojas de cálculo de Microsoft Excel (.xlsx) con celdas, filas y columnas editables sin perder datos.',
    descriptionEn:
      'Extract tables from your PDF files and convert them into Microsoft Excel (.xlsx) spreadsheets with editable cells, rows, and columns without data loss.',
    stepsEs: [
      {
        title: 'Carga tu PDF con tablas',
        desc: 'Selecciona balances, facturas o reportes financieros.',
      },
      {
        title: 'Detección de celdas',
        desc: 'El motor reconoce la grilla numérica y la estructura tabular.',
      },
      { title: 'Descarga tu Excel', desc: 'Abre tu libro XLSX y realiza cálculos de inmediato.' },
    ],
    stepsEn: [
      {
        title: 'Upload your table PDF',
        desc: 'Select balance sheets, invoices, or financial reports.',
      },
      {
        title: 'Cell Detection',
        desc: 'The engine recognizes numerical grids and tabular structures.',
      },
      {
        title: 'Download your Excel',
        desc: 'Open your XLSX workbook and perform calculations immediately.',
      },
    ],
    featuresEs: [
      {
        title: 'Formato Numérico',
        desc: 'Reconocimiento automático de cifras, monedas y porcentajes.',
      },
      {
        title: 'Una Hoja por Página',
        desc: 'Opción de separar páginas en pestañas o consolidar todo.',
      },
      {
        title: 'Sin Fórmulas Rotas',
        desc: 'Celdas limpias listas para aplicar funciones SUMA, PROMEDIO y más.',
      },
    ],
    featuresEn: [
      {
        title: 'Numeric Formatting',
        desc: 'Automatic recognition of numbers, currencies, and percentages.',
      },
      {
        title: 'One Sheet per Page',
        desc: 'Option to separate pages into tabs or consolidate everything.',
      },
      {
        title: 'No Broken Formulas',
        desc: 'Clean cells ready for SUM, AVERAGE, and custom formulas.',
      },
    ],
    faqsEs: [
      {
        q: '¿Qué pasa si mi PDF tiene tablas sin bordes?',
        a: 'El motor inteligente detecta la alineación de columnas y texto para agrupar las celdas correctamente.',
      },
      {
        q: '¿Puedo exportar a formato CSV?',
        a: 'Sí, puedes elegir exportar directamente a Microsoft Excel (.xlsx) o a valores separados por comas (.csv).',
      },
    ],
    faqsEn: [
      {
        q: 'What happens if my PDF has borderless tables?',
        a: 'The smart engine detects column alignment and text flow to group cells accurately.',
      },
      {
        q: 'Can I export to CSV format?',
        a: 'Yes, you can choose to export directly to Microsoft Excel (.xlsx) or comma-separated values (.csv).',
      },
    ],
  },
  'excel-pdf': {
    toolKey: 'excel-pdf',
    sourceFormat: 'Excel (.xlsx, .xls)',
    targetFormat: 'PDF',
    titleEs: 'Convertir Excel a PDF Online (XLSX a PDF)',
    titleEn: 'Convert Excel to PDF Online (XLSX to PDF)',
    descriptionEs:
      'Convierte tus hojas de cálculo de Excel en documentos PDF nítidos y ajustados a la página para presentaciones o reportes ejecutivos.',
    descriptionEn:
      'Convert your Excel spreadsheets into crisp, page-fitted PDF documents for presentations or executive reports.',
    stepsEs: [
      { title: 'Sube tu archivo XLSX', desc: 'Carga tu archivo de Excel.' },
      { title: 'Ajuste de página', desc: 'Optimizamos la orientación horizontal o vertical.' },
      { title: 'Descarga tu PDF', desc: 'Guarda tu reporte listo para impresión.' },
    ],
    stepsEn: [
      { title: 'Upload your XLSX file', desc: 'Upload your Excel file.' },
      { title: 'Page Fitting', desc: 'We optimize landscape or portrait orientation.' },
      { title: 'Download your PDF', desc: 'Save your print-ready report.' },
    ],
    featuresEs: [
      { title: 'Ajuste Automático', desc: 'Evita que las columnas se corten fuera de la hoja.' },
      { title: 'Líneas de Cuadrícula', desc: 'Conserva el estilo visual de tu hoja de cálculo.' },
      { title: 'Alta Resolución', desc: 'Texto nítido incluso en tablas extensas.' },
    ],
    featuresEn: [
      { title: 'Auto Fit', desc: 'Prevents columns from being clipped off the page.' },
      { title: 'Gridlines Preserved', desc: 'Preserves the visual styling of your spreadsheet.' },
      { title: 'High Resolution', desc: 'Crisp text even on large data tables.' },
    ],
    faqsEs: [
      {
        q: '¿Cómo evitar que una tabla ancha se corte?',
        a: 'Nuestra herramienta ajusta automáticamente las hojas anchas a orientación horizontal (Landscape) en tamaño A4 o Carta.',
      },
    ],
    faqsEn: [
      {
        q: 'How to avoid wide tables getting cut off?',
        a: 'Our tool automatically adjusts wide sheets to landscape orientation in A4 or Letter size.',
      },
    ],
  },
  'pdf-powerpoint': {
    toolKey: 'pdf-powerpoint',
    sourceFormat: 'PDF',
    targetFormat: 'PowerPoint (.pptx)',
    titleEs: 'Convertir PDF a PowerPoint Online (Diapositivas PPTX)',
    titleEn: 'Convert PDF to PowerPoint Online (PPTX Slides)',
    descriptionEs:
      'Convierte tus presentaciones en PDF a diapositivas editables de PowerPoint (.pptx). Cada página se convierte en una diapositiva con texto, formas e imágenes modificables.',
    descriptionEn:
      'Convert your PDF presentations into editable PowerPoint slides (.pptx). Each page turns into a slide with modifiable text, shapes, and images.',
    stepsEs: [
      { title: 'Sube tu presentación PDF', desc: 'Carga tus diapositivas o catálogo en PDF.' },
      {
        title: 'Reconstrucción PPTX',
        desc: 'Generamos diapositivas 16:9 o 4:3 con elementos vectoriales.',
      },
      {
        title: 'Descarga y Expón',
        desc: 'Abre tu archivo en Microsoft PowerPoint o Google Slides.',
      },
    ],
    stepsEn: [
      { title: 'Upload your PDF presentation', desc: 'Upload your slides or PDF catalog.' },
      {
        title: 'PPTX Reconstruction',
        desc: 'We generate 16:9 or 4:3 slides with vector elements.',
      },
      {
        title: 'Download & Present',
        desc: 'Open your file in Microsoft PowerPoint or Google Slides.',
      },
    ],
    featuresEs: [
      { title: 'Formato Panorámico 16:9', desc: 'Adaptado a pantallas y proyectores modernos.' },
      {
        title: 'Diapositivas Individuales',
        desc: 'Cada página se organiza en una diapositiva independiente.',
      },
      {
        title: 'Compatible con Google Slides',
        desc: 'Importa tu archivo .pptx directamente a la nube.',
      },
    ],
    featuresEn: [
      { title: 'Widescreen 16:9 Format', desc: 'Tailored for modern displays and projectors.' },
      { title: 'Individual Slides', desc: 'Each page is organized onto an independent slide.' },
      { title: 'Google Slides Compatible', desc: 'Import your .pptx file directly to the cloud.' },
    ],
    faqsEs: [
      {
        q: '¿Puedo editar los textos en PowerPoint?',
        a: 'Sí, con el motor de Adobe Acrobat los textos y títulos quedan listos para editar.',
      },
    ],
    faqsEn: [
      {
        q: 'Can I edit the text in PowerPoint?',
        a: 'Yes, with the Adobe Acrobat engine, texts and titles are fully editable.',
      },
    ],
  },
  'powerpoint-pdf': {
    toolKey: 'powerpoint-pdf',
    sourceFormat: 'PowerPoint (.pptx, .ppt)',
    targetFormat: 'PDF',
    titleEs: 'Convertir PowerPoint a PDF Online (PPTX a PDF)',
    titleEn: 'Convert PowerPoint to PDF Online (PPTX to PDF)',
    descriptionEs:
      'Exporta tus presentaciones de PowerPoint a PDF de alta resolución para enviar por correo o presentar sin riesgo de que se desordenen las fuentes o imágenes.',
    descriptionEn:
      'Export your PowerPoint presentations to high-resolution PDF to email or present without risk of misplaced fonts or images.',
    stepsEs: [
      { title: 'Carga tu archivo .pptx', desc: 'Arrastra tu presentación de PowerPoint.' },
      {
        title: 'Exportación Vectorial',
        desc: 'Convertimos cada diapositiva en una página PDF fija.',
      },
      { title: 'Descarga tu presentación', desc: 'Lista para compartir en cualquier dispositivo.' },
    ],
    stepsEn: [
      { title: 'Upload your .pptx file', desc: 'Drag your PowerPoint presentation.' },
      { title: 'Vector Export', desc: 'We convert each slide into a fixed PDF page.' },
      { title: 'Download Presentation', desc: 'Ready to share on any device.' },
    ],
    featuresEs: [
      {
        title: 'Cero Desconfiguraciones',
        desc: 'Las fuentes y fotos nunca se moverán de su lugar.',
      },
      { title: 'Diapositivas HD', desc: 'Máxima resolución para pantallas 4K y proyectores.' },
      { title: 'Peso Optimizado', desc: 'Archivos livianos fáciles de adjuntar.' },
    ],
    featuresEn: [
      { title: 'Zero Layout Shift', desc: 'Fonts and photos will never shift out of place.' },
      { title: 'HD Slides', desc: 'Maximum resolution for 4K displays and projectors.' },
      { title: 'Optimized File Size', desc: 'Lightweight files easy to attach.' },
    ],
    faqsEs: [
      {
        q: '¿Se incluyen las notas del orador?',
        a: 'Por defecto se convierten las diapositivas visibles en alta calidad.',
      },
    ],
    faqsEn: [
      {
        q: 'Are speaker notes included?',
        a: 'By default, visible slides are converted in high quality.',
      },
    ],
  },
  'pdf-jpg': {
    toolKey: 'pdf-jpg',
    sourceFormat: 'PDF',
    targetFormat: 'Imágenes (JPG / PNG)',
    titleEs: 'Convertir PDF a JPG / PNG Online Gratis',
    titleEn: 'Convert PDF to JPG / PNG Online Free',
    descriptionEs:
      'Convierte páginas de documentos PDF en imágenes de alta calidad (JPG, PNG o WebP) o extrae todas las fotos individuales en un archivo comprimido .ZIP.',
    descriptionEn:
      'Convert PDF document pages into high-quality images (JPG, PNG, or WebP) or extract all individual photos in a compressed .ZIP file.',
    stepsEs: [
      {
        title: 'Sube tu documento PDF',
        desc: 'Selecciona el PDF que contiene las páginas o imágenes.',
      },
      {
        title: 'Elige el formato y calidad',
        desc: 'Selecciona JPG, PNG (con transparencia) o WebP a 300 DPI.',
      },
      {
        title: 'Descarga tus imágenes',
        desc: 'Descarga la imagen individual o un archivo .ZIP con todas las páginas.',
      },
    ],
    stepsEn: [
      { title: 'Upload your PDF document', desc: 'Select the PDF containing pages or images.' },
      {
        title: 'Choose format & quality',
        desc: 'Select JPG, PNG (with transparency), or WebP at 300 DPI.',
      },
      {
        title: 'Download your images',
        desc: 'Download single image or a .ZIP archive with all pages.',
      },
    ],
    featuresEs: [
      { title: 'Resolución de 300 DPI', desc: 'Nitidez profesional apta para diseño o impresión.' },
      {
        title: 'Empaquetado en ZIP',
        desc: 'Descarga todas las páginas numeradas en un solo clic.',
      },
      {
        title: 'Selector de Páginas',
        desc: 'Elige solo las páginas que realmente necesitas exportar.',
      },
    ],
    featuresEn: [
      { title: '300 DPI Resolution', desc: 'Professional sharpness suitable for design or print.' },
      { title: 'ZIP Packaging', desc: 'Download all numbered pages in a single click.' },
      { title: 'Page Selector', desc: 'Choose only the specific pages you actually need.' },
    ],
    faqsEs: [
      {
        q: '¿Qué diferencia hay entre JPG y PNG?',
        a: 'JPG ofrece menor peso de archivo, mientras que PNG ofrece máxima nitidez sin compresión destructiva.',
      },
    ],
    faqsEn: [
      {
        q: 'What is the difference between JPG and PNG?',
        a: 'JPG offers smaller file size, while PNG delivers maximum clarity with lossless compression.',
      },
    ],
  },
  'jpg-pdf': {
    toolKey: 'jpg-pdf',
    sourceFormat: 'Imágenes (JPG, PNG, WebP)',
    targetFormat: 'PDF',
    titleEs: 'Convertir JPG a PDF Online Gratis (Imágenes a PDF)',
    titleEn: 'Convert JPG to PDF Online Free (Images to PDF)',
    descriptionEs:
      'Une y convierte múltiples fotos e imágenes JPG, PNG o WebP en un único archivo PDF profesional y ordenado.',
    descriptionEn:
      'Combine and convert multiple JPG, PNG, or WebP photos and images into a single professional, organized PDF file.',
    stepsEs: [
      { title: 'Sube tus imágenes', desc: 'Arrastra tus fotos en JPG, PNG o WebP.' },
      { title: 'Ajusta márgenes y orden', desc: 'Configura orientación y márgenes de página.' },
      { title: 'Genera tu PDF', desc: 'Descarga tu documento consolidado en alta calidad.' },
    ],
    stepsEn: [
      { title: 'Upload your images', desc: 'Drag your JPG, PNG, or WebP photos.' },
      { title: 'Adjust margins & order', desc: 'Configure page orientation and margins.' },
      { title: 'Generate your PDF', desc: 'Download your consolidated document in high quality.' },
    ],
    featuresEs: [
      { title: 'Múltiples Fotos a 1 PDF', desc: 'Agrupa decenas de imágenes en un solo archivo.' },
      {
        title: 'Orientación Inteligente',
        desc: 'Rotación automática para fotos horizontales y verticales.',
      },
      { title: 'Ajuste de Margen', desc: 'Elige sin margen, margen pequeño o margen amplio.' },
    ],
    featuresEn: [
      { title: 'Multiple Photos to 1 PDF', desc: 'Group dozens of images into a single file.' },
      { title: 'Smart Orientation', desc: 'Automatic rotation for landscape and portrait photos.' },
      { title: 'Margin Adjustment', desc: 'Choose no margin, small margin, or wide margin.' },
    ],
    faqsEs: [
      {
        q: '¿Se reduce la calidad de mis fotos?',
        a: 'No, el conversor incrusta las imágenes conservando sus píxeles y colores originales.',
      },
    ],
    faqsEn: [
      {
        q: 'Is photo quality reduced?',
        a: 'No, the converter embeds images preserving their original pixels and colors.',
      },
    ],
  },
  'pdf-texto': {
    toolKey: 'pdf-texto',
    sourceFormat: 'PDF',
    targetFormat: 'Texto (.txt)',
    titleEs: 'Extraer Texto de PDF Online (PDF a TXT)',
    titleEn: 'Extract Text from PDF Online (PDF to TXT)',
    descriptionEs:
      'Extrae todo el texto plano de documentos PDF con codificación UTF-8 limpia para análisis de datos, procesamiento de texto o notas.',
    descriptionEn:
      'Extract all plain text from PDF documents with clean UTF-8 encoding for data analysis, text processing, or notes.',
    stepsEs: [
      { title: 'Sube tu PDF', desc: 'Carga cualquier PDF con texto.' },
      { title: 'Extracción UTF-8', desc: 'Separamos los caracteres y saltos de párrafo.' },
      { title: 'Descarga el archivo TXT', desc: 'Copia o descarga el texto completo.' },
    ],
    stepsEn: [
      { title: 'Upload your PDF', desc: 'Upload any text-based PDF.' },
      { title: 'UTF-8 Extraction', desc: 'We parse characters and paragraph breaks.' },
      { title: 'Download TXT file', desc: 'Copy or download the entire text.' },
    ],
    featuresEs: [
      { title: 'Codificación Limpia', desc: 'Sin caracteres rotos ni símbolos extraños.' },
      { title: 'Preservación de Párrafos', desc: 'Estructura de párrafos y listas ordenada.' },
      { title: 'Copiado Rápido', desc: 'Botón de copiado al portapapeles con 1 clic.' },
    ],
    featuresEn: [
      { title: 'Clean Encoding', desc: 'No broken characters or strange symbols.' },
      { title: 'Paragraph Preservation', desc: 'Organized paragraph structure and lists.' },
      { title: 'Quick Copy', desc: '1-click copy to clipboard button.' },
    ],
    faqsEs: [
      {
        q: '¿Puedo extraer texto de páginas específicas?',
        a: 'Sí, puedes seleccionar un rango de páginas o todo el documento.',
      },
    ],
    faqsEn: [
      {
        q: 'Can I extract text from specific pages?',
        a: 'Yes, you can select a page range or the entire document.',
      },
    ],
  },
  'texto-pdf': {
    toolKey: 'texto-pdf',
    sourceFormat: 'Texto (.txt)',
    targetFormat: 'PDF',
    titleEs: 'Convertir Texto a PDF Online (TXT a PDF)',
    titleEn: 'Convert Text to PDF Online (TXT to PDF)',
    descriptionEs:
      'Convierte archivos de texto plano (.txt) o texto pegado en elegantes documentos PDF con tipografía profesional y paginación automática.',
    descriptionEn:
      'Convert plain text files (.txt) or pasted text into elegant PDF documents with professional typography and automatic pagination.',
    stepsEs: [
      { title: 'Escribe o sube tu texto', desc: 'Pega tu contenido o sube un archivo .txt.' },
      {
        title: 'Personaliza el estilo',
        desc: 'Elige tipografía (Helvetica, Times, Courier), tamaño y márgenes.',
      },
      { title: 'Descarga tu PDF', desc: 'Obtén tu documento maquetado y listo para imprimir.' },
    ],
    stepsEn: [
      { title: 'Type or upload text', desc: 'Paste your content or upload a .txt file.' },
      {
        title: 'Customize style',
        desc: 'Choose font (Helvetica, Times, Courier), size, and margins.',
      },
      { title: 'Download your PDF', desc: 'Get your formatted document ready to print.' },
    ],
    featuresEs: [
      {
        title: 'Paginación Automática',
        desc: 'Cálculo inteligente de saltos de página y números de hoja.',
      },
      { title: 'Tipografías Clásicas', desc: 'Soporte de fuentes estándar de alta legibilidad.' },
      {
        title: 'Alineación y Márgenes',
        desc: 'Control total de espaciado y márgenes de impresión.',
      },
    ],
    featuresEn: [
      { title: 'Auto Pagination', desc: 'Smart page break and page number calculations.' },
      { title: 'Classic Fonts', desc: 'Support for high-legibility standard fonts.' },
      { title: 'Alignment & Margins', desc: 'Total control over line spacing and print margins.' },
    ],
    faqsEs: [
      {
        q: '¿Puedo personalizar el tamaño de letra?',
        a: 'Sí, puedes elegir entre varios tamaños y espaciados de línea.',
      },
    ],
    faqsEn: [
      {
        q: 'Can I customize font size?',
        a: 'Yes, you can choose between multiple font sizes and line spacings.',
      },
    ],
  },
  'pdf-html': {
    toolKey: 'pdf-html',
    sourceFormat: 'PDF',
    targetFormat: 'HTML',
    titleEs: 'Convertir PDF a HTML Online Gratis',
    titleEn: 'Convert PDF to HTML Online Free',
    descriptionEs:
      'Transforma páginas de documentos PDF en código HTML5 semántico con estilos CSS limpios para publicar en tu sitio web.',
    descriptionEn:
      'Transform PDF document pages into semantic HTML5 code with clean CSS styling to publish on your website.',
    stepsEs: [
      { title: 'Sube tu PDF', desc: 'Selecciona tu archivo PDF.' },
      { title: 'Generación HTML5', desc: 'El motor estructura las etiquetas y estilos.' },
      {
        title: 'Descarga tu código',
        desc: 'Obtén el archivo .html listo para abrir en navegadores.',
      },
    ],
    stepsEn: [
      { title: 'Upload your PDF', desc: 'Select your PDF file.' },
      { title: 'HTML5 Generation', desc: 'The engine structures tags and styles.' },
      { title: 'Download your code', desc: 'Get the .html file ready to open in browsers.' },
    ],
    featuresEs: [
      { title: 'HTML5 Estándar', desc: 'Código limpio compatible con todos los navegadores.' },
      {
        title: 'Estilos Responsivos',
        desc: 'Visualización adaptable en móviles y pantallas de escritorio.',
      },
      {
        title: 'Fácil Integración',
        desc: 'Listo para embeber en WordPress, React o páginas web estáticas.',
      },
    ],
    featuresEn: [
      { title: 'Standard HTML5', desc: 'Clean code compatible with all web browsers.' },
      { title: 'Responsive Styles', desc: 'Adaptable layout on mobile and desktop screens.' },
      {
        title: 'Easy Integration',
        desc: 'Ready to embed in WordPress, React, or static web pages.',
      },
    ],
    faqsEs: [
      {
        q: '¿El archivo HTML incluye las imágenes del PDF?',
        a: 'Sí, las imágenes se incrustan como elementos optimizados en el archivo HTML.',
      },
    ],
    faqsEn: [
      {
        q: 'Does the HTML file include PDF images?',
        a: 'Yes, images are embedded as optimized elements in the HTML file.',
      },
    ],
  },
  'html-pdf': {
    toolKey: 'html-pdf',
    sourceFormat: 'HTML',
    targetFormat: 'PDF',
    titleEs: 'Convertir HTML a PDF Online Gratis',
    titleEn: 'Convert HTML to PDF Online Free',
    descriptionEs:
      'Convierte código HTML, plantillas web o páginas completas en documentos PDF vectoriales listos para imprimir o archivar.',
    descriptionEn:
      'Convert HTML code, web templates, or full web pages into vector PDF documents ready to print or archive.',
    stepsEs: [
      {
        title: 'Pega tu HTML o archivo',
        desc: 'Introduce el código HTML o carga tu archivo .html.',
      },
      { title: 'Renderizado del DOM', desc: 'Compilamos los estilos CSS, fuentes y tablas.' },
      { title: 'Descarga tu PDF', desc: 'Obtén el PDF con maquetación web exacta.' },
    ],
    stepsEn: [
      { title: 'Paste your HTML or file', desc: 'Enter HTML code or upload your .html file.' },
      { title: 'DOM Rendering', desc: 'We compile CSS styling, fonts, and tables.' },
      { title: 'Download your PDF', desc: 'Get the PDF with exact web layout.' },
    ],
    featuresEs: [
      { title: 'Soporte CSS3', desc: 'Renderizado fiel de colores, bordes y tipografías.' },
      { title: 'Ajuste de Impresión', desc: 'Configuración de saltos de página y márgenes A4.' },
      { title: 'Imágenes Web Incrustadas', desc: 'Compatibilidad con imágenes SVG, PNG y JPG.' },
    ],
    featuresEn: [
      { title: 'CSS3 Support', desc: 'Faithful rendering of colors, borders, and fonts.' },
      { title: 'Print Fitting', desc: 'A4 page break and margin configuration.' },
      { title: 'Embedded Web Images', desc: 'Compatibility with SVG, PNG, and JPG images.' },
    ],
    faqsEs: [
      {
        q: '¿Puedo convertir plantillas de facturas en HTML?',
        a: 'Sí, es ideal para facturas, recibos y reportes generados con HTML y CSS.',
      },
    ],
    faqsEn: [
      {
        q: 'Can I convert HTML invoice templates?',
        a: 'Yes, it is ideal for invoices, receipts, and reports generated with HTML and CSS.',
      },
    ],
  },
};
