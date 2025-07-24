import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente de lista virtualizada para renderizar grandes cantidades de elementos
 * de manera eficiente, renderizando solo los elementos visibles en pantalla.
 * 
 * @component
 * @example
 * ```jsx
 * <VirtualizedList
 *   items={notificaciones}
 *   height={400}
 *   itemHeight={80}
 *   renderItem={(item, index) => (
 *     <NotificationItem notification={item} key={item.id} />
 *   )}
 * />
 * ```
 */
function VirtualizedList({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
  onEndReached,
  endReachedThreshold = 200,
  loading = false,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const endReachedCalled = useRef(false);
  
  // Calcular elementos visibles basado en scroll y altura
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(height / itemHeight) + 2 * overscan;
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount);
  
  // Detectar cuando llega al final para cargar más datos
  const checkEndReached = useCallback(() => {
    if (!onEndReached || loading || endReachedCalled.current) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const distanceFromEnd = 
      container.scrollHeight - 
      container.scrollTop - 
      container.clientHeight;
      
    if (distanceFromEnd < endReachedThreshold) {
      endReachedCalled.current = true;
      onEndReached();
    }
  }, [onEndReached, loading, endReachedThreshold]);

  // Handler para el evento de scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop } = containerRef.current;
    const scrollDirection = scrollTop > lastScrollTopRef.current ? 'down' : 'up';
    lastScrollTopRef.current = scrollTop;
    
    setScrollTop(scrollTop);
    
    // Verificar si llegamos al final solo cuando se desplaza hacia abajo
    if (scrollDirection === 'down') {
      checkEndReached();
    }
  }, [checkEndReached]);
  
  // Reset del flag cuando cambia la carga
  useEffect(() => {
    if (!loading) {
      endReachedCalled.current = false;
    }
  }, [loading]);

  // Reiniciar scroll cuando cambia la lista significativamente
  useEffect(() => {
    if (containerRef.current) {
      handleScroll();
    }
  }, [items.length, handleScroll]);

  // Elementos visibles con posición absoluta
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const item = items[i];
    if (!item) continue;
    
    visibleItems.push(
      <div
        key={item.id || i}
        className="absolute w-full"
        style={{ 
          height: `${itemHeight}px`, 
          top: `${i * itemHeight}px` 
        }}
      >
        {renderItem(item, i)}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-y-auto ${className}`}
      style={{ height: `${height}px` }}
      onScroll={handleScroll}
    >
      <div
        className="relative"
        style={{ height: `${items.length * itemHeight}px` }}
      >
        {visibleItems}
        
        {/* Indicador de carga cuando se alcanza el final */}
        {loading && (
          <div 
            className="absolute left-0 right-0 flex justify-center py-3"
            style={{ bottom: 0 }}
          >
            <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {/* Mensaje cuando no hay elementos */}
      {items.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          No hay elementos para mostrar
        </div>
      )}
    </div>
  );
}

VirtualizedList.propTypes = {
  /** Lista de elementos a renderizar */
  items: PropTypes.array.isRequired,
  /** Altura del contenedor en píxeles */
  height: PropTypes.number.isRequired,
  /** Altura de cada elemento en píxeles */
  itemHeight: PropTypes.number.isRequired,
  /** Función de renderizado para cada elemento */
  renderItem: PropTypes.func.isRequired,
  /** Número de elementos adicionales a renderizar fuera de vista */
  overscan: PropTypes.number,
  /** Clases CSS adicionales para el contenedor */
  className: PropTypes.string,
  /** Función a llamar cuando se llega al final de la lista */
  onEndReached: PropTypes.func,
  /** Umbral en píxeles para detectar el final de la lista */
  endReachedThreshold: PropTypes.number,
  /** Indicador de carga para cuando se cargan más elementos */
  loading: PropTypes.bool,
};

export default VirtualizedList;
