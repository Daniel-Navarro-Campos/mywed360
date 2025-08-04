import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * Devuelve el usuario cuyo email coincida exactamente (lowercase).
 * @param {string} email
 * @returns {Promise<object|null>} datos del usuario o null si no existe
 */
export async function getUserByEmail(email) {
  if (!email) return null;
  const q = query(
    collection(db, 'users'),
    where('email', '==', email.toLowerCase()),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}
