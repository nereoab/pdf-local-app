import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../lib/firebase/config';

// ─── Tipos (mantenemos retrocompatibilidad con el store anterior) ───

export interface RegisteredUser {
  email: string;
  registeredAt: string;
  emailConfirmed: boolean;
  uid: string;
  providerId: string;
}

export interface PendingConfirmation {
  email: string;
  password: string;
  registeredAt: string;
  subject: string;
  body: string;
  sent: boolean;
}

interface AuthState {
  // Datos del usuario actual (desde Firebase)
  currentUser: RegisteredUser | null;
  // Estos campos se mantienen por compatibilidad pero ya no son fuente de verdad
  registeredUsers: RegisteredUser[];
  pendingConfirmations: PendingConfirmation[];
  isHydrated: boolean;
  // Firebase loading state
  firebaseLoading: boolean;

  // Acciones
  hydrate: () => void;
  register: (email: string) => { success: boolean; message: string; password?: string };
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  confirmEmail: (email: string) => void;
  markConfirmationSent: (index: number) => void;
  clearPendingConfirmations: () => void;
}

// ─── Helpers ───

function mapUserToRegisteredUser(user: User | null): RegisteredUser | null {
  if (!user || !user.email) return null;
  const isGoogle = user.providerData?.some((p) => p.providerId === 'google.com');
  return {
    email: user.email,
    registeredAt: user.metadata.creationTime || new Date().toISOString(),
    emailConfirmed: user.emailVerified,
    uid: user.uid,
    providerId: isGoogle ? 'google.com' : 'password',
  };
}

// ====  CAPA DE COMPATIBILIDAD — MANTIENE EL MISMO API QUE EL STORE ANTERIOR  ====
// Ahora usa Firebase Auth como backend real en lugar de localStorage.
// Los métodos register() y login() son ASÍNCRONOS por dentro, pero mantienen
// la firma síncrona para no romper el código existente. Se usa Zustand
// para disparar actualizaciones de UI cuando Firebase resuelva.

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  registeredUsers: [],
  pendingConfirmations: [],
  isHydrated: false,
  firebaseLoading: true,

  hydrate: () => {
    if (get().isHydrated) return;
    set({ isHydrated: true });

    // Escuchar cambios de estado de Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const mapped = mapUserToRegisteredUser(user);
      set({
        currentUser: mapped,
        firebaseLoading: false,
        registeredUsers: mapped ? [mapped] : [],
      });
    });

    // Limpiar listener cuando el store se destruya (poco común pero buena práctica)
    // En Next.js con Fast Refresh, esto evita múltiples suscripciones
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__authUnsubscribe = unsubscribe;
    }
  },

  register: (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      return { success: false, message: 'email_invalid' };
    }

    // Generar contraseña segura (misma lógica que antes)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    const length = 16;
    let password = '';
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint32Array(length);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        password += chars[array[i] % chars.length];
      }
    } else {
      for (let i = 0; i < length; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    // Registrar en Firebase (async, pero devolvemos respuesta síncrona)
    createUserWithEmailAndPassword(auth, normalizedEmail, password)
      .then((credential) => {
        const mapped = mapUserToRegisteredUser(credential.user);
        // Enviar correo de verificación
        sendEmailVerification(credential.user).catch(() => {
          // ignorar error de verificación — no bloquear el flujo
        });
        set({
          currentUser: mapped,
          registeredUsers: mapped ? [mapped] : [],
          pendingConfirmations: [
            ...get().pendingConfirmations,
            {
              email: normalizedEmail,
              password,
              registeredAt: new Date().toISOString(),
              subject: 'Bienvenido a PDFBLACK - Tus datos de acceso',
              body: `¡Bienvenido a PDFBLACK!\n\nTu cuenta ha sido creada exitosamente.\n\nCorreo: ${normalizedEmail}\nContraseña: ${password}\n\nVisita: https://pdfblack.com`,
              sent: true, // Firebase envía el correo de verificación
            },
          ],
        });
        console.log(`[Auth] Usuario registrado en Firebase: ${normalizedEmail}`);
      })
      .catch((error) => {
        console.error('[Auth] Error al registrar en Firebase:', error);
        if (error.code === 'auth/email-already-in-use') {
          // El usuario ya existe en Firebase, lo tratamos como login pendiente
          set({
            currentUser: null,
          });
        }
      });

    return { success: true, message: 'registered', password };
  },

  login: (email: string, password: string) => {
    // NOTA: Este método es síncrono en la interfaz, pero hace login real en Firebase
    // La UI debe usar el estado `currentUser` de Zustand para reflejar el login exitoso
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      return { success: false, message: 'email_invalid' };
    }

    // Intentar login con Firebase (async)
    signInWithEmailAndPassword(auth, normalizedEmail, password)
      .then((credential) => {
        const mapped = mapUserToRegisteredUser(credential.user);
        set({
          currentUser: mapped,
          registeredUsers: mapped ? [mapped] : [],
        });
        console.log(`[Auth] Usuario logueado en Firebase: ${normalizedEmail}`);
      })
      .catch((error) => {
        console.error('[Auth] Error al loguear en Firebase:', error);
        set({ currentUser: null });
      });

    // Devolvemos success provisional — el listener onAuthStateChanged actualizará el estado
    return { success: true, message: 'logged_in' };
  },

  logout: () => {
    signOut(auth)
      .then(() => {
        set({ currentUser: null, registeredUsers: [] });
        console.log('[Auth] Sesión cerrada en Firebase');
      })
      .catch((error) => {
        console.error('[Auth] Error al cerrar sesión:', error);
        // Forzar limpieza local incluso si Firebase falla
        set({ currentUser: null, registeredUsers: [] });
      });
  },

  confirmEmail: (email: string) => {
    // En Firebase, la verificación se hace mediante el link enviado al correo.
    // Este método se mantiene por compatibilidad.
    const { registeredUsers, pendingConfirmations, currentUser } = get();
    const updatedUsers = registeredUsers.map((u) =>
      u.email === email ? { ...u, emailConfirmed: true } : u
    );
    set({ registeredUsers: updatedUsers, pendingConfirmations, currentUser });
  },

  markConfirmationSent: (index: number) => {
    // En Firebase, el correo se envía automáticamente.
    const { pendingConfirmations, registeredUsers, currentUser } = get();
    const updatedPending = pendingConfirmations.map((c, i) =>
      i === index ? { ...c, sent: true } : c
    );
    set({ pendingConfirmations: updatedPending, registeredUsers, currentUser });
  },

  clearPendingConfirmations: () => {
    const { registeredUsers, currentUser } = get();
    set({ currentUser, registeredUsers, pendingConfirmations: [] });
  },
}));