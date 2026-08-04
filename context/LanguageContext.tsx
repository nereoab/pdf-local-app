'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

export type Language = 'es' | 'en' | 'zh';

// ─── Translations Dictionary ─────────────────────
const translations = {
  es: {
    nav: { back: 'Volver a herramientas' },
    hero: {
      title: 'Todas las herramientas PDF en tu navegador',
      subtitle:
        'Modifica, une y divide tus documentos PDF de forma 100% local. Sin subir archivos a internet, garantizando tu privacidad absoluta.',
    },
    tools: {
      organize: {
        title: 'Ordenar PDF',
        desc: 'Ordena, añade y elimina páginas. Arrastra y suelta las miniaturas como quieras.',
      },
      merge: {
        title: 'Unir PDF',
        desc: 'Combina múltiples archivos PDF en un solo documento con el orden que prefieras.',
      },
      split: {
        title: 'Dividir PDF',
        desc: 'Extrae páginas específicas o separa un documento grande en varias partes.',
      },
      delete: {
        title: 'Eliminar Páginas',
        desc: 'Remueve las páginas innecesarias de tu PDF con selección visual.',
      },
      rotate: {
        title: 'Rotar PDF',
        desc: 'Gira las páginas de tus documentos escaneados al revés.',
      },
      crop: { title: 'Recortar PDF', desc: 'Recorta los márgenes o ajusta el tamaño de las páginas fácilmente.' },
      number: {
        title: 'Numerar Páginas',
        desc: 'Añade números de página (folios) a tus documentos con posición personalizable.',
      },
      protect: {
        title: 'Proteger PDF',
        desc: 'Añade una contraseña para evitar que abran tus documentos confidenciales.',
      },
      edit: { title: 'Añadir Texto', desc: 'Haz clic en cualquier parte...' },
      pdfWord: {
        title: 'PDF a Word',
        desc: 'Convierte tu PDF a un documento de Word (.docx) editable.',
      },
      wordPdf: {
        title: 'Word a PDF',
        desc: 'Convierte tus documentos de Word (.docx) a formato PDF.',
      },
      pdfExcel: {
        title: 'PDF a Excel',
        desc: 'Extrae datos numéricos y tablas de tu PDF a hojas de cálculo (.xlsx).',
      },
      excelPdf: {
        title: 'Excel a PDF',
        desc: 'Convierte tus hojas de cálculo de Excel (.xlsx) a tablas PDF.',
      },
      pdfPpt: {
        title: 'PDF a PowerPoint',
        desc: 'Convierte tu PDF en una presentación de diapositivas PowerPoint (.pptx).',
      },
      pptPdf: {
        title: 'PowerPoint a PDF',
        desc: 'Convierte tus presentaciones de PowerPoint (.pptx) a PDF.',
      },
      pdfJpg: {
        title: 'PDF a JPG',
        desc: 'Convierte cada página del PDF en una imagen JPG de alta resolución.',
      },
      jpgPdf: {
        title: 'JPG a PDF',
        desc: 'Convierte tus imágenes JPG, PNG o WebP en un documento PDF consolidado.',
      },
      pdfHtml: {
        title: 'PDF a HTML',
        desc: 'Exporta tu documento PDF a código y archivo de página web HTML.',
      },
      htmlPdf: {
        title: 'HTML a PDF',
        desc: 'Convierte archivos o código HTML a documento PDF formateado.',
      },
      pdfText: {
        title: 'PDF a Texto',
        desc: 'Extrae todo el texto plano de tu PDF a un archivo (.txt).',
      },
      textPdf: {
        title: 'Texto a PDF',
        desc: 'Convierte archivos de texto plano (.txt) en un documento PDF estructurado.',
      },
      compress: {
        title: 'Comprimir PDF',
        desc: 'Reduce el peso de tu archivo PDF manteniendo la máxima calidad.',
      },
      repair: {
        title: 'Reparar PDF',
        desc: 'Recupera y reestructura documentos PDF dañados o corruptos.',
      },
      unlock: {
        title: 'Desbloquear PDF',
        desc: 'Elimina contraseñas y restricciones de seguridad de tus archivos PDF.',
      },
      redact: {
        title: 'Censurar PDF',
        desc: 'Tapa y remueve contenido plano e información confidencial de tu PDF.',
      },
      compare: {
        title: 'Comparar PDF',
        desc: 'Muestra las diferencias visuales entre dos archivos PDF similares.',
      },
    },
    footer: {
      title: 'Procesamiento 100% Local y Seguro',
      desc: 'Tus documentos se procesan directamente en la memoria de tu navegador. Ningún archivo es subido a servidores externos.',
    },
    soon: 'Pronto',
  },
  en: {
    nav: { back: 'Back to tools' },
    hero: {
      title: 'All PDF tools in your browser',
      subtitle:
        'Modify, merge, and split your PDF documents 100% locally. No internet uploads, guaranteeing absolute privacy.',
    },
    tools: {
      organize: {
        title: 'Organize PDF',
        desc: 'Sort, add, and delete pages. Drag and drop thumbnails however you like.',
      },
      merge: {
        title: 'Merge PDF',
        desc: 'Combine multiple PDF files into a single document in your preferred order.',
      },
      split: {
        title: 'Split PDF',
        desc: 'Extract specific pages or separate a large document into multiple parts.',
      },
      delete: {
        title: 'Delete Pages',
        desc: 'Remove unnecessary pages from your PDF with visual selection.',
      },
      rotate: {
        title: 'Rotate PDF',
        desc: 'Rotate pages of your scanned documents that are upside down.',
      },
      crop: { title: 'Crop PDF', desc: 'Trim margins or adjust page sizes easily.' },
      number: {
        title: 'Number Pages',
        desc: 'Add page numbers (folios) to your documents with customizable positioning.',
      },
      protect: {
        title: 'Protect PDF',
        desc: 'Add a password to prevent unauthorized access to your confidential documents.',
      },
      edit: { title: 'Add Text', desc: 'Click anywhere on the PDF...' },
      pdfWord: {
        title: 'PDF to Word',
        desc: 'Convert your PDF into an editable Word (.docx) document.',
      },
      wordPdf: {
        title: 'Word to PDF',
        desc: 'Convert your Word (.docx) documents into PDF format.',
      },
      pdfExcel: {
        title: 'PDF to Excel',
        desc: 'Extract numerical data and tables from PDF to spreadsheets (.xlsx).',
      },
      excelPdf: {
        title: 'Excel to PDF',
        desc: 'Convert your Excel (.xlsx) spreadsheets into PDF tables.',
      },
      pdfPpt: {
        title: 'PDF to PowerPoint',
        desc: 'Convert your PDF into a PowerPoint (.pptx) slide presentation.',
      },
      pptPdf: {
        title: 'PowerPoint to PDF',
        desc: 'Convert your PowerPoint (.pptx) presentations into PDF.',
      },
      pdfJpg: {
        title: 'PDF to JPG',
        desc: 'Convert each PDF page into high-resolution JPG images.',
      },
      jpgPdf: {
        title: 'JPG to PDF',
        desc: 'Convert your JPG, PNG, or WebP images into a consolidated PDF file.',
      },
      pdfHtml: {
        title: 'PDF to HTML',
        desc: 'Export your PDF document into structured HTML webpage code.',
      },
      htmlPdf: {
        title: 'HTML to PDF',
        desc: 'Convert HTML files or code snippets into formatted PDF documents.',
      },
      pdfText: {
        title: 'PDF to Text',
        desc: 'Extract plain text from your PDF into a (.txt) file.',
      },
      textPdf: {
        title: 'Text to PDF',
        desc: 'Convert plain text (.txt) files into a formatted PDF document.',
      },
      compress: {
        title: 'Compress PDF',
        desc: 'Reduce file size while optimizing for maximal PDF quality.',
      },
      repair: {
        title: 'Repair PDF',
        desc: 'Recover and rebuild damaged or corrupt PDF documents.',
      },
      unlock: {
        title: 'Unlock PDF',
        desc: 'Remove PDF password security giving you full freedom.',
      },
      redact: {
        title: 'Redact PDF',
        desc: 'Remove sensitive content and confidential text from PDFs.',
      },
      compare: {
        title: 'Compare PDF',
        desc: 'Easily display the differences between two similar PDF files.',
      },
    },
    footer: {
      title: '100% Local and Secure Processing',
      desc: "Your documents are processed directly in your browser's memory. No files are uploaded to external servers.",
    },
    soon: 'Soon',
  },
  zh: {
    nav: { back: '返回工具列表' },
    hero: {
      title: '浏览器内置的全套 PDF 工具',
      subtitle:
        '100% 本地修改、合并和拆分 PDF 文档。无需上传文件至网络，保障绝对隐私。',
    },
    tools: {
      organize: {
        title: '排列 PDF',
        desc: '排序、添加和删除页面。按需拖放缩略图。',
      },
      merge: {
        title: '合并 PDF',
        desc: '按指定顺序将多个 PDF 文件合并为一个文档。',
      },
      split: {
        title: '拆分 PDF',
        desc: '提取特定页面或将大型文档拆分为多个部分。',
      },
      delete: {
        title: '删除页面',
        desc: '可视化选择并移除 PDF 中不需要的页面。',
      },
      rotate: {
        title: '旋转 PDF',
        desc: '旋转颠倒的扫描文档页面。',
      },
      crop: { title: '裁剪 PDF', desc: '轻松裁剪页边距或调整页面尺寸。' },
      number: {
        title: '页码编排',
        desc: '在文档中添加可自定义位置的页码。',
      },
      protect: {
        title: '加密保护',
        desc: '添加密码防止未经授权访问您的机密文档。',
      },
      edit: { title: '添加文本', desc: '在 PDF 任意位置点击...' },
      pdfWord: {
        title: 'PDF 转 Word',
        desc: '将 PDF 转换为可编辑的 Word (.docx) 文档。',
      },
      wordPdf: {
        title: 'Word 转 PDF',
        desc: '将 Word (.docx) 文档转换为 PDF 格式。',
      },
      pdfExcel: {
        title: 'PDF 转 Excel',
        desc: '提取 PDF 中的数值和表格至 Excel (.xlsx) 工作表。',
      },
      excelPdf: {
        title: 'Excel 转 PDF',
        desc: '将 Excel (.xlsx) 工作表转换为 PDF 表格。',
      },
      pdfPpt: {
        title: 'PDF 转 PPT',
        desc: '将 PDF 转换为 PowerPoint (.pptx) 演示文稿。',
      },
      pptPdf: {
        title: 'PPT 转 PDF',
        desc: '将 PowerPoint (.pptx) 演示文稿转换为 PDF。',
      },
      pdfJpg: {
        title: 'PDF 转 JPG',
        desc: '将每个 PDF 页面转换为高分辨率 JPG 图片。',
      },
      jpgPdf: {
        title: 'JPG 转 PDF',
        desc: '将 JPG、PNG 或 WebP 图片合并转换为 PDF 文档。',
      },
      pdfHtml: {
        title: 'PDF 转 HTML',
        desc: '将 PDF 文档导出为结构化 HTML 网页代码。',
      },
      htmlPdf: {
        title: 'HTML 转 PDF',
        desc: '将 HTML 文件或代码片段转换为格式化 PDF。',
      },
      pdfText: {
        title: 'PDF 转文本',
        desc: '提取 PDF 中的纯文本至 (.txt) 文件。',
      },
      textPdf: {
        title: '文本转 PDF',
        desc: '将纯文本 (.txt) 文件转换为格式化 PDF 文档。',
      },
      compress: {
        title: '压缩 PDF',
        desc: '在保持最高品质的同时减小 PDF 文件体积。',
      },
      repair: {
        title: '修复 PDF',
        desc: '恢复并重建受损或损坏的 PDF 文档。',
      },
      unlock: {
        title: '解密 PDF',
        desc: '移除 PDF 密码限制，恢复完全自由。',
      },
      redact: {
        title: '涂黑遮蔽',
        desc: '遮盖并移除 PDF 中的敏感内容和机密信息。',
      },
      compare: {
        title: '对比 PDF',
        desc: '直观对比两个相似 PDF 文件之间的差异。',
      },
    },
    footer: {
      title: '100% 本地安全处理',
      desc: '您的文档直接在浏览器内存中处理，绝无文件上传至外部服务器。',
    },
    soon: '即将推出',
  },
};

// ─── Mappings de locale para Intl ────────────────
const LOCALE_MAP: Record<Language, string> = {
  es: 'es-ES',
  en: 'en-US',
  zh: 'zh-CN',
};

// ─── Detecta idioma del navegador ────────────────
function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'es';
  try {
    // 1. Intentar leer localStorage (persistencia)
    const stored = localStorage.getItem('pdfblack-lang');
    if (stored === 'es' || stored === 'en' || stored === 'zh') return stored;

    // 2. Detectar del navegador (navigator.language)
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang === 'en') return 'en';
    if (browserLang === 'zh') return 'zh';
    // Cualquier otra cosa → español por defecto
  } catch {
    // ignorar errores de localStorage
  }
  return 'es';
}

// ─── Context Type ────────────────────────────────
interface LanguageContextType {
  lang: Language;
  t: (typeof translations)['es'];
  /** Código locale completo para Intl (es-ES, en-US, zh-CN) */
  locale: string;
  toggleLanguage: () => void;
  setLang: (lang: Language) => void;
  /** Formatea un número según el locale actual */
  formatNumber: (n: number, decimals?: number) => string;
  /** Formatea una fecha según el locale actual */
  formatDate: (date: Date | string) => string;
  /** Formatea bytes a tamaño legible */
  formatFileSize: (bytes: number) => string;
}

const defaultContextValue: LanguageContextType = {
  lang: 'es',
  t: translations.es,
  locale: 'es-ES',
  toggleLanguage: () => {},
  setLang: () => {},
  formatNumber: (n) => String(n),
  formatDate: () => '',
  formatFileSize: () => '',
};

const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

// ─── Provider ─────────────────────────────────────
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('es');
  const [mounted, setMounted] = useState(false);

  // Inicializar idioma desde localStorage/navegador — diferido para evitar cascading renders
  useEffect(() => {
    const id = setTimeout(() => {
      setLangState(detectBrowserLanguage());
      setMounted(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // Sincronizar <html lang> y localStorage
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('pdfblack-lang', lang);
    } catch {
      // ignorar
    }
  }, [lang, mounted]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLangState((prev) => {
      if (prev === 'es') return 'en';
      if (prev === 'en') return 'zh';
      return 'es';
    });
  }, []);

  const t = translations[lang];
  const locale = LOCALE_MAP[lang];

  // ─── Utilidades de formato locale-aware ────────
  const formatNumber = useCallback(
    (n: number, decimals = 0) =>
      new Intl.NumberFormat(locale, { maximumFractionDigits: decimals }).format(n),
    [locale],
  );

  const formatDate = useCallback(
    (date: Date | string) =>
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(typeof date === 'string' ? new Date(date) : date),
    [locale],
  );

  const formatFileSize = useCallback(
    (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return formatNumber(bytes / Math.pow(k, i), 2) + ' ' + sizes[i];
    },
    [formatNumber],
  );

  return (
    <LanguageContext.Provider
      value={{
        lang,
        t,
        locale,
        toggleLanguage,
        setLang,
        formatNumber,
        formatDate,
        formatFileSize,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────
export function useLanguage() {
  return useContext(LanguageContext);
}