import React from 'react';
import { X } from 'lucide-react';

/**
 * Componente para mostrar una etiqueta de categoría de email
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.name - Nombre de la categoría
 * @param {string} props.color - Clase CSS para el color de fondo (ej: "bg-blue-500")
 * @param {boolean} props.removable - Si la etiqueta puede ser eliminada
 * @param {Function} props.onRemove - Función para eliminar la etiqueta
 * @returns {JSX.Element} Componente de etiqueta de categoría
 */
const EmailCategoryLabel = ({ name, color, removable = false, onRemove }) => {
  return (
    <div 
      className={`inline-flex items-center rounded-full ${color} bg-opacity-15 px-2.5 py-1 text-xs font-medium border`}
      style={{ borderColor: color.replace('bg-', 'border-') }}
    >
      <span className={`w-2 h-2 rounded-full mr-1.5 ${color}`} />
      
      <span className="text-gray-700">
        {name}
      </span>
      
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1 text-gray-500 hover:text-gray-700"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default EmailCategoryLabel;
