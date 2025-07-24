import React from 'react';

/**
 * Componente Spinner para mostrar estados de carga
 * @param {string} size - Tamaño del spinner ('sm', 'md', 'lg')
 * @param {string} className - Clases adicionales
 */
const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  const spinnerSize = sizeClasses[size] || sizeClasses.md;
  const classes = `animate-spin rounded-full border-t-2 border-blue-500 border-r-2 border-transparent ${spinnerSize} ${className}`;
  
  return (
    <div role="status" className="inline-block">
      <div className={classes}></div>
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

export default Spinner;
