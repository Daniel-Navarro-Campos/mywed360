import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../hooks/useAuthUnified';
import * as EmailService from '../../../services/emailService';
import { useEmailMonitoring } from '../../../hooks/useEmailMonitoring';
import { useUnifiedInboxMetrics } from '../../../hooks/useUnifiedInboxMetrics';
import { emailCache } from '../../../utils/EmailCache';
import { safeRender, ensureNotPromise, safeMap, safeExecute } from '../../../utils/promiseSafeRenderer';
import InboxNavigation from './InboxNavigation';
import EmailList from './EmailList';

import EmailDetail from './EmailDetail';
import EmailComposer from '../EmailComposer';
import EmailDebugger, { repairEmailAuthentication } from '../../../utils/emailDebugger';

/**
 * Componente contenedor principal para la bandeja de entrada unificada
 * Gestiona el estado global de la bandeja y coordina los componentes hijo
 *
 * @returns {JSX.Element} Componente contenedor de la bandeja unificada
 */
const InboxContainer = () => {
  // Componente contenedor principal para la bandeja de entrada unificada
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { trackEmailOperation } = useEmailMonitoring();
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
  
  // Estados para diagnóstico y reparación
  const [debugging, setDebugging] = useState(false);
  const [debugResults, setDebugResults] = useState(null);
  const [repairing, setRepairing] = useState(false);
  const [repairResults, setRepairResults] = useState(null);
  
  // Estadísticas de bandeja
  const [folderStats, setFolderStats] = useState({
    inbox: { total: 0, unread: 0 },
    sent: { total: 0 },
    important: { total: 0, unread: 0 },
    trash: { total: 0 }
  });
  
  // Inicializar el servicio de email
  useEffect(() => {
    const initializeEmailService = async () => {
      if (profile) {
        try {
          const email = await EmailService.initEmailService(profile);
          setUserEmail(email);
          console.log('✅ Email service inicializado correctamente:', email);
        } catch (error) {
          console.error('❌ Error inicializando email service:', error);
          setError('Error de autenticación. Por favor, recarga la página.');
        }
      }
    };
    
    initializeEmailService();
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
        await trackEmailOperation('load_emails', async () => {
          return data;
        }, {
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
  }, [currentFolder, profile, trackEmailOperation, logInitialLoad]);
  
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
  
  // Funciones de diagnóstico y reparación
  const runDiagnosis = useCallback(async () => {
    try {
      setDebugging(true);
      setDebugResults(null);
      
      console.log('=== INICIANDO DIAGNÓSTICO ===');
      const diagnosis = await EmailDebugger.runFullDiagnosis();
      
      setDebugResults({
        success: true,
        data: diagnosis,
        timestamp: new Date().toISOString()
      });
      
      console.log('=== DIAGNÓSTICO COMPLETADO ===');
      console.log('Resultados:', diagnosis.results);
      console.log('Reporte:', diagnosis.report);
      
      // Mostrar resumen en toast
      if (diagnosis.report.status === 'critical') {
        toast.error(`Diagnóstico: ${diagnosis.report.issues.length} problemas críticos detectados`);
      } else if (diagnosis.report.status === 'warning') {
        toast.warning(`Diagnóstico: ${diagnosis.report.warnings.length} advertencias detectadas`);
      } else {
        toast.success('Diagnóstico: Sistema funcionando correctamente');
      }
      
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      setDebugResults({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      toast.error('Error ejecutando diagnóstico');
    } finally {
      setDebugging(false);
    }
  }, []);
  
  const runRepair = useCallback(async () => {
    try {
      setRepairing(true);
      setRepairResults(null);
      
      console.log('=== INICIANDO REPARACIÓN ===');
      const repair = await repairEmailAuthentication();
      
      setRepairResults(repair);
      
      if (repair.success) {
        console.log('=== REPARACIÓN EXITOSA ===');
        toast.success(`Reparación exitosa: ${repair.userEmail}`);
        
        // Recargar emails después de la reparación
        await loadEmails();
      } else {
        console.log('=== REPARACIÓN FALLÓ ===');
        toast.error(`Reparación falló: ${repair.message}`);
      }
      
    } catch (error) {
      console.error('Error en reparación:', error);
      setRepairResults({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      toast.error('Error ejecutando reparación');
    } finally {
      setRepairing(false);
    }
  }, [loadEmails]);
  
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
  
  // Callback después de que EmailComposer haya enviado el email correctamente
  const handleEmailSent = useCallback((emailInfo) => {
    // emailInfo contiene los datos devueltos por EmailService.sendEmail en EmailComposer
    toast.success('Email enviado correctamente');
    setIsComposingEmail(false);
    setReplyingToEmail(null);

    // Registrar interacción
    logUserInteraction('send_email', {
      recipientCount: emailInfo?.to?.split(',').length || 0,
      hasAttachments: !!emailInfo?.attachments?.length,
      subjectLength: emailInfo?.subject?.length || 0
    });

    // 1) Actualización optimista de la UI para mostrar inmediatamente el correo enviado
    if (['sent', 'all'].includes(currentFolder)) {
      setEmails(prev => {
        if (!prev) return [emailInfo];
        const exists = prev.some(e => e.id === emailInfo.id);
        return exists ? prev : [emailInfo, ...prev];
      });
    }

    // 2) Actualizar caché global 'sent' para reflejar inmediatamente el nuevo correo
    const currentSentCache = emailCache.getEmails('sent') || [];
    if (!currentSentCache.some(e => e.id === emailInfo.id)) {
      emailCache.setEmails('sent', [emailInfo, ...currentSentCache]);
    }

    // 3) Actualizar contador de la carpeta 'sent' de forma optimista
    setFolderStats(prev => ({
      ...prev,
      sent: { ...prev.sent, total: (prev.sent?.total || 0) + 1 }
    }));

    // 4) Disparar recarga eventual para sincronizar con backend
    setRefreshTrigger(prev => prev + 1);
  }, [currentFolder, logUserInteraction]);
  
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
          <div className="flex items-center space-x-4">
            {userEmail && (
              <div className="text-sm text-gray-600">
                Tu dirección: <span className="font-semibold">{userEmail}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <button
                onClick={runDiagnosis}
                disabled={debugging}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                title="Diagnosticar problemas de email"
              >
                {debugging ? '🔄' : '🔍'} Debug
              </button>
              <button
                onClick={runRepair}
                disabled={repairing}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                title="Reparar autenticación de email"
              >
                {repairing ? '🔄' : '🔧'} Reparar
              </button>
            </div>
          </div>
        </div>
        
        {/* Panel de resultados de diagnóstico */}
        {debugResults && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Resultado del Diagnóstico:</h3>
            {debugResults.success ? (
              <div className="text-sm">
                <p className="mb-1">Estado: <span className={`font-semibold ${
                  debugResults.data.report.status === 'critical' ? 'text-red-600' :
                  debugResults.data.report.status === 'warning' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>{debugResults.data.report.status.toUpperCase()}</span></p>
                <p className="mb-1">Problemas: {debugResults.data.report.issues.length}</p>
                <p className="mb-1">Advertencias: {debugResults.data.report.warnings.length}</p>
                <p className="text-xs text-gray-600">Ver consola para detalles completos</p>
              </div>
            ) : (
              <p className="text-sm text-red-600">Error: {debugResults.error}</p>
            )}
          </div>
        )}
        
        {/* Panel de resultados de reparación */}
        {repairResults && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Resultado de la Reparación:</h3>
            {repairResults.success ? (
              <p className="text-sm text-green-600">✅ {repairResults.message} ({repairResults.userEmail})</p>
            ) : (
              <p className="text-sm text-red-600">❌ {repairResults.message}</p>
            )}
          </div>
        )}
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
              emails={safeRender(filteredEmails, [])}
              loading={safeRender(loading, false)}
              error={safeRender(error, null)}
              selectedEmailId={safeRender(selectedEmailId, null)}
              onSelectEmail={handleSelectEmail}
              onDeleteEmail={handleDeleteEmail}
              onSearch={handleSearch}
              searchTerm={safeRender(searchTerm, '')}
              sortField={safeRender(sortField, 'date')}
              sortDirection={safeRender(sortDirection, 'desc')}
              onSortChange={handleSortChange}
              currentFolder={safeRender(currentFolder, 'inbox')}
            />
          </div>
          
          {/* Detalle de email o composición */}
          {(selectedEmail || isComposingEmail) && (
            <div className="w-full md:w-2/3 lg:w-3/5 overflow-auto">
              {isComposingEmail ? (
                <EmailComposer
                  replyTo={replyingToEmail}
                  onSend={handleEmailSent}
                  onClose={() => {
                    setIsComposingEmail(false);
                    setReplyingToEmail(null);
                  }}
                  userEmail={userEmail}
                />
              ) : (
                <EmailDetail
                  email={safeRender(selectedEmail, null)}
                  onReply={() => handleReply(selectedEmail)}
                  onDelete={() => handleDeleteEmail(selectedEmail?.id)}
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
