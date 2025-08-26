import React, { forwardRef } from 'react';



import FreeDrawCanvas from '../../components/FreeDrawCanvas';
import TableItem from '../../components/TableItem';
import ChairItem from '../../components/ChairItem';

/**
 * SeatingCanvas
 * Envoltorio del lienzo con soporte de zoom/pan y renderizado de mesas/áreas.
 * Extraído desde SeatingPlan.jsx para mejorar la legibilidad.
 */
const SeatingCanvas = forwardRef(function SeatingCanvas(
  {
    tab,
    areas,
    tables,
    seats = [],
    scale = 1,
    offset = { x: 0, y: 0 },
    addArea,
    onDeleteArea,
    moveTable,
    onAssignGuest,
    onToggleEnabled,
    setConfigTable,
    online,
    handleWheel,
    handlePointerDown,
    guests = [],
    onSelectTable,
    drawMode = 'free',
    canPan = true,
    canMoveTables = true,
    onToggleSeat = () => {},
    onDoubleClick = () => {}, 
    onUpdateArea = () => {}, 
    hallSize = null,
  },
  containerRef,
) {
  // Mapear drawMode externo a valores aceptados por FreeDrawCanvas
  const internalDrawMode =
    drawMode === 'boundary' ? 'boundary'  // Usar el nuevo modo boundary
  : drawMode === 'obstacle' ? 'rect'
  : drawMode === 'door' ? 'rect'
  : drawMode === 'aisle' ? 'line'
  : drawMode;

  return (

      <div
        className="flex-grow border border-gray-300 h-[800px] relative overflow-hidden" // adjusted height
        onDoubleClick={onDoubleClick} // added event handler
        onWheel={canPan ? handleWheel : undefined}
        onPointerDown={canPan ? handlePointerDown : undefined}
        role="main"
        aria-label="Lienzo de plano"
        ref={containerRef}
        style={{
          backgroundImage: 'linear-gradient(to right, #eaeaea 1px, transparent 1px), linear-gradient(to bottom, #eaeaea 1px, transparent 1px)',
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
        }}
      >
        {/* Área del salón (solo banquete) */}
        {tab==='banquet' && hallSize && (
          <div
            style={{
              position:'absolute',
              left:0,
              top:0,
              width: hallSize.width * scale,
              height: hallSize.height * scale,
              border:'2px dashed #6b7280',
              backgroundColor:'rgba(255,255,255,0.6)',
              pointerEvents:'none'
            }}
          />
        )}

        {/* Canvas libre */}
        <FreeDrawCanvas
          areas={areas}
          scale={scale}
          offset={offset}
          onFinalize={addArea}
          onDeleteArea={onDeleteArea}
          onUpdateArea={onUpdateArea}
          drawMode={internalDrawMode}
        />

{/* Sillas (solo ceremonia) */}
        {tab==='ceremony' && seats.map((seat, idx) => (
          <ChairItem key={`${seat.id}-${idx}`} seat={seat} scale={scale} offset={offset} onToggleEnabled={onToggleSeat} />
        ))}

        {/* Mesas (solo banquete) */}
        {tab==='banquet' && tables.map((t, idx) => (
          <TableItem
            key={`${t.id}-${idx}`}
            table={t}
            scale={scale}
            offset={offset}
            onMove={moveTable}
            onAssignGuest={onAssignGuest}
            onToggleEnabled={onToggleEnabled}
            onOpenConfig={setConfigTable}
            onSelect={onSelectTable}
            guests={guests}
            canMove={canMoveTables}
          />
        ))}




      </div>

  );
});

export default SeatingCanvas;
