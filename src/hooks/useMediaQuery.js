import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar si una media query coincide con el viewport actual
 * @param {string} query - La media query CSS a comprobar
 * @returns {boolean} - True si la media query coincide, false en caso contrario
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Comprobar si estamos en el navegador (no en SSR)
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
      return;
    }
    
    // Crear objeto MediaQueryList
    const mediaQuery = window.matchMedia(query);
    
    // Función para actualizar el estado cuando cambia la coincidencia
    const updateMatches = () => {
      setMatches(mediaQuery.matches);
    };
    
    // Establecer el valor inicial
    updateMatches();
    
    // Añadir listener para cambios (usando la API más reciente si está disponible)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches);
      return () => mediaQuery.removeEventListener('change', updateMatches);
    } else {
      // Fallback para navegadores más antiguos
      mediaQuery.addListener(updateMatches);
      return () => mediaQuery.removeListener(updateMatches);
    }
  }, [query]);

  return matches;
}
