'use client';

import PdfComparator from '@/components/PdfComparator';

export default function CompararPdfPage() {
  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfComparator />
      </div>
    </main>
  );
}
