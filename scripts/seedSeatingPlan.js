#!/usr/bin/env node
/*
  Script: seedSeatingPlan.js
  Uso:
    node scripts/seedSeatingPlan.js --weddingId=<ID> [--tables=4] [--force]

  Crea una subcolección `seatingPlan` bajo weddings/{weddingId} con mesas de prueba.
  Cada mesa incluye posición, forma y diámetro por defecto. Sáltate la creación si ya existen documentos, a menos que se use --force.

  Requisitos:
  1. Establece la variable de entorno GOOGLE_APPLICATION_CREDENTIALS apuntando a tu service account JSON.
  2. Ejecuta `npm install firebase-admin yargs` (ya suele estar en deps).
*/

const admin = require('firebase-admin');
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');

const argv = yargs(hideBin(process.argv))
  .option('weddingId', { type: 'string', demandOption: true, describe: 'ID de la boda' })
  .option('tables', { type: 'number', default: 4, describe: 'Número de mesas a generar' })
  .option('force', { type: 'boolean', default: false, describe: 'Sobrescribe mesas existentes' })
  .strict()
  .argv;

const path = require('path');
const fs = require('fs');

let credentials;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credentials = admin.credential.applicationDefault();
  console.log('✅ Usando credenciales de GOOGLE_APPLICATION_CREDENTIALS');
} else {
  // Fallback: buscar *.firebase-adminsdk-*.json en la raíz del proyecto
  const rootFiles = fs.readdirSync(path.resolve(__dirname, '..'));
  const saFile = rootFiles.find(f => /firebase-adminsdk.*\.json$/i.test(f));
  if (!saFile) {
    console.error('❌ No se encontró JSON de service account y GOOGLE_APPLICATION_CREDENTIALS no está definida.');
    process.exit(1);
  }
  const fullPath = path.resolve(__dirname, '..', saFile);
  credentials = admin.credential.cert(require(fullPath));
  console.log(`✅ Usando credenciales de ${saFile}`);
}

admin.initializeApp({
  credential: credentials,
});
const db = admin.firestore();

(async () => {
  const { weddingId, tables: nTables, force } = argv;
  const seatingRef = db.collection('weddings').doc(weddingId).collection('seatingPlan');

  const snap = await seatingRef.limit(1).get();
  if (!force && !snap.empty) {
    console.log('ℹ️ La subcolección seatingPlan ya contiene documentos. Usa --force para sobrescribir.');
    return;
  }

  if (force) {
    // borrar existentes
    const existing = await seatingRef.get();
    const batchDel = db.batch();
    existing.forEach(doc => batchDel.delete(doc.ref));
    await batchDel.commit();
    console.log('🗑️  Documentos anteriores eliminados.');
  }

  const batch = db.batch();
  const radius = 100;
  const gap = 160;
  const rows = Math.ceil(Math.sqrt(nTables));
  let count = 0;
  for (let r = 0; r < rows && count < nTables; r++) {
    for (let c = 0; c < rows && count < nTables; c++) {
      const id = `T${count + 1}`;
      const data = {
        id,
        shape: 'round',
        diameter: 100,
        x: c * gap + 80,
        y: r * gap + 80,
        seats: 8,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      batch.set(seatingRef.doc(id), data);
      count++;
    }
  }
  await batch.commit();
  console.log(`✅ Creadas ${nTables} mesas en weddings/${weddingId}/seatingPlan`);
  process.exit(0);
})();
