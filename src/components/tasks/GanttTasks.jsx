import React from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';

// Datos iniciales para el diagrama Gantt
export const initialTasks = [
  { start: new Date(2025,0,1), end: new Date(2025,2,31), name: 'Buscar lugar de la boda', id: '1', type: 'task', category: 'LUGAR', progress: 20, isDisabled: false, dependencies: [] },
  { start: new Date(2025,3,1), end: new Date(2025,4,15), name: 'Buscar fotógrafo', id: '2', type: 'task', category: 'FOTOGRAFO', progress: 10, isDisabled: false, dependencies: [] },
  { start: new Date(2025,3,1), end: new Date(2025,5,15), name: 'Diseño de invitaciones', id: '3', type: 'task', category: 'PAPELERIA', progress: 0, isDisabled: false, dependencies: [] },
  { start: new Date(2025,5,1), end: new Date(2025,5,30), name: 'Buscar vestido de novia', id: '4', type: 'task', category: 'VESTUARIO', progress: 0, isDisabled: false, dependencies: [] },
  { start: new Date(2025,5,1), end: new Date(2025,5,30), name: 'Buscar catering', id: '5', type: 'task', category: 'COMIDA', progress: 0, isDisabled: false, dependencies: [] },
  { start: new Date(2025,5,15), end: new Date(2025,6,15), name: 'Enviar invitaciones', id: '6', type: 'task', category: 'INVITADOS', progress: 0, isDisabled: false, dependencies: ['3'] },
];

// Componente para el diagrama Gantt
export const GanttChart = ({ 
  tasks = [], 
  onTaskClick,
  viewMode = ViewMode.Month, 
  listCellWidth = '155px',
  columnWidth = 65 
}) => {
  // Garantizar que las tareas estén bien formadas y sin valores vacíos
  // Normalizar fechas y filtrar tareas inválidas
  const normalizeDate = (d) => {
    if (!d) return null;
    if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const cleanTasks = Array.isArray(tasks)
    ? tasks
        .map(t => {
          if (!t) return null;
          const start = normalizeDate(t.start);
          const end = normalizeDate(t.end);
          if (!start || !end) return null;
          return { ...t, start, end };
        })
        .filter(Boolean)
    : [];

  if (cleanTasks.length === 0) {
    // Evitar renderizar el componente de la librería con datos vacíos o corruptos
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No hay tareas válidas para mostrar
      </div>
    );
  }

  return (
    <Gantt
      tasks={cleanTasks}
      viewMode={viewMode}
      listCellWidth={listCellWidth}
      columnWidth={columnWidth}
      locale="es"
      barFill={60}
      barCornerRadius={4}
      barProgressColor="#4f46e5"
      barProgressSelectedColor="#4338ca"
      barBackgroundColor="#a5b4fc"
      barBackgroundSelectedColor="#818cf8"
      todayColor="rgba(252,165,165,0.2)"
      onClick={onTaskClick}
    />
  );
};
