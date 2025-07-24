import React from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

/**
 * Componente para filtrar y buscar proveedores con pestañas para diferentes categorías
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.filtroActivo - El filtro actualmente seleccionado
 * @param {Function} props.onCambioFiltro - Función a ejecutar cuando se cambia el filtro
 * @param {Function} props.onBuscar - Función a ejecutar cuando se busca
 * @param {string} props.textoBusqueda - Texto de búsqueda actual
 * @param {Function} props.onCambioTexto - Función a ejecutar cuando cambia el texto de búsqueda
 * @returns {React.ReactElement} Componente de filtro de proveedores
 */
const ProveedorFiltro = ({ 
  filtroActivo = 'todos', 
  onCambioFiltro,
  onBuscar,
  textoBusqueda = '',
  onCambioTexto
}) => {
  // Opciones de filtro disponibles
  const filtros = [
    { id: 'todos', label: 'Todos' },
    { id: 'contratados', label: 'Contratados' },
    { id: 'contactados', label: 'Contactados' },
    { id: 'favoritos', label: 'Favoritos' },
  ];

  // Manejar la búsqueda con Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onBuscar(textoBusqueda);
    }
  };

  return (
    <div className="mb-6">
      {/* Pestañas de filtro */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-6" aria-label="Pestañas">
          {filtros.map((filtro) => (
            <button
              key={filtro.id}
              onClick={() => onCambioFiltro(filtro.id)}
              className={`
                whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
                ${filtroActivo === filtro.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {filtro.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Barra de búsqueda */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={textoBusqueda}
            onChange={(e) => onCambioTexto(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Buscar proveedores..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <button
          onClick={() => onBuscar(textoBusqueda)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Buscar
        </button>
        
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <SlidersHorizontal size={16} className="mr-2" />
          Filtros
        </button>
      </div>
    </div>
  );
};

export default ProveedorFiltro;
