#!/usr/bin/env node
/*
  Script: seedGuestsBanquet.js
  Genera invitados de prueba y mesas de banquete asignándolos automáticamente.

  Uso:
    node scripts/seedGuestsBanquet.js --weddingId=<ID> [--guests=250] [--perTable=10] [--force]

  - Crea documentos en:
      weddings/{weddingId}/guests/{guestId}
      weddings/{weddingId}/seatingPlan/banquet/tables/{tableId}
  - Si ya existen documentos, no hace nada a menos que pases --force.
  - Asigna "perTable" invitados a cada mesa (guest.tableId = tableId y assignedGuests en la mesa).

  Requisitos:
  1. Tener firebase-admin instalado: npm i firebase-admin yargs
  2. Establecer GOOGLE_APPLICATION_CREDENTIALS o tener el JSON de la service account en la raíz.
*/

const admin = require('firebase-admin');
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const path = require('path');
const fs = require('fs');

const argv = yargs(hideBin(process.argv))
  .option('weddingId', { type: 'string', demandOption: true, describe: 'ID de la boda' })
  .option('guests', { type: 'number', default: 250, describe: 'Número total de invitados' })
  .option('perTable', { type: 'number', default: 10, describe: 'Invitados por mesa' })
  .option('force', { type: 'boolean', default: false, describe: 'Sobrescribe datos existentes' })
  .strict()
  .argv;

// ---- Inicializar Firebase Admin ----
let credentials;
let serviceAccount;
let saPath;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    saPath = path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      ? process.env.GOOGLE_APPLICATION_CREDENTIALS
      : path.resolve(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    console.log('🔑 GOOGLE_APPLICATION_CREDENTIALS definido. Cargando service account desde:', saPath);
  } else {
    const rootDir = path.resolve(__dirname, '..');
    const rootFiles = fs.readdirSync(rootDir);
    const saFile = rootFiles.find((f) => /firebase-adminsdk.*\.json$/i.test(f)) || 'serviceAccount.json';
    saPath = path.resolve(rootDir, saFile);
    if (!fs.existsSync(saPath)) {
      console.error('❌ No se encontró JSON de service account ni GOOGLE_APPLICATION_CREDENTIALS');
      process.exit(1);
    }
    console.log(`🔑 Usando service account detectado: ${saPath}`);
  }
  serviceAccount = require(saPath);
  if (!serviceAccount.project_id || !serviceAccount.client_email) {
    console.error('❌ El JSON de service account no contiene project_id o client_email válidos');
    process.exit(1);
  }
  credentials = admin.credential.cert(serviceAccount);
  // Asegurar variable de proyecto para bibliotecas que la usan implícitamente
  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    process.env.GOOGLE_CLOUD_PROJECT = serviceAccount.project_id;
  }
  console.log(`✅ Service Account cargada. project_id: ${serviceAccount.project_id} | client_email: ${serviceAccount.client_email}`);
} catch (e) {
  console.error('❌ Error cargando la service account:', e && e.message ? e.message : e);
  process.exit(1);
}

admin.initializeApp({ credential: credentials, projectId: serviceAccount.project_id });
const db = admin.firestore();

(async () => {
  const { weddingId, guests: totalGuests, perTable, force } = argv;

  const guestsCol = db.collection('weddings').doc(weddingId).collection('guests');
  const tablesCol = db
    .collection('weddings')
    .doc(weddingId)
    .collection('seatingPlan')
    .doc('banquet')
    .collection('tables');

  // Verificar existentes
  const [guestsSnap, tablesSnap] = await Promise.all([guestsCol.limit(1).get(), tablesCol.limit(1).get()]);
  if (!force && (!guestsSnap.empty || !tablesSnap.empty)) {
    console.log('ℹ️ Ya existen invitados o mesas. Usa --force para sobrescribir.');
    return;
  }

  if (force) {
    console.log('🗑️  Borrando datos anteriores…');
    // borrar invitados
    const delGuests = await guestsCol.get();
    const delBatch = db.batch();
    delGuests.forEach((d) => delBatch.delete(d.ref));
    const delTables = await tablesCol.get();
    delTables.forEach((d) => delBatch.delete(d.ref));
    await delBatch.commit();
  }

  const tablesNeeded = Math.ceil(totalGuests / perTable);
  const batchSize = 400; // Firestore batch limit 500; guardamos margen
  let batch = db.batch();
  let writes = 0;

  const assignedGuestsByTable = {};

  // Crear invitados
  for (let i = 1; i <= totalGuests; i++) {
    const tableId = ((i - 1) % tablesNeeded) + 1; // Reparto uniforme
    const guestId = `G${i}`;
    const guestDoc = guestsCol.doc(guestId);
    const guestData = {
      id: guestId,
      name: `Invitado ${i}`,
      tableId: tableId,
      table: tableId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    batch.set(guestDoc, guestData);
    writes++;

    // acumular para mesas
    if (!assignedGuestsByTable[tableId]) assignedGuestsByTable[tableId] = [];
    assignedGuestsByTable[tableId].push({ id: guestId, name: guestData.name });

    if (writes >= batchSize) {
      await batch.commit();
      batch = db.batch();
      writes = 0;
    }
  }

  // Crear mesas con invitados asignados
  for (let t = 1; t <= tablesNeeded; t++) {
    const tblDoc = tablesCol.doc(String(t));
    const tblData = {
      id: t,
      name: `Mesa ${t}`,
      shape: 'circle',
      seats: perTable,
      x: 100 + ((t - 1) % 10) * 140, // distribución en rejilla 10 columnas
      y: 120 + Math.floor((t - 1) / 10) * 160,
      assignedGuests: assignedGuestsByTable[t] || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    batch.set(tblDoc, tblData);
    writes++;
    if (writes >= batchSize) {
      await batch.commit();
      batch = db.batch();
      writes = 0;
    }
  }

  if (writes > 0) await batch.commit();

  console.log(`✅ Insertados ${totalGuests} invitados y ${tablesNeeded} mesas en la boda ${weddingId}`);
  process.exit(0);
})();
