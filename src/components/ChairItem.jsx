import React from 'react';

/**
 * ChairItem
 * Representa una silla individual en el plano de ceremonia.
 * Props:
 * - seat: {id,x,y,enabled,guestName?}
 * - scale: factor de zoom
 * - offset: desplazamiento global {x,y}
 * - onToggleEnabled(id): callback al hacer click para (des)habilitar la silla
 */
export default function ChairItem({ seat, scale = 1, offset = { x: 0, y: 0 }, onToggleEnabled }) {
  const size = 14; // tamaño base en px
  const s = size * scale;
  const { x, y, enabled, id, guestName } = seat;
  const style = {
    position: 'absolute',
    width: s,
    height: s,
    borderRadius: '50%',
    left: x * scale + offset.x - s / 2,
    top: y * scale + offset.y - s / 2,
    backgroundColor: enabled !== false ? '#cbd5e1' : '#e2e8f0',
    border: enabled === false ? '1px dashed #94a3b8' : '1px solid #64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 8 * scale,
    cursor: 'pointer',
    userSelect: 'none',
  };

  const initial = guestName ? guestName.charAt(0).toUpperCase() : '';

  return (
    <div
      style={style}
      title={guestName || `Silla ${id}`}
      onClick={() => onToggleEnabled && onToggleEnabled(id)}
      aria-label={guestName || `Silla ${id}`}
    >
      {initial}
    </div>
  );
}
