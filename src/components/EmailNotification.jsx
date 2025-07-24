import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMails, initEmailService } from '../services/EmailService';
import { loadData } from '../services/SyncService';

/**
 * Componente que muestra una notificación de nuevos correos recibidos
 * y permite navegar directamente al buzón
 */
export default function EmailNotification() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [serviceInitialized, setServiceInitialized] = useState(false);
  const navigate = useNavigate();
  
  // Comprobar correos no leídos
  useEffect(() => {
    async function checkUnreadMails() {
      try {
        // Inicializar servicio de email una sola vez cuando tengamos perfil
        if (!serviceInitialized) {
          const profile = await loadData('lovendaProfile', {});
          if (profile && Object.keys(profile).length) {
            initEmailService(profile);
            setServiceInitialized(true);
          } else {
            // Si no hay perfil aún, salir y reintentar en el próximo ciclo
            return;
          }
        }

        // Una vez inicializado, obtener correos de la bandeja de entrada
        const inboxMails = await getMails('inbox');

        // Contar los no leídos
        const unread = inboxMails.filter(mail => !mail.read).length;

        // Actualizar estado
        setUnreadCount(unread);
        setShowNotification(unread > 0);
      } catch (error) {
        console.error('Error al comprobar correos nuevos:', error);
      }
    }

    // Comprobar al inicio
    checkUnreadMails();

    // Comprobar cada minuto
    const intervalId = setInterval(checkUnreadMails, 60000);

    return () => clearInterval(intervalId);
  }, [serviceInitialized]);
  
  // Ocultar la notificación después de un tiempo
  useEffect(() => {
    if (showNotification) {
      const timeoutId = setTimeout(() => {
        setShowNotification(false);
      }, 10000); // 10 segundos
      
      return () => clearTimeout(timeoutId);
    }
  }, [showNotification]);
  
  // Si no hay correos no leídos, no mostrar nada
  if (unreadCount === 0 || !showNotification) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-50 border-l-4 border-blue-500 animate-bounce-once">
      <div className="flex items-center">
        <div className="mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800">
            {unreadCount === 1 
              ? 'Tienes un nuevo mensaje' 
              : `Tienes ${unreadCount} mensajes nuevos`}
          </h4>
          <p className="text-sm text-gray-600">
            Pulsa aquí para ver tu bandeja de entrada
          </p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowNotification(false);
          }} 
          className="text-gray-400 hover:text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div 
        onClick={() => alert('Funcionalidad de buzón temporalmente no disponible')} 
        className="absolute inset-0 cursor-pointer"
        aria-hidden="true"
      />
      
      {/* Estilos para la animación de rebote */}
      <style jsx="true">{`
        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-once {
          animation: bounce-once 1s ease-in-out;
        }
      `}</style>
    </div>
  );
}
