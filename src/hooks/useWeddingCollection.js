import { useEffect, useState, useCallback } from 'react';
import { auth, db } from '../lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

// Helpers para localStorage (caché offline por boda)
const localKey = (wid, name) => `lovenda_${wid}_${name}`;
const lsGet = (wid, name, fallback) => {
  try {
    const stored = localStorage.getItem(localKey(wid, name));
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return fallback;
};
const lsSet = (wid, name, data) => {
  localStorage.setItem(localKey(wid, name), JSON.stringify(data));
  window.dispatchEvent(new Event(`lovenda-${wid}-${name}`));
};

/**
 * Hook para suscribirse a subcolecciones dentro de una boda:
 * weddings/{weddingId}/{subName}
 * Soporta modo offline usando localStorage.
 */
export const useWeddingCollection = (subName, weddingId, fallback = []) => {
  const [data, setData] = useState(() => lsGet(weddingId, subName, fallback));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intento de migración automática de invitados antiguos
    async function migrateGuests() {
      if (subName !== 'guests' || !weddingId || !auth.currentUser?.uid) return;
      try {
        const {
          getDocs,
          collection: col,
          writeBatch,
          doc: fDoc,
          getDoc,
        } = await import('firebase/firestore');

        const destCol = col(db, 'weddings', weddingId, 'guests');
        const destSnap = await getDocs(destCol);
        const existingIds = new Set(destSnap.docs.map((d) => d.id));

        // 1) Invitados en sub-colección antigua users/{uid}/guests
        const oldSnap = await getDocs(col(db, 'users', auth.currentUser.uid, 'guests'));

        const batch = writeBatch(db);

        oldSnap.forEach((docSnap) => {
          if (!existingIds.has(docSnap.id)) {
            batch.set(fDoc(destCol, docSnap.id), docSnap.data(), { merge: true });
          }
        });

        // 2) Invitados en documento legacy userGuests/{uid}
        const legacyDocRef = fDoc(db, 'userGuests', auth.currentUser.uid);
        const legacyDocSnap = await getDoc(legacyDocRef);
        if (legacyDocSnap.exists()) {
          const legacyData = legacyDocSnap.data();
          const guestsArray = Array.isArray(legacyData?.guests) ? legacyData.guests : [];
          guestsArray.forEach((g) => {
            batch.set(fDoc(destCol), g, { merge: true }); // id aleatorio
          });
        }

        // Si hay operaciones en cola, confirmamos
        if (batch._mutations.length) {
          await batch.commit();
          console.log(`[migración] Invitados fusionados en weddings/${weddingId}/guests`);
        }
      } catch (err) {
        console.warn('Error migrando invitados antiguos:', err);
      }
    }
    migrateGuests();
    // Intento de migración automática de proveedores antiguos
    async function migrateSuppliers() {
      if (subName !== 'suppliers' || !weddingId || !auth.currentUser?.uid) return;
      try {
        const {
          getDocs,
          collection: col,
          writeBatch,
          doc: fDoc,
        } = await import('firebase/firestore');

        const destCol = col(db, 'weddings', weddingId, 'suppliers');
        const destSnap = await getDocs(destCol);
        const existingIds = new Set(destSnap.docs.map((d) => d.id));

        // Origen 1: usuarios/{uid}/proveedores (estructura antigua en español)
        const oldCol1 = col(db, 'usuarios', auth.currentUser.uid, 'proveedores');
        const oldSnap1 = await getDocs(oldCol1);

        // Origen 2: users/{uid}/suppliers (estructura antigua en inglés)
        const oldCol2 = col(db, 'users', auth.currentUser.uid, 'suppliers');
        const oldSnap2 = await getDocs(oldCol2);

        const batch = writeBatch(db);
        [...oldSnap1.docs, ...oldSnap2.docs].forEach((docSnap) => {
          if (!existingIds.has(docSnap.id)) {
            batch.set(fDoc(destCol, docSnap.id), { ...docSnap.data(), migratedAt: serverTimestamp() }, { merge: true });
          }
        });

        if (batch._mutations.length) {
          await batch.commit();
          console.log(`[migración] Proveedores fusionados en weddings/${weddingId}/suppliers`);
        }
      } catch (err) {
        console.warn('Error migrando proveedores antiguos:', err);
      }
    }
    migrateSuppliers();
    if (!weddingId) {
      setLoading(false);
      return; // sin boda activa
    }

    let unsub = null;
    const listen = () => {
      // Intentamos ordenar por createdAt; si el campo no existe en algún documento, Firestore
      // igualmente los devuelve, pero algunos proyectos tienen reglas que lo impiden. Para
      // máxima compatibilidad hacemos la consulta base sin orderBy y ordenamos luego en cliente.
      const colRef = collection(db, 'weddings', weddingId, ...subName.split('/'));
      const q = colRef;
      unsub = onSnapshot(q, (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setData(arr);
        lsSet(weddingId, subName, arr);
        setLoading(false);
      }, (err) => {
        console.error(`Snapshot error ${subName}:`, err);
        setData(lsGet(weddingId, subName, fallback));
        setLoading(false);
      });
    };

    // Si aún no hay weddingId, usa solo caché local
    if (!weddingId) {
      setData(lsGet(weddingId, subName, fallback));
      setLoading(false);
      return;
    }
    // Intentamos siempre escuchar Firestore; si falla por permisos usamos caché local
    listen();
    return () => unsub && unsub();
  }, [subName, weddingId]);

  const addItem = useCallback(
    async (item) => {
      // 1) Cuando hay boda activa intentamos guardar en Firestore
      if (weddingId) {
        try {
          const colRef = collection(db, 'weddings', weddingId, ...subName.split('/'));
          // Clonamos sin incluir el campo id para evitar redundancia
          const { id: _tmpId, ...dataWithoutId } = item;
          const docRef = await addDoc(colRef, {
            ...dataWithoutId,
            createdAt: serverTimestamp(),
          });

          const saved = { ...item, id: docRef.id };
          // Actualizamos estado local inmediatamente para feedback optimista
          setData(prev => [...prev, saved]);
          lsSet(weddingId, subName, [...data, saved]);

          return saved;
        } catch (err) {
          console.warn('addItem Firestore failed, usando localStorage:', err);
          // Si falla, continuamos al modo offline
        }
      }

      // 2) Modo offline o fallo de permisos: persistimos en localStorage
      if (!weddingId) {
        console.warn('addItem: sin weddingId activo; se guarda solo en localStorage');
      }

      const offlineItem = { ...item, id: item.id || Date.now() };
      const next = [...data, offlineItem];
      setData(next);
      lsSet(weddingId, subName, next);
      return offlineItem;
    },
    [subName, weddingId, data]
  );

  const updateItem = useCallback(async (id, changes) => {
    if (weddingId) {
      try {
        await updateDoc(doc(db, 'weddings', weddingId, ...subName.split('/'), id), changes);
        return;
      } catch (err) {
        console.warn('updateItem Firestore failed, usando localStorage:', err);
      }
    }
    if (!weddingId) console.warn('updateItem: sin weddingId activo; se guarda solo en localStorage');
    const next = data.map((d) => (d.id === id ? { ...d, ...changes } : d));
    setData(next);
    lsSet(weddingId, subName, next);
  }, [subName, weddingId, data]);

  const deleteItem = useCallback(async (id) => {
    if (weddingId) {
      try {
        await deleteDoc(doc(db, 'weddings', weddingId, ...subName.split('/'), id));
        return;
      } catch (err) {
        console.warn('deleteItem Firestore failed, usando localStorage:', err);
      }
    }
    if (!weddingId) console.warn('deleteItem: sin weddingId activo; se guarda solo en localStorage');
    const next = data.filter((d) => d.id !== id);
    setData(next);
    lsSet(weddingId, subName, next);
  }, [subName, weddingId, data]);

  return { data, loading, addItem, updateItem, deleteItem };
};

export default useWeddingCollection;
