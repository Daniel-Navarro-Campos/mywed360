import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUserContext } from './UserContext';

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

export default function WeddingProvider({ children }) {
  const [weddings, setWeddings] = useState([]);
  const { user } = useUserContext();
  const [activeWedding, setActiveWeddingState] = useState(() => {
    return localStorage.getItem('lovenda_active_wedding') || '';
  });

  // Cargar lista de bodas del planner desde Firestore
  useEffect(() => {
    let unsubscribe;
    async function listenWeddings() {
      
      if (!user) return; // espera a que cargue usuario
      try {
        const { db } = await import('../firebaseConfig');
        const { collection, query, where, onSnapshot } = await import('firebase/firestore');
        // Usar el nombre de campo correcto según el esquema de datos
        const q = query(collection(db, 'weddings'), where('plannerIds', 'array-contains', user.uid));
        unsubscribe = onSnapshot(q, (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setWeddings(list);
          // Si no hay boda activa selecciona la primera
          if (!activeWedding && list.length) {
            setActiveWeddingState(list[0].id);
          }
        });
      } catch (err) {
        console.warn('No se pudo cargar bodas del planner:', err);
      }
    }
    listenWeddings();
  }, [user]);

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
