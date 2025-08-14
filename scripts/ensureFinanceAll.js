/*
  Asegura que TODAS las bodas tengan la subcolección finance/main.
  - Si no existe, crea weddings/{id}/finance/main con movements: []
  - Si existe, no toca movements; sólo añade updatedAt

  Uso:
    node scripts/ensureFinanceAll.js

  Requisitos:
  - Archivo de service account JSON en la raíz del proyecto o variable GOOGLE_APPLICATION_CREDENTIALS definida.
*/

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function initAdmin() {
  const envProject = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

  // 1) Intentar applicationDefault si GOOGLE_APPLICATION_CREDENTIALS está definida
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: envProject });
      return;
    }
  } catch (_) {}

  // 2) Buscar un JSON en la raíz del repo (este script está en scripts/)
  const repoRoot = path.resolve(__dirname, '..');
  const files = fs.readdirSync(repoRoot).filter(f => f.endsWith('.json'));
  if (!files.length) {
    throw new Error('No se encontró un archivo .json de service account en la raíz y no hay GOOGLE_APPLICATION_CREDENTIALS');
  }
  // Usar el primero que encontremos
  const saPath = path.join(repoRoot, files[0]);
  const serviceAccount = require(saPath);
  const initOptions = { credential: admin.credential.cert(serviceAccount) };
  if (envProject || serviceAccount.project_id) {
    initOptions.projectId = envProject || serviceAccount.project_id;
  }
  console.log('⚙️  Inicializando Firebase Admin SDK para proyecto:', initOptions.projectId);
  admin.initializeApp(initOptions);
}

async function ensureFinanceAll() {
  initAdmin();
  const db = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;

  const weddingsSnap = await db.collection('weddings').get();
  console.log(`Encontradas ${weddingsSnap.size} bodas`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const docSnap of weddingsSnap.docs) {
    const wid = docSnap.id;
    const ref = db.doc(`weddings/${wid}/finance/main`);
    try {
      const financeSnap = await ref.get();
      if (!financeSnap.exists) {
        await ref.set({
          movements: [],
          createdAt: FieldValue.serverTimestamp(),
          ensuredBy: 'ensureFinanceAll.js',
        }, { merge: true });
        console.log(`🆕  Creado finance/main para ${wid}`);
        created++;
      } else {
        console.log(`✔️  Finance ya existía en ${wid}`);
        await ref.set({
          updatedAt: FieldValue.serverTimestamp(),
          ensuredBy: 'ensureFinanceAll.js',
        }, { merge: true });
        console.log(`  Actualizado finance/main para ${wid}`);
        console.log(`  Detalles: ${JSON.stringify({ updatedAt: FieldValue.serverTimestamp(), ensuredBy: 'ensureFinanceAll.js' })}`);
        updated++;
      }
    } catch (e) {
      failed++;
      console.error(`Fallo en ${wid}:`, e.message || e);
    }
  }

  console.log(`Hecho. Creados: ${created}, Actualizados: ${updated}, Fallidos: ${failed}`);
  process.exit(failed ? 1 : 0);
}

ensureFinanceAll().catch(err => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
