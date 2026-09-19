'use client';

import EditarTextoPage from '@/app/editar/texto/page';
import QuitarMarcaAguaPage from '@/app/editar/quitar-marca-agua/page';
import OcrPage from '@/app/editar/ocr/page';
import MarcaAguaPage from '@/app/editar/marca-agua/page';
import FoliarPage from '@/app/editar/foliar/page';
import FirmarPdfPage from '@/app/editar/firmar/page';

export default function EditarToolClient({ toolKey }: { toolKey: string }) {
  switch (toolKey) {
    case 'texto':
      return <EditarTextoPage />;
    case 'quitar-marca-agua':
      return <QuitarMarcaAguaPage />;
    case 'ocr':
      return <OcrPage />;
    case 'marca-agua':
      return <MarcaAguaPage />;
    case 'foliar':
      return <FoliarPage />;
    case 'firmar':
      return <FirmarPdfPage />;
    default:
      return <EditarTextoPage />;
  }
}
