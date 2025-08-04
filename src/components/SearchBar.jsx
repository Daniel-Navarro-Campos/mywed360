import React, { useState } from 'react';

export default function SearchBar({ onResults, onSearch }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('hashtag');

  const handleSearch = () => {
    onSearch({ query: q, type });
  };

  return (
    <div className="flex gap-2 mb-4">
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="border px-2 py-1 rounded"
      >
        <option value="hashtag">Hashtag</option>
        <option value="author">Autor</option>
        <option value="keyword">Palabra clave</option>
      </select>
      <input
        type="text"
        placeholder="Buscar..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="border px-2 py-1 flex-grow rounded"
      />
      <button
        onClick={handleSearch}
        className="px-3 py-1 bg-[var(--color-primary)] text-white rounded"
      >
        Buscar
      </button>
    </div>
  );
}
