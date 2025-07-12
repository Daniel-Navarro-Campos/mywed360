import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Download, Filter, CheckCircle, Circle } from 'lucide-react';

export default function Checklist() {
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [selected, setSelected] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [completed, setCompleted] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('checklistCompleted') || '{}');
    } catch {
      return {};
    }
  });

  // Actualizar localStorage cuando cambie el estado de completadas
  useEffect(() => {
    localStorage.setItem('checklistCompleted', JSON.stringify(completed));
  }, [completed]);

  const blocks = [
    {
      name: 'Día Previo a la Boda',
      tasks: [
        { id: 1, title: 'Ensayo general', type: 'ensayo', responsible: 'Equipo', due: '2025-06-17', status: 'Pendiente' }
      ]
    },
    {
      name: 'Antes de empezar la boda',
      tasks: [
        { id: 2, title: 'Alinear decoraciones', type: 'montaje', responsible: 'Rollout', due: '2025-06-18', status: 'En progreso' }
      ]
    }
  ];

  const toggleSelect = id => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleCompleted = id => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Checklist</h1>
      

      {/* Controles */}
      <div className="flex flex-wrap gap-2 items-center">
        <input type="text" placeholder="Buscar tarea" value={search} onChange={e => setSearch(e.target.value)} className="border rounded px-2 py-1" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Tipo</option>
          <option value="ensayo">Ensayo</option>
          <option value="montaje">Montaje</option>
          <option value="audio/vídeo">Audio/Vídeo</option>
        </select>
        <select value={responsibleFilter} onChange={e => setResponsibleFilter(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Responsable</option>
          <option value="Equipo">Equipo</option>
          <option value="Rollout">Rollout</option>
        </select>
        <input type="date" value={dateFilter.from} onChange={e => setDateFilter(prev => ({...prev, from: e.target.value}))} className="border rounded px-2 py-1" />
        <input type="date" value={dateFilter.to} onChange={e => setDateFilter(prev => ({...prev, to: e.target.value}))} className="border rounded px-2 py-1" />

        <button onClick={() => setShowNewModal(true)} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center">
          <Plus size={16} className="mr-1" /> Nueva Tarea
        </button>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-gray-100 p-2 rounded flex gap-2">
          <button className="bg-green-600 text-white px-2 py-1 rounded">Cambiar estado ({selected.length})</button>
          <button className="bg-purple-600 text-white px-2 py-1 rounded flex items-center">
            <Download size={16} className="mr-1" /> Exportar CSV
          </button>
        </div>
      )}

      {/* Vista Lista */}
      {view === 'list' && (
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th></th>
              <th>Tarea</th>
              <th>Tipo</th>
              <th>Responsable</th>
              <th>Fecha límite</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {blocks.flatMap(block =>
              block.tasks.map(t => (
                <tr key={t.id} className={completed[t.id] ? 'opacity-60 line-through' : ''}>
                  <td>
                    <button aria-label="Marcar completada" onClick={() => toggleCompleted(t.id)} className="focus:outline-none">
                      {completed[t.id] ? <CheckCircle className="text-green-600" size={20} /> : <Circle className="text-gray-400" size={20} />}
                    </button>
                  </td>
                  <td>{t.title}</td>
                  <td>{t.type}</td>
                  <td>{t.responsible}</td>
                  <td>{t.due}</td>
                  <td>{completed[t.id] ? 'Completada' : t.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}



      {/* Modal Nueva Tarea */}
      {showNewModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow w-80">
            <h3 className="font-semibold mb-2">Nueva Tarea</h3>
            {/* TODO: formulario */}
            <button onClick={() => setShowNewModal(false)} className="mt-2 px-2 py-1 bg-red-600 text-white rounded">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
