/**
 * Utilidades para renderizado seguro de Promesas en React JSX
 * Previene el error "Objects are not valid as a React child (found: [object Promise])"
 */

/**
 * Asegura que un valor no sea una Promesa antes de renderizarlo en JSX
 * @param {any} value - El valor a verificar
 * @returns {any} - El valor si no es una Promesa, o null si es una Promesa
 */
export function ensureNotPromise(value) {
  if (value && typeof value === 'object' && typeof value.then === 'function') {
    console.warn('Promesa detectada en renderizado JSX, retornando null para evitar error');
    return null;
  }
  return value;
}

/**
 * Renderiza de forma segura un valor que podría ser una Promesa
 * @param {any} value - El valor a renderizar
 * @param {any} fallback - Valor de respaldo si es una Promesa (por defecto null)
 * @returns {any} - El valor seguro para renderizar
 */
export function safeRender(value, fallback = null) {
  return ensureNotPromise(value) ?? fallback;
}

/**
 * Mapea un array de forma segura, asegurando que ningún elemento sea una Promesa
 * @param {Array} array - El array a mapear
 * @param {Function} mapFn - Función de mapeo
 * @returns {Array} - Array mapeado con valores seguros
 */
export function safeMap(array, mapFn = (item) => item) {
  if (!Array.isArray(array)) {
    return [];
  }
  
  // Si mapFn no es una función válida, usa identidad
  const mapper = typeof mapFn === 'function' ? mapFn : (item) => item;

  return array
    .map((item, index) => {
      const result = mapper(item, index);
      return ensureNotPromise(result);
    })
    .filter((item) => item !== null);
}

/**
 * Ejecuta una función de forma segura y asegura que el resultado no sea una Promesa
 * @param {Function} fn - Función a ejecutar
 * @param {...any} args - Argumentos para la función
 * @returns {any} - Resultado seguro (no Promesa)
 */
export function safeExecute(fn, ...args) {
  try {
    const result = fn(...args);
    return ensureNotPromise(result);
  } catch (error) {
    console.error('Error en safeExecute:', error);
    return null;
  }
}

/**
 * Wrapper para dangerouslySetInnerHTML que maneja Promesas de forma segura
 * @param {string|Promise} htmlContent - Contenido HTML que podría ser una Promesa
 * @returns {Object|null} - Objeto para dangerouslySetInnerHTML o null
 */
export function safeDangerouslySetInnerHTML(htmlContent) {
  const safeContent = ensureNotPromise(htmlContent);
  
  if (typeof safeContent === 'string') {
    return { __html: safeContent };
  }
  
  return null;
}

/**
 * Hook personalizado para manejar estados que podrían contener Promesas
 * @param {any} initialValue - Valor inicial
 * @returns {Array} - [value, setValue] donde value nunca será una Promesa
 */
export function useSafeState(initialValue) {
  const [state, setState] = React.useState(ensureNotPromise(initialValue));
  
  const setSafeState = (newValue) => {
    setState(ensureNotPromise(newValue));
  };
  
  return [state, setSafeState];
}

export default {
  ensureNotPromise,
  safeRender,
  safeMap,
  safeExecute,
  safeDangerouslySetInnerHTML,
  useSafeState
};
