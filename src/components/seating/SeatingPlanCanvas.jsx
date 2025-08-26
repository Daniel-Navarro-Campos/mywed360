/**
 * Componente Canvas especializado para el plan de asientos
 * Maneja la visualización y interacción con mesas y sillas
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import SeatingCanvas from '../../features/seating/SeatingCanvas';

const SeatingPlanCanvas = ({
  tab,
  areas,
  tables,
  seats,
  hallSize,
  selectedTable,
  onSelectTable,
  onTableDimensionChange,
  onAssignGuest,
  onToggleEnabled,
  onAddArea,
  onAddTable,
  drawMode = 'pan',
  onDrawModeChange,
  canvasRef,
  className = ""
}) => {
  // Detectar si es dispositivo táctil
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const backend = isTouchDevice ? TouchBackend : HTML5Backend;
  
  // Handlers de eventos del canvas
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    // Lógica de zoom
  }, []);
  
  const handlePointerDown = useCallback((e) => {
    // Lógica de inicio de interacción
  }, []);
  
  const handlePointerMove = useCallback((e) => {
    // Lógica de movimiento
  }, []);
  
  const handlePointerUp = useCallback(() => {
    // Lógica de fin de interacción
  }, []);
  
  // Configurar eventos del canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handleWheel, handlePointerDown, handlePointerMove, handlePointerUp]);
  
  return (
    <DndProvider backend={backend}>
      <div className={`relative bg-gray-50 border rounded-lg overflow-hidden ${className}`}>
        {/* Canvas principal */}
        <div
          ref={canvasRef}
          className="w-full h-full min-h-[600px] relative cursor-crosshair"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        >
          {/* Componente SeatingCanvas existente */}
          <SeatingCanvas
            tab={tab}
            areas={areas}
            tables={tables}
            seats={seats}
            hallSize={hallSize}
            selectedTable={selectedTable}
            onSelectTable={onSelectTable}
            onAssignGuest={onAssignGuest}
            onToggleEnabled={onToggleEnabled}
            onAddArea={onAddArea}
            onAddTable={onAddTable}
            drawMode={drawMode}
            canPan={drawMode === 'pan'}
            canMoveTables={drawMode === 'move'}
          />
          
          {/* Indicadores de dimensiones del salón */}
          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs text-gray-600">
            {(hallSize.width/100).toFixed(1)} × {(hallSize.height/100).toFixed(1)} m
          </div>
          
          {/* Controles de zoom */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              className="w-8 h-8 bg-white shadow-md rounded flex items-center justify-center hover:bg-gray-50"
              title="Zoom in"
            >
              +
            </button>
            <button
              className="w-8 h-8 bg-white shadow-md rounded flex items-center justify-center hover:bg-gray-50"
              title="Zoom out"
            >
              −
            </button>
            <button
              className="w-8 h-8 bg-white shadow-md rounded flex items-center justify-center hover:bg-gray-50"
              title="Ajustar a pantalla"
            >
              ⌂
            </button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default React.memo(SeatingPlanCanvas);
