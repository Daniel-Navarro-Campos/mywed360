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

  const label = (() => {
    if (!guestName) return '';
    if (scale >= 1.5) {
      const first = guestName.trim().split(/\s+/)[0] || '?';
      return first.length > 8 ? first.slice(0, 8) + '…' : first;
    }
    // Iniciales (máx. 2)
    return guestName.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  })();

  return (
    <div
      style={style}
      title={guestName || `Silla ${id}`}
      onClick={() => onToggleEnabled && onToggleEnabled(id)}
      aria-label={guestName || `Silla ${id}`}
    >
      {label}
    </div>
  );
}
