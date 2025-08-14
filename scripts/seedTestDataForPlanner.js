#!/usr/bin/env node
/**
 * Script: seedTestDataForPlanner.js
 * ---------------------------------------------
 * Crea/actualiza un usuario planner con los datos de prueba necesarios
 * y genera una boda de ejemplo con documentos y subcolecciones completas
 * para poder probar la vista de planner.
 *
 * Uso:
 *   node scripts/seedTestDataForPlanner.js --email=danielnavarrocampos@icloud.com
 *   (Opcional) --password=123456 --weddingName="Demo Wedding"
 *
 * Requisitos:
 * - Definir GOOGLE_APPLICATION_CREDENTIALS con la clave de servicio de Firebase
 * - Permisos de Firebase Auth y Firestore
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
import { randomUUID } from 'crypto';

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

async function ensurePlannerUser(email, password = 'planner123') {
  const auth = admin.auth();
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`ℹ️  Usuario existente: ${userRecord.uid}`);
  } catch {
    userRecord = await auth.createUser({ email, password, emailVerified: false, disabled: false });
    console.log(`✅  Usuario creado: ${userRecord.uid}`);
  }
  // Actualiza rol en colección users
  const db = admin.firestore();
  await db.collection('users').doc(userRecord.uid).set(
    {
      role: 'planner',
      email,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return userRecord.uid;
}

async function ensureWedding(uidPlanner, opts) {
  const db = admin.firestore();
  const { weddingId, weddingName = 'Boda de prueba', dateStr = '2025-10-01' } = opts;
  if (weddingId) {
    // Añadir planner al array plannerIds del documento existente
    const wedRef = db.collection('weddings').doc(weddingId);
    await wedRef.set({ plannerIds: admin.firestore.FieldValue.arrayUnion(uidPlanner) }, { merge: true });
    console.log('ℹ️  Usando boda existente:', weddingId);
    return weddingId;
  }
  // Crear nueva si no existe argumento
  const existingSnap = await db
    .collection('weddings')
    .where('plannerIds', 'array-contains', uidPlanner)
    .limit(1)
    .get();
  if (!existingSnap.empty) {
    console.log('ℹ️  Ya existe una boda de prueba:', existingSnap.docs[0].id);
    return existingSnap.docs[0].id;
  }
  const weddingRef = await db.collection('weddings').add({
    name: weddingName,
    date: dateStr,
    location: 'Lugar de celebración',
    ownerIds: [],
    plannerIds: [uidPlanner],
    assistantIds: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`✅  Boda creada: weddings/${weddingRef.id}`);
  return weddingRef.id;
}


async function seedSubcollections(weddingId) {
  const db = admin.firestore();
  const docsCol = db.collection('weddings').doc(weddingId).collection('documents');
  const guestsCol = db.collection('weddings').doc(weddingId).collection('guests');
  const tasksCol = db.collection('weddings').doc(weddingId).collection('tasks');
  const suppliersCol = db.collection('weddings').doc(weddingId).collection('suppliers');

  // Crear documentos de ejemplo
  const sampleDocs = [
    { name: 'Contrato Lugar.pdf', url: 'https://example.com/contrato-lugar.pdf', type: 'PDF' },
    { name: 'Menú.pdf', url: 'https://example.com/menu.pdf', type: 'PDF' },
    { name: 'Lista canciones.xlsx', url: 'https://example.com/canciones.xlsx', type: 'XLSX' },
  ];
  for (const d of sampleDocs) {
    await docsCol.add({ ...d, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  console.log('✅  Documentos de prueba añadidos');

  // Crear invitados de ejemplo
  const sampleGuests = [
    { name: 'Ana García', email: 'ana@example.com', phone: '+34123456789', status: 'pending' },
    { name: 'Luis Martínez', email: 'luis@example.com', phone: '+34987654321', status: 'accepted' },
  ];
  for (const g of sampleGuests) {
    await guestsCol.add({ ...g, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  console.log('✅  Invitados de prueba añadidos');

  // Crear proveedores de ejemplo
  const sampleSuppliers = [
    { name: 'Floristería Las Rosas', category: 'Flores', phone: '+34911223344', email: 'contacto@floristerialasrosas.com' },
    { name: 'Grupo Catering Gourmet', category: 'Catering', phone: '+34919876543', email: 'info@cateringgourmet.es' },
  ];
  for (const s of sampleSuppliers) {
    await suppliersCol.add({ ...s, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  console.log('✅  Proveedores de prueba añadidos');

  // Crear tareas de ejemplo
  const sampleTasks = [
    { title: 'Confirmar lugar', done: false },
    { title: 'Enviar invitaciones', done: false },
  ];
  for (const t of sampleTasks) {
    await tasksCol.add({ ...t, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  console.log('✅  Tareas de prueba añadidas');
}

async function main() {
  const { email, password, weddingName, key, weddingId } = parseArgs();
  if (!email) {
    console.error('Uso: --email=<correoPlanner> [--password=...] [--weddingName="..."]');
    process.exit(1);
  }

  await ensureAdmin(key);
  const uidPlanner = await ensurePlannerUser(email, password);
  const effectiveWeddingId = await ensureWedding(uidPlanner, { weddingId, weddingName });
  await seedSubcollections(effectiveWeddingId);

  console.log('\n🎉  Datos de prueba generados correctamente.');
  console.log('   Planner UID:', uidPlanner);
  console.log('   Wedding ID :', effectiveWeddingId);
  console.log('Ahora inicia sesión con el usuario planner y navega a /bodas para ver la boda de prueba.');
}

main().catch((err) => {
  console.error('❌  Error inesperado:', err);
  process.exit(1);
});
