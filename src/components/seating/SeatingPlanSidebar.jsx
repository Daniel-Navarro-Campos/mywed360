/**
 * Componente Sidebar especializado para el plan de asientos
 * Maneja la información de mesas seleccionadas y configuraciones
 */

import React from 'react';
import { Settings, Users, Maximize2, RotateCcw } from 'lucide-react';

const SeatingPlanSidebar = ({
  selectedTable,
  onTableDimensionChange,
  onToggleTableShape,
  onConfigureTable,
  guests = [],
  tab,
  className = ""
}) => {
  if (!selectedTable) {
    return (
      <div className={`bg-white border rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Selecciona una mesa para ver detalles</p>
        </div>
      </div>
    );
  }

  const assignedGuests = guests.filter(guest => 
    guest.tableId === selectedTable.id || guest.seatId === selectedTable.id
  );

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            {selectedTable.name || `Mesa ${selectedTable.id}`}
          </h3>
          <button
            onClick={() => onConfigureTable(selectedTable)}
            className="p-1 hover:bg-gray-200 rounded"
            title="Configurar mesa"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-4">
        {/* Información básica */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tipo:</span>
            <span className="font-medium capitalize">
              {tab === 'ceremony' ? 'Ceremonia' : 'Banquete'}
            </span>
          </div>
          
          {tab === 'banquet' && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Asientos:</span>
                <span className="font-medium">{selectedTable.seats || 8}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Forma:</span>
                <button
                  onClick={onToggleTableShape}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                  <span className="capitalize">{selectedTable.shape || 'rectangle'}</span>
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Dimensiones */}
        {tab === 'banquet' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1">
              <Maximize2 className="h-4 w-4" />
              Dimensiones
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Ancho (cm)
                </label>
                <input
                  type="number"
                  min="20"
                  max="400"
                  value={selectedTable.width || 80}
                  onChange={(e) => onTableDimensionChange('width', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Largo (cm)
                </label>
                <input
                  type="number"
                  min="20"
                  max="400"
                  value={selectedTable.height || selectedTable.length || 60}
                  onChange={(e) => onTableDimensionChange('height', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Invitados asignados */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1">
            <Users className="h-4 w-4" />
            Invitados ({assignedGuests.length})
          </h4>
          
          {assignedGuests.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {assignedGuests.map((guest, index) => (
                <div
                  key={guest.id || index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <div>
                    <div className="font-medium">{guest.name}</div>
                    {guest.side && (
                      <div className="text-xs text-gray-500 capitalize">
                        {guest.side}
                      </div>
                    )}
                  </div>
                  
                  <button
                    className="text-red-500 hover:text-red-700 text-xs"
                    title="Quitar invitado"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No hay invitados asignados</p>
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="pt-3 border-t space-y-2">
          <button
            onClick={() => onConfigureTable(selectedTable)}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Configurar Mesa
          </button>
          
          {tab === 'banquet' && (
            <button
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
            >
              Asignar Invitados
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SeatingPlanSidebar);
