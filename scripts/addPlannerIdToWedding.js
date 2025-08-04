#!/usr/bin/env node
/**
 * addPlannerIdToWedding.js
 * ----------------------------------------------
 * Añade un UID de planner al campo `plannerIds` de UN documento
 * `weddings/{weddingId}` usando arrayUnion (no duplica).
 *
 * Uso:
 *   node scripts/addPlannerIdToWedding.js \
 *        --wedding=61ffb907-7fcb-4361-b764-0300b317fe06 \
 *        --uid=qxaOeTDUtyY21HzsJLgDftE72LB2 \
 *        [--key=/ruta/cred.json]
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
    const p = path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath);
    if (!fs.existsSync(p)) {
      console.error('❌  Archivo de credenciales no encontrado:', p);
      process.exit(1);
    }
    credential = admin.credential.cert(require(p));
  } else {
    credential = admin.credential.applicationDefault();
  }
  admin.initializeApp({ credential });
}

async function main() {
  const { wedding: weddingId, uid, key } = parseArgs();
  if (!weddingId || !uid) {
    console.error('❌  Uso: --wedding=<ID> --uid=<PLANNER_UID> [--key=cred.json]');
    process.exit(1);
  }
  await initAdmin(key);
  const db = admin.firestore();
  const { arrayUnion } = admin.firestore.FieldValue;

  const ref = db.collection('weddings').doc(weddingId);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error('❌  La boda no existe:', weddingId);
    process.exit(1);
  }

  await ref.update({ plannerIds: arrayUnion(uid) });
  console.log('✅  UID añadido a plannerIds de la boda', weddingId);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌  Error inesperado:', err);
    process.exit(1);
  });
}
