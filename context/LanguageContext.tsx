'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'es' | 'en';

// 1. Nuestro Diccionario
const translations = {
  es: {
    nav: { back: 'Volver a herramientas' },
    hero: {
      title: 'Todas las herramientas PDF en tu navegador',
      subtitle: 'Modifica, une y divide tus documentos PDF de forma 100% local. Sin subir archivos a internet, garantizando tu privacidad absoluta.',
    },
    tools: {
      organize: { title: 'Ordenar PDF', desc: 'Ordena, añade y elimina páginas. Arrastra y suelta las miniaturas como quieras.' },
      merge: { title: 'Unir PDF', desc: 'Combina múltiples archivos PDF en un solo documento con el orden que prefieras.' },
      split: { title: 'Dividir PDF', desc: 'Extrae páginas específicas o separa un documento grande en varias partes.' },
      delete: { title: 'Eliminar Páginas', desc: 'Remueve las páginas innecesarias de tu PDF con selección visual.' },
      rotate: { title: 'Rotar PDF', desc: 'Gira las páginas de tus documentos escaneados al revés.' },
      crop: { title: 'Recortar PDF', desc: 'Recorta los márgenes o ajusta el tamaño de las páginas fácilmente.' },
      number: { title: 'Numerar Páginas', desc: 'Añade números de página (folios) a tus documentos con posición personalizable.' },
      protect: { title: 'Proteger PDF', desc: 'Añade una contraseña para evitar que abran tus documentos confidenciales.' },
      edit: { title: 'Añadir Texto', desc: 'Haz clic en cualquier parte...' },
      pdfWord: { title: 'PDF a Word', desc: 'Convierte tu PDF a un documento de Word (.docx) editable.' },
      wordPdf: { title: 'Word a PDF', desc: 'Convierte tus documentos de Word (.docx) a formato PDF.' },
      pdfExcel: { title: 'PDF a Excel', desc: 'Extrae datos numéricos y tablas de tu PDF a hojas de cálculo (.xlsx).' },
      excelPdf: { title: 'Excel a PDF', desc: 'Convierte tus hojas de cálculo de Excel (.xlsx) a tablas PDF.' },
      pdfPpt: { title: 'PDF a PowerPoint', desc: 'Convierte tu PDF en una presentación de diapositivas PowerPoint (.pptx).' },
      pptPdf: { title: 'PowerPoint a PDF', desc: 'Convierte tus presentaciones de PowerPoint (.pptx) a PDF.' },
      pdfJpg: { title: 'PDF a JPG', desc: 'Convierte cada página del PDF en una imagen JPG de alta resolución.' },
      jpgPdf: { title: 'JPG a PDF', desc: 'Convierte tus imágenes JPG, PNG o WebP en un documento PDF consolidado.' },
      pdfHtml: { title: 'PDF a HTML', desc: 'Exporta tu documento PDF a código y archivo de página web HTML.' },
      htmlPdf: { title: 'HTML a PDF', desc: 'Convierte archivos o código HTML a documento PDF formateado.' },
      pdfText: { title: 'PDF a Texto', desc: 'Extrae todo el texto plano de tu PDF a un archivo (.txt).' },
      textPdf: { title: 'Texto a PDF', desc: 'Convierte archivos de texto plano (.txt) en un documento PDF estructurado.' },
      compress: { title: 'Comprimir PDF', desc: 'Reduce el peso de tu archivo PDF manteniendo la máxima calidad.' },
      repair: { title: 'Reparar PDF', desc: 'Recupera y reestructura documentos PDF dañados o corruptos.' },
      unlock: { title: 'Desbloquear PDF', desc: 'Elimina contraseñas y restricciones de seguridad de tus archivos PDF.' },
      redact: { title: 'Censurar PDF', desc: 'Tapa y remueve contenido plano e información confidencial de tu PDF.' },
      compare: { title: 'Comparar PDF', desc: 'Muestra las diferencias visuales entre dos archivos PDF similares.' }
    },
    footer: {
      title: 'Procesamiento 100% Local y Seguro',
      desc: 'Tus documentos se procesan directamente en la memoria de tu navegador. Ningún archivo es subido a servidores externos.',
    },
    soon: 'Pronto'
  },
  en: {
    nav: { back: 'Back to tools' },
    hero: {
      title: 'All PDF tools in your browser',
      subtitle: 'Modify, merge, and split your PDF documents 100% locally. No internet uploads, guaranteeing absolute privacy.',
    },
    tools: {
      organize: { title: 'Organize PDF', desc: 'Sort, add, and delete pages. Drag and drop thumbnails however you like.' },
      merge: { title: 'Merge PDF', desc: 'Combine multiple PDF files into a single document in your preferred order.' },
      split: { title: 'Split PDF', desc: 'Extract specific pages or separate a large document into multiple parts.' },
      delete: { title: 'Delete Pages', desc: 'Remove unnecessary pages from your PDF with visual selection.' },
      rotate: { title: 'Rotate PDF', desc: 'Rotate pages of your scanned documents that are upside down.' },
      crop: { title: 'Crop PDF', desc: 'Trim margins or adjust page sizes easily.' },
      number: { title: 'Number Pages', desc: 'Add page numbers (folios) to your documents with customizable positioning.' },
      protect: { title: 'Protect PDF', desc: 'Add a password to prevent unauthorized access to your confidential documents.' },
      edit: { title: 'Add Text', desc: 'Click anywhere on the PDF...' },
      pdfWord: { title: 'PDF to Word', desc: 'Convert your PDF into an editable Word (.docx) document.' },
      wordPdf: { title: 'Word to PDF', desc: 'Convert your Word (.docx) documents into PDF format.' },
      pdfExcel: { title: 'PDF to Excel', desc: 'Extract numerical data and tables from PDF to spreadsheets (.xlsx).' },
      excelPdf: { title: 'Excel to PDF', desc: 'Convert your Excel (.xlsx) spreadsheets into PDF tables.' },
      pdfPpt: { title: 'PDF to PowerPoint', desc: 'Convert your PDF into a PowerPoint (.pptx) slide presentation.' },
      pptPdf: { title: 'PowerPoint to PDF', desc: 'Convert your PowerPoint (.pptx) presentations into PDF.' },
      pdfJpg: { title: 'PDF to JPG', desc: 'Convert each PDF page into high-resolution JPG images.' },
      jpgPdf: { title: 'JPG to PDF', desc: 'Convert your JPG, PNG, or WebP images into a consolidated PDF file.' },
      pdfHtml: { title: 'PDF to HTML', desc: 'Export your PDF document into structured HTML webpage code.' },
      htmlPdf: { title: 'HTML to PDF', desc: 'Convert HTML files or code snippets into formatted PDF documents.' },
      pdfText: { title: 'PDF to Text', desc: 'Extract plain text from your PDF into a (.txt) file.' },
      textPdf: { title: 'Text to PDF', desc: 'Convert plain text (.txt) files into a formatted PDF document.' },
      compress: { title: 'Compress PDF', desc: 'Reduce file size while optimizing for maximal PDF quality.' },
      repair: { title: 'Repair PDF', desc: 'Recover and rebuild damaged or corrupt PDF documents.' },
      unlock: { title: 'Unlock PDF', desc: 'Remove PDF password security giving you full freedom.' },
      redact: { title: 'Redact PDF', desc: 'Remove sensitive content and confidential text from PDFs.' },
      compare: { title: 'Compare PDF', desc: 'Easily display the differences between two similar PDF files.' }
    },
    footer: {
      title: '100% Local and Secure Processing',
      desc: 'Your documents are processed directly in your browser\'s memory. No files are uploaded to external servers.',
    },
    soon: 'Soon'
  }
};

// 2. Creamos el Contexto
const LanguageContext = createContext<any>(null);

// 3. Proveedor del Contexto (Envuelve la app)
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('es');

  const t = translations[lang]; // Obtenemos el diccionario actual

  const toggleLanguage = () => {
    setLang(prev => prev === 'es' ? 'en' : 'es');
  };

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// 4. Hook personalizado para usarlo fácilmente en cualquier componente
export function useLanguage() {
  return useContext(LanguageContext);
}