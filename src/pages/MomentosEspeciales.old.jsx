import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Save, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Music, 
  Download, 
  ExternalLink, 
  X, 
  Play, 
  Pause,
  Edit2,
  Trash2,
  GripVertical
} from 'lucide-react';
import useSpecialMoments from '../hooks/useSpecialMoments';
import Toast from '../components/Toast';

export default function MomentosEspeciales() {
  // Estado para el modal de edición y el reproductor de audio
  const [editingMoment, setEditingMoment] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [toast, setToast] = useState(null);

  // Hook para sincronizar momentos con almacenamiento compartido
  const { moments, addMoment, updateMoment, removeMoment } = useSpecialMoments();
  useEffect(() => {
    const labels = { ceremonia: 'Ceremonia', coctail: 'Cóctel', banquete: 'Banquete', disco: 'Disco' };
    const converted = Object.entries(moments).map(([key, list]) => ({ key, name: labels[key] || key, moments: list.sort((a,b)=>a.order-b.order) }));
    setBlocks(converted);
  }, [moments]);

  // Limpiar audio al desmontar el componente
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Controlar reproducción/pausa del audio
  const togglePlayPause = (previewUrl) => {
    if (!previewUrl) return;
    
    if (currentAudio === previewUrl) {
      // Pausar si es la misma canción
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentAudio(null);
    } else {
      // Detener canción actual si hay una reproduciéndose
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Reproducir nueva canción
      const audio = new Audio(previewUrl);
      audioRef.current = audio;
      audio.play()
        .then(() => {
          setCurrentAudio(previewUrl);
          setIsPlaying(true);
        })
        .catch(err => console.error('Error al reproducir:', err));

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      };
    }
  };

  const exportPDF = () => {
    // TODO: Mantener lógica existente de PDF
    alert('Exportación PDF mejorada en desarrollo');
  };

  const exportSpotify = () => {
    const disco = blocks.find(b => b.name === 'Disco');
    if (!disco) return;
    const songs = (disco.wishlists || []).flatMap(w => w.songs || []);
    if (!songs.length) {
      alert('No hay canciones en las listas de deseos');
      return;
    }
    const query = encodeURIComponent(songs.join(','));
    window.open(`https://open.spotify.com/search/${query}`, '_blank');
  };

  const [blocks, setBlocks] = useState([
    { 
      name: 'Ceremonia', 
      moments: [
        { id: 'm1', name: 'Entrada novios', song: '', notes: '', previewUrl: '' },
        { id: 'm2', name: 'Lectura de votos', song: '', notes: '', previewUrl: '' },
        { id: 'm3', name: 'Anillos', song: '', notes: '', previewUrl: '' },
      ]
    },
    { 
      name: 'Cóctel', 
      moments: [
        { id: 'm4', name: 'Aperitivos', song: '', notes: '', previewUrl: '' },
        { id: 'm5', name: 'Brindis', song: '', notes: '', previewUrl: '' },
      ]
    },
    { 
      name: 'Banquete', 
      moments: [
        { id: 'm6', name: 'Primer plato', song: '', notes: '', previewUrl: '' },
        { id: 'm7', name: 'Segundo plato', song: '', notes: '', previewUrl: '' },
        { id: 'm8', name: 'Postre', song: '', notes: '', previewUrl: '' },
      ]
    },
    {
      name: 'Disco',
      moments: [
        { 
          id: 'm9', 
          name: 'Baile Principal', 
          song: 'Perfect - Ed Sheeran', 
          notes: 'Primer baile como esposos',
          previewUrl: 'https://p.scdn.co/mp3-preview/...'
        },
        { 
          id: 'm10', 
          name: 'Animación de Pista', 
          song: 'Uptown Funk - Bruno Mars', 
          notes: 'Para animar a los invitados',
          previewUrl: 'https://p.scdn.co/mp3-preview/...'
        },
        { 
          id: 'm11', 
          name: 'Último Tema', 
          song: 'Bohemian Rhapsody - Queen', 
          notes: 'Para terminar la fiesta',
          previewUrl: 'https://p.scdn.co/mp3-preview/...'
        },
      ],
      wishlists: [
        { 
          id: 'wl1', 
          name: 'Clásicos Románticos', 
          songs: ['Perfect - Ed Sheeran', 'All of Me - John Legend'] 
        },
        { 
          id: 'wl2', 
          name: 'Para Bailar', 
          songs: ['Uptown Funk - Bruno Mars', 'Dance Monkey - Tones and I'] 
        }
      ],
    },
  ]);
  
  const [openBlock, setOpenBlock] = useState(null);

// Reordenar momentos mediante drag&drop
const onDragEnd = (result, blockIndex) => {
  if (!result.destination) return;
  
  setBlocks(prev => {
    const newBlocks = [...prev];
    const [moved] = newBlocks[blockIndex].moments.splice(result.source.index, 1);
    newBlocks[blockIndex].moments.splice(result.destination.index, 0, moved);
    // Actualizar orden en almacenamiento compartido
    newBlocks[blockIndex].moments.forEach((m, idx) => {
      updateMoment(newBlocks[blockIndex].key, m.id, { order: idx + 1 });
    });
    return newBlocks;
  });
};

// Manejador para guardar los cambios de un momento editado
const handleSaveMoment = (updatedMoment) => {
  updateMoment(blockKeyRef.current, updatedMoment.id, updatedMoment);
  setToast({ message: 'Guardado', type: 'success' });
  setEditingMoment(null);
};

// Función para buscar canciones (simulada)
const handleSearchSong = async (query) => {
  // Simulación de búsqueda de canciones
  // En producción, aquí iría la llamada a la API de Spotify/Deezer
  return [
    { id: 's1', name: 'Perfect - Ed Sheeran', previewUrl: 'https://p.scdn.co/mp3-preview/...' },
    { id: 's2', name: 'All of Me - John Legend', previewUrl: 'https://p.scdn.co/mp3-preview/...' },
    { id: 's3', name: 'A Thousand Years - Christina Perri', previewUrl: 'https://p.scdn.co/mp3-preview/...' },
  ].filter(song => 
    song.name.toLowerCase().includes(query.toLowerCase())
  );
};

// --- Componente Wishlists ---

  function Wishlists({ block, onChange }) {
    const [input, setInput] = useState('');
    const [aiDesc, setAiDesc] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState([]);

    const addWishlist = () => {
      if (!input.trim()) return;
      onChange([...(block.wishlists || []), { 
        id: Date.now(), 
        name: input.trim(), 
        songs: [] 
      }]);
      setInput('');
    };

    const addSongToWishlist = (wishlistId, song) => {
      onChange(block.wishlists.map(w => 
        w.id === wishlistId 
          ? { ...w, songs: [...(w.songs || []), song] }
          : w
      ));
    };

    return (
      <div className="border rounded p-4 mt-4">
        <h4 className="font-semibold text-base mb-3">Listas de Deseos Musicales</h4>
        
        {/* Lista de wishlists existentes */}
        <div className="space-y-2 mb-4">
          {block.wishlists?.map(wishlist => (
            <div key={wishlist.id} className="border rounded p-3">
              <div className="font-medium mb-2">{wishlist.name}</div>
              <ul className="space-y-1 text-sm text-gray-600">
                {wishlist.songs?.map((song, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <span>{song}</span>
                    <button 
                      onClick={() => {
                        // Buscar la URL de vista previa de la canción
                        const previewUrl = block.moments?.find(m => m.song === song)?.previewUrl;
                        if (previewUrl) {
                          togglePlayPause(previewUrl);
                        }
                      }}
                      className="text-blue-500 hover:text-blue-700"
                      title="Escuchar vista previa"
                    >
                      {currentAudio && block.moments?.some(m => 
                        m.song === song && m.previewUrl === currentAudio && isPlaying
                      ) ? (
                        <Pause size={14} />
                      ) : (
                        <Play size={14} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Añadir nueva wishlist */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nombre de la lista"
            className="flex-1 border rounded px-3 py-2 text-sm"
            onKeyPress={(e) => e.key === 'Enter' && addWishlist()}
          />
          <button
            onClick={addWishlist}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Añadir Lista
          </button>
        </div>

        {/* Búsqueda asistida por IA */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asistente Musical (IA)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiDesc}
              onChange={(e) => setAiDesc(e.target.value)}
              placeholder="Ej: Canción romántica para el primer baile"
              className="flex-1 border rounded px-3 py-2 text-sm"
            />
            <button
              onClick={async () => {
                if (!aiDesc.trim()) return;
                setAiLoading(true);
                try {
                  // Simular respuesta de IA
                  setTimeout(() => {
                    setAiSuggestions([
                      'Perfect - Ed Sheeran',
                      'All of Me - John Legend',
                      'A Thousand Years - Christina Perri',
                      'Thinking Out Loud - Ed Sheeran',
                      'At Last - Etta James'
                    ]);
                    setAiLoading(false);
                  }, 1000);
                } catch (err) {
                  console.error('Error en la búsqueda IA:', err);
                  setAiLoading(false);
                }
              }}
              disabled={aiLoading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {aiLoading ? 'Buscando...' : 'Sugerir Canciones'}
            </button>
          </div>
          
          {/* Mostrar sugerencias de IA */}
          {aiSuggestions.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600">Sugerencias para "{aiDesc}":</p>
              <div className="border rounded divide-y">
                {aiSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="p-2 flex justify-between items-center hover:bg-gray-50">
                    <span className="text-sm">{suggestion}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          // Añadir a la primera wishlist o crear una nueva
                          if (block.wishlists?.length > 0) {
                            addSongToWishlist(block.wishlists[0].id, suggestion);
                          } else {
                            const newId = Date.now();
                            onChange([{ id: newId, name: 'Mi Lista', songs: [suggestion] }]);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Añadir
                      </button>
                      <select 
                        className="border rounded text-xs p-1"
                        onChange={(e) => {
                          if (e.target.value === 'new') {
                            const newId = Date.now();
                            onChange([...block.wishlists, { id: newId, name: 'Nueva Lista', songs: [suggestion] }]);
                          } else if (e.target.value) {
                            addSongToWishlist(parseInt(e.target.value), suggestion);
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="">A lista...</option>
                        {block.wishlists?.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                        <option value="new">Nueva lista...</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Componente Modal de Edición ---
  const ModalEdicionMomentos = ({ isOpen, onClose, moment, onSave }) => {
    const [formData, setFormData] = useState({
      name: '',
      song: '',
      notes: '',
      previewUrl: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Inicializar el formulario cuando se abre el modal o cambia el momento
    useEffect(() => {
      if (moment) {
        setFormData({
          name: moment.name || '',
          song: moment.song || '',
          notes: moment.notes || '',
          previewUrl: moment.previewUrl || ''
        });
        setSearchQuery('');
        setSearchResults([]);
      }
    }, [moment]);

    // Manejar cambios en los inputs del formulario
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    // Buscar canciones
    const handleSearch = async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await handleSearchSong(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Error buscando canciones:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Seleccionar una canción de los resultados
    const handleSelectSong = (song) => {
      setFormData(prev => ({
        ...prev,
        song: song.name,
        previewUrl: song.previewUrl
      }));
      setSearchResults([]);
      setSearchQuery(song.name);
    };

    // Guardar los cambios
    const handleSubmit = (e) => {
      e.preventDefault();
      onSave({
        ...moment,
        ...formData
      });
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {moment?.id ? 'Editar Momento' : 'Nuevo Momento'}
              </h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Cerrar"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Nombre del Momento */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Momento *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Buscador de Canciones */}
              <div className="mb-4">
                <label htmlFor="song" className="block text-sm font-medium text-gray-700 mb-1">
                  Canción
                </label>
                <div className="p-4">
                <DragDropContext onDragEnd={res => onDragEnd(res, key)}>
                  <Droppable droppableId={`droppable-${key}`}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-3"
                      >
                        {block.moments?.length > 0 ? (
                          block.moments.map((moment, momentIndex) => (
                            <Draggable 
                              key={moment.id}
                              draggableId={`moment-${moment.id}`}
                              index={momentIndex}
                            >
                              {(provided, snapshot) => renderMomentCard(
                                moment,
                                provided,
                                snapshot.isDragging
                              )}
                            </Draggable>
                          ))
                        ) : (
                          renderEmptyState(key)
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                                  </div>
                                  
                                  {/* Contenido del momento */}
                                  {(moment.song || moment.notes) && (
                                    <div className="mt-3 space-y-2">
                                      {/* Canción */}
                                      {moment.song && (
                                        <div className="flex items-start">
                                          <div className="flex-shrink-0 pt-0.5">
                                            <Music size={16} className="text-gray-400" />
                                          </div>
                                          <div className="ml-2">
                                            <p className="text-sm font-medium text-gray-700">Canción</p>
                                            <p className="text-sm text-gray-600">{moment.song}</p>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Notas */}
                                      {moment.notes && (
                                        <div className="flex">
                                          <div className="flex-shrink-0 pt-0.5">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                              <polyline points="14 2 14 8 20 8"></polyline>
                                              <line x1="16" y1="13" x2="8" y2="13"></line>
                                              <line x1="16" y1="17" x2="8" y2="17"></line>
                                              <polyline points="10 9 8 9 8 13"></polyline>
                                            </svg>
                                          </div>
                                          <div className="ml-2">
                                            <p className="text-sm font-medium text-gray-700">Notas</p>
                                            <p className="text-sm text-gray-600 whitespace-pre-line">{moment.notes}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Sin momentos</h3>
                  <p className="mt-1 text-sm text-gray-500">Comienza añadiendo tu primer momento especial.</p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setEditingMoment({ id: `moment-${Date.now()}`, name: '', song: '', notes: '' })}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                      Nuevo Momento
                    </button>
                  </div>
                </div>
              )}
              </div>
              <div className="relative">
                <div className="flex">
                  <input
                    type="text"
                    id="song"
                    name="song"
                    value={searchQuery || formData.song}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Buscar canción..."
                  />
                  {formData.previewUrl && (
                    <button
                      type="button"
                      onClick={() => togglePlayPause(formData.previewUrl)}
                      className="px-3 py-2 border border-l-0 border-gray-300 bg-gray-100 text-gray-700 rounded-r-md hover:bg-gray-200 focus:outline-none"
                    >
                      {currentAudio === formData.previewUrl && isPlaying ? (
                        <Pause size={18} />
                      ) : (
                        <Play size={18} />
                      )}
                    </button>
                  )}
                </div>
                
                {/* Resultados de búsqueda */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                        onClick={() => handleSelectSong(result)}
                      >
                        <span className="truncate">{result.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlayPause(result.previewUrl);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          {currentAudio === result.previewUrl && isPlaying ? (
                            <Pause size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {isSearching && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md p-2 text-center text-sm text-gray-500">
                    Buscando canciones...
                  </div>
                )}
              </div>
            </div>

              {/* Notas */}
              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detalles importantes sobre este momento..."
                />
              </div>

              {/* Acciones */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Render a single moment card
  const renderMomentCard = (moment, provided, isDragging = false) => (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900">
              {moment.name}
            </h3>
          </div>
          <div className="flex items-center space-x-1">
            {/* Play/Pause Button */}
            {moment.previewUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause(moment.previewUrl);
                }}
                className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label={currentAudio === moment.previewUrl && isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {currentAudio === moment.previewUrl && isPlaying ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} />
                )}
              </button>
            )}
            
            {/* Drag Handle */}
            <button
              {...provided?.dragHandleProps}
              className="p-1.5 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Reordenar"
            >
              <GripVertical size={16} />
            </button>
            
            {/* Edit Button */}
            <button
              onClick={() => setEditingMoment(moment)}
              className="p-1.5 text-blue-500 hover:text-blue-700 focus:outline-none"
              aria-label="Editar momento"
            >
              <Edit2 size={16} />
            </button>
            
            {/* Delete Button */}
            <button
              onClick={() => {
                if (window.confirm(`¿Eliminar "${moment.name}"?`)) {
                  const updatedMoments = blocks.map(block => ({
                    ...block,
                    moments: block.moments.filter(m => m.id !== moment.id)
                  }));
                  setBlocks(updatedMoments);
                }
              }}
              className="p-1.5 text-red-500 hover:text-red-700 focus:outline-none"
              aria-label="Eliminar momento"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        {(moment.song || moment.notes) && (
          <div className="mt-3 space-y-2 pt-2 border-t border-gray-100">
            {/* Song */}
            {moment.song && (
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <Music size={16} className="text-gray-400" />
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-700">Canción</p>
                  <p className="text-sm text-gray-600">{moment.song}</p>
                </div>
              </div>
            )}
            
            {/* Notes */}
            {moment.notes && (
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 8 9 8 13"></polyline>
                  </svg>
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-700">Notas</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{moment.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Render empty state
  const renderEmptyState = (blockKey) => (
    <div className="text-center py-8 text-gray-500">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">Sin momentos</h3>
      <p className="mt-1 text-sm text-gray-500">Comienza añadiendo tu primer momento especial.</p>
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setEditingMoment({ 
            id: `moment-${Date.now()}`, 
            name: '', 
            song: '', 
            notes: '',
            previewUrl: '' 
          })}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-0.5 mr-1.5 h-3.5 w-3.5" />
          Añadir momento
        </button>
      </div>
    </div>
  );

  // --- Render ---
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Momentos Especiales</h2>
      
      {/* Modal de Edición */}
      <ModalEdicionMomentos
        isOpen={!!editingMoment}
        onClose={() => setEditingMoment(null)}
        moment={editingMoment}
        onSave={handleSaveMoment}
      />
      {blocks.map((block, blockIndex) => (
        <div key={block.name} className="border rounded-lg overflow-hidden shadow-sm">
          <button
            className="w-full flex justify-between items-center p-4 font-medium text-left bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => setOpenBlock(openBlock === blockIndex ? null : blockIndex)}
          >
            <div className="flex items-center">
              <span className="text-lg font-semibold text-gray-800">{block.name}</span>
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {block.moments?.length || 0} momentos
              </span>
            </div>
          </button>
          {/* Wishlists solo en Disco */}
          {key === 3 && (
            <div className="w-full mt-4">
              <Wishlists block={blocks[key]} onChange={wl => setBlocks(prev => ({ ...prev, [key]: { ...prev[key], wishlists: wl } }))} />
            </div>
                  <Droppable droppableId={blockIndex}>
                  <Droppable droppableId={key}>
                    {provided => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex justify-between"
                      >
                        {block.moments.map((moment, index) => (
                          <li key={moment.id} className="flex justify-between">
                            {moment.name}
                            <Music size={16} className="text-blue-600" />
                          </li>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
              {block.items && (
                block.items.map(item => (
                  <li key={item} className="flex justify-between">
                    {item}
                    <Music size={16} className="text-blue-600" />
                  </li>
                ))
              )}
              <div className="flex justify-between mt-2 items-start">
                <button className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-xs">
                  <Save size={14} /> Guardar Cambios
                </button>
                {/* Wishlists solo en Disco */}
                {key === 3 && (
                  <div className="w-full mt-4">
                    <Wishlists block={blocks[key]} onChange={wl => setBlocks(prev => ({ ...prev, [key]: { ...prev[key], wishlists: wl } }))} />
                  </div>
                )}
              </div>
            </ul>
          )}
        </div>
      ))}
      <div className="mt-4 flex gap-2">
        <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center" onClick={()=>exportPDF()}>
          <Download size={16} className="mr-2" /> Exportar PDF
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded flex items-center" onClick={()=>exportSpotify()}>
          <ExternalLink size={16} className="mr-2"/> Exportar a Spotify
        </button>
      </div>
    </div>
  );
}
