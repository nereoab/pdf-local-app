import { GlossaryTerm } from './types';

export const GLOSSARY_TERMS_ES: Record<string, GlossaryTerm> = {
  'numeracion-bates': {
    slug: 'numeracion-bates',
    slugEn: 'bates-numbering',
    term: 'Numeración Bates (Bates Numbering)',
    termEn: 'Bates Numbering',
    category: 'legal',
    categoryLabel: 'Práctica Jurídica y Procesal',
    badge: 'ESTÁNDAR PROCESAL JUDICIAL',
    metaTitle: '¿Qué es la Numeración Bates en PDF? Guía Técnica y Legal | PDFBlack',
    metaDescription:
      'Descubre qué es la numeración Bates en documentos PDF, cómo se estructura en litigios judiciales y cómo foliar expedientes con prefijos alfanuméricos de forma 100% privada.',
    keywords: [
      'que es numeracion bates',
      'numeracion bates pdf',
      'bates stamping que es',
      'foliar expediente judicial bates',
      'como poner bates a un pdf',
      'numeracion bates legal',
    ],
    blufDefinition:
      'La numeración Bates es un sistema de indexación y foliado alfanumérico secuencial utilizado en litigios judiciales, auditorías y acuerdos corporativos para identificar, rastrear y citar de forma unívoca cada página individual dentro de un expediente probatorio.',
    standardReference: 'Federal Rules of Civil Procedure (FRCP Rule 34) & ISO 32000-1',
    fullExplanation:
      'Inventada a finales del siglo XIX por Edwin G. Bates como un dispositivo mecánico de sellado, la numeración Bates se convirtió en el estándar mundial en el descubrimiento probatorio digital (e-Discovery). En el formato PDF digital, el sellado Bates inserta un identificador persistente (típicamente compuesto por un prefijo alfanumérico identificador del caso, seguido de ceros a la izquierda y un número consecutivo, por ejemplo: `EXP-2026-000042`) en márgenes prefijados sin alterar el flujo tipográfico ni los hipervínculos del documento original.',
    specifications: [
      { label: 'Estructura habitual', value: '[Prefijo del Caso]-[Número con relleno de ceros]' },
      { label: 'Posición estándar', value: 'Esquina inferior derecha o margen superior derecho' },
      {
        label: 'Tipografía recomendada',
        value: 'Monospace o Sans-Serif nítida (Helvetica, Arial, Courier)',
      },
      {
        label: 'Impacto en el objeto PDF',
        value: 'Inserción vectorial directa en el stream de contenido de página',
      },
    ],
    practicalApplication: {
      title: 'Aplicaciones Prácticas de la Numeración Bates',
      description:
        'El foliado Bates es un requerimiento obligatorio en la mayoría de juzgados, tribunales de arbitraje y firmas de auditoría internacionales.',
      useCases: [
        'Presentación de expedientes de prueba en juicios civiles, penales y contenciosos.',
        'Auditorías fiscales y requerimientos de inspección tributaria.',
        'Procesos de Due Diligence en fusiones y adquisiciones (M&A).',
        'Organización de historiales médicos hospitalarios para peritajes judiciales.',
      ],
    },
    commonPitfalls: [
      'Usar numeración básica de página (1, 2, 3) en lugar de formato continuo que prevenga la interpolación de pruebas.',
      'Superponer el sello Bates sobre firmas, sellos notariales o texto legal existente por no configurar márgenes de seguridad.',
    ],
    faqs: [
      {
        q: '¿En qué se diferencia la numeración Bates de la numeración de páginas normal?',
        a: 'La numeración normal solo indica la secuencia de lectura dentro de un documento (Página 1 de 10). La numeración Bates proporciona una huella jurídica única y continua a través de múltiples documentos independientes (por ejemplo, si unes 5 PDFs de 20 páginas, Bates asigna folios del 0001 al 0100 sin reiniciar el conteo).',
      },
      {
        q: '¿Se puede aplicar numeración Bates a un PDF escaneado?',
        a: 'Sí. En PDFBlack puedes importar documentos escaneados o vectoriales; el sello Bates se incrusta como una capa vectorial limpia superpuesta en las coordenadas exactas elegidas.',
      },
    ],
    relatedTool: {
      name: 'Foliar PDF (Numeración Bates)',
      slug: 'foliar',
      path: '/editar/foliar',
      desc: 'Inserta prefijos, sufijos y números Bates correlativos en tus expedientes en tu navegador.',
    },
    relatedTerms: ['cifrado-aes-256-pdf', 'censura-binaria-pdf'],
  },
  'pdf-a-vs-pdf-estandar': {
    slug: 'pdf-a-vs-pdf-estandar',
    slugEn: 'pdf-a-vs-standard-pdf',
    term: 'PDF/A vs PDF Estándar (Preservación Digital a Largo Plazo)',
    termEn: 'PDF/A vs Standard PDF',
    category: 'estandares',
    categoryLabel: 'Estándares Internacionales ISO',
    badge: 'NORMA ISO 19005',
    metaTitle: 'PDF/A vs PDF Estándar: Diferencias, Niveles y Requisitos ISO | PDFBlack',
    metaDescription:
      'Diferencias técnicas entre formato PDF/A y PDF estándar. Conoce los perfiles PDF/A-1b, PDF/A-2b, qué elementos están prohibidos y cómo cumplir con archivos legales permanentes.',
    keywords: [
      'pdf a vs pdf',
      'diferencias pdf a y pdf',
      'que es pdf a',
      'formato pdf a largo plazo',
      'iso 19005',
      'pdf a 1b pdf a 2b',
    ],
    blufDefinition:
      'PDF/A es un subconjunto estrictamente estandarizado de PDF (ISO 19005) diseñado específicamente para el archivo digital a largo plazo. Prohíbe elementos que dependen de software externo —como fuentes no incrustadas, cifrado y JavaScript— asegurando que el archivo se renderice exactamente igual dentro de décadas.',
    standardReference:
      'ISO 19005-1:2005 (PDF/A-1), ISO 19005-2:2011 (PDF/A-2), ISO 19005-3:2012 (PDF/A-3)',
    fullExplanation:
      'Un PDF convencional prioriza la flexibilidad interactiva: puede contener código JavaScript dinámico, enlaces a fuentes tipográficas instaladas en el sistema del usuario, audio, vídeo y algoritmos de compresión propietarios. Con el paso de los años, si esas fuentes desaparecen o el visor ya no soporta un plugin, el documento se desconfigura. PDF/A soluciona este problema forzando la incrustación del 100% de las fuentes tipográficas, metadatos estructurados en XMP y perfiles de color ICC calibrados, garantizando la reproducibilidad visual infinita.',
    specifications: [
      {
        label: 'Incrustación de fuentes',
        value: 'Obligatoria al 100% (todas las fuentes y glifos deben estar dentro del archivo)',
      },
      { label: 'JavaScript y código ejecutable', value: 'Estrictamente prohibido' },
      {
        label: 'Cifrado y contraseñas',
        value: 'No permitido (impide la preservación automática de archivos)',
      },
      {
        label: 'Espacios de color',
        value: 'Obligatoriamente definidos mediante perfiles ICC independientes de dispositivo',
      },
    ],
    practicalApplication: {
      title: '¿Cuándo es obligatorio el uso de PDF/A?',
      description:
        'Gobiernos e instituciones públicas exigen PDF/A como único formato válido para la conservación documental.',
      useCases: [
        'Registro en sedes electrónicas de la administración pública y boletines oficiales del estado.',
        'Depósito de tesis doctorales y publicaciones académicas en repositorios universitarios.',
        'Conservación de escrituras notariales y asientos de registros de la propiedad.',
        'Archivo histórico de planos arquitectónicos e ingeniería civil.',
      ],
    },
    commonPitfalls: [
      'Guardar un documento con contraseñas de protección y esperar que cumpla la norma PDF/A (el cifrado invalida el estándar).',
      'Utilizar fuentes tipográficas con licencias propietarias que prohíben su incrustación en el archivo.',
    ],
    faqs: [
      {
        q: '¿Qué significa la letra en PDF/A (ej. PDF/A-1b vs PDF/A-1a)?',
        a: 'La "b" significa "Basic" (garantiza únicamente la fidelidad visual idéntica). La "a" significa "Accessible" (además de la fidelidad visual, exige etiquetado semántico del orden de lectura para lectores de pantalla de personas con discapacidad visual).',
      },
      {
        q: '¿Puedo convertir un archivo Word o PDF escaneado a un formato preservable?',
        a: 'Sí. Al convertir Word a PDF o aplicar OCR a un escaneo en PDFBlack, las fuentes tipográficas y capas de texto se incrustan como vectores limpios en el cuerpo del documento.',
      },
    ],
    relatedTool: {
      name: 'Convertir Word a PDF',
      slug: 'word-pdf',
      path: '/convertir/word-pdf',
      desc: 'Genera documentos vectoriales con tipografía incrustada conforme a estándares de fidelidad.',
    },
    relatedTerms: ['numeracion-bates', 'cifrado-aes-256-pdf'],
  },
  'cifrado-aes-256-pdf': {
    slug: 'cifrado-aes-256-pdf',
    slugEn: 'aes-256-pdf-encryption',
    term: 'Cifrado AES-256 en PDF (Seguridad Criptográfica)',
    termEn: 'AES-256 PDF Encryption',
    category: 'seguridad',
    categoryLabel: 'Criptografía y Ciberseguridad',
    badge: 'ESTÁNDAR MILITAR & ISO 32000-2',
    metaTitle: 'Cifrado AES-256 en PDF: Qué es y Cómo Protege tus Documentos | PDFBlack',
    metaDescription:
      'Aprende cómo funciona el cifrado simétrico AES de 256 bits en archivos PDF. Diferencias con algoritmos obsoletos (RC4 de 40 y 128 bits) y compatibilidad técnica.',
    keywords: [
      'cifrado aes 256 pdf',
      'encriptar pdf aes 256',
      'seguridad pdf cifrado',
      'diferencia aes y rc4 pdf',
      'contrasena militar pdf',
      'iso 32000 2 cifrado',
    ],
    blufDefinition:
      'El cifrado AES-256 en PDF es el estándar criptográfico más avanzado para proteger documentos (especificado en ISO 32000-2). Emplea una clave simétrica de 256 bits y 14 rondas de transformación matemática, haciendo computacionalmente inviable su descifrado mediante ataques de fuerza bruta.',
    standardReference: 'FIPS PUB 197 & ISO 32000-2:2020 (PDF 2.0 Encryption Handler Extension)',
    fullExplanation:
      'Durante las primeras versiones de la especificación PDF en los años 90, la seguridad se basaba en el algoritmo RC4 con claves débiles de 40 bits o 128 bits. Hoy en día, un ordenador convencional puede romper una clave RC4 en cuestión de minutos. La introducción del algoritmo AES (Advanced Encryption Standard) en modo CBC con claves de 256 bits transformó la seguridad documental: el número de combinaciones posibles es de 2^256 (aproximadamente 1.15 x 10^77), una cifra superior al número de átomos en el universo observable.',
    specifications: [
      { label: 'Longitud de clave', value: '256 bits (32 bytes)' },
      { label: 'Rondas de cifrado', value: '14 rondas de sustitución y permutación' },
      { label: 'Función de derivación de clave', value: 'SASLprep + SHA-256 con salt de 32 bytes' },
      {
        label: 'Compatibilidad de visores',
        value: 'Adobe Acrobat 9+, navegadores modernos y lectores ISO',
      },
    ],
    practicalApplication: {
      title: '¿Dónde se aplica el cifrado AES-256?',
      description:
        'Cualquier documento que contenga propiedad intelectual o secretos de negocio debe estar protegido bajo AES-256.',
      useCases: [
        'Protección de estados financieros y nóminas corporativas antes de su envío por correo.',
        'Cifrado de acuerdos de confidencialidad (NDA) y fórmulas de patentes industriales.',
        'Prevención de copia, modificación o impresión no autorizada en manuales y contratos.',
        'Transmisión de fichas médicas confidenciales con estricto cumplimiento de la ley HIPAA.',
      ],
    },
    commonPitfalls: [
      'Usar contraseñas cortas o predecibles como "123456", lo que permite ataques de diccionario a pesar de la solidez del algoritmo.',
      'Confiar en software desactualizado que utilice RC4 obsoleto etiquetándolo falsamente como "alta seguridad".',
    ],
    faqs: [
      {
        q: '¿Existe alguna diferencia entre la contraseña de apertura y la de permisos?',
        a: 'Sí. La contraseña de usuario (User Password) cifra la estructura binaria completa y se requiere obligatoriamente para abrir y visualizar el archivo. La contraseña de propietario (Owner Password) no impide la lectura, pero bloquea acciones específicas como copiar texto al portapapeles, imprimir en alta resolución o extraer páginas.',
      },
      {
        q: '¿PDFBlack sube mi contraseña o documento a algún servidor para cifrarlo?',
        a: 'Jamás. En PDFBlack el cifrado AES-256 se compila y ejecuta localmente en la memoria RAM de tu navegador mediante módulos de WebAssembly. Tu contraseña y tus archivos nunca tocan ningún servidor externo.',
      },
    ],
    relatedTool: {
      name: 'Proteger PDF con Contraseña',
      slug: 'proteger',
      path: '/optimizar/proteger',
      desc: 'Aplica cifrado militar AES-256 a tus archivos sin subirlos a la nube.',
    },
    relatedTerms: ['censura-binaria-pdf', 'procesamiento-zero-knowledge-pdf'],
  },
  'censura-binaria-pdf': {
    slug: 'censura-binaria-pdf',
    slugEn: 'binary-pdf-redaction',
    term: 'Censura Binaria en PDF (Sanitización Real vs Máscara Visual)',
    termEn: 'Binary PDF Redaction',
    category: 'seguridad',
    categoryLabel: 'Privacidad y Sanitización Forense',
    badge: 'SEGURIDAD FORENSE',
    metaTitle: 'Censura Binaria en PDF: Por Qué Dibujar Rectángulos Negros es Peligroso | PDFBlack',
    metaDescription:
      'Aprende qué es la censura binaria real en PDF. Conoce el peligro de las máscaras negras visuales que dejan el texto subyacente copiable y cómo sanitizar documentos.',
    keywords: [
      'censura binaria pdf',
      'redactar pdf que es',
      'quitar datos confidenciales pdf',
      'peligro rectangulo negro pdf',
      'sanitizar documento pdf',
    ],
    blufDefinition:
      'La censura binaria es el proceso forense de eliminar físicamente los flujos de texto, vectores e imágenes confidenciales del código fuente del PDF, reconstruyendo el árbol de objetos para que los datos censurados sean irrecuperables por cualquier técnica de extracción.',
    standardReference: 'NSA Document Redaction Best Practices & ISO 32000-1 (Section 14.8.4)',
    fullExplanation:
      'Uno de los errores más comunes y costosos en despachos legales y agencias gubernamentales consiste en "tapar" texto confidencial dibujando un rectángulo negro con un editor gráfico. A nivel visual el texto parece oculto, pero los bytes de texto subyacentes permanecen intactos en el flujo del PDF: cualquier persona puede seleccionarlo, copiarlo al portapapeles o extraerlo con scripts automáticos. La censura binaria real intercepta las coordenadas del área, suprime de raíz los glifos tipográficos y genera un nuevo flujo de página limpio.',
    specifications: [
      {
        label: 'Mecanismo de acción',
        value: 'Destrucción física de bytes en el stream de contenido de página',
      },
      {
        label: 'Metadatos asociados',
        value: 'Sanitización automática de propiedades XML/XMP, autor y fecha',
      },
      {
        label: 'Reversibilidad',
        value: 'Absolutamente irreversible (los datos no existen en el archivo descargado)',
      },
      {
        label: 'Resistencia a OCR',
        value: 'Imposible de recuperar mediante análisis de imagen o texto',
      },
    ],
    practicalApplication: {
      title: 'Casos Críticos de Censura Binaria',
      description:
        'Evita sanciones multimillonarias por violación de protección de datos personales y secretos de estado.',
      useCases: [
        'Ocultación de números de Seguridad Social, DNI y tarjetas bancarias en expedientes públicos.',
        'Protección de la identidad de testigos protegidos y menores en sentencias judiciales.',
        'Sanitización de contratos comerciales eliminando márgenes de ganancia y precios unitarios confidenciales.',
        'Anonimización de historiales clínicos para estudios epidemiológicos e investigación médica.',
      ],
    },
    commonPitfalls: [
      'Dibujar formas negras con herramientas de dibujo básicas de lectores PDF.',
      'Cambiar el color de la fuente tipográfica a blanco (el texto sigue siendo indexable y seleccionable).',
      'Olvidar eliminar los metadatos del documento donde a veces se duplica el nombre del autor o título sensible.',
    ],
    faqs: [
      {
        q: '¿Cómo puedo comprobar si una censura está bien hecha?',
        a: 'Abre el PDF en cualquier visor web, pulsa Ctrl+A (seleccionar todo) e intenta copiar y pegar el texto sobre el área censurada en el Bloc de Notas. Si el texto censurado aparece en el portapapeles, el documento fue ocultado visualmente y no censurado binariamente.',
      },
      {
        q: '¿PDFBlack elimina también los metadatos ocultos al censurar?',
        a: 'Sí. Al aplicar censura en PDFBlack, el motor sanitiza la estructura de objetos eliminando el historial de revisiones, metadatos XMP heredados y anotaciones ocultas.',
      },
    ],
    relatedTool: {
      name: 'Censurar PDF',
      slug: 'censurar',
      path: '/optimizar/censurar',
      desc: 'Elimina datos personales de forma permanente e irrecuperable en tu memoria RAM.',
    },
    relatedTerms: ['cifrado-aes-256-pdf', 'procesamiento-zero-knowledge-pdf'],
  },
  'ocr-reconocimiento-optico-pdf': {
    slug: 'ocr-reconocimiento-optico-pdf',
    slugEn: 'ocr-optical-character-recognition-pdf',
    term: 'OCR en PDF (Reconocimiento Óptico de Caracteres)',
    termEn: 'OCR (Optical Character Recognition) in PDF',
    category: 'tecnologia',
    categoryLabel: 'Inteligencia Artificial y Procesamiento de Imagen',
    badge: 'IA & VISIÓN COMPUTACIONAL',
    metaTitle: '¿Qué es el OCR en PDF? Cómo Funciona el Reconocimiento Óptico | PDFBlack',
    metaDescription:
      'Descubre qué es el OCR (Reconocimiento Óptico de Caracteres) en documentos PDF. Cómo transforma imágenes y escaneos en texto seleccionable y con capacidad de búsqueda.',
    keywords: [
      'que es ocr en pdf',
      'reconocimiento optico de caracteres',
      'hacer pdf buscable ocr',
      'como funciona el ocr',
      'tesseract wasm ocr',
      'convertir imagen pdf a texto',
    ],
    blufDefinition:
      'El OCR (Optical Character Recognition) es una tecnología que analiza imágenes digitales de texto dentro de un archivo PDF escaneado y las traduce en caracteres tipográficos reales, insertando una capa de texto invisible que permite buscar palabras, seleccionar y copiar contenido.',
    standardReference: 'ISO 32000-1 (Hidden Text Layer Specification)',
    fullExplanation:
      'Cuando escaneas un documento impreso o tomas una fotografía de un papel, el PDF resultante es simplemente un contenedor de mapa de bits (píxeles). Para el ordenador, no hay palabras ni letras, solo una imagen gráfica. El motor OCR procesa la imagen mediante algoritmos de visión por computadora y redes neuronales: detecta líneas de texto, segmenta palabras y reconoce los patrones geométricos de cada letra. Posteriormente, genera un "PDF de texto con capacidad de búsqueda" (*Searchable PDF*), conservando la imagen escaneada original en primer plano mientras posiciona el texto reconocido exactamente detrás de cada palabra.',
    specifications: [
      {
        label: 'Estructura técnica',
        value:
          'Imagen original en plano frontal + Capa de texto invisible con modo de renderizado 3 (Text Rendering Mode 3)',
      },
      {
        label: 'Resolución recomendada',
        value: '300 DPI en escala de grises o color para máxima precisión',
      },
      {
        label: 'Motor utilizado',
        value: 'Tesseract v5 compilado a WebAssembly (WASM) para ejecución local',
      },
      {
        label: 'Compatibilidad de búsqueda',
        value: 'Totalmente indexable por Google, Spotlight, Windows Search y visores PDF',
      },
    ],
    practicalApplication: {
      title: 'Beneficios y Casos de Uso del OCR',
      description:
        'Transforma montañas de papel físico en activos digitales vivos y localizables en milisegundos.',
      useCases: [
        'Digitalización de facturas en papel y recibos para su procesamiento contable automático.',
        'Búsqueda de palabras clave específicas (Ctrl + F) en libros y expedientes de cientos de páginas.',
        'Extracción de citas y fragmentos textuales de documentos escaneados sin tener que transcribirlos a mano.',
        'Cumplimiento con requisitos judiciales de entrega de documentos electrónicos indexables.',
      ],
    },
    commonPitfalls: [
      'Escanear con resolución inferior a 150 DPI, lo que degrada drásticamente la tasa de acierto del motor OCR.',
      'Documentos con inclinación excesiva (sesgo) sin aplicar previamente una normalización de rotación.',
    ],
    faqs: [
      {
        q: '¿Por qué mi PDF escaneado no me deja buscar palabras con Ctrl + F?',
        a: 'Porque tu PDF solo contiene una fotografía de las hojas y no tiene incrustada una capa de texto digital. Para solucionarlo, debes pasar el documento por la herramienta de OCR para que reconozca los caracteres y cree la capa de búsqueda.',
      },
      {
        q: '¿El OCR de PDFBlack envía mis documentos escaneados a servidores de IA en la nube?',
        a: 'No. El modelo de reconocimiento de PDFBlack corre 100% en tu navegador a través de WebAssembly. Las imágenes de tus documentos nunca viajan por internet.',
      },
    ],
    relatedTool: {
      name: 'OCR PDF en Línea',
      slug: 'ocr',
      path: '/editar/ocr',
      desc: 'Convierte tus documentos escaneados en texto seleccionable y buscable sin subir archivos.',
    },
    relatedTerms: ['numeracion-bates', 'pdf-a-vs-pdf-estandar'],
  },
  'procesamiento-zero-knowledge-pdf': {
    slug: 'procesamiento-zero-knowledge-pdf',
    slugEn: 'zero-knowledge-pdf-processing',
    term: 'Procesamiento Zero-Knowledge en PDF (Arquitectura sin Servidor)',
    termEn: 'Zero-Knowledge PDF Processing',
    category: 'tecnologia',
    categoryLabel: 'Arquitectura de Software y Privacidad',
    badge: 'ARQUITECTURA DE PRIVACIDAD PURA',
    metaTitle: '¿Qué es el Procesamiento Zero-Knowledge en PDF? | PDFBlack',
    metaDescription:
      'Conoce qué es la arquitectura Zero-Knowledge aplicada a la manipulación de documentos PDF. Cómo la computación cliente en WebAssembly garantiza privacidad matemática total.',
    keywords: [
      'procesamiento zero knowledge pdf',
      'zero knowledge arquitectura',
      'procesamiento en cliente wasm',
      'editor pdf sin servidores',
      'privacidad matematica pdf',
      'webassembly pdf local',
    ],
    blufDefinition:
      'El procesamiento Zero-Knowledge en software documental es un paradigma de diseño arquitectónico donde todas las operaciones sobre el archivo se ejecutan exclusivamente en el hardware local del usuario (navegador WebAssembly), de modo que los servidores del proveedor jamás conocen, reciben ni procesan el contenido de los documentos.',
    standardReference: 'Privacy by Design (GDPR Article 25) & W3C WebAssembly Standard',
    fullExplanation:
      'En la arquitectura web tradicional "en la nube", cuando el usuario pulsa "comprimir" o "unir", el archivo viaja a través de internet hasta un servidor remoto, se procesa en el centro de datos del proveedor y se envía de vuelta. Durante este proceso, el proveedor tiene acceso técnico al documento. Por el contrario, la arquitectura Zero-Knowledge adoptada por PDFBlack descarga los binarios de cómputo compilados en WebAssembly al navegador del usuario una sola vez. A partir de ese momento, la memoria RAM y el procesador de tu dispositivo realizan todo el trabajo matemático. Al no haber paquetes de red con el contenido de tus archivos, el proveedor tiene literalmente "cero conocimiento" de tus documentos.',
    specifications: [
      {
        label: 'Peticiones de red con datos del PDF',
        value: '0 peticiones HTTP (comprobable en F12 Network)',
      },
      {
        label: 'Entorno de ejecución',
        value: 'Memoria RAM volátil y Web Workers aislados del navegador',
      },
      { label: 'Persistencia en disco del servidor', value: '0 bytes (no se almacena nada)' },
      {
        label: 'Cumplimiento normativo',
        value: 'Cumplimiento automático con RGPD, CCPA, HIPAA y secreto profesional',
      },
    ],
    practicalApplication: {
      title: 'Importancia en el Ecosistema Corporativo Moderno',
      description: 'La única garantía real de seguridad es no entregar la información a terceros.',
      useCases: [
        'Trabajo con secretos comerciales y propiedad intelectual protegida por acuerdos de confidencialidad estrictos.',
        'Manejo de nóminas de empleados y registros contables sin requerir contratos de encargo de tratamiento de datos (DPA).',
        'Operaciones documentales en organizaciones militares, de defensa o gubernamentales con políticas de cero nube.',
      ],
    },
    commonPitfalls: [
      'Confundir "conexión HTTPS" con "privacidad Zero-Knowledge": HTTPS protege el tránsito de la información, pero el servidor remoto sigue recibiendo y pudiendo leer el archivo. Zero-Knowledge no envía el archivo en primer lugar.',
    ],
    faqs: [
      {
        q: '¿Cómo puedo demostrar a mi departamento de seguridad que PDFBlack es Zero-Knowledge?',
        a: 'Abre las herramientas de desarrollo de tu navegador (tecla F12), dirígete a la pestaña "Red" (Network) y procesa cualquier documento. Comprobarás que se realizan cero llamadas HTTP hacia servidores con el contenido de tu PDF. Toda la actividad es interna en la memoria de tu equipo.',
      },
      {
        q: '¿Funciona si no tengo conexión a internet?',
        a: 'Sí. Una vez cargada la página en el navegador, el código de WebAssembly queda en la caché local y puedes seguir manipulando PDFs incluso sin internet o en modo avión.',
      },
    ],
    relatedTool: {
      name: 'Política de Privacidad y Arquitectura',
      slug: 'privacidad',
      path: '/privacidad',
      desc: 'Conoce los fundamentos técnicos de nuestra arquitectura sin almacenamiento.',
    },
    relatedTerms: ['cifrado-aes-256-pdf', 'censura-binaria-pdf'],
  },
};

export const GLOSSARY_TERMS_EN: Record<string, GlossaryTerm> = {
  'bates-numbering': {
    slug: 'numeracion-bates',
    slugEn: 'bates-numbering',
    term: 'Bates Numbering (Legal Indexing & Stamping)',
    termEn: 'Bates Numbering',
    category: 'legal',
    categoryLabel: 'Legal Practice & Litigation',
    badge: 'JUDICIAL LITIGATION STANDARD',
    metaTitle: 'What is Bates Numbering in PDF? Technical & Legal Guide | PDFBlack',
    metaDescription:
      'Learn what Bates Numbering is in PDF documents, how it is structured in judicial litigation, and how to stamp court files with alphanumeric prefixes 100% privately.',
    keywords: [
      'what is bates numbering',
      'bates numbering pdf',
      'bates stamping definition',
      'how to bates stamp a pdf',
      'legal bates numbering',
      'ediscovery bates numbering',
    ],
    blufDefinition:
      'Bates numbering is a sequential alphanumeric indexing and labeling system used in legal proceedings, government investigations, and corporate audits to uniquely identify, retrieve, and cross-reference individual pages across large document productions.',
    standardReference: 'Federal Rules of Civil Procedure (FRCP Rule 34) & ISO 32000-1',
    fullExplanation:
      'Patented in the late 19th century by Edwin G. Bates as a mechanical stamping device, Bates numbering has evolved into the cornerstone standard for electronic discovery (e-Discovery). In digital PDF document management, Bates stamping embeds a permanent, sequential alphanumeric identifier (typically consisting of an alphanumeric case prefix, padded zeroes, and a continuous integer, such as `CASE-2026-000042`) onto predetermined page margins without displacing existing vectors or typography.',
    specifications: [
      { label: 'Standard Structure', value: '[Matter Prefix]-[Zero-padded sequential integer]' },
      { label: 'Preferred Placement', value: 'Bottom-right footer or top-right header' },
      {
        label: 'Recommended Fonts',
        value: 'Crisp Monospace or Sans-Serif (Courier, Helvetica, Arial)',
      },
      { label: 'PDF Object Impact', value: 'Direct vector overlay in page content stream' },
    ],
    practicalApplication: {
      title: 'Practical Applications of Bates Stamping',
      description:
        'Bates numbering is a mandatory procedural requirement across civil and criminal litigation filings.',
      useCases: [
        'Organizing evidence exhibits and trial binders for court filings.',
        'Regulatory audits and responses to grand jury subpoenas.',
        'Due diligence document indexing in corporate mergers and acquisitions (M&A).',
        'Hospital patient chart sequencing for forensic medical review.',
      ],
    },
    commonPitfalls: [
      'Using standard page numbers (1, 2, 3) instead of continuous production numbering, leaving gaps vulnerable to tampering.',
      'Placing stamps over existing notary seals, signatures, or barcode zones due to inadequate margin safety buffers.',
    ],
    faqs: [
      {
        q: 'How does Bates numbering differ from standard page numbering?',
        a: 'Standard page numbers simply indicate reading order inside an isolated file (e.g., Page 1 of 10). Bates numbering creates a unified, immutable identification index across hundreds of disparate PDF files produced in discovery without resetting back to page 1 for each new document.',
      },
      {
        q: 'Can Bates numbering be applied to scanned PDF files?',
        a: 'Yes. In PDFBlack you can import scanned bitmaps or vector documents; the Bates stamp is rendered as a clean, high-resolution vector layer at exact coordinates.',
      },
    ],
    relatedTool: {
      name: 'Bates Numbering (PDF Page Numbering)',
      slug: 'bates-numbering',
      path: '/en/bates-numbering',
      desc: 'Apply custom alphanumeric prefixes and sequential Bates stamps directly in your browser.',
    },
    relatedTerms: ['aes-256-pdf-encryption', 'binary-pdf-redaction'],
  },
  'pdf-a-vs-standard-pdf': {
    slug: 'pdf-a-vs-pdf-estandar',
    slugEn: 'pdf-a-vs-standard-pdf',
    term: 'PDF/A vs Standard PDF (Long-Term Archival)',
    termEn: 'PDF/A vs Standard PDF',
    category: 'estandares',
    categoryLabel: 'ISO International Standards',
    badge: 'ISO 19005 STANDARD',
    metaTitle: 'PDF/A vs Standard PDF: Differences, Conformance & ISO Specs | PDFBlack',
    metaDescription:
      'Learn the technical differences between PDF/A and standard PDF. Discover PDF/A-1b and PDF/A-2b profiles, prohibited features, and long-term digital preservation standards.',
    keywords: [
      'pdf a vs standard pdf',
      'what is pdf a',
      'difference between pdf and pdf a',
      'pdf long term archival',
      'iso 19005 pdf a',
      'pdf a 1b vs pdf a 2b',
    ],
    blufDefinition:
      'PDF/A is a standardized subset of the PDF format (ISO 19005) tailored specifically for long-term digital preservation. It completely prohibits features that depend on external resources —such as unembedded fonts, encryption, and JavaScript— ensuring the file renders identically decades into the future.',
    standardReference:
      'ISO 19005-1:2005 (PDF/A-1), ISO 19005-2:2011 (PDF/A-2), ISO 19005-3:2012 (PDF/A-3)',
    fullExplanation:
      'Standard PDF prioritizes dynamic presentation: it can contain executable JavaScript code, links to external fonts hosted on the user operating system, sound clips, and proprietary image compressions. Over time, when those external fonts vanish or browser readers discontinue legacy plugins, the layout breaks. PDF/A eliminates this obsolescence vulnerability by mandating 100% font embedding, device-independent ICC color profiles, and structured XMP metadata, guaranteeing exact visual reproducibility indefinitely.',
    specifications: [
      {
        label: 'Font Embedding',
        value: '100% mandatory (all glyphs and metrics must be internal)',
      },
      { label: 'JavaScript & Dynamic Code', value: 'Strictly forbidden' },
      {
        label: 'Password Encryption',
        value: 'Not permitted (prevents automated long-term archiving)',
      },
      { label: 'Color Management', value: 'Mandatory device-independent ICC output intents' },
    ],
    practicalApplication: {
      title: 'When is PDF/A Required?',
      description:
        'Government archives and enterprise compliance standards specify PDF/A as the sole acceptable format.',
      useCases: [
        'Submission of official filings to court portals and national government registries.',
        'Academic dissertation archiving in institutional university repositories.',
        'Permanent deed storage in public land and title registries.',
        'Long-term engineering blueprints and patent application repositories.',
      ],
    },
    commonPitfalls: [
      'Adding passwords to a PDF and expecting it to satisfy PDF/A conformance (encryption explicitly violates the standard).',
      'Utilizing proprietary commercial fonts with license flags that block binary embedding.',
    ],
    faqs: [
      {
        q: 'What do the letters in PDF/A mean (e.g., PDF/A-1b vs PDF/A-1a)?',
        a: 'The "b" suffix stands for "Basic" conformance, ensuring exact visual page appearance over time. The "a" suffix stands for "Accessible", additionally requiring structural tags and logical reading order to assist screen readers used by visually impaired individuals.',
      },
      {
        q: 'Can I convert Word documents or scanned files to archival standards?',
        a: 'Yes. Converting Word to PDF or applying OCR in PDFBlack produces clean vector typography that embeds all character sets permanently.',
      },
    ],
    relatedTool: {
      name: 'Convert Word to PDF',
      slug: 'word-to-pdf',
      path: '/en/word-to-pdf',
      desc: 'Create high-resolution vector PDF files preserving embedded fonts and formatting.',
    },
    relatedTerms: ['bates-numbering', 'aes-256-pdf-encryption'],
  },
  'aes-256-pdf-encryption': {
    slug: 'cifrado-aes-256-pdf',
    slugEn: 'aes-256-pdf-encryption',
    term: 'AES-256 PDF Encryption (Cryptographic Security)',
    termEn: 'AES-256 PDF Encryption',
    category: 'seguridad',
    categoryLabel: 'Cryptography & Cybersecurity',
    badge: 'MILITARY GRADE & ISO 32000-2',
    metaTitle: 'AES-256 PDF Encryption: How It Works & Protects Your Files | PDFBlack',
    metaDescription:
      'Discover how 256-bit AES encryption protects PDF documents. Understand the vulnerabilities of legacy RC4 ciphers, key derivation, and ISO 32000-2 security.',
    keywords: [
      'aes 256 pdf encryption',
      'encrypt pdf aes 256',
      'pdf password security',
      'rc4 vs aes pdf',
      'military grade pdf encryption',
      'iso 32000 2 security',
    ],
    blufDefinition:
      'AES-256 PDF encryption is the modern cryptographic standard for securing documents (specified in ISO 32000-2). Utilizing a 256-bit symmetric cipher and 14 rounds of mathematical transformation, it renders brute-force decryption mathematically impossible with modern computational power.',
    standardReference: 'FIPS PUB 197 & ISO 32000-2:2020 (PDF 2.0 Encryption Handler)',
    fullExplanation:
      'Early PDF versions in the 1990s utilized RC4 stream ciphers with 40-bit or 128-bit keys, which modern laptops can crack in minutes using rainbow tables and brute force. The adoption of the Advanced Encryption Standard (AES) in Cipher Block Chaining (CBC) mode with 256-bit keys revolutionized document security: the total number of unique keys is 2^256 (roughly 1.15 x 10^77), which exceeds the estimated number of atoms in the observable universe.',
    specifications: [
      { label: 'Key Length', value: '256 bits (32 bytes)' },
      { label: 'Cipher Rounds', value: '14 rounds of substitution and byte mixing' },
      {
        label: 'Key Derivation Function',
        value: 'SASLprep + SHA-256 with 32-byte cryptographic salt',
      },
      {
        label: 'Reader Compatibility',
        value: 'Adobe Acrobat 9+, modern web browsers, and ISO compliant viewers',
      },
    ],
    practicalApplication: {
      title: 'Where is AES-256 Required?',
      description:
        'Any document containing proprietary intellectual property or regulatory data must utilize AES-256.',
      useCases: [
        'Protecting corporate financial statements and payroll ledgers prior to email transmission.',
        'Safeguarding Non-Disclosure Agreements (NDAs) and patent blueprints.',
        'Restricting unauthorized printing, page extraction, or text copying in contract drafts.',
        'Encrypting sensitive patient records in strict adherence to HIPAA and GDPR standards.',
      ],
    },
    commonPitfalls: [
      'Using short or dictionary-based passwords (e.g., "password123"), which succumb to dictionary attacks regardless of cipher strength.',
      'Relying on legacy tools that secretly use deprecated RC4 ciphers while labeling them "secure".',
    ],
    faqs: [
      {
        q: 'What is the difference between User and Owner passwords?',
        a: 'The User Password (Open Password) encrypts the underlying binary stream and is mandatory to open and view the document. The Owner Password (Permissions Password) allows reading but restricts operational privileges such as high-resolution printing, copying text to the clipboard, or annotating.',
      },
      {
        q: 'Does PDFBlack send my password or file to a server for encryption?',
        a: 'Never. In PDFBlack, AES-256 encryption executes entirely on your device via client-side WebAssembly modules. Your passphrase and file never leave your local RAM.',
      },
    ],
    relatedTool: {
      name: 'Protect PDF with Password',
      slug: 'protect-pdf',
      path: '/en/protect-pdf',
      desc: 'Apply military-grade AES-256 encryption to your PDF files privately in your browser.',
    },
    relatedTerms: ['binary-pdf-redaction', 'zero-knowledge-pdf-processing'],
  },
  'binary-pdf-redaction': {
    slug: 'censura-binaria-pdf',
    slugEn: 'binary-pdf-redaction',
    term: 'Binary PDF Redaction (Forensic Sanitization vs Visual Masking)',
    termEn: 'Binary PDF Redaction',
    category: 'seguridad',
    categoryLabel: 'Privacy & Forensic Sanitization',
    badge: 'FORENSIC PRIVACY',
    metaTitle: 'Binary PDF Redaction: Why Black Rectangle Overlays Fail | PDFBlack',
    metaDescription:
      'Learn what true binary PDF redaction is. Discover why drawing black boxes leaves sensitive text copyable, and how forensic sanitization purges data permanently.',
    keywords: [
      'binary pdf redaction',
      'how to redact pdf safely',
      'black box pdf failure',
      'sanitize confidential pdf',
      'permanent pdf redaction',
      'nsa pdf redaction guidelines',
    ],
    blufDefinition:
      'Binary PDF redaction is the forensic process of physically excising confidential text streams, vector paths, and bitmap pixels from a PDF internal object tree, ensuring that redacted information is mathematically unrecoverable by any clipboard or extraction tool.',
    standardReference: 'NSA Redaction Guidelines & ISO 32000-1 (Section 14.8.4)',
    fullExplanation:
      'One of the most dangerous and frequent data breaches in law firms and government agencies occurs when staff "redact" sensitive text by drawing a visual black rectangle on top of it. In the PDF file structure, visual annotations exist on a separate overlay layer while the underlying character codes remain fully intact in the content stream. Anyone can highlight the black box, copy the underlying text, and paste it into Notepad. True binary redaction identifies the coordinate bounding box, purges the character tokens, and recalculates the page object streams.',
    specifications: [
      { label: 'Mechanism', value: 'Physical removal of byte tokens from the page content stream' },
      {
        label: 'Metadata Handling',
        value: 'Automatic sanitization of XMP metadata, author history, and bookmarks',
      },
      {
        label: 'Reversibility',
        value: 'Strictly irreversible (the underlying bytes no longer exist)',
      },
      { label: 'OCR Immunity', value: 'Unrecoverable by visual OCR or text extraction scripts' },
    ],
    practicalApplication: {
      title: 'Critical Redaction Scenarios',
      description:
        'Prevent catastrophic data leaks and regulatory penalties under GDPR, CCPA, and court protective orders.',
      useCases: [
        'Sanitizing Social Security Numbers, dates of birth, and home addresses from public court records.',
        'Redacting proprietary pricing schedules and profit margins from commercial vendor bids.',
        'Protecting confidential informant and juvenile identities in public prosecution records.',
        'Anonymizing clinical trial records for scientific research publications.',
      ],
    },
    commonPitfalls: [
      'Using basic PDF viewer drawing tools to cover text with black shapes or highlighter pens.',
      'Changing text font color to white (the text stream remains selectable and indexed by search engines).',
      'Neglecting document metadata where sensitive titles or authors are often duplicated.',
    ],
    faqs: [
      {
        q: 'How can I test if a PDF is properly redacted?',
        a: 'Open the document in any reader, press Ctrl+A (Select All), copy the content, and paste it into a plain text editor. If the confidential words appear, the document was merely covered with a visual shape and not forensically redacted.',
      },
      {
        q: 'Does PDFBlack eliminate hidden metadata when redacting?',
        a: 'Yes. PDFBlack redaction engine sanitizes the file structure, purging embedded metadata streams, document info dictionaries, and hidden revision histories.',
      },
    ],
    relatedTool: {
      name: 'Redact PDF Online',
      slug: 'redact-pdf',
      path: '/en/redact-pdf',
      desc: 'Permanently remove sensitive text and graphics directly in browser memory.',
    },
    relatedTerms: ['aes-256-pdf-encryption', 'zero-knowledge-pdf-processing'],
  },
  'ocr-optical-character-recognition-pdf': {
    slug: 'ocr-reconocimiento-optico-pdf',
    slugEn: 'ocr-optical-character-recognition-pdf',
    term: 'OCR in PDF (Optical Character Recognition)',
    termEn: 'OCR (Optical Character Recognition) in PDF',
    category: 'tecnologia',
    categoryLabel: 'Computer Vision & AI',
    badge: 'COMPUTER VISION & AI',
    metaTitle: 'What is OCR in PDF? Optical Character Recognition Explained | PDFBlack',
    metaDescription:
      'Understand how OCR works in PDF files. Discover how computer vision turns scanned paper images into fully searchable, selectable, and editable digital text.',
    keywords: [
      'what is ocr in pdf',
      'optical character recognition pdf',
      'searchable pdf ocr',
      'tesseract wasm ocr',
      'how ocr works',
      'convert scanned pdf to text',
    ],
    blufDefinition:
      'OCR (Optical Character Recognition) is a computer vision technology that analyzes visual pixel patterns of text inside scanned PDF images and translates them into machine-readable digital characters, generating an invisible text layer that enables search, copy, and indexing.',
    standardReference: 'ISO 32000-1 (Hidden Text Layer & Text Rendering Mode 3)',
    fullExplanation:
      'When you scan a physical paper document or photograph a contract with your phone, the generated PDF is simply a container holding a flat bitmap image. To a computer, there are no words or paragraphs, just a grid of colored pixels. An OCR engine processes this image through image binarization, line segmentation, and deep learning character recognition. It then creates a "Searchable PDF" (*PDF with hidden text layer*), leaving the original scanned image visible in the foreground while placing the recognized characters in exact alignment directly behind it.',
    specifications: [
      {
        label: 'Technical Layout',
        value: 'Scanned bitmap foreground + Invisible text layer with Text Rendering Mode 3',
      },
      {
        label: 'Recommended Resolution',
        value: '300 DPI in grayscale or color for optimal character recognition',
      },
      {
        label: 'Engine Architecture',
        value: 'Tesseract v5 compiled to WebAssembly (WASM) for local browser execution',
      },
      {
        label: 'Search Compatibility',
        value: 'Fully indexable by Google, Windows Search, macOS Spotlight, and PDF readers',
      },
    ],
    practicalApplication: {
      title: 'Benefits and Key Use Cases of OCR',
      description:
        'Transform static paper archives into living, searchable digital knowledge repositories.',
      useCases: [
        'Digitizing paper vendor invoices and receipts for automated accounting extraction.',
        'Searching specific legal precedents (Ctrl + F) across multi-hundred-page court archives.',
        'Extracting quotes and tables from historical books and papers without manual retyping.',
        'Satisfying court requirements for electronic searchable document submissions.',
      ],
    },
    commonPitfalls: [
      'Scanning documents below 150 DPI, which drastically degrades optical character detection rates.',
      'Processing crooked or skewed documents without prior orientation deskewing.',
    ],
    faqs: [
      {
        q: 'Why can I not search for words with Ctrl + F in my scanned PDF?',
        a: 'Because your file contains only a flat image of the pages and lacks an embedded digital text layer. Running the file through an OCR tool recognizes the characters and injects the required searchable layer.',
      },
      {
        q: 'Does PDFBlack OCR upload my scanned documents to cloud servers?',
        a: 'No. PDFBlack OCR engine runs 100% inside your local browser tab powered by WebAssembly. Your scanned images never travel across the internet.',
      },
    ],
    relatedTool: {
      name: 'OCR PDF Online',
      slug: 'ocr-pdf',
      path: '/en/ocr-pdf',
      desc: 'Convert scanned PDF documents into searchable, selectable text without uploading files.',
    },
    relatedTerms: ['bates-numbering', 'pdf-a-vs-standard-pdf'],
  },
  'zero-knowledge-pdf-processing': {
    slug: 'procesamiento-zero-knowledge-pdf',
    slugEn: 'zero-knowledge-pdf-processing',
    term: 'Zero-Knowledge PDF Processing (Client-Side Architecture)',
    termEn: 'Zero-Knowledge PDF Processing',
    category: 'tecnologia',
    categoryLabel: 'Software Architecture & Data Privacy',
    badge: 'ZERO-KNOWLEDGE ARCHITECTURE',
    metaTitle: 'What is Zero-Knowledge PDF Processing? | PDFBlack',
    metaDescription:
      'Learn what Zero-Knowledge architecture means in document processing. Discover how client-side WebAssembly computation guarantees absolute mathematical privacy.',
    keywords: [
      'zero knowledge pdf processing',
      'client side wasm pdf',
      'serverless pdf editor',
      'mathematical privacy pdf',
      'browser local pdf tools',
      'privacy by design pdf',
    ],
    blufDefinition:
      'Zero-Knowledge PDF processing is an architectural design paradigm where all document computations execute exclusively on the user local hardware (via in-browser WebAssembly), meaning the service provider servers never receive, store, or possess any knowledge of the file content.',
    standardReference: 'Privacy by Design (GDPR Article 25) & W3C WebAssembly Specification',
    fullExplanation:
      'In traditional cloud PDF editors, when you click "merge" or "compress", your confidential document travels over the internet to a third-party server, gets processed on their infrastructure, and downloads back to you. The provider technical team or rogue actors could potentially access the payload. In stark contrast, PDFBlack Zero-Knowledge architecture downloads precompiled WebAssembly binaries into your browser once. From that moment onward, your own CPU and RAM handle all PDF rendering and manipulation. With zero network requests bearing your file data, the service provider possesses mathematical zero knowledge of your documents.',
    specifications: [
      {
        label: 'Network File Requests',
        value: '0 HTTP payload requests (verifiable via F12 Network tab)',
      },
      {
        label: 'Runtime Environment',
        value: 'Local volatile RAM and isolated browser Web Workers',
      },
      { label: 'Server Disk Persistence', value: '0 bytes (no remote caching or storage)' },
      {
        label: 'Regulatory Compliance',
        value: 'Automatic compliance with GDPR, CCPA, HIPAA, and attorney-client privilege',
      },
    ],
    practicalApplication: {
      title: 'Significance for Modern Enterprise Security',
      description:
        'The only absolute guarantee of data security is never releasing data into third-party hands.',
      useCases: [
        'Processing trade secrets and proprietary intellectual property bound by strict NDAs.',
        'Managing employee payroll spreadsheets and financial audits without needing third-party Data Processing Agreements (DPAs).',
        'Document operations in military, defense, or governmental departments with strict zero-cloud policies.',
      ],
    },
    commonPitfalls: [
      'Confusing "HTTPS encryption" with "Zero-Knowledge": HTTPS only protects files while in transit; the remote server still receives and reads the document. Zero-Knowledge never sends the document in the first place.',
    ],
    faqs: [
      {
        q: 'How can I prove to our IT security department that PDFBlack is truly Zero-Knowledge?',
        a: 'Open your browser Developer Tools (F12 key), navigate to the "Network" tab, and process any document. You will see zero outbound HTTP POST or PUT requests carrying your file data. All execution occurs purely within local browser memory.',
      },
      {
        q: 'Does it work offline?',
        a: 'Yes. Once the web application is loaded into your browser cache, the WebAssembly engine remains available, allowing you to manipulate PDFs offline or in airplane mode.',
      },
    ],
    relatedTool: {
      name: 'Privacy Policy & Architecture',
      slug: 'privacy',
      path: '/en/privacy',
      desc: 'Explore the technical pillars of our zero-retention, zero-upload architecture.',
    },
    relatedTerms: ['aes-256-pdf-encryption', 'binary-pdf-redaction'],
  },
};

export const ALL_GLOSSARY_SLUGS_ES = Object.keys(GLOSSARY_TERMS_ES);
export const ALL_GLOSSARY_SLUGS_EN = Object.keys(GLOSSARY_TERMS_EN);

export function getGlossaryTerm(slug: string, lang: 'es' | 'en' = 'es'): GlossaryTerm | undefined {
  return lang === 'es' ? GLOSSARY_TERMS_ES[slug] : GLOSSARY_TERMS_EN[slug];
}

export function getAllGlossaryTerms(lang: 'es' | 'en' = 'es'): GlossaryTerm[] {
  return Object.values(lang === 'es' ? GLOSSARY_TERMS_ES : GLOSSARY_TERMS_EN);
}

export function getEquivalentGlossarySlug(slug: string, currentLang: 'es' | 'en'): string {
  if (currentLang === 'es') {
    const term = GLOSSARY_TERMS_ES[slug];
    return term ? term.slugEn : slug;
  } else {
    const match = Object.values(GLOSSARY_TERMS_ES).find((t) => t.slugEn === slug);
    return match ? match.slug : slug;
  }
}
