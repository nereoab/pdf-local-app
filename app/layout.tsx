import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'PDFBlack | Herramientas PDF Gratuitas y Privadas',
  description: 'Edita, organiza, convierte y optimiza tus archivos PDF directamente en tu navegador. 100% local, sin servidores, sin registro.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'PDFBlack | Herramientas PDF Gratuitas',
    description: 'El primer suite de ingeniería que modifica y asegura tus expedientes directamente en la memoria RAM de tu navegador.',
    url: 'https://tu-dominio.vercel.app',
    siteName: 'PDFBlack',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDFBlack | Herramientas PDF Gratuitas',
    description: 'Edita, organiza y convierte PDFs 100% localmente.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning> 
      <head>
        <meta name="theme-color" content="#030712" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}