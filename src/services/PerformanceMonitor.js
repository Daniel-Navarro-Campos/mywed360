/**
 * Servicio de monitoreo de rendimiento para la aplicación Lovenda
 * 
 * Este servicio permite monitorizar el rendimiento de diferentes componentes
 * y funcionalidades críticas, especialmente el sistema de emails personalizados.
 */

// Detectar entorno de test para desactivar métricas automáticamente
const IS_TEST_ENV = (typeof globalThis !== 'undefined' && globalThis?.vitest) || process?.env?.VITEST || process?.env?.NODE_ENV === 'test';

// Configuración para el monitoreo
const CONFIG = {
  // Activar/desactivar el monitoreo
  enabled: !IS_TEST_ENV,
  
  // Nivel de detalle del monitoreo
  // 0: solo errores críticos
  // 1: errores y advertencias
  // 2: información general
  // 3: información detallada
  logLevel: 2,
  
  // Intervalo para enviar métricas al servidor (ms)
  reportInterval: 60000, // 1 minuto
  
  // URL del endpoint para enviar métricas
  reportUrl: import.meta.env.VITE_METRICS_ENDPOINT || '',
  
  // Tamaño máximo de la cola de eventos antes de enviar
  batchSize: 20,
  
  // Métricas a recopilar
  metrics: {
    emailProcessing: true,
    searchPerformance: true,
    notificationsRendering: true,
    eventDetection: true,
    uiInteractions: true
  }
};

// Clase para el monitoreo de rendimiento
class PerformanceMonitor {
  constructor(config = CONFIG) {
    this.config = {
      ...CONFIG,
      ...config
    };

    // Desactivar monitor en entornos de test (Vitest/CI) para evitar handles abiertos
    const isTestEnv = (typeof process !== 'undefined' && process.env?.VITEST) || (import.meta.env?.MODE === 'test');
    if (isTestEnv) {
      this.config.enabled = false;
    }
    
    this.metrics = {
      events: [],
      errors: [],
      timings: {},
      counters: {},
    };
    
    this.enabled = this.config.enabled;

    // Si está deshabilitado en entorno de test, salir temprano para evitar timers
    if (!this.enabled) {
      return;
    }
    this.pendingFlush = false;
    this.startTime = Date.now();
    
    if (this.enabled && this.config.reportInterval) {
      this.scheduleReporting();
    }
    
    // Registrar evento de inicialización
    this.logEvent('monitor_init', {
      version: import.meta.env.VITE_APP_VERSION || 'dev',
      metrics_enabled: this.config.metrics,
      log_level: this.config.logLevel
    });
    
    console.info('🔍 Monitor de rendimiento inicializado');
  }
  
  /**
   * Activar o desactivar el monitoreo
   * @param {boolean} state - Estado del monitoreo
   */
  setEnabled(state) {
    this.enabled = state;
    
    if (this.enabled && this.config.reportInterval && !this.reportingTimer) {
      this.scheduleReporting();
    } else if (!this.enabled && this.reportingTimer) {
      clearTimeout(this.reportingTimer);
      this.reportingTimer = null;
    }
    
    this.logEvent('monitor_state_change', { enabled: state });
  }
  
  /**
   * Programar envío periódico de métricas
   * @private
   */
  scheduleReporting() {
    if (this.reportingTimer) {
      clearTimeout(this.reportingTimer);
    }
    
    this.reportingTimer = setTimeout(() => {
      this.flushMetrics();
      this.scheduleReporting();
    }, this.config.reportInterval);

    // No mantener el bucle activo en procesos de test/CI
    if (typeof this.reportingTimer.unref === 'function') {
      this.reportingTimer.unref();
    }
  }
  
  /**
   * Registrar un evento en el sistema de monitoreo
   * @param {string} name - Nombre del evento
   * @param {Object} data - Datos asociados al evento
   */
  logEvent(name, data = {}) {
    if (!this.enabled || this.config.logLevel < 2) return;
    
    const event = {
      name,
      timestamp: Date.now(),
      data: {
        ...data,
        sessionDuration: Date.now() - this.startTime
      }
    };
    
    this.metrics.events.push(event);
    
    // Si alcanzamos el tamaño máximo de lote, enviamos las métricas
    if (this.metrics.events.length >= this.config.batchSize) {
      this.flushMetrics();
    }
    
    if (this.config.logLevel >= 3) {
      console.debug(`📊 Evento: ${name}`, data);
    }
  }
  
  /**
   * Registrar un error en el sistema de monitoreo
   * @param {string} errorType - Tipo de error
   * @param {Error|string} error - Error o mensaje de error
   * @param {Object} context - Contexto adicional del error
   */
  logError(errorType, error, context = {}) {
    if (!this.enabled || this.config.logLevel < 1) return;
    
    const errorData = {
      type: errorType,
      timestamp: Date.now(),
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context
    };
    
    this.metrics.errors.push(errorData);
    
    // Siempre registrar errores en la consola
    console.error(`❌ Error en ${errorType}:`, error);
    
    // Enviar inmediatamente si es un error crítico
    if (errorType === 'critical') {
      this.flushMetrics();
    }
  }
  
  /**
   * Iniciar medición de tiempo para una operación
   * @param {string} operationId - Identificador único de la operación
   * @returns {Function} Función para finalizar la medición
   */
  startTimer(operationId) {
    if (!this.enabled || !this.config.metrics.uiInteractions) return () => {};
    
    const startTime = performance.now();
    
    return (metadata = {}) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordTiming(operationId, duration, metadata);
      return duration;
    };
  }
  
  /**
   * Registrar una medición de tiempo
   * @param {string} metricName - Nombre de la métrica
   * @param {number} durationMs - Duración en milisegundos
   * @param {Object} metadata - Metadatos adicionales
   */
  recordTiming(metricName, durationMs, metadata = {}) {
    if (!this.enabled) return;
    
    if (!this.metrics.timings[metricName]) {
      this.metrics.timings[metricName] = {
        count: 0,
        total: 0,
        min: Number.MAX_SAFE_INTEGER,
        max: 0,
        samples: []
      };
    }
    
    const timing = this.metrics.timings[metricName];
    timing.count++;
    timing.total += durationMs;
    timing.min = Math.min(timing.min, durationMs);
    timing.max = Math.max(timing.max, durationMs);
    
    // Guardar muestra con metadatos
    timing.samples.push({
      duration: durationMs,
      timestamp: Date.now(),
      metadata
    });
    
    // Limitar número de muestras guardadas
    if (timing.samples.length > 10) {
      timing.samples.shift();
    }
    
    if (this.config.logLevel >= 3) {
      console.debug(`⏱️ Tiempo ${metricName}: ${durationMs.toFixed(2)}ms`);
    }
    
    // Si la operación es lenta (> 1 segundo), registrar como evento
    if (durationMs > 1000) {
      this.logEvent('slow_operation', {
        operation: metricName,
        duration: durationMs,
        ...metadata
      });
    }
  }
  
  /**
   * Incrementar un contador
   * @param {string} counterName - Nombre del contador
   * @param {number} value - Valor a incrementar (por defecto 1)
   */
  incrementCounter(counterName, value = 1) {
    if (!this.enabled) return;
    
    if (!this.metrics.counters[counterName]) {
      this.metrics.counters[counterName] = 0;
    }
    
    this.metrics.counters[counterName] += value;
  }
  
  /**
   * Monitorear el tiempo de ejecución de una función
   * @param {string} operationName - Nombre de la operación
   * @param {Function} fn - Función a monitorear
   * @param {Object} metadata - Metadatos adicionales
   * @returns {any} El resultado de la función
   */
  async measureAsync(operationName, fn, metadata = {}) {
    if (!this.enabled) return fn();
    
    const startTime = performance.now();
    
    try {
      return await fn();
    } catch (error) {
      this.logError(`${operationName}_error`, error, metadata);
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.recordTiming(operationName, duration, metadata);
    }
  }
  
  /**
   * Monitorear el tiempo de ejecución de una función sincrónica
   * @param {string} operationName - Nombre de la operación
   * @param {Function} fn - Función a monitorear
   * @param {Object} metadata - Metadatos adicionales
   * @returns {any} El resultado de la función
   */
  measure(operationName, fn, metadata = {}) {
    if (!this.enabled) return fn();
    
    const startTime = performance.now();
    
    try {
      return fn();
    } catch (error) {
      this.logError(`${operationName}_error`, error, metadata);
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.recordTiming(operationName, duration, metadata);
    }
  }
  
  /**
   * Enviar métricas recopiladas al servidor
   * @returns {Promise<void>}
   * @private
   */
  async flushMetrics() {
    if (!this.enabled || this.pendingFlush || 
        (this.metrics.events.length === 0 && 
         this.metrics.errors.length === 0 && 
         Object.keys(this.metrics.timings).length === 0)) {
      return;
    }
    
    this.pendingFlush = true;
    
    // Clonar y reiniciar métricas
    const metricsToSend = { ...this.metrics };
    this.metrics = {
      events: [],
      errors: [],
      timings: {},
      counters: { ...this.metrics.counters }
    };
    
    try {
      // Si hay URL de endpoint configurada, enviar métricas
      if (this.config.reportUrl) {
        const response = await fetch(this.config.reportUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: Date.now(),
            appVersion: import.meta.env.VITE_APP_VERSION || 'dev',
            metrics: metricsToSend
          })
        });
        
        if (!response.ok) {
          console.warn('Error al enviar métricas:', response.statusText);
        }
      } else {
        // Si no hay URL, guardar localmente para desarrollo
        if (this.config.logLevel >= 2) {
          console.info('📊 Métricas recopiladas:', metricsToSend);
        }
        
        // Almacenar últimas métricas en localStorage para debugging
        try {
          localStorage.setItem('lovenda_last_metrics', JSON.stringify(metricsToSend));
        } catch (e) {
          // Ignorar errores de localStorage
        }
      }
    } catch (error) {
      console.error('Error al procesar métricas:', error);
      
      // Restaurar eventos y errores no enviados
      this.metrics.events = [...metricsToSend.events, ...this.metrics.events];
      this.metrics.errors = [...metricsToSend.errors, ...this.metrics.errors];
    } finally {
      this.pendingFlush = false;
    }
  }
  
  /**
   * Monitorear específicamente operaciones del sistema de emails
   * @param {string} operation - Operación específica (enviar, recibir, etc.)
   * @param {Function} fn - Función a monitorear
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<any>} Resultado de la función
   */
  async monitorEmailOperation(operation, fn, metadata = {}) {
    if (!this.enabled || !this.config.metrics.emailProcessing) {
      return fn();
    }
    
    // Registrar el evento de operación de email
    this.logEvent(`email_operation_${operation}`, {
      ...metadata,
      timestamp: Date.now()
    });
    
    // Incrementar contador de operaciones por tipo
    this.incrementCounter(`email_operation_${operation}`);
    
    return this.measureAsync(`email_${operation}`, fn, metadata);
  }
  
  /**
   * Monitorear el uso de plantillas de email
   * @param {string} templateId - ID o nombre de la plantilla
   * @param {string} category - Categoría de la plantilla
   * @param {string} action - Acción realizada (view, edit, use, create)
   * @param {Function} fn - Función a monitorear
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<any>} Resultado de la función
   */
  async monitorTemplateUsage(templateId, category, action, fn, metadata = {}) {
    if (!this.enabled || !this.config.metrics.emailProcessing) {
      return fn();
    }
    
    // Registrar el evento de uso de plantilla
    this.logEvent('template_usage', {
      templateId,
      category,
      action,
      ...metadata
    });
    
    // Incrementar contadores específicos
    this.incrementCounter(`template_${action}`);
    this.incrementCounter(`template_category_${category}`);
    
    return this.measureAsync(`template_${action}`, fn, {
      templateId,
      category,
      ...metadata
    });
  }
  
  /**
   * Monitorear el rendimiento de renderizado de plantillas
   * @param {string} templateId - ID o nombre de la plantilla
   * @param {number} dataSize - Tamaño de los datos de la plantilla (en bytes)
   * @param {Function} fn - Función de renderizado
   * @returns {Promise<any>} Resultado del renderizado
   */
  async monitorTemplateRendering(templateId, dataSize, fn) {
    if (!this.enabled || !this.config.metrics.emailProcessing) {
      return fn();
    }
    
    return this.measureAsync('template_rendering', fn, {
      templateId,
      dataSize,
      timestamp: Date.now()
    });
  }
  
  /**
   * Monitorear el proceso de entrega de email
   * @param {string} emailId - ID del email
   * @param {string} recipientType - Tipo de destinatario (provider, guest, etc.)
   * @param {Function} fn - Función de entrega
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<any>} Resultado de la entrega
   */
  async monitorEmailDelivery(emailId, recipientType, fn, metadata = {}) {
    if (!this.enabled || !this.config.metrics.emailProcessing) {
      return fn();
    }
    
    // Registrar evento de intento de entrega
    this.logEvent('email_delivery_attempt', {
      emailId,
      recipientType,
      ...metadata
    });
    
    // Incrementar contador de intentos por tipo de destinatario
    this.incrementCounter(`email_delivery_${recipientType}`);
    
    try {
      const result = await this.measureAsync('email_delivery', fn, {
        emailId,
        recipientType,
        ...metadata
      });
      
      // Registrar éxito de entrega
      this.logEvent('email_delivery_success', {
        emailId,
        recipientType,
        ...metadata
      });
      
      return result;
    } catch (error) {
      // Registrar fallo de entrega
      this.logEvent('email_delivery_failure', {
        emailId,
        recipientType,
        errorMessage: error.message,
        ...metadata
      });
      
      // Incrementar contador de fallos
      this.incrementCounter('email_delivery_failures');
      
      throw error;
    }
  }
  
  /**
   * Monitorear interacciones con emails (aperturas, clics, etc.)
   * @param {string} emailId - ID del email
   * @param {string} interactionType - Tipo de interacción (open, click, etc.)
   * @param {Object} metadata - Metadatos adicionales
   */
  trackEmailInteraction(emailId, interactionType, metadata = {}) {
    if (!this.enabled || !this.config.metrics.emailProcessing) {
      return;
    }
    
    // Registrar evento de interacción
    this.logEvent('email_interaction', {
      emailId,
      interactionType,
      timestamp: Date.now(),
      ...metadata
    });
    
    // Incrementar contadores específicos
    this.incrementCounter(`email_interaction_${interactionType}`);
    this.incrementCounter('email_interactions_total');
  }
  
  /**
   * Monitorear búsqueda global
   * @param {string} query - Consulta de búsqueda
   * @param {Function} fn - Función de búsqueda
   * @returns {Promise<any>} Resultados de búsqueda
   */
  async monitorSearch(query, fn) {
    if (!this.enabled || !this.config.metrics.searchPerformance) {
      return fn();
    }
    
    return this.measureAsync('search', fn, {
      query,
      queryLength: query?.length || 0
    });
  }
  
  /**
   * Monitorear renderizado de notificaciones
   * @param {number} count - Cantidad de notificaciones
   * @param {Function} fn - Función de renderizado
   * @returns {any} Resultado del renderizado
   */
  monitorNotificationRendering(count, fn) {
    if (!this.enabled || !this.config.metrics.notificationsRendering) {
      return fn();
    }
    
    return this.measure('notification_rendering', fn, { count });
  }
  
  /**
   * Monitorear detección de eventos en emails
   * @param {string} emailId - ID del email
   * @param {number} contentLength - Longitud del contenido
   * @param {Function} fn - Función de detección
   * @returns {Promise<any>} Eventos detectados
   */
  async monitorEventDetection(emailId, contentLength, fn) {
    if (!this.enabled || !this.config.metrics.eventDetection) {
      return fn();
    }
    
    return this.measureAsync('event_detection', fn, {
      emailId,
      contentLength
    });
  }
}

// Instancia singleton para uso en toda la aplicación
export const performanceMonitor = new PerformanceMonitor();

// Hooks para facilitar el uso en componentes React
export function usePerformanceMonitor() {
  return performanceMonitor;
}

// Hook específico para medir el tiempo de carga de un componente
export function useComponentLoadTime(componentName) {
  const mountTime = performance.now();
  
  useEffect(() => {
    if (!performanceMonitor.enabled) return;
    
    const loadTime = performance.now() - mountTime;
    performanceMonitor.recordTiming(`component_load_${componentName}`, loadTime, {
      component: componentName
    });
    
    // Medir tiempo de desmontar al limpiar el efecto
    return () => {
      const unmountStart = performance.now();
      
      // Usamos setTimeout para medir después de que el componente se haya desmontado
      setTimeout(() => {
        const unmountTime = performance.now() - unmountStart;
        performanceMonitor.recordTiming(`component_unmount_${componentName}`, unmountTime, {
          component: componentName
        });
      }, 0);
    };
  }, [componentName]);
}
