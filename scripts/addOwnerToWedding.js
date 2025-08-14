#!/usr/bin/env node
/**
 * addOwnerToWedding.js
 * ---------------------------------------------------------
 * Añade un UID al array ownerIds de una boda concreta.
 * Uso:
 *   node scripts/addOwnerToWedding.js <uid> <weddingId>
 * Ejemplo:
 *   node scripts/addOwnerToWedding.js 9EstYa0T8WRBm9j0XwnE8zU1iFo1 61ffb907-7fcb-4361-b764-0300b317fe06
 */
const path = require('path');
const admin = require('firebase-admin');

// Ajusta la ruta al JSON de clave de servicio si cambia
const keyPath = path.resolve(__dirname, '..', 'lovenda-98c77-firebase-adminsdk-fbsvc-0e1a5a524c.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
}
const db = admin.firestore();

async function addOwner(uid, weddingId) {
  if (!uid || !weddingId) {
    console.error('❌ Debes proporcionar UID y weddingId.');
    process.exit(1);
  }
  const wedRef = db.collection('weddings').doc(weddingId);
  const wedSnap = await wedRef.get();
  if (!wedSnap.exists) {
    console.error(`❌ La boda ${weddingId} no existe.`);
    process.exit(1);
  }
  await wedRef.update({ ownerIds: admin.firestore.FieldValue.arrayUnion(uid) });
  console.log(`✅ UID ${uid} añadido a ownerIds de la boda ${weddingId}`);
}

(async () => {
  const [uid, weddingId] = process.argv.slice(2);
  await addOwner(uid, weddingId);
  process.exit(0);
})().catch((err) => {
  console.error('❌ Error al añadir owner:', err);
  process.exit(1);
});
