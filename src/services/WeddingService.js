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
import { query, where, getDocs, limit } from 'firebase/firestore';


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

/**
 * Conecta directamente la cuenta de un Wedding Planner con la boda indicada (sin invitación).
 * Solo debe ser usada por el propietario de la boda o un administrador.
 * @param {string} weddingId
 * @param {string} plannerUid
 */
/**
 * Devuelve el primer weddingId donde el usuario es owner.
 * @param {string} uid
 * @returns {Promise<string|null>}
 */
export async function getWeddingIdForOwner(uid) {
  const q = query(collection(db, 'weddings'), where('ownerIds', 'array-contains', uid), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}

/**
 * Devuelve todas las bodas donde el plannerUid figura en plannerIds.
 * @param {string} plannerUid
 * @returns {Promise<Array<{id:string,name:string,weddingDate?:string,location?:string,progress?:number}>>}
 */
export async function getWeddingsForPlanner(plannerUid) {
  if (!plannerUid) return [];
  const q = query(collection(db, 'weddings'), where('plannerIds', 'array-contains', plannerUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addPlannerToWedding(weddingId, plannerUid) {
  if (!weddingId || !plannerUid) throw new Error('parámetros requeridos');
  const wedRef = doc(db, 'weddings', weddingId);
  await updateDoc(wedRef, { plannerIds: arrayUnion(plannerUid) });
  // Opcional: guardar referencia de bodas que gestiona el planner
  await updateDoc(doc(db, 'users', plannerUid), { plannerWeddingIds: arrayUnion(weddingId) });
  return true;
}
