import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";
import { LanguageProvider } from "../context/LanguageContext";
import SharedLayout from "../components/SharedLayout"; // IMPORTAMOS EL CASCARÓN

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'PDFBlack | Herramientas PDF Gratuitas y Privadas',
  description: 'Edita, organiza, convierte y optimiza tus archivos PDF directamente en tu navegador. 100% local, sin servidores, sin registro.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning> 
      <head>
        <meta name="theme-color" content="#030712" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <LanguageProvider>
            {/* ENVOLVEMOS LA APP EN EL CASCARÓN */}
            <SharedLayout>
              {children}
            </SharedLayout>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}