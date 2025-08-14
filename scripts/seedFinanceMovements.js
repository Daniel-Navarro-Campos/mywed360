#!/usr/bin/env node
/*
  Script: seedFinanceMovements.js
  Descripción: Crea movimientos de prueba en la ruta
    weddings/{weddingId}/finance/main (campo movements)
  Uso:
    node scripts/seedFinanceMovements.js --weddingId=<ID>
*/

const path = require('path');
const admin = require('firebase-admin');

// Detectar credenciales automáticamente en la raíz
const projectRoot = path.resolve(__dirname, '..');
const fs = require('fs');
// Intentar serviceAccount.json; si no existe, buscar *firebase-adminsdk*.json en la raíz
let defaultCredPath = path.join(projectRoot, 'serviceAccount.json');
if (!fs.existsSync(defaultCredPath)) {
  const cand = fs.readdirSync(projectRoot).find(f => f.endsWith('.json') && f.includes('firebase-adminsdk'));
  if (cand) {
    defaultCredPath = path.join(projectRoot, cand);
  }
}

const argv = process.argv.slice(2);
const args = Object.fromEntries(argv.map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));

const weddingId = args.weddingId || '61ffb907-7fcb-4361-b764-0300b317fe06';

if (!weddingId) {
  console.error('Debes especificar --weddingId=<id>');
  process.exit(1);
}

// Inicializar Firebase Admin si aún no está inicializado
if (!admin.apps.length) {
  const credentialPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS || defaultCredPath);
  console.log(`🔑 Usando credenciales: ${credentialPath}`);
  try {
    let serviceAccount;
    try {
      serviceAccount = require(credentialPath);
    } catch(requireErr) {
      try {
        const raw = fs.readFileSync(credentialPath, 'utf8');
        serviceAccount = JSON.parse(raw);
      } catch(readErr) {
        console.error('❌ No se pudo leer el archivo de credenciales:', readErr.message);
        throw readErr;
      }
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    console.error('Error inicializando Firebase Admin:', err);
    process.exit(1);
  }
}

const db = admin.firestore();

async function seed() {
  const financeDocRef = db.doc(`weddings/${weddingId}/finance/main`);

  // Movimientos de ejemplo
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const sampleMovements = [
    {
      id: `mov-${Date.now() - 20000}`,
      concept: 'Reserva del fotógrafo',
      amount: 800,
      date: todayStr,
      type: 'expense',
      category: 'FOTOGRAFIA',
    },
    {
      id: `mov-${Date.now() - 10000}`,
      concept: 'Pago inicial catering',
      amount: 1500,
      date: todayStr,
      type: 'expense',
      category: 'CATERING',
    },
    {
      id: `mov-${Date.now()}`,
      concept: 'Regalo cash invitados',
      amount: 2000,
      date: todayStr,
      type: 'income',
      category: 'REGALOS',
    }
  ];

  try {
    await financeDocRef.set({ movements: sampleMovements }, { merge: true });
    console.log(`✓ Movimientos de prueba añadidos a boda ${weddingId}`);
    process.exit(0);
  } catch (err) {
    console.error('Error escribiendo movimientos:', err && err.message);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

seed();
