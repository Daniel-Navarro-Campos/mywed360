#!/usr/bin/env node
/**
 * Script: migrateTasksToWedding.js
 * ---------------------------------------------
 * Copia todos los documentos de la colección de nivel raíz
 *   tasks/{taskId}
 *  al nuevo esquema
 *   weddings/{weddingId}/tasks/{taskId}
 *  y (opcionalmente) borra los documentos originales.
 *
 * Uso:
 *   node scripts/migrateTasksToWedding.js --deleteOld=true --dryRun=true --key=/ruta/cred.json
 *
 * Requisitos previos:
 *   - GOOGLE_APPLICATION_CREDENTIALS apuntando al JSON de servicio Firebase **o** pasar --key.
 *   - El proyecto Firebase configurado coincide con tu proyecto.
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
  console.log('🚀  Iniciando migración de tareas…\n');

  // Obtener todas las tareas de nivel raíz
  const tasksSnap = await db.collection('tasks').get();
  if (tasksSnap.empty) {
    console.log('No hay documentos en tasks para migrar.');
    return;
  }

  let migrated = 0;
  const batchLimit = 400; // Firestore máx 500 operaciones
  let batch = db.batch();

  for (const docSnap of tasksSnap.docs) {
    const data = docSnap.data();
    const { userId, weddingId: embeddedWeddingId } = data;

    // 1) Determinar weddingId
    let weddingId = embeddedWeddingId;
    if (!weddingId && userId) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      weddingId = userDoc.get('weddingId');
    }

    if (!weddingId) {
      console.warn(`⚠️  La tarea ${docSnap.id} no tiene weddingId y no se pudo inferir. Se omite.`);
      continue;
    }

    const destRef = db.collection('weddings').doc(weddingId).collection('tasks').doc(docSnap.id);
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

  console.log(`\n🎉  Migración completada. Tareas migradas: ${migrated}`);
  if (!deleteOld) {
    console.log('Nota: los documentos antiguos permanecen en la colección raíz tasks');
  }
}

main().catch((err) => {
  console.error('❌  Error inesperado:', err);
  process.exit(1);
});
