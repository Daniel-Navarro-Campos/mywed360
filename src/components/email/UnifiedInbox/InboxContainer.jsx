import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuthUnified';
import { useEmailMonitoring } from '../../../hooks/useEmailMonitoring';
import { EmailService } from '../../../services/emailService';
import EmailList from './EmailList';
import EmailDetail from './EmailDetail';
import EmailComposer from '../EmailComposer';

/**
 * InboxContainer - Bandeja de entrada unificada restaurada
 * Versión completa con todas las correcciones aplicadas para evitar errores de Promise
 */
const InboxContainer = () => {
  const { user } = useAuth();
  const { 
    emails, 
    loading, 
    error, 
    refreshEmails, 
    markAsRead, 
    deleteEmail,
    trackOperation // ✅ Función añadida para evitar TypeError
  } = useEmailMonitoring();
  
  // Estados locales
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, read, unread
  const [viewMode, setViewMode] = useState('list'); // list, detail

  // Email seleccionado
  const selectedEmail = selectedEmailId ? emails.find(email => email.id === selectedEmailId) : null;

  // Filtrar emails según búsqueda y estado
  const filteredEmails = emails.filter(email => {
    const matchesSearch = !searchTerm || 
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'read' && email.read) ||
      (filterStatus === 'unread' && !email.read);
    
    return matchesSearch && matchesFilter;
  });

  // Handlers
  const handleEmailSelect = useCallback((emailId) => {
    setSelectedEmailId(emailId);
    setViewMode('detail');
    
    // Marcar como leído si no lo está
    const email = emails.find(e => e.id === emailId);
    if (email && !email.read) {
      markAsRead(emailId);
    }
  }, [emails, markAsRead]);

  const handleEmailDelete = useCallback(async (emailId) => {
    try {
      await deleteEmail(emailId);
      if (selectedEmailId === emailId) {
        setSelectedEmailId(null);
        setViewMode('list');
      }
    } catch (error) {
      console.error('Error al eliminar email:', error);
    }
  }, [deleteEmail, selectedEmailId]);

  const handleBackToList = useCallback(() => {
    setSelectedEmailId(null);
    setViewMode('list');
  }, []);

  const handleSendEmail = useCallback(async (emailData) => {
    try {
      // ✅ Usar EmailService directamente sin safeRender para evitar Promise rendering
      const result = await EmailService.sendEmail(emailData);
      
      if (result && result.success) {
        setShowComposer(false);
        await refreshEmails(); // Refrescar lista tras envío
        
        // Track operation si está disponible
        if (trackOperation) {
          trackOperation('email_sent', { success: true });
        }
      }
    } catch (error) {
      console.error('Error al enviar email:', error);
      if (trackOperation) {
        trackOperation('email_sent', { success: false, error: error.message });
      }
    }
  }, [refreshEmails, trackOperation]);

  // Estados de carga y error
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
          <button 
            onClick={refreshEmails}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header con controles */}
      <div className="bg-white p-4 border-b shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">Bandeja de entrada</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowComposer(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ✉️ Nuevo Email
              </button>
              <button
                onClick={refreshEmails}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Actualizar"
              >
                🔄
              </button>
            </div>
          </div>
          
          {/* Barra de búsqueda y filtros */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="unread">No leídos</option>
              <option value="read">Leídos</option>
            </select>
          </div>
          
          {user?.email && (
            <p className="text-sm text-gray-600 mt-2">
              Usuario: {user.email} | {filteredEmails.length} emails
            </p>
          )}
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'list' || !selectedEmail ? (
          <div className="flex-1">
            <EmailList
              emails={filteredEmails}
              onEmailSelect={handleEmailSelect}
              onEmailDelete={handleEmailDelete}
              selectedEmailId={selectedEmailId}
              loading={loading}
            />
          </div>
        ) : (
          <div className="flex-1">
            <EmailDetail
              email={selectedEmail}
              onBack={handleBackToList}
              onDelete={() => handleEmailDelete(selectedEmail.id)}
              onReply={() => {
                setShowComposer(true);
                // Pre-llenar datos de respuesta si es necesario
              }}
            />
          </div>
        )}
      </div>
      
      {/* Composer modal */}
      {showComposer && (
        <EmailComposer
          onSend={handleSendEmail}
          onClose={() => setShowComposer(false)}
          replyTo={selectedEmail}
        />
      )}
    </div>
  );
};

export default InboxContainer;
