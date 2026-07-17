import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes"; // IMPORTAMOS EL PROVEEDOR

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'PDFLocal - Herramientas PDF 100% Privadas',
  description: 'Une, divide, ordena y protege tus archivos PDF directamente en tu navegador. Sin subir archivos a internet.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning es necesario para next-themes
    <html lang="es" suppressHydrationWarning> 
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}