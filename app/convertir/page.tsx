'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { FileText, FileSpreadsheet, Presentation, Image as ImageIcon, AlignLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext'; // 🔥 FIX: Subimos dos niveles (../../)

export default function ConvertirPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const API_SECRET = process.env.NEXT_PUBLIC_CONVERTAPI_SECRET;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12 animate-in fade-in duration-500">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          {isEs ? 'Convertir PDF' : 'Convert PDF'}
        </h1>
        <p className="text-[#A1A1AA]">
          {isEs ? 'Selecciona el formato al que deseas convertir tu documento:' : 'Select the format you want to convert your document to:'}
        </p>
      </div>
      
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ConverterCard icon={<FileText className="w-6 h-6 text-blue-500" />} title="PDF a Word" description={isEs ? "Convierte tu PDF a un documento de Word (.docx) editable." : "Convert your PDF to an editable Word document (.docx)."} targetFormat="docx" apiSecret={API_SECRET} />
        <ConverterCard icon={<FileSpreadsheet className="w-6 h-6 text-emerald-500" />} title="PDF a Excel" description={isEs ? "Extrae tablas y datos a una hoja de cálculo (.xlsx)." : "Extract tables and data to a spreadsheet (.xlsx)."} targetFormat="xlsx" apiSecret={API_SECRET} />
        <ConverterCard icon={<Presentation className="w-6 h-6 text-orange-500" />} title="PDF a PowerPoint" description={isEs ? "Transforma tu PDF en una presentación (.pptx) editable." : "Transform your PDF into an editable presentation (.pptx)."} targetFormat="pptx" apiSecret={API_SECRET} />
        <ConverterCard icon={<ImageIcon className="w-6 h-6 text-purple-500" />} title="PDF a JPG" description={isEs ? "Convierte cada página del PDF en una imagen de alta calidad." : "Convert each PDF page into a high-quality image."} targetFormat="jpg" apiSecret={API_SECRET} />
        <ConverterCard icon={<AlignLeft className="w-6 h-6 text-slate-400" />} title="PDF a Texto" description={isEs ? "Extrae todo el texto del documento a un archivo plano (.txt)." : "Extract all text from the document to a plain file (.txt)."} targetFormat="txt" apiSecret={API_SECRET} />
      </motion.div>
    </div>
  );
}

function ConverterCard({ icon, title, description, targetFormat, apiSecret }: any) {
  const [isConverting, setIsConverting] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!apiSecret) { toast.error('Falta configurar la API Key'); return; }

    setIsConverting(true);
    toast.info(`Convirtiendo a ${targetFormat.toUpperCase()}...`);
    
    try {
      const formData = new FormData();
      formData.append('File', file);
      const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/${targetFormat}?Secret=${apiSecret}`, { method: 'POST', body: formData });
      const data = await response.json();
      
      if (data.Files && data.Files.length > 0) {
        const fileUrl = data.Files[0].Url;
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = `${file.name.replace('.pdf', '')}_Convertido.${targetFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('¡Conversión exitosa!');
      } else {
        throw new Error('Error en la conversión');
      }
    } catch (error) {
      toast.error('Error al convertir el archivo');
    } finally {
      setIsConverting(false);
      e.target.value = ''; 
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.4 } }
  };

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -3, borderColor: 'rgba(59, 130, 246, 0.4)', boxShadow: '0 12px 30px -10px rgba(59, 130, 246, 0.25)' }} className="relative bg-[#121212] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-lg transition-all duration-300 flex flex-col items-start text-left w-full">
      <div className="bg-slate-900 p-3 rounded-xl mb-5 border border-slate-800">
        {isConverting ? <Loader2 className="w-6 h-6 text-blue-500 animate-spin" /> : icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-[#A1A1AA] text-sm leading-relaxed mb-6">{description}</p>
      <label className={`mt-auto w-full py-2.5 rounded-xl text-center text-sm font-bold cursor-pointer transition-all ${isConverting ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40'}`}>
        {isConverting ? 'Procesando...' : 'Subir PDF'}
        <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={isConverting} />
      </label>
    </motion.div>
  );
}