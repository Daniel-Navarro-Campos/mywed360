/**
 * Componente para manejar sesiones expiradas y feedback de autenticación
 * Proporciona notificaciones, modales de reautenticación y gestión de errores
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, LogOut, Shield, Clock, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth, useAuthError } from '../../hooks/useAuthUnified';

/**
 * Modal de reautenticación
 */
const ReauthModal = ({ isOpen, onClose, onReauth, error }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    try {
      await onReauth(password);
      setPassword('');
      onClose();
      toast.success('Reautenticación exitosa');
    } catch (error) {
      toast.error('Error en reautenticación: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-yellow-500 mr-2" />
          <h2 className="text-lg font-semibold">Reautenticación Requerida</h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          Tu sesión ha expirado. Por favor, confirma tu contraseña para continuar.
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex">
              <AlertTriangle className="h-4 w-4 text-red-400 mr-2 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email: {currentUser?.email}
            </label>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={!password.trim() || isLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Verificando...' : 'Confirmar'}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Indicador de estado de conexión
 */
const ConnectionStatus = ({ isOnline, lastSync }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-40">
      <div
        className={`flex items-center px-3 py-2 rounded-full text-sm font-medium cursor-pointer transition-all ${
          isOnline
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-red-100 text-red-800 hover:bg-red-200'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {isOnline ? (
          <Wifi className="h-4 w-4 mr-2" />
        ) : (
          <WifiOff className="h-4 w-4 mr-2" />
        )}
        {isOnline ? 'Conectado' : 'Sin conexión'}
      </div>
      
      {showDetails && (
        <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48">
          <div className="text-xs text-gray-600">
            <div className="flex justify-between mb-1">
              <span>Estado:</span>
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'En línea' : 'Desconectado'}
              </span>
            </div>
            {lastSync && (
              <div className="flex justify-between">
                <span>Última sync:</span>
                <span>{new Date(lastSync).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Notificación de sesión próxima a expirar
 */
const SessionWarning = ({ timeLeft, onExtend, onLogout }) => {
  const minutes = Math.ceil(timeLeft / 60000);

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm z-40">
      <div className="flex items-start">
        <Clock className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Sesión próxima a expirar
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            Tu sesión expirará en {minutes} minuto{minutes !== 1 ? 's' : ''}
          </p>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={onExtend}
              className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
            >
              Extender sesión
            </button>
            <button
              onClick={onLogout}
              className="text-xs border border-yellow-600 text-yellow-600 px-3 py-1 rounded hover:bg-yellow-50"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente principal de gestión de sesiones
 */
const SessionManager = ({ children }) => {
  const { 
    isAuthenticated, 
    logout, 
    reauthenticate, 
    currentUser,
    isLoading 
  } = useAuth();
  
  const { error, clearError, getErrorMessage } = useAuthError();
  
  // Estados locales
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(Date.now());
  const [reauthError, setReauthError] = useState(null);

  /**
   * Maneja la reautenticación
   */
  const handleReauth = useCallback(async (password) => {
    try {
      setReauthError(null);
      const result = await reauthenticate(password);
      
      if (result.success) {
        setShowReauthModal(false);
        clearError();
      } else {
        setReauthError(getErrorMessage(result.error?.code));
      }
    } catch (error) {
      setReauthError(error.message);
      throw error;
    }
  }, [reauthenticate, clearError, getErrorMessage]);

  /**
   * Maneja el cierre de sesión
   */
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setShowReauthModal(false);
      clearError();
      toast.info('Sesión cerrada correctamente');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  }, [logout, clearError]);

  /**
   * Extiende la sesión actual
   */
  const extendSession = useCallback(async () => {
    try {
      // Refrescar token para extender sesión
      if (currentUser) {
        await currentUser.getIdToken(true);
        setSessionTimeLeft(null);
        setLastSync(Date.now());
        toast.success('Sesión extendida correctamente');
      }
    } catch (error) {
      toast.error('Error al extender la sesión');
    }
  }, [currentUser]);

  /**
   * Monitorea el estado de conexión
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSync(Date.now());
      toast.success('Conexión restaurada');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Sin conexión a internet');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Monitorea errores de autenticación
   */
  useEffect(() => {
    if (error) {
      switch (error.code) {
        case 'token-expired':
        case 'session-expired':
          setShowReauthModal(true);
          break;
        case 'token-refresh-failed':
          toast.error('Error al refrescar la sesión. Por favor, inicia sesión nuevamente.');
          break;
        case 'network-error':
          toast.error('Error de conexión. Verifica tu internet.');
          break;
        default:
          if (error.message) {
            toast.error(error.message);
          }
      }
    }
  }, [error]);

  /**
   * Simula monitoreo de tiempo de sesión
   * En una implementación real, esto vendría del token JWT
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSessionTime = () => {
      // Simular tiempo restante de sesión (en una app real vendría del token)
      const now = Date.now();
      const sessionStart = localStorage.getItem('lovenda_last_activity');
      
      if (sessionStart) {
        const elapsed = now - parseInt(sessionStart);
        const sessionDuration = 60 * 60 * 1000; // 1 hora
        const remaining = sessionDuration - elapsed;
        
        if (remaining <= 5 * 60 * 1000 && remaining > 0) { // 5 minutos
          setSessionTimeLeft(remaining);
        } else if (remaining <= 0) {
          handleLogout();
        } else {
          setSessionTimeLeft(null);
        }
      }
    };

    const interval = setInterval(checkSessionTime, 30000); // Cada 30 segundos
    checkSessionTime(); // Verificar inmediatamente

    return () => clearInterval(interval);
  }, [isAuthenticated, handleLogout]);

  return (
    <>
      {children}
      
      {/* Indicador de conexión */}
      <ConnectionStatus isOnline={isOnline} lastSync={lastSync} />
      
      {/* Advertencia de sesión próxima a expirar */}
      {sessionTimeLeft && (
        <SessionWarning
          timeLeft={sessionTimeLeft}
          onExtend={extendSession}
          onLogout={handleLogout}
        />
      )}
      
      {/* Modal de reautenticación */}
      <ReauthModal
        isOpen={showReauthModal}
        onClose={() => setShowReauthModal(false)}
        onReauth={handleReauth}
        error={reauthError}
      />
    </>
  );
};

export default SessionManager;
