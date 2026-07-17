'use client';

import { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Hash, Loader2, Settings2 } from 'lucide-react';

export default function PdfFoliador() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');

  // Opciones de foliado
  const [startNumber, setStartNumber] = useState<number>(1);
  const [prefix, setPrefix] = useState<string>('');
  const [position, setPosition] = useState<'top-right' | 'bottom-right' | 'top-center' | 'bottom-center'>('top-right');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const executeFoliado = async () => {
    if (!file) return;
    setIsProcessing(true);
    let url: string | null = null;
    
    try {
      setProgressMsg('Cargando documento...');
      await new Promise(r => setTimeout(r, 10)); // Yield

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      
      // Incrustar fuente estándar (Helvetica Bold)
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const textSize = 14; // Tamaño de la fuente del folio
      const margin = 30; // Margen en puntos (aprox 1 cm)

      for (let i = 0; i < pages.length; i++) {
        // Yielding cada 10 páginas para no bloquear el Main Thread
        if (i % 10 === 0) {
          setProgressMsg(`Foliando página ${i + 1} de ${pages.length}...`);
          await new Promise(r => setTimeout(r, 10));
        }

        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Construir el texto del folio (ej: "Folio 001" o solo "1")
        const folioText = prefix ? `${prefix} ${startNumber + i}` : `${startNumber + i}`;
        const textWidth = font.widthOfTextAtSize(folioText, textSize);

        // Calcular coordenadas X e Y según la posición seleccionada
        let x = 0;
        let y = 0;

        switch (position) {
          case 'top-right':
            x = width - textWidth - margin;
            y = height - margin - textSize;
            break;
          case 'bottom-right':
            x = width - textWidth - margin;
            y = margin;
            break;
          case 'top-center':
            x = (width / 2) - (textWidth / 2);
            y = height - margin - textSize;
            break;
          case 'bottom-center':
            x = (width / 2) - (textWidth / 2);
            y = margin;
            break;
        }

        // Dibujar el texto en la página
        page.drawText(folioText, {
          x,
          y,
          size: textSize,
          font: font,
          color: rgb(0.1, 0.1, 0.1), // Gris muy oscuro/Casi negro
        });
      }

      setProgressMsg('Guardando documento foliado...');
      await new Promise(r => setTimeout(r, 10));

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);
      
      const originalName = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement('a');
      link.href = url;
      link.download = `${originalName}_Foliado.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error al foliar:', error);
      alert('Ocurrió un error al intentar foliar el documento. Verifica que no esté protegido.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="text-center mb-8">
        <Hash className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Foliado Automático</h3>
        <p className="text-sm text-slate-500 mt-2">Enumera las páginas de tu expediente técnico automáticamente.</p>
      </div>

      {!file ? (
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors">
          <label className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-2.5 rounded-lg cursor-pointer font-semibold text-sm hover:bg-emerald-100 transition-colors">
            Seleccionar Expediente PDF
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          {/* Panel Izquierdo: Archivo y Opciones */}
          <div className="flex-1 space-y-6">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
              <span className="font-medium text-slate-700 truncate pr-4">{file.name}</span>
              <button onClick={() => setFile(null)} disabled={isProcessing} className="text-sm text-red-500 font-semibold hover:underline disabled:opacity-50">Quitar</button>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold">
                <Settings2 className="w-4 h-4" /> Configuración de Foliado
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Número Inicial</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={startNumber} 
                    onChange={e => setStartNumber(Number(e.target.value))} 
                    className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                    disabled={isProcessing}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Prefijo (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Folio" 
                    value={prefix} 
                    onChange={e => setPrefix(e.target.value)} 
                    className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Posición en la página</label>
                <select 
                  value={position} 
                  onChange={e => setPosition(e.target.value as any)} 
                  className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
                  disabled={isProcessing}
                >
                  <option value="top-right">Esquina Superior Derecha</option>
                  <option value="bottom-right">Esquina Inferior Derecha</option>
                  <option value="top-center">Centro Superior</option>
                  <option value="bottom-center">Centro Inferior</option>
                </select>
              </div>
            </div>
          </div>

          {/* Panel Derecho: Acción */}
          <div className="flex-1 flex flex-col justify-end">
            <div className="bg-slate-100 p-6 rounded-xl mb-6 text-sm text-slate-600 text-center">
              Se estampará el texto <br/>
              <span className="font-bold text-lg text-slate-800 mt-2 block">
                "{prefix ? `${prefix} ${startNumber}` : startNumber}"
              </span>
              <br/> en la primera página, incrementando sucesivamente.
            </div>

            <button 
              onClick={executeFoliado} 
              disabled={isProcessing} 
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 disabled:bg-slate-400 transition-colors shadow-sm"
            >
              {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
              {isProcessing ? progressMsg : 'Iniciar Foliado y Descargar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}