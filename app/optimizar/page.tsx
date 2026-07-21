'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Lock, Unlock, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const optimizeTools = [
  {
    id: 'compress', title: 'Comprimir PDF', desc: 'Reduce el peso de tus archivos PDF manteniendo la máxima calidad visual posible.',
    icon: FileDown, color: 'text-amber-400', activeBorder: 'border-amber-400', activeBg: 'bg-amber-500/10',
    glow: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] group-hover:border-amber-500/50', href: '/optimizar/comprimir'
  },
  {
    id: 'protect', title: 'Proteger PDF', desc: 'Añade contraseñas seguras y encriptación AES-256 para evitar que abran tu documento.',
    icon: Lock, color: 'text-emerald-400', activeBorder: 'border-emerald-400', activeBg: 'bg-emerald-500/10',
    glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] group-hover:border-emerald-500/50', href: '/optimizar/proteger'
  },
  {
    id: 'unlock', title: 'Desbloquear PDF', desc: 'Elimina la contraseña y las restricciones de seguridad de un PDF para poder editarlo.',
    icon: Unlock, color: 'text-rose-400', activeBorder: 'border-rose-400', activeBg: 'bg-rose-500/10',
    glow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.2)] group-hover:border-rose-500/50', href: '/optimizar/desbloquear'
  }
];

export default function OptimizarPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex flex-col items-center justify-start relative z-10 min-h-[calc(100vh-80px)] bg-[#030712]">
      {mounted && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-start">
          <motion.div animate={{ opacity: [0.03, 0.06, 0.03] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[5%] w-[80vw] h-[50vw] rounded-full bg-cyan-500 blur-[150px]" />
          <motion.div animate={{ opacity: [0.02, 0.05, 0.02] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute top-[15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-500 blur-[150px]" />
        </div>
      )}

      <div className="text-center max-w-3xl mb-12 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-[#F4F4F5] tracking-tight drop-shadow-lg mb-4 leading-[1.15] text-balance antialiased">
          Optimizar <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">PDF</span>
        </h1>
        <p className="text-gray-400 text-base md:text-lg">
          Reduce el tamaño de tus archivos o protégelos con encriptación militar.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6 w-full max-w-7xl relative z-10">
        {optimizeTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}

function ToolCard({ tool }: { tool: any }) {
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFile(files[0]);
  };
  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf') return toast.error('Por favor, suelta un archivo PDF válido.');
    toast.success(`Preparando ${file.name}...`);
    router.push(tool.href);
  };

  return (
    <motion.label
      whileHover={{ y: -8 }} whileTap={{ scale: 0.98 }}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      className={`
        relative flex flex-col items-start p-8 bg-white/[0.02] backdrop-blur-2xl rounded-3xl 
        transition-all duration-500 cursor-pointer group overflow-hidden min-h-[240px]
        w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] border
        ${isDragging ? `border-dashed ${tool.activeBorder} ${tool.activeBg} scale-[1.02] shadow-[0_0_30px_rgba(0,0,0,0.2)]` : 'border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'}
        ${!isDragging && tool.glow}
      `}
    >
      {isDragging && <div className={`absolute inset-0 ${tool.activeBg} blur-3xl opacity-50 pointer-events-none transition-opacity duration-300`} />}
      <input type="file" className="hidden" accept=".pdf" onChange={handleFileInput} />

      <div className="flex-grow w-full relative z-10">
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl blur-sm group-hover:blur-md transition-all"></div>
          <div className={`relative bg-black/50 border border-white/10 p-3.5 rounded-xl w-fit shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 ${isDragging ? tool.activeBorder : ''}`}>
            <tool.icon className={`w-8 h-8 ${tool.color} drop-shadow-[0_0_8px_currentColor]`} />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{tool.title}</h2>
        <p className="text-sm text-gray-400 leading-relaxed">{tool.desc}</p>
      </div>

      <div className="mt-6 w-full flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-all duration-300 relative z-10">
        <UploadCloud className={`w-5 h-5 transition-colors ${isDragging ? tool.color : 'text-cyan-400 group-hover:-translate-y-1'}`} />
        <span className={`text-sm font-bold transition-colors ${isDragging ? tool.color : 'text-cyan-400'}`}>
          {isDragging ? 'Suelta tu PDF aquí...' : 'Haz clic o arrastra tu PDF'}
        </span>
      </div>
    </motion.label>
  );
}