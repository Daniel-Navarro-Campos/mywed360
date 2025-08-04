import admin from 'firebase-admin';
import fs from 'fs';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// Deshabilitar el uso del emulador salvo que se indique explícitamente
// Esto evita errores de conexión (ECONNREFUSED) cuando el emulador no está arrancado.
if (process.env.FIRESTORE_EMULATOR_HOST && process.env.USE_FIRESTORE_EMULATOR !== 'true') {
  console.warn('⚠️  FIRESTORE_EMULATOR_HOST está definido pero USE_FIRESTORE_EMULATOR no es "true". Usando Firestore real.');
  delete process.env.FIRESTORE_EMULATOR_HOST;
}

// Detect whether we're in local dev with Firestore emulator or production with service account.
// If GOOGLE_APPLICATION_CREDENTIALS is provided and the file exists, use it. Otherwise allow
// Firebase Admin to fall back to application default credentials. When FIRESTORE_EMULATOR_HOST
// is set the Admin SDK automatically routes all calls to the emulator.

if (!admin.apps.length) {
  // Build init options dynamically to avoid passing invalid credential
  const initOptions = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  };

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    initOptions.credential = admin.credential.applicationDefault();
  }

  admin.initializeApp(initOptions);

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`⚙️  Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn('⚠️  GOOGLE_APPLICATION_CREDENTIALS not set. Firestore access will fail unless the emulator is running or Application Default Credentials are configured.');
  }
}

export const db = getFirestore();
