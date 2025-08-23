/**
 * Servicio de caché inteligente para componentes React
 * Optimiza el rendimiento cachéando resultados de componentes pesados
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';

// Caché global en memoria
const globalCache = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
  evictions: 0
};

// Configuración por defecto
const DEFAULT_CONFIG = {
  maxSize: 100, // Máximo número de entradas en caché
  ttl: 5 * 60 * 1000, // 5 minutos en millisegundos
  enableStats: true
};

/**
 * Genera una clave de caché basada en props y dependencias
 * @param {string} componentName - Nombre del componente
 * @param {Object} props - Props del componente
 * @param {Array} deps - Dependencias adicionales
 * @returns {string} - Clave única de caché
 */
const generateCacheKey = (componentName, props = {}, deps = []) => {
  const propsString = JSON.stringify(props, Object.keys(props).sort());
  const depsString = JSON.stringify(deps);
  return `${componentName}:${btoa(propsString + depsString)}`;
};

/**
 * Limpia entradas expiradas del caché
 */
const cleanExpiredEntries = () => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of globalCache.entries()) {
    if (now > entry.expiresAt) {
      globalCache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    cacheStats.evictions += cleaned;
    console.log(`[ComponentCache] Limpiadas ${cleaned} entradas expiradas`);
  }
};

/**
 * Aplica política LRU cuando el caché está lleno
 */
const evictLRU = () => {
  if (globalCache.size <= DEFAULT_CONFIG.maxSize) return;
  
  // Encontrar la entrada menos recientemente usada
  let oldestKey = null;
  let oldestTime = Infinity;
  
  for (const [key, entry] of globalCache.entries()) {
    if (entry.lastAccessed < oldestTime) {
      oldestTime = entry.lastAccessed;
      oldestKey = key;
    }
  }
  
  if (oldestKey) {
    globalCache.delete(oldestKey);
    cacheStats.evictions++;
  }
};

/**
 * Hook para cachear resultados de computaciones pesadas en componentes
 * @param {Function} computeFn - Función de computación
 * @param {Array} deps - Dependencias
 * @param {Object} options - Opciones de caché
 * @returns {any} - Resultado cacheado
 */
export const useCachedComputation = (computeFn, deps = [], options = {}) => {
  const config = { ...DEFAULT_CONFIG, ...options };
  const componentName = options.name || 'anonymous';
  
  return useMemo(() => {
    const cacheKey = generateCacheKey(componentName, {}, deps);
    const now = Date.now();
    
    // Verificar si existe en caché y no ha expirado
    if (globalCache.has(cacheKey)) {
      const entry = globalCache.get(cacheKey);
      if (now <= entry.expiresAt) {
        entry.lastAccessed = now;
        cacheStats.hits++;
        return entry.value;
      } else {
        globalCache.delete(cacheKey);
      }
    }
    
    // Computar nuevo valor
    cacheStats.misses++;
    const value = computeFn();
    
    // Limpiar caché si es necesario
    cleanExpiredEntries();
    evictLRU();
    
    // Guardar en caché
    globalCache.set(cacheKey, {
      value,
      createdAt: now,
      lastAccessed: now,
      expiresAt: now + config.ttl
    });
    
    return value;
  }, deps);
};

/**
 * Hook para cachear componentes completos
 * @param {Function} renderFn - Función que renderiza el componente
 * @param {Object} props - Props del componente
 * @param {Array} deps - Dependencias adicionales
 * @param {Object} options - Opciones de caché
 * @returns {React.ReactElement} - Componente cacheado
 */
export const useCachedComponent = (renderFn, props = {}, deps = [], options = {}) => {
  const config = { ...DEFAULT_CONFIG, ...options };
  const componentName = options.name || 'CachedComponent';
  
  return useMemo(() => {
    const cacheKey = generateCacheKey(componentName, props, deps);
    const now = Date.now();
    
    // Verificar caché
    if (globalCache.has(cacheKey)) {
      const entry = globalCache.get(cacheKey);
      if (now <= entry.expiresAt) {
        entry.lastAccessed = now;
        cacheStats.hits++;
        return entry.value;
      } else {
        globalCache.delete(cacheKey);
      }
    }
    
    // Renderizar nuevo componente
    cacheStats.misses++;
    const component = renderFn(props);
    
    // Gestión del caché
    cleanExpiredEntries();
    evictLRU();
    
    // Guardar en caché
    globalCache.set(cacheKey, {
      value: component,
      createdAt: now,
      lastAccessed: now,
      expiresAt: now + config.ttl
    });
    
    return component;
  }, [renderFn, JSON.stringify(props), ...deps]);
};

/**
 * Hook para invalidar caché específico
 * @param {string} componentName - Nombre del componente
 * @returns {Function} - Función para invalidar caché
 */
export const useCacheInvalidation = (componentName) => {
  return useCallback((props = {}, deps = []) => {
    const pattern = generateCacheKey(componentName, props, deps);
    let invalidated = 0;
    
    for (const key of globalCache.keys()) {
      if (key.startsWith(`${componentName}:`)) {
        globalCache.delete(key);
        invalidated++;
      }
    }
    
    console.log(`[ComponentCache] Invalidadas ${invalidated} entradas para ${componentName}`);
  }, [componentName]);
};

/**
 * Componente HOC para cachear automáticamente
 * @param {React.Component} WrappedComponent - Componente a cachear
 * @param {Object} options - Opciones de caché
 * @returns {React.Component} - Componente con caché
 */
export const withCache = (WrappedComponent, options = {}) => {
  const CachedComponent = (props) => {
    const componentName = options.name || WrappedComponent.displayName || WrappedComponent.name;
    
    return useCachedComponent(
      (cachedProps) => <WrappedComponent {...cachedProps} />,
      props,
      options.deps || [],
      { ...options, name: componentName }
    );
  };
  
  CachedComponent.displayName = `withCache(${WrappedComponent.displayName || WrappedComponent.name})`;
  return CachedComponent;
};

/**
 * Obtiene estadísticas del caché
 * @returns {Object} - Estadísticas del caché
 */
export const getCacheStats = () => {
  const hitRate = cacheStats.hits + cacheStats.misses > 0 
    ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(2)
    : 0;
    
  return {
    ...cacheStats,
    hitRate: `${hitRate}%`,
    cacheSize: globalCache.size,
    maxSize: DEFAULT_CONFIG.maxSize
  };
};

/**
 * Limpia todo el caché
 */
export const clearCache = () => {
  const size = globalCache.size;
  globalCache.clear();
  cacheStats.evictions += size;
  console.log(`[ComponentCache] Limpiado caché completo (${size} entradas)`);
};

/**
 * Hook para monitorear rendimiento del caché
 */
export const useCacheMonitor = () => {
  const [stats, setStats] = useState(getCacheStats());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getCacheStats());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return stats;
};

// Limpiar caché expirado cada 5 minutos
setInterval(cleanExpiredEntries, 5 * 60 * 1000);

export default {
  useCachedComputation,
  useCachedComponent,
  useCacheInvalidation,
  withCache,
  getCacheStats,
  clearCache,
  useCacheMonitor
};
