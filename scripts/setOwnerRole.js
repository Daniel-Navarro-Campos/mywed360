#!/usr/bin/env node
/**
 * setOwnerRole.js
 * ----------------------------------
 * Marca al usuario dado como "owner" y lo añade a ownerIds[] de la boda.
 * Uso:
 *   node scripts/setOwnerRole.js <email> <weddingId>
 */
const path = require('path');
const admin = require('firebase-admin');
const [email, weddingId] = process.argv.slice(2);
if (!email || !weddingId) {
  console.error('Uso: node scripts/setOwnerRole.js <email> <weddingId>');
  process.exit(1);
}
// Clave de servicio local
const keyPath = path.resolve(__dirname, '..', 'lovenda-98c77-firebase-adminsdk-fbsvc-0e1a5a524c.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
}
(async () => {
  try {
    const auth = admin.auth();
    const db = admin.firestore();
    const user = await auth.getUserByEmail(email);
    console.log(`UID del usuario: ${user.uid}`);
    // Actualizar documento users -> role owner
    await db.collection('users').doc(user.uid).set({ role: 'owner' }, { merge: true });
    // Añadir a ownerIds[] de la boda
    await db.collection('weddings').doc(weddingId).set({
      ownerIds: admin.firestore.FieldValue.arrayUnion(user.uid),
      // Por si estaba listado en plannerIds, opcionalmente lo quitamos
    }, { merge: true });
    console.log('✅  Usuario añadido como owner de la boda');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
