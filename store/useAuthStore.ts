import { create } from 'zustand';

interface RegisteredUser {
  email: string;
  password: string;
  registeredAt: string;
  emailConfirmed: boolean;
}

// Datos del correo de confirmación pendiente
export interface PendingConfirmation {
  email: string;
  password: string;
  registeredAt: string;
  subject: string;
  body: string;
  sent: boolean;
}

interface AuthState {
  currentUser: RegisteredUser | null;
  registeredUsers: RegisteredUser[];
  pendingConfirmations: PendingConfirmation[];

  register: (email: string) => { success: boolean; message: string; password?: string };
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  confirmEmail: (email: string) => void;
  markConfirmationSent: (index: number) => void;
  clearPendingConfirmations: () => void;
}

// Generar contraseña aleatoria segura
function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  const length = 12;
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
  return password;
}

function loadFromStorage(): {
  currentUser: RegisteredUser | null;
  registeredUsers: RegisteredUser[];
  pendingConfirmations: PendingConfirmation[];
} {
  if (typeof window === 'undefined') {
    return { currentUser: null, registeredUsers: [], pendingConfirmations: [] };
  }
  try {
    const raw = localStorage.getItem('pdfblack-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        currentUser: parsed.currentUser || null,
        registeredUsers: parsed.registeredUsers || [],
        pendingConfirmations: parsed.pendingConfirmations || [],
      };
    }
  } catch {
    // ignorar
  }
  return { currentUser: null, registeredUsers: [], pendingConfirmations: [] };
}

function persistToStorage(state: {
  currentUser: RegisteredUser | null;
  registeredUsers: RegisteredUser[];
  pendingConfirmations: PendingConfirmation[];
}) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pdfblack-auth', JSON.stringify(state));
  } catch {
    // ignorar
  }
}

const initialState = loadFromStorage();

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initialState.currentUser,
  registeredUsers: initialState.registeredUsers,
  pendingConfirmations: initialState.pendingConfirmations,

  register: (email: string) => {
    const { registeredUsers, pendingConfirmations } = get();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      return { success: false, message: 'email_invalid' };
    }

    const exists = registeredUsers.some((u) => u.email === normalizedEmail);
    if (exists) {
      return { success: false, message: 'email_exists' };
    }

    const password = generatePassword();

    const newUser: RegisteredUser = {
      email: normalizedEmail,
      password,
      registeredAt: new Date().toISOString(),
      emailConfirmed: false,
    };

    // Crear correo de confirmación pendiente
    const domainName = 'PDFBLACK';
    const confirmation: PendingConfirmation = {
      email: normalizedEmail,
      password,
      registeredAt: newUser.registeredAt,
      subject: `Bienvenido a ${domainName} - Tus datos de acceso`,
      body: `
¡Bienvenido a ${domainName}!

Tu cuenta ha sido creada exitosamente. Estos son tus datos de acceso:

─────────────────────────────
  Correo:    ${normalizedEmail}
  Contraseña: ${password}
─────────────────────────────

Para iniciar sesión, visita: https://pdfblack.com/login

Todas las herramientas de PDF son 100% gratuitas y se procesan localmente en tu navegador. No se requiere verificación adicional para usar las herramientas.

Atentamente,
El equipo de ${domainName}
      `.trim(),
      sent: false,
    };

    const updatedUsers = [...registeredUsers, newUser];
    const updatedPending = [...pendingConfirmations, confirmation];
    const newState = {
      currentUser: newUser,
      registeredUsers: updatedUsers,
      pendingConfirmations: updatedPending,
    };
    set(newState);
    persistToStorage(newState);

    return { success: true, message: 'registered', password };
  },

  login: (email: string, password: string) => {
    const { registeredUsers } = get();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      return { success: false, message: 'email_invalid' };
    }

    const user = registeredUsers.find(
      (u) => u.email === normalizedEmail && u.password === password
    );

    if (!user) {
      // Verificar si el email existe pero la contraseña es incorrecta
      const emailExists = registeredUsers.some((u) => u.email === normalizedEmail);
      if (emailExists) {
        return { success: false, message: 'wrong_password' };
      }
      return { success: false, message: 'user_not_found' };
    }

    const newState = {
      currentUser: user,
      registeredUsers,
      pendingConfirmations: get().pendingConfirmations,
    };
    set(newState);
    persistToStorage(newState);

    return { success: true, message: 'logged_in' };
  },

  logout: () => {
    const { registeredUsers, pendingConfirmations } = get();
    const newState = { currentUser: null, registeredUsers, pendingConfirmations };
    set(newState);
    persistToStorage(newState);
  },

  confirmEmail: (email: string) => {
    const { registeredUsers, pendingConfirmations } = get();
    const updatedUsers = registeredUsers.map((u) =>
      u.email === email ? { ...u, emailConfirmed: true } : u
    );
    const newState = {
      currentUser: get().currentUser,
      registeredUsers: updatedUsers,
      pendingConfirmations,
    };
    set(newState);
    persistToStorage(newState);
  },

  markConfirmationSent: (index: number) => {
    const { pendingConfirmations, registeredUsers, currentUser } = get();
    const updatedPending = pendingConfirmations.map((c, i) =>
      i === index ? { ...c, sent: true } : c
    );
    const newState = {
      currentUser,
      registeredUsers,
      pendingConfirmations: updatedPending,
    };
    set(newState);
    persistToStorage(newState);
  },

  clearPendingConfirmations: () => {
    const { registeredUsers, currentUser } = get();
    const newState = {
      currentUser,
      registeredUsers,
      pendingConfirmations: [],
    };
    set(newState);
    persistToStorage(newState);
  },
}));