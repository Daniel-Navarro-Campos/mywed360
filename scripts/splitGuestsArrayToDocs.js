#!/usr/bin/env node
/**
 * splitGuestsArrayToDocs.js
 * -------------------------------------------------------------
 * Convierte un documento "contenedor" dentro de la sub-colección guests
 * (que guarda todos los invitados dentro de un array) en documentos
 * individuales guests/{newDocId}.
 *
 * Uso:
 *   node scripts/splitGuestsArrayToDocs.js \
 *        --wedding=61ffb907-7fcb-4361-b764-0300b317fe06 \
 *        --docId=<idDocumentoContenedor> \
 *        [--field=guests] [--deleteOld=true] [--key=/path/cred.json]
 *
 * - Si omites --docId el script buscará el primer documento de la colección y
 *   usará el campo "guests".
 * - El campo debe ser un array de objetos: [{ name, phone, ... }, ...]
 * - Añade --deleteOld=true para borrar el documento contenedor tras migrar.
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

async function main() {
  const {
    wedding: weddingId,
    docId,
    field = 'guests',
    deleteOld = false,
    key,
  } = parseArgs();

  if (!weddingId) {
    console.error('❌  Debes indicar --wedding=<weddingId>');
    process.exit(1);
  }

  await initAdmin(key);
  const db = admin.firestore();
  const guestsCol = db.collection('weddings').doc(weddingId).collection('guests');

  let containerDocSnap;
  if (docId) {
    containerDocSnap = await guestsCol.doc(docId).get();
    if (!containerDocSnap.exists) {
      console.error(`❌  El documento ${docId} no existe en guests`);
      process.exit(1);
    }
  } else {
    const firstSnap = await guestsCol.limit(1).get();
    if (firstSnap.empty) {
      console.error('❌  No se encontraron documentos en guests');
      process.exit(1);
    }
    containerDocSnap = firstSnap.docs[0];
  }

  const data = containerDocSnap.data();
  const arr = Array.isArray(data[field]) ? data[field] : null;
  if (!arr) {
    console.error(`❌  El campo ${field} no es un array en el documento contenedor`);
    process.exit(1);
  }

  console.log(`➡️  Encontrados ${arr.length} invitados en el array."${field}"`);
  if (!arr.length) {
    console.log('Nada que migrar.');
    return;
  }

  const batchLimit = 400;
  let batch = db.batch();
  let counter = 0;

  for (const guest of arr) {
    // Si el objeto ya tiene id reutilízalo; si no, deja que Firestore genere uno
    const docRef = guest.id ? guestsCol.doc(String(guest.id)) : guestsCol.doc();
    batch.set(docRef, guest, { merge: true });
    counter++;
    if (counter % batchLimit === 0) {
      await batch.commit();
      console.log(`Grabados ${counter} invitados…`);
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log(`🎉  Migrados ${counter} invitados como documentos individuales.`);

  if (deleteOld && containerDocSnap.ref) {
    await containerDocSnap.ref.delete();
    console.log(`🗑️  Documento contenedor ${containerDocSnap.id} eliminado.`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌  Error inesperado:', err);
    process.exit(1);
  });
}
