import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui';
import PageWrapper from '../../components/PageWrapper';
import { Button } from '../../components/ui';
import { useUserContext } from '../../context/UserContext';

const AyudaCeremonia = () => {
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState('lecturas');
  const [readings, setReadings] = useState([
    { id: 1, title: 'Lectura 1', content: 'Texto de la primera lectura...', duration: '3 min', status: 'draft' },
    { id: 2, title: 'Evangelio', content: 'Texto del evangelio...', duration: '5 min', status: 'final' },
  ]);
  
  const [surprises, setSurprises] = useState([
    { 
      id: 1, 
      type: 'ramo', 
      recipient: 'Madre de la novia', 
      table: 'Mesa 1', 
      description: 'Ramo de rosas blancas',
      notes: 'Entregar después del primer baile',
      status: 'pending'
    },
  ]);
  
  const [activeReading, setActiveReading] = useState(null);
  const [showReadingPreview, setShowReadingPreview] = useState(false);
  const [readingPreview, setReadingPreview] = useState('');
  
  // Verificar si el usuario tiene permisos
  const canEdit = user?.role === 'wedding-planner' || user?.role === 'ayudante';
  
  const handleReadingSave = (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const title = formData.get('title');
    const content = formData.get('content');
    
    if (activeReading) {
      // Actualizar lectura existente
      setReadings(readings.map(r => 
        r.id === activeReading.id 
          ? { ...r, title, content, status: 'draft' }
          : r
      ));
    } else {
      // Crear nueva lectura
      const newReading = {
        id: Date.now(),
        title,
        content,
        duration: '5 min',
        status: 'draft'
      };
      setReadings([...readings, newReading]);
    }
    
    // Limpiar formulario
    setActiveReading(null);
    form.reset();
  };
  
  const handlePreviewReading = (content) => {
    setReadingPreview(content);
    setShowReadingPreview(true);
  };
  
  const calculateReadingTime = (text) => {
    // Estimación: 150 palabras por minuto
    const wordCount = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 150);
    return `${minutes} min`;
  };
  
  const handleContentChange = (e) => {
    const content = e.target.value;
    const duration = calculateReadingTime(content);
    
    if (activeReading) {
      setActiveReading({
        ...activeReading,
        content,
        duration
      });
    }
  };
  
  const handleAddSurprise = (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const newSurprise = {
      id: Date.now(),
      type: formData.get('type'),
      recipient: formData.get('recipient'),
      table: formData.get('table'),
      description: formData.get('description'),
      notes: formData.get('notes'),
      status: 'pending'
    };
    
    setSurprises([...surprises, newSurprise]);
    form.reset();
  };

  return (
    <PageWrapper title="Ayuda Ceremonia">
      <div className="space-y-6">
        <p className="text-gray-600">Gestiona las lecturas y momentos especiales de tu ceremonia</p>

        {/* Pestañas */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('lecturas')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lecturas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Lecturas
            </button>
            <button
              onClick={() => setActiveTab('ramos-sorpresas')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ramos-sorpresas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ramos y Sorpresas
            </button>
          </nav>
        </div>

      {/* Contenido de las pestañas */}
      {activeTab === 'lecturas' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de lecturas */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <div className="px-4 py-5 border-b">
                <h3 className="text-lg font-medium">Lecturas de la Ceremonia</h3>
              </div>
              <div className="overflow-y-auto max-h-96">
                {readings.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">No hay lecturas guardadas</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {readings.map((reading) => (
                      <li key={reading.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                        <div 
                          className="flex justify-between items-start"
                          onClick={() => setActiveReading(reading)}
                        >
                          <div>
                            <h4 className="font-medium">{reading.title}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {reading.content.substring(0, 100)}{reading.content.length > 100 ? '...' : ''}
                            </p>
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                {reading.duration}
                              </span>
                              <span className="ml-2">
                                {reading.status === 'draft' ? 'Borrador' : 'Finalizado'}
                              </span>
                            </div>
                          </div>
                          <button 
                            className="text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewReading(reading.content);
                            }}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right">
                <Button
                  onClick={() => setActiveReading({ id: null, title: '', content: '', status: 'draft' })}
                  className="text-sm"
                >
                  + Nueva Lectura
                </Button>
              </div>
            </Card>
          </div>

          {/* Editor de lecturas */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              {activeReading ? (
                <form onSubmit={handleReadingSave}>
                  <div className="px-4 py-5 border-b flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      {activeReading.id ? 'Editar Lectura' : 'Nueva Lectura'}
                    </h3>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handlePreviewReading(activeReading.content)}
                        disabled={!activeReading.content}
                      >
                        Vista Previa
                      </Button>
                      <Button type="submit" disabled={!canEdit}>
                        Guardar
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Título de la lectura
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        defaultValue={activeReading.title}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Primera Lectura - Carta de San Pablo"
                        required
                        disabled={!canEdit}
                      />
                    </div>
                    <div>
                      <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                        Contenido
                      </label>
                      <textarea
                        id="content"
                        name="content"
                        rows={12}
                        defaultValue={activeReading.content}
                        onChange={handleContentChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-serif"
                        placeholder="Escribe aquí el texto completo de la lectura..."
                        required
                        disabled={!canEdit}
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Duración estimada: {activeReading.duration}
                      </p>
                    </div>
                    {!canEdit && (
                      <div className="p-3 bg-yellow-50 text-yellow-700 text-sm rounded-md">
                        Solo los ayudantes y wedding planners pueden editar las lecturas.
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {readings.length === 0 
                      ? 'No hay lecturas disponibles' 
                      : 'Selecciona una lectura para editar'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {readings.length === 0 
                      ? 'Comienza creando tu primera lectura para la ceremonia.'
                      : 'O crea una nueva lectura para la ceremonia.'}
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => setActiveReading({ id: null, title: '', content: '', status: 'draft' })}
                      className="inline-flex items-center"
                    >
                      <svg
                        className="-ml-1 mr-2 h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Nueva Lectura
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Formulario para añadir ramo/sorpresa */}
          <Card>
            <div className="px-4 py-5 border-b">
              <h3 className="text-lg font-medium">Añadir Ramo o Sorpresa</h3>
            </div>
            <form onSubmit={handleAddSurprise} className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    id="type"
                    name="type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="ramo">Ramo</option>
                    <option value="sorpresa">Sorpresa</option>
                    <option value="detalle">Detalle Especial</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatario
                  </label>
                  <input
                    type="text"
                    id="recipient"
                    name="recipient"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Madre de la novia"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="table" className="block text-sm font-medium text-gray-700 mb-1">
                    Mesa
                  </label>
                  <input
                    type="text"
                    id="table"
                    name="table"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Mesa 1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Ramo de rosas blancas"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notas adicionales
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Instrucciones especiales o detalles importantes..."
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button type="submit">
                  Añadir a la lista
                </Button>
              </div>
            </form>
          </Card>

          {/* Lista de ramos y sorpresas */}
          <Card>
            <div className="px-4 py-5 border-b">
              <h3 className="text-lg font-medium">Lista de Ramos y Sorpresas</h3>
            </div>
            {surprises.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No hay ramos o sorpresas programados aún.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destinatario
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mesa
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {surprises.map((surprise) => (
                      <tr key={surprise.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {surprise.type === 'ramo' ? 'Ramo' : surprise.type === 'sorpresa' ? 'Sorpresa' : 'Detalle'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {surprise.recipient}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {surprise.table}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {surprise.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            surprise.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {surprise.status === 'pending' ? 'Pendiente' : 'Entregado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => {
                              // Cambiar estado de entrega
                              const updatedSurprises = surprises.map(s => 
                                s.id === surprise.id 
                                  ? { ...s, status: s.status === 'pending' ? 'delivered' : 'pending' }
                                  : s
                              );
                              setSurprises(updatedSurprises);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            {surprise.status === 'pending' ? 'Marcar como entregado' : 'Marcar como pendiente'}
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('¿Estás seguro de eliminar este elemento?')) {
                                setSurprises(surprises.filter(s => s.id !== surprise.id));
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      </div>

      {/* Modal de vista previa */}
      {showReadingPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Vista Previa de la Lectura</h3>
              <button 
                onClick={() => setShowReadingPreview(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Cerrar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{readingPreview}</p>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 text-right">
              <Button onClick={() => setShowReadingPreview(false)}>
                Cerrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
};

export default AyudaCeremonia;
