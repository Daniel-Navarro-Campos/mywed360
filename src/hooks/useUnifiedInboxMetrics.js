/**
 * Hook personalizado para monitorear métricas de rendimiento de la bandeja unificada
 * 
 * Proporciona funciones especializadas para registrar y analizar el rendimiento
 * de las operaciones más comunes en la bandeja unificada de emails
 * 
 * @module hooks/useUnifiedInboxMetrics
 */

import { useCallback } from 'react';
import { performanceMonitor } from '../services/PerformanceMonitor';
import { useEmailMonitoring } from './useEmailMonitoring';

/**
 * Hook para monitorear rendimiento y uso de la bandeja unificada
 * @returns {Object} Métodos para monitorear diferentes aspectos de la bandeja
 */
export function useUnifiedInboxMetrics() {
  const { trackEmailOperation } = useEmailMonitoring();
  
  /**
   * Registrar tiempo de carga de la vista principal
   * @param {string} folder - Carpeta que se está cargando
   * @param {number} emailCount - Cantidad de emails cargados
   * @param {number} loadTimeMs - Tiempo de carga en milisegundos
   */
  const logInitialLoad = useCallback((folder, emailCount, loadTimeMs) => {
    performanceMonitor.logEvent('unified_inbox_load', {
      folder,
      emailCount,
      loadTimeMs,
      timestamp: Date.now()
    });
  }, []);
  
  /**
   * Registrar tiempo de búsqueda y filtrado
   * @param {string} query - Consulta de búsqueda
   * @param {number} resultCount - Cantidad de resultados
   * @param {number} searchTimeMs - Tiempo de búsqueda en milisegundos
   */
  const logSearch = useCallback((query, resultCount, searchTimeMs) => {
    performanceMonitor.logEvent('unified_inbox_search', {
      queryLength: query.length,
      resultCount,
      searchTimeMs,
      timestamp: Date.now()
    });
  }, []);
  
  /**
   * Registrar tiempo de renderizado detallado de un email
   * @param {string} emailId - ID del email visualizado
   * @param {boolean} hasAttachments - Si el email tiene adjuntos
   * @param {number} contentLength - Longitud del contenido del email
   * @param {number} renderTimeMs - Tiempo de renderizado en milisegundos
   */
  const logEmailRender = useCallback((emailId, hasAttachments, contentLength, renderTimeMs) => {
    performanceMonitor.logEvent('unified_inbox_email_render', {
      emailId,
      hasAttachments,
      contentLength,
      renderTimeMs,
      timestamp: Date.now()
    });
  }, []);
  
  /**
   * Registrar interacciones del usuario con la bandeja
   * @param {string} actionType - Tipo de acción (click, scroll, filter, etc)
   * @param {Object} details - Detalles adicionales de la acción
   */
  const logUserInteraction = useCallback((actionType, details = {}) => {
    performanceMonitor.logEvent('unified_inbox_interaction', {
      actionType,
      ...details,
      timestamp: Date.now()
    });
  }, []);
  
  /**
   * Registrar métricas de caché de la bandeja
   * @param {string} operation - Operación (hit, miss, set)
   * @param {string} key - Clave de caché
   * @param {number} sizeBytes - Tamaño en bytes (aproximado)
   * @param {number} durationMs - Duración de la operación
   */
  const logCacheOperation = useCallback((operation, key, sizeBytes, durationMs) => {
    performanceMonitor.logEvent('unified_inbox_cache', {
      operation,
      key,
      sizeBytes,
      durationMs,
      timestamp: Date.now()
    });
  }, []);
  
  return {
    logInitialLoad,
    logSearch,
    logEmailRender,
    logUserInteraction,
    logCacheOperation,
    trackEmailOperation
  };
}
