import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD1iKq-cZz1zJT9HoCWCKjO-mEUczzMa6k',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'pdfblack-proy.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pdfblack-proy',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'pdfblack-proy.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '878586961850',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:878586961850:web:3469a31c2fb80fbd000783',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-L18LM8EQYJ',
};

// Inicializar Firebase solo una vez (evita error con Fast Refresh de Next.js)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Auth (disponible en cliente y servidor)
export const auth = getAuth(app);

// Analytics (solo en cliente — lazy init para evitar bloqueo SSR)
export async function getAnalyticsInstance() {
  if (typeof window === 'undefined') return null;
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
}

export default app;
