import React, { useState, useEffect } from 'react';
import Modal from './Modal';

/**
 * Modal para configurar la parrilla de sillas de la ceremonia
 * Props:
 *  - open: boolean
 *  - onApply(config): callback con { rows, cols, gap, aisleAfter }
 *  - onClose: cerrar
 */
export default function CeremonyConfigModal({ open, onApply, onClose }) {
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(12);
  const [gap, setGap] = useState(40);
  const [aisleAfter, setAisleAfter] = useState(6);

  useEffect(() => {
    if (!open) return;
    // reset default each time open if desired
  }, [open]);

  const totalSeats = rows * cols;

  const apply = () => {
    onApply({ rows: +rows, cols: +cols, gap: +gap, aisleAfter: +aisleAfter });
    onClose();
  };

  return (
    <Modal open={open} title="Configurar ceremonia" onClose={onClose}>
      <div className="flex flex-col space-y-2 w-60">
        <label className="flex justify-between items-center">
          <span>Filas:</span>
          <input type="number" min="1" max="50" value={rows} onChange={e => setRows(e.target.value)} className="border rounded px-2 py-1 w-20" />
        </label>
        <label className="flex justify-between items-center">
          <span>Sillas por fila:</span>
          <input type="number" min="1" max="50" value={cols} onChange={e => setCols(e.target.value)} className="border rounded px-2 py-1 w-20" />
        </label>
        <label className="flex justify-between items-center">
          <span>Espacio entre sillas:</span>
          <input type="number" min="20" max="200" value={gap} onChange={e => setGap(e.target.value)} className="border rounded px-2 py-1 w-20" />
        </label>
        <label className="flex justify-between items-center">
          <span>Pasillo después de col:</span>
          <input type="number" min="1" max={cols-1 || 1} value={aisleAfter} onChange={e => setAisleAfter(e.target.value)} className="border rounded px-2 py-1 w-20" />
        </label>
        <p className="text-sm text-gray-600 mt-2">Total de sillas: {totalSeats}</p>
        <div className="flex justify-end space-x-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">Cancelar</button>
          <button onClick={apply} className="px-3 py-1 bg-blue-600 text-white rounded">Aplicar</button>
        </div>
      </div>
    </Modal>
  );
}
