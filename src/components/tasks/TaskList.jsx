import React from 'react';
import { categories } from './CalendarComponents';

// Componente para mostrar la lista de próximas tareas
const TaskList = ({ 
  tasks, 
  onTaskClick,
  maxItems = 8
}) => {
  const sortedTasks = Array.isArray(tasks) ? tasks
    .filter(e => e && e.start instanceof Date) // Verificar que sean tareas válidas
    .sort((a, b) => a.start - b.start)
    .filter(e => e.start >= new Date())
    .slice(0, maxItems) : [];
    
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Próximas Tareas</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(categories).map(([key, cat]) => (
            <div key={key} className="flex items-center text-xs">
              <div 
                className="w-3 h-3 rounded-full mr-1" 
                style={{ backgroundColor: cat.color }} 
              />
              {cat.name}
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {sortedTasks.map(event => {
          const cat = categories[event.category] || categories.OTROS;
          return (
            <div 
              key={event.id} 
              className="p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => onTaskClick(event)} 
              style={{
                borderColor: cat.borderColor,
                backgroundColor: `${cat.bgColor}40`
              }}
            >
              <div className="flex items-start">
                <div 
                  className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                  style={{ backgroundColor: cat.color, marginTop: '5px' }} 
                />
                <div className="flex-1">
                  <div className="font-medium mb-1">{event.title}</div>
                  <div className="text-xs text-gray-500">
                    {event.start.toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {event.desc && (
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">{event.desc}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {sortedTasks.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No hay próximas tareas programadas
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
