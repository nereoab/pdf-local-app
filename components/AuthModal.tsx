'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, LogIn, UserPlus, ShieldCheck, Sparkles, Lock, Eye, EyeOff, Copy, Check, KeyRound, Send } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = 'form' | 'registrationSuccess';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const { register, login } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');
  const [step, setStep] = useState<ModalStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setIsSubmitting(false);
      setGeneratedPassword('');
      setCopied(false);
      if (inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = register(email);

    if (result.success && result.password) {
      setGeneratedPassword(result.password);
      setStep('registrationSuccess');
    } else if (result.message === 'email_exists') {
      toast.error(isEs ? 'Este correo ya está registrado. Inicia sesión en su lugar.' : 'This email is already registered. Log in instead.');
      setActiveTab('login');
    } else {
      toast.error(isEs ? 'Por favor ingresa un correo electrónico válido.' : 'Please enter a valid email address.');
    }

    setIsSubmitting(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = login(email, password);

    if (result.success) {
      toast.success(isEs ? '¡Bienvenido de nuevo!' : 'Welcome back!');
      onClose();
    } else if (result.message === 'wrong_password') {
      toast.error(isEs ? 'Contraseña incorrecta. Intenta de nuevo.' : 'Wrong password. Please try again.');
    } else if (result.message === 'user_not_found') {
      toast.error(isEs ? 'Correo no encontrado. Regístrate primero.' : 'Email not found. Please register first.');
      setActiveTab('register');
    } else {
      toast.error(isEs ? 'Por favor ingresa un correo electrónico válido.' : 'Please enter a valid email address.');
    }

    setIsSubmitting(false);
  };

  const handleCopyPassword = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success(isEs ? 'Contraseña copiada al portapapeles' : 'Password copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseAfterRegistration = () => {
    setStep('form');
    onClose();
    toast.success(
      isEs
        ? 'Cuando tengamos el dominio, recibirás un correo con tus datos de acceso.'
        : 'Once we have the domain, you will receive an email with your login details.'
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pointer-events-auto w-full max-w-md bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-zinc-900/80 border-b border-white/10 p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white text-black p-2.5 rounded-xl shadow-md">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-sans tracking-tight">
                      {isEs ? 'Mi Cuenta' : 'My Account'}
                    </h2>
                    <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                      {isEs ? '100% OPCIONAL • SIN COSTO' : '100% OPTIONAL • FREE'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ============ PANTALLA DE REGISTRO EXITOSO ============ */}
              {step === 'registrationSuccess' ? (
                <div className="p-6 space-y-5">
                  <div className="text-center">
                    <div className="mx-auto w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
                      <KeyRound className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white font-sans mb-1">
                      {isEs ? '¡Registro exitoso!' : 'Registration successful!'}
                    </h3>
                    <p className="text-xs text-zinc-400 font-sans">
                      {isEs
                        ? 'Guarda tu contraseña. También recibirás un correo de confirmación con estos datos.'
                        : 'Save your password. You will also receive a confirmation email with these details.'}
                    </p>
                  </div>

                  {/* Datos de acceso */}
                  <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 space-y-3">
                    <div>
                      <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                        {isEs ? 'Correo Electrónico' : 'Email'}
                      </span>
                      <p className="text-sm font-mono text-white break-all">{email}</p>
                    </div>
                    <div className="border-t border-white/5 pt-3">
                      <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                        {isEs ? 'Contraseña' : 'Password'}
                      </span>
                      <div className="flex items-center gap-2 bg-[#09090b] border border-white/10 rounded-lg px-3 py-2">
                        <code className="flex-1 text-sm font-mono text-emerald-400 select-all break-all">
                          {generatedPassword}
                        </code>
                        <button
                          onClick={handleCopyPassword}
                          className="flex-shrink-0 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                          title={isEs ? 'Copiar contraseña' : 'Copy password'}
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Aviso de correo pendiente */}
                  <div className="flex items-start gap-2.5 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <Send className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-300/80 font-sans leading-relaxed">
                      {isEs
                        ? 'El correo de confirmación se enviará cuando configuremos el dominio y el servidor de email corporativo. Tus datos ya están guardados de forma segura.'
                        : 'The confirmation email will be sent once we configure the domain and corporate email server. Your data is already securely stored.'}
                    </p>
                  </div>

                  <button
                    onClick={handleCloseAfterRegistration}
                    className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-xl font-sans font-semibold text-sm transition-all cursor-pointer shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    {isEs ? 'Entendido, continuar' : 'Got it, continue'}
                  </button>
                </div>
              ) : (
                <>
                  {/* ============ TABS ============ */}
                  <div className="flex border-b border-white/10">
                    <button
                      onClick={() => { setActiveTab('register'); setEmail(''); setPassword(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-mono font-semibold transition-all cursor-pointer ${
                        activeTab === 'register'
                          ? 'text-white border-b-2 border-white bg-white/5'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {isEs ? 'REGISTRARSE' : 'SIGN UP'}
                    </button>
                    <button
                      onClick={() => { setActiveTab('login'); setEmail(''); setPassword(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-mono font-semibold transition-all cursor-pointer ${
                        activeTab === 'login'
                          ? 'text-white border-b-2 border-white bg-white/5'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      {isEs ? 'INICIAR SESIÓN' : 'LOG IN'}
                    </button>
                  </div>

                  {/* ============ FORM ============ */}
                  <form onSubmit={activeTab === 'register' ? handleRegister : handleLogin} className="p-6 space-y-4">
                    {/* Aviso de opcionalidad */}
                    <div className="flex items-start gap-2.5 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-emerald-300/80 font-sans leading-relaxed">
                        {isEs
                          ? 'El registro es completamente opcional. Todas las herramientas siguen siendo 100% gratis y sin necesidad de cuenta.'
                          : 'Registration is completely optional. All tools remain 100% free and no account is required.'}
                      </p>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-mono font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                        {isEs ? 'Correo Electrónico' : 'Email Address'}
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          ref={inputRef}
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={isEs ? 'tu@correo.com' : 'you@email.com'}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    {/* Password (solo en login) */}
                    {activeTab === 'login' && (
                      <div>
                        <label className="block text-xs font-mono font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                          {isEs ? 'Contraseña' : 'Password'}
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono mt-1.5">
                          {isEs
                            ? 'Ingresa la contraseña que recibiste al registrarte.'
                            : 'Enter the password you received when registering.'}
                        </p>
                      </div>
                    )}

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={
                        activeTab === 'register'
                          ? !email.trim() || isSubmitting
                          : !email.trim() || !password.trim() || isSubmitting
                      }
                      className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 px-4 py-2.5 rounded-xl font-sans font-semibold text-sm transition-all cursor-pointer shadow-md disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {isEs ? 'Procesando...' : 'Processing...'}
                        </span>
                      ) : activeTab === 'register' ? (
                        <>
                          <UserPlus className="w-4 h-4" />
                          {isEs ? 'Crear Cuenta Gratis' : 'Create Free Account'}
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          {isEs ? 'Iniciar Sesión' : 'Log In'}
                        </>
                      )}
                    </button>

                    {/* Info extra para registro */}
                    {activeTab === 'register' && (
                      <p className="text-[10px] text-zinc-500 font-mono text-center">
                        {isEs
                          ? 'Se generará una contraseña segura automáticamente y recibirás un correo de confirmación.'
                          : 'A secure password will be generated automatically and you will receive a confirmation email.'}
                      </p>
                    )}

                    {/* Beneficios del registro */}
                    <div className="border-t border-white/5 pt-4 mt-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3 h-3 text-zinc-400" />
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                          {isEs ? 'Beneficios del registro' : 'Registration Benefits'}
                        </span>
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-zinc-400 font-sans">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          {isEs ? 'Guarda tu historial de herramientas usadas.' : 'Save your tool usage history.'}
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          {isEs ? 'Accede a funciones premium cuando estén disponibles.' : 'Access premium features when available.'}
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          {isEs ? 'Recibe notificaciones sobre nuevas herramientas.' : 'Receive notifications about new tools.'}
                        </li>
                      </ul>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}