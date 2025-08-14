#!/usr/bin/env node
/*
  Script: seedWeddingGuests.js
  Uso:
    node scripts/seedWeddingGuests.js --weddingId=<ID> [--guests=10] [--force]

  Crea invitados de prueba en weddings/{weddingId}/guests distribuidos en las mesas existentes de seatingPlan.
*/

const admin = require('firebase-admin');
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const path = require('path');
const fs = require('fs');

const argv = yargs(hideBin(process.argv))
  .option('weddingId', { type: 'string', demandOption: true, describe: 'ID de la boda' })
  .option('guests', { type: 'number', default: 10, describe: 'Número de invitados a crear' })
  .option('force', { type: 'boolean', default: false, describe: 'Sobrescribe invitados existentes' })
  .strict().argv;

// Credenciales (reutiliza lógica del otro script)
let credentials;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credentials = admin.credential.applicationDefault();
  console.log('✅ Usando credenciales de GOOGLE_APPLICATION_CREDENTIALS');
} else {
  const rootFiles = fs.readdirSync(path.resolve(__dirname, '..'));
  const saFile = rootFiles.find(f => /firebase-adminsdk.*\.json$/i.test(f));
  if (!saFile) {
    console.error('❌ No se encontró JSON de service account y GOOGLE_APPLICATION_CREDENTIALS no está definida.');
    process.exit(1);
  }
  credentials = admin.credential.cert(require(path.resolve(__dirname, '..', saFile)));
  console.log(`✅ Usando credenciales de ${saFile}`);
}
admin.initializeApp({ credential: credentials });
const db = admin.firestore();

(async () => {
  const { weddingId, guests: nGuests, force } = argv;
  const guestsRef = db.collection('weddings').doc(weddingId).collection('guests');

  const snapGuests = await guestsRef.limit(1).get();
  if (!force && !snapGuests.empty) {
    console.log('ℹ️ La subcolección guests ya contiene documentos. Usa --force para sobrescribir.');
    return;
  }
  if (force) {
    const existing = await guestsRef.get();
    const batchDel = db.batch();
    existing.forEach(doc => batchDel.delete(doc.ref));
    await batchDel.commit();
    console.log('🗑️ Invitados anteriores eliminados.');
  }

  // Obtener mesas existentes para asignar invitados
  const tablesSnap = await db.collection('weddings').doc(weddingId).collection('seatingPlan').get();
  if (tablesSnap.empty) {
    console.error('❌ No hay mesas en seatingPlan. Ejecuta primero seedSeatingPlan.js');
    process.exit(1);
  }
  const tables = tablesSnap.docs.map(d => d.id);
  // Generar nombres ficticios
  const firstNames = ['Ana', 'Luis', 'María', 'Carlos', 'Laura', 'Miguel', 'Sara', 'Jorge', 'Elena', 'David'];
  const lastNames = ['López', 'García', 'Ruiz', 'Martínez', 'Fernández', 'Sánchez'];

  const batch = db.batch();
  for (let i = 0; i < nGuests; i++) {
    const id = `G${i + 1}`;
    const tableId = tables[i % tables.length];
    const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
    batch.set(guestsRef.doc(id), {
      id,
      name,
      tableId,
      confirmed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  console.log(`✅ Creados ${nGuests} invitados asignados a ${tables.length} mesa(s).`);
})();
