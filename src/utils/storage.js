// Utilidades genéricas para acceso a localStorage con manejo de JSON y fallback
// Se centraliza la lógica para evitar duplicación en los servicios.

/**
 * Carga un valor JSON desde localStorage.
 * @param {string} key - Clave de almacenamiento.
 * @param {*} defaultValue - Valor por defecto si la clave no existe o falla el parseo.
 * @returns {*} Valor almacenado o defaultValue.
 */
export const loadJson = (key, defaultValue = null) => {
  try {
    const raw = localStorage.getItem(key);
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
    localStorage.setItem(key, JSON.stringify(value));
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
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`storage.removeKey error for key ${key}:`, error);
  }
};
