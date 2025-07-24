import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMails, initEmailService } from '../../services/emailService';
import { useAuth } from '../../hooks/useAuth';

/**
 * Componente que muestra un badge con notificaciones de nuevos correos
 * y proporciona un acceso rápido a la bandeja de entrada
 */
const EmailNotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Comprobar correos no leídos periódicamente
  useEffect(() => {
    const checkUnreadEmails = async () => {
      if (!userProfile) return;
      
      try {
        setLoading(true);
        
        // Inicializar el servicio de email
        initEmailService(userProfile);
        
        // Obtener correos de la bandeja de entrada
        const emails = await getMails('inbox');
        
        // Contar los no leídos
        const unreadEmails = emails.filter(email => !email.read);
        setUnreadCount(unreadEmails.length);
      } catch (error) {
        console.error('Error al comprobar correos no leídos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Comprobar al cargar el componente
    checkUnreadEmails();
    
    // Comprobar cada 60 segundos
    const interval = setInterval(checkUnreadEmails, 60000);
    
    return () => clearInterval(interval);
  }, [userProfile]);
  
  // Ir a la bandeja de entrada
  const handleClick = () => {
    navigate('/user/email');
  };
  
  return (
    <button 
      onClick={handleClick}
      className="relative p-2 rounded-full hover:bg-gray-200 focus:outline-none transition-colors"
      aria-label={`${unreadCount} correos sin leer`}
      disabled={loading}
    >
      <Mail size={20} className="text-gray-700" />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default EmailNotificationBadge;
