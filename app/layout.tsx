import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext"; // Nuestro nuevo motor

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'PDFLocal - Herramientas PDF 100% Privadas',
  description: 'Une, divide, ordena y protege tus archivos PDF directamente en tu navegador. Sin subir archivos a internet.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        {/* Script nativo de Tailwind para evitar parpadeos blancos al cargar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}