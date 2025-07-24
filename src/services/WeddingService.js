// Servicio para gestionar bodas y vincular cuentas (novios y planners)
// Cada documento en la colección "weddings" representa una boda.
// Estructura mínima de un doc:
// {
//   ownerIds: [uid1, uid2],   // novios con acceso total
//   plannerIds: [uid3, ...],  // planners que gestionan varias bodas
//   subscription: {
//     tier: 'free' | 'premium',
//     renewedAt: Timestamp
//   },
//   createdAt: Timestamp
// }

import { db } from '../lib/firebase';
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
  addDoc,
  collection,
  Timestamp
} from 'firebase/firestore';

import { v4 as uuidv4 } from 'uuid';

/**
 * Crea una nueva boda y asigna al usuario como propietario principal.
 * @param {string} uid - UID del usuario creador.
 * @param {object} [extraData] - Datos opcionales de la boda (fecha, nombre...)
 * @returns {Promise<string>} weddingId creado
 */
export async function createWedding(uid, extraData = {}) {
  if (!uid) throw new Error('uid requerido');
  const weddingId = uuidv4();
  const ref = doc(db, 'weddings', weddingId);
  const base = {
    ownerIds: [uid],
    plannerIds: [],
    subscription: { tier: 'free', renewedAt: Timestamp.now() },
    createdAt: Timestamp.now(),
    ...extraData,
  };
  await setDoc(ref, base);
  // Actualizar doc del usuario con su weddingId principal
  await updateDoc(doc(db, 'users', uid), { weddingId });
  return weddingId;
}

/**
 * Crea una invitación para otro novio/a.
 * @param {string} weddingId
 * @param {string} email
 * @returns {Promise<string>} invitationCode
 */
export async function invitePartner(weddingId, email) {
  return createInvitation(weddingId, email, 'partner');
}

/**
 * Crea una invitación para un wedding planner.
 * @param {string} weddingId
 * @param {string} email
 * @returns {Promise<string>} invitationCode
 */
export async function invitePlanner(weddingId, email) {
  return createInvitation(weddingId, email, 'planner');
}

async function createInvitation(weddingId, email, role) {
  if (!weddingId || !email) throw new Error('parámetros requeridos');
  const code = uuidv4();
  await setDoc(doc(db, 'weddingInvitations', code), {
    weddingId,
    email: email.toLowerCase(),
    role, // 'partner' | 'planner'
    createdAt: Timestamp.now(),
  });
  return code;
}

/**
 * Acepta una invitación (partner o planner) y agrega el uid al array correspondiente.
 * @param {string} code - invitation code
 * @param {string} uid  - usuario que acepta
 */
export async function acceptInvitation(code, uid) {
  if (!code || !uid) throw new Error('parámetros requeridos');
  const invRef = doc(db, 'weddingInvitations', code);
  const snap = await getDoc(invRef);
  if (!snap.exists()) throw new Error('Invitación no encontrada');
  const { weddingId, role } = snap.data();
  const wedRef = doc(db, 'weddings', weddingId);
  if (role === 'partner') {
    await updateDoc(wedRef, { ownerIds: arrayUnion(uid) });
  } else if (role === 'planner') {
    await updateDoc(wedRef, { plannerIds: arrayUnion(uid) });
  }
  // Guardar weddingId en perfil de usuario si es partner
  if (role === 'partner') {
    await updateDoc(doc(db, 'users', uid), { weddingId });
  }
  // eliminar invitación o marcar como aceptada
  await setDoc(invRef, { acceptedAt: Timestamp.now() }, { merge: true });
  return weddingId;
}
