import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, getMetadata } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD1iKq-cZz1zJT9HoCWCKjO-mEUczzMa6k',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'pdfblack-proy.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pdfblack-proy',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'pdfblack-proy.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '878586961850',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:878586961850:web:3469a31c2fb80fbd000783',
};

function getStorageInstance() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getStorage(app);
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export interface ServerShareMetadata {
  shareId: string;
  originalName: string;
  fileSize: number;
  formattedSize: string;
  tool: string;
  uploadedAt?: string;
  expiresAt?: string;
}

export async function getServerShareMetadata(shareId: string): Promise<ServerShareMetadata | null> {
  if (!shareId || !/^[a-z0-9]{4,20}$/i.test(shareId)) {
    return null;
  }

  try {
    const storage = getStorageInstance();
    const fileRef = ref(storage, `temp-shares/${shareId.toLowerCase()}`);
    const meta = await getMetadata(fileRef);

    const custom = meta.customMetadata || {};
    const size = meta.size || parseInt(custom.fileSize || '0', 10);
    const originalName = custom.originalName || 'documento.pdf';
    const tool = custom.toolTitle || 'PDFBlack';

    return {
      shareId,
      originalName,
      fileSize: size,
      formattedSize: formatBytes(size),
      tool,
      uploadedAt: custom.uploadedAt,
      expiresAt: custom.expiresAt,
    };
  } catch (error) {
    console.warn(`[getServerShareMetadata] No se pudo obtener metadata para ${shareId}:`, error);
    return null;
  }
}
