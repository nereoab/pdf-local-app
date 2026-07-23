import type { Metadata, Viewport } from 'next';
import './globals.css';

// 1. Importamos tu contexto de idioma
import { LanguageProvider } from '../context/LanguageContext';

// 2. IMPORTAMOS TU CABECERA Y PIE DE PÁGINA (El archivo que vi en tu captura)
import SharedLayout from '../components/SharedLayout'; 

export const viewport: Viewport = {
  themeColor: '#030712',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: 'PDFBlack ♠️ | Herramientas PDF Gratuitas',
  description: 'Edición de PDF 100% local, privada y en modo oscuro.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark" style={{ colorScheme: 'dark' }}>
      <body className="bg-[#030712] text-gray-100 antialiased min-h-screen">
        
        <LanguageProvider>
          {/* 3. RESTAURAMOS EL LAYOUT COMPARTIDO (Header + Footer) */}
          <SharedLayout>
            {children}
          </SharedLayout>
        </LanguageProvider>

      </body>
    </html>
  );
}