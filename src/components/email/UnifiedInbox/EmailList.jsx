import React, { useState } from 'react';
import { 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Trash, 
  Star, 
  AlertCircle,
  Loader,
  Star as StarIcon
} from 'lucide-react';
import Button from '../../Button';
import { safeRender, ensureNotPromise, safeMap } from '../../../utils/promiseSafeRenderer';

/**
 * Componente que muestra una lista de emails con opciones de filtrado y ordenación
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.emails - Lista de emails a mostrar
 * @param {boolean} props.loading - Indicador de carga
 * @param {string} props.error - Mensaje de error si existe
 * @param {string} props.selectedEmailId - ID del email seleccionado
 * @param {Function} props.onSelectEmail - Función para seleccionar un email
 * @param {Function} props.onDeleteEmail - Función para eliminar un email
 * @param {Function} props.onSearch - Función para buscar emails
 * @param {string} props.searchTerm - Término de búsqueda actual
 * @param {string} props.sortField - Campo por el que ordenar
 * @param {string} props.sortDirection - Dirección de ordenación (asc/desc)
 * @param {Function} props.onSortChange - Función para cambiar ordenación
 * @param {string} props.currentFolder - Carpeta actual
 * @returns {JSX.Element} Componente de lista de emails
 */
const EmailList = ({
  emails,
  loading,
  error,
  selectedEmailId,
  onSelectEmail,
  onDeleteEmail,
  onSearch,
  searchTerm,
  sortField,
  sortDirection,
  onSortChange,
  currentFolder
}) => {
  const [selectedEmailIds, setSelectedEmailIds] = useState([]);

  // Manejador para seleccionar varios emails
  const handleToggleSelect = (emailId, event) => {
    event.stopPropagation();
    
    if (selectedEmailIds.includes(emailId)) {
      setSelectedEmailIds(prev => prev.filter(id => id !== emailId));
    } else {
      setSelectedEmailIds(prev => [...prev, emailId]);
    }
  };

  // Manejador para seleccionar todos los emails
  const handleSelectAll = () => {
    if (selectedEmailIds.length === emails.length) {
      setSelectedEmailIds([]);
    } else {
      setSelectedEmailIds(emails.map(email => email.id));
    }
  };

  // Manejador para eliminar emails seleccionados
  const handleDeleteSelected = () => {
    selectedEmailIds.forEach(id => onDeleteEmail(id));
    setSelectedEmailIds([]);
  };

  // Manejador para marcar como importante
  const handleToggleImportant = (emailId, event) => {
    event.stopPropagation();
    // Aquí implementaremos la funcionalidad para marcar como importante
    console.log('Marcar como importante:', emailId);
  };

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Si es de hoy, mostrar solo la hora
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Si es de este año pero no de hoy, mostrar día y mes
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit'
      });
    }
    
    // Si es de otro año, mostrar día/mes/año
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };
  
  // Componente para renderizar mensaje de estado
  const StatusMessage = ({ icon, message, className }) => (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      {icon}
      <p className="mt-4 text-sm">{message}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Barra de búsqueda y acciones */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="relative flex-1 max-w-lg">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar emails..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          
          <div className="ml-4 flex space-x-2">
            <Button
              disabled={selectedEmailIds.length === 0}
              onClick={handleDeleteSelected}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Trash size={16} className="mr-1" />
              <span className="hidden sm:inline">Eliminar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Cabecera de tabla */}
      <div className="border-b border-gray-200 px-4 py-2 grid grid-cols-12 gap-2 text-sm text-gray-500 font-medium bg-gray-50">
        <div className="col-span-1 flex items-center">
          <input
            type="checkbox"
            checked={selectedEmailIds.length === emails.length && emails.length > 0}
            onChange={handleSelectAll}
            className="rounded"
            disabled={emails.length === 0}
          />
        </div>
        <div
          className="col-span-3 sm:col-span-3 flex items-center cursor-pointer"
          onClick={() => onSortChange('from')}
        >
          {currentFolder === 'sent' ? 'Para' : 'De'} 
          {sortField === 'from' && (
            sortDirection === 'asc' 
              ? <ArrowUp size={14} className="inline ml-1" /> 
              : <ArrowDown size={14} className="inline ml-1" />
          )}
        </div>
        <div
          className="col-span-6 sm:col-span-6 cursor-pointer truncate"
          onClick={() => onSortChange('subject')}
        >
          Asunto {sortField === 'subject' && (
            sortDirection === 'asc' 
              ? <ArrowUp size={14} className="inline ml-1" /> 
              : <ArrowDown size={14} className="inline ml-1" />
          )}
        </div>
        <div
          className="col-span-2 sm:col-span-2 text-right cursor-pointer"
          onClick={() => onSortChange('date')}
        >
          Fecha {sortField === 'date' && (
            sortDirection === 'asc' 
              ? <ArrowUp size={14} className="inline ml-1" /> 
              : <ArrowDown size={14} className="inline ml-1" />
          )}
        </div>
      </div>

      {/* Lista de emails */}
      <div className="overflow-auto flex-grow">
        {loading ? (
          <StatusMessage 
            icon={<Loader size={32} className="animate-spin text-blue-500" />}
            message="Cargando emails..."
            className="text-gray-500"
          />
        ) : error ? (
          <StatusMessage 
            icon={<AlertCircle size={32} className="text-red-500" />}
            message={error}
            className="text-red-500"
          />
        ) : emails.length === 0 ? (
          <StatusMessage 
            icon={<AlertCircle size={32} className="text-gray-400" />}
            message="No hay emails en esta carpeta"
            className="text-gray-500"
          />
        ) : (
          <div className="divide-y divide-gray-100" data-testid="email-list">
            {safeMap(emails, []).map((email) => (
              <div
                key={safeRender(email.id, '')}
                onClick={() => onSelectEmail(safeRender(email.id, ''))}
                className={`grid grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedEmailId === safeRender(email.id, '') ? 'bg-blue-50' : ''
                } ${!safeRender(email.read, false) ? 'font-medium' : ''}`}
              >
                <div 
                  className="col-span-1 flex items-center justify-center" 
                  onClick={(e) => handleToggleSelect(safeRender(email.id, ''), e)}
                >
                  <input
                    type="checkbox"
                    checked={selectedEmailIds.includes(safeRender(email.id, ''))}
                    onChange={() => {}}
                    className="rounded"
                  />
                </div>
                <div className="col-span-3 sm:col-span-3 truncate">
                  {currentFolder === 'sent' ? safeRender(email.to, '') : safeRender(email.from, '')}
                </div>
                <div className="col-span-6 sm:col-span-6 truncate flex items-center">
                  <span className="mr-2 truncate">
                    {safeRender(email.subject, '(Sin asunto)')}
                  </span>
                  {email.attachments && email.attachments.length > 0 && (
                    <span className="text-gray-500 text-xs">📎</span>
                  )}
                </div>
                <div className="col-span-2 sm:col-span-2 text-right text-gray-500 text-sm flex items-center justify-end">
                  <span className="mr-2">{formatDate(email.date)}</span>
                  <button 
                    onClick={(e) => handleToggleImportant(email.id, e)}
                    className={`focus:outline-none ${email.important ? 'text-yellow-500' : 'text-gray-300 hover:text-gray-400'}`}
                  >
                    <StarIcon size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailList;
