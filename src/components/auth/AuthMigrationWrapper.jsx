/**
 * Wrapper de migración para el nuevo sistema de autenticación
 * Proporciona compatibilidad con el código existente mientras se migra
 */

import React from 'react';
import { AuthProvider as UnifiedAuthProvider } from '../../hooks/useAuthUnified';
import SessionManager from './SessionManager';
import { ToastContainer } from 'react-toastify';

/**
 * Componente de migración que envuelve la aplicación
 * con el nuevo sistema de autenticación unificado
 */
const AuthMigrationWrapper = ({ children }) => {
  return (
    <UnifiedAuthProvider>
      <SessionManager>
        {children}
        
        {/* Configuración de notificaciones */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastClassName="text-sm"
        />
      </SessionManager>
    </UnifiedAuthProvider>
  );
};

export default AuthMigrationWrapper;
