/**
 * Sistema de caché avanzada para emails con soporte para persistencia
 * e invalidación inteligente basada en tiempo y operaciones
 * 
 * @module utils/EmailCache
 */

import { _getStorage } from './storage.js';

class EmailCache {
  constructor() {
    this.memoryCache = {};
    this.initialized = false;
    this.storageKey = 'lovenda_unified_inbox_cache';
    this.maxCacheAge = 15 * 60 * 1000; // 15 minutos por defecto
    this.folderMaxItems = {
      inbox: 100,    // máx 100 emails en caché para la bandeja de entrada
      sent: 50,      // máx 50 emails enviados
      important: 30, // máx 30 emails importantes
      trash: 20      // máx 20 emails en papelera
    };
    
    // Métricas internas
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
      lastFullInvalidation: null
    };
  }
  
  /**
   * Inicializa la caché cargando datos del almacenamiento local
   */
  init() {
    if (this.initialized) return;
    
    try {
      const savedCache = _getStorage().getItem(this.storageKey);
      
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        this.memoryCache = parsed.cache || {};
        this.metrics = parsed.metrics || this.metrics;
      }
      
      this.initialized = true;
      console.log('EmailCache: Inicializado con éxito');
      
      // Programar limpieza periódica de caché
      setInterval(() => this.cleanExpiredItems(), 5 * 60 * 1000); // Cada 5 minutos
      
      return true;
    } catch (error) {
      console.error('EmailCache: Error al inicializar', error);
      this.memoryCache = {};
      this.initialized = true;
      return false;
    }
  }
  
  /**
   * Guarda el estado actual de la caché en localStorage
   * @private
   */
  _persist() {
    try {
      const dataToSave = {
        cache: this.memoryCache,
        metrics: this.metrics,
        lastUpdated: Date.now()
      };
      
      _getStorage().setItem(this.storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('EmailCache: Error al persistir caché', error);
      // Si falla por tamaño, intentamos limpiar la caché
      if (error.name === 'QuotaExceededError') {
        this.invalidateOldest();
        try {
          this._persist(); // Intentar de nuevo
        } catch (retryError) {
          console.error('EmailCache: Error persistente al guardar caché', retryError);
        }
      }
    }
  }
  
  /**
   * Obtiene emails en caché para una carpeta específica
   * @param {string} folder - Carpeta de email (inbox, sent, etc)
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.bypassCache - Si es true, ignora la caché
   * @returns {Array|null} Emails cacheados o null si no hay caché válida
   */
  getEmails(folder, { bypassCache = false } = {}) {
    if (!this.initialized) this.init();
    
    if (bypassCache) {
      this.metrics.misses++;
      return null;
    }
    
    const cacheKey = `folder_${folder}`;
    const cachedData = this.memoryCache[cacheKey];
    
    if (!cachedData || !cachedData.data || !cachedData.timestamp) {
      this.metrics.misses++;
      return null;
    }
    
    // Verificar validez de la caché
    const now = Date.now();
    const isFresh = (now - cachedData.timestamp) < this.maxCacheAge;
    
    if (!isFresh) {
      this.metrics.misses++;
      return null;
    }
    
    this.metrics.hits++;
    return cachedData.data;
  }
  
  /**
   * Almacena emails en caché para una carpeta específica
   * @param {string} folder - Carpeta de email (inbox, sent, etc)
   * @param {Array} emails - Lista de emails para almacenar
   * @returns {boolean} true si se guardó correctamente
   */
  setEmails(folder, emails) {
    if (!this.initialized) this.init();
    
    if (!Array.isArray(emails)) return false;
    
    const cacheKey = `folder_${folder}`;
    
    // Limitar cantidad de emails según la carpeta
    const maxItems = this.folderMaxItems[folder] || 30;
    const limitedEmails = emails.slice(0, maxItems);
    
    this.memoryCache[cacheKey] = {
      data: limitedEmails,
      timestamp: Date.now(),
      size: JSON.stringify(limitedEmails).length
    };
    
    this.metrics.sets++;
    this._persist();
    
    return true;
  }
  
  /**
   * Invalida el caché para una carpeta específica
   * @param {string} folder - Carpeta a invalidar
   */
  invalidateFolder(folder) {
    if (!this.initialized) this.init();
    
    const cacheKey = `folder_${folder}`;
    delete this.memoryCache[cacheKey];
    
    this.metrics.invalidations++;
    this._persist();
  }
  
  /**
   * Invalida toda la caché de emails
   */
  invalidateAll() {
    this.memoryCache = {};
    this.metrics.invalidations++;
    this.metrics.lastFullInvalidation = Date.now();
    this._persist();
  }
  
  /**
   * Limpia items expirados de la caché
   * @private
   */
  cleanExpiredItems() {
    if (!this.initialized) return;
    
    const now = Date.now();
    let cleaned = 0;
    
    Object.keys(this.memoryCache).forEach(key => {
      const item = this.memoryCache[key];
      
      if (item && item.timestamp && (now - item.timestamp > this.maxCacheAge)) {
        delete this.memoryCache[key];
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`EmailCache: Limpiados ${cleaned} items expirados`);
      this._persist();
    }
  }
  
  /**
   * Invalida los elementos más antiguos de la caché cuando está llena
   * @private
   */
  invalidateOldest() {
    if (!this.initialized) return;
    
    // Ordenar por timestamp y eliminar el 20% más antiguo
    const items = Object.entries(this.memoryCache)
      .map(([key, value]) => ({ key, timestamp: value.timestamp || 0 }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    // Eliminar el 20% más antiguo
    const toRemove = Math.ceil(items.length * 0.2);
    items.slice(0, toRemove).forEach(item => {
      delete this.memoryCache[item.key];
    });
    
    console.log(`EmailCache: Eliminados ${toRemove} items antiguos para liberar espacio`);
  }
  
  /**
   * Obtiene estadísticas de uso de la caché
   * @returns {Object} Estadísticas de uso
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: JSON.stringify(this.memoryCache).length,
      itemCount: Object.keys(this.memoryCache).length,
      hitRatio: this.metrics.hits / (this.metrics.hits + this.metrics.misses || 1)
    };
  }
}

// Exportar una única instancia para toda la aplicación
export const emailCache = new EmailCache();
