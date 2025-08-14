import React, { useState, useEffect } from 'react';

/**
 * Componente SafeRenderer para manejar funciones que pueden retornar Promesas
 * y prevenir el error "Objects are not valid as a React child (found: [object Promise])"
 * 
 * @param {Object} props
 * @param {Function} props.render - Función que puede retornar una Promesa o contenido JSX
 * @param {React.ReactNode} props.fallback - Contenido a mostrar mientras se resuelve la Promesa
 * @param {React.ReactNode} props.errorFallback - Contenido a mostrar si hay error
 */
const SafeRenderer = ({ render, fallback = null, errorFallback = null }) => {
  const [content, setContent] = useState(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const executeRender = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Ejecutar la función de renderizado
        const result = render();
        
        // Si es una Promesa, esperarla
        if (result && typeof result.then === 'function') {
          const resolvedResult = await result;
          setContent(resolvedResult);
        } else {
          // Si no es una Promesa, usar directamente
          setContent(result);
        }
      } catch (err) {
        console.error('Error en SafeRenderer:', err);
        setError(err);
        setContent(errorFallback || 'Error al renderizar contenido');
      } finally {
        setIsLoading(false);
      }
    };

    executeRender();
  }, [render, errorFallback]);

  if (error && errorFallback) {
    return errorFallback;
  }

  if (isLoading && fallback) {
    return fallback;
  }

  // Asegurar que siempre retornamos contenido válido para React
  if (content === null || content === undefined) {
    return null;
  }

  // Si el contenido es una Promesa (no debería pasar, pero por seguridad)
  if (content && typeof content.then === 'function') {
    console.warn('SafeRenderer: Se detectó una Promesa no resuelta, retornando fallback');
    return fallback || null;
  }

  return content;
};

/**
 * Hook para manejar funciones que pueden retornar Promesas de manera segura
 * @param {Function} asyncFunction - Función que puede retornar una Promesa
 * @param {any} defaultValue - Valor por defecto mientras se resuelve
 */
export const useSafeAsync = (asyncFunction, defaultValue = null) => {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const execute = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = asyncFunction();
        
        if (result && typeof result.then === 'function') {
          const resolvedResult = await result;
          setValue(resolvedResult);
        } else {
          setValue(result);
        }
      } catch (err) {
        console.error('Error en useSafeAsync:', err);
        setError(err);
        setValue(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    execute();
  }, [asyncFunction, defaultValue]);

  return { value, loading, error };
};

/**
 * Función utilitaria para asegurar que una función nunca retorne una Promesa en JSX
 * @param {Function} fn - Función a ejecutar
 * @param {any} fallback - Valor de fallback si la función retorna una Promesa
 */
export const safeExecute = (fn, fallback = '') => {
  try {
    const result = fn();
    
    // Si es una Promesa, retornar el fallback
    if (result && typeof result.then === 'function') {
      console.warn('safeExecute: Función retornó una Promesa, usando fallback');
      return fallback;
    }
    
    return result;
  } catch (error) {
    console.error('Error en safeExecute:', error);
    return fallback;
  }
};

export default SafeRenderer;
