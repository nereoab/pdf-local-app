'use client';

import UnirPdfPage from '@/app/organizar/unir/page';
import DividirPdfPage from '@/app/organizar/dividir/page';
import EliminarPdfPage from '@/app/organizar/eliminar/page';
import ReordenarPdfPage from '@/app/organizar/reordenar/page';
import RotarPdfPage from '@/app/organizar/rotar/page';
import RecortarPdfPage from '@/app/organizar/recortar/page';

export default function OrganizarToolClient({ toolKey }: { toolKey: string }) {
  switch (toolKey) {
    case 'unir':
      return <UnirPdfPage />;
    case 'dividir':
      return <DividirPdfPage />;
    case 'eliminar':
      return <EliminarPdfPage />;
    case 'reordenar':
      return <ReordenarPdfPage />;
    case 'rotar':
      return <RotarPdfPage />;
    case 'recortar':
      return <RecortarPdfPage />;
    default:
      return <UnirPdfPage />;
  }
}
