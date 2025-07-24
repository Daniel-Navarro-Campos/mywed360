import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/PageWrapper';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui';
import { Clock, Calendar, CheckCircle, Circle, Trash2, PenLine as Edit2, Save, Plus, AlertTriangle } from 'lucide-react';
import { db } from '../../firebaseConfig';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';

const Checklist = () => {
  const { currentUser } = useAuth();
  const fallbackUserId = 'user123';
  const userId = currentUser?.uid || fallbackUserId;
  
  // Estados para los dos tipos de checklist
  const [preBodaTasks, setPreBodaTasks] = useState([]);
  const [diaBodaTasks, setDiaBodaTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para nuevas tareas
  const [newTask, setNewTask] = useState({
    tipo: 'preBoda',
    texto: '',
    categoria: 'general',
    prioridad: 'normal',
    fecha: '',
    notas: ''
  });
  
  // Estado para edición
  const [editingTask, setEditingTask] = useState(null);
  
  // Categorías disponibles para tareas
  const CATEGORIAS = [
    { id: 'general', nombre: 'General' },
    { id: 'reservas', nombre: 'Reservas' },
    { id: 'invitados', nombre: 'Invitados' },
    { id: 'moda', nombre: 'Moda y Belleza' },
    { id: 'legal', nombre: 'Legal y Documentos' },
    { id: 'ceremonia', nombre: 'Ceremonia' },
    { id: 'recepcion', nombre: 'Recepción' },
    { id: 'detalles', nombre: 'Detalles' },
    { id: 'luna', nombre: 'Luna de Miel' },
    { id: 'otros', nombre: 'Otros' }
  ];
  
  // Prioridades disponibles para tareas
  const PRIORIDADES = [
    { id: 'alta', nombre: 'Alta', color: 'bg-red-100 text-red-800' },
    { id: 'normal', nombre: 'Normal', color: 'bg-blue-100 text-blue-800' },
    { id: 'baja', nombre: 'Baja', color: 'bg-green-100 text-green-800' }
  ];

  // Cargar tareas al iniciar
  useEffect(() => {
    cargarTareas();
  }, []);

  // Función para cargar las tareas desde Firestore
  const cargarTareas = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'tareas'),
        where('userId', '==', userId),
        orderBy('fecha', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const preBoda = [];
      const diaBoda = [];

      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        if (data.tipo === 'preBoda') {
          preBoda.push(data);
        } else {
          diaBoda.push(data);
        }
      });

      setPreBodaTasks(preBoda);
      setDiaBodaTasks(diaBoda);
      setError(null);
    } catch (err) {
      console.error('Error cargando tareas:', err);
      setError('No se pudieron cargar las tareas. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Guardar una nueva tarea
  const guardarTarea = async () => {
    if (!newTask.texto.trim()) {
      return;
    }

    try {
      setLoading(true);
      const taskData = {
        ...newTask,
        userId,
        completada: false,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'tareas'), taskData);
      
      // Resetear el formulario
      setNewTask({
        tipo: newTask.tipo, // Mantener el tipo seleccionado
        texto: '',
        categoria: 'general',
        prioridad: 'normal',
        fecha: '',
        notas: ''
      });
      
      await cargarTareas(); // Recargar tareas
    } catch (err) {
      console.error('Error guardando tarea:', err);
      setError('No se pudo guardar la tarea. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado de tarea (completar/descompletar)
  const toggleCompletada = async (id, completada) => {
    try {
      await updateDoc(doc(db, 'tareas', id), {
        completada: !completada
      });
      await cargarTareas();
    } catch (err) {
      console.error('Error actualizando tarea:', err);
      setError('No se pudo actualizar la tarea. Por favor, inténtalo de nuevo.');
    }
  };

  // Eliminar una tarea
  const eliminarTarea = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'tareas', id));
      await cargarTareas();
    } catch (err) {
      console.error('Error eliminando tarea:', err);
      setError('No se pudo eliminar la tarea. Por favor, inténtalo de nuevo.');
    }
  };

  // Configurar tarea para edición
  const editarTarea = (task) => {
    setEditingTask(task);
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setEditingTask(null);
  };

  // Guardar tarea editada
  const guardarEdicion = async () => {
    try {
      await updateDoc(doc(db, 'tareas', editingTask.id), {
        texto: editingTask.texto,
        categoria: editingTask.categoria,
        prioridad: editingTask.prioridad,
        fecha: editingTask.fecha,
        notas: editingTask.notas,
        updatedAt: new Date().toISOString()
      });
      await cargarTareas();
      setEditingTask(null); // Salir del modo edición
    } catch (err) {
      console.error('Error actualizando tarea:', err);
      setError('No se pudo actualizar la tarea. Por favor, inténtalo de nuevo.');
    }
  };

  // Renderizar una tarea
  const renderizarTarea = (task) => {
    const estaEditando = editingTask && editingTask.id === task.id;
    const categoria = CATEGORIAS.find(c => c.id === task.categoria);
    const prioridad = PRIORIDADES.find(p => p.id === task.prioridad);
    
    if (estaEditando) {
      return (
        <div key={task.id} className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="space-y-3">
            {/* Campos de edición */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarea</label>
              <input 
                type="text" 
                value={editingTask.texto} 
                onChange={(e) => setEditingTask({...editingTask, texto: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select 
                  value={editingTask.categoria}
                  onChange={(e) => setEditingTask({...editingTask, categoria: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select 
                  value={editingTask.prioridad}
                  onChange={(e) => setEditingTask({...editingTask, prioridad: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  {PRIORIDADES.map(pri => (
                    <option key={pri.id} value={pri.id}>{pri.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
              <input 
                type="date" 
                value={editingTask.fecha || ''}
                onChange={(e) => setEditingTask({...editingTask, fecha: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea 
                value={editingTask.notas || ''}
                onChange={(e) => setEditingTask({...editingTask, notas: e.target.value})}
                className="w-full p-2 border rounded"
                rows="2"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                onClick={cancelarEdicion}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Cancelar
              </Button>
              <Button 
                onClick={guardarEdicion}
                leftIcon={<Save size={16} />}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div 
        key={task.id} 
        className={`p-3 border rounded-lg ${task.completada ? 'bg-gray-50' : 'bg-white'} shadow-sm`}
      >
        <div className="flex items-start gap-2">
          <button 
            onClick={() => toggleCompletada(task.id, task.completada)}
            className={`mt-1 flex-shrink-0 ${task.completada ? 'text-green-600' : 'text-gray-400 hover:text-blue-500'}`}
          >
            {task.completada ? <CheckCircle size={18} /> : <Circle size={18} />}
          </button>
          
          <div className="flex-1">
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex-1">
                <p className={`${task.completada ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                  {task.texto}
                </p>
                
                {/* Etiquetas de categoría y prioridad */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {categoria && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                      {categoria.nombre}
                    </span>
                  )}
                  
                  {prioridad && (
                    <span className={`px-2 py-0.5 ${prioridad.color} rounded text-xs`}>
                      {prioridad.nombre}
                    </span>
                  )}
                </div>
                
                {/* Fecha límite */}
                {task.fecha && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Calendar size={14} />
                    <span>
                      {new Date(task.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                
                {/* Notas (opcional) */}
                {task.notas && (
                  <p className="text-xs text-gray-600 mt-2 italic">
                    {task.notas}
                  </p>
                )}
              </div>
              
              {/* Acciones */}
              <div className="flex space-x-1">
                <button 
                  onClick={() => editarTarea(task)}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => eliminarTarea(task.id)}
                  className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente para agregar nueva tarea
  const NuevaTareaForm = () => (
    <Card className="p-5 space-y-4">
      <h3 className="font-medium flex items-center gap-1">
        <Plus size={18} /> Añadir nueva tarea
      </h3>
      
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input 
              type="text" 
              value={newTask.texto} 
              onChange={(e) => setNewTask({...newTask, texto: e.target.value})}
              placeholder="Ej: Confirmar menú con el catering"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de lista</label>
            <select 
              value={newTask.tipo}
              onChange={(e) => setNewTask({...newTask, tipo: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="preBoda">Antes de la boda</option>
              <option value="diaBoda">Día de la boda</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select 
              value={newTask.categoria}
              onChange={(e) => setNewTask({...newTask, categoria: e.target.value})}
              className="w-full p-2 border rounded"
            >
              {CATEGORIAS.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <select 
              value={newTask.prioridad}
              onChange={(e) => setNewTask({...newTask, prioridad: e.target.value})}
              className="w-full p-2 border rounded"
            >
              {PRIORIDADES.map(pri => (
                <option key={pri.id} value={pri.id}>{pri.nombre}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
            <input 
              type="date" 
              value={newTask.fecha}
              onChange={(e) => setNewTask({...newTask, fecha: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <textarea 
            value={newTask.notas}
            onChange={(e) => setNewTask({...newTask, notas: e.target.value})}
            placeholder="Información adicional o detalles"
            className="w-full p-2 border rounded"
            rows="2"
          ></textarea>
        </div>
        
        <div className="pt-2">
          <Button 
            onClick={guardarTarea}
            disabled={!newTask.texto.trim() || loading}
            className="w-full md:w-auto"
          >
            {loading ? 'Guardando...' : 'Añadir tarea'}
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <PageWrapper title="Checklist de Boda">
      <div className="space-y-6">
        <p className="text-gray-600">Organiza y gestiona todas las tareas pendientes para tu día especial.</p>
        
        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2 text-red-800 border border-red-200">
            <AlertTriangle size={18} />
            <p>{error}</p>
          </div>
        )}
        
        {/* Formulario para nueva tarea */}
        <NuevaTareaForm />
        
        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <div className="font-medium text-lg">{preBodaTasks.length}</div>
            <div className="text-xs text-gray-600">Tareas pre-boda</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="font-medium text-lg">
              {preBodaTasks.filter(task => task.completada).length}
            </div>
            <div className="text-xs text-gray-600">Completadas</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="font-medium text-lg">{diaBodaTasks.length}</div>
            <div className="text-xs text-gray-600">Tareas día de boda</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="font-medium text-lg">
              {diaBodaTasks.filter(task => task.completada).length}
            </div>
            <div className="text-xs text-gray-600">Completadas</div>
          </Card>
        </div>
        
        {/* Sección de Pre-Boda */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium flex items-center gap-2">
            <Calendar size={20} />
            Antes de la boda
          </h2>
          
          {loading ? (
            <p className="text-gray-500">Cargando tareas...</p>
          ) : preBodaTasks.length > 0 ? (
            <div className="space-y-3">
              {preBodaTasks.map(task => renderizarTarea(task))}
            </div>
          ) : (
            <Card className="p-5 text-center">
              <p className="text-gray-500">No hay tareas para antes de la boda.</p>
              <p className="text-sm text-gray-400">Añade una nueva tarea usando el formulario.</p>
            </Card>
          )}
        </div>
        
        {/* Sección de Día de la Boda */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium flex items-center gap-2">
            <Clock size={20} />
            Día de la boda
          </h2>
          
          {loading ? (
            <p className="text-gray-500">Cargando tareas...</p>
          ) : diaBodaTasks.length > 0 ? (
            <div className="space-y-3">
              {diaBodaTasks.map(task => renderizarTarea(task))}
            </div>
          ) : (
            <Card className="p-5 text-center">
              <p className="text-gray-500">No hay tareas para el día de la boda.</p>
              <p className="text-sm text-gray-400">Añade una nueva tarea usando el formulario.</p>
            </Card>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Checklist;
