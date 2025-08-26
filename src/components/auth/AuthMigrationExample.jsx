/**
 * Ejemplo de migración del sistema de autenticación legacy al nuevo sistema unificado
 * Este componente muestra cómo migrar de useUserContext a useAuthUnified
 */

import React from 'react';
import { useUserContext } from '../../context/UserContext'; // Sistema legacy
import { useAuth } from '../../hooks/useAuthUnified'; // Nuevo sistema

/**
 * Componente que demuestra la migración gradual
 * Usa ambos sistemas durante la transición
 */
const AuthMigrationExample = () => {
  // Sistema legacy (mantener durante la migración)
  const legacyAuth = useUserContext();
  
  // Nuevo sistema unificado
  const unifiedAuth = useAuth();

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Comparación de Sistemas de Autenticación</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sistema Legacy */}
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-red-600 mb-3">Sistema Legacy (useUserContext)</h4>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Usuario:</strong> {legacyAuth.user?.email || 'No autenticado'}
            </div>
            <div>
              <strong>Autenticado:</strong> {legacyAuth.isAuthenticated ? 'Sí' : 'No'}
            </div>
            <div>
              <strong>Rol:</strong> {legacyAuth.role || 'N/A'}
            </div>
            <div>
              <strong>Cargando:</strong> {legacyAuth.loading ? 'Sí' : 'No'}
            </div>
          </div>
        </div>

        {/* Sistema Nuevo */}
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-green-600 mb-3">Sistema Nuevo (useAuthUnified)</h4>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Usuario:</strong> {unifiedAuth.currentUser?.email || 'No autenticado'}
            </div>
            <div>
              <strong>Autenticado:</strong> {unifiedAuth.isAuthenticated ? 'Sí' : 'No'}
            </div>
            <div>
              <strong>Rol:</strong> {unifiedAuth.userProfile?.role || 'N/A'}
            </div>
            <div>
              <strong>Cargando:</strong> {unifiedAuth.isLoading ? 'Sí' : 'No'}
            </div>
            <div>
              <strong>Sesión activa:</strong> {unifiedAuth.sessionInfo?.isActive ? 'Sí' : 'No'}
            </div>
            <div>
              <strong>Última actividad:</strong> {
                unifiedAuth.sessionInfo?.lastActivity 
                  ? new Date(unifiedAuth.sessionInfo.lastActivity).toLocaleTimeString()
                  : 'N/A'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Acciones de ejemplo */}
      <div className="mt-6 space-y-4">
        <h4 className="font-medium">Acciones Disponibles:</h4>
        
        <div className="flex flex-wrap gap-2">
          {unifiedAuth.isAuthenticated && (
            <>
              <button
                onClick={() => unifiedAuth.refreshToken()}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Refrescar Token
              </button>
              
              <button
                onClick={() => unifiedAuth.updateProfile({ lastActivity: Date.now() })}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Actualizar Actividad
              </button>
              
              {unifiedAuth.hasRole('admin') && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                  Acceso de Administrador
                </span>
              )}
              
              {unifiedAuth.hasPermission('access_mail_api') && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  Acceso a Email API
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Guía de migración */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-medium text-yellow-800 mb-2">Guía de Migración:</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <div>1. Importar: <code>import {`{useAuth}`} from '../hooks/useAuthUnified';</code></div>
          <div>2. Cambiar: <code>useUserContext()</code> → <code>useAuth()</code></div>
          <div>3. Actualizar propiedades: <code>user</code> → <code>currentUser</code></div>
          <div>4. Usar nuevas funcionalidades: <code>hasRole(), hasPermission(), refreshToken()</code></div>
        </div>
      </div>
    </div>
  );
};

export default AuthMigrationExample;
