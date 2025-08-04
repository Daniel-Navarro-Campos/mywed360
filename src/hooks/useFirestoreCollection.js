import { useEffect, useState, useCallback } from 'react';
import useWeddingCollection from './useWeddingCollection';
import { useWedding } from '../context/WeddingContext';
import { auth, db } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addItem as addItemFS,
  updateItem as updateItemFS,
  deleteItem as deleteItemFS,
  getAll as getAllFS,
} from '../utils/firestoreCollection';

// Fallback helpers using localStorage when the user is not authenticated
const localKey = (name) => `lovenda${name[0].toUpperCase()}${name.slice(1)}`;
const lsGet = (name, fallback) => {
  try {
    const stored = localStorage.getItem(localKey(name));
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return fallback;
};
const lsSet = (name, data) => {
  localStorage.setItem(localKey(name), JSON.stringify(data));
  window.dispatchEvent(new Event(`lovenda-${name}`));
};

/**
 * React hook that subscribes to users/{uid}/{collectionName} in Firestore.
 * If the user is not authenticated, it falls back to LocalStorage.
 * Returns { data, loading, addItem, updateItem, deleteItem }
 */
export const useFirestoreCollection = (collectionName, fallback = []) => {
  const { activeWedding } = useWedding();
  // Si hay boda activa, delegamos a useWeddingCollection (ruta nueva)
  if (activeWedding) {
    return useWeddingCollection(collectionName, activeWedding, fallback);
  }
  const [data, setData] = useState(() => lsGet(collectionName, fallback));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubFS = null;
    // Función para inicializar listener Firestore cuando tengamos UID
    const initFirestoreListener = (uid) => {
      const q = query(collection(db, 'users', uid, collectionName), orderBy('createdAt', 'asc'));
      unsubFS = onSnapshot(q,
        (snap) => {
          const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setData(arr);
          lsSet(collectionName, arr);
          setLoading(false);
        },
        (error) => {
          console.error(`Error escuchando colección ${collectionName}:`, error);
          setData(lsGet(collectionName, fallback));
          setLoading(false);
        }
      );
    };

    const uid = auth.currentUser?.uid;
    if (uid) {
      initFirestoreListener(uid);
      return () => {
        if (typeof unsubFS === 'function') unsubFS();
      };
    } else {
      // No autenticado todavía → usar LocalStorage y esperar al login
      const handlerLS = () => setData(lsGet(collectionName, fallback));
      window.addEventListener(`lovenda-${collectionName}`, handlerLS);
      setLoading(false);

      // Esperamos a que el usuario inicie sesión para sincronizar datos
      const unsubAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          initFirestoreListener(user.uid);
          // Sincronizar datos locales pendientes
          if (Array.isArray(data) && data.length) {
            data.forEach((item) => addItemFS(collectionName, item).catch(()=>{}));
          }
        }
      });

      return () => {
        window.removeEventListener(`lovenda-${collectionName}`, handlerLS);
        unsubAuth();
        if (typeof unsubFS === 'function') unsubFS();
      };
    }

  }, [collectionName, fallback]);

  const addItem = useCallback(async (item) => {
    if (auth.currentUser?.uid) {
      await addItemFS(collectionName, item);
    } else {
      const next = [...data, { ...item, id: Date.now() }];
      setData(next);
      lsSet(collectionName, next);
    }
  }, [collectionName, data]);

  const updateItem = useCallback(async (id, changes) => {
    if (auth.currentUser?.uid) {
      await updateItemFS(collectionName, id, changes);
    } else {
      const next = data.map((d) => (d.id === id ? { ...d, ...changes } : d));
      setData(next);
      lsSet(collectionName, next);
    }
  }, [collectionName, data]);

  const deleteItem = useCallback(async (id) => {
    if (auth.currentUser?.uid) {
      await deleteItemFS(collectionName, id);
    } else {
      const next = data.filter((d) => d.id !== id);
      setData(next);
      lsSet(collectionName, next);
    }
  }, [collectionName, data]);

  return { data, loading, addItem, updateItem, deleteItem };
};
