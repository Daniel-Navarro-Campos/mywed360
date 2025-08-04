import React from 'react';
import { useWedding } from '../context/WeddingContext';

// Selector de boda activa para planners
export default function WeddingSelector() {
  const { weddings, activeWedding, setActiveWedding } = useWedding();

  if (!weddings || weddings.length === 0) return null;

  return (
    <div className="mb-4 flex items-center space-x-2">
      <label className="text-sm font-medium" htmlFor="wedding-select">Boda:</label>
      <select
        id="wedding-select"
        value={activeWedding}
        onChange={(e) => setActiveWedding(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 pr-6 text-sm"
      >
        {weddings.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  );
}
