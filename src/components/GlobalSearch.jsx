import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Mail, Calendar, User, X, ChevronRight, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import * as EmailService from '../services/EmailService';
import * as ProveedorService from '../services/ProveedorService';

/**
 * Componente de búsqueda global que permite buscar en emails, eventos y proveedores
 * desde un único punto de acceso en la aplicación
 * 
 * @returns {React.ReactElement} Componente de búsqueda global
 */
const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState({
    emails: [],
    events: [],
    providers: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState('all');
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const navigate = useNavigate();
  
  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Manejar teclas de navegación
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => {
            const flatResults = getFlatResults();
            return Math.min(prev + 1, flatResults.length - 1);
          });
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => Math.max(prev - 1, -1));
          break;
          
        case 'Enter':
          e.preventDefault();
          const flatResults = getFlatResults();
          if (activeIndex >= 0 && activeIndex < flatResults.length) {
            handleSelectResult(flatResults[activeIndex]);
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
          
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, activeIndex]);
  
  // Desplazar al elemento seleccionado
  useEffect(() => {
    if (activeIndex >= 0 && resultsRef.current) {
      const activeElement = resultsRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);
  
  // Aplanar resultados para navegación por teclado
  const getFlatResults = () => {
    const flat = [];
    
    if (selectedSection === 'all' || selectedSection === 'emails') {
      results.emails.forEach(item => flat.push({ ...item, type: 'email' }));
    }
    
    if (selectedSection === 'all' || selectedSection === 'events') {
      results.events.forEach(item => flat.push({ ...item, type: 'event' }));
    }
    
    if (selectedSection === 'all' || selectedSection === 'providers') {
      results.providers.forEach(item => flat.push({ ...item, type: 'provider' }));
    }
    
    return flat;
  };
  
  // Función de búsqueda con debounce para mejorar rendimiento
  const performSearch = useCallback(
    debounce(async (term) => {
      if (!term || term.trim().length < 2) {
        setResults({ emails: [], events: [], providers: [] });
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Búsqueda en paralelo en diferentes servicios
        const [emailResults, eventResults, providerResults] = await Promise.all([
          EmailService.searchEmails(term),
          EmailService.searchEvents(term),
          ProveedorService.searchProviders(term)
        ]);
        
        setResults({
          emails: emailResults.slice(0, 5),
          events: eventResults.slice(0, 5),
          providers: providerResults.slice(0, 5)
        });
        
      } catch (error) {
        console.error('Error en búsqueda global:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );
  
  // Actualizar resultados al cambiar el término de búsqueda
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      performSearch(searchTerm);
    }
  }, [searchTerm, isOpen, performSearch]);
  
  // Abrir el buscador
  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };
  
  // Manejar cambios en el campo de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setActiveIndex(-1);
  };
  
  // Seleccionar un resultado
  const handleSelectResult = (item) => {
    switch (item.type) {
      case 'email':
        navigate(`/buzon/${item.id}`);
        break;
      case 'event':
        navigate(`/calendario/evento/${item.id}`);
        break;
      case 'provider':
        navigate(`/proveedores/${item.id}`);
        break;
      default:
        break;
    }
    
    setIsOpen(false);
    setSearchTerm('');
  };
  
  // Formatear fecha para mostrar
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Resaltar coincidencias en el texto
  const highlightMatch = (text, term) => {
    if (!text || !term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} className="bg-yellow-200 rounded-sm">{part}</mark> : part
    );
  };
  
  // Total de resultados
  const totalResults = results.emails.length + results.events.length + results.providers.length;
  
  return (
    <div className="relative z-50" ref={searchRef}>
      {/* Botón de búsqueda */}
      <button
        onClick={handleOpen}
        className="flex items-center text-gray-600 hover:text-gray-900 focus:outline-none"
        aria-label="Buscar en Lovenda"
      >
        <Search size={20} />
        <span className="ml-2 hidden md:inline">Buscar</span>
      </button>
      
      {/* Modal de búsqueda */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-start justify-center pt-16 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Cabecera y campo de búsqueda */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar emails, eventos, proveedores..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              {/* Pestañas de filtrado */}
              <div className="flex mt-3 border-b border-gray-200">
                <button
                  onClick={() => setSelectedSection('all')}
                  className={`px-3 py-2 text-sm font-medium ${
                    selectedSection === 'all' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Todo
                </button>
                <button
                  onClick={() => setSelectedSection('emails')}
                  className={`px-3 py-2 text-sm font-medium flex items-center ${
                    selectedSection === 'emails' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Mail size={16} className="mr-1" />
                  Emails
                </button>
                <button
                  onClick={() => setSelectedSection('events')}
                  className={`px-3 py-2 text-sm font-medium flex items-center ${
                    selectedSection === 'events' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Calendar size={16} className="mr-1" />
                  Eventos
                </button>
                <button
                  onClick={() => setSelectedSection('providers')}
                  className={`px-3 py-2 text-sm font-medium flex items-center ${
                    selectedSection === 'providers' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <User size={16} className="mr-1" />
                  Proveedores
                </button>
              </div>
            </div>
            
            {/* Contenido de resultados */}
            <div className="overflow-y-auto flex-grow" ref={resultsRef}>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : searchTerm.length < 2 ? (
                <div className="text-center p-8 text-gray-500">
                  Escribe al menos 2 caracteres para buscar
                </div>
              ) : totalResults === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  No se encontraron resultados para "{searchTerm}"
                </div>
              ) : (
                <>
                  {/* Resultados de Emails */}
                  {(selectedSection === 'all' || selectedSection === 'emails') && results.emails.length > 0 && (
                    <div className="px-4 py-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                        <Mail size={14} className="mr-1" />
                        Emails ({results.emails.length})
                      </h3>
                      <ul className="space-y-1">
                        {results.emails.map((email, index) => {
                          // Calcular índice global
                          const globalIndex = selectedSection === 'all' ? index : index;
                          
                          return (
                            <li 
                              key={email.id}
                              onClick={() => handleSelectResult({ ...email, type: 'email' })}
                              className={`p-2 rounded-md cursor-pointer transition ${
                                activeIndex === globalIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                              data-index={globalIndex}
                            >
                              <div className="flex justify-between">
                                <div className="font-medium">
                                  {highlightMatch(email.subject || '(Sin asunto)', searchTerm)}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center">
                                  <Clock size={12} className="mr-1" />
                                  {formatDate(email.date)}
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 truncate">
                                {email.from && (
                                  <span className="mr-1">
                                    De: {highlightMatch(email.from, searchTerm)}
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  
                  {/* Resultados de Eventos */}
                  {(selectedSection === 'all' || selectedSection === 'events') && results.events.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                        <Calendar size={14} className="mr-1" />
                        Eventos ({results.events.length})
                      </h3>
                      <ul className="space-y-1">
                        {results.events.map((event, index) => {
                          // Calcular índice global
                          const globalIndex = selectedSection === 'all' 
                            ? results.emails.length + index
                            : index;
                            
                          return (
                            <li 
                              key={event.id}
                              onClick={() => handleSelectResult({ ...event, type: 'event' })}
                              className={`p-2 rounded-md cursor-pointer transition ${
                                activeIndex === globalIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                              data-index={globalIndex}
                            >
                              <div className="font-medium">
                                {highlightMatch(event.title, searchTerm)}
                              </div>
                              <div className="text-sm text-gray-600 flex items-center">
                                <Calendar size={14} className="mr-1 text-blue-500" />
                                <span>
                                  {new Date(event.dateTime).toLocaleDateString('es-ES')} - {new Date(event.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {event.location && (
                                <div className="text-sm text-gray-600 truncate">
                                  {highlightMatch(event.location, searchTerm)}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  
                  {/* Resultados de Proveedores */}
                  {(selectedSection === 'all' || selectedSection === 'providers') && results.providers.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                        <User size={14} className="mr-1" />
                        Proveedores ({results.providers.length})
                      </h3>
                      <ul className="space-y-1">
                        {results.providers.map((provider, index) => {
                          // Calcular índice global
                          const globalIndex = selectedSection === 'all' 
                            ? results.emails.length + results.events.length + index
                            : index;
                            
                          return (
                            <li 
                              key={provider.id}
                              onClick={() => handleSelectResult({ ...provider, type: 'provider' })}
                              className={`p-2 rounded-md cursor-pointer transition ${
                                activeIndex === globalIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                              data-index={globalIndex}
                            >
                              <div className="font-medium">
                                {highlightMatch(provider.name, searchTerm)}
                              </div>
                              {provider.type && (
                                <div className="text-sm text-gray-600">
                                  {highlightMatch(provider.type, searchTerm)}
                                </div>
                              )}
                              {provider.contact && (
                                <div className="text-sm text-gray-600 truncate">
                                  {highlightMatch(provider.contact, searchTerm)}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Pie de resultados */}
            {!isLoading && searchTerm.length >= 2 && totalResults > 0 && (
              <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                Usa ↑↓ para navegar, Enter para seleccionar
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
