#!/usr/bin/env node
/**
 * addPlannerIdToWeddings.js
 * ----------------------------------------------
 * Añade un UID de planner al campo `plannerIds` en TODOS los
 * documentos de la colección `weddings`.
 *
 * Uso:
 *  node scripts/addPlannerIdToWeddings.js --uid=<PLANNER_UID> [--key=/ruta/cred.json]
 *
 * - Si el documento ya tiene el UID dentro de `plannerIds`, se omite.
 * - Si `plannerIds` no existe se crea con el UID.
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

function parseArgs() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--')) {
      const [k, v] = a.substring(2).split('=');
      args[k] = v || true;
    }
  }
  return args;
}

async function initAdmin(keyPath) {
  if (admin.apps.length) return;
  let credential;
  if (keyPath) {
    const p = path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath);
    if (!fs.existsSync(p)) {
      console.error('❌ Archivo de credenciales no encontrado:', p);
      process.exit(1);
    }
    credential = admin.credential.cert(require(p));
  } else {
    credential = admin.credential.applicationDefault();
  }
  admin.initializeApp({ credential });
}

async function main() {
  const { uid, key } = parseArgs();
  if (!uid) {
    console.error('❌ Debes indicar --uid=<PLANNER_UID>');
    process.exit(1);
  }

  await initAdmin(key);
  const db = admin.firestore();
  const { arrayUnion } = admin.firestore.FieldValue;

  console.log('➡️  Añadiendo UID', uid, 'a todos los documentos de weddings...');

  const snap = await db.collection('weddings').get();
  if (snap.empty) {
    console.log('No hay documentos en la colección weddings.');
    return;
  }

  let updated = 0;
  const batchLimit = 400;
  let batch = db.batch();

  for (const docSnap of snap.docs) {
    batch.update(docSnap.ref, { plannerIds: arrayUnion(uid) });
    updated++;
    if (updated % batchLimit === 0) {
      await batch.commit();
      console.log(`Actualizados ${updated} bodas...`);
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log(`🎉 Añadido UID a ${updated} bodas.`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Error inesperado:', err);
    process.exit(1);
  });
}
