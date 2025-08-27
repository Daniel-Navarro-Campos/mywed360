import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import Spinner from './Spinner';
import { getBackendBase } from '../utils/backendBase';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';

// --- Modo debug opcional ---
// Actívalo desde la consola con: window.lovendaDebug = true
const chatDebug = (...args) => {
  if (typeof window !== 'undefined' && window.lovendaDebug) {
    // eslint-disable-next-line no-console
    console.debug('[ChatWidget]', ...args);
  }
};

// --- Configuración de memoria conversacional ---
const MAX_MESSAGES = 50;        // Cuántos mensajes “frescos” mantener en memoria corta
const SHORT_HISTORY = 6;        // Cuántos mensajes recientes se envían a la IA

// Función para normalizar texto de categoría: elimina acentos y convierte a mayúsculas
const normalizeCategory = (cat = 'OTROS') => cat.normalize('NFD').replace(/[^\w\s]|_/g, '').replace(/\s+/g, '').toUpperCase();
// Intenta adivinar la categoría en base al título/descripcion de la tarea
const guessCategory = (title = '') => {
  const t = title.toLowerCase();
  if (/lugar|finca|sal[oó]n/.test(t)) return 'LUGAR';
  if (/foto|fot[oó]graf/.test(t)) return 'FOTOGRAFO';
  if (/m[uú]sica|dj|banda/.test(t)) return 'MUSICA';
  if (/vestido|traje|vestuari|zapato/.test(t)) return 'VESTUARIO';
  if (/catering|banquete|men[uú]/.test(t)) return 'CATERING';
  return 'OTROS';
};

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(() => { const saved = localStorage.getItem('chatOpen'); return saved ? JSON.parse(saved) : false; });
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('chatMessages') || '[]');
    } catch {
      return [];
    }
  });
  const [summary, setSummary] = useState(() => {
    try {
      return localStorage.getItem('chatSummary') || '';
    } catch {
      return '';
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleImportant = (idx) => {
    setMessages(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], important: !copy[idx].important };
      if (copy[idx].important) {
        try {
          const notes = JSON.parse(localStorage.getItem('importantNotes') || '[]');
          notes.push({ text: copy[idx].text, date: Date.now() });
          localStorage.setItem('importantNotes', JSON.stringify(notes));
          window.dispatchEvent(new Event('lovenda-important-note'));
          toast.success('Nota marcada como importante');
        } catch { /* ignore */ }
      }
      return copy;
    });
  };

  useEffect(() => {
    localStorage.setItem('chatOpen', JSON.stringify(open));
  }, [open]);

  // Persistir resumen entre sesiones
  useEffect(() => {
    localStorage.setItem('chatSummary', summary);
  }, [summary]);

  useEffect(() => {
    try {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    } catch {/* ignore */}
  }, [messages]);

  // --- Utilidad para compactar mensajes y moverlos al resumen ---
  const compactMessages = (arr) => {
    if (arr.length <= MAX_MESSAGES) return arr;
    const excess = arr.length - MAX_MESSAGES;
    const toSummarize = arr.slice(0, excess);
    const rest = arr.slice(excess);
    const summaryPart = toSummarize.map(m => `${m.from === 'user' ? 'Usuario' : 'IA'}: ${m.text}`).join('\n');
    setSummary(prev => prev ? `${prev}\n${summaryPart}` : summaryPart);
    return rest;
  };

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
    if (entity === 'task' || entity === 'meeting') {
      switch(action){
      case 'add': {
        // asegurar id único
        const newId = payload.id || `ai-${Date.now()}`;
        const startDate = payload.start ? new Date(payload.start) : new Date();
        const endDate = payload.end ? new Date(payload.end) : startDate;
        meetings.push({
          id: newId,
          title: payload.title || payload.name || (entity === 'task' ? 'Tarea' : 'Reunión'),
          name: payload.title || payload.name || (entity === 'task' ? 'Tarea' : 'Reunión'),
          desc: payload.desc || '',
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          type: entity,
          category: normalizeCategory(payload.category || guessCategory(payload.title || payload.name || '')),
        });
        toast.success(entity === 'task' ? 'Tarea añadida' : 'Reunión añadida');
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
          // normalizar fechas si vienen en Date
          if (meetings[idx].start instanceof Date) meetings[idx].start = meetings[idx].start.toISOString();
          if (meetings[idx].end instanceof Date) meetings[idx].end = meetings[idx].end.toISOString();
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
            const apiBase = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://api.lovenda.app');
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
    const currentMsgs = compactMessages([...messages, userMsg]);
    setMessages(currentMsgs);
    setInput('');
    setLoading(true);
    let timeoutId;
    try {
      // Obtener URL base del backend (centralizado en utils)
      const apiBase = getBackendBase();
      chatDebug('Usando backend en:', apiBase);
      
      
      const endpoint = `${apiBase.replace(/\/$/, '')}/api/ai/parse-dialog`;
      chatDebug('Llamando a la API IA en:', endpoint);
      toast.info('Conectando con IA...', { autoClose: 2000 });
      const fetchStart = performance.now();
      
      const recent = currentMsgs.slice(-SHORT_HISTORY).map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
      const history = summary ? [{ role: 'system', content: summary }, ...recent] : recent;
      
      // Implementar timeout para evitar esperas indefinidas
      const controller = new AbortController();
      timeoutId = setTimeout(() => {
        controller.abort();
        console.error('Timeout en la llamada a la API de IA');
        toast.error('La IA está tardando demasiado. Reintentando con respuesta local...');
      }, 30000); // 30 segundos máximo para mejor UX
      
      // Obtener token de autenticación
      const token = user ? await user.getIdToken() : null;
      if (!token) {
        throw new Error('Usuario no autenticado');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: input, history }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      chatDebug('Duración petición IA:', (performance.now() - fetchStart).toFixed(0), 'ms');
      
      if (!response.ok) {
        throw new Error(`Error de API: ${response.status} ${response.statusText}`);
      }
      
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
            category: normalizeCategory(t.category || 'OTROS'),
          };
        });
        const updatedM = [...storedMeetings, ...mappedT];
        localStorage.setItem('lovendaMeetings', JSON.stringify(updatedM));
        window.dispatchEvent(new Event('lovenda-tasks'));
        window.dispatchEvent(new Event('lovenda-meetings'));
        toast.success(`${mappedT.length} tarea${mappedT.length>1?'s':''} añadida${mappedT.length>1?'s':''}`);
      }

      // --- Persistir reuniones extraídas ---
      if (data.extracted?.meetings?.length) {
        const storedMeetings = JSON.parse(localStorage.getItem('lovendaMeetings') || '[]');
        let nextId = Date.now();
        const mappedR = data.extracted.meetings.map(r => {
          const startIso = r.start || r.date || r.when || r.begin;
          const endIso = r.end || r.until || startIso;
          const startDate = startIso ? new Date(startIso) : new Date();
          const endDate = endIso ? new Date(endIso) : startDate;
          return {
            id: `ai-${nextId++}`,
            title: r.title || r.name || 'Reunión',
            name: r.title || r.name || 'Reunión',
            desc: r.desc || r.description || '',
            start: startDate,
            end: endDate,
            type: 'meeting',
            category: normalizeCategory(r.category || 'OTROS'),
          };
        });
        const updatedR = [...storedMeetings, ...mappedR];
        localStorage.setItem('lovendaMeetings', JSON.stringify(updatedR));
        window.dispatchEvent(new Event('lovenda-tasks'));
        window.dispatchEvent(new Event('lovenda-meetings'));
        toast.success(`${mappedR.length} reunión${mappedR.length>1?'es':''} añadida${mappedR.length>1?'s':''}`);
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
      setMessages(prev => compactMessages([...prev, botMsg]));
    } catch (error) {
      console.error('Error en chat de IA:', error);
      // Respuesta de emergencia local cuando falla la conexión con el backend
      let errMsg;
      if (error.name === 'AbortError' || error.message.includes('Timeout') || error.message.includes('abort')) {
        console.error('Timeout en la llamada a la API de IA:', error.message);
        errMsg = { 
          from: 'assistant', 
          text: 'Parece que hay problemas de conexión con el servidor. Puedo ayudarte con consultas básicas sobre tu boda mientras se restablece la conexión. ¿Qué deseas saber?' 
        };
        toast.error('Tiempo de espera agotado', { autoClose: 3000 });
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        console.error('Error de red en la llamada a la API de IA:', error.message);
        errMsg = { 
          from: 'system', 
          text: `No se pudo conectar con el servidor de IA. Por favor, verifica tu conexión y vuelve a intentarlo.` 
        };
        toast.error('Error de conexión', { autoClose: 3000 });
      } else {
        console.error('Error genérico en la API de IA:', error.message);
        errMsg = { from: 'system', text: `Ha ocurrido un error: ${error.message}` };
        toast.error('Error en la comunicación', { autoClose: 3000 });
      }
      
      setMessages(prev => [...prev, errMsg]);
    } finally {
      clearTimeout(timeoutId);
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
                <span className="inline-block p-2 rounded bg-gray-200 mr-1">{m.text}</span>
                <button onClick={() => toggleImportant(i)} className="align-middle" title={m.important ? 'Marcado como importante' : 'Marcar como importante'}>
                  <Star size={16} className={m.important ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'} />
                </button>
              </div>
            ))}
          </div>
          <div className="p-2 flex">
            <input aria-label="Mensaje de chat"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } }}
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
