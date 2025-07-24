import React, { useState } from 'react';
import { X, ArrowLeft, Calendar, Mail, Phone, Globe, MapPin, Edit, Bookmark, ChevronRight, CheckCheck, MessageSquare } from 'lucide-react';

/**
 * Componente para mostrar el detalle completo de un proveedor con pestañas
 * para información general y seguimiento de comunicaciones.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.proveedor - Datos del proveedor
 * @param {Array} props.comunicaciones - Lista de comunicaciones con el proveedor
 * @param {Function} props.onCerrar - Función para cerrar el detalle
 * @param {Function} props.onEditar - Función para editar el proveedor
 * @param {Function} props.onNuevaComunicacion - Función para añadir nueva comunicación
 * @returns {React.ReactElement} Vista detalle del proveedor
 */
const ProveedorDetalle = ({ 
  proveedor, 
  comunicaciones = [], 
  onCerrar, 
  onEditar,
  onNuevaComunicacion
}) => {
  // Estado para la pestaña activa
  const [pestanaActiva, setPestanaActiva] = useState('info');
  
  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric', 
      month: 'long', 
      year: 'numeric'
    });
  };
  
  // Formatear precio
  const formatearPrecio = (valor) => {
    if (!valor) return 'No especificado';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(valor);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Cabecera con imagen de fondo */}
      <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-500">
        {proveedor.imagen && (
          <img 
            src={proveedor.imagen} 
            alt={proveedor.nombre} 
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Botones superiores */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between">
          <button 
            onClick={onCerrar}
            className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          
          <button 
            onClick={() => onEditar(proveedor)}
            className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-700"
          >
            <Edit size={20} />
          </button>
        </div>
      </div>
      
      {/* Título y estado */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-bold text-gray-800">
            {proveedor.nombre || 'Proveedor sin nombre'}
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            proveedor.estado === 'Contratado' ? 'bg-green-100 text-green-800' :
            proveedor.estado === 'Contactado' ? 'bg-blue-100 text-blue-800' :
            proveedor.estado === 'Descartado' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {proveedor.estado || 'Nuevo'}
          </span>
        </div>
        <p className="text-gray-600">
          {proveedor.servicio || 'Sin categoría'}
        </p>
      </div>
      
      {/* Navegación pestañas */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setPestanaActiva('info')}
          className={`flex-1 py-3 font-medium text-sm border-b-2 transition-colors ${
            pestanaActiva === 'info' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Información
        </button>
        <button
          onClick={() => setPestanaActiva('comunicaciones')}
          className={`flex-1 py-3 font-medium text-sm border-b-2 transition-colors ${
            pestanaActiva === 'comunicaciones' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Seguimiento
        </button>
      </div>
      
      {/* Contenido de pestañas */}
      <div className="p-5">
        {pestanaActiva === 'info' ? (
          /* Información general */
          <div className="space-y-5">
            {/* Presupuesto y cita */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 mb-1">Presupuesto</p>
                <p className="text-lg font-semibold">{formatearPrecio(proveedor.presupuesto)}</p>
              </div>
              <div className="flex-1 min-w-[200px] bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 mb-1">Próxima cita</p>
                <div className="flex items-center">
                  <Calendar size={18} className="mr-2 text-purple-500" />
                  <p className="text-lg font-semibold">{formatearFecha(proveedor.fechaCita)}</p>
                </div>
              </div>
            </div>
            
            {/* Contacto */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-3 text-gray-700">Datos de contacto</h3>
              <div className="space-y-3">
                {proveedor.contacto && (
                  <div className="flex items-center">
                    <div className="w-8 text-gray-400"><MessageSquare size={16} /></div>
                    <p>{proveedor.contacto}</p>
                  </div>
                )}
                {proveedor.telefono && (
                  <div className="flex items-center">
                    <div className="w-8 text-gray-400"><Phone size={16} /></div>
                    <p>{proveedor.telefono}</p>
                  </div>
                )}
                {proveedor.email && (
                  <div className="flex items-center">
                    <div className="w-8 text-gray-400"><Mail size={16} /></div>
                    <p>{proveedor.email}</p>
                  </div>
                )}
                {proveedor.web && (
                  <div className="flex items-center">
                    <div className="w-8 text-gray-400"><Globe size={16} /></div>
                    <a 
                      href={proveedor.web} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {proveedor.web}
                    </a>
                  </div>
                )}
                {proveedor.ubicacion && (
                  <div className="flex items-center">
                    <div className="w-8 text-gray-400"><MapPin size={16} /></div>
                    <p>{proveedor.ubicacion}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notas */}
            {proveedor.notas && (
              <div className="bg-amber-50 rounded-lg p-4">
                <h3 className="font-medium mb-2 text-amber-700">Notas</h3>
                <p className="text-gray-700 whitespace-pre-line">{proveedor.notas}</p>
              </div>
            )}
          </div>
        ) : (
          /* Seguimiento de comunicaciones */
          <div>
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">Historial de comunicaciones</h3>
              <button 
                onClick={onNuevaComunicacion}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
              >
                Nueva entrada
              </button>
            </div>
            
            {comunicaciones && comunicaciones.length > 0 ? (
              <div className="space-y-4">
                {comunicaciones.map((item, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-800">{item.tipo || 'Comunicación'}</h4>
                      <span className="text-xs text-gray-500">
                        {formatearFecha(item.fecha)}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{item.mensaje}</p>
                    {item.adjuntos && item.adjuntos.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Adjuntos:</p>
                        <div className="flex flex-wrap gap-2">
                          {item.adjuntos.map((adjunto, idx) => (
                            <a
                              key={idx}
                              href={adjunto.url}
                              className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs flex items-center"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {adjunto.nombre}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>No hay comunicaciones registradas</p>
                <p className="mt-1 text-sm">Registra el primer contacto con este proveedor</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProveedorDetalle;
