import React, { useState } from 'react';
import { Check, Plus, ArrowRight, Loader2, Mail } from 'lucide-react';
import Button from '../../../components/Button';
import Card from '../../../components/Card';

/**
 * @typedef {import('../../../hooks/useAISearch').AISearchResult} AISearchResult
 */

/**
 * Componente que muestra los resultados de búsqueda con IA de proveedores.
 * Presenta una lista de resultados con porcentaje de coincidencia, acciones rápidas
 * y estados de carga. También muestra mensajes de error si los hubiera.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {AISearchResult[]} [props.results=[]] - Resultados de la búsqueda con IA
 * @param {boolean} props.isLoading - Indica si la búsqueda está en progreso
 * @param {Function} props.onSelect - Función para seleccionar un resultado
 * @param {string} props.query - Término de búsqueda original
 * @param {string} [props.error] - Mensaje de error, si existe
 * @returns {React.ReactElement} Componente de lista de resultados de búsqueda con IA
 */
const AIResultList = ({ results = [], isLoading, onSelect, query, error }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin mb-4">
          <Loader2 size={40} className="text-blue-500" />
        </div>
        <p className="text-lg font-medium text-gray-700">Buscando proveedores...</p>
        <p className="text-sm text-gray-500 mt-2">
          Analizando tu consulta: "{query}"
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="p-3 rounded-full bg-red-100 mb-4">
          <X size={24} className="text-red-500" />
        </div>
        <p className="text-lg font-medium text-gray-700">Error al buscar</p>
        <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
          {error}
        </p>
        <Button className="mt-4" size="sm" variant="outline">
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  if (!results.length && query) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg font-medium text-gray-700">No se encontraron resultados</p>
        <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
          Intenta reformular tu búsqueda o utilizar términos más generales
        </p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="p-3 rounded-full bg-blue-100 mb-4">
          <Search size={24} className="text-blue-500" />
        </div>
        <p className="text-lg font-medium text-gray-700">Busca proveedores con IA</p>
        <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
          Describe lo que buscas en lenguaje natural y la IA encontrará los proveedores más adecuados
        </p>
      </div>
    );
  }

  // Ejemplo de datos para mostrar en modo de demostración
  const demoResults = [
    {
      id: 1,
      name: 'Fotografía Naturaleza Viva',
      service: 'Fotografía',
      snippet: 'Estudio especializado en fotografía de bodas con estilo natural y documental. Captamos los momentos más emotivos y espontáneos de tu boda.',
      match: 95,
      image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fHdlZGRpbmclMjBwaG90b2dyYXBoeXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
      location: 'Madrid',
      price: '1200€ - 2500€',
      aiSummary: 'Este fotógrafo tiene un estilo natural y documental perfecto para bodas en exteriores. Sus imágenes capturen momentos espontáneos con iluminación natural, ideal para lo que buscas.'
    },
    {
      id: 2,
      name: 'Lente Azul Fotografía',
      service: 'Fotografía',
      snippet: 'Más de 10 años de experiencia en fotografía de bodas en playa y espacios naturales. Ofrecemos paquetes personalizados para cada pareja.',
      match: 87,
      image: 'https://images.unsplash.com/photo-1508435234994-67cfd7690508?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Nnx8d2VkZGluZyUyMHBob3RvZ3JhcGh5fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
      location: 'Barcelona',
      price: '1500€ - 3000€',
      aiSummary: 'Especialistas en bodas en la playa con un estilo luminoso y natural. Su portfolio muestra una gran experiencia en entornos costeros y saben aprovechar la luz natural.'
    },
    {
      id: 3,
      name: 'Momentos Eternos',
      service: 'Fotografía',
      snippet: 'Fotografía de autor para bodas con estilo único. Combinamos fotografía documental con retratos artísticos para crear un álbum inolvidable.',
      match: 79,
      image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTR8fHdlZGRpbmclMjBwaG90b2dyYXBoeXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
      location: 'Valencia',
      price: '1000€ - 2000€',
      aiSummary: 'Ofrece un enfoque artístico con elementos documentales. Aunque su estilo es más estilizado que puramente natural, tiene experiencia en bodas al aire libre.'
    }
  ];

  // Usar datos reales si están disponibles, o los datos de demostración
  const displayResults = results.length > 0 ? results : demoResults;

  return (
    <div className="space-y-6" data-testid="ai-results-list">
      {/* Resumen de la búsqueda */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          Se encontraron <span className="font-medium">{displayResults.length}</span> proveedores para tu búsqueda:
        </p>
        <p className="text-lg font-medium">"{query}"</p>
      </div>

      {/* Lista de resultados */}
      {displayResults.map((result) => (
        <Card key={result.id} className="relative overflow-hidden">
          {/* Indicador de porcentaje de coincidencia */}
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            {result.match}% match
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Imagen */}
            {result.image && (
              <div className="w-full md:w-32 h-32 flex-shrink-0 overflow-hidden rounded-md">
                <img
                  src={result.image}
                  alt={result.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Contenido principal */}
            <div className="flex-1">
              <div className="flex flex-wrap justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{result.name}</h3>
                  <p className="text-sm text-gray-600">{result.service}</p>
                </div>
                {result.price && (
                  <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                    {result.price}
                  </span>
                )}
              </div>

              {result.location && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Ubicación:</span> {result.location}
                </p>
              )}

              <p className="text-sm text-gray-700 mb-3">{result.snippet}</p>

              {/* Análisis de IA */}
              {result.aiSummary && (
                <div className="bg-blue-50 p-3 rounded-md mb-3">
                  <p className="text-xs font-semibold text-blue-600 mb-1">Análisis de IA</p>
                  <p className="text-sm text-gray-700">{result.aiSummary}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  onClick={() => onSelect(result, 'view')}
                  variant="outline"
                  size="sm"
                >
                  <ArrowRight size={16} className="mr-1" /> Ver detalles
                </Button>
                <Button
                  onClick={() => onSelect(result, 'add')}
                  size="sm"
                >
                  <Plus size={16} className="mr-1" /> Añadir
                </Button>
                <Button
                  onClick={() => onSelect(result, 'email')}
                  variant="outline"
                  size="sm"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  data-testid="email-provider-btn"
                >
                  <Mail size={16} className="mr-1" /> Enviar email
                </Button>
                <Button
                  onClick={() => onSelect(result, 'select')}
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Check size={16} className="mr-1" /> Seleccionar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Optimizar renderizado con React.memo
export default React.memo(AIResultList, (prevProps, nextProps) => {
  // Solo re-renderizar si cambia alguno de estos valores
  return (
    prevProps.results?.length === nextProps.results?.length &&
    JSON.stringify(prevProps.results) === JSON.stringify(nextProps.results) &&
    prevProps.onSelect === nextProps.onSelect
  );
});
