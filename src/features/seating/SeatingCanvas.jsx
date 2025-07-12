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
    scale,
    offset,
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
  },
  containerRef,
) {
  return (

      <div
        className="flex-grow border border-gray-300 h-96 relative"
        onWheel={canPan ? handleWheel : undefined}
        onPointerDown={canPan ? handlePointerDown : undefined}
        role="main"
        aria-label="Lienzo de plano"
        ref={containerRef}
      >
        {/* Canvas libre */}
        <FreeDrawCanvas
          areas={areas}
          scale={scale}
          offset={offset}
          onFinalize={addArea}
          onDeleteArea={onDeleteArea}
          drawMode={drawMode}
        />

{/* Sillas (solo ceremonia) */}
        {tab==='ceremony' && seats.map(seat=> (
          <ChairItem key={seat.id} seat={seat} scale={scale} offset={offset} onToggleEnabled={onToggleSeat} />
        ))}

        {/* Mesas (solo banquete) */}
        {tab==='banquet' && tables.map((t) => (
          <TableItem
            key={t.id}
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
