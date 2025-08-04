#!/usr/bin/env node
/*
 * Script: createPlannerUser.js
 * ---------------------------------------------
 * Crea un usuario de Firebase Auth con rol "planner" (wedding planner)
 * y registra su documento en la colección "users" de Firestore.
 *
 * Uso:
 *   node scripts/createPlannerUser.js --email=planner@example.com --password=123456
 *
 * Requisitos:
 * - Variable de entorno GOOGLE_APPLICATION_CREDENTIALS apuntando al JSON
 *   de servicio de Firebase.
 * - Acceso de servicio con permisos de Firebase Auth y Firestore.
 */
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import path from 'path';

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
  const { email, password = 'planner123', uid } = parseArgs();

  if (!email) {
    console.error('❌  Debes proporcionar --email=/correo/');
    process.exit(1);
  }

  // Inicializar Firebase Admin si no está ya inicializado
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  const auth = admin.auth();
  const db = admin.firestore();

  let userRecord;
  try {
    if (uid) {
      // Intenta obtener el usuario existente
      userRecord = await auth.getUser(uid);
    } else {
      // Crea usuario nuevo (o devuelve existente si mismo email)
      try {
        userRecord = await auth.getUserByEmail(email);
        console.log('ℹ️  Usuario ya existente, se actualizará si es necesario.');
      } catch {
        const createParams = { email, password, emailVerified: false, disabled: false };
        if (uid) createParams.uid = uid;
        userRecord = await auth.createUser(createParams);
        console.log('✅  Usuario creado:', userRecord.uid);
      }
    }
  } catch (err) {
    console.error('❌  Error al obtener o crear usuario:', err.message || err);
    process.exit(1);
  }

  const userUid = userRecord.uid;

  // Actualizar /users/{uid} con rol 'planner'
  try {
    await db.collection('users').doc(userUid).set(
      {
        role: 'planner',
        email: email,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    console.log(`✅  Documento users/${userUid} actualizado con rol 'planner'.`);
  } catch (err) {
    console.error('❌  Error al escribir documento de usuario:', err.message || err);
    process.exit(1);
  }

  console.log('\n🎉  Usuario planner listo. Ahora puedes iniciar sesión en la app con:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
}

main().catch((err) => {
  console.error('❌  Error inesperado:', err);
  process.exit(1);
});
