'use client';

import { useLanguage } from '../../context/LanguageContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, MessageSquare, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactoPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const [submitted, setSubmitted] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) {
      toast.error(isEs ? 'Por favor ingresa un mensaje.' : 'Please enter a message.');
      return;
    }
    setSubmitted(true);
    toast.success(isEs ? '¡Mensaje enviado con éxito! Gracias por tu retroalimentación.' : 'Message sent successfully! Thanks for your feedback.');
  };

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        
        {/* ENCABEZADO Y REGRESO */}
        <div className="mb-8 flex items-center justify-between font-mono">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-1.5 rounded-full border border-white/10 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
            {isEs ? 'Volver al Inicio' : 'Back to Home'}
          </Link>
          <span className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-white" />
            soporte@pdfblack.com
          </span>
        </div>

        {/* HERO TITULO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 font-mono">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-semibold mb-4">
            <MessageSquare className="w-3.5 h-3.5" />
            {isEs ? '005 / SOPORTE Y RETROALIMENTACIÓN' : '005 / SUPPORT & FEEDBACK'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 leading-tight font-sans">
            {isEs ? '¿Tienes dudas, sugerencias o reportes de errores?' : 'Questions, suggestions, or bug reports?'}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            {isEs 
              ? 'Tus comentarios nos ayudan a mejorar PDFBlack. Envíanos un mensaje o contáctanos directamente a nuestro correo de soporte.'
              : 'Your feedback helps us make PDFBlack better. Send us a message or email us directly.'}
          </p>
        </motion.div>

        {/* FORMULARIO DE CONTACTO */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl">
          {submitted ? (
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10 space-y-4 font-mono">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-emerald-400 border border-white/10 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white font-sans">{isEs ? '¡Mensaje Recibido!' : 'Message Received!'}</h3>
              <p className="text-zinc-400 text-xs max-w-md mx-auto leading-relaxed">
                {isEs 
                  ? 'Gracias por contactarte con el equipo de PDFBlack. Revisaremos tu sugerencia y te responderemos lo antes posible.'
                  : 'Thanks for contacting PDFBlack. We will review your message and reply as soon as possible.'}
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-4 inline-flex items-center gap-2 bg-white text-black hover:bg-zinc-200 font-semibold text-xs px-6 py-2.5 rounded-full transition-all font-sans cursor-pointer"
              >
                {isEs ? 'Enviar otro mensaje' : 'Send another message'}
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    {isEs ? 'Nombre completo' : 'Full Name'}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder={isEs ? "Ingresa tu nombre..." : "Enter your name..."}
                    className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    {isEs ? 'Correo electrónico' : 'Email address'}
                  </label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isEs ? "tu@correo.com" : "you@email.com"}
                    className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  {isEs ? 'Mensaje o Sugerencia' : 'Message or Feedback'}
                </label>
                <textarea 
                  rows={5}
                  required
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder={isEs ? "Escribe aquí tus comentarios, errores detectados o funciones que desees ver..." : "Write your feedback, bugs found or feature requests..."}
                  className="w-full bg-zinc-900 border border-white/10 focus:border-white/30 rounded-xl p-4 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {isEs ? 'Respuesta rápida en menos de 24 horas' : 'Fast response within 24 hours'}
                </span>

                <button 
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full font-sans font-semibold text-xs transition-all shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-black" />
                  {isEs ? 'Enviar Mensaje' : 'Send Message'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
