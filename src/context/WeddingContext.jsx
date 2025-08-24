import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuthUnified';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Contexto para la boda activa que está gestionando el planner.
 * Almacena:
 *  - weddings: listado de bodas disponibles para el planner
 *  - activeWedding: boda activa seleccionada
 *  - setActiveWedding: función para cambiar la boda activa
 *
 * Persistimos la selección en localStorage para mantenerla entre recargas.
 */
const WeddingContext = createContext({
  weddings: [],
  activeWedding: '',
  setActiveWedding: () => {},
});

export const useWedding = () => useContext(WeddingContext);

async function ensureFinance(weddingId){
  try{
    const fRef = doc(db,'weddings',weddingId,'finance','main');
    const fSnap = await getDoc(fRef);
    if(!fSnap.exists()){
      await setDoc(fRef,{movements:[],createdAt:serverTimestamp()},{merge:true});
      console.log('🆕 finance/main creado para',weddingId);
    }
  }catch(e){
    console.warn('No se pudo asegurar finance para',weddingId,e);
  }
}

export default function WeddingProvider({ children }) {
  const [weddings, setWeddings] = useState([]);
  const { currentUser } = useAuth();
  const [activeWedding, setActiveWeddingState] = useState(() => {
    return localStorage.getItem('lovenda_active_wedding') || '';
  });

  // Cargar lista de bodas del planner desde Firestore
  useEffect(() => {
    let unsubscribe;
    async function listenWeddings() {
      if (!currentUser) return; // espera a que cargue usuario
      try {
        const { db } = await import('../firebaseConfig');
        const { collection, query, where, onSnapshot } = await import('firebase/firestore');

        const plannersQ = query(collection(db, 'weddings'), where('plannerIds', 'array-contains', currentUser.uid));
        const ownersQ = query(collection(db, 'weddings'), where('ownerIds', 'array-contains', currentUser.uid));

        let plannerDocs = [];
        let ownerDocs = [];

        const merge = () => {
          const map = new Map();
          [...plannerDocs, ...ownerDocs].forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
          const list = Array.from(map.values());
          if (import.meta.env.DEV) console.debug('[WeddingContext] bodas cargadas', list.map(l => l.id));
          setWeddings(list);
          // Asegurar finance/main en cada boda listada
          list.forEach(w => ensureFinance(w.id));
          if (!activeWedding && list.length) setActiveWeddingState(list[0].id);
        };

        const unsub1 = onSnapshot(plannersQ, (snap) => {
          if (import.meta.env.DEV) console.debug('[WeddingContext] planners snapshot', snap.size);
          plannerDocs = snap.docs;
          merge();
        });
        const unsub2 = onSnapshot(ownersQ, (snap) => {
          if (import.meta.env.DEV) console.debug('[WeddingContext] owners snapshot', snap.size);
          ownerDocs = snap.docs;
          merge();
        });
        unsubscribe = () => { unsub1(); unsub2(); };
      } catch (err) {
        console.warn('No se pudo cargar bodas del planner:', err);
      }
    }
    listenWeddings();
  }, [currentUser]);

  const setActiveWedding = (id) => {
    setActiveWeddingState(id);
    localStorage.setItem('lovenda_active_wedding', id);
  };

  return (
    <WeddingContext.Provider value={{ weddings, activeWedding, setActiveWedding }}>
      {children}
    </WeddingContext.Provider>
  );
}
