import React, { useState, useRef, useEffect, useMemo } from 'react';
import SeatingCanvas from '../features/seating/SeatingCanvas';
import GuestPanel from '../features/seating/GuestPanel';
import Modal from '../components/Modal';
import TableConfigModal from '../components/TableConfigModal';
import SeatItem from '../components/SeatItem';
import TemplatesModal from '../components/TemplatesModal';
import BanquetConfigModal from '../components/BanquetConfigModal';
// Drag & Drop context
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';




import html2canvas from 'html2canvas';
// Temporalmente deshabilitado por conflicto con Vite

import SeatingToolbar from '../components/seating/SeatingToolbar';
import jsPDF from 'jspdf';

// Clean rebuilt SeatingPlan page (v2)
export default function SeatingPlan() {
  const [tab, setTab] = useState('ceremony');

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

  const pushHistory = (snapshot) => {
    const key = tab;
    const hist = historyRef.current[key];
    const ptr = pointerRef.current[key] + 1;
    historyRef.current[key] = [...hist.slice(0, ptr), JSON.parse(JSON.stringify(snapshot))].slice(-50);
    pointerRef.current[key] = Math.min(49, hist.slice(0, ptr).length);
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
  const [online, setOnline] = useState(1);
  // Seleccionar backend según dispositivo
  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Número real de mesas (únicas) considerando tanto las dibujadas como las referenciadas por invitados
  const tableCount = useMemo(() => {
    // IDs de mesas existentes en el plano actual (como string para unir correctamente)
    const idsFromTables = tables.map(t => String(t.id));
    // IDs de mesas asignadas a invitados (admite formatos antiguos "table")
    const idsFromGuests = guests
      .map(g => g.tableId ?? g.table) // usar tableId o fallback table
      .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
      .map(v => String(v).trim());

    // Unión de ambos conjuntos para contar IDs distintos
    const unionSet = new Set([...idsFromTables, ...idsFromGuests]);

    return Math.max(unionSet.size, 1);
  }, [tables, guests]);
  useEffect(()=>{
     const loadGuests = async ()=>{
       let got = [];
       try{
         const res = await fetch('/api/guests');
         if(res.ok){
           got = await res.json();
         }
       }catch(e){
         console.warn('Sin backend /api/guests, usando localStorage');
       }
       if(!Array.isArray(got) || got.length===0){
         try{ got = JSON.parse(localStorage.getItem('lovendaGuests')||'[]'); }catch{ got=[]; }
       }
       setGuests(got);
     };
     loadGuests();
     // suscribirse a cambios en localStorage (ChatWidget u otros)
     const handleLS = ()=>{
       try{ const g = JSON.parse(localStorage.getItem('lovendaGuests')||'[]'); setGuests(g);}catch{}
     };
     window.addEventListener('lovenda-guests', handleLS);
     return ()=> window.removeEventListener('lovenda-guests', handleLS);
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
      const data = JSON.parse(localStorage.getItem('seating-autosave'));
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
      localStorage.setItem('seating-autosave', JSON.stringify(payload));
      setSavedAt(new Date());
    },8000);
    return ()=>clearInterval(id);
  },[areasCeremony,areasBanquet,tablesCeremony,tablesBanquet,seatsCeremony]);

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
  const addArea = (pts) => setAreas(prev => [...prev, pts]);
  const addTable = () => {
    pushHistory(tables);

    const id = tables.length + 1;
    setTables(prev => [...prev, { id, x: 200, y: 150, shape: 'circle' }]);
  };
  const onAssignGuest = (tableId, guestId) => {
    const guest = guests.find(g => g.id === guestId);
    if (guestId === null) {
      // unassign guest
      pushHistory(tables);
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, guestId: undefined, guestName: undefined } : t));
      return;
    }
    if (!guest) return;
    pushHistory(tables);
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, guestId, guestName: guest.name } : t));
  };

  const onToggleEnabled = (tableId) => {
    pushHistory(tables);
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, enabled: t.enabled === false ? true : false } : t));
  };

  const exportPNG = async () => {
    if(!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `seating-${tab}.png`;
    link.click();
  };
  const exportPDF = async () => {
    if(!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
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

  const applyTemplate = (tplTables) => {
    pushHistory(tables);
    // reindex IDs to avoid collisions
    setTables(tplTables.map((t, idx) => ({ ...t, id: idx + 1 })));
    setTemplateOpen(false);
  };

  const saveTableConfig = (updated) => {
    pushHistory(tables);
    setTables(prev=>prev.map(t=> t.id===updated.id ? updated : t));
  };

  const moveTable = (id, pos) => {
    pushHistory(tables);
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...pos } : t));
  };

  return (
    <DndProvider backend={isTouch ? TouchBackend : HTML5Backend}>
    <div className="p-4 select-none">
      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        <button aria-label onClick={() => setTab('ceremony')} className={`px-4 py-2 rounded ${tab==='ceremony' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Ceremonia</button>
        <button aria-label onClick={() => setTab('banquet')}  className={`px-4 py-2 rounded ${tab==='banquet'  ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Banquete</button>
      </div>

      {/* Toolbar top */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <h2 className="text-xl font-semibold">Plano de mesas</h2>
        <SeatingToolbar
          tab={tab}
          addTable={addTable}
          setScale={setScale}
          undo={undo}
          redo={redo}
          exportPNG={exportPNG}
          exportPDF={exportPDF}
          generateSeatGrid={generateSeatGrid}
          setTemplateOpen={setTemplateOpen}
          setBanquetConfigOpen={setBanquetConfigOpen}
          handleLocalAssign={handleLocalAssign}
          handleServerAssign={handleServerAssign}
          loadingAI={loadingAI}
          setOffset={setOffset}
        />
      </div>

      {/* Layout */}
      {/* choose backend based on touch capability */}

        <div className="flex flex-col md:flex-row gap-4" ref={containerRef} role="region" aria-label="Lienzo y lista invitados">
      <SeatingCanvas
            tab={tab}
            areas={areas}
            tables={tables}
            scale={scale}
            offset={offset}
            addArea={addArea}
            moveTable={moveTable}
            onAssignGuest={onAssignGuest}
            onToggleEnabled={onToggleEnabled}
            setConfigTable={setConfigTable}
            online={online}
            handleWheel={handleWheel}
            handlePointerDown={handlePointerDown}
            ref={containerRef}
          />


            <div className="absolute top-2 left-2 bg-white bg-opacity-80 px-2 py-1 text-sm rounded shadow">
          Áreas: {areas.length} | Mesas: {tables.length} | Zoom: {scale.toFixed(2)} | Online: {online}
        </div>
                </div>

          <GuestPanel
            guests={guests}
            tables={tables}
            search={search}
            setSearch={setSearch}
            guestOpen={guestOpen}
            setGuestOpen={setGuestOpen}
            guestBtnRef={guestBtnRef}
            searchRef={searchRef}
          />

          
      

      {/* save indicator */}
      {savedAt && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white text-xs px-3 py-1 rounded shadow">
          Guardado {savedAt.toLocaleTimeString()}
        </div>
      )}



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
      <BanquetConfigModal open={banquetConfigOpen} onClose={()=>setBanquetConfigOpen(false)} onApply={cfg=>{ generateBanquetLayout(cfg); setBanquetConfigOpen(false);} } />

      <TableConfigModal open={!!configTable} table={configTable||{}} onSave={saveTableConfig} onClose={()=>setConfigTable(null)} />

      <TemplatesModal open={templateOpen} onApply={applyTemplate} onClose={()=>setTemplateOpen(false)} tableCount={tableCount} />
    </div>
    </DndProvider>
  );
}
