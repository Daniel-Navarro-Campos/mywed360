import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { Gantt, ViewMode } from 'gantt-task-react';
import { saveData, loadData, subscribeSyncState, getSyncState } from '../services/SyncService';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

// ICS y utilidades de calendario
function formatICalDate(date) {
  const pad = n => String(n).padStart(2,'0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth()+1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function generateFullICS(events) {
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lovenda//WeddingApp//ES'];
  events.forEach(evt => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${evt.id}`);
    lines.push(`DTSTAMP:${formatICalDate(new Date())}`);
    lines.push(`DTSTART:${formatICalDate(evt.start)}`);
    lines.push(`DTEND:${formatICalDate(evt.end)}`);
    lines.push(`SUMMARY:${evt.title}`);
    if (evt.desc) lines.push(`DESCRIPTION:${evt.desc}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

const downloadAllICS = (events) => {
  const icsContent = generateFullICS(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'calendario_wedding.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'gantt-task-react/dist/index.css';
import './Tasks.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { es } from 'date-fns/locale/es';

const locales = {
  'es-ES': es
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Categorías de tareas con sus colores
const categories = {
  LUGAR: { name: 'Lugar', color: '#10b981', bgColor: '#d1fae5', borderColor: '#34d399' },
  FOTOGRAFO: { name: 'Fotógrafo', color: '#f59e0b', bgColor: '#fef3c7', borderColor: '#fbbf24' },
  MUSICA: { name: 'Música', color: '#ef4444', bgColor: '#fee2e2', borderColor: '#f87171' },
  VESTUARIO: { name: 'Vestuario', color: '#8b5cf6', bgColor: '#ede9fe', borderColor: '#a78bfa' },
  CATERING: { name: 'Catering', color: '#3b82f6', bgColor: '#dbeafe', borderColor: '#60a5fa' },
  OTROS: { name: 'Otros', color: '#6b7280', bgColor: '#f3f4f6', borderColor: '#9ca3af' }
};

// Estilos personalizados para el calendario
const eventStyleGetter = (event) => {
  const category = categories[event.category] || categories.OTROS;
  return { style: { backgroundColor: category.bgColor, color: '#1f2937', border: `2px solid ${category.color}`, borderRadius: '4px', opacity: 0.9, display: 'block', fontSize: '0.85rem', padding: '2px 4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' } };
};

// Componente para renderizar cada evento en el calendario
const Event = ({ event }) => {
  const category = categories[event.category] || categories.OTROS;
  return (
    <div className="p-1">
      <div className="flex items-center">
        <div className="w-1.5 h-1.5 rounded-full mr-1 flex-shrink-0" style={{ backgroundColor: category.color }} />
        <span className="truncate font-medium">{event.title}</span>
      </div>
    </div>
  );
};

// Tareas a largo plazo para el Gantt
const initialTasks = [
  { start: new Date(2025,0,1), end: new Date(2025,2,31), name: 'Buscar lugar de la boda', id: '1', type: 'task', category: 'LUGAR', progress: 20, isDisabled: false, dependencies: [] },
  { start: new Date(2025,3,1), end: new Date(2025,4,15), name: 'Buscar fotógrafo', id: '2', type: 'task', category: 'FOTOGRAFO', progress: 10, isDisabled: false, dependencies: [] },
  { start: new Date(2025,2,15), end: new Date(2025,3,30), name: 'Contratar grupo musical', id: '3', type: 'task', category: 'MUSICA', progress: 5, isDisabled: false, dependencies: [] }
];

// Reuniones y eventos adicionales
const initialMeetings = [
  { id: 'm1', title: 'Visita al salón de eventos', start: new Date(2025,5,10,10,0), end: new Date(2025,5,10,11,30), type: 'meeting', category: 'LUGAR', desc: 'Ver las instalaciones y paquetes disponibles', location: 'Salón Las Dalias, Calle Principal 123' },
  { id: 'm2', title: 'Reunión con fotógrafo', start: new Date(2025,5,12,16,0), end: new Date(2025,5,12,17,0), type: 'meeting', category: 'FOTOGRAFO', desc: 'Revisar portafolio y paquetes', contact: 'Fotografía Martínez, 555-1234' },
  { id: 'm3', title: 'Prueba de vestido', start: new Date(2025,5,15,16,0), end: new Date(2025,5,15,18,0), type: 'task', category: 'VESTUARIO', desc: 'Llevar zapatos y joyas', location: 'Boutique Elegancia, Centro Comercial Galerías' },
  { id: 'm4', title: 'Prueba de sonido con la banda', start: new Date(2025,5,18,19,0), end: new Date(2025,5,18,21,0), type: 'task', category: 'MUSICA', desc: 'Llevar lista de canciones', contact: 'Banda Sonora Perfecta, 555-5678' },
  { id: 'm5', title: 'Cata de menú', start: new Date(2025,5,20,12,0), end: new Date(2025,5,20,13,0), type: 'meeting', category: 'CATERING', desc: 'Probar opciones de menú y postres', location: 'Catering Delicias, Av. Principal 456' }
];

export default function Tasks() {
  const [currentView, setCurrentView] = useState(() => loadData('tasksView', { defaultValue: 'month' }));
  const [tasksState,setTasksState]=useState(initialTasks);
  
  // Estado de sincronización
  const [syncStatus, setSyncStatus] = useState(getSyncState());

// Meetings from Firestore (fallback initial + stored for offline first load)
const { data: meetingsState, addItem: addMeeting, updateItem: updateMeeting, deleteItem: deleteMeeting } = useFirestoreCollection('meetings', initialMeetings);


// Listener para compatibilidad con el flujo antiguo (IA escribe en localStorage y lanza evento)
useEffect(() => {
  const handler = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem('lovendaMeetings') || '[]');
      for (const m of stored) {
        // Comprobar si ya existe en Firestore
        if (!meetingsState.some(e => e.id === m.id)) {
          await addMeeting({ ...m, start: new Date(m.start), end: new Date(m.end) });
        }
      }
    } catch(_){}
  };
  window.addEventListener('lovenda-tasks', handler);
  return () => window.removeEventListener('lovenda-tasks', handler);
}, [meetingsState, addMeeting]);
  const [completed, setCompleted] = useState(() => {
    return loadData('tasksCompleted', { defaultValue: {}, collection: 'userTasksCompleted' });
  });
  const ganttRef = useRef(null);

  useEffect(() => {
    saveData('tasksView', currentView, { collection: 'userPreferences' });
  }, [currentView]);
  useEffect(() => {
    saveData('tasksCompleted', completed, { collection: 'userTasksCompleted' });
  }, [completed]);
  
  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);
  const listCellWidth = 40; // restored minimal list column width to maintain grid alignment // hide name column entirely
  const [columnWidthState, setColumnWidthState] = useState(0);

  useEffect(() => {
    if (!ganttRef.current) return;
    const containerWidth = ganttRef.current.clientWidth;
    const dates = tasksState.flatMap(t => [t.start, t.end]);
    const minTime = Math.min(...dates.map(d => d.getTime()));
    const maxTime = Math.max(...dates.map(d => d.getTime()));
    const minDate = new Date(minTime);
    const maxDate = new Date(maxTime);
    const monthsCount = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth()) + 1;
    const availableWidth = containerWidth - listCellWidth;
    const cw = Math.floor(availableWidth / monthsCount); // calculate width so all months fit; remove hard cap to prevent overlap
    setColumnWidthState(cw);
  }, [tasksState]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData,setFormData]=useState({title:'',desc:'',category:'OTROS',startDate:'',startTime:'',endDate:'',endTime:'',long:false});
  
  // Función para asignar automáticamente una categoría basada en el texto de la tarea
  const sugerirCategoria = (titulo, descripcion) => {
    const texto = `${titulo} ${descripcion || ''}`.toLowerCase();
    
    // Palabras clave por categoría
    const keywords = {
      LUGAR: ['lugar', 'salon', 'salón', 'finca', 'espacio', 'iglesia', 'ceremonia', 'recepción', 'recepcion', 'visita', 'reserva', 'reservar', 'locación', 'location', 'venue'],
      FOTOGRAFO: ['foto', 'fotografo', 'fotógrafo', 'fotografía', 'fotografia', 'album', 'álbum', 'video', 'videografo', 'videógrafo', 'grabar', 'grabación', 'grabacion', 'camara', 'cámara'],
      MUSICA: ['music', 'música', 'musica', 'banda', 'dj', 'grupo', 'canción', 'cancion', 'baile', 'bailar', 'sonido', 'audio', 'instrumentos', 'cantante', 'playlist', 'canciones'],
      VESTUARIO: ['vestido', 'traje', 'ropa', 'zapatos', 'calzado', 'complementos', 'accesorios', 'anillos', 'joyería', 'joyeria', 'velo', 'tiara', 'corbata', 'pajarita', 'smoking', 'moda', 'prueba'],
      CATERING: ['catering', 'comida', 'bebida', 'cena', 'banquete', 'menú', 'menu', 'aperitivo', 'coctel', 'cóctel', 'pastel', 'tarta', 'postre', 'vino', 'champagne', 'champán', 'cata', 'degustación', 'degustacion']
    };
    
    // Contar coincidencias para cada categoría
    const scores = Object.entries(keywords).reduce((acc, [category, words]) => {
      const matches = words.filter(word => texto.includes(word));
      return { ...acc, [category]: matches.length };
    }, {});
    
    // Encontrar la categoría con más coincidencias
    const entries = Object.entries(scores);
    if (entries.length === 0) return 'OTROS';
    
    // Ordenar por número de coincidencias (de mayor a menor)
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    
    // Si el mayor score es 0 o está empatado con OTROS, devolver OTROS
    if (sorted[0][1] === 0) return 'OTROS';
    
    return sorted[0][0]; // Devolver la categoría con más coincidencias
  };
  const handleChange = e => {
    const newValue = e.target.value;
    const field = e.target.name;
    
    // Actualizar el formulario con el nuevo valor
    const updatedFormData = { ...formData, [field]: newValue };
    
    // Si se modifica el título o la descripción, sugerir categoría automáticamente
    if ((field === 'title' || field === 'desc') && !editingId) {
      // Solo sugerimos categorías para tareas nuevas, no para ediciones
      const categoriaSugerida = sugerirCategoria(
        field === 'title' ? newValue : formData.title, 
        field === 'desc' ? newValue : formData.desc
      );
      
      // Solo actualizar la categoría si el usuario no la ha cambiado manualmente
      // o si la categoría actual es la predeterminada (OTROS)
      if (formData.category === 'OTROS') {
        updatedFormData.category = categoriaSugerida;
      }
    }
    
    setFormData(updatedFormData);
  };
  const resetForm = () => {
    setFormData({ title: '', desc: '', category: 'OTROS', startDate: '', startTime: '', endDate: '', endTime: '', long: false });
    setEditingId(null);
  };
  const closeModal = () => { setShowNewTask(false); resetForm(); };
  
  // Asignación automática de categoría utilizando IA
  const asignarCategoriaConIA = async (titulo, descripcion) => {
    // Primero intentamos con la función local
    const categoriaLocal = sugerirCategoria(titulo, descripcion);
    
    // Si tenemos un resultado claro que no es OTROS, lo usamos directamente
    if (categoriaLocal !== 'OTROS') {
      console.log('Categoría asignada localmente:', categoriaLocal);
      return categoriaLocal;
    }
    
    // Si la categoría local fue OTROS, intentamos con análisis más avanzado
    try {
      // Texto combinado para analizar
      const textoAnalizar = `${titulo} - ${descripcion || ''}`;
      
      // Análisis más profundo basado en patrones de texto
      const textoLower = textoAnalizar.toLowerCase();
      
      // Patrones más específicos por categoría
      if (textoLower.match(/iglesia|lugar|salon|finca|ceremonia|recep|venue|jardin/)) {
        return 'LUGAR';
      } else if (textoLower.match(/foto|video|album|camara|grabar|reportaje/)) {
        return 'FOTOGRAFO';
      } else if (textoLower.match(/musica|dj|banda|cancion|baile|sonido|audio/)) {
        return 'MUSICA';
      } else if (textoLower.match(/vestido|traje|ropa|calzado|zapato|complemento|accesorio|anillo|joya/)) {
        return 'VESTUARIO';
      } else if (textoLower.match(/comida|bebida|menu|menú|catering|banquete|tarta|pastel|cena|degustacion/)) {
        return 'CATERING';
      }
      
      // Si no encontramos coincidencias específicas, devolvemos OTROS
      return 'OTROS';
    } catch (error) {
      console.error('Error al asignar categoría con IA:', error);
      return formData.category || 'OTROS'; // Mantener la categoría actual o usar OTROS
    }
  };

  const handleSaveTask = async () => {
    try {
      // Validación más completa
      if (!formData.title) {
        alert('El título es obligatorio');
        return;
      }
      if (!formData.startDate) {
        alert('La fecha de inicio es obligatoria');
        return;
      }

      // Asegurarnos de que las fechas sean válidas
      const startDateTimeStr = `${formData.startDate}T${formData.startTime || '00:00'}`;
      const start = new Date(startDateTimeStr);
      
      if (isNaN(start.getTime())) {
        alert('La fecha de inicio no es válida');
        return;
      }

      // Si no hay fecha de fin, usar la misma fecha de inicio
      const endDateStr = formData.endDate || formData.startDate;
      const endTimeStr = formData.endTime || (formData.endDate ? '23:59' : formData.startTime || '23:59');
      const endDateTimeStr = `${endDateStr}T${endTimeStr}`;
      const end = new Date(endDateTimeStr);
      
      if (isNaN(end.getTime())) {
        alert('La fecha de fin no es válida');
        return;
      }

      // Verificar que la fecha de fin no sea anterior a la de inicio
      if (end < start) {
        alert('La fecha de fin no puede ser anterior a la fecha de inicio');
        return;
      }
      
      // Si es una tarea nueva, asignar categoría con IA
      let categoria = formData.category;
      if (!editingId) {
        categoria = await asignarCategoriaConIA(formData.title, formData.desc);
      }

      // Crear el objeto de la tarea con un ID único
      const baseObj = {
        id: editingId || `t${Date.now()}`,
        title: formData.title,
        name: formData.title,  // Para compatibilidad con Gantt
        start,
        end,
        type: 'task',
        category: categoria,
        desc: formData.desc || '',
        progress: 0,
      };

      // Guardar la tarea según su tipo (largo plazo o normal)
      if (formData.long) {
        // Para tareas de largo plazo (Gantt)
        setTasksState(prev => {
          if (editingId) {
            return prev.map(t => (t.id === editingId ? baseObj : t));
          } else {
            return [...prev, baseObj];
          }
        });
        
        // También guardar en localStorage para persistencia
        saveData('lovendaTasks', [...tasksState, baseObj], {
          showNotification: false
        });
        
        // Las tareas de largo plazo NO se añaden al calendario
      } else {
        // Para tareas normales (calendario)
        try {
          if (editingId) {
            await updateMeeting(editingId, baseObj);
          } else {
            await addMeeting(baseObj);
          }
        } catch (error) {
          console.error('Error al guardar tarea en Firestore:', error);
          // Modo de respaldo: guardar en localStorage si falla Firestore
          const currentMeetings = JSON.parse(localStorage.getItem('lovendaMeetings') || '[]');
          const updatedMeetings = editingId 
            ? currentMeetings.map(m => m.id === editingId ? {...baseObj} : m)
            : [...currentMeetings, {...baseObj}];
          localStorage.setItem('lovendaMeetings', JSON.stringify(updatedMeetings));
          // Disparar evento para notificar cambios
          window.dispatchEvent(new Event('lovenda-tasks'));
        }
      }
      
      // Si se edita una tarea, mantener su estado de completada
      if (editingId && completed[editingId]) {
        setCompleted(prev => ({ ...prev, [baseObj.id]: true }));
      }
      
      // Cerrar el modal y reiniciar el formulario
      closeModal();
    } catch (error) {
      console.error('Error al guardar la tarea:', error);
      alert('Ha ocurrido un error al guardar la tarea. Por favor, inténtelo de nuevo.');
    }
  };

  const handleDeleteTask = async () => {
    if (!editingId) return;
    if (tasksState.some(t => t.id === editingId)) {
      setTasksState(prev => prev.filter(t => t.id !== editingId));
    } else {
      await deleteMeeting(editingId);
    }
    setCompleted(prev => {
      const { [editingId]: _omit, ...rest } = prev;
      return rest;
    });
    closeModal();
  };

  const toggleCompleted = id => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };


  // Solo las reuniones (no las tareas de largo plazo) deben mostrarse en el calendario
const allEvents = [...meetingsState];

  const safeEvents = allEvents.map(event => ({ ...event, start: event.start instanceof Date ? event.start : new Date(event.start), end: event.end instanceof Date ? event.end : new Date(event.end) }));

  // Cálculo de progreso
  const allTaskIds = [
    ...tasksState.map(t => t.id),
    ...meetingsState.map(m => m.id)
  ];
  const totalTasks = allTaskIds.length;
  const completedCount = allTaskIds.filter(id => completed[id]).length;
  const percent = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);
  let barColor = 'bg-red-500';
  if (percent >= 80) barColor = 'bg-green-500';
  else if (percent >= 40) barColor = 'bg-blue-500';

  // Cálculo de tareas teóricas por día (no visible en UI)
  const now = new Date();
  const allDates = [
    ...tasksState.map(t => t.end),
    ...meetingsState.map(m => m.end)
  ].filter(Boolean);
  const maxDate = allDates.length ? new Date(Math.max(...allDates.map(d => new Date(d).getTime()))) : now;
  const daysLeft = Math.max(1, Math.ceil((maxDate - now) / (1000 * 60 * 60 * 24)));
  const teoricasPorDia = totalTasks / daysLeft;

  return (
    <div className="p-4 md:p-6 space-y-8">

      <style>{` 
        ._1nBOt > *:nth-child(n+2),
        ._34SS0 > *:nth-child(n+2) {
          display: none !important;
        }
      `}</style>
      <div className="flex items-center justify-between">

        <h1 className="text-2xl font-bold text-gray-800">Gestión de Tareas y Eventos</h1>
        <button onClick={() => { resetForm(); setShowNewTask(true); }} className="bg-pink-600 text-white px-3 py-1 rounded shadow">Nueva tarea</button>
      </div>


        <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Vista del Proyecto</h2>
          
          {/* Indicador de estado de sincronización */}
          <div className="flex items-center text-sm gap-1">
            {syncStatus.isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-yellow-500" />
            ) : syncStatus.isOnline ? (
              syncStatus.pendingChanges ? 
                <Cloud className="w-4 h-4 text-orange-500" /> : 
                <Cloud className="w-4 h-4 text-green-500" />
            ) : (
              <CloudOff className="w-4 h-4 text-red-500" />
            )}
            
            <span className="text-xs hidden sm:inline">
              {!syncStatus.isOnline ? 'Sin conexión' : 
               syncStatus.isSyncing ? 'Sincronizando...' : 
               syncStatus.pendingChanges ? 'Cambios pendientes' : 'Sincronizado'}
            </span>
          </div>
        </div>
        <div ref={ganttRef} className="w-full overflow-x-hidden" style={{ marginLeft: -listCellWidth, paddingLeft: listCellWidth }}>
          <Gantt 
              tasks={tasksState.map(t => ({
                ...t,
                styles: completed[t.id] ? { backgroundColor: '#d1fae5', progressColor: '#10b981', backgroundSelectedColor: '#a7f3d0' } : {},
                name: (
                  <span className={completed[t.id] ? 'line-through opacity-60 flex items-center' : 'flex items-center'}>
                    <button aria-label="Marcar completada" onClick={e => { e.stopPropagation(); toggleCompleted(t.id); }} className="mr-2 focus:outline-none">
                      {completed[t.id] ? <svg width="18" height="18" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#10b981" strokeWidth="2" fill="#d1fae5"/><path d="M8 12l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> : <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#9ca3af" strokeWidth="2" fill="#f3f4f6"/></svg>}
                    </button>
                    {t.name}
                  </span>
                )
              }))}
              viewMode={ViewMode.Month}
              listCellWidth={listCellWidth}
              columnWidth={columnWidthState}
              locale="es"
              barFill={60}
              barCornerRadius={4}
              barProgressColor="#4f46e5"
              barProgressSelectedColor="#4338ca"
              barBackgroundColor="#a5b4fc"
              barBackgroundSelectedColor="#818cf8"
              todayColor="rgba(252,165,165,0.2)"
              onClick={(task) => {
                // Abrir modal de edición para tareas de largo plazo
                setEditingId(task.id);
                setFormData({
                  title: task.title,
                  desc: task.desc || '',
                  category: task.category || 'OTROS',
                  startDate: task.start.toISOString().slice(0, 10),
                  startTime: task.start.toTimeString().slice(0,5),
                  endDate: task.end.toISOString().slice(0, 10),
                  endTime: task.end.toTimeString().slice(0,5),
                  long: true,
                });
                setShowNewTask(true);
              }}
            />
        </div>
      </div>
      {/* Upcoming tasks list on right remains */}
       <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Calendario</h2>
              <div className="flex space-x-2 mt-2">
                <button onClick={() => setCurrentView('month')} className={`px-3 py-1 text-sm rounded ${currentView==='month'?'bg-pink-500 text-white':'bg-gray-200'}`}>Mes</button>
                <button onClick={() => setCurrentView('week')} className={`px-3 py-1 text-sm rounded ${currentView==='week'?'bg-pink-500 text-white':'bg-gray-200'}`}>Semana</button>
                <button onClick={() => setCurrentView('day')} className={`px-3 py-1 text-sm rounded ${currentView==='day'?'bg-pink-500 text-white':'bg-gray-200'}`}>Día</button>
              </div>
            </div>
            <div className="p-2">
              <Calendar 
                  localizer={localizer}
                  events={safeEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 500 }}
                  defaultView="month"
                  view={currentView}
                  onView={setCurrentView}
                  components={{ event: (eventProps) => {
                    // Añadir icono de completada en la lista de eventos
                    const ev = eventProps.event;
                    return (
                      <span className={completed[ev.id] ? 'line-through opacity-60 flex items-center' : 'flex items-center'}>
                        <button aria-label="Marcar completada" onClick={e => { e.stopPropagation(); toggleCompleted(ev.id); }} className="mr-2 focus:outline-none">
                          {completed[ev.id] ? <svg width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#10b981" strokeWidth="2" fill="#d1fae5"/><path d="M8 12l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> : <svg width="16" height="16" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#9ca3af" strokeWidth="2" fill="#f3f4f6"/></svg>}
                        </button>
                        {ev.title}
                      </span>
                    );
                  }}}
                  eventPropGetter={event => {
                    // Añadir visibilidad atenuada para completadas
                    return completed[event.id] ? { style: { opacity: 0.6, textDecoration: 'line-through' } } : {};
                  }}
                  messages={{ next: 'Siguiente', previous: 'Anterior', today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día', noEventsInRange: 'No hay eventos en este rango.' }}
                  onSelectEvent={(event) => {
                    setEditingId(event.id);
                    setFormData({
                      title: event.title,
                      desc: event.desc || '',
                      category: event.category || 'OTROS',
                      startDate: event.start.toISOString().slice(0, 10),
                      startTime: event.start.toTimeString().slice(0, 5),
                      endDate: event.end.toISOString().slice(0, 10),
                      endTime: event.end.toTimeString().slice(0, 5),
                      long: false,
                    });
                    setShowNewTask(true);
                  }}
                />
            </div>
          </div>
        </div>

        <div className="md:w-1/3">
          <div className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Próximas Tareas</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(categories).map(([key,cat])=>(<div key={key} className="flex items-center text-xs"><div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor:cat.color}} />{cat.name}</div>))}
              </div>
            </div>
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {safeEvents.sort((a,b)=>a.start-b.start).filter(e=>e.start>=new Date()).slice(0,8).map(event=>{
                const cat=categories[event.category]||categories.OTROS;
                return (
                  <div 
                    key={event.id} 
                    className="p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                    onClick={() => { 
                      // Abrir modal para editar la tarea
                      setEditingId(event.id); 
                      setFormData({ 
                        title: event.title, 
                        desc: event.desc || '', 
                        category: event.category || 'OTROS', 
                        startDate: event.start.toISOString().slice(0, 10), 
                        startTime: event.start.toTimeString().slice(0, 5), 
                        endDate: event.end.toISOString().slice(0, 10), 
                        endTime: event.end.toTimeString().slice(0, 5), 
                        long: false 
                      }); 
                      setShowNewTask(true); 
                    }} 
                    style={{borderColor:cat.borderColor,backgroundColor:`${cat.bgColor}40`}}
                  >
                    <div className="flex items-start">
                      <div 
                        className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                        style={{backgroundColor:cat.color}} 
                      />
                      <div className="flex-1">
                        <div className="font-medium flex justify-between">
                          <span>{event.title}</span>
                          <span className="text-xs text-gray-500">
                            {event.start.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}
                          </span>
                        </div>
                        {event.desc && 
                          <div className="text-xs mt-1 text-gray-700">{event.desc}</div>
                        }
                        {event.location && 
                          <div className="text-xs mt-1 flex items-center text-gray-600">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9"/>
                            </svg>
                            {event.location}
                          </div>
                        }
                        {event.contact && 
                          <div className="text-xs mt-1 flex items-center text-gray-600">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2"/>
                            </svg>
                            {event.contact}
                          </div>
                        }
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span 
                        className="text-xs px-2 py-1 rounded-full" 
                        style={{backgroundColor:`${cat.color}20`,color:cat.color}}
                      >
                        {cat.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {event.start.toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'})}
                      </span>
                    </div>
                  </div>
                );
              })}
              {safeEvents.filter(e=>e.start>=new Date()).length===0&&<div className="text-center text-gray-500 py-4">No hay tareas próximas</div>}
            </div>
          </div>
        </div>
      </div>

       {/* Modal Nueva Tarea */}
      {showNewTask && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold">{editingId ? 'Editar tarea' : 'Crear nueva tarea'}</h3>
            <div className="space-y-3">
                <input name="title" onChange={handleChange} value={formData.title} placeholder="Título" className="w-full border rounded px-3 py-1" />
                <textarea name="desc" onChange={handleChange} value={formData.desc} placeholder="Descripción" className="w-full border rounded px-3 py-1" />
                <select name="category" onChange={handleChange} value={formData.category} className="w-full border rounded px-3 py-1">
                  {Object.entries(categories).map(([key,cat])=> (<option key={key} value={key}>{cat.name}</option>))}
                </select>
                <div className="flex space-x-2">
                  <div className="flex-1"><label className="text-xs">Inicio</label><input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full border rounded px-2 py-1" /></div>
                  <div className="flex-1"><label className="text-xs invisible">time</label><input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full border rounded px-2 py-1" /></div>
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1"><label className="text-xs">Fin</label><input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full border rounded px-2 py-1" /></div>
                  <div className="flex-1"><label className="text-xs invisible">time</label><input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="w-full border rounded px-2 py-1" /></div>
                </div>
                <label className="flex items-center space-x-2 text-sm"><input type="checkbox" name="long" checked={formData.long} onChange={e=>setFormData({...formData,long:e.target.checked})} /> <span>Largo plazo (Gantt)</span></label>
              </div>
            <div className="flex justify-end space-x-2">
              {editingId && <button onClick={handleDeleteTask} className="px-4 py-2 rounded bg-red-600 text-white mr-auto">Eliminar</button>}
              <button onClick={() => setShowNewTask(false)} className="px-4 py-2 rounded bg-gray-300">Cancelar</button>
              <button onClick={handleSaveTask} className="px-4 py-2 rounded bg-blue-600 text-white">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
