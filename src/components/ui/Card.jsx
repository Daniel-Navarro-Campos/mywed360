import React from 'react';

function Card({ children, className = '', ...props }) {
  // Estilo unificado: fondo semitransparente y blur de fondo

    return (
    <div
      className={`bg-white rounded-xl shadow-md border border-gray-200 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
export { Card };