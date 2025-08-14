#!/usr/bin/env node
/**
 * seedSuppliersSimple.js
 * ---------------------------------------------
 * Añade el usuario dado como planner y crea proveedores de ejemplo
 * para la boda especificada.
 * Uso:
 *   node scripts/seedSuppliersSimple.js <email> <weddingId>
 * Ejemplo:
 *   node scripts/seedSuppliersSimple.js danielnavarrocampos@icloud.com 61ffb907-7fcb-4361-b764-0300b317fe06
 */

const path = require('path');
const admin = require('firebase-admin');

async function main() {
  const [email, weddingId] = process.argv.slice(2);
  if (!email || !weddingId) {
    console.error('Uso: node scripts/seedSuppliersSimple.js <email> <weddingId>');
    process.exit(1);
  }

  // Ruta al archivo de clave de servicio. Ajustar si es diferente.
  const keyPath = path.resolve(__dirname, '..', 'lovenda-98c77-firebase-adminsdk-fbsvc-0e1a5a524c.json');

  // Inicializar firebase-admin si no está ya inicializado
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(require(keyPath)),
    });
  }

  const auth = admin.auth();
  const db = admin.firestore();

  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log(`ℹ️  Usuario encontrado UID=${user.uid}`);
  } catch (err) {
    console.error('❌  No se encontró el usuario con ese email. Crea primero el usuario en Firebase Auth.');
    process.exit(1);
  }

  // Añadir email a colección users con role planner
  await db.collection('users').doc(user.uid).set({
    role: 'planner',
    email,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Añadir plannerIds al documento de boda
  const weddingRef = db.collection('weddings').doc(weddingId);
  await weddingRef.set({
    plannerIds: admin.firestore.FieldValue.arrayUnion(user.uid),
  }, { merge: true });
  console.log('✅  Planner añadido a la boda');

  // Crear proveedores de ejemplo
  const suppliersCol = weddingRef.collection('suppliers');
  const snapshot = await suppliersCol.limit(1).get();
  if (!snapshot.empty) {
    console.log('ℹ️  Ya existen proveedores, no se añadieron nuevos.');
  } else {
    const sampleSuppliers = [
      {
        name: 'Floristería Las Rosas',
        category: 'Flores',
        phone: '+34 911223344',
        email: 'contacto@floristerialasrosas.com',
      },
      {
        name: 'Grupo Catering Gourmet',
        category: 'Catering',
        phone: '+34 919876543',
        email: 'info@cateringgourmet.es',
      },
    ];
    for (const s of sampleSuppliers) {
      await suppliersCol.add({
        ...s,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    console.log('✅  Proveedores de ejemplo añadidos');
  }

  console.log('\n🎉  Seeding completo.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌  Error inesperado:', err);
  process.exit(1);
});
