import React, { useState, useRef } from 'react';
import FreeDrawCanvas from '../components/FreeDrawCanvas';
import TableItem from '../components/TableItem';



// ------------------------------
// Nueva implementación simplificada de SeatingPlan
// ------------------------------
export default function SeatingPlan() {
  const [tab, setTab] = useState('ceremony');
  // store drawn areas per tab
  const [areasCeremony, setAreasCeremony] = useState([]);
  const [areasBanquet, setAreasBanquet] = useState([]);
  const areas = tab === 'ceremony' ? areasCeremony : areasBanquet;
  // tables state per tab
  const [tablesCeremony, setTablesCeremony] = useState([]);
  const [tablesBanquet, setTablesBanquet] = useState([]);
  const tables = tab === 'ceremony' ? tablesCeremony : tablesBanquet;
  const setTables = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;

  const addTable = (shape = 'circle') => {
    const id = tables.length + 1;
    setTables(prev => [...prev, { id, x: 200, y: 150, shape }]);
  };
  const moveTable = (id, pos) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...pos } : t));
  };
  // zoom & pan
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const panRef = useRef(null);
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((s) => Math.min(4, Math.max(0.5, s * delta)));
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
  const addArea = (pts) => {
    (tab === 'ceremony' ? setAreasCeremony : setAreasBanquet)(prev => [...prev, pts]);
  };
  return (
    <div className="p-4">
      <div className="flex space-x-2 mb-4">
        <button onClick={() => setTab('ceremony')} className={`px-4 py-2 rounded ${tab==='ceremony' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Ceremonia</button>
        <button onClick={() => setTab('banquet')} className={`px-4 py-2 rounded ${tab==='banquet' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Banquete</button>
      </div>
      <div className="border border-gray-300 h-96 relative select-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}>
        <FreeDrawCanvas areas={areas} scale={scale} offset={offset} onFinalize={addArea} />
        {/* simple overlay listing area count */}
        <div className="absolute top-2 left-2 bg-white bg-opacity-80 px-2 py-1 text-sm rounded shadow">
          Áreas: {areas.length} | Mesas: {tables.length} | Zoom: {scale.toFixed(2)}
        </div>
        
      </div>
    </div>
  );
}
// legacy code removed

    <div ref={drag} style={{ cursor: isDragging ? 'grabbing' : 'grab' }} className={`p-2 mb-2 border rounded bg-white ${isDragging ? 'opacity-50' : ''}`}>
      <input type="checkbox" checked={selected} onChange={() => toggleSelect(guest.id)} className="mr-2" aria-label={`Seleccionar ${guest.name}`} />{guest.name}
    </div>
  );
}

function Seat({ seat, guest, onDrop, shapeType, seatSize }) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.GUEST,
    drop: (i) => onDrop(i.id, seat.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  // Dynamic background based on drag state
  let bg = 'bg-gray-100';
  if (isOver && canDrop) bg = 'bg-green-300';
  else if (canDrop) bg = 'bg-green-100';

  return (
    <div 
      ref={drop}
      style={{
        width: seatSize,
        height: seatSize,
        borderRadius: shapeType === 'circle' ? '50%' : '0%',
        transition: 'background-color 0.2s ease, transform 0.2s ease'
      }}
      className={`relative m-1 flex items-center justify-center border ${bg}`}
    >
      <div className="absolute top-1 left-1 text-xs text-gray-600">{seat.id}</div>
      <div className="text-sm truncate px-1">{guest ? guest.name : 'Empty'}</div>
    </div>
  );
}

function SeatingPlanOld() {
  const sampleGuests = [
    { id: 1, name: 'Ana García', rsvp: 'yes', company: 'AltaCorp' },
    { id: 2, name: 'Luis Martínez', rsvp: 'no', company: 'Beta Ltd' },
    { id: 3, name: 'María López', rsvp: 'yes', company: 'Gamma Inc' },
    { id: 4, name: 'José Fernández', rsvp: 'no', company: 'Delta Co' },
  const [seatSize, setSeatSize] = useState(isTouchDevice() ? 40 : 30);
  // Tool and filter state
  const [tool, setTool] = useState('draw');
  const [rsvpFilter, setRsvpFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [selectedGuests, setSelectedGuests] = useState([]);
  const toggleSelect = id => setSelectedGuests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const bulkAssign = () => {
    const seatsArr = activeTab === 'ceremony' ? seatsCeremony : seatsBanquet;
    const emptySeats = seatsArr.filter(s => !s.assignedGuestId);
    selectedGuests.forEach((gid, idx) => {
      const seat = emptySeats[idx];
      if (seat) assignGuestToSeat(gid, seat.id);
    });
    setSelectedGuests([]);
  };  
  // Zoom, pan & undo/redo state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Undo/Redo handlers
  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setShapePoints(prev);
      setShapeFinalized(true);
    }
  };
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setShapePoints(next);
      setShapeFinalized(true);
    }
  };  

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokePoints, setStrokePoints] = useState([]);
  const [shapePoints, setShapePoints] = useState([]);
  const [shapeFinalized, setShapeFinalized] = useState(false);
  // Multiples áreas de asiento
  const [areas, setAreas] = useState([]);
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [seatsCeremony, setSeatsCeremony] = useState([]);
  const [seatsBanquet, setSeatsBanquet] = useState([]);
  
  // assign
  const assignGuestToSeat = (guestId, seatId) => {
    const setter = activeTab === 'ceremony' ? setSeatsCeremony : setSeatsBanquet;
    setter(prev => prev.map(s => s.id === seatId ? { ...s, assignedGuestId: guestId } : s));
    const g = sampleGuests.find(g => g.id === guestId);
    setToast({ message: `${g.name} asignado al asiento ${seatId}`, type: 'success' });
  };

  // auto-assign
  const handleAutoAssign = async () => {
    if (!aiPrompt || !shapeFinalized) return;
    setAiLoading(true); setToast(null);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer '+import.meta.env.VITE_OPENAI_API_KEY,
        'OpenAI-Project': import.meta.env.VITE_OPENAI_PROJECT_ID },
        body: JSON.stringify({ model:'gpt-3.5-turbo', temperature: aiTemp, max_tokens: aiMaxTokens, messages:[
          {role:'system',content:'Asigna invitados a asientos. Devuelve JSON [{seatId,guestId}]'},
          {role:'user',content:`Prompt: ${aiPrompt}. Invitados: ${JSON.stringify(sampleGuests)}. Asientos: ${JSON.stringify((activeTab==='ceremony'?seatsCeremony:seatsBanquet))}`} ] })
      });
      const data = await res.json();
      let tasks = [];
      try { tasks = JSON.parse(data.choices[0].message.content); } catch{};
      setPreviewTasks(tasks);
      setToast({ message: 'Vista previa lista', type: 'info' });
    } catch (e) {
      setToast({ message:'Error autoasignación', type:'error' });
    } finally { setAiLoading(false); }
  };

  // point-in-polygon
  const isPointInPoly = (pt, vs) => {
    let x=pt.x,y=pt.y, inside=false;
    for(let i=0,j=vs.length-1;i<vs.length;j=i++){
      const xi=vs[i].x, yi=vs[i].y, xj=vs[j].x, yj=vs[j].y;
      const intersect=((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi);
      if(intersect) inside=!inside;
    }
    return inside;
  };

  // generate seats based on finalized areas
  useEffect(() => {
    if (!canvasRef.current) return;
    const w = canvasRef.current.width, h = canvasRef.current.height, size = seatSize;
    const hsp = cols > 1 ? (w - size) / (cols - 1) : 0;
    const vsp = rows > 1 ? (h - size) / (rows - 1) : 0;
    const seatsArr = [];
    let id = 1;
    
    areas.forEach(poly => {
      // If the grid is 1x1, we cannot use bounding box optimization -> check the single cell
      if (rows === 1 && cols === 1) {
        const x = size / 2;
        const y = size / 2;
        if (isPointInPoly({ x, y }, poly)) {
          seatsArr.push({ id: id++, x: 0, y: 0, assignedGuestId: null });
        }
        return;
      }
      
      // If the grid has only one row or one column, we skip the bounding box optimization
      if (rows === 1 || cols === 1) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = c * hsp + size / 2;
            const y = r * vsp + size / 2;
            if (isPointInPoly({ x, y }, poly)) {
              seatsArr.push({ id: id++, x: r, y: c, assignedGuestId: null });
            }
          }
        }
        return;
      }
      
      // Compute bounding box of the polygon in canvas coordinates
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      poly.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
      
      // Convert bounding box to grid indices
      const minCol = Math.max(0, Math.floor((minX - size/2) / hsp));
      const maxCol = Math.min(cols-1, Math.ceil((maxX - size/2) / hsp));
      const minRow = Math.max(0, Math.floor((minY - size/2) / vsp));
      const maxRow = Math.min(rows-1, Math.ceil((maxY - size/2) / vsp));
      
      // Iterate only over the grid cells in the bounding box
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const x = c * hsp + size / 2;
          const y = r * vsp + size / 2;
          if (isPointInPoly({ x, y }, poly)) {
            seatsArr.push({ id: id++, x: r, y: c, assignedGuestId: null });
          }
        }
      }
    });
    
    (activeTab === 'ceremony' ? setSeatsCeremony : setSeatsBanquet)(seatsArr);
  }, [areas, rows, cols, seatSize, activeTab]);

  // draw canvas including all areas and current stroke
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
    // draw existing areas
    areas.forEach(poly => {
      if (poly.length) {
        ctx.beginPath();
        poly.forEach((p,i) => i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
        ctx.closePath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    // draw current stroke
    if (strokePoints.length) {
      ctx.beginPath();
      strokePoints.forEach((p,i) => i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [areas, strokePoints, shapeFinalized]);

  const toCanvasPt = e => {
    const rect=canvasRef.current.getBoundingClientRect();
    return { x:e.clientX-rect.left, y:e.clientY-rect.top };
  };
  const handlePointerDown = e => {
    if (tool === 'pan') {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
      return;
    }
    setIsDrawing(true); setStrokePoints([toCanvasPt(e)]);
  };
  const handleMove = e => isDrawing && setStrokePoints(prev=>[...prev,toCanvasPt(e)]);
  const handleUp = (e) => { 
    setIsDrawing(false); 
    const smoothedPoints = smoothStroke(strokePoints);
    setShapePoints(smoothedPoints);
    setShapeFinalized(true);
    // push history snapshot
    setHistory(h => [...h.slice(0, historyIndex + 1), smoothedPoints]);
    setHistoryIndex(historyIndex + 1);
  };
    const reset = () => { setShapeFinalized(false); setStrokePoints([]); setShapePoints([]); };

  // Añadir área actual a áreas
  const handleFinalizeArea = () => {
    if (!shapePoints.length) return;
    setAreas(prev => [...prev, shapePoints]);
    setShapePoints([]);
    setStrokePoints([]);
    setShapeFinalized(false);
    setToast({ message: 'Área añadida', type: 'success' });
  };
  
  // Eliminar área por índice
  const removeArea = index => {
    setAreas(prev => prev.filter((_, i) => i !== index));
    setToast({ message: `Área ${index+1} eliminada`, type: 'info' });
  };

  // Pan & wheel handlers
  const handlePointerMove = e => {
    if (isPanning) {
      setOffset({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
      return;
    }
    handleMove(e);
  };
  const handlePointerUp = e => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    handleUp(e);
  };
  const handleWheel = e => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left - offset.x) / scale;
    const my = (e.clientY - rect.top - offset.y) / scale;
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = scale * delta;
    const newOffsetX = e.clientX - rect.left - mx * newScale;
    const newOffsetY = e.clientY - rect.top - my * newScale;
    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  // Persistence
  useEffect(() => {
    if (!auth.currentUser) return;
    const timer = setTimeout(() => {
      const ref = doc(db, 'seatingPlans', `${auth.currentUser.uid}-${activeTab}`);
      setDoc(ref, {
        areas,
        shapePoints,
        rows,
        cols,
        seatsCeremony,
        seatsBanquet,
        updatedAt: new Date()
      }, { merge: true })
        .then(() => setToast({ message: 'Autoguardado exitoso', type: 'success' }))
        .catch(e => setToast({ message: 'Error en autoguardado', type: 'error' }));
    }, 5000); // Save after 5 seconds of inactivity
    return () => clearTimeout(timer);
  }, [areas, shapePoints, rows, cols, seatsCeremony, seatsBanquet, activeTab]);

  const handleLoad = async () => {
    const ref = doc(db, 'seatingPlans', `${auth.currentUser.uid}-${activeTab}`);
    if (!ref) return;
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setRows(data.rows);
        setCols(data.cols);
        setAreas(data.areas || []);
        setShapePoints(data.shapePoints || []);
        setShapeFinalized(true);
        setSeatsCeremony(data.seatsCeremony || []);
        setSeatsBanquet(data.seatsBanquet || []);
        setToast({ message: 'Plan cargado', type: 'success' });
      } else {
        setToast({ message: 'No hay plan guardado', type: 'info' });
      }
    } catch (e) {
      setToast({ message: 'Error al cargar plan', type: 'error' });
    }
  };

  };
  const handlePointerUp = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    try {
      const canvasImg = await html2canvas(containerRef.current);
      canvasImg.toBlob(blob => saveAs(blob, `seating-${activeTab}.png`));
    } catch (e) {
      setToast({ message: 'Error al exportar imagen', type: 'error' });
    }
  };

  const handleExportPDF = async () => {
    if (!containerRef.current) return;
    try {
      const canvasImg = await html2canvas(containerRef.current);
      const imgData = canvasImg.toDataURL('image/png');
      const pdf = new jsPDF('l', 'pt', [canvasImg.width, canvasImg.height]);
      pdf.addImage(imgData, 'PNG', 0, 0, canvasImg.width, canvasImg.height);
      pdf.save(`seating-${activeTab}.pdf`);
    } catch (e) {
      setToast({ message: 'Error al exportar PDF', type: 'error' });
    }
  };

  const seats = activeTab==='ceremony'?seatsCeremony:seatsBanquet;
  const availableGuests = sampleGuests.filter(g => !seats.some(s => s.assignedGuestId === g.id) && g.name.toLowerCase().includes(searchTerm.toLowerCase()) && (rsvpFilter ? g.rsvp === rsvpFilter : true) && (companyFilter ? g.company.toLowerCase().includes(companyFilter.toLowerCase()) : true));

  const [guestListOpen, setGuestListOpen] = useState(false);

  const handleResize = () => {
    if (canvasRef.current) {
      const container = canvasRef.current.parentElement;
      canvasRef.current.width = container.clientWidth;
      canvasRef.current.height = container.clientHeight;
    }
      for (let j = 0; j < smoothed.length - 1; j++) {
        const p0 = smoothed[j];
        const p1 = smoothed[j+1];
        const q0 = { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y };
        const q1 = { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y };
        newPoints.push(q0, q1);
      }
      smoothed = newPoints;
    }
    return smoothed;
  }

  return (
    <div ref={containerRef}>
      <Card>
        {toast && <Toast {...toast} onClose={()=>setToast(null)} />}
        {previewTasks && (
          <div className="p-4 bg-yellow-100 border rounded mb-4">
            <h3 className="font-bold mb-2">Vista previa IA</h3>
            <ul className="list-disc pl-5 mb-2">
              {previewTasks.map((t,i) => {
                const guest = sampleGuests.find(g => g.id === t.guestId);
                return <li key={i}>{guest?.name} → Asiento {t.seatId}</li>;
              })}
            </ul>
            <button onClick={applyPreview} className="px-3 py-1 bg-green-600 text-white rounded mr-2">Aplicar</button>
            <button onClick={() => setPreviewTasks(null)} className="px-3 py-1 bg-gray-200 rounded">Cancelar</button>
          </div>
        )}
        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/4 mb-4 lg:mb-0">
            <div className="lg:hidden mb-2">
              <button 
                onClick={() => setGuestListOpen(!guestListOpen)}
                className="px-3 py-1 bg-blue-500 text-white rounded"
              >
                {guestListOpen ? 'Hide Guests' : 'Show Guests'}
              </button>
            </div>
            {guestListOpen && (
              <div className="border rounded p-3 bg-white">
                <div className="flex items-center border rounded px-2 py-1 mb-2">
                  <Search size={16} className="mr-2" />
                  <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full" />
                </div>
                <div className="flex space-x-2 mb-2">
                  <select value={rsvpFilter} onChange={e => setRsvpFilter(e.target.value)} className="border rounded px-1">
                    <option value="">Todos RSVP</option>
                    <option value="yes">Sí</option>
                    <option value="no">No</option>
                  </select>
                  <input type="text" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="border rounded px-1" />
                  <button onClick={bulkAssign} className="px-2 py-1 bg-purple-600 text-white rounded">Bulk Assign</button>
                </div>
                <div className="overflow-auto max-h-[400px]">
                  {availableGuests.map(g=><Guest key={g.id} guest={g} />)}
                </div>
              </div>
            )}
          </div>
          <div className="w-full lg:w-3/4 relative">
            <div 
              ref={containerRef} 
              className="border rounded bg-white overflow-auto"
              style={{
                height: '70vh',
                minHeight: '400px'
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                  <button onClick={()=>setActiveTab('ceremony')} className={`px-4 py-2 rounded ${activeTab==='ceremony'?'bg-blue-600 text-white':'bg-gray-200'}`}>Ceremonia</button>
                  <button onClick={()=>setActiveTab('banquet')} className={`px-4 py-2 rounded ${activeTab==='banquet'?'bg-blue-600 text-white':'bg-gray-200'}`}>Banquete</button>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="text" placeholder="Criterios IA" className="border rounded px-2 py-1" value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} />
                  <button onClick={handleAutoAssign} className="px-3 py-2 bg-gray-200 rounded flex items-center" disabled={aiLoading}>
                    {aiLoading? <Spinner /> : <Cpu size={16} />}
                  </button>
                  <label className="ml-4">Temp:</label>
                  <input type="range" min="0" max="1" step="0.1" value={aiTemp} onChange={e=>setAiTemp(+e.target.value)} className="w-24" />
                  <label className="ml-2">Tokens:</label>
                  <input type="number" min={1} max={2048} value={aiMaxTokens} onChange={e=>setAiMaxTokens(+e.target.value)} className="w-16 border rounded px-1 ml-1" />
                </div>
                <div className="flex space-x-2 mb-4">
                  <button onClick={handleLoad} className="px-3 py-1 bg-blue-600 text-white rounded">Cargar</button>
                  <button onClick={handleExportCSV} className="px-3 py-1 bg-gray-200 rounded">CSV</button>
                  <button onClick={handleExportPNG} className="px-3 py-1 bg-gray-200 rounded">PNG</button>
                  <button onClick={handleExportPDF} className="px-3 py-1 bg-gray-200 rounded">PDF</button>
                  <button onClick={undo} disabled={historyIndex <= 0} className="px-3 py-1 bg-gray-200 rounded">Undo</button>
                  <button onClick={redo} disabled={historyIndex >= history.length - 1} className="px-3 py-1 bg-gray-200 rounded">Redo</button>
                </div>
                <div className="flex space-x-2 mb-4">
                  <label>Forma:</label>
                  <select value={shapeType} onChange={e=>setShapeType(e.target.value)} className="border rounded px-1">
                    <option value="rect">Rectangular</option>
                    <option value="circle">Circular</option>
                  </select>
                  <label>Tamaño:</label>
                  <input type="number" min={20} max={200} value={seatSize} onChange={e=>setSeatSize(+e.target.value)} className="w-16 border rounded px-1" />
                </div>
                <div role="toolbar" aria-label="Canvas tools" className="flex space-x-2 mb-4">
                  <button title="Dibujar" onClick={() => setTool('draw')} className="px-2 py-1 bg-gray-200 rounded">✏️</button>
                  <button title="Mover" onClick={() => setTool('pan')} className="px-2 py-1 bg-gray-200 rounded">✋</button>
                  <button title="Zoom In" onClick={() => setScale(scale * 1.2)} className="px-2 py-1 bg-gray-200 rounded">➕</button>
                  <button title="Zoom Out" onClick={() => setScale(scale / 1.2)} className="px-2 py-1 bg-gray-200 rounded">➖</button>
                  <button onClick={() => addTable('circle')} className="px-2 py-1 bg-amber-300 rounded">Añadir mesa</button>
                  <button onClick={() => setScale(s=>Math.min(4,s*1.2))} className="px-2 py-1 bg-gray-200 rounded">➕</button>
                </div>
                <DndProvider backend={backend}>
                  <div className="flex flex-col md:flex-row space-x-0 md:space-x-6">
                    <div className="w-full md:w-1/4">
                      <div className="lg:hidden mb-2">
<button
                          onClick={() => setGuestListOpen(!guestListOpen)}
                          className="px-3 py-1 bg-blue-500 text-white rounded"
                        >
                          {guestListOpen ? 'Hide Guests' : 'Show Guests'}
                        </button>
                      </div>
                      {guestListOpen && (
                        <div className="border rounded p-3 bg-white">
                          <div className="flex items-center border rounded px-2 py-1 mb-2">
                            <Search size={16} className="mr-2" />
                            <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full" />
                          </div>
                          <div className="flex space-x-2 mb-2">
                            <select value={rsvpFilter} onChange={e => setRsvpFilter(e.target.value)} className="border rounded px-1">
                              <option value="">Todos RSVP</option>
                              <option value="yes">Sí</option>
                              <option value="no">No</option>
                            </select>
                            <input type="text" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="border rounded px-1" />
                            <button onClick={bulkAssign} className="px-2 py-1 bg-purple-600 text-white rounded">Bulk Assign</button>
                          </div>
                          <div className="overflow-auto max-h-[400px]">
                            {availableGuests.map(g=><Guest key={g.id} guest={g} />)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="w-full md:flex-1">
                      <div className="border rounded overflow-hidden">
                        <p className="p-2 text-sm text-gray-600">Dibuja el área con el ratón y haz clic en "Finalizar área"</p>
                        <canvas ref={canvasRef} width={600} height={400} onWheel={handleWheel} onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} />
                        {areas.map((_, i) => (
                          <button key={i} onClick={() => removeArea(i)} title={`Eliminar Área ${i+1}`} aria-label={`Eliminar Área ${i+1}`} className="px-2 py-1 bg-red-500 text-white rounded">Área {i+1} ✖</button>
                        ))}
                      </div>
                      <div className="flex flex-wrap mt-4">
                        {seats.map(s=> <Seat key={s.id} seat={s} guest={sampleGuests.find(g=>g.id===s.assignedGuestId)} onDrop={assignGuestToSeat} shapeType={shapeType} seatSize={seatSize} />)}
                      </div>
                    </div>
                  </div>
                </DndProvider>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
