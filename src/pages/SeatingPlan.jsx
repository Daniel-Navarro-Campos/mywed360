import React, { useState, useRef, useEffect, useMemo } from 'react';
import SeatingCanvas from '../features/seating/SeatingCanvas';
// import GuestPanel eliminado
import Modal from '../components/Modal';
import TableConfigModal from '../components/TableConfigModal';
import SeatItem from '../components/SeatItem';
import TemplatesModal from '../components/TemplatesModal';
import CeremonyConfigModal from '../components/CeremonyConfigModal';
import BanquetConfigModal from '../components/BanquetConfigModal';
// Drag & Drop context
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { saveData, loadData, subscribeSyncState, getSyncState } from '../services/SyncService';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';




import html2canvas from 'html2canvas';
// Temporalmente deshabilitado por conflicto con Vite

import SeatingToolbar from '../components/seating/SeatingToolbar';
import jsPDF from 'jspdf';
import PageWrapper from '../components/PageWrapper';
import Card from '../components/Card';

// Utilidad para normalizar IDs de mesas (convierte a número si es posible)
export const normalizeId = (id) => {
  const num = parseInt(id, 10);
  return !isNaN(num) ? num : id;
};

// Clean rebuilt SeatingPlan page (v2)
export default function SeatingPlan() {
  const [tab, setTab] = useState('ceremony');
  const [ceremonyConfigOpen, setCeremonyConfigOpen] = useState(false);
  
  // Estado de sincronización
  const [syncStatus, setSyncStatus] = useState(getSyncState());

  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);

  const [areasCeremony, setAreasCeremony] = useState([]);
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
  const historyRef = useRef({ ceremony: [], banquet: [] });


  const pointerRef = useRef({ ceremony: -1, banquet: -1 });

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

  // Guests from backend
  const [guests, setGuests] = useState([]);
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
  const tableCount = useMemo(() => {
     const idsFromGuests = guests
       .map(g => g.tableId ?? g.table)
       .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
       .map(v => String(v).trim());
     return new Set(idsFromGuests).size;
   }, [guests]);

  // Sincronizar el número de mesas con la gestión de invitados (ceremonia)
  useEffect(() => {
    // Obtener identificadores (id numérico o nombre) que figuran en la lista de invitados
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
    // Reunir identificadores de mesa referenciados por los invitados
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

      // Crear/actualizar mesas
      const updated = uniqueNormalizedIds.map(normalizedId => {
        const idStr = groupedIds[normalizedId];
        const existing = byId.get(normalizedId) || byName.get(normalizedId);

        // Invitados que deberían estar sentados en esta mesa
        const guestsForTable = guests.filter(g => String(g.tableId ?? g.table).trim() === idStr);

        if (existing) {
          return {
            ...existing,
            name: idStr,
            assignedGuests: guestsForTable.slice(0, existing.seats || 8),
          };
        }

        // Crear nueva mesa con posición aleatoria dentro del lienzo
        const idVal = typeof normalizedId === 'number' ? normalizedId : idStr;
        return {
          id: idVal,
          name: idStr,
          x: 120 + Math.random() * 200,
          y: 120 + Math.random() * 200,
          shape: 'circle',
          seats: 8,
          assignedGuests: guestsForTable.slice(0, 8),
          enabled: true,
        };
      });

      // Conservar mesas no referenciadas por los invitados (añadidas manualmente)
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
         const res = await fetch('/api/guests');
         if(res.ok){
           got = await res.json();
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
           console.error('Error al cargar invitados:', error);
           got=[]; 
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
       // Guardar invitados usando SyncService
       saveData('lovendaGuests', got, {
         collection: 'userGuests',
         showNotification: false
       });
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
    let ws=null;
    let pollId=null;
    const sinceRef={current:Date.now()};

    const applyUpdate = (update)=>{
      setGuests(prev=> prev.map(g=> g.id===update.id ? {...g, tableId:update.tableId}: g));
    };

    const startPolling=()=>{
      pollId=setInterval(async()=>{
        try{
          const res=await fetch(`/api/guests/changes?since=${sinceRef.current}`);
          const data=await res.json();
          if(Array.isArray(data)){
            data.forEach(u=>{applyUpdate(u); sinceRef.current=u.ts;});
          }
        }catch(e){console.warn('poll error',e);}
      },10000);
    };

    if('WebSocket' in window){
      const proto=window.location.protocol==='https:'?'wss':'ws';
      const url=`${proto}://${window.location.host}/ws/guests`;
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

  // Load autosaved state
  useEffect(()=>{
    try{
      const data = loadData('seating-autosave', { 
        defaultValue: null, 
        collection: 'userSeatingPlan' 
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
        collection: 'userSeatingPlan',
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
    if (guestId === null) {
      // desasignar: encontrar invitado que estuviera en esa mesa
      const prevGuestId = tables.find(t=>t.id===tableId)?.guestId;
      pushHistory(tables);
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, guestId: undefined, guestName: undefined } : t));
      if(prevGuestId){
        setGuests(prev=> prev.map(g=> g.id===prevGuestId? {...g, tableId: undefined, table: undefined}: g));
      }
      return;
    }
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;
    pushHistory(tables);
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, guestId, guestName: guest.name } : t));
    // actualizar invitado con su mesa
    setGuests(prev=> prev.map(g=> g.id===guestId? {...g, tableId: tableId}: g));
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
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const maxX = rect.width / scale - sizeX / 2;
        const maxY = rect.height / scale - sizeY / 2;
        const minX = sizeX / 2;
        const minY = sizeY / 2;
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
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
              <button className={`px-2 py-1 rounded ${drawMode==='pan'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setDrawMode('pan')}>Mover plano</button>
              <button className={`px-2 py-1 rounded ${drawMode==='move'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setDrawMode('move')}>Mover mesas</button>
              <button className={`px-2 py-1 rounded ${drawMode==='free'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setDrawMode('free')}>A mano alzada</button>
              <button className={`px-2 py-1 rounded ${drawMode==='line'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setDrawMode('line')}>Línea</button>
              <button className={`px-2 py-1 rounded ${drawMode==='rect'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setDrawMode('rect')}>Rectángulo</button>
              <button className={`px-2 py-1 rounded ${drawMode==='curve'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setDrawMode('curve')}>Curva</button>
              <button className={`px-2 py-1 rounded ${drawMode==='erase'?'bg-red-600 text-white':'bg-gray-200'}`} onClick={()=>setDrawMode('erase')}>Borrar</button>


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
               drawMode={drawMode}
               canPan={drawMode==='pan'}
               canMoveTables={drawMode==='move'}
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
  </PageWrapper>
</DndProvider>
);
}


