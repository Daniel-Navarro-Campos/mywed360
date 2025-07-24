import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../Button';

/**
 * Componente para filtros avanzados de correo electrónico
 * Permite filtrar por fecha, remitente, etiquetas, etc.
 */
const EmailFilters = ({ onApplyFilters, onResetFilters, initialFilters = {} }) => {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState({
    from: initialFilters.from || '',
    to: initialFilters.to || '',
    subject: initialFilters.subject || '',
    hasAttachment: initialFilters.hasAttachment || false,
    dateFrom: initialFilters.dateFrom || '',
    dateTo: initialFilters.dateTo || '',
    isUnread: initialFilters.isUnread || false,
    labels: initialFilters.labels || [],
  });
  
  // Etiquetas predefinidas para el filtrado
  const availableLabels = [
    { id: 'important', name: 'Importante', color: 'bg-red-500' },
    { id: 'work', name: 'Trabajo', color: 'bg-blue-500' },
    { id: 'personal', name: 'Personal', color: 'bg-green-500' },
    { id: 'invitation', name: 'Invitación', color: 'bg-purple-500' },
    { id: 'provider', name: 'Proveedor', color: 'bg-yellow-500' },
  ];
  
  // Manejar cambios en los filtros
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  // Manejar selección de etiquetas
  const handleLabelToggle = (labelId) => {
    setFilters(prev => {
      if (prev.labels.includes(labelId)) {
        return { ...prev, labels: prev.labels.filter(id => id !== labelId) };
      } else {
        return { ...prev, labels: [...prev.labels, labelId] };
      }
    });
  };
  
  // Aplicar filtros
  const handleApply = () => {
    onApplyFilters(filters);
  };
  
  // Resetear filtros
  const handleReset = () => {
    setFilters({
      from: '',
      to: '',
      subject: '',
      hasAttachment: false,
      dateFrom: '',
      dateTo: '',
      isUnread: false,
      labels: [],
    });
    onResetFilters();
  };
  
  return (
    <div className="bg-white border rounded-md shadow-sm mb-4">
      {/* Cabecera de filtros */}
      <div 
        className="flex justify-between items-center p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <Filter size={16} className="text-gray-500 mr-2" />
          <h3 className="font-medium">Filtros avanzados</h3>
        </div>
        <div>
          {expanded ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </div>
      </div>
      
      {/* Panel de filtros expandible */}
      {expanded && (
        <div className="p-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro: De */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filter-from">
                De (Remitente)
              </label>
              <input
                id="filter-from"
                type="text"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="correo@ejemplo.com"
              />
            </div>
            
            {/* Filtro: Para */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filter-to">
                Para (Destinatario)
              </label>
              <input
                id="filter-to"
                type="text"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="correo@ejemplo.com"
              />
            </div>
            
            {/* Filtro: Asunto */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filter-subject">
                Asunto contiene
              </label>
              <input
                id="filter-subject"
                type="text"
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Palabras clave en el asunto"
              />
            </div>
            
            {/* Filtro: Rango de fechas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filter-date-from">
                Desde fecha
              </label>
              <input
                id="filter-date-from"
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filter-date-to">
                Hasta fecha
              </label>
              <input
                id="filter-date-to"
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Filtros tipo checkbox */}
            <div className="flex items-center">
              <input
                id="filter-attachment"
                type="checkbox"
                name="hasAttachment"
                checked={filters.hasAttachment}
                onChange={handleFilterChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="filter-attachment" className="ml-2 block text-sm text-gray-700">
                Con archivos adjuntos
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="filter-unread"
                type="checkbox"
                name="isUnread"
                checked={filters.isUnread}
                onChange={handleFilterChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="filter-unread" className="ml-2 block text-sm text-gray-700">
                Solo no leídos
              </label>
            </div>
            
            {/* Filtro: Etiquetas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiquetas
              </label>
              <div className="flex flex-wrap gap-2">
                {availableLabels.map(label => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => handleLabelToggle(label.id)}
                    className={`px-2 py-1 rounded-full text-xs flex items-center
                      ${filters.labels.includes(label.id) 
                        ? `${label.color} text-white` 
                        : 'bg-gray-100 text-gray-800'}`}
                  >
                    <span className={`w-2 h-2 rounded-full mr-1 ${filters.labels.includes(label.id) ? 'bg-white' : label.color}`}></span>
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end mt-4 space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex items-center"
            >
              <X size={14} className="mr-1" /> Limpiar filtros
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleApply}
              className="flex items-center"
            >
              <Filter size={14} className="mr-1" /> Aplicar filtros
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailFilters;
