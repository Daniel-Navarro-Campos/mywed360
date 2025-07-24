import { useState, useCallback } from 'react';

/**
 * Hook personalizado para gestionar el caché de eventos detectados en emails
 * Permite almacenar y recuperar eventos detectados para evitar análisis repetitivos
 * 
 * @returns {Object} Métodos para gestionar el caché de eventos
 */
function useEventCache() {
  // Usar el almacenamiento local para persistencia entre sesiones
  const [cache, setCache] = useState(() => {
    try {
      const savedCache = localStorage.getItem('event-detection-cache');
      return savedCache ? JSON.parse(savedCache) : {};
    } catch (error) {
      console.error('Error al cargar caché de eventos:', error);
      return {};
    }
  });

  /**
   * Guarda eventos en el caché para un contenido específico
   * @param {string} contentKey - Clave única para el contenido (hash o identificador)
   * @param {Array} events - Eventos detectados para este contenido
   */
  const cacheEvents = useCallback((contentKey, events) => {
    if (!contentKey || !events || events.length === 0) return;

    // Convertir fechas a strings para almacenamiento
    const serializableEvents = events.map(event => ({
      ...event,
      date: event.date instanceof Date ? event.date.toISOString() : event.date
    }));

    // Limitar el tamaño del caché a 100 entradas para evitar problemas de almacenamiento
    const newCache = { ...cache };
    
    // Añadir nueva entrada
    newCache[contentKey] = {
      events: serializableEvents,
      timestamp: Date.now()
    };
    
    // Si el caché es demasiado grande, eliminar las entradas más antiguas
    const keys = Object.keys(newCache);
    if (keys.length > 100) {
      // Ordenar por timestamp (más antiguo primero)
      keys.sort((a, b) => newCache[a].timestamp - newCache[b].timestamp);
      
      // Eliminar las entradas más antiguas
      keys.slice(0, keys.length - 100).forEach(key => {
        delete newCache[key];
      });
    }
    
    // Actualizar estado y almacenamiento local
    setCache(newCache);
    
    try {
      localStorage.setItem('event-detection-cache', JSON.stringify(newCache));
    } catch (error) {
      console.error('Error al guardar caché de eventos:', error);
    }
  }, [cache]);

  /**
   * Recupera eventos del caché para un contenido específico
   * @param {string} contentKey - Clave única para el contenido
   * @returns {Array|null} Eventos cacheados o null si no existen
   */
  const getCachedEvents = useCallback((contentKey) => {
    if (!contentKey || !cache[contentKey]) return null;
    
    // Comprobar si la caché ha expirado (más de 24 horas)
    const cacheEntry = cache[contentKey];
    const cacheAge = Date.now() - cacheEntry.timestamp;
    const cacheExpired = cacheAge > 24 * 60 * 60 * 1000; // 24 horas
    
    if (cacheExpired) {
      // Eliminar entrada expirada
      const newCache = { ...cache };
      delete newCache[contentKey];
      setCache(newCache);
      
      try {
        localStorage.setItem('event-detection-cache', JSON.stringify(newCache));
      } catch (error) {
        console.error('Error al actualizar caché de eventos:', error);
      }
      
      return null;
    }
    
    // Convertir fechas de strings a objetos Date
    return cacheEntry.events.map(event => ({
      ...event,
      date: new Date(event.date)
    }));
  }, [cache]);

  /**
   * Limpia todo el caché de eventos
   */
  const clearCache = useCallback(() => {
    setCache({});
    try {
      localStorage.removeItem('event-detection-cache');
    } catch (error) {
      console.error('Error al limpiar caché de eventos:', error);
    }
  }, []);

  return {
    getCachedEvents,
    cacheEvents,
    clearCache
  };
}

export default useEventCache;
