'use client';

import ComprimirPdfPage from '@/app/optimizar/comprimir/page';
import RepararPdfPage from '@/app/optimizar/reparar/page';
import ProtegerPdfPage from '@/app/optimizar/proteger/page';
import DesbloquearPdfPage from '@/app/optimizar/desbloquear/page';
import CensurarPdfPage from '@/app/optimizar/censurar/page';
import CompararPdfPage from '@/app/optimizar/comparar/page';

export default function OptimizarToolClient({ toolKey }: { toolKey: string }) {
  switch (toolKey) {
    case 'comprimir':
      return <ComprimirPdfPage />;
    case 'reparar':
      return <RepararPdfPage />;
    case 'proteger':
      return <ProtegerPdfPage />;
    case 'desbloquear':
      return <DesbloquearPdfPage />;
    case 'censurar':
      return <CensurarPdfPage />;
    case 'comparar':
      return <CompararPdfPage />;
    default:
      return <ComprimirPdfPage />;
  }
}
