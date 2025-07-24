import React, { useState } from 'react';
import { Music, Edit2, Play, Plus, Trash2, Search as SearchIcon, X, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { Card } from '../../components/ui';
import PageWrapper from '../../components/PageWrapper';
import { Button } from '../../components/ui';
import useSpecialMoments from '../../hooks/useSpecialMoments';

const MomentosEspeciales = () => {
  // Hook para manejar los momentos especiales
  const { moments, addMoment, updateMoment, removeMoment, reorderMoment, moveMoment, duplicateMoment } = useSpecialMoments();
  
  // Estados para las pestañas y búsqueda
  const [activeTab, setActiveTab] = useState('ceremonia');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorSearch, setErrorSearch] = useState(null);

  // Definición de las pestañas
  const TABS = [
    { key: 'ceremonia', label: 'Ceremonia' },
    { key: 'coctail', label: 'Cóctel' },
    { key: 'banquete', label: 'Banquete' },
    { key: 'disco', label: 'Disco' },
  ];

  // Búsqueda de canciones usando la API de iTunes
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

  // Añadir nuevo momento al bloque activo
  const handleAddMoment = () => {
    const nextOrder = (moments[activeTab]?.length || 0) + 1;
    addMoment(activeTab, { 
      order: nextOrder, 
      title: `Nuevo momento ${nextOrder}`, 
      song: '',
      time: ''
    });
  };

  return (
    <PageWrapper title="Momentos Especiales">
      <div className="space-y-6">
        <p className="text-gray-600">Planifica cada instante clave de tu gran día con la música y el momento adecuados.</p>
        
        {/* Pestañas unificadas */}
        <div className="border-b flex gap-4">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`pb-2 -mb-px font-medium ${activeTab === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
              onClick={() => {
                setActiveTab(tab.key);
                setResults([]);
                setSearch('');
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Contenido de la pestaña activa */}
        <Card className="space-y-5 p-5">
          {/* Buscador de canciones */}
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
              <SearchIcon size={16} /> Buscar
            </button>
          </div>

          {/* Estado búsqueda */}
          {loadingSearch && <p className="text-sm text-gray-500">Buscando...</p>}
          {errorSearch && <p className="text-sm text-red-600">{errorSearch}</p>}

          {/* Resultados búsqueda */}
          {results.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-2 border-b text-sm font-medium">
                Resultados
                <button 
                  onClick={() => setResults([])} 
                  className="float-right text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
              <ul className="divide-y">
                {results.map(song => (
                  <li key={song.id} className="p-2 hover:bg-blue-50">
                    <button 
                      className="w-full text-left flex justify-between items-center"
                      onClick={() => {
                        if (!moments[activeTab]?.length) {
                          addMoment(activeTab, { order: 1, title: 'Nuevo momento', song: song.name, time: '' });
                        } else {
                          // Actualizar el último momento añadido con la canción seleccionada
                          const lastMoment = [...(moments[activeTab] || [])].pop();
                          if (lastMoment) {
                            updateMoment(activeTab, lastMoment.id, { ...lastMoment, song: song.name });
                          }
                        }
                        setResults([]);
                        setSearch('');
                      }}
                    >
                      <span className="text-sm">{song.name}</span>
                      <Play size={16} className="text-blue-600" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lista de momentos */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{TABS.find(t => t.key === activeTab)?.label || 'Momentos'}</h3>
              <Button
                onClick={handleAddMoment}
                className="py-1 px-3 text-sm flex items-center gap-1"
              >
                <Plus size={14} />
                Añadir momento
              </Button>
            </div>
            
            <div className="space-y-3">
              {moments[activeTab]?.length ? (
                moments[activeTab]
                  .sort((a, b) => a.order - b.order)
                  .map((moment, idx) => (
                    <div key={moment.id} className="border rounded-lg p-3">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            className="w-full font-medium border-0 border-b border-transparent focus:border-blue-300 focus:ring-0 p-0 pb-1"
                            value={moment.title || ''}
                            onChange={e => updateMoment(activeTab, moment.id, { ...moment, title: e.target.value })}
                            placeholder="Título del momento"
                          />
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            <div className="flex-1 min-w-[200px]">
                              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <Music size={12} /> Canción
                              </div>
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-sm"
                                value={moment.song || ''}
                                onChange={e => updateMoment(activeTab, moment.id, { ...moment, song: e.target.value })}
                                placeholder="Nombre de la canción"
                              />
                            </div>
                            
                            <div className="w-24">
                              <div className="text-xs text-gray-500 mb-1">Duración</div>
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-sm"
                                value={moment.time || ''}
                                onChange={e => updateMoment(activeTab, moment.id, { ...moment, time: e.target.value })}
                                placeholder="00:00"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => removeMoment(activeTab, moment.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                          
                          <button 
                            onClick={() => duplicateMoment(activeTab, moment.id)}
                            className="text-gray-400 hover:text-blue-500 p-1"
                            title="Duplicar"
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          {idx > 0 && (
                            <button 
                              onClick={() => reorderMoment(activeTab, moment.id, 'up')}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="Mover arriba"
                            >
                              <ChevronUp size={16} />
                            </button>
                          )}
                          
                          {idx < moments[activeTab].length - 1 && (
                            <button 
                              onClick={() => reorderMoment(activeTab, moment.id, 'down')}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="Mover abajo"
                            >
                              <ChevronDown size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No hay momentos en esta sección.</p>
                  <p className="text-sm mt-1">Haz clic en "Añadir momento" para crear uno nuevo.</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default MomentosEspeciales;
