#!/usr/bin/env node
/**
 * deleteWeddingGuests.js
 * -------------------------------------------------------------
 * Elimina todos los documentos de la subcolección guests dentro de una boda.
 * Uso:
 *   node scripts/deleteWeddingGuests.js --id=<weddingId> [--key=/ruta/cred.json] [--dryRun=true]
 *
 * - Si proporcionas --dryRun=true solo mostrará cuántos documentos se borrarían.
 * - Si proporcionas --key=... cargará las credenciales desde el archivo indicado;
 *   de lo contrario usará GOOGLE_APPLICATION_CREDENTIALS o ADC.
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

function parseArgs() {
  const params = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.substring(2).split('=');
      params[k] = v === undefined ? true : v;
    }
  }
  return params;
}

async function initAdmin(keyPath) {
  if (admin.apps.length) return;
  let credential;
  if (keyPath) {
    const resolved = path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath);
    if (!fs.existsSync(resolved)) {
      console.error(`❌  Archivo de credenciales no encontrado: ${resolved}`);
      process.exit(1);
    }
    credential = admin.credential.cert(require(resolved));
  } else {
    credential = admin.credential.applicationDefault();
  }
  admin.initializeApp({ credential });
}

async function deleteGuests() {
  const { id: weddingId, key, dryRun = false } = parseArgs();
  if (!weddingId) {
    console.error('❌  Debes indicar --id=<weddingId>');
    process.exit(1);
  }

  await initAdmin(key);
  const db = admin.firestore();

  const guestsCol = db.collection('weddings').doc(weddingId).collection('guests');
  const snap = await guestsCol.get();
  if (snap.empty) {
    console.log('No hay invitados que borrar.');
    return;
  }

  console.log(`Encontrados ${snap.size} invitados en la boda ${weddingId}`);
  if (dryRun) {
    console.log('[dryRun] No se borró nada.');
    return;
  }

  const batchLimit = 400;
  let batch = db.batch();
  let counter = 0;

  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    counter++;
    if (counter % batchLimit === 0) {
      await batch.commit();
      console.log(`Borrados ${counter}…`);
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log(`🎉  Eliminados ${counter} invitados en total.`);
}

if (require.main === module) {
  deleteGuests().catch((err) => {
    console.error('❌  Error inesperado:', err);
    process.exit(1);
  });
}
