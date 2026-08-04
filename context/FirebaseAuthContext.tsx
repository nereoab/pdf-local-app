'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
  UserCredential,
  AuthError,
} from 'firebase/auth';
import { auth } from '../lib/firebase/config';
import {
  getUserPreferences,
  saveUserPreferences,
  UserPreferences,
} from '../lib/firebase/firestore';
import { useActivityStore } from '../store/useActivityStore';

// ─── Tipos ───

export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  providerId: string;
  createdAt: string;
}

interface AuthContextValue {
  /** Usuario actual autenticado con Firebase (null si no hay sesión) */
  user: AuthUser | null;
  /** true mientras se restaura la sesión desde Firebase */
  loading: boolean;
  /** true cuando el usuario ya está logueado */
  isLoggedIn: boolean;
  /** Registro con email + contraseña */
  registerWithEmail: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  /** Login con email + contraseña */
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  /** Login con popup de Google */
  loginWithGoogle: () => Promise<{ success: boolean; message: string; user?: User }>;
  /** Cerrar sesión */
  logout: () => Promise<void>;
  /** Enviar correo de verificación */
  sendVerificationEmail: () => Promise<{ success: boolean; message: string }>;
  /** Enviar correo de recuperación de contraseña */
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  /** Token ID para APIs server-side */
  getIdToken: () => Promise<string | null>;
  /** Preferencias del usuario desde Firestore */
  preferences: UserPreferences | null;
  /** Guardar preferencias del usuario en Firestore */
  savePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  /** Cargar preferencias desde Firestore */
  loadPreferences: () => Promise<void>;
}

// ─── Helpers ───

function mapFirebaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const isGoogleProvider = user.providerData.some((p) => p.providerId === 'google.com');
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName || user.email?.split('@')[0] || null,
    photoURL: user.photoURL || null,
    providerId: isGoogleProvider ? 'google.com' : 'password',
    createdAt: user.metadata.creationTime || new Date().toISOString(),
  };
}

function parseAuthError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Ha ocurrido un error inesperado.';
  const fError = error as AuthError & { code?: string };
  const code = fError.code || '';
  // Mapeo de códigos de error de Firebase Auth a mensajes en español
  const errorMap: Record<string, string> = {
    'auth/email-already-in-use': 'Este correo ya está registrado. Inicia sesión en su lugar.',
    'auth/invalid-email': 'Por favor ingresa un correo electrónico válido.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-not-found': 'No se encontró una cuenta con este correo. Regístrate primero.',
    'auth/wrong-password': 'Contraseña incorrecta. Intenta de nuevo.',
    'auth/invalid-credential': 'Credenciales inválidas. Verifica tu correo y contraseña.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/network-request-failed': 'Error de conexión. Revisa tu internet.',
    'auth/popup-closed-by-user': 'Inicio de sesión cancelado. Intenta de nuevo.',
    'auth/popup-blocked': 'El popup fue bloqueado. Permite ventanas emergentes para este sitio.',
    'auth/operation-not-allowed': 'Este método de inicio de sesión no está habilitado.',
    'auth/requires-recent-login': 'Esta operación requiere un inicio de sesión reciente.',
  };
  return errorMap[code] || `Error de autenticación: ${fError.message || 'desconocido'}`;
}

// ─── Contexto ───

const FirebaseAuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ───

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  // Escuchar cambios de estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setUser(mapFirebaseUser(fbUser));

      if (fbUser) {
        // Cargar preferencias desde Firestore
        try {
          const prefs = await getUserPreferences(fbUser.uid);
          setPreferences(prefs);
        } catch {
          setPreferences(null);
        }

        // Sincronizar actividad desde Firestore
        try {
          const activityStore = useActivityStore.getState();
          if (!activityStore.hasSyncedFromFirestore) {
            await activityStore.syncFromFirestore(fbUser.uid);
          }
        } catch {
          // sin conexión, usar datos locales
        }
      } else {
        setPreferences(null);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const credential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Enviar correo de verificación automáticamente
      await sendEmailVerification(credential.user);
      return { success: true, message: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.', user: credential.user };
    } catch (error: unknown) {
      return { success: false, message: parseAuthError(error) };
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const credential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, message: 'Inicio de sesión exitoso.', user: credential.user };
    } catch (error: unknown) {
      return { success: false, message: parseAuthError(error) };
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential: UserCredential = await signInWithPopup(auth, provider);
      return { success: true, message: 'Inicio de sesión con Google exitoso.', user: credential.user };
    } catch (error: unknown) {
      return { success: false, message: parseAuthError(error) };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    if (!firebaseUser) return { success: false, message: 'No hay sesión activa.' };
    try {
      await sendEmailVerification(firebaseUser);
      return { success: true, message: 'Correo de verificación enviado. Revisa tu bandeja de entrada.' };
    } catch (error: unknown) {
      return { success: false, message: parseAuthError(error) };
    }
  }, [firebaseUser]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Correo de recuperación enviado. Revisa tu bandeja de entrada.' };
    } catch (error: unknown) {
      // Por seguridad, no revelar si el email existe o no
      return { success: false, message: parseAuthError(error) };
    }
  }, []);

  const getIdToken = useCallback(async () => {
    if (!firebaseUser) return null;
    return firebaseUser.getIdToken();
  }, [firebaseUser]);

  const loadPreferences = useCallback(async () => {
    if (firebaseUser) {
      try {
        const prefs = await getUserPreferences(firebaseUser.uid);
        setPreferences(prefs);
      } catch {
        // sin conexión
      }
    }
  }, [firebaseUser]);

  const savePreferences = useCallback(async (prefs: Partial<UserPreferences>) => {
    if (!firebaseUser) return;
    try {
      await saveUserPreferences(firebaseUser.uid, prefs);
      // Actualizar estado local inmediatamente
      setPreferences((prev) => ({ ...prev, ...prefs } as UserPreferences));
    } catch {
      // sin conexión — guardar localmente como fallback
      setPreferences((prev) => ({ ...prev, ...prefs } as UserPreferences));
    }
  }, [firebaseUser]);

  const value: AuthContextValue = {
    user,
    loading,
    isLoggedIn: !!user,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
    sendVerificationEmail,
    resetPassword,
    getIdToken,
    preferences,
    savePreferences,
    loadPreferences,
  };

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

// ─── Hook ───

export function useFirebaseAuth(): AuthContextValue {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth debe usarse dentro de <FirebaseAuthProvider>');
  }
  return context;
}

export default FirebaseAuthContext;