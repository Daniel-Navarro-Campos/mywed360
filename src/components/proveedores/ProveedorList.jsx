import React, { useMemo } from 'react';
import { Search, RefreshCcw } from 'lucide-react';
import ProveedorCard from './ProveedorCard';
import Button from '../../components/Button';
import Card from '../../components/Card';

/**
 * @typedef {import('../../hooks/useProveedores').Provider} Provider
 */

/**
 * Componente que muestra la lista de proveedores con filtros y opciones de búsqueda.
 * Permite filtrar por servicio, estado y rango de fechas, así como buscar por término.
 * También proporciona navegación por pestañas para ver diferentes grupos de proveedores.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Provider[]} props.providers - Lista de proveedores a mostrar
 * @param {string} props.searchTerm - Término de búsqueda actual
 * @param {Function} props.setSearchTerm - Función para actualizar el término de búsqueda
 * @param {string} props.serviceFilter - Filtro actual por servicio
 * @param {Function} props.setServiceFilter - Función para actualizar el filtro por servicio
 * @param {string} props.statusFilter - Filtro actual por estado
 * @param {Function} props.setStatusFilter - Función para actualizar el filtro por estado
 * @param {string} props.dateFrom - Fecha inicial para filtro por rango
 * @param {Function} props.setDateFrom - Función para actualizar la fecha inicial
 * @param {string} props.dateTo - Fecha final para filtro por rango
 * @param {Function} props.setDateTo - Función para actualizar la fecha final
 * @param {Function} props.clearFilters - Función para limpiar todos los filtros
 * @param {Function} props.handleViewDetail - Función para ver detalles de un proveedor
 * @param {string} props.tab - Pestaña actual ('all', 'selected', 'contacted')
 * @param {Function} props.setTab - Función para cambiar la pestaña
 * @param {string[]} props.selected - IDs de proveedores seleccionados
 * @param {Function} props.toggleSelect - Función para alternar selección de proveedor
 * @returns {React.ReactElement} Componente de lista de proveedores con filtros
 */
const ProveedorList = ({ 
  providers, 
  searchTerm, 
  setSearchTerm,
  serviceFilter, 
  setServiceFilter, 
  statusFilter, 
  setStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  clearFilters,
  handleViewDetail,
  tab,
  setTab,
  selected,
  toggleFavorite,
  toggleSelect
}) => {
  // Lista de servicios únicos para el filtro usando useMemo para evitar cálculos innecesarios
  const uniqueServices = useMemo(() => {
    return [...new Set(providers.map(p => p.service))].filter(Boolean);
  }, [providers]);
  
  // Lista de estados únicos para el filtro usando useMemo
  const uniqueStatuses = useMemo(() => {
    return [...new Set(providers.map(p => p.status))].filter(Boolean);
  }, [providers]);
  
  // Filtrado de proveedores usando useMemo para mejorar rendimiento
  const filteredProviders = useMemo(() => {
    return providers
      .filter(p => {
        // Filtrar por término de búsqueda
        if (searchTerm && !p.name?.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !p.service?.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !p.contact?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !p.status?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Filtrar por servicio
        if (serviceFilter && p.service !== serviceFilter) {
          return false;
        }
        
        // Filtrar por estado
        if (statusFilter && p.status !== statusFilter) {
          return false;
        }
        
        // Filtrar por fecha desde
        if (dateFrom && new Date(p.date) < new Date(dateFrom)) {
          return false;
        }
        
        // Filtrar por fecha hasta
        if (dateTo && new Date(p.date) > new Date(dateTo)) {
          return false;
        }
        
        // Filtrado por pestaña
        if (tab === 'selected' && !selected.includes(p.id)) {
          return false;
        }
        
        if (tab === 'contacted' && p.status !== 'Contactado' && p.status !== 'Confirmado' && p.status !== 'Seleccionado') {
          return false;
        }
        
        return true;
      });
  }, [providers, searchTerm, serviceFilter, statusFilter, dateFrom, dateTo, tab, selected]);

  return (
    <div className="w-full">
      <Card className="mb-5">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Búsqueda por texto */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar proveedores..."
              className="w-full p-2 pl-10 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          </div>
          
          {/* Filtro por servicio */}
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
          >
            <option value="">Todos los servicios</option>
            {uniqueServices.map(service => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
          
          {/* Filtro por estado */}
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        
        {/* Filtros por fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Desde fecha:</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Hasta fecha:</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </div>
        
        {/* Botones de acción para filtros */}
        <div className="flex justify-end space-x-2">
          <Button onClick={clearFilters} variant="outline" size="sm">
            <RefreshCcw size={16} className="mr-1" /> Limpiar filtros
          </Button>
        </div>
      </Card>

      {/* Selector de pestaña */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`py-2 px-4 ${tab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setTab('all')}
        >
          Todos
        </button>
        <button
          className={`py-2 px-4 ${tab === 'reserved' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setTab('reserved')}
        >
          Reservas
        </button>
        <button
          className={`py-2 px-4 ${tab === 'favorite' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setTab('favorite')}
        >
          Favoritos
        </button>
      </div>

      {/* Lista de proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProviders.length > 0 ? (
          filteredProviders.map(provider => (
            <ProveedorCard
              key={provider.id}
              provider={provider}
              isSelected={selected.includes(provider.id)}
              onToggleSelect={() => toggleSelect(provider.id)}
              onViewDetail={() => handleViewDetail(provider)}
              onToggleFavorite={toggleFavorite}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            No hay proveedores que coincidan con los filtros aplicados.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProveedorList;
