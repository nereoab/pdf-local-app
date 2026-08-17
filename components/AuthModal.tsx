'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Mail, LogIn, UserPlus, ShieldCheck, Sparkles, Lock,
  Eye, EyeOff, Copy, Check, KeyRound, Send, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuthStore } from '../store/useAuthStore';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  AuthError,
} from 'firebase/auth';
import { auth } from '../lib/firebase/config';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = 'form' | 'registrationSuccess' | 'resetPassword';

function parseAuthError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Ha ocurrido un error inesperado.';
  const fError = error as AuthError & { code?: string };
  const code = fError.code || '';
  const errorMap: Record<string, string> = {
    'auth/email-already-in-use': 'Este correo ya está registrado. Inicia sesión en su lugar.',
    'auth/invalid-email': 'Por favor ingresa un correo electrónico válido.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-not-found': 'No se encontró una cuenta con este correo. Regístrate primero.',
    'auth/wrong-password': 'Contraseña incorrecta. Intenta de nuevo.',
    'auth/invalid-credential': 'Credenciales inválidas. Verifica tu correo y contraseña.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    'auth/network-request-failed': 'Error de conexión. Revisa tu internet.',
    'auth/popup-closed-by-user': 'Inicio de sesión cancelado. Intenta de nuevo.',
    'auth/popup-blocked': 'El popup fue bloqueado. Permite ventanas emergentes para este sitio.',
    'auth/operation-not-allowed': 'Este método de inicio de sesión no está habilitado.',
  };
  return errorMap[code] || `Error: ${fError.message || 'desconocido'}`;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const { user, loading: fbLoading } = useFirebaseAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');
  const [step, setStep] = useState<ModalStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [authError, setAuthError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Si el usuario ya está logueado, cerrar el modal
  useEffect(() => {
    if (isOpen && user && step === 'form') {
      onClose();
      toast.success(isEs ? 'Ya has iniciado sesión.' : 'You are already logged in.');
    }
  }, [isOpen, user, step, onClose, isEs]);

  // Reset al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => {
        setStep('form');
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setIsSubmitting(false);
        setGeneratedPassword('');
        setCopied(false);
        setAuthError('');
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const modal = modalRef.current;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen, step, activeTab]);

  // ─── REGISTRO CON FIREBASE ───
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;
    setAuthError('');
    setIsSubmitting(true);

    // Generar contraseña
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    const pwdLength = 16;
    let pwd = '';
    const array = new Uint32Array(pwdLength);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < pwdLength; i++) pwd += chars[array[i] % chars.length];

    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), pwd);
      // Enviar correo de verificación
      await sendEmailVerification(credential.user);
      setGeneratedPassword(pwd);
      setStep('registrationSuccess');
    } catch (error: unknown) {
      const msg = parseAuthError(error);
      setAuthError(msg);
      toast.error(msg);
    }

    setIsSubmitting(false);
  };

  // ─── LOGIN CON FIREBASE ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isSubmitting) return;
    setAuthError('');
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      toast.success(isEs ? '¡Bienvenido de nuevo!' : 'Welcome back!');
      onClose();
    } catch (error: unknown) {
      const msg = parseAuthError(error);
      setAuthError(msg);
      toast.error(msg);
    }

    setIsSubmitting(false);
  };

  // ─── LOGIN CON GOOGLE ───
  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
    setAuthError('');
    setIsSubmitting(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      toast.success(isEs ? '¡Bienvenido!' : 'Welcome!');
      onClose();
    } catch (error: unknown) {
      const msg = parseAuthError(error);
      setAuthError(msg);
      toast.error(msg);
    }

    setIsSubmitting(false);
  };

  const handleCopyPassword = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success(isEs ? 'Contraseña copiada' : 'Password copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseAfterRegistration = () => {
    setStep('form');
    onClose();
    toast.success(
      isEs
        ? 'Revisa tu correo para verificar tu cuenta. Ya puedes usar todas las herramientas.'
        : 'Check your email to verify your account. You can already use all tools.'
    );
  };

  // ─── BOTÓN DE GOOGLE ───
  const GoogleButton = () => (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isSubmitting}
      className="w-full flex items-center justify-center gap-3 bg-white border border-white/20 text-gray-900 hover:bg-gray-100 disabled:opacity-50 px-4 py-2.5 rounded-xl font-sans font-semibold text-sm transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed"
    >
      {/* Google Logo SVG inline */}
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M23.766 12.276c0-.815-.066-1.636-.207-2.438H12.24v4.62h6.482a5.554 5.554 0 01-2.408 3.648v3.014h3.882c2.274-2.094 3.57-5.183 3.57-8.844z" fill="#4285F4"/>
        <path d="M12.24 24c3.24 0 5.964-1.075 7.954-2.916l-3.882-3.014c-1.075.726-2.454 1.156-4.072 1.156-3.126 0-5.772-2.112-6.72-4.956h-3.996v3.102C3.744 21.204 7.704 24 12.24 24z" fill="#34A853"/>
        <path d="M5.52 14.274a7.202 7.202 0 01-.378-2.274c0-.792.138-1.56.378-2.274V6.624H1.524A11.962 11.962 0 000 12c0 1.938.468 3.768 1.284 5.376l4.236-3.102z" fill="#FBBC05"/>
        <path d="M12.24 4.656c1.764 0 3.342.606 4.59 1.794l3.432-3.432C18.198 1.236 15.474 0 12.24 0 7.704 0 3.744 2.796 1.524 6.624l4.236 3.102c.948-2.844 3.594-4.956 6.72-4.956z" fill="#EA4335"/>
      </svg>
      {isEs ? 'Continuar con Google' : 'Continue with Google'}
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key="auth-modal-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pointer-events-auto w-full max-w-md bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={isEs ? 'Iniciar sesión o registrarse' : 'Log in or sign up'}
            >
              {/* Header */}
              <div className="bg-zinc-900/80 border-b border-white/10 p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white text-black p-2.5 rounded-xl shadow-md" aria-hidden="true">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-sans tracking-tight">
                      {isEs ? 'Mi Cuenta' : 'My Account'}
                    </h2>
                    <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                      {isEs ? 'FIREBASE AUTH • SEGURO' : 'FIREBASE AUTH • SECURE'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  aria-label={isEs ? 'Cerrar ventana' : 'Close modal'}
                  ref={firstFocusableRef}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
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
                        ? 'Guarda tu contraseña segura. También te hemos enviado un correo de verificación.'
                        : 'Save your secure password. We also sent you a verification email.'}
                    </p>
                  </div>

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
                          data-copy-btn
                          className="flex-shrink-0 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                          aria-label={isEs ? 'Copiar contraseña' : 'Copy password'}
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl" role="alert">
                    <Send className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-300/80 font-sans leading-relaxed">
                      {isEs
                        ? 'Revisa tu bandeja de entrada y haz clic en el enlace de verificación. Si no lo encuentras, revisa la carpeta de spam.'
                        : 'Check your inbox and click the verification link. If you don\'t see it, check your spam folder.'}
                    </p>
                  </div>

                  <button
                    onClick={handleCloseAfterRegistration}
                    className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-xl font-sans font-semibold text-sm transition-all cursor-pointer shadow-md"
                    ref={lastFocusableRef}
                  >
                    <Check className="w-4 h-4" />
                    {isEs ? 'Entendido, continuar' : 'Got it, continue'}
                  </button>
                </div>
              ) : (
                <>
                  {/* ============ TABS ============ */}
                  <div className="flex border-b border-white/10" role="tablist">
                    <button
                      onClick={() => { setActiveTab('register'); setEmail(''); setPassword(''); setAuthError(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-mono font-semibold transition-all cursor-pointer ${
                        activeTab === 'register'
                          ? 'text-white border-b-2 border-white bg-white/5'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                      }`}
                      role="tab"
                      aria-selected={activeTab === 'register'}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {isEs ? 'REGISTRARSE' : 'SIGN UP'}
                    </button>
                    <button
                      onClick={() => { setActiveTab('login'); setEmail(''); setPassword(''); setAuthError(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-mono font-semibold transition-all cursor-pointer ${
                        activeTab === 'login'
                          ? 'text-white border-b-2 border-white bg-white/5'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                      }`}
                      role="tab"
                      aria-selected={activeTab === 'login'}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      {isEs ? 'INICIAR SESIÓN' : 'LOG IN'}
                    </button>
                  </div>

                  {/* ============ FORM ============ */}
                  <form
                    onSubmit={activeTab === 'register' ? handleRegister : handleLogin}
                    className="p-6 space-y-4"
                    noValidate
                  >
                    {/* Aviso de opcionalidad */}
                    <div className="flex items-start gap-2.5 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl" role="note">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-emerald-300/80 font-sans leading-relaxed">
                        {isEs
                          ? 'El registro es opcional. Herramientas 100% gratis. Autenticación segura con Firebase.'
                          : 'Registration is optional. 100% free tools. Secure authentication with Firebase.'}
                      </p>
                    </div>

                    {/* Error banner */}
                    {authError && (
                      <div className="flex items-start gap-2.5 p-3 bg-red-500/5 border border-red-500/15 rounded-xl" role="alert">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-300/90 font-sans leading-relaxed">{authError}</p>
                      </div>
                    )}

                    {/* Google Button */}
                    <GoogleButton />

                    {/* Separador */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-[10px] font-mono text-zinc-600 uppercase">
                        {isEs ? 'o con correo' : 'or with email'}
                      </span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="auth-email" className="block text-xs font-mono font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                        {isEs ? 'Correo Electrónico' : 'Email Address'}
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          ref={inputRef}
                          id="auth-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={isEs ? 'tu@correo.com' : 'you@email.com'}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    {/* Password (login y registro) */}
                    {activeTab === 'login' && (
                      <div>
                        <label htmlFor="auth-password" className="block text-xs font-mono font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                          {isEs ? 'Contraseña' : 'Password'}
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            id="auth-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
                            autoComplete="current-password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                            aria-label={showPassword ? (isEs ? 'Ocultar contraseña' : 'Hide password') : (isEs ? 'Mostrar contraseña' : 'Show password')}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Nota para registro */}
                    {activeTab === 'register' && (
                      <p className="text-[10px] text-zinc-500 font-mono text-center">
                        {isEs
                          ? 'Se generará una contraseña segura automáticamente. Recibirás un correo de verificación de Firebase.'
                          : 'A secure password will be generated automatically. You will receive a Firebase verification email.'}
                      </p>
                    )}

                    {/* Submit */}
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
                        <span className="flex items-center gap-2" role="status">
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

                    {/* Beneficios */}
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
                          {isEs ? 'Historial de herramientas usadas.' : 'Tool usage history.'}
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          {isEs ? 'Acceso a funciones premium futuras.' : 'Access to future premium features.'}
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          {isEs ? 'Notificaciones sobre nuevas herramientas.' : 'Notifications about new tools.'}
                        </li>
                      </ul>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}