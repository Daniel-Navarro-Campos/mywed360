import React, { useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import Card from '../components/Card';
import useSpecialMoments from '../hooks/useSpecialMoments';

/*
  Página: Momentos Especiales (Reescrita)
  ------------------------------------------------------------------
  - Título coherente con el resto de páginas.
  - Pestañas: Ceremonia, Cóctel, Banquete, Disco.
  - Lista de momentos precargados (procedentes del hook useSpecialMoments).
  - Buscador simple de canciones para asignar a cada momento.
  - Añadir / eliminar momentos sincronizado con Timing gracias al hook.
*/

const TABS = [
  { key: 'ceremonia', label: 'Ceremonia' },
  { key: 'coctail', label: 'Cóctel' },
  { key: 'banquete', label: 'Banquete' },
  { key: 'disco', label: 'Disco' },
];

export default function MomentosEspeciales() {
  const { moments, addMoment, updateMoment, removeMoment, reorderMoment, moveMoment, duplicateMoment } = useSpecialMoments();
  const [active, setActive] = useState('ceremonia');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorSearch, setErrorSearch] = useState(null);

  // Búsqueda real de canciones usando la API pública de iTunes
  const handleSearch = async () => {
    const term = search.trim();
    if (!term) {
      setResults([]);
      return;
    }
    setLoadingSearch(true);
    setErrorSearch(null);
    try {
      const resp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=15`);
      const data = await resp.json();
      if (Array.isArray(data.results)) {
        const mapped = data.results.map(r => ({ id: r.trackId, name: `${r.trackName} - ${r.artistName}` }));
        setResults(mapped);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Error buscando canciones', err);
      setErrorSearch('No se pudo buscar canciones. Inténtalo más tarde.');
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Añadir nuevo momento vacío al bloque activo
  const handleAddMoment = () => {
    const nextOrder = (moments[active]?.length || 0) + 1;
    addMoment(active, { order: nextOrder, title: `Nuevo momento ${nextOrder}`, song: '' });
  };

  return (
    <PageWrapper title="Momentos especiales">
      {/* Título */}
      

      {/* Pestañas */}
      <div className="border-b flex gap-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`pb-2 -mb-px font-medium ${active === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            onClick={() => {
              setActive(tab.key);
              setResults([]);
              setSearch('');
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña activa */}
      <Card className="space-y-4">
        {/* Buscador */}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar canción..."
            className="flex-1 border rounded px-3 py-2"
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-1">
            <Search size={16} /> Buscar
          </button>
        </div>

        {/* Estado búsqueda */}
        {loadingSearch && <p className="text-sm text-gray-500">Buscando...</p>}
        {errorSearch && <p className="text-sm text-red-600">{errorSearch}</p>}

        {/* Resultados búsqueda */}
        {results.length > 0 && (
          <div className="border rounded divide-y">
            {results.map(res => (
              <div key={res.id} className="p-2 flex justify-between items-center hover:bg-gray-50">
                <span>{res.name}</span>
                <button
                  className="text-blue-600 text-sm hover:text-blue-800"
                  onClick={() => {
                    // Asignar canción al primer momento sin canción
                    const target = moments[active]?.find(m => !m.song);
                    if (target) {
                      updateMoment(active, target.id, { song: res.name });
                    }
                  }}
                >
                  Asignar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Lista de momentos */}
        <div className="border rounded divide-y bg-white">
          {(moments[active] || []).map((m, idx) => (
            <div
            key={m.id}
            className="p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-move"
            draggable
            onDragStart={e => {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('id', m.id);
            }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              const draggedId = Number(e.dataTransfer.getData('id'));
              if (draggedId && draggedId !== m.id) {
                moveMoment(active, draggedId, idx);
              }
            }}
          >
              {/* Flechas reordenar */}
              <div className="flex items-center gap-1 self-start">
                <button
                  aria-label="Subir"
                  disabled={idx === 0}
                  className={`text-xs px-1 ${idx === 0 ? 'text-gray-400' : 'text-gray-600 hover:text-black'}`}
                  onClick={() => reorderMoment(active, m.id, 'up')}
                >▲</button>
                <button
                  aria-label="Bajar"
                  disabled={idx === ((moments[active]?.length || 0) - 1)}
                  className={`text-xs px-1 ${idx === ((moments[active]?.length || 0) - 1) ? 'text-gray-400' : 'text-gray-600 hover:text-black'}`}
                  onClick={() => reorderMoment(active, m.id, 'down')}
                >▼</button>
              </div>

              {/* Campo editable título, hora y canción */}
              <div className="flex-1 space-y-1">
                <input
                  value={m.title}
                  onChange={e => updateMoment(active, m.id, { title: e.target.value })}
                  className="w-full border-b focus:outline-none font-medium"
                />
                <input
                  value={m.time || ''}
                  onChange={e => updateMoment(active, m.id, { time: e.target.value })}
                  placeholder="Hora (hh:mm)"
                  className="w-full text-sm text-gray-600 border-b focus:outline-none"
                />
                {m.song && <div className="text-xs text-gray-500">🎵 {m.song}</div>}
              </div>

              {/* Acciones */}
              <div className="flex gap-2 items-center self-start">
                {m.song && (
                  <button
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => updateMoment(active, m.id, { song: '' })}
                  >
                    Quitar canción
                  </button>
                )}
                <button
                  className="text-xs text-purple-600 hover:underline"
                  onClick={() => {
                    const dest = prompt('Duplicar a (ceremonia, coctail, banquete, disco):', active === 'ceremonia' ? 'banquete' : 'ceremonia');
                    if (dest && dest !== active) duplicateMoment(active, m.id, dest);
                  }}
                >
                  Duplicar
                </button>
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={() => removeMoment(active, m.id)}
                  title="Eliminar momento"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Botón añadir momento */}
        <button
          onClick={handleAddMoment}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1"
        >
          <Plus size={16} /> Añadir Momento
        </button>
      </div>
    </PageWrapper>
  );
}
