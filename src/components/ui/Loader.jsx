import React from 'react';

/**
 * Componente de carga animado
 * Muestra un spinner o indicador de carga visual
 * 
 * @param {object} props - Propiedades del componente
 * @param {string} props.className - Clases CSS adicionales
 * @param {string} props.size - Tamaño del loader (sm, md, lg)
 * @param {string} props.color - Color del loader
 * @returns {JSX.Element} - Componente de carga
 */
export const Loader = ({ 
  className = '', 
  size = 'md', 
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-blue-500',
    secondary: 'border-gray-300',
    accent: 'border-pink-500',
    success: 'border-green-500',
    warning: 'border-yellow-500',
    error: 'border-red-500'
  };

  const classes = `
    inline-block 
    rounded-full 
    border-4 
    border-t-transparent 
    animate-spin 
    ${sizeClasses[size] || sizeClasses.md} 
    ${colorClasses[color] || colorClasses.primary}
    ${className}
  `;

  return (
    <div 
      className={classes.trim().replace(/\s+/g, ' ')}
      role="status"
      aria-label="Cargando"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

export default Loader;
