import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuthUnified';

/**
 * InboxContainer de debug para aislar el error
 * Versión ultra simplificada sin dependencias complejas
 */
const InboxContainerDebug = () => {
  const [debugInfo, setDebugInfo] = useState('Iniciando...');
  
  // Intentar obtener usuario paso a paso
  let user = null;
  let authError = null;
  
  try {
    const authResult = useAuth();
    user = authResult?.user || authResult?.currentUser;
    setDebugInfo(`Usuario obtenido: ${user?.email || 'Sin email'}`);
  } catch (err) {
    authError = err;
    setDebugInfo(`Error en useAuth: ${err.message}`);
  }

  return (
    <div className="p-8 bg-white">
      <h1 className="text-2xl font-bold mb-4">Debug InboxContainer</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Estado de autenticación:</h3>
          <p>Debug Info: {debugInfo}</p>
          <p>Usuario: {user ? JSON.stringify(user, null, 2) : 'null'}</p>
          {authError && (
            <p className="text-red-600">Error: {authError.message}</p>
          )}
        </div>
        
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Componente cargado correctamente</h3>
          <p>Si ves este mensaje, el componente básico funciona.</p>
        </div>
      </div>
    </div>
  );
};

export default InboxContainerDebug;
