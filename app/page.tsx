'use client';

import { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Edit3, RefreshCw, Zap, FolderOpen } from 'lucide-react';

export default function HomePage() {
  const { lang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  const isEs = lang === 'es';

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  return (
    // 🔥 FIX: Reducimos drásticamente el padding vertical (py-2 sm:py-6) para subir todo
    <div className="w-full px-4 sm:px-6 lg:px-8 py-2 sm:py-6 flex flex-col items-center justify-start relative z-10 min-h-[calc(100vh-80px)]">
      
      {/* 🌌 FONDO PREMIUM: ILUMINACIÓN FOCAL SUTIL (Sin Malla 3D) */}
      {mounted && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
          <motion.div 
            animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }} 
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-900/20 blur-[150px]" 
          />
          <motion.div 
            animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }} 
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-900/10 blur-[150px]" 
          />
        </div>
      )}

      {/* 🔥 FIX: Título más compacto y con menos margen inferior (mb-6) */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="text-center max-w-4xl mb-6 relative z-10 mt-2">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg mb-2 leading-tight">
          {isEs ? 'Herramientas PDF gratuitas,' : 'Completely free PDF tools,'} <br className="hidden sm:block"/> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300">
            {isEs ? 'sin tarjeta, sin registro.' : 'no credit card, no sign-up.'}
          </span>
        </h1>
      </motion.div>

      {/* 🔥 FIX: Tarjetas con menos gap y margen inferior para que entren en pantalla */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full max-w-4xl mb-8 relative z-10">
        <CategoryCard icon={<Edit3 className="w-6 h-6 text-blue-500" strokeWidth={1.5} />} title={isEs ? "Editar PDF" : "Edit PDF"} desc={isEs ? "Modifica el texto real, añade numeración o llena formularios interactivos." : "Modify real text, add numbering, or fill out forms."} path="/editar" />
        <CategoryCard icon={<FolderOpen className="w-6 h-6 text-blue-500" strokeWidth={1.5} />} title={isEs ? "Organizar PDF" : "Organize PDF"} desc={isEs ? "Une, divide, ordena y rota las páginas de tus expedientes con Drag & Drop." : "Merge, split, sort, and rotate pages of your files."} path="/organizar" />
        <CategoryCard icon={<RefreshCw className="w-6 h-6 text-blue-500" strokeWidth={1.5} />} title={isEs ? "Convertir PDF" : "Convert PDF"} desc={isEs ? "Transforma tus PDFs a formatos editables como Microsoft Word (.docx)." : "Transform your PDFs into editable formats like Word (.docx)."} path="/convertir" />
        <CategoryCard icon={<Zap className="w-6 h-6 text-blue-500" strokeWidth={1.5} />} title={isEs ? "Optimizar PDF" : "Optimize PDF"} desc={isEs ? "Añade contraseñas de seguridad AES-256 o reduce el peso del archivo." : "Add security passwords or reduce file weight."} path="/optimizar" />
      </motion.div>

      {/* 🔥 FIX: Texto técnico secundario más pegado a las tarjetas */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="text-center max-w-3xl w-full relative z-10 pt-6 border-t border-white/5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121212] text-slate-300 font-medium text-xs sm:text-sm mb-4 border border-white/5 backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-blue-500" strokeWidth={2} />
          {isEs ? 'Privacidad Absoluta • 100% Local' : 'Absolute Privacy • 100% Local'}
        </div>
        
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2 tracking-tight">
          {isEs ? 'Todo tu flujo de trabajo, ' : 'Your entire workflow, '} <span className="text-slate-400">{isEs ? 'cero servidores.' : 'zero servers.'}</span>
        </h2>
        <p className="text-sm text-[#A1A1AA] font-normal leading-relaxed max-w-2xl mx-auto">
          {isEs ? 'Edita, organiza y optimiza tus documentos con total confidencialidad. Todo el procesamiento ocurre directamente en tu dispositivo, garantizando que tus archivos nunca abandonen tu control.' : 'Edit, organize, and optimize your documents with total confidentiality. All processing happens directly on your device, ensuring your files never leave your control.'}
        </p>
      </motion.div>

    </div>
  );
}

// 🚀 TARJETAS PREMIUM (Usan <Link> de Next.js para navegar a las otras páginas)
function CategoryCard({ icon, title, desc, path }: any) {
  return (
    <Link href={path} className="w-full h-full outline-none">
      <motion.div 
        whileHover={{ y: -3, borderColor: '#3b82f6', boxShadow: '0 8px 30px rgba(59,130,246,0.15)' }} 
        whileTap={{ scale: 0.98 }} 
        className="group relative flex flex-col items-start p-6 sm:p-8 bg-[#121212] rounded-3xl border border-white/10 shadow-xl hover:shadow-2xl text-left transition-all duration-300 h-full w-full overflow-hidden"
      >
        <div className="relative z-20 bg-slate-900 p-3 rounded-2xl mb-4 shadow-sm border border-slate-800 group-hover:border-slate-700 transition-colors">
          {icon}
        </div>
        <h2 className="relative z-20 text-xl font-bold text-white mb-2">{title}</h2>
        <p className="relative z-20 text-[#A1A1AA] font-medium leading-relaxed text-sm">{desc}</p>
      </motion.div>
    </Link>
  );
}