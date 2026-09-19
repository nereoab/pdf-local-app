export interface SpecificationItem {
  feature: string;
  value: string;
  note: string;
}

export interface HowToStep {
  step: number;
  title: string;
  desc: string;
}

export interface BenefitItem {
  title: string;
  desc: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface LongTailSolution {
  slug: string;
  category: 'optimizar' | 'editar' | 'convertir' | 'organizar';
  toolKey: string;
  badge: string;
  h1: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  parentPath: string;
  parentName: string;
  specifications: SpecificationItem[];
  steps: HowToStep[];
  benefits: BenefitItem[];
  faqs: FaqItem[];
  relatedSolutions: string[];
}

export const LONG_TAIL_SOLUTIONS: Record<string, LongTailSolution> = {
  'comprimir-pdf-a-200kb': {
    slug: 'comprimir-pdf-a-200kb',
    category: 'optimizar',
    toolKey: 'comprimir',
    badge: 'Límite Oficial para Trámites',
    h1: 'Comprimir PDF a 200 KB o menos — Gratis y 100% Privado',
    subtitle:
      'Reduce el tamaño de tu archivo PDF a menos de 200 KB para cumplir con los requisitos de mesas de partes, juzgados, convocatorias públicas (CAS) y trámites gubernamentales sin perder nitidez de texto ni firmas.',
    metaTitle: 'Comprimir PDF a 200 KB o menos Online Gratis | PDFBlack',
    metaDescription:
      'Reduce tu PDF a 200 KB o menos para juzgados, SUNAT, visas y convocatorias del Estado. 100% gratis, sin registro y procesado en tu navegador.',
    keywords: [
      'comprimir pdf a 200 kb',
      'comprimir pdf a 200kb',
      'reducir pdf a menos de 200 kb',
      'comprimir pdf para poder judicial',
      'comprimir pdf para convocatorias cas',
      'comprimir pdf a 200kb gratis',
    ],
    parentPath: '/optimizar/comprimir',
    parentName: 'Comprimir PDF',
    specifications: [
      {
        feature: 'Límite objetivo',
        value: '≤ 200 KB',
        note: 'Optimización selectiva de flujos y fuentes',
      },
      {
        feature: 'Privacidad',
        value: '100% Local (WASM)',
        note: 'Los archivos nunca se envían a la nube',
      },
      {
        feature: 'Legibilidad de texto',
        value: 'Vectorial intacta',
        note: 'Firmas y textos se mantienen nítidos',
      },
      {
        feature: 'Uso típico',
        value: 'Trámites oficiales',
        note: 'Mesas de partes, SUNAT, Poder Judicial, Visas',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Selecciona tu documento',
        desc: 'Arrastra tu archivo PDF pesado o selecciónalo desde tu dispositivo. No hay límite de tamaño inicial.',
      },
      {
        step: 2,
        title: 'Aplica la compresión óptima',
        desc: 'El motor WebAssembly analizará el documento y comprimirá imágenes y estructuras internas para aproximarse a los 200 KB.',
      },
      {
        step: 3,
        title: 'Descarga instantánea',
        desc: 'Descarga tu documento comprimido inmediatamente, listo para subir a cualquier plataforma oficial sin errores de peso.',
      },
    ],
    benefits: [
      {
        title: 'Sin filtración de datos personales',
        desc: 'Al procesarse en tu memoria RAM mediante WebAssembly, ningún extracto bancario o expediente judicial sale de tu equipo.',
      },
      {
        title: 'Aceptación garantizada en plataformas públicas',
        desc: 'El PDF resultante cumple los estándares ISO 32000-1 exigidos por las plataformas del Estado.',
      },
      {
        title: 'Sin límites de documentos diarios',
        desc: 'Comprime tantos archivos como necesites sin pantallas de cobro ni suscripciones.',
      },
    ],
    faqs: [
      {
        q: '¿Por qué tantas plataformas exigen que el PDF pese menos de 200 KB?',
        a: 'La mayoría de sistemas de gestión documental del Estado y juzgados tienen cuotas de almacenamiento estrictas por expediente para evitar saturar sus bases de datos.',
      },
      {
        q: '¿Se vuelven ilegibles las firmas y sellos al comprimir a 200 KB?',
        a: 'No. PDFBlack preserva la capa vectorial de textos y firmas, aplicando compresión inteligente únicamente en imágenes rasterizadas y metadatos innecesarios.',
      },
      {
        q: '¿Qué hago si mi PDF original tiene más de 100 páginas y no baja de 200 KB?',
        a: 'En documentos extremadamente largos, se recomienda usar primero nuestra herramienta de "Dividir PDF" para separar el expediente en tomos o anexos antes de comprimir.',
      },
    ],
    relatedSolutions: [
      'comprimir-pdf-a-100kb',
      'comprimir-pdf-a-1mb',
      'foliar-expediente-judicial',
    ],
  },

  'comprimir-pdf-a-1mb': {
    slug: 'comprimir-pdf-a-1mb',
    category: 'optimizar',
    toolKey: 'comprimir',
    badge: 'Estándar Universitario y Laboral',
    h1: 'Comprimir PDF a 1 MB o menos — Mantener Alta Calidad',
    subtitle:
      'Reduce archivos PDF voluminosos (tesis, portafolios, contratos extensos) a menos de 1 MB para enviarlos por correo electrónico, plataformas universitarias y portales de empleo sin degradar la nitidez.',
    metaTitle: 'Comprimir PDF a 1 MB Online Gratis sin Perder Calidad | PDFBlack',
    metaDescription:
      'Comprime PDFs grandes a 1 MB o menos manteniendo imágenes y textos nítidos. Ideal para tesis, currículums y correos. 100% privado en tu navegador.',
    keywords: [
      'comprimir pdf a 1 mb',
      'comprimir pdf a 1mb',
      'reducir pdf a 1 mega',
      'comprimir tesis a 1mb',
      'comprimir pdf para enviar por correo',
    ],
    parentPath: '/optimizar/comprimir',
    parentName: 'Comprimir PDF',
    specifications: [
      {
        feature: 'Límite objetivo',
        value: '≤ 1 MB',
        note: 'Balance perfecto entre peso y calidad',
      },
      {
        feature: 'Compresión de imágenes',
        value: 'Algoritmo JPEG/Flate adaptativo',
        note: 'Fotos y gráficos claros',
      },
      {
        feature: 'Tiempo de proceso',
        value: 'Instantáneo (< 2 s)',
        note: 'Motor local en WebAssembly',
      },
      { feature: 'Uso ideal', value: 'Tesis y CVs', note: 'Bolsas de empleo, Blackboard, Moodle' },
    ],
    steps: [
      {
        step: 1,
        title: 'Carga el documento pesado',
        desc: 'Arrastra el PDF (incluso de 50 MB o 100 MB). La lectura es inmediata en local.',
      },
      {
        step: 2,
        title: 'Compresión inteligente a 1 MB',
        desc: 'El algoritmo descarta redundancias estructurales preservando gráficos y tipografías.',
      },
      {
        step: 3,
        title: 'Guarda y comparte',
        desc: 'Obtén tu PDF de menos de 1 MB listo para adjuntar en Gmail o subir a tu universidad.',
      },
    ],
    benefits: [
      {
        title: 'Envío sin rebotes por correo',
        desc: 'Evita el rechazo de servidores de correo corporativo que tienen límites rígidos de archivos adjuntos.',
      },
      {
        title: 'Protección de propiedad intelectual',
        desc: 'Tu tesis o portafolio de diseño no se sube a servidores externos.',
      },
      {
        title: 'Compatibilidad universal',
        desc: 'Visualización perfecta en Adobe Reader, navegadores web y dispositivos móviles.',
      },
    ],
    faqs: [
      {
        q: '¿Se verán borrosas las fotos de mi tesis o proyecto al comprimir a 1 MB?',
        a: 'No. El optimizador ajusta el remuestreo de imágenes para mantener una resolución óptima de lectura en pantalla e impresión básica (150 DPI).',
      },
      {
        q: '¿Tiene costo comprimir archivos grandes?',
        a: 'En PDFBlack es 100% gratuito e ilimitado, ya que el procesamiento consume la potencia de tu propio ordenador.',
      },
    ],
    relatedSolutions: [
      'comprimir-pdf-a-200kb',
      'comprimir-pdf-a-100kb',
      'quitar-marca-agua-camscanner',
    ],
  },

  'comprimir-pdf-a-100kb': {
    slug: 'comprimir-pdf-a-100kb',
    category: 'optimizar',
    toolKey: 'comprimir',
    badge: 'Máxima Reducción',
    h1: 'Comprimir PDF a 100 KB — Reducción Extrema sin Fallos',
    subtitle:
      'Reduce tus documentos al límite estricto de 100 KB para formularios digitales, fotos de DNI escaneadas y solicitudes que rechazan cualquier archivo superior.',
    metaTitle: 'Comprimir PDF a 100 KB Online Gratis | PDFBlack',
    metaDescription:
      'Reduce el tamaño de tu PDF a menos de 100 KB fácilmente. Ideal para formularios que exigen peso mínimo. 100% seguro y privado.',
    keywords: [
      'comprimir pdf a 100 kb',
      'comprimir pdf a 100kb',
      'reducir pdf a 100 kb',
      'comprimir pdf muy pequeño',
    ],
    parentPath: '/optimizar/comprimir',
    parentName: 'Comprimir PDF',
    specifications: [
      {
        feature: 'Límite objetivo',
        value: '≤ 100 KB',
        note: 'Compresión ultra-fuerte con remoción de metadatos',
      },
      {
        feature: 'Procesamiento',
        value: 'En navegador (Client-Side)',
        note: 'Seguridad absoluta de datos',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Elige tu archivo',
        desc: 'Arrastra el PDF que necesitas achicar al máximo.',
      },
      {
        step: 2,
        title: 'Procesamiento extremo',
        desc: 'El sistema elimina objetos embebidos innecesarios y optimiza fuentes.',
      },
      {
        step: 3,
        title: 'Descarga tu PDF ligero',
        desc: 'Listo para los formularios más exigentes.',
      },
    ],
    benefits: [
      {
        title: 'Aprobación en portales rígidos',
        desc: 'Supera las validaciones de peso más estrictas de internet.',
      },
      {
        title: 'Velocidad de carga inmediata',
        desc: 'Se descarga y envía en una fracción de segundo.',
      },
    ],
    faqs: [
      {
        q: '¿Qué tipo de archivos pueden llegar a 100 KB?',
        a: 'Documentos de texto de 1 a 10 páginas o escaneos optimizados en blanco y negro alcanzan fácilmente menos de 100 KB.',
      },
    ],
    relatedSolutions: [
      'comprimir-pdf-a-200kb',
      'comprimir-pdf-a-1mb',
      'censurar-datos-personales-pdf',
    ],
  },

  'quitar-marca-agua-camscanner': {
    slug: 'quitar-marca-agua-camscanner',
    category: 'editar',
    toolKey: 'quitar-marca-agua',
    badge: 'Popular Estudiantes y Profesionales',
    h1: 'Quitar Marca de Agua de CamScanner en PDF Gratis Online',
    subtitle:
      'Elimina el sello inferior "Scanned with CamScanner" de tus documentos digitalizados de forma limpia, sin alterar el texto ni pagar suscripciones premium.',
    metaTitle: 'Quitar Marca de Agua CamScanner en PDF Gratis Online | PDFBlack',
    metaDescription:
      'Elimina fácilmente la marca de agua de CamScanner de tus PDFs escaneados. Limpio, gratuito y 100% privado sin subir archivos a servidores.',
    keywords: [
      'quitar marca de agua camscanner',
      'eliminar marca de agua camscanner pdf gratis',
      'quitar sello camscanner pdf online',
      'borrar scanned with camscanner pdf',
      'quitar marca de agua de escaneo',
    ],
    parentPath: '/editar/quitar-marca-agua',
    parentName: 'Quitar Marca de Agua',
    specifications: [
      {
        feature: 'Compatibilidad',
        value: 'CamScanner (iOS / Android)',
        note: 'Detecta sellos de pie de página',
      },
      {
        feature: 'Integridad de texto',
        value: '100% Preservada',
        note: 'Solo remueve la capa o franja del sello',
      },
      {
        feature: 'Privacidad',
        value: 'Memoria local (0 nubes)',
        note: 'Tus apuntes y contratos seguros',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Sube tu documento escaneado',
        desc: 'Arrastra el PDF que contiene la marca de agua de CamScanner.',
      },
      {
        step: 2,
        title: 'Selecciona o detecta el área del sello',
        desc: 'El visor te permite marcar y eliminar la marca inferior en todas las páginas.',
      },
      {
        step: 3,
        title: 'Descarga el PDF limpio',
        desc: 'Obtén tu documento impecable y listo para entregar a clientes o profesores.',
      },
    ],
    benefits: [
      {
        title: 'Presentación 100% profesional',
        desc: 'Entrega trabajos académicos y presupuestos comerciales sin sellos informales de apps.',
      },
      {
        title: 'Ahorro total',
        desc: 'No necesitas pagar la costosa suscripción mensual de CamScanner Pro.',
      },
    ],
    faqs: [
      {
        q: '¿Se borra el texto de mi documento al quitar la marca de CamScanner?',
        a: 'No. El proceso aísla la franja inferior donde se ubica el texto publicitario, dejando el contenido intacto.',
      },
      {
        q: '¿Funciona con documentos de muchas páginas?',
        a: 'Sí, procesa lotes de páginas en segundos utilizando Web Workers para no congelar tu navegador.',
      },
    ],
    relatedSolutions: [
      'editar-texto-pdf-sin-desconfigurar',
      'comprimir-pdf-a-200kb',
      'foliar-expediente-judicial',
    ],
  },

  'foliar-expediente-judicial': {
    slug: 'foliar-expediente-judicial',
    category: 'editar',
    toolKey: 'foliar',
    badge: 'Uso Jurídico y Notarial',
    h1: 'Foliar Expediente Judicial en PDF — Numeración Correlativa',
    subtitle:
      'Numera expedientes judiciales, demandas y alegatos conforme a las directivas del Poder Judicial y mesas de partes electrónicas. Foliación en esquina superior o inferior derecha con tipografía formal.',
    metaTitle: 'Foliar Expediente Judicial en PDF Online Gratis | PDFBlack',
    metaDescription:
      'Folia expedientes judiciales y documentos legales en PDF. Numeración correlativa o inversa, prefijos formales y cumplimiento procesal 100% privado.',
    keywords: [
      'foliar expediente judicial pdf',
      'como foliar un expediente en pdf',
      'foliacion electronica poder judicial pdf',
      'numerar hojas de expediente pdf',
      'foliar pdf online gratis',
    ],
    parentPath: '/editar/foliar',
    parentName: 'Foliar PDF',
    specifications: [
      {
        feature: 'Posición regulada',
        value: 'Superior o Inferior Derecha',
        note: 'Cumple directivas procesales estándar',
      },
      {
        feature: 'Formato de folios',
        value: 'Correlativo (1, 2, 3...) o Prefijo (Fs. 001)',
        note: 'Totalmente personalizable',
      },
      {
        feature: 'Secreto profesional',
        value: 'Garantizado por diseño',
        note: 'Cero subidas a servidores externos',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Carga el expediente legal',
        desc: 'Arrastra el PDF del expediente o escrito judicial.',
      },
      {
        step: 2,
        title: 'Configura el foliado procesal',
        desc: 'Elige la esquina requerida por el juzgado, el número inicial y si deseas prefijo ("Fs. ").',
      },
      {
        step: 3,
        title: 'Aplica y descarga',
        desc: 'Descarga el expediente debidamente foliado listo para anexar a la mesa de partes virtual.',
      },
    ],
    benefits: [
      {
        title: 'Cumplimiento estricto de la ley procesal',
        desc: 'Evita observaciones o rechazos de expedientes por defectos de foliación.',
      },
      {
        title: 'Confidencialidad absoluta de tus causas',
        desc: 'Información penal, civil o corporativa protegida al no salir de tu equipo.',
      },
    ],
    faqs: [
      {
        q: '¿Puedo empezar la foliación desde un número distinto a 1 (por ejemplo, fojas 150)?',
        a: 'Sí. Puedes definir cualquier número de inicio para continuar tomos o anexos preexistentes.',
      },
      {
        q: '¿Qué color de número es recomendable para expedientes judiciales?',
        a: 'La mayoría de normativas admite negro o rojo reglamentario. PDFBlack te permite seleccionar ambos con contraste nítido.',
      },
    ],
    relatedSolutions: [
      'foliar-pdf-de-atras-hacia-adelante',
      'censurar-datos-personales-pdf',
      'comprimir-pdf-a-200kb',
    ],
  },

  'foliar-pdf-de-atras-hacia-adelante': {
    slug: 'foliar-pdf-de-atras-hacia-adelante',
    category: 'editar',
    toolKey: 'foliar',
    badge: 'Foliación Inversa Reglamentaria',
    h1: 'Foliar PDF de Atrás Hacia Adelante — Numeración Inversa',
    subtitle:
      'Aplica foliación inversa decreciente a documentos administrativos y archivos históricos donde la última página actúa como folio inicial conforme a normativas de archivo institucional.',
    metaTitle: 'Foliar PDF de Atrás Hacia Adelante Online | PDFBlack',
    metaDescription:
      'Aplica numeración inversa a tus expedientes y documentos PDF en segundos. Foliado de atrás hacia adelante gratis y seguro en tu navegador.',
    keywords: [
      'foliar pdf de atras hacia adelante',
      'numerar pdf inverso',
      'foliacion inversa expediente pdf',
      'numerar paginas pdf de atras para adelante',
    ],
    parentPath: '/editar/foliar',
    parentName: 'Foliar PDF',
    specifications: [
      {
        feature: 'Dirección',
        value: 'Inversa / Decreciente',
        note: 'De la última hoja a la primera',
      },
      { feature: 'Precisión', value: '100% Vectorial', note: 'Tipografías nítidas sin pixelación' },
    ],
    steps: [
      {
        step: 1,
        title: 'Carga el documento',
        desc: 'Sube el expediente que requiere orden inverso.',
      },
      {
        step: 2,
        title: 'Activa el modo inverso',
        desc: 'Selecciona la opción de foliado decreciente y la esquina deseada.',
      },
      {
        step: 3,
        title: 'Descarga de inmediato',
        desc: 'Guarda el documento numerado correctamente.',
      },
    ],
    benefits: [
      {
        title: 'Ahorro de horas de trabajo manual',
        desc: 'Evita numerar hoja por hoja a mano con sellos de tinta.',
      },
    ],
    faqs: [
      {
        q: '¿Por qué se pide foliado inverso?',
        a: 'Muchas entidades archivan los expedientes agregando las hojas más recientes al frente, por lo que el folio 1 debe corresponder a la última actuación o viceversa.',
      },
    ],
    relatedSolutions: [
      'foliar-expediente-judicial',
      'censurar-datos-personales-pdf',
      'editar-texto-pdf-sin-desconfigurar',
    ],
  },

  'censurar-datos-personales-pdf': {
    slug: 'censurar-datos-personales-pdf',
    category: 'optimizar',
    toolKey: 'censurar',
    badge: 'Protección de Datos & GDPR',
    h1: 'Censurar y Tachar Datos Personales en PDF Permanente',
    subtitle:
      'Oculta y elimina de raíz números de DNI, cuentas bancarias, firmas y datos sensibles antes de compartir contratos y resoluciones. Censura irreversible que no se puede revelar seleccionando el texto.',
    metaTitle: 'Censurar y Tachar Datos Personales en PDF Online | PDFBlack',
    metaDescription:
      'Tacha información confidencial en PDF de forma definitiva. Anonimización real de datos personales y bancarios sin posibilidad de recuperación.',
    keywords: [
      'censurar datos personales pdf',
      'tachar informacion confidencial pdf',
      'anonimizar pdf online gratis',
      'como tapar texto en un pdf permanente',
      'redactar pdf gratis',
    ],
    parentPath: '/optimizar/censurar',
    parentName: 'Censurar PDF',
    specifications: [
      {
        feature: 'Tipo de tachado',
        value: 'Redacción irreversible (True Redaction)',
        note: 'Elimina los bytes de texto subyacente',
      },
      {
        feature: 'Seguridad',
        value: 'A prueba de copia y selección',
        note: 'No es un recuadro negro transparente',
      },
      {
        feature: 'Normativa',
        value: 'Conforme a GDPR y Ley de Datos',
        note: 'Anonimización legal',
      },
    ],
    steps: [
      { step: 1, title: 'Abre el PDF confidencial', desc: 'Arrastra el documento a censurar.' },
      {
        step: 2,
        title: 'Traza las cajas negras sobre los datos',
        desc: 'Pasa el cursor sobre nombres, DNI, teléfonos o cifras que desees ocultar.',
      },
      {
        step: 3,
        title: 'Aplica la censura y descarga',
        desc: 'El documento resultante purga completamente el texto del archivo final.',
      },
    ],
    benefits: [
      {
        title: 'Imposible de recuperar copiando y pegando',
        desc: 'A diferencia de Word o editores simples que solo pintan de negro el fondo, PDFBlack elimina el contenido digital.',
      },
      {
        title: 'Cumplimiento estricto de multas por privacidad',
        desc: 'Comparte resoluciones y sentencias protegiendo la identidad de menores y terceros.',
      },
    ],
    faqs: [
      {
        q: '¿Si alguien copia y pega el texto censurado en el bloc de notas, podrá leer lo que había debajo?',
        a: 'No. El proceso de censura de PDFBlack destruye el texto vectorial de esa coordenada antes de reconstruir el PDF.',
      },
    ],
    relatedSolutions: [
      'foliar-expediente-judicial',
      'firmar-pdf-sin-imprimir',
      'comprimir-pdf-a-200kb',
    ],
  },

  'reparar-pdf-danado': {
    slug: 'reparar-pdf-danado',
    category: 'optimizar',
    toolKey: 'reparar',
    badge: 'Recuperación de Archivos',
    h1: 'Reparar PDF Dañado o Corrupto — Recuperar Contenido',
    subtitle:
      'Restaura archivos PDF que no abren, marcan error de formato inválido o sufrieron una descarga interrumpida. Reconstruye la tabla XREF interna y rescata textos e imágenes.',
    metaTitle: 'Reparar PDF Dañado o Corrupto Online Gratis | PDFBlack',
    metaDescription:
      'Repara documentos PDF dañados que no se pueden abrir. Reconstruye la estructura y recupera páginas perdidas online gratis y en privado.',
    keywords: [
      'reparar pdf danado',
      'recuperar pdf corrupto',
      'arreglar pdf que no abre',
      'reparar archivo pdf online gratis',
      'pdf damaged repair online',
    ],
    parentPath: '/optimizar/reparar',
    parentName: 'Reparar PDF',
    specifications: [
      {
        feature: 'Diagnóstico',
        value: 'Reconstrucción de tabla XREF y Trailers',
        note: 'Sanea archivos con cierres truncados',
      },
      {
        feature: 'Recuperación',
        value: 'Textos, flujos e imágenes',
        note: 'Extrae contenido legible sobreviviente',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Selecciona el PDF que da error',
        desc: 'Arrastra el archivo que tu visor no puede abrir.',
      },
      {
        step: 2,
        title: 'Análisis y reconstrucción estructural',
        desc: 'El analizador de bajo nivel recompila los árboles de páginas y objetos válidos.',
      },
      {
        step: 3,
        title: 'Descarga tu documento reparado',
        desc: 'Abre de nuevo tu archivo sin mensajes de error.',
      },
    ],
    benefits: [
      {
        title: 'Recupera información que creías perdida',
        desc: 'Ideal para documentos descargados con fallas de internet o unidades USB dañadas.',
      },
    ],
    faqs: [
      {
        q: '¿Se pueden reparar todos los PDFs dañados?',
        a: 'Se pueden recuperar aquellos cuya cabecera o índice estructural se corrompió pero cuyos flujos de datos siguen dentro del archivo. Si el archivo está en 0 bytes, no es recuperable.',
      },
    ],
    relatedSolutions: [
      'comprimir-pdf-a-200kb',
      'convertir-pdf-a-word-editable',
      'editar-texto-pdf-sin-desconfigurar',
    ],
  },

  'editar-texto-pdf-sin-desconfigurar': {
    slug: 'editar-texto-pdf-sin-desconfigurar',
    category: 'editar',
    toolKey: 'texto',
    badge: 'Edición Precisa Directa',
    h1: 'Editar Texto en PDF Gratis sin Desconfigurar el Formato',
    subtitle:
      'Modifica oraciones, cambia fechas, corrige nombres o agrega párrafos en tu PDF directamente en pantalla respetando las fuentes originales, márgenes e interlineado.',
    metaTitle: 'Editar Texto en PDF Gratis sin Mover Formato | PDFBlack',
    metaDescription:
      'Edita y cambia texto en tus archivos PDF online gratis. Conserva tipografías y alineación original sin marcas de agua ni suscripciones.',
    keywords: [
      'editar texto pdf sin desconfigurar',
      'modificar texto en pdf gratis',
      'cambiar fecha en pdf online',
      'editar texto pdf online sin mover formato',
      'editor de pdf gratuito',
    ],
    parentPath: '/editar/texto',
    parentName: 'Editar PDF',
    specifications: [
      {
        feature: 'Detección tipográfica',
        value: 'Mapeo de fuentes y tamaños',
        note: 'Se integra armónicamente con el diseño',
      },
      {
        feature: 'Sin marcas de agua',
        value: 'Exportación 100% limpia',
        note: 'No añadimos publicidad ni sellos a tu trabajo',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Carga el documento a editar',
        desc: 'Visualiza las páginas en alta resolución dentro de tu navegador.',
      },
      {
        step: 2,
        title: 'Haz clic y edita',
        desc: 'Selecciona la caja de texto que deseas modificar o inserta un nuevo campo.',
      },
      {
        step: 3,
        title: 'Guarda con fidelidad',
        desc: 'Descarga tu documento actualizado con la misma nitidez profesional.',
      },
    ],
    benefits: [
      {
        title: 'Modificaciones en segundos',
        desc: 'Olvídate de convertir a Word, editar y volver a convertir a PDF.',
      },
    ],
    faqs: [
      {
        q: '¿Puedo editar un PDF escaneado?',
        a: 'Para PDFs que son fotos o escaneos planos, primero debes usar nuestra herramienta de "OCR PDF" para digitalizar la imagen a texto editable.',
      },
    ],
    relatedSolutions: [
      'firmar-pdf-sin-imprimir',
      'quitar-marca-agua-camscanner',
      'convertir-pdf-a-word-editable',
    ],
  },

  'firmar-pdf-sin-imprimir': {
    slug: 'firmar-pdf-sin-imprimir',
    category: 'editar',
    toolKey: 'firmar',
    badge: 'Firma Digital y Rápida',
    h1: 'Firmar Documentos PDF Gratis sin Imprimir ni Escanear',
    subtitle:
      'Dibuja tu firma con el dedo o ratón, o sube una imagen de tu rúbrica para estamparla en contratos, autorizaciones y recibos en segundos desde tu PC o teléfono móvil.',
    metaTitle: 'Firmar PDF Online Gratis sin Imprimir | PDFBlack',
    metaDescription:
      'Firma contratos y documentos PDF digitalmente desde cualquier dispositivo. Rápido, gratis y seguro sin subir archivos a la nube.',
    keywords: [
      'firmar pdf sin imprimir',
      'firmar documento pdf gratis online',
      'poner mi firma en pdf desde celular',
      'firmar contrato pdf online',
    ],
    parentPath: '/editar/firmar',
    parentName: 'Firmar PDF',
    specifications: [
      {
        feature: 'Métodos de firma',
        value: 'Dibujar, Subir imagen o Escribir',
        note: 'Soporte táctil y ratón',
      },
      {
        feature: 'Integración',
        value: 'Estampado vectorial nítido',
        note: 'Transparencia automática de fondo',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Abre tu contrato o documento',
        desc: 'Visualiza la hoja donde se requiere la rúbrica.',
      },
      {
        step: 2,
        title: 'Crea o carga tu firma',
        desc: 'Dibújala con tu dedo o ratón, o sube una foto de tu firma en papel.',
      },
      {
        step: 3,
        title: 'Ubica y descarga',
        desc: 'Ajusta el tamaño sobre la línea punteada y descarga el PDF firmado.',
      },
    ],
    benefits: [
      {
        title: 'Cero gasto de papel y tinta',
        desc: 'Ahorra tiempo y dinero evitando imprimir, firmar con bolígrafo y volver a escanear.',
      },
    ],
    faqs: [
      {
        q: '¿La firma queda guardada en algún servidor?',
        a: 'Jamás. Tu trazo se procesa únicamente en la memoria local de tu navegador y se borra al cerrar la pestaña.',
      },
    ],
    relatedSolutions: [
      'editar-texto-pdf-sin-desconfigurar',
      'censurar-datos-personales-pdf',
      'foliar-expediente-judicial',
    ],
  },

  'convertir-pdf-a-word-editable': {
    slug: 'convertir-pdf-a-word-editable',
    category: 'convertir',
    toolKey: 'pdf-word',
    badge: 'Máxima Fidelidad DOCX',
    h1: 'Convertir PDF a Word Editable — Sin Mover el Formato',
    subtitle:
      'Transforma tus documentos PDF en archivos Microsoft Word (.docx) 100% editables conservando tablas, columnas, viñetas, estilos tipográficos e imágenes incrustadas.',
    metaTitle: 'Convertir PDF a Word Editable sin Mover Formato | PDFBlack',
    metaDescription:
      'Pasa tus PDFs a Word DOCX editable manteniendo tablas, columnas y fuentes. Rápido, gratis y sin registro en tu navegador.',
    keywords: [
      'convertir pdf a word editable',
      'pasar pdf a word sin que se mueva el formato',
      'convertir pdf a docx sin desconfigurar',
      'pdf a word gratis tablas',
    ],
    parentPath: '/convertir/pdf-word',
    parentName: 'PDF a Word',
    specifications: [
      {
        feature: 'Formato de salida',
        value: 'DOCX Nativo (Word 2016-2024 / 365)',
        note: 'Total compatibilidad',
      },
      {
        feature: 'Reconocimiento de tablas',
        value: 'Cuadrícula editable',
        note: 'Celdas y bordes conservados',
      },
    ],
    steps: [
      { step: 1, title: 'Arrastra tu PDF', desc: 'Selecciona el archivo que deseas pasar a Word.' },
      {
        step: 2,
        title: 'Conversión estructural',
        desc: 'El motor reconstruye los párrafos y tablas en formato OpenXML.',
      },
      {
        step: 3,
        title: 'Abre en Word',
        desc: 'Descarga tu .docx listo para editar sin lidiar con formatos desalineados.',
      },
    ],
    benefits: [
      {
        title: 'Ahorro de horas de tipeo',
        desc: 'Recupera el texto original sin tener que transcribir documentos antiguos.',
      },
    ],
    faqs: [
      {
        q: '¿Qué diferencia hay con otros conversores gratuitos?',
        a: 'Muchos conversores colocan cada línea de texto dentro de un marco flotante rígido. PDFBlack reconstruye párrafos continuos para que puedas redactar fluidamente.',
      },
    ],
    relatedSolutions: [
      'convertir-tabla-pdf-a-excel',
      'editar-texto-pdf-sin-desconfigurar',
      'reparar-pdf-danado',
    ],
  },

  'convertir-tabla-pdf-a-excel': {
    slug: 'convertir-tabla-pdf-a-excel',
    category: 'convertir',
    toolKey: 'pdf-excel',
    badge: 'Contabilidad y Finanzas',
    h1: 'Extraer Tablas de PDF a Excel (.xlsx) en Celdas Limpias',
    subtitle:
      'Convierte estados de cuenta, facturas, balances y listados numéricos en PDF a hojas de cálculo de Excel con columnas separadas y números listos para calcular con fórmulas.',
    metaTitle: 'Extraer Tablas de PDF a Excel (.xlsx) Online Gratis | PDFBlack',
    metaDescription:
      'Convierte tablas y datos numéricos de PDF a Excel en celdas limpias y ordenadas. Ideal para contadores y balances financieros. 100% privado.',
    keywords: [
      'convertir tabla pdf a excel',
      'extraer tablas de pdf a excel gratis',
      'pasar estado de cuenta pdf a excel',
      'convertir pdf a xlsx en columnas',
    ],
    parentPath: '/convertir/pdf-excel',
    parentName: 'PDF a Excel',
    specifications: [
      {
        feature: 'Formato de salida',
        value: 'XLSX (Microsoft Excel / Google Sheets)',
        note: 'Celdas independientes',
      },
      {
        feature: 'Reconocimiento numérico',
        value: 'Alineación automática de cifras',
        note: 'Listo para aplicar fórmulas =SUMA()',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Carga el PDF con tablas',
        desc: 'Selecciona el reporte, factura o balance.',
      },
      {
        step: 2,
        title: 'Detección geométrica de columnas',
        desc: 'El analizador detecta los límites de filas y columnas tabulares.',
      },
      {
        step: 3,
        title: 'Descarga tu Excel limpio',
        desc: 'Abre el archivo en Excel o Google Sheets con los datos perfectamente ordenados.',
      },
    ],
    benefits: [
      {
        title: 'Cero errores de digitación',
        desc: 'Evita transcribir números a mano y cometer errores contables costosos.',
      },
    ],
    faqs: [
      {
        q: '¿Se desordenan las columnas si la tabla no tiene líneas divisorias visibles?',
        a: 'El algoritmo utiliza detección por proximidad espacial, identificando columnas incluso en tablas sin bordes dibujados.',
      },
    ],
    relatedSolutions: [
      'convertir-pdf-a-word-editable',
      'censurar-datos-personales-pdf',
      'comprimir-pdf-a-200kb',
    ],
  },
};

export const ALL_LONG_TAIL_SLUGS = Object.keys(LONG_TAIL_SOLUTIONS);

export function getSolutionBySlug(slug: string): LongTailSolution | undefined {
  return LONG_TAIL_SOLUTIONS[slug];
}
