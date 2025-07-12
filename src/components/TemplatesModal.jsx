import React from 'react';
import Modal from './Modal';

// Plantillas dinámicas basadas en el número total de mesas (count)
// Plantillas para mesas (banquete)
const tableTemplates = [
  {
    id: 'circle',
    label: (n) => `Círculo de ${n} mesas`,
    generate: (count) => {
      const radius = 180 + Math.max(0, count - 8) * 6;
      const center = { x: 300, y: 220 };
      return Array.from({ length: count }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / count;
        return {
          id: i + 1,
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
          shape: 'circle',
          seats: 8,
        };
      });
    },
  },
  {
    id: 'rows',
    label: (n) => `Filas paralelas (${n} mesas)`,
    generate: (count) => {
      const tables = [];
      const rows = 2;
      const cols = Math.ceil(count / rows);
      const startX = 120;
      const startY = 120;
      let id = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols && id <= count; c++) {
          tables.push({
            id: id++,
            x: startX + c * 90,
            y: startY + r * 120,
            shape: 'rect',
            seats: 8,
          });
        }
      }
      return tables;
    },
  },
  {
    id: 'u',
    label: (n) => `Forma en U (${n} mesas)`,
    generate: (count) => {
      const tables = [];
      const leftX = 120;
      const rightX = 600;
      const startY = 120;
      const side = Math.ceil((count - Math.floor(count / 3)) / 2);
      let id = 1;
      for (let i = 0; i < side && id <= count; i++)
        tables.push({ id: id++, x: leftX, y: startY + i * 100, shape: 'rect', seats: 8 });
      for (let i = 0; i < side && id <= count; i++)
        tables.push({ id: id++, x: rightX, y: startY + i * 100, shape: 'rect', seats: 8 });
      const base = count - side * 2;
      for (let i = 0; i < base && id <= count; i++)
        tables.push({ id: id++, x: leftX + 120 + i * 110, y: startY + side * 100, shape: 'rect', seats: 8 });
      return tables;
    },
  },
];

// Plantillas para sillas (ceremonia)
const chairTemplates = [
  {
    id: 'rows',
    label: (n) => `Filas (${n} sillas)` ,
    generate: (count) => {
      const cols = 10; // máximo 10 sillas por fila
      const rows = Math.ceil(count / cols);
      const startX = 100;
      const startY = 100;
      const gapX = 28;
      const gapY = 36;
      const seats = [];
      let id = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols && id <= count; c++) {
          seats.push({ id: id++, x: startX + c * gapX, y: startY + r * gapY, enabled: true });
        }
      }
      return seats;
    }
  },
  {
    id: 'circle',
    label: (n) => `Círculo (${n} sillas)`,
    generate: (count) => {
      const radius = 200 + Math.max(0, count - 30) * 3;
      const center = { x: 300, y: 260 };
      return Array.from({ length: count }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / count;
        return {
          id: i + 1,
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
          enabled: true,
        };
      });
    },
  },
];

export default function TemplatesModal({ open, onApply, onClose, count = 1, tab = 'banquet' }) {
  return (
    <Modal open={open} title="Plantillas de diseño" onClose={onClose}>
      <div className="space-y-3">
        {(tab==='ceremony' ? chairTemplates : tableTemplates).map((tpl) => (
          <div key={tpl.id} className="flex justify-between items-center border p-2 rounded">
            <span>{tpl.label(count)}</span>
            <button
              onClick={() => onApply(tpl.generate(count))}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Aplicar
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
