import React from 'react';
import { categories } from './CalendarComponents';

// Componente para el formulario de tareas
const TaskForm = ({ 
  formData, 
  editingId, 
  handleChange, 
  handleSaveTask, 
  handleDeleteTask, 
  closeModal,
  setFormData 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={closeModal}>
      <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4 shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-semibold">{editingId ? 'Editar tarea' : 'Crear nueva tarea'}</h3>
        <div className="space-y-3">
          <input 
            name="title" 
            onChange={handleChange} 
            value={formData.title} 
            placeholder="Título" 
            className="w-full border rounded px-3 py-1" 
          />
          <textarea 
            name="desc" 
            onChange={handleChange} 
            value={formData.desc} 
            placeholder="Descripción" 
            className="w-full border rounded px-3 py-1" 
          />
          <select 
            name="category" 
            onChange={handleChange} 
            value={formData.category} 
            className="w-full border rounded px-3 py-1"
          >
            {Object.entries(categories).map(([key, cat]) => (
              <option key={key} value={key}>{cat.name}</option>
            ))}
          </select>
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="text-xs">Inicio</label>
              <input 
                type="date" 
                name="startDate" 
                value={formData.startDate} 
                onChange={handleChange} 
                className="w-full border rounded px-2 py-1" 
              />
            </div>
            <div className="flex-1">
              <label className="text-xs invisible">time</label>
              <input 
                type="time" 
                name="startTime" 
                value={formData.startTime} 
                onChange={handleChange} 
                className="w-full border rounded px-2 py-1" 
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="text-xs">Fin</label>
              <input 
                type="date" 
                name="endDate" 
                value={formData.endDate} 
                onChange={handleChange} 
                className="w-full border rounded px-2 py-1" 
              />
            </div>
            <div className="flex-1">
              <label className="text-xs invisible">time</label>
              <input 
                type="time" 
                name="endTime" 
                value={formData.endTime} 
                onChange={handleChange} 
                className="w-full border rounded px-2 py-1" 
              />
            </div>
          </div>
          <label className="flex items-center space-x-2 text-sm">
            <input 
              type="checkbox" 
              name="long" 
              checked={formData.long} 
              onChange={e => setFormData({...formData, long: e.target.checked})} 
            /> 
            <span>Largo plazo (Gantt)</span>
          </label>
        </div>
        <div className="flex justify-end space-x-2">
          {editingId && (
            <button 
              onClick={handleDeleteTask} 
              className="px-4 py-2 rounded bg-red-600 text-white mr-auto"
            >
              Eliminar
            </button>
          )}
          <button 
            onClick={closeModal} 
            className="px-4 py-2 rounded bg-gray-300"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSaveTask} 
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
