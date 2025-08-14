import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ViewMode } from 'gantt-task-react';
import { subscribeSyncState, getSyncState } from '../../services/SyncService';
import { Cloud, CloudOff, RefreshCw, Download } from 'lucide-react';

// Importar componentes separados
import ErrorBoundary from './ErrorBoundary';
import { downloadAllICS } from './CalendarUtils';
import { localizer, categories, eventStyleGetter, Event } from './CalendarComponents';
import { GanttChart } from './GanttTasks';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import { Calendar } from 'react-big-calendar';

// Importar hooks de Firestore
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { useWedding } from '../../context/WeddingContext';

// Definir un fallback en caso de error
const useFirestoreCollectionSafe = (params) => {
  try {
    return useFirestoreCollection(params);
  } catch (error) {
    console.error('Error al usar useFirestoreCollection:', error);
    return { data: [], isLoading: false, error: error };
  }
}

// Componente principal Tasks refactorizado
export default function Tasks() {
  // Estados - Inicialización segura con manejo de errores

  // Contexto de boda activa
  const { activeWedding } = useWedding();

  // Hooks Firestore para tasks y meetings dentro de la boda
  const {
    data: tasksState,
    addItem: addTaskFS,
    updateItem: updateTaskFS,
    deleteItem: deleteTaskFS,
    loading: tasksLoading,
  } = useFirestoreCollection(`weddings/${activeWedding}/tasks`, []);

  const {
    data: meetingsState,
    addItem: addMeetingFS,
    updateItem: updateMeetingFS,
    deleteItem: deleteMeetingFS,
    loading: meetingsLoading,
  } = useFirestoreCollection(`weddings/${activeWedding}/meetings`, []);

  const {
    data: completedDocs,
    addItem: addCompletedFS,
    updateItem: updateCompletedFS,
    deleteItem: deleteCompletedFS,
    loading: completedLoading,
  } = useFirestoreCollection(`weddings/${activeWedding}/tasksCompleted`, []);

  // --- Ya no se requiere estado local ni carga inicial mediante loadData; los hooks de Firestore se encargan ---
  const dataLoadedRef = useRef(false);

  const [showNewTask, setShowNewTask] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    category: 'OTROS',
    startDate: new Date().toISOString().slice(0, 10),
    startTime: '10:00',
    endDate: new Date().toISOString().slice(0, 10),
    endTime: '11:00',
    long: false,
  });
  
  const [currentView, setCurrentView] = useState('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const [syncStatus, setSyncStatus] = useState(() => {
    try {
      return getSyncState();
    } catch (error) {
      console.error('Error al obtener estado de sincronización:', error);
      return { isOnline: navigator.onLine, isSyncing: false };
    }
  });
  
  const [columnWidthState] = useState(65);
  const listCellWidth = '155px';

  // Manejar eventos de calendario externos
  useEffect(() => {
    const handler = (evt) => {
      const meeting = evt?.detail?.meeting;
      if (meeting && meeting.start && meeting.end && meeting.title) {
        addMeeting(meeting);
      }
    };
    window.addEventListener('lovenda-tasks', handler);
    return () => window.removeEventListener('lovenda-tasks', handler);
  }, [meetingsState]);

  // Función para añadir una reunión
  const addMeeting = useCallback(async (meeting) => {
    await addMeetingFS({
      ...meeting,
      title: meeting.title || 'Nueva reunión',
      start: new Date(meeting.start),
      end: new Date(meeting.end)
    });
  }, [addMeetingFS]);

  // Estado para tareas completadas (inicial vacío, se cargará asíncronamente)
  const [completed, setCompleted] = useState({});

  // Cargar tareas completadas de Firestore/Storage sin bloquear render
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await useFirestoreCollectionSafe(`weddings/${activeWedding}/tasksCompleted`);
        if (isMounted && data && typeof data === 'object' && !Array.isArray(data)) {
          setCompleted(data);
        }
      } catch (error) {
        console.error('Error cargando tasksCompleted:', error);
      }
    })();
    return () => { isMounted = false; };
  }, [activeWedding]);

  // Suscribirse al estado de sincronización
  useEffect(() => {
    return subscribeSyncState(setSyncStatus);
  }, []);

  // Guardar cambios cuando cambie el estado (evitando sobrescribir con datos vacíos al inicio)
  useEffect(() => {
    if (dataLoadedRef.current) {
      // No es necesario guardar cambios ya que se utiliza Firestore
    }
  }, [tasksState, activeWedding]);

  useEffect(() => {
    if (dataLoadedRef.current) {
      // No es necesario guardar cambios ya que se utiliza Firestore
    }
  }, [meetingsState, activeWedding]);

  useEffect(() => {
    if (dataLoadedRef.current) {
      // No es necesario guardar cambios ya que se utiliza Firestore
    }
  }, [completed, activeWedding]);

  // Sugerencia automática de categoría
  const sugerirCategoria = (titulo, descripcion) => {
    const texto = (titulo + ' ' + (descripcion || '')).toLowerCase();
    if (texto.includes('lugar') || texto.includes('venue') || texto.includes('salon') || texto.includes('espacio')) {
      return 'LUGAR';
    } else if (texto.includes('invita') || texto.includes('guest') || texto.includes('persona')) {
      return 'INVITADOS';
    } else if (texto.includes('comida') || texto.includes('catering') || texto.includes('menu') || texto.includes('bebida')) {
      return 'COMIDA';
    } else if (texto.includes('decora') || texto.includes('adorno') || texto.includes('flor')) {
      return 'DECORACION';
    } else if (texto.includes('invitacion') || texto.includes('papel') || texto.includes('tarjeta')) {
      return 'PAPELERIA';
    } else if (texto.includes('música') || texto.includes('music') || texto.includes('dj') || texto.includes('band')) {
      return 'MUSICA';
    } else if (texto.includes('foto') || texto.includes('video') || texto.includes('grafia')) {
      return 'FOTOGRAFO';
    } else if (texto.includes('vestido') || texto.includes('traje') || texto.includes('ropa')) {
      return 'VESTUARIO';
    }
    return 'OTROS';
  };

  // Manejador de cambios en el formulario
  // Maneja los cambios del formulario y aplica reglas adicionales de negocio
  const handleChange = (e) => {
    const field = e.target.name;
    const rawValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

    setFormData((prevForm) => {
      let updated = { ...prevForm, [field]: rawValue };

      // 1. Sugerir categoría si se cambia el título y la categoría es OTROS
      if (field === 'title' && (!prevForm.category || prevForm.category === 'OTROS')) {
        const sugerida = sugerirCategoria(rawValue, prevForm.desc);
        if (sugerida !== 'OTROS') {
          updated.category = sugerida;
        }
      }

      // 2. Si cambia la fecha de inicio, asegurarnos de que la fecha de fin no sea anterior
      if (field === 'startDate') {
        const start = new Date(rawValue);
        const end = new Date(prevForm.endDate);
        if (!prevForm.endDate || end < start) {
          updated.endDate = rawValue; // Ajustar fin al mismo día por defecto
        }
      }

      // 3. Si cambia la fecha de fin y resulta ser anterior a la de inicio, corrige inicio
      if (field === 'endDate') {
        const start = new Date(prevForm.startDate);
        const end = new Date(rawValue);
        if (end < start) {
          updated.startDate = rawValue;
        }
      }

      return updated;
    });
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      title: '', desc: '', category: 'OTROS', 
      startDate: new Date().toISOString().slice(0, 10), 
      startTime: '10:00', endDate: new Date().toISOString().slice(0, 10), 
      endTime: '11:00', long: false
    });
  };

  // Cerrar modal
  const closeModal = () => {
    setShowNewTask(false);
    setEditingId(null);
    resetForm();
  };
  
  // Asignación automática de categoría con IA
  const asignarCategoriaConIA = async (titulo, descripcion) => {
    try {
      const texto = (titulo + ' ' + (descripcion || '')).toLowerCase();
      // Primero intentamos con reglas simples
      const sugerida = sugerirCategoria(titulo, descripcion);
      if (sugerida !== 'OTROS') return sugerida;
      
      // Si las reglas simples no funcionan, usamos IA
      const palabrasClave = {
        LUGAR: ['venue', 'location', 'lugar', 'sitio', 'espacio', 'salón', 'jardín', 'terraza'],
        INVITADOS: ['guests', 'invitados', 'personas', 'asistentes', 'confirmaciones', 'lista', 'rsvp'],
        COMIDA: ['catering', 'food', 'comida', 'bebida', 'menu', 'bocadillos', 'pastel', 'torta'],
        DECORACION: ['decoración', 'flores', 'arreglos', 'centros de mesa', 'iluminación', 'ambientación'],
        PAPELERIA: ['invitaciones', 'papelería', 'save the date', 'tarjetas', 'programa', 'seating plan'],
        MUSICA: ['música', 'dj', 'banda', 'playlist', 'sonido', 'baile', 'entretenimiento'],
        FOTOGRAFO: ['fotografía', 'video', 'recuerdos', 'álbum', 'sesión'],
        VESTUARIO: ['vestido', 'traje', 'accesorios', 'zapatos', 'maquillaje', 'peluquería'],
      };
      
      // Contar coincidencias por categoría
      const scores = {};
      Object.entries(palabrasClave).forEach(([cat, palabras]) => {
        scores[cat] = palabras.filter(palabra => texto.includes(palabra)).length;
      });
      
      // Encontrar la categoría con mayor puntuación
      let maxScore = 0;
      let maxCat = 'OTROS';
      Object.entries(scores).forEach(([cat, score]) => {
        if (score > maxScore) {
          maxScore = score;
          maxCat = cat;
        }
      });
      
      return maxScore > 0 ? maxCat : 'OTROS';
    } catch (error) {
      console.error('Error al asignar categoría:', error);
      return 'OTROS';
    }
  };

  // Guardar una tarea en la subcolección de la boda
  const handleSaveTask = async () => {
    try {
      // Validar formulario básico
      if (!formData.title.trim()) {
        alert('Por favor ingresa un título');
        return;
      }
      
      if (!formData.startDate) {
        alert('Por favor selecciona una fecha de inicio');
        return;
      }
      
      if (!formData.endDate) {
        alert('Por favor selecciona una fecha de fin');
        return;
      }
      
      // Construir fechas completas
      const startDateStr = formData.startDate;
      const startTimeStr = formData.startTime || '00:00';
      const endDateStr = formData.endDate;
      const endTimeStr = formData.endTime || '23:59';
      
      const startDate = new Date(`${startDateStr}T${startTimeStr}`);
      const endDate = new Date(`${endDateStr}T${endTimeStr}`);
      
      // Validar fechas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        alert('Fechas no válidas');
        return;
      }
      
      if (endDate < startDate) {
        alert('La fecha de fin debe ser posterior a la de inicio');
        return;
      }
      
      // Asignar categoría con IA si no se especificó
      let category = formData.category;
      if (category === 'OTROS') {
        category = await asignarCategoriaConIA(formData.title, formData.desc);
      }
      
      // Crear objeto de tarea/evento
      const taskData = {
        id: editingId || `task-${Date.now()}`,
        title: formData.title,
        desc: formData.desc,
        start: startDate,
        end: endDate,
        category: category
      };
      
      // Añadir/actualizar según sea una tarea de largo plazo o una reunión
      if (formData.long) {
        // Para el diagrama Gantt
        const ganttTask = {
          ...taskData,
          name: taskData.title,
          progress: 0,
          type: 'task',
          isDisabled: false,
          dependencies: []
        };
        
        if (editingId) {
          await updateTaskFS(editingId, ganttTask);
        } else {
          await addTaskFS(ganttTask);
        }
      } else {
        // Para el calendario
        if (editingId) {
          // Buscar primero en tareas Gantt
          if (tasksState.some(t => t.id === editingId)) {
            await updateTaskFS(editingId, taskData);
          } else {
            await updateMeetingFS(editingId, taskData);
          }
        } else {
          if (taskData.long) {
            await addMeetingFS(taskData);
          } else {
            await addTaskFS(taskData);
          }
        }
      }
      
      // Cerrar modal y limpiar
      closeModal();
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      alert('Hubo un error al guardar la tarea');
    }
  };

  // Eliminar una tarea
  const handleDeleteTask = () => {
    if (confirm('¿Estás seguro de querer eliminar esta tarea?')) {
      // Buscar en ambas colecciones - con verificación de tipo
      if (tasksState.some(t => t.id === editingId)) {
        deleteTaskFS(editingId);
      } else {
        deleteMeetingFS(editingId);
      }
      closeModal();
    }
  };

  // Marcar tarea como completada
  const toggleCompleted = id => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Procesar eventos para despliegue seguro - asegurando que tasksState sea un array
  const allEvents = [
    ...(Array.isArray(tasksState) ? tasksState.map(t => ({ ...t, title: t.name || t.title })) : []),
    ...(Array.isArray(meetingsState) ? meetingsState : [])
  ];

  // Función auxiliar para validar y normalizar fechas
  const validateAndNormalizeDate = (date) => {
    if (!date) return null;
    
    let validDate = date;
    if (!(date instanceof Date)) {
      try {
        validDate = new Date(date);
      } catch (e) {
        return null;
      }
    }
    
    return isNaN(validDate.getTime()) ? null : validDate;
  };

  // Asegurar que todos los eventos tengan los campos necesarios
  const safeEvents = allEvents
    .filter(event => event !== null && event !== undefined)
    .map(event => {
      // Verificar que start y end existan
      if (!event.start || !event.end) {
        return null;
      }
      
      // Asegurar que start y end sean objetos Date válidos
      const start = validateAndNormalizeDate(event.start);
      const end = validateAndNormalizeDate(event.end);
      
      // Si alguna fecha no es válida, descartar evento
      if (!start || !end) {
        return null;
      }
      
      // Devolver evento normalizado
      return {
        ...event,
        start,
        end,
        title: event.title || event.name || "Sin título"
      };
    })
    .filter(Boolean); // Eliminar eventos nulos

    // Ordenar eventos por fecha para uso posterior (listas, etc.)
    const sortedTasks = [...safeEvents].sort((a, b) => a.start - b.start);

  // Filtro específico para tareas del componente Gantt
  const taskIdSet = new Set(Array.isArray(tasksState) ? tasksState.filter(Boolean).map(t => t?.id).filter(Boolean) : []);

  const safeGanttTasks = Array.isArray(tasksState) 
    ? tasksState
        .filter(task => task !== null && task !== undefined)
        .map(task => {
          // Verificar que start y end existan
          if (!task.start || !task.end) {
            return null;
          }
          
          // Validar fechas
          const start = validateAndNormalizeDate(task.start);
          const end = validateAndNormalizeDate(task.end);
          
          // Si alguna fecha no es válida, descartar tarea
          if (!start || !end) {
            return null;
          }
          
          // Sanear dependencias para que solo contengan IDs de tareas existentes
          const deps = Array.isArray(task.dependencies)
            ? task.dependencies.filter(dep => taskIdSet.has(dep))
            : [];

          // Devolver tarea normalizada para formato Gantt
          return {
            ...task,
            start,
            end,
            name: task.name || task.title || "Sin título",
            type: task.type || "task",
            id: task.id,
            progress: task.progress || 0,
            isDisabled: task.isDisabled || false,
            dependencies: deps
          };
        })
        .filter(Boolean) // Eliminar tareas nulas
    : [];

  // Cálculo de progreso - asegurando que los estados sean arrays
  const allTaskIds = [
    ...(Array.isArray(tasksState) ? tasksState.map(t => t.id) : []),
    ...(Array.isArray(meetingsState) ? meetingsState.map(m => m.id) : [])
  ];
  const totalTasks = allTaskIds.length;
  const completedCount = allTaskIds.filter(id => completed[id]).length;
  const percent = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);
  let barColor = 'bg-red-500';
  if (percent >= 80) barColor = 'bg-green-500';
  else if (percent >= 40) barColor = 'bg-blue-500';

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 pb-32">
      <style>{` 
        ._1nBOt > *:nth-child(n+2),
        ._34SS0 > *:nth-child(n+2) {
          display: none !important;
        }
        /* Se eliminan las reglas de flex personalizadas que afectaban al grid del calendario */
      `}</style>
      
      <div className="flex items-center justify-between">
        <h1 className="page-title">Gestión de Tareas</h1>
        <div className="flex items-center space-x-4">
          {/* Indicador de sincronización */}
          <div className="flex items-center">
            {syncStatus.isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-yellow-500 mr-2" />
            ) : syncStatus.isOnline ? (
              syncStatus.pendingChanges ? (
                <Cloud className="w-4 h-4 text-orange-500 mr-2" />
              ) : (
                <Cloud className="w-4 h-4 text-green-500 mr-2" />
              )
            ) : (
              <CloudOff className="w-4 h-4 text-red-500 mr-2" />
            )}
            <div className="text-sm text-gray-500">
              {syncStatus.isOnline
                ? syncStatus.isSyncing
                  ? "Sincronizando..."
                  : syncStatus.pendingChanges
                  ? "Cambios pendientes"
                  : "Sincronizado"
                : "Sin conexión"}
            </div>
          </div>
          {/* Botones de acción */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                resetForm();
                setShowNewTask(true);
              }}
              className="bg-pink-500 text-white px-4 py-2 rounded-md transition-colors hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
            >
              Nueva Tarea
            </button>
            <button
              onClick={() => downloadAllICS(safeEvents)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Vincular Calendario
            </button>
          </div>
        </div>
      </div>
      
      {/* Componente para el diagrama Gantt */}
      <div className="bg-[var(--color-surface)] rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Tareas a Largo Plazo</h2>
        <div className="h-96 overflow-x-auto overflow-y-hidden mb-4 border border-gray-100 rounded-lg min-w-[600px]">
          {safeGanttTasks && safeGanttTasks.length > 0 ? (
            <GanttChart 
              tasks={safeGanttTasks} 
              viewMode={ViewMode.Month}
              listCellWidth={listCellWidth}
              columnWidth={columnWidthState}
              onTaskClick={(task) => {
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
          ) : (
            <div className="flex items-center justify-center h-full text-[color:var(--color-text)]/70">
              No hay tareas de largo plazo que mostrar
            </div>
          )}
        </div>
        <div className="mb-4">
          <div className="flex justify-between mb-1 text-sm">
            <span>Progreso general:</span>
            <span className="font-medium">{percent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-[color:var(--color-surface)]/50 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${barColor}`} 
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Contenedor responsivo para Calendario y Lista */}
      <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendario de eventos */}
      <div className="flex-1 bg-[var(--color-surface)] rounded-xl shadow-md p-6 mt-4 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Calendario de Eventos</h2>
        
        {/* Controles de navegación del calendario */}
        <div className="flex justify-between items-center mb-4">
          <div className="space-x-2">
            <button 
              className={`px-3 py-1 rounded ${currentView === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setCurrentView('month')}
            >
              Mes
            </button>
            <button 
              className={`px-3 py-1 rounded ${currentView === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setCurrentView('week')}
            >
              Semana
            </button>
            <button 
              className={`px-3 py-1 rounded ${currentView === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setCurrentView('day')}
            >
              Día
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => {
                const newDate = new Date(calendarDate);
                if (currentView === 'month') {
                  newDate.setMonth(newDate.getMonth() - 1);
                } else if (currentView === 'week') {
                  newDate.setDate(newDate.getDate() - 7);
                } else {
                  newDate.setDate(newDate.getDate() - 1);
                }
                setCalendarDate(newDate);
              }}
            >
              &#8592; Anterior
            </button>
            <button 
              className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200"
              onClick={() => setCalendarDate(new Date())}
            >
              Hoy
            </button>
            <button 
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => {
                const newDate = new Date(calendarDate);
                if (currentView === 'month') {
                  newDate.setMonth(newDate.getMonth() + 1);
                } else if (currentView === 'week') {
                  newDate.setDate(newDate.getDate() + 7);
                } else {
                  newDate.setDate(newDate.getDate() + 1);
                }
                setCalendarDate(newDate);
              }}
            >
              Siguiente &#8594;
            </button>
          </div>
        </div>
        
        
        <div className="rbc-calendar-container">
          {/* Componente Calendar con protección de errores */}
          <ErrorBoundary
            fallback={(
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Error al cargar el calendario</h3>
                  <p className="text-gray-600">Hubo un problema al cargar el calendario. Puedes gestionar tus eventos a través de la lista inferior.</p>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto p-2">
                  {safeEvents && safeEvents.length > 0 ? (
                    sortedTasks
                      .map(event => {
                        const eventId = event.id || '';
                        const eventTitle = event.title || event.name || "Evento sin título";
                        const eventStart = event.start instanceof Date ? event.start : new Date();
                        const formattedDate = eventStart.toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        
                        return (
                          <div 
                            key={eventId} 
                            className="flex items-center p-3 border rounded-md hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => {
                              setEditingId(eventId);
                              setFormData({
                                title: eventTitle,
                                desc: event.desc || '',
                                category: event.category || 'OTROS',
                                startDate: eventStart.toISOString().slice(0, 10),
                                startTime: eventStart.toTimeString().slice(0, 5),
                                endDate: event.end instanceof Date ? event.end.toISOString().slice(0, 10) : eventStart.toISOString().slice(0, 10),
                                endTime: event.end instanceof Date ? event.end.toTimeString().slice(0, 5) : '',
                                long: false,
                              });
                              setShowNewTask(true);
                            }}
                          >
                            <div className="mr-3">
                              <input 
                                type="checkbox" 
                                checked={completed[eventId] || false} 
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleCompleted(eventId);
                                }} 
                              />
                            </div>
                            <div className="flex-1">
                              <div className={`font-medium ${completed[eventId] ? 'line-through text-gray-400' : ''}`}>{eventTitle}</div>
                              <div className="text-xs text-gray-500">{formattedDate}</div>
                            </div>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categories[event.category || 'OTROS']?.color || '#ccc' }} />
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center text-gray-500">No hay tareas disponibles</div>
                  )}
                </div>
              </div>
            )}
          >
            <div className="calendar-container" style={{ height: '500px' }}>
              <style>{`
                /* Estilos para el contenedor del calendario */
                .calendar-container .rbc-calendar {
                  width: 100%;
                  height: 100%;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                }
                
                /* Ocultamos la barra de herramientas nativa ya que usamos nuestros botones */
                .calendar-container .rbc-toolbar {
                  display: none;
                }
                
                /* Estilos para la vista de mes */
                .calendar-container .rbc-month-view {
                  flex: 1;
                  height: 100%;
                  min-height: 400px;
                  display: flex;
                  flex-direction: column;
                  flex: 1 0 0;
                }
                
                /* Cabecera del mes */
                .calendar-container .rbc-month-header {
                  display: flex;
                  flex-direction: row;
                  font-weight: bold;
                  background-color: #f8f9fa;
                  border-bottom: 1px solid #ddd;
                }
                
                .calendar-container .rbc-header {
                  padding: 8px 3px;
                  text-align: center;
                  border-bottom: 1px solid #ddd;
                  flex: 1 0;
                }
                
                /* Filas del mes */
                .calendar-container .rbc-month-row {
                  display: flex;
                  flex-direction: column;
                  overflow: hidden;
                  flex: 1;
                  min-height: 0;
                }
                
                /* Celdas de días */
                .calendar-container .rbc-day-bg {
                  flex: 1 0;
                  border-bottom: 1px solid #eee;
                  border-left: 1px solid #eee;
                  cursor: pointer;
                }
                
                .calendar-container .rbc-date-cell {
                  padding: 4px 5px 0 0;
                  text-align: right;
                  font-size: 0.9em;
                }
                
                .calendar-container .rbc-row-segment {
                  padding: 0 1px 1px 1px;
                }
                
                /* Eventos en el calendario */
                .calendar-container .rbc-event {
                  border-radius: 3px;
                  font-size: 0.85em;
                  padding: 2px 5px;
                  margin: 1px 2px;
                }

                /* Estilos para corregir la altura de las filas */
                .calendar-container .rbc-month-view .rbc-month-row {
                  height: 100% !important;
                  display: flex !important;
                  flex: 1 1 0 !important;
                  flex-flow: column !important;
                }
                
                .calendar-container .rbc-row-content {
                  flex: 1 1 0;
                  display: flex;
                  flex-direction: column;
                  width: 100%;
                }
                
                .calendar-container .rbc-row {
                  display: flex;
                  flex: 1 1 0;
                  width: 100%;
                }
              `}</style>
              <Calendar
                localizer={localizer}
                events={safeEvents}
                date={calendarDate}
                onNavigate={date => setCalendarDate(date)}
                startAccessor="start"
                endAccessor="end"
                views={{
                  month: true,
                  week: true,
                  day: true
                }}
                view={currentView}
                onView={setCurrentView}
                toolbar={false}
                popup={true}
                eventPropGetter={eventStyleGetter}
                components={{ event: Event }}
                onDoubleClickEvent={(event) => {
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
                messages={{
                  next: "Siguiente",
                  previous: "Anterior",
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día"
                }}
              />
            </div>
          </ErrorBoundary>
        </div>

      </div>

      {false && (
        <div className="w-full">
          <div className="calendar-container" style={{ height: '500px' }}>
            <style>{`
              /* Estilos para el contenedor del calendario */
              .calendar-container .rbc-calendar {
                width: 100%;
                height: 100%;
                border: 1px solid #ddd;
                border-radius: 4px;
              }
              
              /* Ocultamos la barra de herramientas nativa ya que usamos nuestros botones */
              .calendar-container .rbc-toolbar {
                display: none;
              }
              
              /* Estilos para la vista de mes */
              .calendar-container .rbc-month-view {
                flex: 1;
                height: 100%;
                min-height: 400px;
                display: flex;
                flex-direction: column;
                flex: 1 0 0;
              }
              
              /* Cabecera del mes */
              .calendar-container .rbc-month-header {
                display: flex;
                flex-direction: row;
                font-weight: bold;
                background-color: #f8f9fa;
                border-bottom: 1px solid #ddd;
              }
              
              .calendar-container .rbc-header {
                padding: 8px 3px;
                text-align: center;
                border-bottom: 1px solid #ddd;
                flex: 1 0;
              }
              
              /* Filas del mes */
              .calendar-container .rbc-month-row {
                display: flex;
                flex-direction: column;
                overflow: hidden;
                flex: 1;
                min-height: 0;
              }
              
              /* Celdas de días */
              .calendar-container .rbc-day-bg {
                flex: 1 0;
                border-bottom: 1px solid #eee;
                border-left: 1px solid #eee;
                cursor: pointer;
              }
              
              .calendar-container .rbc-date-cell {
                padding: 4px 5px 0 0;
                text-align: right;
                font-size: 0.9em;
              }
              
              .calendar-container .rbc-row-segment {
                padding: 0 1px 1px 1px;
              }
              
              /* Eventos en el calendario */
              .calendar-container .rbc-event {
                border-radius: 3px;
                font-size: 0.85em;
                padding: 2px 5px;
                margin: 1px 2px;
              }

              /* Estilos para corregir la altura de las filas */
              .calendar-container .rbc-month-view .rbc-month-row {
                height: 100% !important;
                display: flex !important;
                flex: 1 1 0 !important;
                flex-flow: column !important;
              }
              
              .calendar-container .rbc-row-content {
                flex: 1 1 0;
                display: flex;
                flex-direction: column;
                width: 100%;
              }
              
              .calendar-container .rbc-row {
                display: flex;
                flex: 1 1 0;
                width: 100%;
              }
            `}</style>
            <Calendar
              localizer={localizer}
              events={safeEvents}
              date={calendarDate}
              onNavigate={date => setCalendarDate(date)}
              startAccessor="start"
              endAccessor="end"
              views={{
                month: true,
                week: true,
                day: true
              }}
              view={currentView}
              onView={setCurrentView}
              toolbar={false}
              popup={true}
              eventPropGetter={eventStyleGetter}
              components={{ event: Event }}
              onDoubleClickEvent={(event) => {
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
              messages={{
                next: "Siguiente",
                previous: "Anterior",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día"
              }}
            />
          </div>
        </div>
      )}
       <div className="bg-white rounded-xl shadow-md p-6 mt-4 lg:mt-0 lg:w-80 flex-none transition-all hover:shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Listado de Tareas</h2>
        <div className="w-full">
          <TaskList 
            tasks={safeEvents} 
            onTaskClick={(event) => {
              setEditingId(event.id);
              setFormData({
                title: event.title,
                desc: event.desc || '',
                category: event.category || 'OTROS',
                startDate: event.start.toISOString().slice(0, 10),
                startTime: event.start.toTimeString().slice(0,5),
                endDate: event.end.toISOString().slice(0, 10),
                endTime: event.end.toTimeString().slice(0,5),
                long: false
              });
              setShowNewTask(true);
            }}
          />
        </div>
      </div>

      {/* Modal para nueva tarea */}
      {showNewTask && (
        <TaskForm 
          formData={formData} 
          editingId={editingId} 
          handleChange={handleChange}
          handleSaveTask={handleSaveTask}
          handleDeleteTask={handleDeleteTask}
          closeModal={closeModal}
          setFormData={setFormData}
        />
      )}

      </div>
     </div>
   );
}
