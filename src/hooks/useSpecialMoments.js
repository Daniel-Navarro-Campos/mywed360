import { useState, useEffect, useCallback } from 'react';

/*
  Hook: useSpecialMoments
  Gestiona los momentos especiales de la boda de forma compartida entre las páginas
  Momentos Especiales y Timing. La información se almacena en localStorage y se
  sincroniza entre pestañas mediante el evento 'moments-updated'.
*/
const STORAGE_KEY = 'lovendaSpecialMoments';

// Estructura inicial por defecto
const defaultData = {
  ceremonia: [
    { id: 1, order: 1, title: 'Entrada Novio', song: 'Canon in D – Pachelbel' },
    { id: 2, order: 2, title: 'Entrada Novia', song: 'Bridal Chorus – Wagner' },
    { id: 3, order: 3, title: 'Lectura 1', song: 'A Thousand Years' },
    { id: 4, order: 4, title: 'Lectura 2', song: '' },
    { id: 5, order: 5, title: 'Intercambio de Anillos', song: '' },
    { id: 6, order: 6, title: 'Salida', song: '' },
  ],
  coctail: [
    { id: 7, order: 1, title: 'Entrada', song: '' },
  ],
  banquete: [
    { id: 8, order: 1, title: 'Entrada Novios', song: '' },
    { id: 9, order: 2, title: 'Corte Pastel', song: '' },
    { id: 10, order: 3, title: 'Discursos', song: '' },
  ],
  disco: [
    { id: 11, order: 1, title: 'Primer Baile', song: '' },
    { id: 12, order: 2, title: 'Animar pista', song: '' },
    { id: 13, order: 3, title: 'Último tema', song: '' },
  ],
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultData;
}

export default function useSpecialMoments() {
  const [moments, setMoments] = useState(load);

  // Persistir en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(moments));
    window.dispatchEvent(new Event('moments-updated'));
  }, [moments]);

  // Escuchar cambios desde otras pestañas/componentes
  useEffect(() => {
    const handler = () => setMoments(load());
    window.addEventListener('moments-updated', handler);
    return () => window.removeEventListener('moments-updated', handler);
  }, []);

  const addMoment = useCallback((blockId, moment) => {
    setMoments(prev => {
      const next = { ...prev };
      next[blockId] = [...(prev[blockId] || []), { ...moment, id: Date.now() }];
      return next;
    });
  }, []);

  const removeMoment = useCallback((blockId, momentId) => {
    setMoments(prev => {
      const next = { ...prev };
      next[blockId] = prev[blockId].filter(m => m.id !== momentId);
      return next;
    });
  }, []);

  const updateMoment = useCallback((blockId, momentId, changes) => {
    setMoments(prev => {
      const next = { ...prev };
      next[blockId] = prev[blockId].map(m => m.id === momentId ? { ...m, ...changes } : m);
      return next;
    });
  }, []);

  // Reordenar (arriba/abajo) un momento dentro de su bloque
  const reorderMoment = useCallback((blockId, momentId, direction='up') => {
    setMoments(prev => {
      const current = prev[blockId] || [];
      const idx = current.findIndex(m => m.id === momentId);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= current.length) return prev;
      const swapped = [...current];
      [swapped[idx], swapped[newIdx]] = [swapped[newIdx], swapped[idx]];
      // Recalcular order
      const updatedList = swapped.map((m, i) => ({ ...m, order: i + 1 }));
      return { ...prev, [blockId]: updatedList };
    });
  }, []);

  
  const duplicateMoment = useCallback((fromBlock, momentId, toBlock) => {
    if (fromBlock === toBlock) return;
    setMoments(prev => {
      const sourceList = prev[fromBlock] || [];
      const moment = sourceList.find(m => m.id === momentId);
      if (!moment) return prev;
      const destList = prev[toBlock] || [];
      const copy = { ...moment, id: Date.now(), order: destList.length + 1 };
      return { ...prev, [toBlock]: [...destList, copy] };
    });
  }, []);

  return { moments, addMoment, removeMoment, updateMoment, reorderMoment, moveMoment, duplicateMoment };
}
