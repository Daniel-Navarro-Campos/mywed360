import React from 'react';
import { useWedding } from '../context/WeddingContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Selector de boda activa para planners
export default function WeddingSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const { weddings, activeWedding, setActiveWedding } = useWedding();

  return (
    <div className="mb-4 flex items-center space-x-2">
      <label className="text-sm font-medium" htmlFor="wedding-select">Boda:</label>
      <select
        id="wedding-select"
        value={activeWedding}
        onChange={(e) => {
          const newId = e.target.value;
          setActiveWedding(newId);
          // Si estamos en /bodas o /bodas/:algo, navegamos al detalle de la nueva boda
          if (location.pathname.startsWith('/bodas')) {
            navigate(`/bodas/${newId}`);
          }
        }}
        className="border border-gray-300 rounded px-2 py-1 pr-6 text-sm"
      >
        {weddings && weddings.length > 0 ? (
          weddings.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name?.trim() ? w.name : 'Boda sin nombre'}
            </option>
          ))
        ) : (
          <option value="" disabled>Sin bodas</option>
        )}
      </select>
    </div>
  );
}
