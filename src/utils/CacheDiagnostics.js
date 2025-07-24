/**
 * Utilidades para diagnóstico y pruebas de rendimiento del sistema de caché
 * 
 * Estas funciones ayudan a medir y comparar el rendimiento del sistema
 * con y sin caché, permitiendo validar las optimizaciones.
 */

import { performanceMonitor } from '../services/PerformanceMonitor';
import { templateCache } from '../services/TemplateCacheService';
import EmailService from '../services/EmailService';

/**
 * Realiza una prueba comparativa de rendimiento entre acceso con caché y sin caché
 * @param {Array<string>} templateIds - IDs de plantillas a probar (vacío = todas)
 * @param {number} iterations - Número de repeticiones para cada prueba
 * @returns {Promise<Object>} Resultados detallados de la prueba
 */
export async function runCacheBenchmark(templateIds = [], iterations = 5) {
  // Resultados a devolver
  const results = {
    withCache: {
      times: [],
      avgTime: 0,
      totalTime: 0
    },
    withoutCache: {
      times: [],
      avgTime: 0,
      totalTime: 0
    },
    improvement: {
      percent: 0,
      timesSaved: 0
    },
    details: []
  };

  // Si no se especifican IDs, intentar obtener de caché o cargar todas
  if (!templateIds.length) {
    try {
      const { templates } = await EmailService.getEmailTemplates();
      templateIds = templates.map(t => t.id);
    } catch (error) {
      console.error('Error al cargar plantillas para benchmark:', error);
      return { error: 'No se pudieron cargar plantillas para diagnóstico' };
    }
  }

  // Limitar cantidad de plantillas para evitar pruebas muy largas
  const templatesForTest = templateIds.slice(0, 10);
  
  // Registro del inicio de prueba
  performanceMonitor.logEvent('cache_benchmark_start', {
    templatesCount: templatesForTest.length,
    iterations
  });

  // 1. Prueba sin caché (limpiar caché primero)
  templateCache.clearAll();
  const noCacheStart = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    for (const templateId of templatesForTest) {
      const startTime = performance.now();
      await EmailService.getEmailTemplateById(templateId, true); // Forzar ignorar caché
      const endTime = performance.now();
      
      results.withoutCache.times.push(endTime - startTime);
      results.details.push({
        iteration: i,
        templateId,
        withCache: false,
        time: endTime - startTime
      });
    }
  }
  
  const noCacheEnd = performance.now();
  results.withoutCache.totalTime = noCacheEnd - noCacheStart;
  results.withoutCache.avgTime = results.withoutCache.totalTime / (templatesForTest.length * iterations);

  // 2. Prueba con caché (precalentar la caché primero)
  for (const templateId of templatesForTest) {
    const template = await EmailService.getEmailTemplateById(templateId);
    templateCache.cacheTemplate(template);
  }
  
  const withCacheStart = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    for (const templateId of templatesForTest) {
      const startTime = performance.now();
      await EmailService.getEmailTemplateById(templateId);
      const endTime = performance.now();
      
      results.withCache.times.push(endTime - startTime);
      results.details.push({
        iteration: i,
        templateId,
        withCache: true,
        time: endTime - startTime
      });
    }
  }
  
  const withCacheEnd = performance.now();
  results.withCache.totalTime = withCacheEnd - withCacheStart;
  results.withCache.avgTime = results.withCache.totalTime / (templatesForTest.length * iterations);

  // Calcular mejora y ahorro de tiempo
  if (results.withoutCache.totalTime > 0) {
    results.improvement.percent = Math.round((1 - (results.withCache.totalTime / results.withoutCache.totalTime)) * 100);
    results.improvement.timesSaved = results.withoutCache.totalTime - results.withCache.totalTime;
  }

  // Registrar resultados en monitor de rendimiento
  performanceMonitor.logEvent('cache_benchmark_complete', {
    withCacheAvg: results.withCache.avgTime,
    withoutCacheAvg: results.withoutCache.avgTime,
    improvementPercent: results.improvement.percent,
    timesSaved: results.improvement.timesSaved,
    templatesCount: templatesForTest.length,
    iterations
  });

  return results;
}

/**
 * Genera un informe detallado del estado actual de la caché
 * @returns {Object} Estadísticas detalladas de la caché
 */
export function generateCacheReport() {
  // Obtener estadísticas del servicio de caché
  const stats = templateCache.getCacheStats();
  
  // Obtener entradas actuales
  const memoryEntries = templateCache.getMemoryCacheEntries();
  const localStorageSize = templateCache.getStorageCacheSize();
  
  // Calcular tiempos promedio
  const avgHitTime = stats.hitTimes.length > 0 
    ? stats.hitTimes.reduce((sum, time) => sum + time, 0) / stats.hitTimes.length 
    : 0;
    
  const avgMissTime = stats.missTimes.length > 0 
    ? stats.missTimes.reduce((sum, time) => sum + time, 0) / stats.missTimes.length 
    : 0;
  
  // Calcular efectividad
  const hitRatio = stats.hits + stats.misses > 0 
    ? (stats.hits / (stats.hits + stats.misses)) * 100 
    : 0;
  
  // Preparar detalles de uso por categoría
  const categoryUsage = {};
  if (stats.categoryHits) {
    Object.keys(stats.categoryHits).forEach(category => {
      categoryUsage[category] = {
        hits: stats.categoryHits[category] || 0,
        misses: stats.categoryMisses?.[category] || 0,
        total: (stats.categoryHits[category] || 0) + (stats.categoryMisses?.[category] || 0)
      };
    });
  }
  
  return {
    timestamp: Date.now(),
    stats: {
      hits: stats.hits,
      misses: stats.misses,
      total: stats.hits + stats.misses,
      hitRatio: hitRatio.toFixed(2),
      avgHitTime: avgHitTime.toFixed(2),
      avgMissTime: avgMissTime.toFixed(2),
      avgTimeSaved: avgMissTime - avgHitTime > 0 ? (avgMissTime - avgHitTime).toFixed(2) : 0,
    },
    memory: {
      entryCount: memoryEntries.length,
      byCategory: memoryEntries.reduce((acc, entry) => {
        const cat = entry.category || 'Sin categoría';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {})
    },
    localStorage: {
      size: localStorageSize,
      sizeFormatted: (localStorageSize / 1024).toFixed(2) + ' KB'
    },
    usage: {
      byCategory: categoryUsage,
      // Las 5 plantillas más usadas
      topTemplates: templateCache.getTopTemplates(5)
    },
    config: templateCache.getConfiguration()
  };
}

/**
 * Realiza una prueba de precarga de plantillas por categoría
 * @param {string} category - Categoría a probar
 * @returns {Object} Resultados de la prueba de precarga
 */
export async function testCategoryPreloading(category) {
  const startTime = performance.now();
  
  // Limpiar caché específicamente para esta categoría
  templateCache.clearCategory(category);
  
  // Iniciar precarga
  const preloadResult = await templateCache.preloadTemplatesByCategory(category);
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  return {
    category,
    templatesLoaded: preloadResult.length,
    duration: duration.toFixed(2) + ' ms',
    templates: preloadResult.map(t => ({ 
      id: t.id, 
      name: t.name 
    }))
  };
}

export default {
  runCacheBenchmark,
  generateCacheReport,
  testCategoryPreloading
};
