#!/usr/bin/env node
/**
 * migrateSubcollectionToWedding.js
 * -------------------------------------------------------------
 * Script genérico para mover documentos de una colección o subcolección
 * al nuevo esquema anidado bajo weddings/{weddingId}/{subName}.
 *
 * Soporta dos fuentes:
 *   1. Nivel raíz             ->  collection('<subName>')
 *   2. Bajo users/{uid}        ->  users/{uid}/<subName>
 *
 * Determinación de weddingId:
 *   - Campo "weddingId" dentro del documento OR
 *   - Campo "userId" dentro del documento OR
 *   - Vía uid (cuando viene de users/{uid}) consultando users/{uid}.weddingId
 *
 * Uso ejemplos:
 *   node scripts/migrateSubcollectionToWedding.js --sub=seatingPlan --source=root --dryRun=true
 *   node scripts/migrateSubcollectionToWedding.js --sub=tables --source=user --deleteOld=true
 *
 * Parámetros:
 *   --sub=<nombre>          Nombre de la subcolección (requerido)
 *   --source=root|user      "root" para colección raíz, "user" para users/{uid}/{sub}. Default: root
 *   --deleteOld=true        Elimina los documentos antiguos tras copiar
 *   --dryRun=true           No escribe ni borra, solo cuenta y muestra
 *   --forceWeddingId=<id>   Fuerza a usar este weddingId para todos los docs
 *   --key=/path/cred.json   Ruta a JSON de cuenta de servicio (opcional)
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.substring(2).split('=');
      params[k] = v === undefined ? true : v;
    }
  }
  return params;
}

async function initAdmin(key) {
  if (admin.apps.length) return;
  let credential;
  if (key) {
    const keyPath = path.isAbsolute(key) ? key : path.join(process.cwd(), key);
    if (!fs.existsSync(keyPath)) {
      console.error(`❌  Archivo de credenciales no encontrado: ${keyPath}`);
      process.exit(1);
    }
    credential = admin.credential.cert(require(keyPath));
  } else {
    credential = admin.credential.applicationDefault();
  }
  admin.initializeApp({ credential });
}

async function migrate() {
  const { sub, source = 'root', dest, forceWeddingId, deleteOld = false, dryRun = false, key } = parseArgs();
  if (!sub) {
    console.error('❌  Debes indicar --sub=<nombre>');
    process.exit(1);
  }

  await initAdmin(key);
  const db = admin.firestore();

  const destSub = dest || sub;

  console.log(`🚀  Migrando subcolección origen "${sub}" → destino "${destSub}" desde "${source}" …\n`);

  let docsSnap;
  if (source === 'root') {
    docsSnap = await db.collection(sub).get();
  } else if (source === 'user') {
    docsSnap = await db.collectionGroup(sub).get();
  } else {
    console.error('❌  --source debe ser "root" o "user"');
    process.exit(1);
  }

  if (docsSnap.empty) {
    console.log('No se encontraron documentos para migrar.');
    return;
  }

  let migrated = 0;
  const batchLimit = 400;
  let batch = db.batch();

  for (const docSnap of docsSnap.docs) {
    let weddingId;
    const data = docSnap.data();

    // 1. weddingId directo
    if (data.weddingId) weddingId = data.weddingId;

    // 2. vía userId campo
    if (!weddingId && data.userId) {
      const userDoc = await db.collection('users').doc(data.userId).get();
      weddingId = userDoc.get('weddingId');
    }

    // 3. si source=user, inferir uid de la ruta
    if (!weddingId && source === 'user') {
      const segments = docSnap.ref.path.split('/'); // users/{uid}/{sub}/{docId}
      if (segments.length >= 4 && segments[0] === 'users') {
        const uid = segments[1];
        const userDoc = await db.collection('users').doc(uid).get();
        weddingId = userDoc.get('weddingId');
      }
    }

    if (forceWeddingId) {
      weddingId = forceWeddingId;
    }

    if (!weddingId) {
      console.warn(`⚠️  Documento ${docSnap.id} omitido: no se pudo determinar weddingId`);
      continue;
    }

    const destRef = db.collection('weddings').doc(weddingId).collection(destSub).doc(docSnap.id);
    if (!dryRun) {
      batch.set(destRef, data, { merge: true });
      if (deleteOld) batch.delete(docSnap.ref);
    }
    migrated++;

    if (migrated % batchLimit === 0) {
      if (!dryRun) await batch.commit();
      console.log(`${dryRun ? '[dryRun]' : ''} Migradas ${migrated}…`);
      batch = db.batch();
    }
  }

  if (!dryRun) await batch.commit();
  console.log(`\n🎉  Total documentos procesados: ${migrated}`);
  if (dryRun) console.log('Modo dryRun: no se escribió ni eliminó nada.');
}

migrate().catch((err) => {
  console.error('❌  Error inesperado:', err);
  process.exit(1);
});
