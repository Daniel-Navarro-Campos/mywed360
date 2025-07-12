import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { subscribeSyncState, getSyncState } from '../services/SyncService';

/**
 * Componente que muestra el estado de sincronización actual
 * @param {Object} props - Propiedades del componente
 * @param {string} props.position - Posición del indicador ('bottom-right', 'top-right', 'bottom-left', 'top-left')
 * @param {boolean} props.showText - Si se debe mostrar el texto descriptivo junto al icono
 * @returns {JSX.Element} Indicador visual de sincronización
 */
export default function SyncIndicator({ position = 'bottom-right', showText = true }) {
  // Estado de sincronización
  const [syncStatus, setSyncStatus] = useState(getSyncState());

  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);

  // Determinar la posición CSS según la prop
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 flex items-center space-x-2 bg-white px-3 py-2 rounded-full shadow-md`}>
      {syncStatus === 'online' ? (
        <>
          <Cloud size={18} className="text-green-500" />
          {showText && <span className="text-sm">Sincronizado</span>}
        </>
      ) : syncStatus === 'offline' ? (
        <>
          <CloudOff size={18} className="text-yellow-500" />
          {showText && <span className="text-sm">Guardado localmente</span>}
        </>
      ) : (
        <>
          <RefreshCw size={18} className="text-blue-500 animate-spin" />
          {showText && <span className="text-sm">Sincronizando...</span>}
        </>
      )}
    </div>
  );
}
