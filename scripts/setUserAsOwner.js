#!/usr/bin/env node
/**
 * setUserAsOwner.js
 * 
 * Uso:
 *   node scripts/setUserAsOwner.js --email=<correo> --weddingId=<id> [--key=serviceAccount.json]
 *
 * - Cambia el rol del usuario a "owner" en la colección users.
 * - Asegura que el UID está en ownerIds del documento de boda y lo elimina de plannerIds.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

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

async function ensureAdmin(keyPath) {
  if (admin.apps.length) return;
  let credential;
  if (keyPath) {
    const path = require('path');
    const fs = require('fs');
    const abs = path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath);
    if (!fs.existsSync(abs)) {
      console.error('❌  Credencial no encontrada:', abs);
      process.exit(1);
    }
    credential = admin.credential.cert(require(abs));
  } else {
    credential = admin.credential.applicationDefault();
  }
  admin.initializeApp({ credential });
}

async function main() {
  const { email, weddingId, key } = parseArgs();
  if (!email || !weddingId) {
    console.error('Uso: --email=<correo> --weddingId=<id> [--key=...]');
    process.exit(1);
  }
  await ensureAdmin(key);

  const auth = admin.auth();
  let userRec;
  try {
    userRec = await auth.getUserByEmail(email);
  } catch {
    console.error('❌  Usuario no encontrado:', email);
    process.exit(1);
  }
  const uid = userRec.uid;

  const db = admin.firestore();
  // Actualizar rol a owner en users/{uid}
  await db.collection('users').doc(uid).set({ role: 'owner', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  console.log('✅  Rol del usuario actualizado a owner');

  const wedRef = db.collection('weddings').doc(weddingId);
  await wedRef.update({
    ownerIds: admin.firestore.FieldValue.arrayUnion(uid),
    plannerIds: admin.firestore.FieldValue.arrayRemove(uid),
  });
  console.log('✅  ownerIds y plannerIds actualizados en la boda');

  console.log('\nHecho. Prueba iniciar sesión de nuevo.');
}

main().catch((err) => {
  console.error('❌  Error inesperado:', err);
  process.exit(1);
});
