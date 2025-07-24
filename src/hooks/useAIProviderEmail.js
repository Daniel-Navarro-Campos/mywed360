import { useState, useCallback } from 'react';
import { useProviderEmail } from './useProviderEmail';
import EmailService from '../services/emailService';
import EmailTemplateService from '../services/EmailTemplateService';

/**
 * Hook personalizado que integra la funcionalidad de email con la búsqueda AI de proveedores.
 * Permite enviar emails directamente desde los resultados de búsqueda de AI.
 * 
 * @returns {Object} Métodos y propiedades para el envío de emails desde la búsqueda AI
 */
export const useAIProviderEmail = () => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const { userEmail, sendEmailToProvider, generateDefaultSubject, generateDefaultEmailBody } = useProviderEmail();
  
  /**
   * Genera un asunto personalizado basado en el resultado de la búsqueda AI
   * @param {Object} aiResult Resultado de búsqueda AI
   * @returns {string} Asunto personalizado para el email
   */
  const generateAISubject = useCallback((aiResult) => {
    if (!aiResult) return '';
    
    const templateService = new EmailTemplateService();
    
    // Datos para la plantilla
    const templateData = {
      providerName: aiResult.name,
      date: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      userName: userEmail ? userEmail.split('@')[0] : 'Usuario',
      guests: '100' // Valor por defecto
    };
    
    // Generar asunto personalizado usando plantilla según categoría
    return templateService.generateSubjectFromTemplate(
      aiResult.service,
      templateData
    );
  }, [userEmail]);
  
  /**
   * Genera un cuerpo de email personalizado basado en el resultado de la búsqueda AI
   * @param {Object} aiResult Resultado de búsqueda AI
   * @param {string} searchQuery Consulta original realizada por el usuario
   * @returns {string} Cuerpo de email personalizado con información de la búsqueda
   */
  const generateAIEmailBody = useCallback((aiResult, searchQuery) => {
    if (!aiResult) return '';
    
    const templateService = new EmailTemplateService();
    
    // Construir el insight de AI si existe
    const aiInsight = aiResult.aiSummary 
      ? `${aiResult.aiSummary}` 
      : '';
    
    // Datos para la plantilla
    const templateData = {
      providerName: aiResult.name,
      searchQuery: searchQuery || 'servicios de calidad',
      aiInsight,
      date: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      price: aiResult.price || '',
      location: aiResult.location || '',
      userName: userEmail ? userEmail.split('@')[0] : 'Usuario',
      guests: '100' // Valor por defecto
    };
    
    // Generar cuerpo de email utilizando plantilla según categoría
    return templateService.generateBodyFromTemplate(
      aiResult.service,
      templateData
    );
  }, [userEmail]);
  
  /**
   * Envía un email al proveedor desde los resultados de la búsqueda AI
   * @param {Object} aiResult Resultado de búsqueda AI
   * @param {string} searchQuery Consulta original de búsqueda
   * @param {Object} options Opciones adicionales (asunto y cuerpo personalizados)
   * @returns {Promise<boolean>} Promesa que resuelve a true si el envío fue exitoso
   */
  const sendEmailFromAIResult = useCallback(async (aiResult, searchQuery, options = {}) => {
    if (!aiResult || !aiResult.name) {
      setError('Información de proveedor incompleta');
      return false;
    }
    
    setIsSending(true);
    setError(null);
    
    try {
      // Crear un objeto de proveedor compatible con el sistema de email existente
      const providerObj = {
        id: aiResult.id,
        name: aiResult.name,
        email: aiResult.email || `${aiResult.name.toLowerCase().replace(/\s+/g, '.')}@proveedor.com`,
        service: aiResult.service,
        location: aiResult.location
      };
      
      // Usar asunto y cuerpo personalizados o generarlos
      const subject = options.subject || generateAISubject(aiResult);
      const body = options.body || generateAIEmailBody(aiResult, searchQuery);
      
      // Registrar actividad de AI para análisis
      const emailService = new EmailService();
      emailService.logAIEmailActivity(aiResult.id, searchQuery);
      
      // Registrar el uso de la plantilla para análisis
      const templateService = new EmailTemplateService();
      const isCustomized = options.subject || options.body;
      templateService.logTemplateUsage(aiResult.service, aiResult, isCustomized);
      
      // Enviar el email usando la función existente
      const result = await sendEmailToProvider(providerObj, subject, body);
      
      return result;
    } catch (err) {
      setError(err.message || 'Error al enviar email');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [sendEmailToProvider, generateAISubject, generateAIEmailBody]);
  
  return {
    userEmail,
    isSending,
    error,
    sendEmailFromAIResult,
    generateAISubject,
    generateAIEmailBody
  };
};

export default useAIProviderEmail;
