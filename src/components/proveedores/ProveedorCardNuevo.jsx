import React from 'react';
import { Star, Bookmark, Phone, Mail, Calendar, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

/**
 * Componente de tarjeta para mostrar información básica de un proveedor.
 * Permite acciones como marcar favorito, editar, eliminar y mostrar el detalle al hacer clic.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.proveedor - Datos del proveedor
 * @param {Function} props.onClick - Función a ejecutar al hacer clic en la tarjeta
 * @param {Function} props.onToggleFavorito - Función para marcar/desmarcar como favorito
 * @param {Function} props.onEditar - Función para editar el proveedor
 * @param {Function} props.onEliminar - Función para eliminar el proveedor
 * @returns {React.ReactElement} Tarjeta del proveedor
 */
const ProveedorCardNuevo = ({ 
  proveedor, 
  onClick, 
  onToggleFavorito, 
  onEditar, 
  onEliminar 
}) => {
  // Estados para el menú de acciones
  const [menuAbierto, setMenuAbierto] = React.useState(false);

  // Para evitar que el clic en los botones propague al contenedor
  const handleAccion = (e, accion) => {
    e.stopPropagation();
    accion();
  };

  // Formato del presupuesto con separador de miles
  const formatearPresupuesto = (valor) => {
    if (!valor) return '€€€';
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(valor);
  };

  // Obtener clase de estado según el valor
  const getEstadoClase = (estado) => {
    switch(estado) {
      case 'Contratado': return 'bg-green-100 text-green-800';
      case 'Contactado': return 'bg-blue-100 text-blue-800';
      case 'Pendiente': return 'bg-amber-100 text-amber-800';
      case 'Descartado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer transition-all hover:shadow-md"
      onClick={() => onClick(proveedor)}
    >
      {/* Cabecera con imagen y acciones */}
      <div className="relative h-36 bg-gradient-to-r from-blue-500 to-purple-500">
        {proveedor.imagen && (
          <img 
            src={proveedor.imagen} 
            alt={proveedor.nombre}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Botón favorito */}
        <button 
          onClick={(e) => handleAccion(e, () => onToggleFavorito(proveedor.id))}
          className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 hover:bg-white"
        >
          <Star 
            size={18} 
            className={proveedor.favorito ? "fill-yellow-400 text-yellow-400" : "text-gray-400"} 
          />
        </button>
        
        {/* Botón menú */}
        <div className="absolute top-2 right-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setMenuAbierto(!menuAbierto);
            }}
            className="p-1.5 rounded-full bg-white/80 hover:bg-white"
          >
            <MoreHorizontal size={18} className="text-gray-600" />
          </button>
          
          {/* Menú desplegable */}
          {menuAbierto && (
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                <button
                  onClick={(e) => handleAccion(e, () => onEditar(proveedor))}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Edit size={14} className="mr-2" />
                  Editar
                </button>
                <button
                  onClick={(e) => handleAccion(e, () => onEliminar(proveedor.id))}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash2 size={14} className="mr-2" />
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
            {proveedor.nombre || 'Proveedor sin nombre'}
          </h3>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-600 text-sm">
            {proveedor.servicio || 'Sin categoría'}
          </p>
          
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getEstadoClase(proveedor.estado)}`}>
            {proveedor.estado || 'Nuevo'}
          </span>
        </div>
        
        <div className="border-t border-gray-100 pt-3 mt-3">
          <div className="flex justify-between">
            <div className="flex items-center">
              <Calendar size={16} className="text-gray-400 mr-1" />
              <span className="text-xs text-gray-500">
                {proveedor.fechaCita ? new Date(proveedor.fechaCita).toLocaleDateString() : 'Sin cita'}
              </span>
            </div>
            <div className="font-medium text-sm">
              {formatearPresupuesto(proveedor.presupuesto)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProveedorCardNuevo;
