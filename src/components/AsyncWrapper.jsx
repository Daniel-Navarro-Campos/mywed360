import React, { useState, useEffect } from 'react';

/**
 * Wrapper para manejar componentes que pueden retornar Promesas
 * Previene el error "Objects are not valid as a React child (found: [object Promise])"
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.asyncFunction - Función async que retorna JSX
 * @param {React.ReactElement} props.fallback - Componente a mostrar mientras se resuelve la Promesa
 * @param {React.ReactElement} props.errorFallback - Componente a mostrar en caso de error
 * @returns {React.ReactElement} Componente renderizado correctamente
 */
const AsyncWrapper = ({ 
  asyncFunction, 
  fallback = <div>Cargando...</div>, 
  errorFallback = <div>Error al cargar contenido</div>,
  ...props 
}) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const resolveContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Si asyncFunction es una función, ejecutarla
        if (typeof asyncFunction === 'function') {
          const result = await asyncFunction(props);
          setContent(result);
        } else {
          // Si no es una función, usar directamente
          setContent(asyncFunction);
        }
      } catch (err) {
        console.error('Error en AsyncWrapper:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    resolveContent();
  }, [asyncFunction, props]);

  if (loading) {
    return fallback;
  }

  if (error) {
    return errorFallback;
  }

  return content || null;
};

export default AsyncWrapper;
