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
      number: { title: 'Numerar Páginas', desc: 'Añade números de página (folios) a tus documentos con posición personalizable.' },
      rotate: { title: 'Rotar PDF', desc: 'Gira las páginas de tus documentos escaneados al revés.' },
      protect: { title: 'Proteger PDF', desc: 'Añade una contraseña para evitar que abran tus documentos confidenciales.' },
      edit: { title: 'Añadir Texto', desc: 'Haz clic en cualquier parte...' },
      word: { title: 'PDF a Word', desc: 'Convierte tu PDF a un documento de Word (.docx) para editar el texto libremente.' },
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
      number: { title: 'Number Pages', desc: 'Add page numbers (folios) to your documents with customizable positioning.' },
      rotate: { title: 'Rotate PDF', desc: 'Rotate pages of your scanned documents that are upside down.' },
      protect: { title: 'Protect PDF', desc: 'Add a password to prevent unauthorized access to your confidential documents.' },
      edit: { title: 'Add Text', desc: 'Click anywhere on the PDF...' },
      word: { title: 'PDF to Word', desc: 'Convert your PDF to a Word document (.docx) to edit the text freely.' }
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