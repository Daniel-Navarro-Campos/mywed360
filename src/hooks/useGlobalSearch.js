import { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

/**
 * Hook personalizado para la búsqueda global en la aplicación
 * Permite buscar simultáneamente en emails, eventos y proveedores
 * Implementa optimizaciones de rendimiento como memoización y debounce
 * 
 * @param {Object} options Opciones de configuración
 * @param {Function} options.fetchEmails Función para obtener emails
 * @param {Function} options.fetchEvents Función para obtener eventos
 * @param {Function} options.fetchProviders Función para obtener proveedores
 * @param {number} options.debounceMs Tiempo de debounce en milisegundos (por defecto: 300ms)
 * @param {number} options.maxResults Número máximo de resultados por categoría (por defecto: 5)
 * @returns {Object} Estado y funciones para la búsqueda global
 */
export default function useGlobalSearch({
  fetchEmails,
  fetchEvents,
  fetchProviders,
  debounceMs = 300,
  maxResults = 5
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    emails: [],
    events: [],
    providers: [],
    loading: false
  });
  const [activeTab, setActiveTab] = useState('all');
  const [allData, setAllData] = useState({
    emails: [],
    events: [],
    providers: [],
    initialized: false
  });

  // Función para cargar todos los datos iniciales (una sola vez)
  const initializeData = useCallback(async () => {
    if (allData.initialized) return;
    
    setResults(prev => ({ ...prev, loading: true }));
    
    try {
      const [emails, events, providers] = await Promise.all([
        fetchEmails(),
        fetchEvents(),
        fetchProviders()
      ]);
      
      setAllData({
        emails: emails || [],
        events: events || [],
        providers: providers || [],
        initialized: true
      });
    } catch (error) {
      console.error('Error al inicializar datos para búsqueda global:', error);
    } finally {
      setResults(prev => ({ ...prev, loading: false }));
    }
  }, [fetchEmails, fetchEvents, fetchProviders, allData.initialized]);

  useEffect(() => {
    // Inicializar datos solo cuando se monta el componente
    initializeData();
  }, [initializeData]);

  // Función de búsqueda optimizada con memoización para evitar cálculos repetidos
  const searchInData = useCallback((data, searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    return data.filter(item => {
      // Adaptamos la búsqueda según el tipo de item
      if ('subject' in item) { // Es un email
        return (
          item.subject?.toLowerCase().includes(normalizedQuery) ||
          item.body?.toLowerCase().includes(normalizedQuery) ||
          item.from?.toLowerCase().includes(normalizedQuery) ||
          item.to?.toLowerCase().includes(normalizedQuery)
        );
      } else if ('title' in item) { // Es un evento
        return (
          item.title?.toLowerCase().includes(normalizedQuery) ||
          item.description?.toLowerCase().includes(normalizedQuery) ||
          item.location?.toLowerCase().includes(normalizedQuery)
        );
      } else { // Es un proveedor u otro
        return (
          item.name?.toLowerCase().includes(normalizedQuery) ||
          item.type?.toLowerCase().includes(normalizedQuery) ||
          item.description?.toLowerCase().includes(normalizedQuery) ||
          item.contact?.toLowerCase().includes(normalizedQuery)
        );
      }
    }).slice(0, maxResults);
  }, [maxResults]);

  // Memo para resultados de emails
  const filteredEmails = useMemo(() => {
    return query ? searchInData(allData.emails, query) : [];
  }, [query, allData.emails, searchInData]);

  // Memo para resultados de eventos
  const filteredEvents = useMemo(() => {
    return query ? searchInData(allData.events, query) : [];
  }, [query, allData.events, searchInData]);

  // Memo para resultados de proveedores
  const filteredProviders = useMemo(() => {
    return query ? searchInData(allData.providers, query) : [];
  }, [query, allData.providers, searchInData]);

  // Función debounced para actualizar resultados
  const debouncedSearch = useCallback(
    debounce((searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults({
          emails: [],
          events: [],
          providers: [],
          loading: false
        });
        return;
      }

      // Actualizamos los resultados según la pestaña activa
      setResults({
        emails: activeTab === 'all' || activeTab === 'emails' ? filteredEmails : [],
        events: activeTab === 'all' || activeTab === 'events' ? filteredEvents : [],
        providers: activeTab === 'all' || activeTab === 'providers' ? filteredProviders : [],
        loading: false
      });
    }, debounceMs),
    [activeTab, filteredEmails, filteredEvents, filteredProviders, debounceMs]
  );

  // Efecto para activar la búsqueda cuando cambia la consulta
  useEffect(() => {
    if (query) {
      setResults(prev => ({ ...prev, loading: true }));
      debouncedSearch(query);
    } else {
      setResults({
        emails: [],
        events: [],
        providers: [],
        loading: false
      });
    }
  }, [query, debouncedSearch]);

  // Efecto para actualizar resultados cuando cambia la pestaña
  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    }
  }, [activeTab, debouncedSearch, query]);

  // Función para manejar el cambio de consulta
  const handleQueryChange = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []);

  // Función para manejar el cambio de pestaña
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // Función para limpiar la búsqueda
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults({
      emails: [],
      events: [],
      providers: [],
      loading: false
    });
  }, []);

  // Estadísticas de resultados
  const stats = useMemo(() => ({
    total: results.emails.length + results.events.length + results.providers.length,
    emails: results.emails.length,
    events: results.events.length,
    providers: results.providers.length
  }), [results.emails.length, results.events.length, results.providers.length]);

  return {
    query,
    results,
    activeTab,
    stats,
    loading: results.loading,
    handleQueryChange,
    handleTabChange,
    clearSearch,
    initialized: allData.initialized
  };
}
