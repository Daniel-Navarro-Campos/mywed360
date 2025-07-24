/**
 * Hook personalizado para monitoreo de operaciones de email y plantillas
 * 
 * Este hook facilita la integración del monitoreo de rendimiento con los componentes
 * relacionados con emails y plantillas, proporcionando métodos específicos para
 * diferentes operaciones comunes en el sistema de emails.
 * 
 * @module hooks/useEmailMonitoring
 */

import { useCallback } from 'react';
import { performanceMonitor } from '../services/PerformanceMonitor';

/**
 * Hook para monitorear operaciones relacionadas con emails y plantillas
 * @returns {Object} Métodos para monitorear diferentes aspectos del sistema de emails
 */
export function useEmailMonitoring() {
  /**
   * Medir el rendimiento del renderizado de una plantilla
   * @param {string} templateId - ID de la plantilla
   * @param {Object} templateData - Datos para renderizar la plantilla
   * @param {Function} renderFn - Función de renderizado
   * @returns {Promise<any>} Resultado del renderizado
   */
  const measureTemplateRendering = useCallback(async (templateId, templateData, renderFn) => {
    // Calcular tamaño aproximado de los datos de plantilla
    const dataSize = JSON.stringify(templateData).length;
    
    return performanceMonitor.monitorTemplateRendering(templateId, dataSize, renderFn);
  }, []);
  
  /**
   * Registrar uso de una plantilla
   * @param {string} templateId - ID de la plantilla
   * @param {string} category - Categoría de la plantilla
   * @param {string} action - Acción realizada (view, edit, use, create)
   * @param {Function} fn - Función a ejecutar
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<any>} Resultado de la función
   */
  const trackTemplateUsage = useCallback(async (templateId, category, action, fn, metadata = {}) => {
    return performanceMonitor.monitorTemplateUsage(templateId, category, action, fn, metadata);
  }, []);
  
  /**
   * Monitorear el envío de un email
   * @param {string} emailId - ID del email
   * @param {string} recipientType - Tipo de destinatario
   * @param {string} templateId - ID de la plantilla (si aplica)
   * @param {Function} sendFn - Función de envío
   * @returns {Promise<any>} Resultado del envío
   */
  const trackEmailSend = useCallback(async (emailId, recipientType, templateId, sendFn) => {
    return performanceMonitor.monitorEmailDelivery(emailId, recipientType, sendFn, {
      templateId,
      operation: 'send'
    });
  }, []);
  
  /**
   * Registrar interacción con un email
   * @param {string} emailId - ID del email
   * @param {string} interactionType - Tipo de interacción (open, click, etc)
   * @param {Object} metadata - Metadatos adicionales
   */
  const trackInteraction = useCallback((emailId, interactionType, metadata = {}) => {
    performanceMonitor.trackEmailInteraction(emailId, interactionType, metadata);
  }, []);
  
  /**
   * Monitorear operación general del sistema de emails
   * @param {string} operation - Nombre de la operación
   * @param {Function} fn - Función a monitorear
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<any>} Resultado de la operación
   */
  const trackEmailOperation = useCallback(async (operation, fn, metadata = {}) => {
    return performanceMonitor.monitorEmailOperation(operation, fn, metadata);
  }, []);
  
  /**
   * Monitorear la búsqueda de plantillas
   * @param {string} query - Consulta de búsqueda
   * @param {string} category - Categoría de plantilla (opcional)
   * @param {Function} searchFn - Función de búsqueda
   * @returns {Promise<any>} Resultados de la búsqueda
   */
  const trackTemplateSearch = useCallback(async (query, category, searchFn) => {
    return performanceMonitor.monitorSearch(query, searchFn, {
      type: 'template_search',
      category
    });
  }, []);
  
  /**
   * Monitorear el rendimiento de la caché de plantillas
   * @param {string} operation - Operación realizada (get, set, hit, miss)
   * @param {number} durationMs - Duración en milisegundos (si aplica)
   * @param {Object} metadata - Metadatos adicionales (templateId, category, etc.)
   * @returns {void}
   */
  const measureCachePerformance = useCallback((operation, durationMs = 0, metadata = {}) => {
    performanceMonitor.trackMetric({
      category: 'cache',
      action: 'template_cache_' + operation,
      value: durationMs,
      ...metadata
    });
    
    // Registrar eventos específicos para análisis de patrón de uso
    if (operation === 'hit' || operation === 'miss') {
      performanceMonitor.logEvent('template_cache_access', {
        result: operation,
        duration: durationMs,
        templateId: metadata.templateId || 'unknown',
        category: metadata.category || 'unknown',
        source: metadata.source || 'memory',
        timestamp: Date.now()
      });
    }
  }, []);

  /**
   * Registrar un error relacionado con emails
   * @param {string} errorType - Tipo específico de error
   * @param {Error|string} error - Error ocurrido
   * @param {Object} context - Contexto adicional
   */
  const logEmailError = useCallback((errorType, error, context = {}) => {
    performanceMonitor.logError(`email_${errorType}`, error, context);
  }, []);

  return {
    measureTemplateRendering,
    trackTemplateUsage,
    trackEmailSend,
    trackInteraction,
    trackEmailOperation,
    trackTemplateSearch,
    logEmailError
  };
}

export default useEmailMonitoring;
