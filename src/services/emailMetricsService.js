// Servicio para obtener métricas agregadas de Firestore
// Cada usuario tiene un documento en la colección "emailMetrics" con los campos
// calculados por la Cloud Function que procesa los eventos de Mailgun.
// Si no existe el documento se devolverá null.

import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Devuelve el documento de métricas agregadas (resumen) para un usuario
 * @param {string} userId
 * @returns {Promise<Object|null>} datos de métricas o null si no existen
 */
export async function getAggregatedStats(userId) {
  if (!userId) return null;
  try {
    const ref = doc(db, 'emailMetrics', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data();
  } catch (err) {
    console.error('Error obteniendo métricas agregadas:', err);
    return null;
  }
}

/**
 * Devuelve las métricas diarias recientes de un usuario (subcolección "daily")
 * @param {string} userId
 * @param {number} days - número de días a recuperar
 * @returns {Promise<Array>} lista de docs [{ date: 'YYYY-MM-DD', sent, received, opens, clicks }]
 */
export async function getDailyStats(userId, days = 30) {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, 'emailMetrics', userId, 'daily'),
      orderBy('date', 'desc'),
      limit(days)
    );
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data());
    });
    // Devolver ordenado ascendente por fecha
    return list.reverse();
  } catch (err) {
    console.error('Error obteniendo métricas diarias:', err);
    return [];
  }
}
