import React, { useCallback } from 'react';
import { Search, Filter, Download, Upload, Plus, MessageSquare } from 'lucide-react';
import { Button } from '../ui';
import { Input } from '../ui';
import useTranslations from '../../hooks/useTranslations';

/**
 * Componente de filtros y acciones para la lista de invitados
 * Optimizado con memoización y UX mejorada
 */
const GuestFilters = React.memo(({ 
  searchTerm,
  statusFilter,
  tableFilter,
  onSearchChange,
  onStatusFilterChange,
  onTableFilterChange,
  onAddGuest,
  onBulkInvite,
  onImportGuests,
  onExportGuests,
  guestCount = 0,
  isLoading = false
}) => {
  const { t, wedding } = useTranslations();

  // Opciones de estado para el filtro
  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: wedding.guestStatus('pending') },
    { value: 'confirmed', label: wedding.guestStatus('confirmed') },
    { value: 'declined', label: wedding.guestStatus('declined') }
  ];

  // Manejar cambios en los filtros
  const handleSearchChange = useCallback((e) => {
    onSearchChange?.(e.target.value);
  }, [onSearchChange]);

  const handleStatusChange = useCallback((e) => {
    onStatusFilterChange?.(e.target.value);
  }, [onStatusFilterChange]);

  const handleTableChange = useCallback((e) => {
    onTableFilterChange?.(e.target.value);
  }, [onTableFilterChange]);

  // Funciones de acción
  const handleAddGuest = useCallback(() => {
    onAddGuest?.();
  }, [onAddGuest]);

  const handleBulkInvite = useCallback(() => {
    if (guestCount === 0) {
      alert('No hay invitados para enviar invitaciones');
      return;
    }
    
    if (window.confirm(`¿Enviar invitaciones masivas a ${guestCount} invitados?`)) {
      onBulkInvite?.();
    }
  }, [onBulkInvite, guestCount]);

  const handleImport = useCallback(() => {
    onImportGuests?.();
  }, [onImportGuests]);

  const handleExport = useCallback(() => {
    onExportGuests?.();
  }, [onExportGuests]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
      {/* Título y contador */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('guests.guestList')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {guestCount} {guestCount === 1 ? 'invitado' : 'invitados'} en total
          </p>
        </div>
        
        {/* Botón principal de añadir */}
        <Button
          onClick={handleAddGuest}
          disabled={isLoading}
          className="flex items-center"
        >
          <Plus size={20} className="mr-2" />
          {t('guests.addGuest')}
        </Button>
      </div>

      {/* Filtros de búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Búsqueda por texto */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
            disabled={isLoading}
          />
        </div>

        {/* Filtro por estado */}
        <div className="relative">
          <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por mesa */}
        <div>
          <Input
            type="text"
            placeholder="Filtrar por mesa..."
            value={tableFilter}
            onChange={handleTableChange}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Acciones masivas */}
      <div className="flex flex-wrap gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleBulkInvite}
          disabled={isLoading || guestCount === 0}
          className="flex items-center"
        >
          <MessageSquare size={16} className="mr-2" />
          Invitaciones masivas
        </Button>

        <Button
          variant="outline"
          onClick={handleImport}
          disabled={isLoading}
          className="flex items-center"
        >
          <Upload size={16} className="mr-2" />
          {t('guests.importGuests')}
        </Button>

        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isLoading || guestCount === 0}
          className="flex items-center"
        >
          <Download size={16} className="mr-2" />
          {t('guests.exportGuests')}
        </Button>
      </div>

      {/* Indicador de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-600">Actualizando...</span>
        </div>
      )}
    </div>
  );
});

GuestFilters.displayName = 'GuestFilters';

export default GuestFilters;
