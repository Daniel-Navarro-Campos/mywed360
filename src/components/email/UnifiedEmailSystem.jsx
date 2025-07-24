import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import EmailInbox from './EmailInbox';
import EmailViewer from './EmailViewer';
import EmailComposer from './EmailComposer';
import * as EmailService from '../../services/EmailService';
import * as NotificationService from '../../services/NotificationService';

/**
 * Componente principal que integra todos los elementos del sistema de emails personalizado de Lovenda
 * y gestiona el estado global del sistema de correo.
 * 
 * @returns {React.ReactElement} Sistema de email unificado
 */
const UnifiedEmailSystem = () => {
  // Estado para el email seleccionado para visualización
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  // Estado para controlar la visibilidad del compositor de emails
  const [showComposer, setShowComposer] = useState(false);
  
  // Valores iniciales para el compositor (para respuestas/reenvíos)
  const [composerInitialValues, setComposerInitialValues] = useState({});
  
  // Estado para controlar notificaciones de nuevos emails
  const [hasNewEmails, setHasNewEmails] = useState(false);
  
  // Función para verificar nuevos emails periódicamente
  useEffect(() => {
    const checkForNewEmails = async () => {
      try {
        const result = await EmailService.checkNewEmails();
        if (result && result.hasNew) {
          setHasNewEmails(true);
          
          // Mostrar notificación
          NotificationService.showNotification({
            title: 'Nuevos emails',
            message: `Tienes ${result.count} ${result.count === 1 ? 'nuevo email' : 'nuevos emails'}`,
            type: 'info',
            duration: 5000
          });
        }
      } catch (err) {
        console.error('Error al verificar nuevos emails:', err);
      }
    };
    
    // Verificar al cargar el componente
    checkForNewEmails();
    
    // Configurar verificación periódica cada 5 minutos
    const intervalId = setInterval(checkForNewEmails, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Manejar selección de un email para visualización
  const handleSelectEmail = async (emailId) => {
    try {
      const emailDetails = await EmailService.getMailDetails(emailId);
      setSelectedEmail(emailDetails);
    } catch (err) {
      console.error('Error al obtener detalles del email:', err);
      NotificationService.showNotification({
        title: 'Error',
        message: 'No se pudo cargar el email seleccionado',
        type: 'error'
      });
    }
  };
  
  // Volver a la lista de emails
  const handleBackToList = () => {
    setSelectedEmail(null);
  };
  
  // Eliminar un email
  const handleDeleteEmail = async (emailId) => {
    try {
      await EmailService.deleteMail(emailId);
      
      // Si el email eliminado es el que se está visualizando, volver a la lista
      if (selectedEmail && selectedEmail.id === emailId) {
        setSelectedEmail(null);
      }
      
      // Actualizar la lista de emails
      // Esto se maneja a través del componente EmailInbox con su propio loadEmails
      
      NotificationService.showNotification({
        title: 'Email eliminado',
        message: 'El email se ha eliminado correctamente',
        type: 'success'
      });
    } catch (err) {
      console.error('Error al eliminar email:', err);
      NotificationService.showNotification({
        title: 'Error',
        message: 'No se pudo eliminar el email',
        type: 'error'
      });
    }
  };
  
  // Marcar o desmarcar un email como importante
  const handleToggleImportant = async (emailId, isImportant) => {
    try {
      await EmailService.markAsImportant(emailId, isImportant);
      
      // Si el email modificado es el que se está visualizando, actualizar su estado
      if (selectedEmail && selectedEmail.id === emailId) {
        setSelectedEmail(prev => ({
          ...prev,
          folder: isImportant ? 'important' : 'inbox'
        }));
      }
      
      NotificationService.showNotification({
        title: isImportant ? 'Email destacado' : 'Email desmarcado',
        message: isImportant 
          ? 'El email se ha marcado como importante' 
          : 'El email ya no está marcado como importante',
        type: 'success'
      });
    } catch (err) {
      console.error('Error al cambiar estado de importancia:', err);
      NotificationService.showNotification({
        title: 'Error',
        message: 'No se pudo actualizar el estado del email',
        type: 'error'
      });
    }
  };
  
  // Abrir compositor para responder a un email
  const handleReply = (email) => {
    setComposerInitialValues({
      to: email.from,
      subject: `Re: ${email.subject}`,
      body: `\n\n\n-------- Mensaje original --------\nDe: ${email.from}\nFecha: ${new Date(email.date).toLocaleString()}\nAsunto: ${email.subject}\n\n${email.body}`
    });
    setShowComposer(true);
  };
  
  // Abrir compositor para reenviar un email
  const handleForward = (email) => {
    setComposerInitialValues({
      to: '',
      subject: `Fwd: ${email.subject}`,
      body: `\n\n\n-------- Mensaje reenviado --------\nDe: ${email.from}\nFecha: ${new Date(email.date).toLocaleString()}\nAsunto: ${email.subject}\n\n${email.body}`
    });
    setShowComposer(true);
  };
  
  // Manejar envío exitoso de un email
  const handleEmailSent = () => {
    NotificationService.showNotification({
      title: 'Email enviado',
      message: 'Tu email se ha enviado correctamente',
      type: 'success'
    });
  };
  
  // Abrir compositor para un nuevo email (sin valores iniciales)
  const handleNewEmail = () => {
    setComposerInitialValues({});
    setShowComposer(true);
  };
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center">
          <Mail size={28} className="mr-2 text-blue-500" />
          Sistema de Email Lovenda
          {hasNewEmails && (
            <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              NUEVO
            </span>
          )}
        </h1>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {selectedEmail ? (
          <EmailViewer
            email={selectedEmail}
            onBack={handleBackToList}
            onDelete={handleDeleteEmail}
            onReply={handleReply}
            onForward={handleForward}
            onToggleImportant={handleToggleImportant}
          />
        ) : (
          <EmailInbox
            onSelectEmail={handleSelectEmail}
            onCreateEmail={handleNewEmail}
            onEmailsLoaded={() => setHasNewEmails(false)}
          />
        )}
      </div>
      
      <EmailComposer
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        initialValues={composerInitialValues}
        onSend={handleEmailSent}
      />
    </div>
  );
};

export default UnifiedEmailSystem;
