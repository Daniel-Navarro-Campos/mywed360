import React, { useState, useRef, useEffect, useMemo } from 'react';
import SeatingCanvas from '../features/seating/SeatingCanvas';
// import GuestPanel eliminado
import Modal from '../components/Modal';
import TableConfigModal from '../components/TableConfigModal';
import SeatItem from '../components/SeatItem';
import TemplatesModal from '../components/TemplatesModal';
import CeremonyConfigModal from '../components/CeremonyConfigModal';
import BanquetConfigModal from '../components/BanquetConfigModal';
import SpaceConfigModal from '../components/SpaceConfigModal';
// Drag & Drop context
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { doc as fsDoc, setDoc, getDoc, getDocs, collection as fsCollection, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

import { saveData, loadData, subscribeSyncState, getSyncState } from '../services/SyncService';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import useWeddingCollection from '../hooks/useWeddingCollection';




import html2canvas from 'html2canvas';
// Temporalmente deshabilitado por conflicto con Vite

import SeatingToolbar from '../components/seating/SeatingToolbar';
import jsPDF from 'jspdf';
import PageWrapper from '../components/PageWrapper';
import Card from '../components/Card';

// Flag para desactivar llamadas al microservicio de invitados cuando no hay backend levantado.
// Define VITE_BACKEND_URL en .env.local si quieres habilitarlo.
const API_BASE = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:4004' : '');
const ENABLE_GUEST_API = API_BASE !== '';

// Utilidad para normalizar IDs de mesas (convierte a número si es posible)
export const normalizeId = (id) => {
  const num = parseInt(id, 10);
  return !isNaN(num) ? num : id;
};

// Clean rebuilt SeatingPlan page (v2)
export default function SeatingPlan() {
  const [tab, setTab] = useState('ceremony');
  const { activeWedding } = useWedding();
  const [ceremonyConfigOpen, setCeremonyConfigOpen] = useState(false);
  
  // Estado de sincronización
  const [syncStatus, setSyncStatus] = useState(getSyncState());

  // Cargar dimensiones del salón
  useEffect(() => {

   if (!activeWedding) return;
    (async () => {
      try {
        const cfgRef = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet', 'config');
        const snap = await getDoc(cfgRef);
        if (snap.exists()) {
          const { width, height } = snap.data();
          if (width && height) setHallSize({ width, height });
        }
      } catch (err) {
        console.warn('No se pudieron cargar dimensiones del salón:', err);
      }
    })();
  }, [activeWedding]);

  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);

  const [areasCeremony, setAreasCeremony] = useState([]);
  // Dimensiones del salón (cm)
  const [hallSize, setHallSize] = useState({ width: 1800, height: 1200 });
  const [spaceConfigOpen, setSpaceConfigOpen] = useState(false);

  const [areasBanquet, setAreasBanquet] = useState([]);
  const [tablesCeremony, setTablesCeremony] = useState([]);
  const [seatsCeremony, setSeatsCeremony] = useState([]);
  const [tablesBanquet, setTablesBanquet] = useState([]);

  const areas = tab === 'ceremony' ? areasCeremony : areasBanquet;
  const setAreas = tab === 'ceremony' ? setAreasCeremony : setAreasBanquet;
  const tables = tab === 'ceremony' ? tablesCeremony : tablesBanquet;
  const seats = tab === 'ceremony' ? seatsCeremony : []; // banquet seats not used
  const setTables = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;

  // history for undo/redo
  // ------ Firestore: cargar seatingPlan existente ------
  useEffect(() => {
    if (!activeWedding) return;
    // -- Listener ceremony (document plano) --
    const cerRef = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'ceremony');
    const unsubCer = onSnapshot(cerRef, docSnap => {
      const data = docSnap.exists() ? docSnap.data() : {};
      if (data.tables) setTablesCeremony(data.tables);
      if (data.seats) setSeatsCeremony(data.seats);
      if (data.areas) setAreasCeremony(data.areas);
    });

    // -- Listener banquet (subcolección tables) --
    const banqTablesRef = fsCollection(db, 'weddings', activeWedding, 'seatingPlan', 'banquet', 'tables');
    const unsubBanq = onSnapshot(banqTablesRef, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTablesBanquet(list);
    });
    // -- Listener banquet metadata (áreas) --
    const banqMetaRef = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');
    const unsubBanqMeta = onSnapshot(banqMetaRef, snap => {
      const data = snap.exists() ? snap.data() : {};
      if (data.areas) setAreasBanquet(data.areas);
    });
    // fin listener seatingPlan

    return () => { unsubCer(); unsubBanq(); unsubBanqMeta && unsubBanqMeta(); };
  }, [activeWedding]);

  const historyRef = useRef({ ceremony: [], banquet: [] });


  const pointerRef = useRef({ ceremony: -1, banquet: -1 });

  // ------ Firestore: guardar cambios (debounce 500ms) ------
  useEffect(() => {
    if (!activeWedding) return;
    const t = setTimeout(() => {
      const payload = { tables: tablesCeremony, seats: seatsCeremony, areas: areasCeremony };
      setDoc(fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'ceremony'), payload, { merge: true });
    }, 500);
    return () => clearTimeout(t);
  }, [activeWedding, tablesCeremony, seatsCeremony, areasCeremony]);

  // --- Migración automática de formato antiguo ---
  useEffect(() => {
    if (!activeWedding) return;
    // Si aún no hay mesas en subcolección pero existen en doc antiguo, migrar.
    (async () => {
      try {
        if (tablesBanquet.length > 0) return; // ya existen mesas en nuevo formato (listener llenó estado)
        const banqDocRef = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');
        const banqSnap = await getDoc(banqDocRef);
        if (!banqSnap.exists()) return;
        const data = banqSnap.data() || {};
        if (!Array.isArray(data.tables) || data.tables.length === 0) return;
        console.log('Migrando mesas de banquete al nuevo formato…');
        const colRef = fsCollection(db, 'weddings', activeWedding, 'seatingPlan', 'banquet', 'tables');
        const batch = writeBatch(db);
        data.tables.forEach(tbl => {
          if (!tbl || tbl.id === undefined) return;
          const docRef = fsDoc(colRef, String(tbl.id));
          batch.set(docRef, tbl, { merge: true });
        });
        await batch.commit();
        console.log('Migración completada.');
      } catch (err) {
        console.error('Error migrando mesas de banquete:', err);
      }
    })();
  }, [activeWedding, tablesBanquet]);

  // --- Generar mesas desde invitados si la subcolección está vacía ---
  useEffect(() => {
    if (!activeWedding) return;
    (async () => {
      try {
        const tablesCol = fsCollection(db, 'weddings', activeWedding, 'seatingPlan', 'banquet', 'tables');
        const tablesSnap = await getDocs(tablesCol);
        const existingIds = new Set(tablesSnap.docs.map((d) => d.id));
        // Batch para operaciones atómicas y contador para posicionar mesas nuevas
        const batch = writeBatch(db);
        let idx = tablesSnap.size; // empezamos a contar tras las mesas existentes

        // Obtener invitados con tableId
        const guestsCol = fsCollection(db, 'weddings', activeWedding, 'guests');
        const guestsSnap = await getDocs(guestsCol);
        console.groupCollapsed('[SeatingPlan debug] Sincronización de mesas');
        console.log('Invitados leídos:', guestsSnap.size);
        console.log('Docs mesas existentes:', tablesSnap.size);

        const tableMap = {};
        guestsSnap.forEach((g) => {
          const data = g.data();
          const tidRaw = data.tableId ?? data.table;
          if (tidRaw === undefined || tidRaw === null) return;
          const tidStr = String(tidRaw).trim();
          if (tidStr === '' || tidStr === '0') return; // ignorar sin asignar o valor 0
          const tid = tidStr;
          if (!tableMap[tid]) tableMap[tid] = [];
          tableMap[tid].push({ id: g.id, name: data.name || data.nombre || '', companion: data.companion || 0 });
        });
        const ids = new Set(Object.keys(tableMap));
        console.log('Mesas detectadas a partir de invitados:', [...ids]);
        console.log('Mapa invitados por mesa (primeros 2):', Object.fromEntries(Object.entries(tableMap).slice(0,2)));

        const missing = [...ids].filter((tid) => !existingIds.has(tid));
        console.log('Mesas faltantes (a crear):', missing);

        if (missing.length > 0) {
          console.log(`Creando ${missing.length} mesas que faltaban según invitados…`);
          // Crear mesas faltantes
          missing.forEach((tid) => {
            const docRef = fsDoc(tablesCol, tid);
            const x = 120 + (idx % 5) * 140;
            const y = 160 + Math.floor(idx / 5) * 160;
            batch.set(docRef, {
              id: parseInt(tid, 10) || tid,
              name: `Mesa ${tid}`,
              shape: 'circle',
              seats: 10,
              x,
              y,
              enabled: true,
            }, { merge: true });
            idx += 1;
          });
        }

        // Eliminar mesas huérfanas (sin invitados)
        const orphan = [...existingIds].filter((tid) => !ids.has(tid));
        console.log('Mesas huérfanas (a eliminar):', orphan);
        orphan.forEach((tid) => {
          const docRef = fsDoc(tablesCol, tid);
          batch.delete(docRef);
        });

        // Actualizar assignedGuests en TODAS las mesas detectadas (existentes y nuevas)
        Object.entries(tableMap).forEach(([tid, list]) => {
          const docRef = fsDoc(tablesCol, tid);
          batch.set(docRef, { assignedGuests: list }, { merge: true });
        });

        await batch.commit();
        console.log('Mesas sincronizadas con invitados.');
      } catch (err) {
        console.error('Error generando mesas desde invitados:', err);
      }
    })();
  }, [activeWedding]);

  // Guardar mesas de banquete en subcolección `banquet/tables`
  useEffect(() => {
    if (!activeWedding) return;
    const t = setTimeout(async () => {
      try {
        const colRef = fsCollection(db, 'weddings', activeWedding, 'seatingPlan', 'banquet', 'tables');
        const batch = writeBatch(db);
        tablesBanquet.forEach(tbl => {
          const docRef = fsDoc(colRef, String(tbl.id));
          batch.set(docRef, tbl, { merge: true });
        });
        await batch.commit();
      } catch (err) {
        console.error('Error sincronizando mesas de banquete:', err);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [activeWedding, tablesBanquet]);

  // Guardar áreas de banquete en documento `seatingPlan/banquet`
  useEffect(() => {
    if (!activeWedding) return;
    const t = setTimeout(() => {
      setDoc(fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet'), { areas: areasBanquet }, { merge: true });
    }, 500);
    return () => clearTimeout(t);
  }, [activeWedding, areasBanquet]);

  // Guarda un snapshot en el historial y coloca el puntero al final
  // Añade un nuevo snapshot al historial respetando el puntero actual.
  const pushHistory = (snapshot) => {
    const key = tab;
    const deepCopy = JSON.parse(JSON.stringify(snapshot));
    const currentHist = historyRef.current[key] || [];
    const ptr = pointerRef.current[key];

    // Si el usuario hizo undo y luego edita, descartamos la parte futura
    const truncated = currentHist.slice(0, ptr + 1);
    const newHist = [...truncated, deepCopy].slice(-50); // límite 50
    historyRef.current[key] = newHist;
    pointerRef.current[key] = newHist.length - 1;
  };

  // keyboard shortcuts
  useEffect(()=>{
    const handler = (e)=>{
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){
        e.preventDefault();
        if(e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener('keydown',handler);
    return ()=>window.removeEventListener('keydown',handler);
  },[]);

  const undo = () => {
    const key = tab;
    const ptr = pointerRef.current[key];
    if (ptr > 0) {
      pointerRef.current[key] = ptr - 1;
      const snapshot = historyRef.current[key][ptr - 1];
      key==='ceremony' ? setTablesCeremony(snapshot) : setTablesBanquet(snapshot);
    }
  };
  const redo = () => {

    const key = tab;
    const hist = historyRef.current[key];
    const ptr = pointerRef.current[key];
    if (ptr < hist.length - 1) {
      pointerRef.current[key] = ptr + 1;
      const snapshot = hist[ptr + 1];
      key==='ceremony' ? setTablesCeremony(snapshot) : setTablesBanquet(snapshot);
    }
  };

  // Invitados en tiempo real desde Firestore
  // Invitados en tiempo real desde Firestore
  const { data: dbGuests } = useWeddingCollection('guests', activeWedding, []);
  const [guests, setGuests] = useState([]);

  // Mantener estado local basado en Firestore
  useEffect(() => {
    setGuests(dbGuests);
    console.log('[SeatingPlan] Firestore guests loaded', dbGuests.length, dbGuests);
  }, [dbGuests]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedSeatId, setSelectedSeatId] = useState(null);
  const [online, setOnline] = useState(1);

  // Tabla actualmente seleccionada
  const selectedTable = useMemo(()=> tables.find(t => String(t.id) === String(selectedTableId)), [tables, selectedTableId]);

  const handleTableDimensionChange = (field, value) => {
    if(!selectedTableId) return;
    setTables(prev => prev.map(t => String(t.id) === String(selectedTableId) ? { ...t, [field]: +value } : t));
  };

  // Seleccionar mesa para mostrar invitados en panel lateral
  const handleSelectTable = (id) => {
    setSelectedTableId(id);
    setSelectedSeatId(null);
  };

  // La lógica de habilitar/deshabilitar sillas se encuentra más abajo (única definición).

  // Panel de dibujo
  // drawMode: '', 'pan', 'move', 'free', 'line'
  const [drawMode, setDrawMode] = useState('');
  const toggleSelectedTableShape = () => {
    if(!selectedTableId) return;
    // snapshot para undo
    pushHistory(tables);
    setTables(prev => prev.map(t => String(t.id) === String(selectedTableId) ? { ...t, shape: t.shape === 'circle' ? 'rect' : 'circle' } : t));
  };
  // Seleccionar backend según dispositivo
  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Número real de mesas (únicas) considerando tanto las dibujadas como las referenciadas por invitados
  // Número total de elementos (mesas o sillas) según pestaña
  // Recuento de mesas distintas según campo `table`/`tableId` en invitados
  // Recuento de mesas teniendo en cuenta:
    // 1) Mesas existentes en el plano de banquete (tablesBanquet)
    // 2) IDs de mesa referenciados por los invitados (table | tableId)
    // De esta forma reflejamos tanto las mesas "vacías" como las ya asignadas.
    const tableCount = useMemo(() => {
      const set = new Set();

      // 1. Mesas dibujadas (solo banquet)
      tablesBanquet.forEach(t => {
        if (t && t.enabled !== false && t.id !== undefined && t.id !== null) {
          set.add(String(t.id));
        }
      });

      // 2. Mesas referenciadas por invitados
      guests.forEach(g => {
        const v = g.tableId ?? g.table;
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          set.add(String(v).trim());
        }
      });

      return set.size;
    }, [tablesBanquet, guests]);

    // Actualizar tableCount en Firestore cada vez que cambie
    useEffect(() => {
      console.log('[SeatingPlan] tableCount', tableCount);
      setDoc(fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'config'), { tablesCount: tableCount }, { merge: true });
    }, [activeWedding, tableCount]);

  // Sincronizar el número de mesas con la gestión de invitados (ceremonia)
  useEffect(() => {
    // Obtener identificadores (id numérico o nombre) que figuran en la lista de invitados
    console.log('[SeatingPlan] Ceremony sync - guests length', guests.length);

    const idsFromGuests = guests
      .map(g => g.tableId ?? g.table)
      .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
      .map(v => String(v).trim());

    if (idsFromGuests.length === 0) {
      // Si ningún invitado referencia mesas, conservamos las mesas existentes añadidas manualmente
      return;
    }

    // Normalizar IDs para evitar duplicados
    const normalizeId = (id) => {
      // Intentar convertir a número si es posible, sino dejar como string
      const num = parseInt(id, 10);
      return !isNaN(num) ? num : id;
    };
    
    // Agrupar IDs que podrían representar la misma mesa
    // Por ejemplo, '1' y 1 deberían considerarse el mismo ID
    const groupedIds = {};
    
    idsFromGuests.forEach(idStr => {
      const normalizedId = normalizeId(idStr);
      // Usar el ID normalizado como clave, pero guardar la forma string
      // para mantener la consistencia visual
      if (!groupedIds[normalizedId]) {
        groupedIds[normalizedId] = idStr;
      }
    });
    
    // Sincronizar mesas existentes con estos identificadores/nombres
    setTablesCeremony(prev => {
      // Usar los IDs agrupados/normalizados para evitar duplicados
      const uniqueNormalizedIds = Object.keys(groupedIds);
      
      // Crear mapas de búsqueda rápida con IDs normalizados
      const byId = new Map(prev.map(t => [normalizeId(t.id), t]));
      const byName = new Map(prev.filter(t => t.name).map(t => [normalizeId(t.name), t]));

      // 1. Actualizar o crear mesas necesarias
      const updated = uniqueNormalizedIds.map(normalizedId => {
        // Obtener la forma string original para mantener la presentación
        const idStr = groupedIds[normalizedId];
        
        // ¿Existe por id normalizado o por nombre normalizado?
        const existing = byId.get(normalizedId) || byName.get(normalizedId);
        if (existing) {
          // Devolver copia con nombre sincronizado (por si cambió)
          return { ...existing, name: idStr };
        }
        
        // Si es numérico, usarlo como id, sino usar el string
        const id = typeof normalizedId === 'number' ? normalizedId : idStr;
        
        // Crear nueva mesa
        return {
          id: id,
          name: idStr,
          x: 120 + Math.random() * 200,
          y: 120 + Math.random() * 200,
          shape: 'circle',
          seats: 8,
        };
      });

      // Combinar con mesas existentes no referenciadas por invitados (p.ej. añadidas manualmente)
      const extras = prev.filter(t => {
        const norm = normalizeId(t.id);
        return !uniqueNormalizedIds.some(id => id == norm);
      });
      return [...extras, ...updated];
    });
  }, [guests]);

  // Sincronizar mesas de BANQUETE con la gestión de invitados
  useEffect(() => {
    if(tab!=='banquet') return;
    // Sólo actualizamos mesas existentes; no creamos nuevas
    setTablesBanquet(prev => prev.map(t => {
      const guestsForTable = guests.filter(g => String(g.tableId ?? g.table).trim() === String(t.id));
      return {
        ...t,
        assignedGuests: guestsForTable.slice(0, t.seats || 8),
      };
    }));
  }, [guests, tab]);

    /*
console.log('[SeatingPlan] Banquet sync - guests length', guests.length);
    const idsFromGuests = guests
      .map(g => g.tableId ?? g.table)
      .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
      .map(v => String(v).trim());

    if (idsFromGuests.length === 0) {
      return; // nada que sincronizar si ningún invitado tiene mesa asignada
    }

    // Agrupar IDs normalizados para evitar duplicados ("1" y 1)
    const groupedIds = {};
    idsFromGuests.forEach(idStr => {
      const normalizedId = normalizeId(idStr);
      if (!groupedIds[normalizedId]) groupedIds[normalizedId] = idStr;
    });

    setTablesBanquet(prev => {
        const uniqueNormalizedIds = Object.keys(groupedIds);
        const byId = new Map(prev.map(t => [normalizeId(t.id), t]));
        const byName = new Map(prev.filter(t => t.name).map(t => [normalizeId(t.name), t]));

        // Sólo tocar mesas existentes
        const updated = uniqueNormalizedIds
          .map(normalizedId => {
            const idStr = groupedIds[normalizedId];
            const existing = byId.get(normalizedId) || byName.get(normalizedId);
            if (!existing) return null;
            const guestsForTable = guests.filter(g => String(g.tableId ?? g.table).trim() === idStr);
            return {
              ...existing,
              name: idStr,
              assignedGuests: guestsForTable.slice(0, existing.seats || 8),
            };
          })
          .filter(Boolean);

        // Mantener mesas que ya no tienen invitados (extras) para que el usuario decida
        const extras = prev.filter(t => {
          const norm = normalizeId(t.id);
          return !uniqueNormalizedIds.some(id => id == norm);
        });

        return [...extras, ...updated];
      });

      // Eliminar mesas huérfanas (sin invitados)
      const extras = prev.filter(t => {
        const norm = normalizeId(t.id);
        return !uniqueNormalizedIds.some(id => id == norm);
      });

      return [...extras, ...updated];
    });
  }, [guests]);
/*
  useEffect(()=>{
    // Solo para ceremonia; para banquete la lógica ya asigna via assignedGuests
    const idsFromGuests = guests
      .map(g => g.tableId ?? g.table)
      .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
      .map(v => String(v).trim());
    if(idsFromGuests.length===0) return;
    setTablesCeremony(prev=>{
      const idsUnique = Array.from(new Set(idsFromGuests));
      // Mapear los ids actuales a sus mesas si existen
      const currentMap = new Map(prev.map(t=>[String(t.id), t]));
      // Generar la lista final manteniendo posición para mesas existentes y creando nuevas para ids nuevos
      const synced = idsUnique.map(idStr=>{
        const existing = currentMap.get(idStr);
        if(existing) return existing;
        const idNum = parseInt(idStr,10) || idStr;
        return {id:idNum,x:120+Math.random()*200,y:120+Math.random()*200,shape:'circle',seats:8};
      });
      return synced;
    });
      // Crear lista a partir de los ids únicos de invitados
      const uniqueIds = Array.from(new Set(idsFromGuests));
      const newTables = uniqueIds.map(idStr=>{
        const existing = prev.find(t=> String(t.id)===idStr);
        if(existing) return existing;
        const idNum = parseInt(idStr,10) || idStr;
        return {id: idNum, x: 120+Math.random()*200, y: 120+Math.random()*200, shape:'circle', seats:8};
      });
      return newTables;
    });






      });





    });

*/

  useEffect(()=>{
     const loadGuests = async ()=>{
       let got = [];
       try{
         if(ENABLE_GUEST_API){
            const res = await fetch(`${API_BASE}/api/guests`);
            if(res.ok){
              got = await res.json();
            }
          }
       }catch(e){
         console.warn('Sin backend /api/guests, cargando desde SyncService');
       }
       if(!Array.isArray(got) || got.length===0){
    try{ 
      got = await loadData('lovendaGuests', { 
        defaultValue: [], 
        collection: 'userGuests'
      }); 
    }catch(error){ 
      console.error('Error al cargar invitados desde SyncService:', error);
      got=[]; 
    }
  }
  // Fallback final: leer directamente de Firestore si sigue vacío
  if(got.length===0 && activeWedding){
    try {
      const guestsCol = fsCollection(db, 'weddings', activeWedding, 'guests');
      const snap = await getDocs(guestsCol);
      got = snap.docs.map(d=>({ id: d.id, ...d.data() }));
      if (import.meta.env.DEV) console.debug('[SeatingPlan] invitados obtenidos de Firestore:', got.length);
    } catch(err){
      console.error('Error leyendo invitados desde Firestore:', err);
    }
  }
  if(got.length===0){
         // Invitados de prueba
         got=[
           {id:1, name:'Ana García', companion:1, tableId:1},
           {id:2, name:'Luis Martínez', companion:0, tableId:1},
           {id:3, name:'María López', companion:2, tableId:1},
           {id:4, name:'José Fernández', companion:0, tableId:1},
         ];
       }
       // Normalizar campos table y tableId
        got = got.map(g=>{
          const t = g.tableId ?? g.table;
          if(t===undefined || t===null || String(t).trim()===''){
            return {...g, tableId: undefined, table: undefined};
          }
          const idNum = parseInt(t,10) || t;
          return {...g, tableId: idNum, table: idNum};
        });
        setGuests(got);
        localStorage.setItem('lovendaGuests', JSON.stringify(got));
     };
     loadGuests();
     // suscribirse a cambios en SyncService y otros eventos
     const handleGuestsChange = async ()=>{
       try{ 
         const g = await loadData('lovendaGuests', { defaultValue: [], collection: 'userGuests' });
         let norm = g.map(item=>{
          const t = item.tableId ?? item.table;
          if(t===undefined || t===null || String(t).trim()===''){ 
            return {...item, tableId: undefined, table: undefined};
          }
          const idNum = parseInt(t,10) || t;
          return {...item, tableId: idNum, table: idNum};
        });
        setGuests(norm);
       }catch(error){
         console.error('Error al procesar cambios en invitados:', error);
       }
     };
     window.addEventListener('lovenda-guests', handleGuestsChange);
     return ()=> window.removeEventListener('lovenda-guests', handleGuestsChange);
   },[]);

  // Real-time sync via WebSocket with fallback polling
  useEffect(()=>{
    if(!ENABLE_GUEST_API) return; // Sin backend, omitimos WebSocket y polling

    let ws=null;
    let pollId=null;
    const sinceRef={current:Date.now()};

    const applyUpdate = (update) => {
      const newTable = update.table ?? update.tableId;
      setGuests(prev => prev.map(g => g.id === update.id ? { ...g, table: newTable, tableId: newTable } : g));
    };

    const startPolling=()=>{
      pollId=setInterval(async()=>{
        try{
          const res=await fetch(`${API_BASE}/api/guests/changes?since=${sinceRef.current}`);
          const data=await res.json();
          if(Array.isArray(data)){
            data.forEach(u=>{applyUpdate(u); sinceRef.current=u.ts;});
          }
        }catch(e){console.warn('poll error',e);}
      },10000);
    };

    if('WebSocket' in window){
      let wsUrl;
      if (API_BASE) {
        try {
          const api = new URL(API_BASE);
          const proto = api.protocol === 'https:' ? 'wss' : 'ws';
          wsUrl = `${proto}://${api.host}/ws/guests`;
        } catch (e) {
          console.warn('API_BASE no es URL válida, usando host de origen', e);
        }
      }
      if (!wsUrl) {
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        wsUrl = `${proto}://${window.location.host}/ws/guests`;
      }
      const url = wsUrl;
      ws=new WebSocket(url);
      ws.onmessage=(ev)=>{
        try{const msg=JSON.parse(ev.data); if(msg.type==='guestUpdated') {
          applyUpdate(msg.payload);
        } else if(msg.type==='presence') {
          setOnline(msg.payload?.count || 1);
        }}catch(e){console.warn('ws parse',e);} };
      ws.onerror=()=>{if(ws){ws.close();ws=null;} startPolling();};
      ws.onclose=()=>{if(!pollId) startPolling();};
    }else startPolling();

    return ()=>{ if(ws) ws.close(); if(pollId) clearInterval(pollId); };
  },[]);

  const [search, setSearch] = useState('');
  const [guestOpen, setGuestOpen] = useState(false);
  // accessibility refs
  const guestBtnRef = useRef(null);
  const searchRef = useRef(null);
  // focus management when panel toggles
  useEffect(()=>{
    if(guestOpen) {
      setTimeout(()=> searchRef.current?.focus(), 50);
    } else {
      guestBtnRef.current?.focus();
    }
  },[guestOpen]);
  // close overlay with Escape
  useEffect(()=>{
    const onKey=(e)=>{ if(e.key==='Escape' && guestOpen){ setGuestOpen(false);} };
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  },[guestOpen]);
  const [preview, setPreview] = useState(null); // {tableId: guest}
  const [configTable, setConfigTable] = useState(null);
  // Guardar configuración (forma, nombre, asientos…) y propagar al estado correcto
  const saveTableConfig = (updated) => {
    if(!updated || !updated.id) return;
    // snapshot para undo
    pushHistory(tables);
    setTables(prev => prev.map(t => String(t.id) === String(updated.id) ? { ...t, ...updated } : t));
  };
  const [templateOpen, setTemplateOpen] = useState(false);
  const [banquetConfigOpen, setBanquetConfigOpen] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);


  // ------- Sincronizar invitados DESDE Firestore (assignedGuests -> guests) -------
  useEffect(()=>{
    if(tab!=='banquet') return;
    if(tablesBanquet.length===0) return;
    setGuests(prev=>{
      let changed=false;
      const map = new Map(prev.map(g=>[String(g.id), g]));
      tablesBanquet.forEach(t=>{
        if(!Array.isArray(t.assignedGuests)) return;
        t.assignedGuests.forEach(ag=>{
          if(!ag || !ag.id) return;
          const idStr = String(ag.id);
          const existing = map.get(idStr);
          if(existing){
            if(String(existing.tableId) !== String(t.id)){
              existing.tableId = t.id;
              existing.table = t.id;
              changed=true;
            }
          }else{
            map.set(idStr, {
              id: ag.id,
              name: ag.name || 'Invitado',
              companion: ag.companion || 0,
              tableId: t.id,
              table: t.id,
            });
            changed=true;
          }
        });
      });
      if(!changed) return prev;
      return Array.from(map.values());
    });
  }, [tablesBanquet, tab]);

  // When guests or table list changes, sync assignedGuests to reflect any new guest allocations
  useEffect(()=>{
    if(tab!=='banquet') return;
    setTablesBanquet(prev=> prev.map(t=>{
      const already = t.assignedGuests||[];
      const should = guests.filter(g=>g.tableId===t.id);
      if(should.length===already.length && should.every((g,i)=>g.id===already[i]?.id)) return t;
      return {...t, assignedGuests: should.slice(0,t.seats)};
    }));
  },[guests,tab]);

  // Persist assignedGuests to Firestore cada vez que cambie la lista de invitados
  useEffect(()=>{
    if(tab!=='banquet') return;
    if(!activeWedding) return;
    if(guests.length===0 || tablesBanquet.length===0) return;
    const timeout = setTimeout(async ()=>{
      try{
        const colRef = fsCollection(db, 'weddings', activeWedding, 'seatingPlan', 'banquet', 'tables');
        const batch = writeBatch(db);
        let changed = 0;
        tablesBanquet.forEach(t=>{
          const assigned = guests
            .filter(g=> String(g.tableId??g.table).trim() === String(t.id))
            .map(g=>({id:g.id, name:g.name||g.nombre||'', companion:g.companion||0}))
            .slice(0, t.seats || 8);
          const curr = Array.isArray(t.assignedGuests)? t.assignedGuests : [];
          const isSame = curr.length===assigned.length && curr.every((g,i)=>String(g.id)===String(assigned[i].id));
          if(!isSame){
            const docRef = fsDoc(colRef, String(t.id));
            batch.set(docRef, { assignedGuests: assigned }, { merge:true });
            changed += 1;
          }
        });
        if(changed>0){
          await batch.commit();
        }
      }catch(e){
        console.error('[SeatingPlan] Error sincronizando assignedGuests a Firestore', e);
      }
    }, 500);
    return ()=>clearTimeout(timeout);
  }, [activeWedding, guests, tablesBanquet, tab]);

  // Load autosaved state
  useEffect(()=>{
    try{
      const data = loadData('seating-autosave', {
        defaultValue: null,
        docPath: activeWedding ? `weddings/${activeWedding}/meta/seatingAutosave` : undefined
      });
      if(data){
        setAreasCeremony(data.areasCeremony||[]);
        setAreasBanquet(data.areasBanquet||[]);
        setTablesCeremony(data.tablesCeremony||[]);
        setTablesBanquet(data.tablesBanquet||[]);
        setSeatsCeremony(data.seatsCeremony||[]);
      }
    }catch(e){console.warn('No autosave');}
  },[]);

  // ===== Seat helpers =====
  const assignSeatGuest = (seatId, guestId) => {
    const guest = guests.find(g=>g.id===guestId);
    setSeatsCeremony(prev=>prev.map(s=> s.id===seatId? {...s, guestId, guestName: guest.name}:s));
  };
  const toggleSeatEnabled = (seatId) => setSeatsCeremony(prev=>prev.map(s=> s.id===seatId? {...s, enabled: s.enabled===false? true:false}:s));

  const generateSeatGrid = (rows=10, cols=12, gap=40, startX=100, startY=80, aisleAfter=6) => {
    const newSeats=[];
    let id=1;
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const extra = c>=aisleAfter ? gap : 0;
        const xPos = startX + c*gap + extra;
        newSeats.push({id:id++, x:xPos, y:startY+r*gap, row:r+1, col:c+1+(c>=aisleAfter?1:0), enabled:true});
      }
    }
    setSeatsCeremony(newSeats);
  };

  // ===== Banquet auto-layout =====
  const generateBanquetLayout = ({rows=3, cols=4, seats=8, gapX=140, gapY=160, startX=120, startY=160}={}) => {
    // snapshot for undo
    pushHistory(tablesBanquet);
    const newTables=[];
    let id=1;
    // Mesa de honor (rectangular)
    newTables.push({id:id++, x: startX + (cols-1)*gapX/2, y: startY - gapY, name: 'Mesa Honor', shape:'rect', seats: 10, enabled:true, isHonor:true});
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        newTables.push({id:id++, x:startX + c*gapX, y:startY + r*gapY, name:`Mesa ${id-1}`, shape:'circle', seats, enabled:true});
      }
    }
        // map guests by desired tableId
    const map={};
    guests.forEach(g=>{ if(g.tableId){ if(!map[g.tableId]) map[g.tableId]=[]; map[g.tableId].push(g);} });
    const tablesWithSeats = newTables.map(t=>({
      ...t,
      assignedGuests: map[t.id] ? map[t.id].slice(0,t.seats) : []
    }));
    setTablesBanquet(tablesWithSeats);
  };

  // autosave every 8s
  useEffect(()=>{
    const id = setInterval(()=>{
      const payload = {
        areasCeremony,
        areasBanquet,
        tablesCeremony,
        tablesBanquet,
        seatsCeremony,
        ts: Date.now()
      };
      saveData('seating-autosave', payload, {
        docPath: activeWedding ? `weddings/${activeWedding}/meta/seatingAutosave` : undefined,
        showNotification: false
      });
      setSavedAt(new Date());
    },8000);
    return ()=>clearInterval(id);
  },[areasCeremony,areasBanquet,tablesCeremony,tablesBanquet,seatsCeremony]);


  // Ajustar vista a un área dibujada
  const adjustViewToArea = (points) => {
    if (!containerRef.current || !points || points.length < 2) return;
    // usar sólo el contenedor del lienzo, no toda la fila flex
    const canvasDiv = containerRef.current.querySelector('[aria-label="Lienzo de plano"]');
    const rect = (canvasDiv || containerRef.current).getBoundingClientRect();
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = maxX - minX;
    const h = maxY - minY;
    if (w < 20 || h < 20) return; // evitar zoom excesivo en trazos pequeños
    const scaleFactor = Math.min(rect.width / w, rect.height / h) * 0.8;
    setScale(scaleFactor);
    setOffset({
      x: (rect.width - w * scaleFactor) / 2 - minX * scaleFactor,
      y: (rect.height - h * scaleFactor) / 2 - minY * scaleFactor,
    });
  };

  // Zoom & pan
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const panRef = useRef(null);
  const containerRef = useRef(null);

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale(s => Math.min(4, Math.max(0.5, s * factor)));
  };
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    panRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };
  const handlePointerMove = (e) => {
    setOffset({ x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y });
  };
  const handlePointerUp = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  // Drawing, tables & AI auto-assign
  const addArea = (pts) => {
    setAreas(prev => [...prev, pts]);
    // Ajustar el lienzo para que el perímetro recién creado sea visible y centrado
    adjustViewToArea(pts);
    // Volver al modo pan automáticamente
    setDrawMode('pan');
  };
  const addTable = () => {
    pushHistory(tables);

    const id = tables.length + 1;
    setTables(prev => [...prev, { id, x: 200, y: 150, shape: 'circle' }]);
  };
  const onAssignGuest = (tableId, guestId) => {
    // Snapshot para undo
    pushHistory(tables);

    // ---------------- DESASIGNAR ----------------
    if (guestId === null) {
      if (tab === 'banquet') {
        // Limpiar assignedGuests y desvincular invitados
        setTables(prev =>
          prev.map(t => t.id === tableId ? { ...t, assignedGuests: [], guestId: undefined, guestName: undefined } : t)
        );
        setGuests(prev =>
          prev.map(g => String(g.tableId) === String(tableId) ? { ...g, tableId: undefined, table: undefined } : g)
        );
        return;
      }

      // Ceremonia (una persona por mesa)
      const prevGuestId = tables.find(t => t.id === tableId)?.guestId;
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, guestId: undefined, guestName: undefined } : t));
      if (prevGuestId) {
        setGuests(prev => prev.map(g => g.id === prevGuestId ? { ...g, tableId: undefined, table: undefined } : g));
      }
      return;
    }

    // ---------------- ASIGNAR ----------------
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;

    if (tab === 'banquet') {
      // Añadir al array assignedGuests manteniendo capacidad y evitando duplicados
      setTables(prev =>
        prev.map(t => {
          if (t.id !== tableId) return t;
          let list = Array.isArray(t.assignedGuests) ? [...t.assignedGuests] : [];
          list = list.filter(ag => {
            const id = typeof ag === 'object' ? ag.id : ag;
            return String(id) !== String(guestId);
          });
          list.push({ id: guest.id, name: guest.name, companion: guest.companion });
          const capacity = t.seats || 8;
          return { ...t, assignedGuests: list.slice(0, capacity), guestId: undefined, guestName: undefined };
        })
      );
    } else {
      // Ceremonia
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, guestId, guestName: guest.name } : t));
    }

    // Actualizar invitado con su mesa
    setGuests(prev => prev.map(g => g.id === guestId ? { ...g, table: tableId, tableId: tableId } : g));
  };

  const onToggleEnabled = (tableId) => {
    pushHistory(tables);
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, enabled: t.enabled === false ? true : false } : t));
  };

  const updateTableDimensions = (id, dims) => {
    pushHistory(tables);
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...dims } : t));
  };

  const exportPNG = async () => {
    if(!containerRef.current) return;
    const target = containerRef.current.querySelector('[aria-label="Lienzo de plano"]') || containerRef.current;
    const canvas = await html2canvas(target);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `seating-${tab}.png`;
    link.click();
  };
  const exportPDF = async () => {
    if(!containerRef.current) return;
    // 1. Capturar imagen del plano (sólo lienzo, sin barras laterales)
    const target = containerRef.current.querySelector('[aria-label="Lienzo de plano"]') || containerRef.current;
    const canvas = await html2canvas(target);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * pageW) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH);

    // 2. Nueva página con listado de mesas e invitados
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text('Listado de mesas e invitados', 40, 40);

    const map = {};
    guests.forEach(g=>{
      const tblKey = String(g.tableId ?? g.table ?? '').trim();
      if(!tblKey) return;
      if(!map[tblKey]) map[tblKey]=[];
      map[tblKey].push(`${g.name}${g.companion ? ` (+${g.companion})`:''}`);
    });
    // Añadir mesas sin invitados (p.ej. recién creadas)
    tables.forEach(t=>{ const key=String(t.id); if(!map[key]) map[key]=[]; });

    const sorted = Object.keys(map).sort((a,b)=> a.localeCompare(b,undefined,{numeric:true}));
    let y = 70;
    pdf.setFontSize(12);
    sorted.forEach(tbl=>{
      const line = `Mesa ${tbl}: ${map[tbl].join(', ') || '---'}`;
      const lines = pdf.splitTextToSize(line, pageW-80);
      lines.forEach(l=>{
        if(y > pageH - 40){ pdf.addPage(); y = 40; }
        pdf.text(l, 40, y);
        y += 18;
      });
    });

    pdf.save(`seating-${tab}.pdf`);
  };

  const handleLocalAssign = () => {
    const freeTables = tables.filter(t=>!t.guestId && t.enabled!==false);
    const unseatedGuests = guests.filter(g=>!tables.some(t=>t.guestId===g.id));
    const assignments = {};
    freeTables.forEach((t,i)=>{
      if(i<unseatedGuests.length){assignments[t.id]=unseatedGuests[i];}
    });
    if(Object.keys(assignments).length===0) return;
    setPreview(assignments);
    // application happens after accept
  };

  const handleServerAssign = async () => {
    setLoadingAI(true);
    try {
      const payload = {
        tables: tables.filter(t=>t.enabled!==false).map(({id,guestId})=>({id, guestId})) ,
        guests: guests
      };
      const res = await fetch('/api/ai-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error('Error IA');
      const data = await res.json(); // expected { assignments: { tableId: guestId } }
      const assignments = {};
      Object.entries(data.assignments).forEach(([tid,gid])=>{
        const guest = guests.find(g=>g.id===gid);
        if(guest) assignments[tid]=guest;
      });
      if(Object.keys(assignments).length) setPreview(assignments);
    } catch(err){
      alert('IA error: '+err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  // Aplicar plantilla de mesas o sillas según pestaña
  const applyTemplate = (tplItems = []) => {
    if(tab==='ceremony'){
      // Plantilla de sillas
      pushHistory(seats);
      setSeatsCeremony(tplItems);
      setTemplateOpen(false);
      return;
    }
    const tplTables = tplItems;
    // Mantener forma, invitados y nombre de las mesas existentes; solo actualizamos posiciones
    pushHistory(tables);
    setTables(prev => {
      const updated = prev.map((tbl, idx) => {
        if (tplTables[idx]) {
          return { ...tbl, x: tplTables[idx].x, y: tplTables[idx].y };
        }
        return tbl;
      });
      // Si la plantilla contiene más mesas que las actuales, las añadimos vacías
      if (tplTables.length > prev.length) {
        for (let i = prev.length; i < tplTables.length; i++) {
          const pos = tplTables[i];
          updated.push({
            id: prev.length + (i - prev.length) + 1,
            x: pos.x,
            y: pos.y,
            shape: 'circle',
            seats: 8,
          });
        }
      }
      return updated;
    });
    setTemplateOpen(false);
  };

  const deleteArea = (idx) => {
    pushHistory(areas);
    setAreas(prev => prev.filter((_, i) => i !== idx));
  };

  /**
   * Actualiza los puntos de un perímetro existente tras editarlo en FreeDrawCanvas.
   * - Guarda snapshot para undo/redo.
   * - Actualiza el estado local del área.
   * - Persiste inmediatamente en Firestore.
   */
  const onUpdateArea = (idx, pts) => {
    // Snapshot para undo/redo
    pushHistory(areas);

    // Nuevo array de áreas con la edición aplicada
    const updatedAreas = areas.map((poly, i) => (i === idx ? pts : poly));

    // Actualizar estado UI
    setAreas(updatedAreas);
    // Persistir en Firestore sin esperar al debounce
    if (activeWedding) {
      const docRef = fsDoc(
        db,
        'weddings',
        activeWedding,
        'seatingPlan',
        tab === 'ceremony' ? 'ceremony' : 'banquet',
      );
      setDoc(docRef, { areas: updatedAreas }, { merge: true });
    }
  };

  // Utilidad para mantener una mesa dentro de los límites visibles del lienzo
const clampTablesWithinCanvas = (tbls) => {
    // Usar límites del salón si estamos en banquete y hallSize está definido
    const hallW = tab === 'banquet' ? hallSize.width : null;
    const hallH = tab === 'banquet' ? hallSize.height : null;
  if (!containerRef.current) return tbls;
  const rect = containerRef.current.getBoundingClientRect();
  const maxX = hallW ?? rect.width / scale;
  const maxY = hallH ?? rect.height / scale;
  let changed = false;
  const clamped = tbls.map(t => {
    const shape = t.shape || 'circle';
    const diameter = t.diameter || 60;
    const width = t.width || 80;
    const height = t.height || t.length || 60;
    const sizeX = shape === 'circle' ? diameter : width;
    const sizeY = shape === 'circle' ? diameter : height;
    const minX = sizeX / 2;
    const minY = sizeY / 2;
    const maxAllowedX = maxX - sizeX / 2;
    const maxAllowedY = maxY - sizeY / 2;
    let nx = t.x;
    let ny = t.y;
    if (nx < minX) { nx = minX; changed = true; }
    else if (nx > maxAllowedX) { nx = maxAllowedX; changed = true; }
    if (ny < minY) { ny = minY; changed = true; }
    else if (ny > maxAllowedY) { ny = maxAllowedY; changed = true; }
    return (nx !== t.x || ny !== t.y) ? { ...t, x: nx, y: ny } : t;
  });
  return changed ? clamped : tbls;
};

// Effects: cada vez que cambien las mesas o el zoom/escala, comprobamos límites
useEffect(() => {
  const adjusted = clampTablesWithinCanvas(tablesCeremony);
  if (adjusted !== tablesCeremony) setTablesCeremony(adjusted);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [tablesCeremony, scale]);

useEffect(() => {
  const adjusted = clampTablesWithinCanvas(tablesBanquet);
  if (adjusted !== tablesBanquet) setTablesBanquet(adjusted);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [tablesBanquet, scale]);

const moveTable = (id, pos) => {
    pushHistory(tables);
    setTables(prev => prev.map(t => {
      if (t.id !== id) return t;
      // Calcular tamaño de la mesa para respetar márgenes
      const shape = t.shape || 'circle';
      const diameter = t.diameter || 60;
      const width = t.width || 80;
      const height = t.height || t.length || 60;
      const sizeX = shape === 'circle' ? diameter : width;
      const sizeY = shape === 'circle' ? diameter : height;

      let { x: newX, y: newY } = pos;

      // Limitar dentro del contenedor (considerando zoom)
      // Limitar dentro del espacio definido del salón
      {
        const maxX = space.width - sizeX / 2;
        const maxY = space.height - sizeY / 2;
        const minX = sizeX / 2;
        const minY = sizeY / 2;
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
      }

      // Evitar solaparse con otras mesas
      const hasOverlap = prev.some(o => {
        if (o.id === id) return false;
        const oShape = o.shape || 'circle';
        const oDiameter = o.diameter || 60;
        const oWidth = o.width || 80;
        const oHeight = o.height || o.length || 60;
        const sizeOX = oShape === 'circle' ? oDiameter : oWidth;
        const sizeOY = oShape === 'circle' ? oDiameter : oHeight;
        return Math.abs(newX - o.x) < (sizeX + sizeOX) / 2 &&
               Math.abs(newY - o.y) < (sizeY + sizeOY) / 2;
      });

      if (hasOverlap) {
        return t; // no mover si colisiona
      }
      return { ...t, x: newX, y: newY };
    }));
  };

  return (
    <DndProvider backend={isTouch ? TouchBackend : HTML5Backend}>
    <PageWrapper title="Plano de mesas" className="select-none">
      {/* Tabs */}
      <Card className="space-y-4 p-4"><div className="flex space-x-2">
        <button aria-label onClick={() => setTab('banquet')}  className={`px-4 py-2 rounded ${tab==='banquet'  ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Banquete</button>
        <button aria-label onClick={() => setTab('ceremony')}  className={`px-4 py-2 rounded ${tab==='ceremony'  ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Ceremonia</button>
      </div>

      {/* Toolbar top */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="text-xl font-semibold">Plano de mesas</h2>
        <SeatingToolbar
          tab={tab}
          addTable={addTable}
          setScale={setScale}
          undo={undo}
          redo={redo}
          exportPDF={exportPDF}
          setTemplateOpen={setTemplateOpen}
          setCeremonyConfigOpen={setCeremonyConfigOpen}
          setBanquetConfigOpen={setBanquetConfigOpen}
        setSpaceConfigOpen={setSpaceConfigOpen}
          handleLocalAssign={handleLocalAssign}
          handleServerAssign={handleServerAssign}
          loadingAI={loadingAI}
           />
        </div>

        {/* Layout */}
        {/* choose backend based on touch capability */}

          <div className="flex flex-col md:flex-row gap-4" ref={containerRef} role="region" aria-label="Lienzo y lista invitados">
            {/* Panel de herramientas de dibujo */}
            <div className="w-full md:w-1/6 border rounded p-2 h-96 bg-gray-50 flex flex-col space-y-2">
              <h3 className="font-semibold mb-2">Herramientas</h3>
              <button
                className={`px-2 py-1 rounded ${drawMode==='pan'?'bg-blue-600 text-white':'bg-gray-200'}`}
                onClick={()=>setDrawMode('pan')}
              >Mover plano</button>
              <button
                className={`px-2 py-1 rounded ${drawMode==='move'?'bg-blue-600 text-white':'bg-gray-200'}`}
                onClick={()=>setDrawMode('move')}
              >Mover mesas</button>
              <button
                className={`px-2 py-1 rounded ${drawMode==='free'?'bg-blue-600 text-white':'bg-gray-200'}`}
                onClick={()=>setDrawMode('free')}
              >A mano alzada</button>
              <button
                className={`px-2 py-1 rounded ${drawMode==='line'?'bg-blue-600 text-white':'bg-gray-200'}`}
                onClick={()=>setDrawMode('line')}
              >Línea</button>
              <button
                className={`px-2 py-1 rounded ${drawMode==='rect'?'bg-blue-600 text-white':'bg-gray-200'}`}
                onClick={()=>setDrawMode('rect')}
              >Rectángulo</button>
              <button
                className={`px-2 py-1 rounded ${drawMode==='curve'?'bg-blue-600 text-white':'bg-gray-200'}`}
                onClick={()=>setDrawMode('curve')}
              >Curva</button>
              <button
                className={`px-2 py-1 rounded ${drawMode==='erase'?'bg-red-600 text-white':'bg-gray-200'}`}
                onClick={()=>setDrawMode('erase')}
              >Borrar</button>


          </div>

          <div className="flex-1 flex flex-row space-x-2">
            {/* Lienzo de mesas */}
            <SeatingCanvas
               tab={tab}
               areas={areas}
               tables={tables}
               seats={seats}
               scale={scale}
               offset={offset}
               addArea={addArea}
               moveTable={moveTable}
               onAssignGuest={onAssignGuest}
               onToggleEnabled={onToggleEnabled}
               onToggleSeat={toggleSeatEnabled}
               onSelectTable={handleSelectTable}
               setConfigTable={setConfigTable}
               online={online}
               handleWheel={handleWheel}
               handlePointerDown={handlePointerDown}
               guests={guests}
               hallSize={tab==='banquet' ? hallSize : null}
               drawMode={drawMode}
               canPan={drawMode==='pan'}
               canMoveTables={drawMode==='move'}
               onUpdateArea={onUpdateArea}
               onDeleteArea={deleteArea}
            />
            {tab==='ceremony' && (
              <p className="text-sm text-gray-600 mt-1">Total sillas: {seatsCeremony.length}</p>
            )}
            {/* Panel lateral: Invitados asignados + dimensiones */}
            <div className="w-full md:w-1/4 border rounded p-2 h-96 overflow-y-auto">
              {tab==='ceremony' ? (
                selectedSeatId ? (
                  <> {/* Edición de silla */}
                    <h3 className="font-semibold mb-2">Silla {selectedSeatId}</h3>
                    {(() => {
                      const seat = seatsCeremony.find(s=>s.id===selectedSeatId);
                      if(!seat) return null;
                      return (
                        <div className="space-y-2 text-sm">
                          <button
                            className={`px-2 py-1 rounded ${seat.enabled!==false?'bg-red-600 text-white':'bg-green-600 text-white'}`}
                            onClick={()=>toggleSeatEnabled(selectedSeatId)}
                          >{seat.enabled!==false?'Deshabilitar':'Habilitar'}</button>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Haz clic en una silla</p>
                )
              ) : selectedTableId ? (
                <>
                  {/* Invitados asignados */}
                  <h3 className="font-semibold mb-2">Invitados asignados</h3>
                    {(() => {
                     const list = guests.filter(g => {
                      const t = g.tableId ?? g.table;
                      return t !== undefined && t !== null && String(t).trim() === String(selectedTableId);
                    });
                    if (!list.length) {
                      return <p className="text-sm text-gray-500">Sin invitados</p>;
                    }
                    return list.map(g => (
                      <div key={g.id} className="border-b py-1 flex justify-between">
                        <span>{g.name}</span>
                        {g.companion ? (
                          <span className="text-xs text-gray-500">+{g.companion}</span>
                        ) : null}
                      </div>
                    ));
                  })()}

                  {/* Panel de edición de la mesa */}
                  {selectedTable && (
                    <div className="fixed bottom-0 right-4 border rounded-t-lg bg-white p-3 shadow-lg w-64">
                       <h3 className="font-semibold mb-2">Editar mesa</h3>
                       
                       {/* Selector de forma de mesa */}
                       <div className="flex items-center justify-between text-xs mb-3">
                         <span className="font-semibold">Forma:</span>
                         <button
                           aria-label
                           onClick={toggleSelectedTableShape}
                           className="px-2 py-0.5 bg-blue-600 text-white rounded"
                         >
                           {selectedTable.shape === 'circle' ? 'Rectangular' : 'Circular'}
                         </button>
                       </div>
                      
                      {/* Dimensiones de la mesa */}
                      <div className="space-y-1 mb-2 text-xs">
                        {selectedTable.shape === 'circle' ? (
                          <label className="flex justify-between items-center">
                            <span>Diámetro:</span>
                            <input
                              type="number"
                              min="20"
                              max="400"
                              value={selectedTable.diameter || 60}
                              onChange={e => handleTableDimensionChange('diameter', e.target.value)}
                              className="border rounded px-1 py-0.5 w-20"
                            />
                          </label>
                        ) : (
                          <>
                            <label className="flex justify-between items-center">
                              <span>Ancho:</span>
                              <input
                                type="number"
                                min="20"
                                max="400"
                                value={selectedTable.width || 80}
                                onChange={e => handleTableDimensionChange('width', e.target.value)}
                                className="border rounded px-1 py-0.5 w-20"
                              />
                            </label>
                            <label className="flex justify-between items-center">
                              <span>Largo:</span>
                              <input
                                type="number"
                                min="20"
                                max="400"
                                value={selectedTable.height || selectedTable.length || 60}
                                onChange={e => handleTableDimensionChange('height', e.target.value)}
                                className="border rounded px-1 py-0.5 w-20"
                              />
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">Haz clic en una mesa</p>
              )}
            </div>

   

          </div>{/* cierra fila lienzo + panel lateral */}
        </div>{/* cierra contenedor lienzo+lista */}


      {/* Eliminado: Indicador de guardado */}

      {/* Preview Modal */}
      <Modal open={!!preview} title="Propuesta de asignación IA" onClose={() => setPreview(null)}>
        {preview && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(preview).map(([tid, guest]) => (
              <div key={tid} className="flex justify-between border-b pb-1">
                <span>Mesa {tid}</span>
                <span>{guest.name}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end space-x-2">
          <button aria-label onClick={()=>setPreview(null)} className="px-3 py-1 text-sm bg-gray-200 rounded">Cancelar</button>
          <button aria-label onClick={()=>{ if(preview){ setTables(prev=>prev.map(t=> preview[t.id] ? { ...t, guestId: preview[t.id].id, guestName: preview[t.id].name } : t)); setPreview(null);} }} className="px-3 py-1 text-sm bg-blue-600 text-white rounded">Aplicar</button>
        </div>
      </Modal>

      {/* Banquet Config Modal */}



  {/* Banquet Config Modal */}
  <BanquetConfigModal open={banquetConfigOpen} onClose={()=>setBanquetConfigOpen(false)} onApply={cfg=>{ generateBanquetLayout(cfg); setBanquetConfigOpen(false);} } />
  <CeremonyConfigModal open={ceremonyConfigOpen} onClose={()=>setCeremonyConfigOpen(false)} onApply={({rows,cols,gap,aisleAfter})=>{ generateSeatGrid(rows,cols,gap,100,80,aisleAfter); setCeremonyConfigOpen(false);} } />

  <TableConfigModal open={!!configTable} table={configTable||{}} onSave={saveTableConfig} onClose={()=>setConfigTable(null)} />

  <TemplatesModal open={templateOpen} onApply={applyTemplate} onClose={()=>setTemplateOpen(false)} count={tab==='ceremony' ? seats.length || 60 : tableCount} tab={tab} />

  </Card>
  {/* Configurar espacio */}

    <SpaceConfigModal
        open={spaceConfigOpen}
        defaultWidth={hallSize.width}
        defaultHeight={hallSize.height}
        onApply={async ({ width, height }) => {
          setHallSize({ width, height });
          if (activeWedding) {
            try {
              const cfgRef = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet', 'config');
              await setDoc(cfgRef, { width, height }, { merge: true });
            } catch (err) {
              console.error('Error guardando dimensiones del salón:', err);
            }
          }
        }}
        onClose={() => setSpaceConfigOpen(false)}
      />
    </PageWrapper>
</DndProvider>
);
}


