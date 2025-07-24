import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Mail, Calendar, User, Trash, Check, AlertTriangle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui';
import * as NotificationService from '../services/NotificationService';

/**
 * Centro de notificaciones unificado para toda la aplicación
 * Muestra notificaciones de emails, eventos, proveedores y sistema
 * Permite marcar como leído, eliminar y navegar directamente a la fuente de la notificación
 * 
 * @returns {React.ReactElement} Componente del centro de notificaciones
 */
const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  
  // Cargar notificaciones al abrir el centro
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, activeTab]);
  
  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Escuchar eventos de notificación toast
  useEffect(() => {
    const handleToastEvent = (event) => {
      if (event.detail) {
        showToast(event.detail);
      }
    };
    
    window.addEventListener('lovenda-toast', handleToastEvent);
    
    return () => {
      window.removeEventListener('lovenda-toast', handleToastEvent);
    };
  }, []);
  
  // Cargar notificaciones
  const loadNotifications = async () => {
    setIsLoading(true);
    
    try {
      const filter = activeTab !== 'all' ? activeTab : undefined;
      const notificationData = await NotificationService.getNotifications(filter);
      
      setNotifications(notificationData.notifications || []);
      setUnreadCount(notificationData.unreadCount || 0);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mostrar toast de notificación
  const showToast = ({ title, message, type = 'info', duration = 3000 }) => {
    // Crear elemento toast
    const toastElement = document.createElement('div');
    toastElement.className = `fixed bottom-4 right-4 bg-white rounded-md shadow-lg p-4 flex items-start max-w-sm transform transition-all duration-300 z-50 border-l-4 ${getToastBorderColor(type)}`;
    
    // Contenido del toast
    toastElement.innerHTML = `
      <div class="flex-shrink-0 mr-3 mt-0.5">
        ${getToastIcon(type)}
      </div>
      <div class="flex-grow">
        <h3 class="font-medium text-gray-900">${title}</h3>
        <p class="text-sm text-gray-600">${message}</p>
      </div>
      <button class="ml-4 text-gray-400 hover:text-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    // Añadir al DOM
    document.body.appendChild(toastElement);
    
    // Animación de entrada
    setTimeout(() => {
      toastElement.classList.add('translate-y-0', 'opacity-100');
    }, 10);
    
    // Manejar cierre
    const closeButton = toastElement.querySelector('button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        removeToast(toastElement);
      });
    }
    
    // Auto-cierre después de duration
    setTimeout(() => {
      removeToast(toastElement);
    }, duration);
  };
  
  // Eliminar toast del DOM
  const removeToast = (element) => {
    element.classList.add('opacity-0', '-translate-y-2');
    
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 300);
  };
  
  // Obtener color de borde para el toast
  const getToastBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      case 'warning':
        return 'border-yellow-500';
      default:
        return 'border-blue-500';
    }
  };
  
  // Obtener icono para el toast
  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`;
      case 'error':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>`;
      case 'warning':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>`;
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`;
    }
  };
  
  // Manejar clic en notificación
  const handleNotificationClick = async (notification) => {
    // Marcar como leída
    if (!notification.read) {
      await NotificationService.markAsRead(notification.id);
      
      // Actualizar estado local
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      
      // Actualizar contador
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // Navegar según el tipo de acción
    if (notification.action) {
      setIsOpen(false);
      
      switch (notification.action) {
        case 'viewEmail':
          navigate(`/buzon/${notification.emailId}`);
          break;
        case 'viewEvent':
          navigate(`/calendario/evento/${notification.eventId}`);
          break;
        case 'viewProvider':
          navigate(`/proveedores/${notification.providerId}`);
          break;
        default:
          // Acción personalizada o ninguna
          break;
      }
    }
  };
  
  // Eliminar notificación
  const handleDeleteNotification = async (event, notificationId) => {
    event.stopPropagation(); // Evitar que se active el clic en la notificación
    
    try {
      await NotificationService.deleteNotification(notificationId);
      
      // Actualizar estado local
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Actualizar contador si era no leída
      if (notificationToDelete && !notificationToDelete.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };
  
  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };
  
  // Renderizar icono según el tipo de notificación
  const renderNotificationIcon = (notification) => {
    switch (notification.type) {
      case 'email':
        return <Mail size={18} className="text-blue-500" />;
      case 'event':
        return <Calendar size={18} className="text-purple-500" />;
      case 'provider':
        return <User size={18} className="text-green-500" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-yellow-500" />;
      case 'error':
        return <AlertTriangle size={18} className="text-red-500" />;
      default:
        return <Info size={18} className="text-gray-500" />;
    }
  };
  
  // Filtrar notificaciones según la pestaña activa
  const filteredNotifications = notifications;
  
  return (
    <div className="relative" ref={notificationRef}>
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Panel de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="border-b border-gray-200 p-3 flex justify-between items-center">
            <h3 className="font-medium">Notificaciones</h3>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Check size={14} className="mr-1" />
                  Marcar todas como leídas
                </button>
              )}
            </div>
          </div>
          
          {/* Pestañas de filtro */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-grow py-2 text-sm font-medium ${
                activeTab === 'all' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-grow py-2 text-sm font-medium ${
                activeTab === 'email' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Emails
            </button>
            <button
              onClick={() => setActiveTab('event')}
              className={`flex-grow py-2 text-sm font-medium ${
                activeTab === 'event' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Eventos
            </button>
          </div>
          
          {/* Lista de notificaciones */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay notificaciones
              </div>
            ) : (
              <ul>
                {filteredNotifications.map(notification => (
                  <li 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 border-b border-gray-100 flex items-start hover:bg-gray-50 cursor-pointer transition ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5 mr-3">
                      {renderNotificationIcon(notification)}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <p className={`text-sm ${!notification.read ? 'font-medium' : 'text-gray-800'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.timestamp).toLocaleDateString('es-ES', { 
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteNotification(e, notification.id)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <Trash size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Pie del panel */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
            <Button 
              variant="link" 
              size="sm"
              onClick={() => {
                navigate('/notificaciones');
                setIsOpen(false);
              }}
            >
              Ver todas las notificaciones
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
