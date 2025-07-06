import { useEffect, useState, useCallback } from 'react';
import { auth, db } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
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
  const [data, setData] = useState(() => lsGet(collectionName, fallback));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      // Not logged → keep LocalStorage, listen for manual events
      const handler = () => setData(lsGet(collectionName, fallback));
      window.addEventListener(`lovenda-${collectionName}`, handler);
      setLoading(false);
      return () => window.removeEventListener(`lovenda-${collectionName}`, handler);
    }

    // Logged → real-time Firestore listener
    const q = query(collection(db, 'users', uid, collectionName), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setData(arr);
      // cache to LocalStorage for quicker next load
      lsSet(collectionName, arr);
      setLoading(false);
    });
    return () => unsub();
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
