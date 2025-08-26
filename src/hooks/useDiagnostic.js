import { useState, useEffect, useCallback } from 'react';
import errorLogger from '../utils/errorLogger';
import diagnosticService from '../services/diagnosticService';

/**
 * Hook personalizado para el sistema de diagnóstico
 * Proporciona una interfaz fácil para acceder a diagnósticos y errores
 */
export const useDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState({});
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Actualizar datos del errorLogger
  const updateData = useCallback(() => {
    setDiagnostics({ ...errorLogger.diagnostics });
    setErrors([...errorLogger.errors]);
    setLastUpdate(new Date());
  }, []);

  // Inicialización
  useEffect(() => {
    const initDiagnostic = async () => {
      setIsLoading(true);
      
      // Esperar a que errorLogger esté inicializado
      const waitForInit = () => {
        if (errorLogger.isInitialized) {
          updateData();
          setIsLoading(false);
        } else {
          setTimeout(waitForInit, 100);
        }
      };
      
      waitForInit();
    };

    initDiagnostic();

    // Actualizar cada 10 segundos
    const interval = setInterval(updateData, 10000);
    
    return () => clearInterval(interval);
  }, [updateData]);

  // Funciones de utilidad
  const getErrorCount = useCallback(() => {
    return errors.length;
  }, [errors]);

  const getRecentErrors = useCallback((minutes = 5) => {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return errors.filter(error => new Date(error.timestamp) > cutoff);
  }, [errors]);

  const getServiceStatus = useCallback((service) => {
    return diagnostics[service]?.status || 'unknown';
  }, [diagnostics]);

  const hasErrors = useCallback(() => {
    return Object.values(diagnostics).some(d => d.status === 'error');
  }, [diagnostics]);

  const hasWarnings = useCallback(() => {
    return Object.values(diagnostics).some(d => d.status === 'warning');
  }, [diagnostics]);

  const getOverallStatus = useCallback(() => {
    if (hasErrors()) return 'error';
    if (hasWarnings()) return 'warning';
    return 'success';
  }, [hasErrors, hasWarnings]);

  // Ejecutar diagnóstico específico
  const runEmailDiagnostic = useCallback(async () => {
    try {
      const result = await diagnosticService.diagnoseEmailSystem();
      console.log('📧 Diagnóstico de emails completado:', result);
      return result;
    } catch (error) {
      console.error('Error en diagnóstico de emails:', error);
      return { status: 'error', error: error.message };
    }
  }, []);

  const runAIDiagnostic = useCallback(async () => {
    try {
      const result = await diagnosticService.diagnoseAIChat();
      console.log('🤖 Diagnóstico de IA completado:', result);
      return result;
    } catch (error) {
      console.error('Error en diagnóstico de IA:', error);
      return { status: 'error', error: error.message };
    }
  }, []);

  const runFirebaseDiagnostic = useCallback(async () => {
    try {
      const result = await diagnosticService.diagnoseFirebase();
      console.log('🔥 Diagnóstico de Firebase completado:', result);
      return result;
    } catch (error) {
      console.error('Error en diagnóstico de Firebase:', error);
      return { status: 'error', error: error.message };
    }
  }, []);

  const runFullDiagnostic = useCallback(async () => {
    try {
      const result = await diagnosticService.runFullDiagnostic();
      console.log('🔍 Diagnóstico completo finalizado:', result);
      updateData(); // Actualizar después del diagnóstico
      return result;
    } catch (error) {
      console.error('Error en diagnóstico completo:', error);
      return { status: 'error', error: error.message };
    }
  }, [updateData]);

  // Copiar reporte al portapapeles
  const copyReport = useCallback(async () => {
    try {
      await errorLogger.copyErrorsToClipboard();
      return true;
    } catch (error) {
      console.error('Error al copiar reporte:', error);
      return false;
    }
  }, []);

  // Limpiar errores
  const clearErrors = useCallback(() => {
    errorLogger.errors = [];
    updateData();
  }, [updateData]);

  // Log manual de error
  const logError = useCallback((type, details) => {
    errorLogger.logError(type, details);
    updateData();
  }, [updateData]);

  return {
    // Estado
    diagnostics,
    errors,
    isLoading,
    lastUpdate,
    
    // Funciones de consulta
    getErrorCount,
    getRecentErrors,
    getServiceStatus,
    hasErrors,
    hasWarnings,
    getOverallStatus,
    
    // Funciones de diagnóstico
    runEmailDiagnostic,
    runAIDiagnostic,
    runFirebaseDiagnostic,
    runFullDiagnostic,
    
    // Funciones de utilidad
    copyReport,
    clearErrors,
    logError,
    updateData
  };
};

export default useDiagnostic;
