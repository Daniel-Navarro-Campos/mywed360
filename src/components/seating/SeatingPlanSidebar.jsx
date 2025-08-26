/**
 * Componente Sidebar especializado para el plan de asientos
 * Maneja la información de mesas seleccionadas, herramientas de dibujo e invitados
 */

import React, { useState } from 'react';
import { 
  Settings, Users, Maximize2, RotateCcw, Move, Hand, 
  Pencil, Minus, Square, Zap, Search, UserPlus,
  MousePointer, Edit3, Eraser, DoorOpen, Hexagon
} from 'lucide-react';

const SeatingPlanSidebar = ({
  selectedTable,
  onTableDimensionChange,
  onToggleTableShape,
  onConfigureTable,
  guests = [],
  tab,
  drawMode = 'pan',
  onDrawModeChange,
  onAssignGuest,
  onAutoAssign,
  className = ""
}) => {
  const [guestSearch, setGuestSearch] = useState('');
  const [showAvailableGuests, setShowAvailableGuests] = useState(false);
  
  // Herramientas de dibujo específicas para banquete
  const drawingTools = [
    { id: 'pan', label: 'Navegar', icon: Hand },
    { id: 'move', label: 'Mover mesas', icon: Move },
    { id: 'boundary', label: 'Perímetro', icon: Square },
    { id: 'door', label: 'Puertas', icon: DoorOpen },
    { id: 'obstacle', label: 'Obstáculos', icon: Hexagon },
    { id: 'aisle', label: 'Pasillos', icon: Minus },
    { id: 'erase', label: 'Borrar', icon: Eraser }
  ];

  // Filtrar invitados disponibles (sin asignar)
  const availableGuests = guests.filter(guest => 
    !guest.tableId && 
    guest.name.toLowerCase().includes(guestSearch.toLowerCase())
  );

  const assignedGuests = guests.filter(guest => 
    guest.tableId === selectedTable?.id
  );

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
      {/* Herramientas de Dibujo */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <h3 className="font-medium text-gray-900 mb-3">Herramientas</h3>
        <div className="grid grid-cols-2 gap-2">
          {drawingTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onDrawModeChange?.(tool.id)}
                className={`flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
                  drawMode === tool.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                title={tool.label}
              >
                <Icon className="h-3 w-3" />
                <span className="truncate">{tool.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Instrucciones de uso */}
        {drawMode === 'boundary' && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            <strong>Perímetro:</strong> Haz clic para añadir puntos. Doble clic para cerrar el polígono.
          </div>
        )}
        {drawMode === 'obstacle' && (
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
            <strong>Obstáculos:</strong> Arrastra para crear rectángulos (columnas, decoraciones).
          </div>
        )}
        {drawMode === 'door' && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
            <strong>Puertas:</strong> Arrastra para marcar entradas y salidas.
          </div>
        )}
        {drawMode === 'aisle' && (
          <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-800">
            <strong>Pasillos:</strong> Arrastra para crear líneas de circulación.
          </div>
        )}
      </div>

      {/* Asignación Automática */}
      {tab === 'banquet' && (
        <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <button
            onClick={onAutoAssign}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded text-sm hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <Zap className="h-4 w-4" />
            Asignación Automática IA
          </button>
        </div>
      )}

      {/* Panel de Invitados Disponibles */}
      {tab === 'banquet' && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Invitados Disponibles</h4>
            <button
              onClick={() => setShowAvailableGuests(!showAvailableGuests)}
              className="text-blue-600 hover:text-blue-700"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>
          
          {showAvailableGuests && (
            <>
              {/* Buscador */}
              <div className="relative mb-3">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar invitados..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Lista de invitados disponibles */}
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableGuests.length > 0 ? (
                  availableGuests.slice(0, 10).map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-xs cursor-pointer hover:bg-green-100"
                      onClick={() => selectedTable && onAssignGuest?.(selectedTable.id, guest.id)}
                    >
                      <div>
                        <div className="font-medium text-green-800">{guest.name}</div>
                        {guest.side && (
                          <div className="text-green-600 capitalize">{guest.side}</div>
                        )}
                      </div>
                      <MousePointer className="h-3 w-3 text-green-600" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-gray-500 text-xs">
                    {guestSearch ? 'No se encontraron invitados' : 'Todos los invitados están asignados'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Información de Mesa Seleccionada */}
      {selectedTable && (
        <>
          <div className="bg-gray-50 px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">
                {selectedTable.name || `Mesa ${selectedTable.id}`}
              </h3>
              <button
                onClick={() => onConfigureTable?.(selectedTable)}
                className="p-1 hover:bg-gray-200 rounded"
                title="Configurar mesa"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Contenido de Mesa Seleccionada */}
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
                      onChange={(e) => onTableDimensionChange?.('width', e.target.value)}
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
                      onChange={(e) => onTableDimensionChange?.('height', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Invitados asignados a esta mesa */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <Users className="h-4 w-4" />
                Invitados Asignados ({assignedGuests.length})
              </h4>
              
              {assignedGuests.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {assignedGuests.map((guest, index) => (
                    <div
                      key={guest.id || index}
                      className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-sm"
                    >
                      <div>
                        <div className="font-medium text-blue-800">{guest.name}</div>
                        {guest.side && (
                          <div className="text-xs text-blue-600 capitalize">
                            {guest.side}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => onAssignGuest?.(selectedTable.id, null)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
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
                  <p className="text-xs mt-1">Usa el panel de arriba para asignar</p>
                </div>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="pt-3 border-t space-y-2">
              <button
                onClick={() => onConfigureTable?.(selectedTable)}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Configurar Mesa
              </button>
              
              {tab === 'banquet' && (
                <button
                  onClick={() => setShowAvailableGuests(!showAvailableGuests)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  {showAvailableGuests ? 'Ocultar' : 'Mostrar'} Invitados
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(SeatingPlanSidebar);
