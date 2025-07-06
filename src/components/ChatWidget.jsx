import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import Spinner from './Spinner';
import { toast } from 'react-toastify';

export default function ChatWidget() {
  const [open, setOpen] = useState(() => { const saved = localStorage.getItem('chatOpen'); return saved ? JSON.parse(saved) : false; });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('chatOpen', JSON.stringify(open));
  }, [open]);

  // Utilidad para aplicar comandos de la IA
const applyCommands = async (commands = []) => {
  if (!commands.length) return;
  let meetings = JSON.parse(localStorage.getItem('lovendaMeetings') || '[]');
  let completed = JSON.parse(localStorage.getItem('tasksCompleted') || '{}');
  let changed = false;

  const findTaskIndex = (identifier) => {
    const idxById = meetings.findIndex(m => m.id === identifier);
    if (idxById !== -1) return idxById;
    return meetings.findIndex(m => m.title?.toLowerCase() === identifier?.toLowerCase());
  };

  commands.forEach(async (cmd) => {
    const { entity, action, payload = {} } = cmd;
    if (entity === 'task') {
      switch(action){
      case 'add': {
        // asegurar id único
        const newId = payload.id || `ai-${Date.now()}`;
        const startDate = payload.start ? new Date(payload.start) : new Date();
        const endDate = payload.end ? new Date(payload.end) : startDate;
        meetings.push({
          id: newId,
          title: payload.title || payload.name || 'Tarea',
          name: payload.title || payload.name || 'Tarea',
          desc: payload.desc || '',
          start: startDate,
          end: endDate,
          type: 'meeting',
          category: (payload.category || 'OTROS').toUpperCase(),
        });
        toast.success('Tarea añadida');
        changed = true;
        break;
      }
      case 'update':
      case 'edit':
      case 'editar':
      case 'modificar': {
        const idx = findTaskIndex(payload.id || payload.title);
        if (idx !== -1){
          meetings[idx] = { ...meetings[idx], ...payload };
          toast.success('Tarea actualizada');
          changed = true;
        }
        break;
      }
      case 'delete':
        case 'remove': {
        const before = meetings.length;
        meetings = meetings.filter(m => !(m.id === payload.id || m.title?.toLowerCase() === payload.title?.toLowerCase()));
        if (meetings.length < before){
          toast.success('Tarea eliminada');
          changed = true;
        }
        break;
      }
      case 'complete':
      case 'done': {
        if (payload.done === false) break;
        const idx = findTaskIndex(payload.id || payload.title);
        if (idx !== -1){
          completed[meetings[idx].id] = true;
          toast.success('Tarea marcada como completada');
          changed = true;
        }
        break;
      }
      default:
        break;
      }
    } else if (entity === 'guest') {
      // ----- GUESTS LOGIC -----
      let guests = JSON.parse(localStorage.getItem('lovendaGuests') || '[]');
      let changedG = false;
      const findGuestIdx = (identifier) => {
        const idxById = guests.findIndex(g => g.id === identifier);
        if (idxById !== -1) return idxById;
        return guests.findIndex(g => g.name?.toLowerCase() === identifier?.toLowerCase());
      };
      switch(action){
        case 'add': {
          const newId = payload.id || `guest-${Date.now()}`;
          guests.push({
            id: newId,
            name: payload.name || 'Invitado',
            phone: payload.phone || '',
            address: payload.address || '',
            companion: payload.companion ?? payload.companions ?? 0,
            table: payload.table || '',
            response: payload.response || 'Pendiente'
          });
          toast.success('Invitado añadido');
          changedG = true;
          break;
        }
        case 'update':
        case 'edit':
        case 'editar':
        case 'modificar': {
          const idx = findGuestIdx(payload.id || payload.name);
          if (idx !== -1) {
            guests[idx] = { ...guests[idx], ...payload };
            toast.success('Invitado actualizado');
            changedG = true;
          }
          break;
        }
        case 'delete':
        case 'remove': {
          const before = guests.length;
          guests = guests.filter(g => !(g.id === payload.id || g.name?.toLowerCase() === payload.name?.toLowerCase()));
          if (guests.length < before) {
            toast.success('Invitado eliminado');
            changedG = true;
          }
          break;
        }
        default:
          break;
      }
      if (changedG){
        localStorage.setItem('lovendaGuests', JSON.stringify(guests));
        window.dispatchEvent(new Event('lovenda-guests'));
      }
    } else if (entity === 'movement' || entity === 'movimiento' || entity === 'gasto' || entity === 'ingreso') {
      // ----- MOVEMENTS LOGIC -----
      let movements = JSON.parse(localStorage.getItem('lovendaMovements') || '[]');
      let changedM = false;
      const findMovIdx = (identifier) => {
        const idxById = movements.findIndex(m => m.id === identifier);
        if (idxById !== -1) return idxById;
        return movements.findIndex(m => m.name?.toLowerCase() === identifier?.toLowerCase());
      };
      switch(action){
        case 'add': {
          const newId = payload.id || `mov-${Date.now()}`;
          movements.push({
            id: newId,
            name: payload.concept || payload.name || 'Movimiento',
            amount: Number(payload.amount) || 0,
            date: payload.date || new Date().toISOString().slice(0,10),
            type: payload.type === 'income' ? 'income' : 'expense'
          });
          toast.success('Movimiento añadido');
          changedM = true;
          break;
        }
        case 'update':
        case 'edit':
        case 'editar':
        case 'modificar': {
          const idx = findMovIdx(payload.id || payload.concept || payload.name);
          if (idx !== -1) {
            movements[idx] = { ...movements[idx], ...payload };
            toast.success('Movimiento actualizado');
            changedM = true;
          }
          break;
        }
        case 'delete':
        case 'remove': {
          const before = movements.length;
          movements = movements.filter(m => !(m.id === payload.id || m.name?.toLowerCase() === (payload.concept||payload.name)?.toLowerCase()));
          if (movements.length < before) {
            toast.success('Movimiento eliminado');
            changedM = true;
          }
          break;
        }
        default:
          break;
      }
      if (changedM){
        localStorage.setItem('lovendaMovements', JSON.stringify(movements));
        window.dispatchEvent(new Event('lovenda-movements'));
      }
    } else if (entity === 'supplier') {
      // ----- SUPPLIER SEARCH LOGIC -----
      if (action === 'search') {
        const query = payload.query || payload.q || payload.keyword || payload.term || '';
        if (query) {
          try {
            const apiBase = import.meta.env.VITE_BACKEND_URL || '';
            const resp = await fetch(`${apiBase}/api/ai/search-suppliers?q=${encodeURIComponent(query)}`);
            const dataS = await resp.json();
            if (dataS.results) {
              localStorage.setItem('lovendaSuppliers', JSON.stringify(dataS.results));
              window.dispatchEvent(new Event('lovenda-suppliers'));
              toast.success(`Encontrados ${dataS.results.length} proveedores`);
            } else {
              toast.info('No se encontraron proveedores');
            }
          } catch (err) {
            toast.error('Error buscando proveedores');
          }
        }
      }
    } else if (entity === 'table') {
      // ----- TABLE MOVE LOGIC -----
      let guests = JSON.parse(localStorage.getItem('lovendaGuests') || '[]');
      let changedT = false;
      const idx = guests.findIndex(g => g.id === payload.guestId || g.id === payload.guest || g.name?.toLowerCase() === (payload.guestName||payload.name||payload.guest)?.toLowerCase());
      if (idx !== -1 && payload.table) {
        guests[idx].table = payload.table;
        toast.success(`Invitado movido a mesa ${payload.table}`);
        changedT = true;
      }
      if (changedT){
        localStorage.setItem('lovendaGuests', JSON.stringify(guests));
        window.dispatchEvent(new Event('lovenda-guests'));
      }
    } else if (entity === 'config') {
      // ----- CONFIG LOGIC -----
      let profile = {};
      try { profile = JSON.parse(localStorage.getItem('lovendaProfile') || '{}'); } catch { profile = {}; }
      profile = { ...profile };
      if (!profile.weddingInfo) profile.weddingInfo = {};
      // merge payload into weddingInfo at top level too (for generic)
      profile.weddingInfo = { ...profile.weddingInfo, ...payload };
      Object.assign(profile, payload.root || {});
      localStorage.setItem('lovendaProfile', JSON.stringify(profile));
      window.dispatchEvent(new Event('lovenda-profile'));
      toast.success('Configuración actualizada');
    }
  });

  if (changed){
    localStorage.setItem('lovendaMeetings', JSON.stringify(meetings));
    localStorage.setItem('tasksCompleted', JSON.stringify(completed));
    window.dispatchEvent(new Event('lovenda-tasks'));
  }
};

const sendMessage = async () => {
    if (!input) return;
    const userMsg = { from: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${apiBase}/api/ai/parse-dialog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });
      const data = await response.json();

      // --- Procesar comandos si existen ---
      if (data.extracted?.commands?.length) {
        await applyCommands(data.extracted.commands);
      }


      // --- Persistir invitados extraídos ---
      if (data.extracted?.guests?.length) {
        const stored = JSON.parse(localStorage.getItem('lovendaGuests') || '[]');
        let nextId = stored.length ? Math.max(...stored.map(g => g.id)) + 1 : 1;
        const mapped = data.extracted.guests.map(g => ({
          id: nextId++,
          name: g.name || 'Invitado',
          phone: g.phone || '',
          address: g.address || '',
          companion: g.companions || 0,
          table: g.table || '',
          response: 'Pendiente'
        }));
        const updated = [...stored, ...mapped];
        localStorage.setItem('lovendaGuests', JSON.stringify(updated));
        window.dispatchEvent(new Event('lovenda-guests'));
        toast.success(`${mapped.length} invitado${mapped.length>1?'s':''} añadido${mapped.length>1?'s':''}`);
      }

      // --- Persistir tareas extraídas ---
      if (data.extracted?.tasks?.length) {
        const storedMeetings = JSON.parse(localStorage.getItem('lovendaMeetings') || '[]');
        let nextId = storedMeetings.length ? Date.now() : Date.now();
        const mappedT = data.extracted.tasks.map(t => {
          // Priorizar campo "due" (ISO), luego date/start/end si vienen de la IA
          const dueIso = t.due || t.date || t.start || t.end;
          const startDate = dueIso ? new Date(dueIso) : new Date();
          const endDate = t.end ? new Date(t.end) : startDate;
          return {
            id: `ai-${nextId++}`,
            title: t.title || t.name || 'Tarea',
            name: t.title || t.name || 'Tarea',
            desc: t.desc || '',
            start: startDate,
            end: endDate,
            type: 'meeting',
            category: (t.category || 'OTROS').toUpperCase(),
          };
        });
        const updatedM = [...storedMeetings, ...mappedT];
        localStorage.setItem('lovendaMeetings', JSON.stringify(updatedM));
        window.dispatchEvent(new Event('lovenda-tasks'));
        toast.success(`${mappedT.length} tarea${mappedT.length>1?'s':''} añadida${mappedT.length>1?'s':''}`);
      }

      // --- Persistir movimientos extraídos ---
  const extMovs = data.extracted?.movements || data.extracted?.budgetMovements;
  if (extMovs?.length) {
        const storedMov = JSON.parse(localStorage.getItem('lovendaMovements') || '[]');
        let nextId = storedMov.length ? Date.now() : Date.now();
        const mappedMov = extMovs.map(m => ({
          id: `mov-${nextId++}`,
          name: m.concept || m.name || 'Movimiento',
          amount: Number(m.amount) || 0,
          date: m.date || new Date().toISOString().slice(0,10),
          type: m.type === 'income' ? 'income' : 'expense'
        }));
        const updatedMov = [...storedMov, ...mappedMov];
        localStorage.setItem('lovendaMovements', JSON.stringify(updatedMov));
        window.dispatchEvent(new Event('lovenda-movements'));
        toast.success(`${mappedMov.length} movimiento${mappedMov.length>1?'s':''} añadido${mappedMov.length>1?'s':''}`);
      }
      let text;
      if (data.reply) {
        text = data.reply;
      } else if (data.extracted && Object.keys(data.extracted).length) {
        text = 'Datos extraídos:\n' + JSON.stringify(data.extracted, null, 2);
      } else if (data.error) {
        text = 'Error: ' + data.error;
      } else {
        text = 'No se detectaron datos para extraer. ¿Puedes darme más detalles?';
      }
      const botMsg = { from: 'bot', text };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { from: 'bot', text: 'Error al llamar a la API de IA' }]);
    } finally {
      setLoading(false);
    }
    
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-white shadow-lg rounded-lg flex flex-col overflow-hidden z-50">
          <div className="bg-blue-600 text-white p-2 flex items-center">
            <MessageSquare className="mr-2" /> Chat IA
          </div>
          <div className="flex-1 p-2 overflow-y-auto relative">
                          {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <Spinner />
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-2 ${m.from === 'user' ? 'text-right' : 'text-left'}`}
              >
                <span className="inline-block p-2 rounded bg-gray-200">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="p-2 flex">
            <input aria-label="Mensaje de chat"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 border rounded px-2 py-1"
              placeholder="Escribe..."
            />
            <motion.button onClick={sendMessage} aria-label="Enviar mensaje" className="ml-2 bg-blue-600 text-white px-3 rounded" disabled={loading}>
              Enviar
            </motion.button>
          </div>
        </div>
      )}
      <motion.button
        onClick={() => setOpen(!open)} aria-label={open ? "Cerrar chat" : "Abrir chat"} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg z-50"
      >
        <MessageSquare />
      </motion.button>
    </>
  );
}
