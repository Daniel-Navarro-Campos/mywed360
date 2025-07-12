import React from 'react';
import Button from './Button';

/**
 * PageWrapper encapsula la estructura común de página: título fuera de los cards
 * y contenedor principal con paddings y espacio vertical.
 * Props:
 *  - title: string (título principal)
 *  - actions: ReactNode (botones u otros elementos a la derecha del título)
 *  - className: clases tailwind opcionales para el contenedor principal
 *  - children: contenido de la página (Cards y secciones)
 */
export default function PageWrapper({ title, actions = null, className = '', children }) {
  return (
    <div className={`p-4 md:p-6 space-y-8 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          {title && <h1 className="text-2xl font-bold text-gray-800 mr-auto">{title}</h1>}
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
