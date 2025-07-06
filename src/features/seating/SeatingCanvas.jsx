import React, { forwardRef } from 'react';



import FreeDrawCanvas from '../../components/FreeDrawCanvas';
import TableItem from '../../components/TableItem';

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
    scale,
    offset,
    addArea,
    moveTable,
    onAssignGuest,
    onToggleEnabled,
    setConfigTable,
    online,
    handleWheel,
    handlePointerDown,
  },
  containerRef,
) {
  return (

      <div
        className="md:w-3/4 border border-gray-300 h-96 relative"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
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
        />

        {/* Mesas */}
        {tables.map((t) => (
          <TableItem
            key={t.id}
            table={t}
            scale={scale}
            offset={offset}
            onMove={moveTable}
            onAssignGuest={onAssignGuest}
            onToggleEnabled={onToggleEnabled}
            onOpenConfig={setConfigTable}
          />
        ))}

        {/* Líneas guía para banquete */}
        {false && (() => {
          const xs = [...new Set(tables.map((t) => t.x))];
          const ys = [...new Set(tables.map((t) => t.y))];
          return (
            <>
              {xs.map((x, i) => (
                <div
                  key={`v${i}`}
                  style={{
                    position: 'absolute',
                    left: x * scale + offset.x,
                    top: 0,
                    height: '100%',
                    width: 1,
                    background: '#cbd5e1',
                    pointerEvents: 'none',
                  }}
                />
              ))}
              {ys.map((y, i) => (
                <div
                  key={`h${i}`}
                  style={{
                    position: 'absolute',
                    top: y * scale + offset.y,
                    left: 0,
                    width: '100%',
                    height: 1,
                    background: '#cbd5e1',
                    pointerEvents: 'none',
                  }}
                />
              ))}
            </>
          );
        })()}


      </div>

  );
});

export default SeatingCanvas;
