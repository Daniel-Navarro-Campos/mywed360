// Generic Firestore helpers for collections nested under users/{uid}/{collection}
// Usage: await addItem('guests', { name: 'Ana' })

import { auth, db } from '../lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

const colRef = (name) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('User not authenticated');
  return collection(db, 'users', uid, name);
};

export const getAll = async (name) => {
  const snap = await getDocs(colRef(name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addItem = async (name, item) => {
  const ref = await addDoc(colRef(name), {
    ...item,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateItem = async (name, id, changes) => {
  await updateDoc(doc(db, 'users', auth.currentUser.uid, name, id), changes);
};

export const setItem = async (name, id, item) => {
  await setDoc(doc(db, 'users', auth.currentUser.uid, name, id), item);
};

export const deleteItem = async (name, id) => {
  await deleteDoc(doc(db, 'users', auth.currentUser.uid, name, id));
};
