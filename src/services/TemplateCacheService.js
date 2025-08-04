/**
 * Servicio de caché para plantillas de email
 * 
 * Este servicio proporciona una capa de caché para optimizar
 * el acceso a plantillas de email, reduciendo llamadas al backend
 * y mejorando el rendimiento general del sistema.
 * 
 * Implementa:
 * - Caché en memoria para acceso rápido
 * - Almacenamiento en localStorage para persistencia entre sesiones
 * - Invalidación inteligente basada en tiempo y eventos
 * - Precarga de plantillas frecuentemente usadas
 */

import { performanceMonitor } from './PerformanceMonitor';

// Constantes para configuración de caché
const CACHE_VERSION = '1.0.0';
const CACHE_PREFIX = 'lovenda_template_cache';
const CACHE_EXPIRY = 12 * 60 * 60 * 1000; // 12 horas en milisegundos
const CACHE_MAX_SIZE = 100; // Máximo número de plantillas en caché
const TEMPLATE_USAGE_KEY = 'lovenda_template_usage';
const PRELOAD_THRESHOLD = 3; // Número mínimo de usos para precarga

// Caché en memoria
let memoryCache = {
  allTemplates: null,
  byId: {},
  byCategory: {},
  lastFetched: 0
};

// Estado de la caché
let cacheStats = {
  hits: 0,
  misses: 0,
  saves: 0,
  preloads: 0
};

/**
 * Genera una clave única para el localStorage basada en el tipo y el identificador
 * @param {string} type - Tipo de caché (all, id, category)
 * @param {string} identifier - Identificador específico (id de plantilla o nombre de categoría)
 * @returns {string} - Clave para localStorage
 */
const getCacheKey = (type, identifier = '') => {
  return `${CACHE_PREFIX}_${type}_${identifier}`;
};

/**
 * Verifica si la caché está vencida
 * @param {number} timestamp - Timestamp de cuando se almacenó el item
 * @returns {boolean} - True si está vencido, false si sigue vigente
 */
const isCacheExpired = (timestamp) => {
  return (Date.now() - timestamp) > CACHE_EXPIRY;
};

/**
 * Guarda estadísticas de uso de la caché
 */
const saveStats = () => {
  try {
    performanceMonitor.logEvent('template_cache_stats', {
      ...cacheStats,
      timestamp: Date.now()
    });
    
    // Guardar en localStorage para análisis histórico
    localStorage.setItem(`${CACHE_PREFIX}_stats`, JSON.stringify({
      ...cacheStats,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error al guardar estadísticas de caché:', error);
  }
};

/**
 * Registra el uso de una plantilla para informar la precarga
 * @param {string} templateId - ID de la plantilla usada
 * @param {string} category - Categoría de la plantilla
 */
export const registerTemplateUsage = (templateId, category) => {
  try {
    // Obtener historial de uso existente o inicializar
    const usageData = JSON.parse(localStorage.getItem(TEMPLATE_USAGE_KEY) || '{}');
    
    // Incrementar contador para esta plantilla
    if (!usageData[templateId]) {
      usageData[templateId] = { 
        count: 0,
        lastUsed: Date.now(),
        category
      };
    }
    
    usageData[templateId].count++;
    usageData[templateId].lastUsed = Date.now();
    
    // Actualizar datos de categoría
    usageData[templateId].category = category;
    
    // Guardar de vuelta en localStorage
    localStorage.setItem(TEMPLATE_USAGE_KEY, JSON.stringify(usageData));
    
    // Registrar evento en monitor de rendimiento
    performanceMonitor.logEvent('template_usage_tracked', {
      templateId,
      category,
      count: usageData[templateId].count
    });
    
    return usageData[templateId].count;
  } catch (error) {
    console.error('Error al registrar uso de plantilla:', error);
    return 0;
  }
};

/**
 * Determina qué plantillas deben ser precargadas basado en su uso
 * @returns {Array} - IDs de plantillas a precargar
 */
export const getTemplatesToPreload = () => {
  try {
    const usageData = JSON.parse(localStorage.getItem(TEMPLATE_USAGE_KEY) || '{}');
    
    // Filtrar plantillas usadas frecuentemente
    return Object.entries(usageData)
      .filter(([_, data]) => data.count >= PRELOAD_THRESHOLD)
      .sort((a, b) => b[1].count - a[1].count) // Ordenar por uso (mayor primero)
      .map(([id, _]) => id);
      
  } catch (error) {
    console.error('Error al determinar plantillas para precargar:', error);
    return [];
  }
};

/**
 * Obtiene las categorías más usadas
 * @returns {Array} - Lista de categorías ordenadas por frecuencia de uso
 */
export const getMostUsedCategories = () => {
  try {
    const usageData = JSON.parse(localStorage.getItem(TEMPLATE_USAGE_KEY) || '{}');
    
    // Contar usos por categoría
    const categoryCount = {};
    Object.values(usageData).forEach(data => {
      const category = data.category || 'Sin categoría';
      if (!categoryCount[category]) {
        categoryCount[category] = 0;
      }
      categoryCount[category] += data.count;
    });
    
    // Ordenar categorías por uso
    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .map(([category, _]) => category);
      
  } catch (error) {
    console.error('Error al obtener categorías más usadas:', error);
    return [];
  }
};

/**
 * Limpia entradas antiguas de la caché
 */
const cleanupCache = () => {
  // Limpiar caché en memoria si es demasiado grande
  if (Object.keys(memoryCache.byId).length > CACHE_MAX_SIZE) {
    const templateIds = Object.keys(memoryCache.byId);
    
    // Obtener datos de uso para determinar qué eliminar
    const usageData = JSON.parse(localStorage.getItem(TEMPLATE_USAGE_KEY) || '{}');
    
    // Ordenar IDs por uso (menos usados primero)
    const sortedIds = templateIds.sort((a, b) => {
      const aUsage = usageData[a]?.count || 0;
      const bUsage = usageData[b]?.count || 0;
      return aUsage - bUsage;
    });
    
    // Eliminar el 20% menos usado
    const toRemove = Math.ceil(templateIds.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      if (sortedIds[i]) {
        delete memoryCache.byId[sortedIds[i]];
      }
    }
  }
  
  // Limpiar localStorage de entradas vencidas
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Solo procesar claves de nuestra caché
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const value = JSON.parse(localStorage.getItem(key));
          if (value && value.timestamp && isCacheExpired(value.timestamp)) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Ignorar errores de parseo, probablemente no sea un item válido
        }
      }
    }
  } catch (error) {
    console.error('Error al limpiar caché:', error);
  }
};

/**
 * Inicializa o reinicia la caché
 */
export const initCache = () => {
  memoryCache = {
    allTemplates: null,
    byId: {},
    byCategory: {},
    lastFetched: 0
  };
  
  cacheStats = {
    hits: 0,
    misses: 0,
    saves: 0,
    preloads: 0
  };
  
  cleanupCache();
  
  performanceMonitor.logEvent('template_cache_initialized', {
    version: CACHE_VERSION,
    timestamp: Date.now()
  });
};

/**
 * Guarda todas las plantillas en caché
 * @param {Array} templates - Lista de plantillas
 * @param {boolean} updateLocalStorage - Si es true, también actualiza localStorage
 */
export const cacheAllTemplates = (templates, updateLocalStorage = true) => {
  // Guardar en caché de memoria
  memoryCache.allTemplates = templates;
  memoryCache.lastFetched = Date.now();
  
  // Organizar por ID para acceso rápido
  templates.forEach(template => {
    memoryCache.byId[template.id] = template;
    
    // Organizar por categoría
    const category = template.category || 'Sin categoría';
    if (!memoryCache.byCategory[category]) {
      memoryCache.byCategory[category] = [];
    }
    memoryCache.byCategory[category].push(template);
  });
  
  // Actualizar localStorage si es necesario
  if (updateLocalStorage) {
    try {
      localStorage.setItem(getCacheKey('all'), JSON.stringify({
        data: templates,
        timestamp: Date.now(),
        version: CACHE_VERSION
      }));
      
      cacheStats.saves++;
    } catch (error) {
      console.error('Error al guardar plantillas en localStorage:', error);
    }
  }
  
  performanceMonitor.logEvent('template_cache_updated', {
    count: templates.length,
    timestamp: Date.now()
  });
};

/**
 * Guarda una plantilla individual en la caché
 * @param {Object} template - Plantilla a guardar
 */
export const cacheTemplate = (template) => {
  if (!template || !template.id) return;
  
  // Actualizar en caché de memoria
  memoryCache.byId[template.id] = template;
  
  // Actualizar en la lista completa si existe
  if (memoryCache.allTemplates) {
    const index = memoryCache.allTemplates.findIndex(t => t.id === template.id);
    if (index >= 0) {
      memoryCache.allTemplates[index] = template;
    } else {
      memoryCache.allTemplates.push(template);
    }
  }
  
  // Actualizar en categoría
  const category = template.category || 'Sin categoría';
  if (!memoryCache.byCategory[category]) {
    memoryCache.byCategory[category] = [];
  }
  
  const categoryIndex = memoryCache.byCategory[category].findIndex(t => t.id === template.id);
  if (categoryIndex >= 0) {
    memoryCache.byCategory[category][categoryIndex] = template;
  } else {
    memoryCache.byCategory[category].push(template);
  }
  
  // Guardar en localStorage
  try {
    localStorage.setItem(getCacheKey('id', template.id), JSON.stringify({
      data: template,
      timestamp: Date.now(),
      version: CACHE_VERSION
    }));
    
    cacheStats.saves++;
  } catch (error) {
    console.error('Error al guardar plantilla en localStorage:', error);
  }
  
  performanceMonitor.logEvent('template_cached', {
    id: template.id,
    category: template.category
  });
};

/**
 * Elimina una plantilla de la caché
 * @param {string} templateId - ID de la plantilla a eliminar
 */
export const invalidateTemplate = (templateId) => {
  // Eliminar de la caché en memoria
  if (memoryCache.byId[templateId]) {
    const template = memoryCache.byId[templateId];
    const category = template.category || 'Sin categoría';
    
    // Eliminar de la caché por ID
    delete memoryCache.byId[templateId];
    
    // Eliminar de la lista completa si existe
    if (memoryCache.allTemplates) {
      memoryCache.allTemplates = memoryCache.allTemplates.filter(t => t.id !== templateId);
    }
    
    // Eliminar de la categoría
    if (memoryCache.byCategory[category]) {
      memoryCache.byCategory[category] = memoryCache.byCategory[category].filter(t => t.id !== templateId);
    }
  }
  
  // Eliminar del localStorage
  try {
    localStorage.removeItem(getCacheKey('id', templateId));
  } catch (error) {
    console.error('Error al eliminar plantilla de localStorage:', error);
  }
  
  performanceMonitor.logEvent('template_cache_invalidated', {
    id: templateId,
    timestamp: Date.now()
  });
};

/**
 * Invalida completamente la caché de plantillas
 */
export const invalidateAllTemplates = () => {
  // Reiniciar caché en memoria
  memoryCache.allTemplates = null;
  memoryCache.byId = {};
  memoryCache.byCategory = {};
  memoryCache.lastFetched = 0;
  
  // Limpiar localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error al invalidar caché en localStorage:', error);
  }
  
  performanceMonitor.logEvent('template_cache_reset', {
    timestamp: Date.now()
  });
};

/**
 * Obtiene todas las plantillas de la caché
 * @param {boolean} bypassCache - Si es true, indica que se debe ignorar la caché
 * @returns {Object} - Objeto con las plantillas y el estado de la caché
 */
export const getCachedTemplates = (bypassCache = false) => {
  // Si se debe ignorar la caché, devolver null
  if (bypassCache) {
    cacheStats.misses++;
    return { templates: null, fromCache: false };
  }
  
  // Verificar caché en memoria primero (más rápida)
  if (memoryCache.allTemplates && !isCacheExpired(memoryCache.lastFetched)) {
    cacheStats.hits++;
    
    return {
      templates: memoryCache.allTemplates,
      fromCache: true,
      source: 'memory'
    };
  }
  
  // Verificar localStorage
  try {
    const cachedItem = localStorage.getItem(getCacheKey('all'));
    
    if (cachedItem) {
      const { data, timestamp, version } = JSON.parse(cachedItem);
      
      // Verificar versión y expiración
      if (version === CACHE_VERSION && !isCacheExpired(timestamp)) {
        // Actualizar caché en memoria
        cacheAllTemplates(data, false);
        
        cacheStats.hits++;
        
        return {
          templates: data,
          fromCache: true,
          source: 'localStorage'
        };
      }
    }
  } catch (error) {
    console.error('Error al leer caché de localStorage:', error);
  }
  
  cacheStats.misses++;
  
  return {
    templates: null,
    fromCache: false
  };
};

/**
 * Obtiene una plantilla específica de la caché
 * @param {string} templateId - ID de la plantilla
 * @param {boolean} bypassCache - Si es true, indica que se debe ignorar la caché
 * @returns {Object} - Objeto con la plantilla y el estado de la caché
 */
export const getCachedTemplate = (templateId, bypassCache = false) => {
  // Si se debe ignorar la caché, devolver null
  if (bypassCache) {
    cacheStats.misses++;
    return { template: null, fromCache: false };
  }
  
  // Verificar caché en memoria primero
  if (memoryCache.byId[templateId]) {
    cacheStats.hits++;
    
    return {
      template: memoryCache.byId[templateId],
      fromCache: true,
      source: 'memory'
    };
  }
  
  // Verificar localStorage
  try {
    const cachedItem = localStorage.getItem(getCacheKey('id', templateId));
    
    if (cachedItem) {
      const { data, timestamp, version } = JSON.parse(cachedItem);
      
      // Verificar versión y expiración
      if (version === CACHE_VERSION && !isCacheExpired(timestamp)) {
        // Actualizar caché en memoria
        memoryCache.byId[templateId] = data;
        
        cacheStats.hits++;
        
        return {
          template: data,
          fromCache: true,
          source: 'localStorage'
        };
      }
    }
  } catch (error) {
    console.error('Error al leer caché de plantilla de localStorage:', error);
  }
  
  cacheStats.misses++;
  
  return {
    template: null,
    fromCache: false
  };
};

/**
 * Obtiene plantillas por categoría de la caché
 * @param {string} category - Categoría de las plantillas
 * @param {boolean} bypassCache - Si es true, indica que se debe ignorar la caché
 * @returns {Object} - Objeto con las plantillas y el estado de la caché
 */
export const getCachedTemplatesByCategory = (category, bypassCache = false) => {
  const categoryKey = category || 'Sin categoría';
  
  // Si se debe ignorar la caché, devolver null
  if (bypassCache) {
    cacheStats.misses++;
    return { templates: null, fromCache: false };
  }
  
  // Verificar caché en memoria primero
  if (memoryCache.byCategory[categoryKey] && memoryCache.lastFetched && !isCacheExpired(memoryCache.lastFetched)) {
    cacheStats.hits++;
    
    return {
      templates: memoryCache.byCategory[categoryKey],
      fromCache: true,
      source: 'memory'
    };
  }
  
  // Para categorías, si tenemos todas las plantillas en caché, podemos filtrarlas
  if (memoryCache.allTemplates && !isCacheExpired(memoryCache.lastFetched)) {
    const categoryTemplates = memoryCache.allTemplates.filter(t => 
      (t.category || 'Sin categoría') === categoryKey
    );
    
    // Guardar en caché por categoría para futuros accesos
    memoryCache.byCategory[categoryKey] = categoryTemplates;
    
    cacheStats.hits++;
    
    return {
      templates: categoryTemplates,
      fromCache: true,
      source: 'memory-filtered'
    };
  }
  
  cacheStats.misses++;
  
  return {
    templates: null,
    fromCache: false
  };
};

/**
 * Precarga plantillas populares en caché
 * @param {Function} fetchFunction - Función que obtiene una plantilla del backend/storage
 */
export const preloadPopularTemplates = async (fetchFunction) => {
  if (!fetchFunction || typeof fetchFunction !== 'function') return;
  
  try {
    const templatesToPreload = getTemplatesToPreload();
    
    if (templatesToPreload.length === 0) return;
    
    performanceMonitor.logEvent('template_preload_started', {
      count: templatesToPreload.length
    });
    
    // Precargar hasta 5 plantillas populares
    const limit = Math.min(5, templatesToPreload.length);
    
    for (let i = 0; i < limit; i++) {
      const templateId = templatesToPreload[i];
      
      // Verificar si ya está en caché
      const { fromCache } = getCachedTemplate(templateId);
      if (fromCache) continue;
      
      // Obtener y cachear
      try {
        const template = await fetchFunction(templateId);
        
        if (template) {
          cacheTemplate(template);
          cacheStats.preloads++;
          
          performanceMonitor.logEvent('template_preloaded', {
            id: templateId,
            success: true
          });
        }
      } catch (error) {
        console.error(`Error al precargar plantilla ${templateId}:`, error);
        performanceMonitor.logEvent('template_preload_error', {
          id: templateId,
          error: error.message
        });
      }
    }
    
    performanceMonitor.logEvent('template_preload_completed', {
      preloaded: cacheStats.preloads
    });
    
  } catch (error) {
    console.error('Error al precargar plantillas populares:', error);
  }
};

// Guardar estadísticas periódicamente
setInterval(saveStats, 5 * 60 * 1000); // Cada 5 minutos

// Limpiar caché periódicamente
setInterval(cleanupCache, 60 * 60 * 1000); // Cada hora

// Inicializar caché al cargar
initCache();

const templateCache = {
  initCache,
  cacheAllTemplates,
  cacheTemplate,
  invalidateTemplate,
  invalidateAllTemplates,
  getCachedTemplates,
  getCachedTemplate,
  getCachedTemplatesByCategory,
  registerTemplateUsage,
  getTemplatesToPreload,
  getMostUsedCategories,
  preloadPopularTemplates
};

export { templateCache };
export default templateCache;
