'use client'; // <-- ¡ESTA ES LA LÍNEA QUE FALTABA!

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Magia negra de Next.js: Forzamos a que el editor solo cargue en el cliente (navegador)
const PdfEditor = dynamic(() => import('@/components/PdfEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      <p className="text-slate-400 font-medium">Cargando motor de edición premium...</p>
    </div>
  ),
});

export default function EditarTextoPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-4">
          Modificar Texto PDF ♠️
        </h1>
        <p className="text-slate-500 dark:text-gray-400 max-w-2xl mx-auto">
          Edita el texto de tu PDF directamente en el navegador. Sin subir archivos a servidores de terceros. Privacidad absoluta.
        </p>
      </div>

      {/* Aquí inyectamos el componente sin SSR */}
      <PdfEditor />
    </main>
  );
}