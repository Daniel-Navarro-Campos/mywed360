// Utilidades genéricas para acceso a localStorage con manejo de JSON y fallback
// Se centraliza la lógica para evitar duplicación en los servicios.

/**
 * Carga un valor JSON desde localStorage.
 * @param {string} key - Clave de almacenamiento.
 * @param {*} defaultValue - Valor por defecto si la clave no existe o falla el parseo.
 * @returns {*} Valor almacenado o defaultValue.
 */
// Detectar implementación de localStorage disponible
const _getStorage = () => {
  /*
   * Prioridad:
   * 1. Si existe window.localStorage (ambiente navegador o jsdom en tests), usar ese.
   * 2. Si existe globalThis.localStorage (algunos entornos de test lo definen ahí), usarlo.
   * 3. Fallback: mock vacío para evitar ReferenceError.
   */
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };
};

// Nota: No almacenamos la referencia; en entornos de test `localStorage` puede definirse *después* de importar el módulo.
// Por ello, siempre llamaremos _getStorage() dinámicamente dentro de cada función para asegurar que usamos la versión correcta.

export const loadJson = (key, defaultValue = null) => {
  try {
    const raw = _getStorage().getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`storage.loadJson error for key ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Guarda un valor JSON en localStorage.
 * @param {string} key - Clave.
 * @param {*} value - Valor a serializar.
 * @returns {boolean} Éxito de la operación.
 */
export const saveJson = (key, value) => {
  try {
    _getStorage().setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`storage.saveJson error for key ${key}:`, error);
    return false;
  }
};

/**
 * Elimina una clave de localStorage.
 * @param {string} key - Clave a eliminar.
 */
export const removeKey = (key) => {
  try {
    _getStorage().removeItem(key);
  } catch (error) {
    console.error(`storage.removeKey error for key ${key}:`, error);
  }
};
