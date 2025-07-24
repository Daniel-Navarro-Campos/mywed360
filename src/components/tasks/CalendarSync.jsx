import React, { useState, useEffect } from 'react';
import { useCalendarSync } from '../../hooks/useCalendarSync';
import { Button, Spinner, Alert, Badge } from '../../components/ui';
import { Calendar, RefreshCw, Link2, Check, AlertTriangle, Clock } from 'lucide-react';

/**
 * Componente para sincronización bidireccional de calendarios
 */
const CalendarSync = ({ onEventsImported }) => {
  const { 
    isLoading, 
    isAuthenticated, 
    syncedCalendars, 
    lastSync,
    error, 
    authenticate, 
    logout, 
    getAvailableCalendars,
    saveCalendarSyncConfig,
    importEventsFromGoogle,
    exportEventsToGoogle,
    syncBidirectional 
  } = useCalendarSync();
  
  const [availableCalendars, setAvailableCalendars] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [syncStatus, setSyncStatus] = useState({ imported: 0, exported: 0 });
  const [showConfig, setShowConfig] = useState(false);
  
  // Cargar calendarios cuando el usuario se autentique
  useEffect(() => {
    const loadCalendars = async () => {
      if (isAuthenticated) {
        const calendars = await getAvailableCalendars();
        setAvailableCalendars(calendars);
        setSelectedCalendars(syncedCalendars.map(cal => cal.id));
      }
    };
    
    loadCalendars();
  }, [isAuthenticated, syncedCalendars]);
  
  // Manejar cambio de selección de calendario
  const handleCalendarToggle = (calendar) => {
    setSelectedCalendars(prev => {
      if (prev.includes(calendar.id)) {
        return prev.filter(id => id !== calendar.id);
      } else {
        return [...prev, calendar.id];
      }
    });
  };
  
  // Guardar configuración de calendarios seleccionados
  const handleSaveConfig = async () => {
    const selected = availableCalendars.filter(cal => selectedCalendars.includes(cal.id));
    await saveCalendarSyncConfig(selected);
    setShowConfig(false);
  };
  
  // Sincronizar eventos bidireccionales
  const handleSync = async () => {
    if (syncedCalendars.length === 0) {
      setShowConfig(true);
      return;
    }
    
    setSyncStatus({ imported: 0, exported: 0 });
    
    for (const calendar of syncedCalendars) {
      const result = await syncBidirectional(calendar.id);
      setSyncStatus(prev => ({
        imported: prev.imported + result.imported.length,
        exported: prev.exported + result.exported.length
      }));
      
      if (result.imported.length > 0 && onEventsImported) {
        onEventsImported(result.imported);
      }
    }
  };
  
  // Formatear fecha para mostrar
  const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 my-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Calendar size={20} className="mr-2 text-blue-500" />
          Sincronización de Calendario
        </h3>
        
        {lastSync && (
          <div className="flex items-center text-sm text-gray-500">
            <Clock size={14} className="mr-1" />
            Última sincronización: {formatDate(lastSync)}
          </div>
        )}
      </div>
      
      {error && (
        <Alert type="error" className="mb-4">
          <AlertTriangle size={16} className="mr-2" />
          {error}
        </Alert>
      )}
      
      {/* Estado de conexión */}
      <div className="flex items-center mb-4">
        <div className="mr-4">
          {isAuthenticated ? (
            <Badge type="success" className="flex items-center">
              <Check size={14} className="mr-1" /> Conectado
            </Badge>
          ) : (
            <Badge type="warning" className="flex items-center">
              <Link2 size={14} className="mr-1" /> No conectado
            </Badge>
          )}
        </div>
        
        <div className="ml-auto">
          {isAuthenticated ? (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={logout} 
              disabled={isLoading}
            >
              Desconectar
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="primary" 
              onClick={authenticate} 
              disabled={isLoading}
            >
              Conectar con Google Calendar
              {isLoading && <Spinner size="sm" className="ml-2" />}
            </Button>
          )}
        </div>
      </div>
      
      {/* Panel de calendarios */}
      {isAuthenticated && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-md font-medium">
              Calendarios ({syncedCalendars.length})
            </h4>
            
            <Button 
              size="xs" 
              variant="secondary" 
              onClick={() => setShowConfig(!showConfig)}
            >
              {showConfig ? 'Ocultar' : 'Configurar'}
            </Button>
          </div>
          
          {/* Lista de calendarios configurados */}
          {!showConfig && syncedCalendars.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {syncedCalendars.map(calendar => (
                <div 
                  key={calendar.id} 
                  className="flex items-center p-2 rounded border text-sm"
                  style={{ 
                    borderColor: calendar.backgroundColor || '#ccc',
                    backgroundColor: `${calendar.backgroundColor}10` || '#f9f9f9'
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: calendar.backgroundColor || '#ccc' }}
                  />
                  <span className="truncate">{calendar.summary}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Panel de configuración de calendarios */}
          {showConfig && (
            <div className="border rounded p-3 bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">
                Selecciona los calendarios que deseas sincronizar:
              </p>
              
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Spinner />
                </div>
              ) : (
                <>
                  <div className="max-h-48 overflow-y-auto mb-3">
                    {availableCalendars.length > 0 ? (
                      availableCalendars.map(calendar => (
                        <div key={calendar.id} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id={calendar.id}
                            checked={selectedCalendars.includes(calendar.id)}
                            onChange={() => handleCalendarToggle(calendar)}
                            className="mr-2"
                          />
                          <label 
                            htmlFor={calendar.id} 
                            className="flex items-center cursor-pointer"
                          >
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: calendar.backgroundColor || '#ccc' }}
                            />
                            <span>{calendar.summary}</span>
                            {calendar.primary && (
                              <Badge type="info" className="ml-2 text-xs">Principal</Badge>
                            )}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm italic">
                        No se encontraron calendarios
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowConfig(false)}
                      className="mr-2"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="primary" 
                      onClick={handleSaveConfig}
                      disabled={selectedCalendars.length === 0}
                    >
                      Guardar configuración
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Botón de sincronización y estado */}
          <div className="mt-4 flex justify-between items-center">
            <div>
              {(syncStatus.imported > 0 || syncStatus.exported > 0) && (
                <div className="text-sm">
                  <Badge type="success" className="mr-2">
                    {syncStatus.imported} eventos importados
                  </Badge>
                  <Badge type="info">
                    {syncStatus.exported} eventos exportados
                  </Badge>
                </div>
              )}
            </div>
            
            <Button
              variant="primary"
              onClick={handleSync}
              disabled={isLoading || syncedCalendars.length === 0}
              className="flex items-center"
            >
              <RefreshCw size={16} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Sincronizar ahora
              {isLoading && <Spinner size="sm" className="ml-2" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarSync;
