import React, { useEffect, useState } from 'react';
import errorLogger from '../utils/errorLogger';

/**
 * Panel de Diagnóstico que se ejecuta automáticamente
 * Muestra el estado de todos los servicios y errores en tiempo real
 */
const DiagnosticPanel = () => {
  const [diagnostics, setDiagnostics] = useState({});
  const [errors, setErrors] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    // Inicializar diagnósticos
    const initDiagnostics = async () => {
      // Esperar a que el errorLogger termine su inicialización
      const checkInitialized = () => {
        if (errorLogger.isInitialized) {
          setDiagnostics(errorLogger.diagnostics);
          setErrors(errorLogger.errors);
          setStats(errorLogger.getErrorStats());
        } else {
          setTimeout(checkInitialized, 100);
        }
      };
      checkInitialized();
    };

    initDiagnostics();

    // Actualizar cada 5 segundos
    const interval = setInterval(() => {
      setDiagnostics({ ...errorLogger.diagnostics });
      setErrors([...errorLogger.errors]);
      setStats(errorLogger.getErrorStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Mostrar automáticamente si hay errores críticos
  useEffect(() => {
    const hasErrors = Object.values(diagnostics).some(d => d.status === 'error');
    if (hasErrors && !isVisible) {
      console.warn('🚨 Se detectaron errores críticos. Mostrando panel de diagnóstico...');
    }
  }, [diagnostics, isVisible]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const copyToClipboard = async () => {
    await errorLogger.copyErrorsToClipboard();
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Botón flotante para mostrar/ocultar el panel
  const FloatingButton = () => {
    const hasErrors = Object.values(diagnostics).some(d => d.status === 'error');
    const hasWarnings = Object.values(diagnostics).some(d => d.status === 'warning');
    
    return (
      <button
        onClick={toggleVisibility}
        className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all duration-300 ${
          hasErrors 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : hasWarnings 
            ? 'bg-yellow-500 hover:bg-yellow-600' 
            : 'bg-green-500 hover:bg-green-600'
        } text-white`}
        title="Panel de Diagnóstico"
      >
        🔍
        {stats.total > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {stats.total > 99 ? '99+' : stats.total}
          </span>
        )}
      </button>
    );
  };

  // Panel de diagnóstico completo
  const DiagnosticModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">🔍 Panel de Diagnóstico MyWed360</h2>
          <button
            onClick={toggleVisibility}
            className="text-gray-300 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Resumen general */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">📊 Resumen General</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-100 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(diagnostics).filter(d => d.status === 'success').length}
                </div>
                <div className="text-sm text-green-700">Servicios OK</div>
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.values(diagnostics).filter(d => d.status === 'warning').length}
                </div>
                <div className="text-sm text-yellow-700">Advertencias</div>
              </div>
              <div className="bg-red-100 p-3 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(diagnostics).filter(d => d.status === 'error').length}
                </div>
                <div className="text-sm text-red-700">Errores</div>
              </div>
            </div>
          </div>

          {/* Estado de servicios */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">🔧 Estado de Servicios</h3>
            <div className="space-y-3">
              {Object.entries(diagnostics).map(([service, data]) => (
                <div key={service} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">
                      {getStatusIcon(data.status)} {service}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(data.status)}`}>
                      {data.status.toUpperCase()}
                    </span>
                  </div>
                  {data.details && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <pre className="whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(data.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Errores recientes */}
          {errors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">🚨 Errores Recientes</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {errors.slice(-10).reverse().map((error) => (
                  <div key={error.id} className="border-l-4 border-red-500 bg-red-50 p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-red-800">{error.type}</span>
                      <span className="text-xs text-red-600">
                        {new Date(error.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-red-700">
                      <pre className="whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(error.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estadísticas */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">📈 Estadísticas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-lg font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-700">Total de errores</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-lg font-bold text-orange-600">{stats.recent}</div>
                <div className="text-sm text-orange-700">Errores recientes (5min)</div>
              </div>
            </div>
            
            {stats.byType && Object.keys(stats.byType).length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Por tipo:</h4>
                <div className="space-y-1">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span>{type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <button
              onClick={copyToClipboard}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              📋 Copiar Reporte
            </button>
            <button
              onClick={() => {
                errorLogger.printDiagnosticsReport();
                console.log('📊 Reporte actualizado en consola');
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
            >
              🔄 Actualizar Consola
            </button>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              🔄 Recargar Página
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <FloatingButton />
      {isVisible && <DiagnosticModal />}
    </>
  );
};

export default DiagnosticPanel;
