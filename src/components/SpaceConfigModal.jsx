import React, { useState, useEffect } from 'react';
import Modal from './Modal';

/**
 * SpaceConfigModal
 * Permite definir las dimensiones reales del salón del banquete.
 * Las unidades son centímetros para mantener coherencia con el resto de coordenadas.
 * Ej.: un salón de 18 m × 12 m sería width = 1800 y height = 1200.
 */
export default function SpaceConfigModal({ open, defaultWidth = 1800, defaultHeight = 1200, onApply, onClose }) {
  const [width, setWidth] = useState(defaultWidth);
  const [height, setHeight] = useState(defaultHeight);

  // Mantener controlado desde el exterior si cambian los defaults
  useEffect(() => { setWidth(defaultWidth); }, [defaultWidth]);
  useEffect(() => { setHeight(defaultHeight); }, [defaultHeight]);

  const apply = () => {
    const w = Math.max(100, +width);
    const h = Math.max(100, +height);
    onApply({ width: w, height: h });
    onClose();
  };

  return (
    <Modal open={open} title="Dimensiones del Salón" onClose={onClose}>
      <div className="flex flex-col space-y-2 w-64">
        <label className="flex justify-between items-center">
          <span>Ancho (cm):</span>
          <input type="number" min="100" value={width} onChange={e => setWidth(e.target.value)} className="border rounded px-2 py-1 w-24" />
        </label>
        <label className="flex justify-between items-center">
          <span>Alto (cm):</span>
          <input type="number" min="100" value={height} onChange={e => setHeight(e.target.value)} className="border rounded px-2 py-1 w-24" />
        </label>
        <div className="flex justify-end space-x-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">Cancelar</button>
          <button onClick={apply} className="px-3 py-1 bg-blue-600 text-white rounded">Aplicar</button>
        </div>
      </div>
    </Modal>
  );
}
