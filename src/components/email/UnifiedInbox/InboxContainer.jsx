import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../hooks/useAuth';
import * as EmailService from '../../../services/emailService';
import { useEmailMonitoring } from '../../../hooks/useEmailMonitoring';
import { useUnifiedInboxMetrics } from '../../../hooks/useUnifiedInboxMetrics';
import { emailCache } from '../../../utils/EmailCache';
import SafeRenderer, { safeExecute } from '../../SafeRenderer';
import InboxNavigation from './InboxNavigation';
import EmailList from './EmailList';

import EmailDetail from './EmailDetail';
import EmailComposer from '../EmailComposer';

/**
 * Componente contenedor principal para la bandeja de entrada unificada
 * Gestiona el estado global de la bandeja y coordina los componentes hijo
 *
 * @returns {JSX.Element} Componente contenedor de la bandeja unificada
 */
const InboxContainer = () => {
  // Mensaje de diagnóstico para verificar si el componente se renderiza
  console.log('InboxContainer component rendering...');
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { trackOperation } = useEmailMonitoring();
  const { logInitialLoad, logSearch, logEmailRender, logUserInteraction } = useUnifiedInboxMetrics();
  
  // Estado principal para la bandeja de entrada
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [isComposingEmail, setIsComposingEmail] = useState(false);
  const [replyingToEmail, setReplyingToEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Estadísticas de bandeja
  const [folderStats, setFolderStats] = useState({
    inbox: { total: 0, unread: 0 },
    sent: { total: 0 },
    important: { total: 0, unread: 0 },
    trash: { total: 0 }
  });
  
  // Inicializar el servicio de email
  useEffect(() => {
    if (profile) {
      const email = EmailService.initEmailService(profile);
      setUserEmail(email);
    }
  }, [profile]);
  
  // Cargar emails al montar el componente o cambiar de carpeta
  useEffect(() => {
    loadEmails();
    
    // Registrar cambio de carpeta como interacción
    if (currentFolder) {
      logUserInteraction('folder_change', { folder: currentFolder });
    }
  }, [currentFolder, refreshTrigger]);
  
  // Cargar estadísticas de carpetas
  useEffect(() => {
    loadFolderStats();
    
    // Programar refresco periódico de estadísticas
    const intervalId = setInterval(() => {
      loadFolderStats();
    }, 60000); // Cada minuto
    
    return () => clearInterval(intervalId);
  }, [refreshTrigger]);
  
  // Función para cargar emails con soporte de caché
  const loadEmails = useCallback(async () => {
    if (!profile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const startTime = performance.now();
      
      // Intentar obtener desde la caché primero
      const cachedEmails = emailCache.getEmails(currentFolder);
      let data;
      
      if (cachedEmails) {
        // Usar datos de caché
        data = cachedEmails;
        setEmails(data);
        setLoading(false);
        
        // Cargar datos frescos en segundo plano si han pasado más de 2 minutos
        const lastLoad = emailCache.getMetrics().lastUpdated;
        const needsRefresh = !lastLoad || (Date.now() - lastLoad) > 2 * 60 * 1000;
        
        if (needsRefresh) {
          // Carga silenciosa en segundo plano
          EmailService.getMails(currentFolder)
            .then(freshData => {
              if (freshData && freshData.length > 0) {
                setEmails(freshData);
                emailCache.setEmails(currentFolder, freshData);
              }
            })
            .catch(err => console.error('Error en carga en segundo plano:', err));
        }
      } else {
        // Sin caché válida, cargar desde el servicio
        data = await EmailService.getMails(currentFolder);
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        // Guardar en caché
        emailCache.setEmails(currentFolder, data);
        
        // Registrar métricas de rendimiento
        trackOperation('load_emails', {
          folder: currentFolder,
          count: data?.length || 0,
          duration: loadTime,
          fromCache: false
        });
        
        // Registrar métricas específicas de la bandeja
        logInitialLoad(currentFolder, data?.length || 0, loadTime);
        
        setEmails(data || []);
      }
    } catch (err) {
      console.error('Error al cargar emails:', err);
      setError('No se pudieron cargar los emails. Por favor, inténtalo de nuevo.');
      toast.error('Error al cargar los emails');
    } finally {
      setLoading(false);
    }
  }, [currentFolder, profile, trackOperation, logInitialLoad]);
  
  // Función para cargar estadísticas de carpetas
  const loadFolderStats = useCallback(async () => {
    if (!profile) return;
    
    try {
      // Para cada carpeta, obtener conteo
      const inboxData = await EmailService.getMails('inbox');
      const sentData = await EmailService.getMails('sent');
      const importantData = await EmailService.getMails('important');
      const trashData = await EmailService.getMails('trash');
      
      setFolderStats({
        inbox: {
          total: inboxData.length,
          unread: inboxData.filter(e => !e.read).length
        },
        sent: { total: sentData.length },
        important: {
          total: importantData.length,
          unread: importantData.filter(e => !e.read).length
        },
        trash: { total: trashData.length }
      });
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  }, [profile]);
  
  // Manejador para marcar un email como leído
  const handleMarkAsRead = useCallback(async (emailId) => {
    try {
      // Primero actualizamos la interfaz inmediatamente para evitar retardo visual
      setEmails(prev => 
        prev.map(e => e.id === emailId ? { ...e, read: true } : e)
      );
      
      // También actualizamos el email seleccionado si corresponde
      if (selectedEmailId === emailId && selectedEmail) {
        setSelectedEmail({ ...selectedEmail, read: true });
      }
      
      // Actualizar caché inmediatamente
      const cachedEmails = emailCache.getEmails(currentFolder);
      if (cachedEmails) {
        const updatedCache = cachedEmails.map(e => 
          e.id === emailId ? { ...e, read: true } : e
        );
        emailCache.setEmails(currentFolder, updatedCache);
      }
      
      // Registrar interacción
      logUserInteraction('mark_read', { emailId });
      
      // Luego realizamos la actualización en el servidor (en segundo plano)
      await EmailService.markAsRead(emailId);
    } catch (err) {
      console.error('Error al marcar email como leído:', err);
      toast.error('Error al actualizar estado de lectura');
    }
  }, [selectedEmailId, selectedEmail, emails, currentFolder, logUserInteraction]);
  
  // Manejador para seleccionar un email
  const handleSelectEmail = useCallback(async (emailId) => {
    const startTime = performance.now();
    const email = emails.find(e => e.id === emailId);
    if (!email) return;
    
    setSelectedEmailId(emailId);
    setSelectedEmail(email);
    
    // Registrar interacción del usuario
    logUserInteraction('email_select', { 
      emailId, 
      hasAttachments: !!email.attachments?.length,
      isRead: !!email.read
    });
    
    // Marcar como leído automáticamente si es necesario
    if (!email.read) {
      handleMarkAsRead(emailId);
    }
    
    // Registrar tiempo de renderizado
    const renderTime = performance.now() - startTime;
    logEmailRender(
      emailId, 
      !!email.attachments?.length, 
      email.body?.length || 0,
      renderTime
    );
  }, [emails, handleMarkAsRead, logUserInteraction, logEmailRender]);
  
  // Manejador para cambiar de carpeta
  const handleFolderChange = useCallback((folder) => {
    setCurrentFolder(folder);
    setSelectedEmail(null);
    setSelectedEmailId(null);
  }, []);
  
  // Memoizar emails filtrados y ordenados (MOVIDO AQUÍ para evitar error de inicialización)
  const filteredEmails = useMemo(() => {
    if (!emails.length) return [];
    
    let filtered = [...emails];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(email => 
        email.subject?.toLowerCase().includes(term) || 
        email.from?.toLowerCase().includes(term) ||
        email.to?.toLowerCase().includes(term) ||
        email.body?.toLowerCase().includes(term)
      );
    }
    
    // Ordenar emails
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'from':
          comparison = (a.from || '').localeCompare(b.from || '');
          break;
        case 'subject':
          comparison = (a.subject || '').localeCompare(b.subject || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [emails, searchTerm, sortField, sortDirection]);
  
  // Manejador para buscar
  const handleSearch = useCallback((term) => {
    const startTime = performance.now();
    setSearchTerm(term);
    
    // Solo registrar búsquedas reales (más de 2 caracteres)
    if (term.length > 2) {
      setTimeout(() => {
        // Dar tiempo para que se actualice filteredEmails
        const endTime = performance.now();
        const searchTime = endTime - startTime;
        const resultCount = filteredEmails.length;
        
        logSearch(term, resultCount, searchTime);
        logUserInteraction('search', { term, resultCount });
      }, 100);
    }
  }, [filteredEmails, logSearch, logUserInteraction]);
  
  // Manejador para cambiar ordenación
  const handleSortChange = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);
  
  // Manejador para componer un nuevo email
  const handleComposeNew = useCallback(() => {
    setIsComposingEmail(true);
    setReplyingToEmail(null);
  }, []);
  
  // Manejador para responder a un email
  const handleReply = useCallback((email) => {
    setIsComposingEmail(true);
    setReplyingToEmail(email);
  }, []);
  
  // Manejador para enviar email
  const handleSendEmail = useCallback(async (emailData) => {
    try {
      await EmailService.sendMail(emailData);
      toast.success('Email enviado correctamente');
      setIsComposingEmail(false);
      setReplyingToEmail(null);
      
      // Registrar la acción
      logUserInteraction('send_email', { 
        recipientCount: emailData.to.split(',').length,
        hasAttachments: !!emailData.attachments?.length,
        subjectLength: emailData.subject?.length || 0
      });
      
      // Invalidar la caché de enviados
      emailCache.invalidateFolder('sent');
      
      // Refrescar lista de emails
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error al enviar email:', err);
      toast.error('Error al enviar el email');
    }
  }, [logUserInteraction]);
  
  // Manejador para eliminar un email
  const handleDeleteEmail = useCallback(async (emailId) => {
    try {
      await EmailService.deleteMail(emailId);
      toast.success('Email eliminado correctamente');
      
      // Si el email eliminado es el seleccionado, resetear la selección
      if (selectedEmailId === emailId) {
        setSelectedEmail(null);
        setSelectedEmailId(null);
      }
      
      // Registrar la acción
      logUserInteraction('delete_email', { emailId });
      
      // Invalidar la caché de la carpeta actual
      emailCache.invalidateFolder(currentFolder);
      
      // Refrescar lista
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error al eliminar email:', err);
      toast.error('Error al eliminar el email');
    }
  }, [selectedEmailId, currentFolder, logUserInteraction]);
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Cabecera con información del usuario */}
      <div className="bg-white p-4 border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800" data-testid="email-title">Bandeja de entrada</h1>
          {userEmail && (
            <div className="text-sm text-gray-600">
              Tu dirección: <span className="font-semibold">{userEmail}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-grow flex overflow-hidden">
        {/* Panel de navegación */}
        <InboxNavigation 
          currentFolder={currentFolder}
          onFolderChange={handleFolderChange}
          folderStats={folderStats}
          onComposeNew={handleComposeNew}
        />
        
        {/* Área de contenido principal */}
        <div className="flex-grow flex overflow-hidden">
          {/* Lista de emails */}
          <div className={`${selectedEmail ? 'hidden md:block md:w-1/3 lg:w-2/5' : 'w-full'} border-r overflow-auto`}>
            <EmailList
              emails={filteredEmails}
              loading={loading}
              error={error}
              selectedEmailId={selectedEmailId}
              onSelectEmail={handleSelectEmail}
              onDeleteEmail={handleDeleteEmail}
              onSearch={handleSearch}
              searchTerm={searchTerm}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              currentFolder={currentFolder}
            />
          </div>
          
          {/* Detalle de email o composición */}
          {(selectedEmail || isComposingEmail) && (
            <div className="w-full md:w-2/3 lg:w-3/5 overflow-auto">
              {isComposingEmail ? (
                <EmailComposer
                  replyTo={replyingToEmail}
                  onSend={handleSendEmail}
                  onCancel={() => {
                    setIsComposingEmail(false);
                    setReplyingToEmail(null);
                  }}
                  userEmail={userEmail}
                />
              ) : (
                <EmailDetail
                  email={selectedEmail}
                  onReply={() => handleReply(selectedEmail)}
                  onDelete={() => handleDeleteEmail(selectedEmail.id)}
                  onMarkRead={handleMarkAsRead}
                  onBack={() => {
                    setSelectedEmail(null);
                    setSelectedEmailId(null);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxContainer;
