import React from 'react';

/**
 * Componente Alert para mostrar mensajes informativos, errores, advertencias y éxitos
 * @param {string} type - Tipo de alerta ('info', 'success', 'warning', 'error')
 * @param {ReactNode} children - Contenido de la alerta
 * @param {string} className - Clases adicionales
 */
const Alert = ({ type = 'info', children, className = '', ...props }) => {
  const typeClasses = {
    info: 'bg-blue-50 text-blue-800 border-blue-300',
    success: 'bg-green-50 text-green-800 border-green-300',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-300',
    error: 'bg-red-50 text-red-800 border-red-300'
  };
  
  const alertClasses = `border rounded-md p-4 ${typeClasses[type] || typeClasses.info} ${className}`;
  
  return (
    <div className={alertClasses} role="alert" {...props}>
      {children}
    </div>
  );
};

export default Alert;
