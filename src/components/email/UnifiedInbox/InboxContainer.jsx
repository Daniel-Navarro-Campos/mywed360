import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuthUnified';

/**
 * Versión mínima de InboxContainer para debugging
 * Elimina todas las dependencias complejas que pueden estar causando el error de Promise
 */
const InboxContainer = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulación simple de carga de emails
    const loadEmails = () => {
      try {
        setLoading(true);
        // Simular delay de carga
        setTimeout(() => {
          setEmails([]);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Error al cargar emails');
        setLoading(false);
      }
    };

    loadEmails();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando emails...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Cabecera simple */}
      <div className="bg-white p-4 border-b shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-800">Bandeja de entrada (Modo Debug)</h1>
          {user?.email && (
            <p className="text-sm text-gray-600 mt-1">
              Usuario: {user.email}
            </p>
          )}
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-xl font-medium text-gray-700 mb-2">
            Bandeja de entrada vacía
          </h2>
          <p className="text-gray-500">
            No hay emails para mostrar en este momento.
          </p>
          <p className="text-sm text-blue-600 mt-4">
            ✅ Componente cargado correctamente sin errores de Promise
          </p>
        </div>
      </div>
    </div>
  );
};

export default InboxContainer;
