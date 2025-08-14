#!/usr/bin/env node
/**
 * setOnboardingCompleted.js
 * ---------------------------------------------------------
 * Marca `onboardingCompleted: true` en users/{uid}
 * Uso:
 *   node scripts/setOnboardingCompleted.js <uid>
 */
const path = require('path');
const admin = require('firebase-admin');

const keyPath = path.resolve(__dirname, '..', 'lovenda-98c77-firebase-adminsdk-fbsvc-0e1a5a524c.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
}
const db = admin.firestore();

(async () => {
  const uid = process.argv[2];
  if (!uid) {
    console.error('❌ Debes proporcionar UID');
    process.exit(1);
  }
  await db.collection('users').doc(uid).set({ onboardingCompleted: true, lastUpdated: new Date().toISOString() }, { merge: true });
  console.log(`✅ onboardingCompleted=true para users/${uid}`);
  process.exit(0);
})().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
