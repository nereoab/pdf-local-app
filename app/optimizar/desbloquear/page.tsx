'use client';

import dynamic from 'next/dynamic';
import { Loader2, ShieldCheck, Unlock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PdfUnlocker = dynamic(() => import('@/components/PdfUnlocker'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-zinc-400 font-mono text-xs">Cargando herramienta para desbloquear archivos PDF...</p>
    </div>
  ),
});

export default function DesbloquearPdfPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] bg-[#09090b]">
      <div className="w-full max-w-7xl">
        <PdfUnlocker />

        <div className="space-y-8 text-zinc-300 font-sans border-t border-white/10 pt-10 mt-10">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10"><Unlock className="w-5 h-5 text-white" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs ? '1. Cómo desbloquear un PDF' : '1. How to unlock a PDF'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {step:'01',es:'Sube tu PDF protegido con contraseña a la zona de carga.',en:'Upload your password-protected PDF to the upload zone.'},
                {step:'02',es:'Si tiene contraseña de usuario, ingrésala para descifrar el documento.',en:'If it has a user password, enter it to decrypt the document.'},
                {step:'03',es:'El motor detecta /Encrypt, descifra con AES-256/RC4 y restablece permisos /P.',en:'The engine detects /Encrypt, decrypts with AES-256/RC4, and resets /P permissions.'},
                {step:'04',es:'Haz clic en "Desbloquear PDF →" y descarga el documento sin restricciones.',en:'Click "Unlock PDF →" and download the unrestricted document.'},
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full w-fit">Paso {item.step}</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">{isEs ? item.es : item.en}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#09090b] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-amber-500/20 pb-4">
              <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs ? '2. Limitaciones y consejos útiles' : '2. Limitations & useful tips'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">✓ {isEs ? 'LO QUE PUEDES HACER' : 'WHAT YOU CAN DO'}</h4>
                {[isEs?'Eliminar contraseña de apertura para ver el PDF sin clave.':'Remove open password to view the PDF without a key.',isEs?'Restablecer permisos de impresión, copia y edición.':'Restore printing, copying, and editing permissions.',isEs?'Eliminar contraseña de propietario que bloquea modificación de formularios.':'Remove owner password that blocks form modification.',isEs?'Generar un PDF 1.7 sin /Encrypt ni restricciones.':'Generate a PDF 1.7 without /Encrypt or restrictions.'].map((t,i)=>(<div key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span><span>{t}</span></div>))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider border-b border-white/10 pb-2">💡 {isEs ? 'CONSEJOS' : 'TIPS'}</h4>
                {[isEs?'Solo funciona con archivos de los que eres propietario o tienes autorización.':'Only works with files you own or have authorization for.',isEs?'Si no conoces la contraseña de usuario, el motor no puede descifrar el PDF.':'If you don\'t know the user password, the engine cannot decrypt the PDF.',isEs?'Todo el proceso criptográfico usa la Web Crypto API nativa del navegador.':'The entire cryptographic process uses the browser\'s native Web Crypto API.',isEs?'El PDF desbloqueado permite búsqueda de texto e indexación.':'The unlocked PDF allows text search and indexing.'].map((t,i)=>(<div key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-amber-400 flex-shrink-0 mt-0.5">→</span><span>{t}</span></div>))}
              </div>
            </div>
          </div>
          <div className="bg-[#09090b] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 border-b border-emerald-500/20 pb-4">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30"><ShieldCheck className="w-5 h-5 text-emerald-400" /></div>
              <h2 className="text-lg font-bold text-white tracking-tight">{isEs?'3. ¿Qué sucede con tu documento al desbloquearlo?':'3. What happens to your document when unlocking it?'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">🖥️ {isEs?'Procesamiento 100% local':'100% local processing'}</strong><p className="text-[11px]">{isEs?'El descifrado se ejecuta en la RAM. Ninguna clave sale de tu dispositivo.':'Decryption runs in RAM. No key leaves your device.'}</p></div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">🔓 {isEs?'Eliminación del diccionario de cifrado':'Encryption dictionary removal'}</strong><p className="text-[11px]">{isEs?'Desvincula /Encrypt del trailer, descifra streams y restablece banderas /P.':'Detaches /Encrypt from the trailer, decrypts streams, and resets /P flags.'}</p></div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 space-y-1.5"><strong className="text-white font-bold text-xs block">📥 {isEs?'Descarga directa y segura':'Direct & secure download'}</strong><p className="text-[11px]">{isEs?'El PDF se genera localmente. Tu archivo original no se modifica.':'The PDF is generated locally. Your original file is not modified.'}</p></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}