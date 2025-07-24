import React from 'react';

/**
 * Componente Badge para mostrar etiquetas pequeñas con diferentes estilos
 * @param {string} type - Tipo de badge ('default', 'info', 'success', 'warning', 'error')
 * @param {ReactNode} children - Contenido del badge
 * @param {string} className - Clases adicionales
 */
const Badge = ({ type = 'default', children, className = '', ...props }) => {
  const typeClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    info: 'bg-cyan-100 text-cyan-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };
  
  const badgeClasses = `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeClasses[type] || typeClasses.default} ${className}`;
  
  return (
    <span className={badgeClasses} {...props}>
      {children}
    </span>
  );
};

export default Badge;
