import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoFallbackKeyForBuildPrerender000',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'pdfblack-app.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pdfblack-app',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'pdfblack-app.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-DUMMYBUILD',
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
