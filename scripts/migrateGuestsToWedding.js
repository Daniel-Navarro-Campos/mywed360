#!/usr/bin/env node
/*
 * Script: migrateGuestsToWedding.js
 * ---------------------------------------------
 * Copia todos los documentos de la ruta
 *   users/{uid}/guests/{guestId}
 * a la nueva ruta
 *   weddings/{weddingId}/guests/{guestId}
 * y (opcionalmente) borra los originales.
 *
 * Uso:
 *   node scripts/migrateGuestsToWedding.js --deleteOld=true
 *
 * Requisitos previos:
 *   - GOOGLE_APPLICATION_CREDENTIALS apuntando al JSON del servicio Firebase.
 *   - El proyecto Firebase configurado en este script coincide con tu proyecto.
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');


function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      params[key] = value ?? true;
    }
  }
  return params;
}

async function main() {
  const { deleteOld = false, dryRun = false, key } = parseArgs();

  // Inicializa admin si no existe
  if (!admin.apps.length) {
    let credential;
    if (key) {
      const keyPath = path.isAbsolute(key) ? key : path.join(process.cwd(), key);
      if (!fs.existsSync(keyPath)) {
        console.error(`❌  No se encontró el archivo de credenciales en: ${keyPath}`);
        process.exit(1);
      }
      const serviceAccount = require(keyPath);
      credential = admin.credential.cert(serviceAccount);
    } else {
      try {
        credential = admin.credential.applicationDefault();
      } catch (err) {
        console.error('❌  Debes proporcionar --key=/ruta/credenciales.json o configurar GOOGLE_APPLICATION_CREDENTIALS');
        process.exit(1);
      }
    }
    admin.initializeApp({ credential });
  }
  const db = admin.firestore();

  console.log('🚀  Iniciando migración de invitados…\n');

  // Busca todos los documentos guests en users/*/guests usando collectionGroup.
  const guestsSnap = await db.collectionGroup('guests').get();
  if (guestsSnap.empty) {
    console.log('No se encontraron documentos guests para migrar.');
    return;
  }

  let migrated = 0;
  const batchLimit = 400; // Firestore máx 500 ops; reservamos margen
  let batch = db.batch();

  for (const docSnap of guestsSnap.docs) {
    const segments = docSnap.ref.path.split('/');
    // Esperamos pattern users/{uid}/guests/{guestId}
    if (segments.length !== 4 || segments[0] !== 'users') continue; // no corresponde
    const [ , uid , , guestId ] = segments;
    // Obtiene weddingId del perfil de usuario
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const weddingId = userDoc.get('weddingId');
    if (!weddingId) {
      console.warn(`⚠️  El usuario ${uid} no tiene weddingId, se omite guest ${guestId}`);
      continue;
    }
    const data = docSnap.data();
    const destRef = db.collection('weddings').doc(weddingId).collection('guests').doc(guestId);
    batch.set(destRef, data, { merge: true });
    if (deleteOld) batch.delete(docSnap.ref);
    migrated++;

    if (migrated % batchLimit === 0) {
      if (dryRun) {
        console.log(`[dryRun] Procesadas ${migrated}…`);
        batch = db.batch();
      } else {
        await batch.commit();
        console.log(`✅  Migradas ${migrated}…`);
        batch = db.batch();
      }
    }
  }
  // Commit final
  if (!dryRun) {
    await batch.commit();
  }

  console.log(`\n🎉  Migración completada. Invitados migrados: ${migrated}`);
  if (!deleteOld) {
    console.log('Nota: los documentos antiguos permanecen en users/{uid}/guests');
  }
}

main().catch((err) => {
  console.error('❌  Error inesperado:', err);
  process.exit(1);
});
