import React, { useState } from 'react';
import { Sparkles, Search, X, RotateCw } from 'lucide-react';

/**
 * Modal para buscar proveedores mediante IA
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.visible - Indica si el modal está visible
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onBuscar - Función para realizar la búsqueda
 * @param {Function} props.onGuardar - Función para guardar el proveedor encontrado
 * @param {Object} props.resultado - Resultado de la búsqueda
 * @param {boolean} props.cargando - Indica si está cargando la búsqueda
 * @returns {React.ReactElement} Modal de búsqueda por IA
 */
const AIBusquedaModal = ({ 
  visible, 
  onClose, 
  onBuscar,
  onGuardar,
  resultado,
  cargando = false
}) => {
  const [consulta, setConsulta] = useState('');
  
  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (consulta.trim()) {
      onBuscar(consulta);
    }
  };
  
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <div className="flex items-center">
            <Sparkles className="text-purple-500 mr-2" size={20} />
            <h3 className="font-semibold text-lg text-gray-800">Búsqueda inteligente de proveedores</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* Formulario de búsqueda */}
        <div className="p-5 border-b border-gray-200">
          <p className="text-gray-600 mb-3">
            Describe qué tipo de proveedor estás buscando y la IA encontrará opciones para ti.
          </p>
          <form onSubmit={handleSubmit} className="flex items-start gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                placeholder="Ej: 'Fotógrafo de bodas en Madrid con estilo reportaje'"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Sé específico para mejores resultados</p>
            </div>
            <button
              type="submit"
              disabled={cargando || !consulta.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? (
                <RotateCw className="animate-spin mr-2" size={16} />
              ) : (
                <Search className="mr-2" size={16} />
              )}
              Buscar
            </button>
          </form>
        </div>
        
        {/* Resultados */}
        <div className="flex-1 overflow-y-auto p-5">
          {cargando ? (
            <div className="text-center py-10">
              <RotateCw className="animate-spin h-10 w-10 text-purple-500 mx-auto mb-4" />
              <p className="text-gray-600">Buscando proveedores...</p>
            </div>
          ) : resultado ? (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-semibold">{resultado.nombre}</h4>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {resultado.servicio}
                </span>
              </div>
              
              <div className="space-y-3">
                {resultado.descripcion && (
                  <p className="text-gray-600">{resultado.descripcion}</p>
                )}
                
                {resultado.web && (
                  <div>
                    <span className="text-gray-500 text-sm">Web:</span>
                    <a 
                      href={resultado.web} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ml-2 text-blue-600 hover:underline break-all"
                    >
                      {resultado.web}
                    </a>
                  </div>
                )}
                
                {resultado.ubicacion && (
                  <div>
                    <span className="text-gray-500 text-sm">Ubicación:</span>
                    <span className="ml-2">{resultado.ubicacion}</span>
                  </div>
                )}
                
                {resultado.contacto && (
                  <div>
                    <span className="text-gray-500 text-sm">Contacto:</span>
                    <span className="ml-2">{resultado.contacto}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-5 text-right">
                <button
                  onClick={() => onGuardar(resultado)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"
                >
                  Guardar proveedor
                </button>
              </div>
            </div>
          ) : consulta && !cargando ? (
            <div className="text-center py-10">
              <p className="text-gray-600">No se encontraron resultados para tu búsqueda.</p>
              <p className="text-sm text-gray-500 mt-1">Intenta con términos diferentes o más específicos.</p>
            </div>
          ) : (
            <div className="text-center py-10">
              <Sparkles className="h-12 w-12 text-purple-300 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-gray-700 mb-2">Busca con inteligencia artificial</h4>
              <p className="text-gray-500 max-w-md mx-auto">
                Describe el tipo de proveedor que necesitas y la IA encontrará opciones perfectas para tu boda.
              </p>
            </div>
          )}
        </div>
        
        {/* Pie del modal */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            La información proporcionada es orientativa. Recomendamos verificar siempre los datos de contacto antes de contratar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIBusquedaModal;
