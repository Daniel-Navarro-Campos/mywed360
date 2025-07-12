import React, { useState } from 'react';
import { Music, Edit2, Play, GripVertical, ChevronDown, ChevronUp, Trash2, Search as SearchIcon, FileText, ExternalLink } from 'lucide-react';
import Card from '../../components/Card';
import PageWrapper from '../../components/PageWrapper';
import Button from '../../components/Button';

const MomentosEspeciales = () => {


  // Datos iniciales de ejemplo (MVP)
  const [blocks, setBlocks] = useState([
    {
      id: 'ceremonia',
      name: 'Ceremonia',
      moments: [
        { id: 1, order: 1, title: 'Entrada Novio', song: 'Canon in D – Pachelbel', notes: 'Entrada por pasillo lateral' },
        { id: 2, order: 2, title: 'Entrada Novia', song: 'Bridal Chorus – Wagner', notes: '' },
        { id: 3, order: 3, title: 'Lectura 1', song: 'A Thousand Years', notes: '' },
        { id: 4, order: 4, title: 'Lectura 2', song: '', notes: '' },
        { id: 5, order: 5, title: 'Ceremonia de Anillos', song: '', notes: '' },
        { id: 6, order: 6, title: 'Salida', song: '', notes: '' },
      ],
    },
    {
      id: 'coctel',
      name: 'Cóctel',
      moments: [
        { id: 7, order: 1, title: 'Canción de Entrada', song: '', notes: '' },
      ],
      playlistSugeridas: ['Chill', 'Lounge', 'Jazz', 'Upbeat'],
    },
    {
      id: 'banquete',
      name: 'Banquete',
      moments: [
        { id: 8, order: 1, title: 'Entrada de Novios', song: '', notes: '' },
        { id: 9, order: 2, title: 'Corte de Pastel', song: '', notes: '' },
        { id: 10, order: 3, title: 'Discursos', song: '', notes: '' },
      ],
    },
    {
      id: 'disco',
      name: 'Disco',
      moments: [
        { id: 11, order: 1, title: 'Baile Principal', song: '', notes: '' },
        { id: 12, order: 2, title: 'Animación de Pista', song: '', notes: '' },
        { id: 13, order: 3, title: 'Último Tema', song: '', notes: '' },
      ],
      wishlists: [
        { id: 'wl1', name: 'Lista de deseos 1', songs: [] },
      ],
    },
  ]);

  const [expandedBlock, setExpandedBlock] = useState(null);
  const toggleBlock = (id) => setExpandedBlock(prev => prev === id ? null : id);

  return (
    <PageWrapper title="Momentos Especiales" className="space-y-8">
      <p className="text-gray-600">Planifica cada instante clave de tu gran día.</p>

      

      <div className="lg:grid lg:grid-cols-12 gap-6">
      {/* Contenido del bloque activo */}
      {blocks.map(block => (
        <Card key={block.id} className="p-4 space-y-4 lg:col-span-8">
          {/* Encabezado bloque */}
          <button onClick={()=>toggleBlock(block.id)} className="w-full text-left flex justify-between items-center font-medium text-lg mb-2">
            <span>{block.name}</span>
            {expandedBlock===block.id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
          </button>
          {expandedBlock!==block.id && <hr/>}
          {expandedBlock===block.id && (<>

          {/* Tabla de momentos */}
                  {/* Tabla de momentos */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm border-collapse">
                      <thead>
                        <tr className="text-left text-gray-600">
                          <th scope="col" className="py-2 font-semibold">Orden</th>
                          <th scope="col" className="py-2 font-semibold">Momento</th>
                          <th scope="col" className="py-2 font-semibold">Canción</th>
                          <th scope="col" className="py-2 font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {block.moments.map((m) => (
                          <tr key={m.id} className="border-t">
                            <th scope="row" className="py-2 pr-2 w-12 font-medium text-gray-700">{m.order}</th>
                            <td className="py-2 pr-2 whitespace-nowrap">{m.title}</td>
                            <td className="py-2 pr-2 text-gray-700 truncate max-w-[10rem]">{m.song || <span className="italic text-gray-400">Sin asignar</span>}</td>
                            <td className="py-2 flex items-center space-x-3">
                              <button className="text-gray-600 hover:text-blue-600" aria-label="Cambiar orden"><GripVertical className="w-4 h-4" /></button>
                              <button className="text-gray-600 hover:text-blue-600" aria-label="Cambiar canción"><Music className="w-4 h-4" /></button>
                              <button className="text-gray-600 hover:text-blue-600" aria-label="Reproducir"><Play className="w-4 h-4" /></button>
                              <button className="text-gray-600 hover:text-blue-600" aria-label="Añadir nota"><Edit2 className="w-4 h-4" /></button>
                              <button className="text-gray-600 hover:text-red-600" aria-label="Eliminar"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

          {/* Extras para bloques específicos */}
                  {block.playlistSugeridas && (
                    <div className="space-y-1">
                      <h4 className="font-medium text-gray-800">Playlists sugeridas</h4>
                      <div className="flex flex-wrap gap-2">
                        {block.playlistSugeridas.map((p) => (
                          <span key={p} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {block.wishlists && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800">Wishlists</h4>
                      {block.wishlists.map((wl) => (
                        <div key={wl.id} className="p-2 border rounded flex justify-between items-center">
                          <span>{wl.name}</span>
                          <Button size="sm">Ver</Button>
                        </div>
                      ))}
                      <Button size="sm" className="mt-1">Crear nueva lista</Button>
                    </div>
                  )}
          </>)
          }
        </Card>
      ))}


        {/* Panel lateral de música */}
        <aside className="lg:col-span-4 space-y-4">
          <Card className="p-4 space-y-3 sticky top-20">
            <h3 className="font-medium flex items-center gap-1"><SearchIcon className="w-4 h-4" /> Buscador de Canciones (IA)</h3>
            <input type="text" disabled placeholder="Describe tu momento o busca canción" className="w-full p-2 border rounded text-sm" />
            <p className="text-xs text-gray-600">Próximamente: sugerencias IA y filtros avanzados.</p>
          </Card>
        </aside>
      </div>

      {/* Sección de exportación */}
      <Card className="p-4 flex flex-wrap gap-3 items-center justify-between">
        <h3 className="font-medium">Exportar / Compartir</h3>
        <div className="flex flex-wrap gap-3">
          <Button leftIcon={<Music className="w-4 h-4" />}>Exportar a Spotify</Button>
          <Button leftIcon={<FileText className="w-4 h-4" />}>Descargar PDF</Button>
          <Button leftIcon={<ExternalLink className="w-4 h-4" />}>Enlace público</Button>
        </div>
      </Card>

      {/* Galería de inspiración */}
      <section className="space-y-3">
        <h3 className="text-lg font-medium">Galería de Inspiración</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    </PageWrapper>
  );
};

export default MomentosEspeciales;

/* LEGACY DUPLICATE CODE START
      moments: [
        { id: 1, title: 'Entrada de los novios', description: 'Descripción de la entrada...', duration: '5 min' },
        { id: 2, title: 'Lecturas', description: 'Lecturas seleccionadas...', duration: '10 min' },
      ],
    },
    {
      id: 'coctel',
      name: 'Cóctel',
      moments: [
        { id: 3, title: 'Brindis de bienvenida', description: 'Palabras de bienvenida...', duration: '15 min' },
      ],
    },
    {
      id: 'banquete',
      name: 'Banquete',
      moments: [],
    },
    {
      id: 'disco',
      name: 'Disco',
      moments: [
        { id: 4, title: 'Primer baile', description: 'Canción: Perfect - Ed Sheeran', duration: '4 min' },
      ],
    },
  ]);

  const toggleBlock = (blockId) => {
    setExpandedBlock(expandedBlock === blockId ? null : blockId);
  };

  const handleAddMoment = (blockId) => {
    if (newMoment.title && newMoment.block === blockId) {
      const updatedBlocks = blocks.map(block => {
        if (block.id === blockId) {
          return {
            ...block,
            moments: [...block.moments, { 
              id: Date.now(), 
              title: newMoment.title,
              description: newMoment.description || 'Sin descripción',
              duration: '5 min'
            }]
          };
        }
        return block;
      });
      setBlocks(updatedBlocks);
      setNewMoment({ title: '', description: '', block: '' });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Momentos Especiales</h2>
      <p className="text-gray-600">Organiza los momentos clave de tu boda por bloques.</p>
      
      <div className="space-y-4">
        {blocks.map((block) => (
          <Card key={block.id} className="overflow-hidden">
            <button
              onClick={() => toggleBlock(block.id)}
              className="w-full px-4 py-3 text-left font-medium bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
            >
              <span>{block.name} <span className="text-sm text-gray-600 ml-2">({block.moments.length})</span></span>
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  expandedBlock === block.id ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedBlock === block.id && (
              <div className="p-4 space-y-4">
                <div className="space-y-4">
                  {block.moments.map((moment) => (
                    <div key={moment.id} className="p-3 bg-white border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{moment.title}</h3>
                          <p className="text-sm text-gray-600">{moment.description}</p>
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {moment.duration}
                          </span>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Añadir nuevo momento</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Título del momento"
                      className="w-full p-2 border rounded"
                      value={newMoment.block === block.id ? newMoment.title : ''}
                      onChange={(e) => setNewMoment({
                        ...newMoment,
                        title: e.target.value,
                        block: block.id
                      })}
                    />
                    <textarea
                      placeholder="Descripción (opcional)"
                      rows="2"
                      className="w-full p-2 border rounded"
                      value={newMoment.block === block.id ? newMoment.description : ''}
                      onChange={(e) => setNewMoment({
                        ...newMoment,
                        description: e.target.value,
                        block: block.id
                      })}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleAddMoment(block.id)}
                        disabled={!newMoment.title || newMoment.block !== block.id}
                        className="px-4 py-2 text-sm"
                      >
                        Añadir
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

*/
