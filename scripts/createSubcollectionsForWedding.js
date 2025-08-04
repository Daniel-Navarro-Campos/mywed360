#!/usr/bin/env node
/**
 * Crea subcolecciones vacías (con un documento placeholder) para una boda.
 * Uso:
 *   node scripts/createSubcollectionsForWedding.js --weddingId=<id> --subs=comma,separated,list --key=/ruta/cred.json
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

function parseArgs() {
  const params = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.substring(2).split('=');
      params[k] = v ?? true;
    }
  }
  return params;
}

async function initAdmin(key) {
  if (admin.apps.length) return;
  let credential;
  if (key) {
    const p = path.isAbsolute(key) ? key : path.join(process.cwd(), key);
    if (!fs.existsSync(p)) {
      console.error('Credencial no encontrada:', p);
      process.exit(1);
    }
    credential = admin.credential.cert(require(p));
  } else {
    credential = admin.credential.applicationDefault();
  }
  admin.initializeApp({ credential });
}

(async () => {
  const { weddingId, subs, key } = parseArgs();
  if (!weddingId || !subs) {
    console.error('Uso: --weddingId=<id> --subs=a,b,c');
    process.exit(1);
  }
  await initAdmin(key);
  const db = admin.firestore();
  const subList = subs.split(',').map((s) => s.trim()).filter(Boolean);

  for (const sub of subList) {
    const placeholderRef = db.collection('weddings').doc(weddingId).collection(sub).doc('_placeholder');
    await placeholderRef.set({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log(`✅  Subcolección ${sub} creada`);
  }

  console.log('Completado.');
})();
