import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import Button from '../../../components/Button';
import AIResultList from './AIResultList';

/**
 * @typedef {import('../../../hooks/useAISearch').AISearchResult} AISearchResult
 */

/**
 * Modal de búsqueda inteligente de proveedores con IA.
 * Permite realizar búsquedas en lenguaje natural, muestra sugerencias,
 * guarda historial de búsquedas y presenta los resultados en forma de lista.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Indica si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onSearch - Función para realizar la búsqueda (recibe el query)
 * @param {Function} props.onSelect - Función para seleccionar un resultado
 * @param {boolean} props.isLoading - Indica si la búsqueda está en progreso
 * @returns {React.ReactElement|null} Modal de búsqueda con IA o null si no está abierto
 */
const AISearchModal = ({ isOpen, onClose, onSearch, onSelect, isLoading }) => {
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  useEffect(() => {
    // Cargar historial de búsqueda previo si existe en localStorage
    const savedHistory = localStorage.getItem('ai_search_history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error parsing search history', e);
      }
    }
    
    // Ejemplos de sugerencias de búsqueda predefinidas
    setSuggestions([
      'Fotógrafo de bodas estilo documental',
      'Catering para evento de 100 personas con opciones vegetarianas',
      'DJ con experiencia en bodas y disponible para agosto',
      'Floristería especializada en decoración vintage',
      'Lugar para ceremonia al aire libre cerca de Madrid'
    ]);
    
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);
  
  // Guardar historial de búsqueda en localStorage
  const saveSearchToHistory = useCallback((searchTerm) => {
    const updatedHistory = [
      searchTerm,
      ...searchHistory.filter(item => item !== searchTerm).slice(0, 9)
    ];
    setSearchHistory(updatedHistory);
    localStorage.setItem('ai_search_history', JSON.stringify(updatedHistory));
  }, [searchHistory]);
  
  // Manejar envío de búsqueda
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (query.trim()) {
      saveSearchToHistory(query);
      onSearch(query);
    }
  }, [query, saveSearchToHistory, onSearch]);
  
  // Realizar búsqueda con retraso para evitar consultas excesivas mientras el usuario escribe
  const handleQueryChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (value.trim() && value.length > 2) {
      const timeout = setTimeout(() => {
        onSearch(value);
      }, 500); // Esperar 500ms antes de buscar
      setSearchTimeout(timeout);
    }
  }, [searchTimeout, onSearch]);
  
  // Seleccionar una búsqueda del historial o sugerencias
  const selectQuery = (selectedQuery) => {
    setQuery(selectedQuery);
    saveSearchToHistory(selectedQuery);
    onSearch(selectedQuery);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="ai-search-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <Sparkles size={20} className="mr-2 text-blue-500" />
            Búsqueda inteligente de proveedores
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Formulario de búsqueda */}
        <div className="p-4 border-b">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <input
                data-testid="ai-search-input"
                type="text"
                value={query}
                onChange={handleQueryChange}
                placeholder="Describe lo que estás buscando en lenguaje natural..."
                className="w-full p-3 pl-10 pr-24 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <Button
                data-testid="ai-search-button"
                type="submit"
                className="absolute right-2 top-1.5"
                size="sm"
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
            
            <p className="mt-2 text-sm text-gray-500">
              Ejemplo: "Busco un fotógrafo de estilo natural para una boda en la playa"
            </p>
          </form>
        </div>
        
        {/* Contenido principal */}
        <div className="flex flex-1 overflow-hidden">
          {/* Panel lateral con historial y sugerencias */}
          <div className="w-64 p-4 border-r overflow-y-auto">
            {/* Historial de búsqueda */}
            {searchHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Búsquedas recientes
                </h3>
                <ul className="space-y-1">
                  {searchHistory.map((item, index) => (
                    <li key={index}>
                      <button
                        onClick={() => selectQuery(item)}
                        className="text-sm text-left w-full p-1.5 hover:bg-gray-100 rounded-md truncate"
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => {
                        setSearchHistory([]);
                        localStorage.removeItem('ai_search_history');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                      Borrar historial
                    </button>
                  </li>
                </ul>
              </div>
            )}
            
            {/* Sugerencias de búsqueda */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Sugerencias
              </h3>
              <ul className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <button
                      onClick={() => selectQuery(suggestion)}
                      className="text-sm text-left w-full p-1.5 hover:bg-gray-100 rounded-md truncate"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Área de resultados */}
          <div className="flex-1 overflow-y-auto p-4">
            <AIResultList 
              isLoading={isLoading}
              onSelect={onSelect}
              query={query}
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Powered by IA - Resultados basados en tu consulta
          </div>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AISearchModal;
