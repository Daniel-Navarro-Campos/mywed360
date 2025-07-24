import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import * as EmailService from '../services/EmailService';
import { createTrackingRecord } from '../services/EmailTrackingService';

/**
 * Hook personalizado que proporciona funcionalidades para enviar y gestionar
 * emails a proveedores utilizando el sistema de correo personalizado de Lovenda.
 * 
 * @returns {Object} Funciones y estados para la gestión de emails a proveedores
 */
export const useProviderEmail = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  
  // Inicializar el servicio de email con el perfil del usuario
  useEffect(() => {
    if (profile) {
      const email = EmailService.initEmailService(profile);
      setUserEmail(email);
    }
  }, [profile]);

  /**
   * Envía un email a un proveedor y crea un registro de seguimiento
   * 
   * @param {Object} provider - Datos del proveedor
   * @param {string} provider.id - ID del proveedor
   * @param {string} provider.name - Nombre del proveedor
   * @param {string} provider.email - Email del proveedor
   * @param {string} subject - Asunto del email
   * @param {string} body - Contenido del email (HTML permitido)
   * @param {Array} [attachments=[]] - Archivos adjuntos
   * @returns {Promise<Object>} Resultado del envío
   */
  const sendEmailToProvider = useCallback(async (provider, subject, body, attachments = []) => {
    if (!provider || !provider.email) {
      setError('El proveedor no tiene email definido');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Enviar el email
      const emailData = await EmailService.sendMail({
        to: provider.email,
        subject,
        body,
        attachments
      });
      
      // Crear registro de seguimiento para este email
      if (emailData && emailData.id) {
        const trackingRecord = await createTrackingRecord(emailData, provider);
        
        // Devolver información combinada
        return {
          email: emailData,
          tracking: trackingRecord
        };
      }
      
      return { email: emailData };
    } catch (err) {
      console.error('Error al enviar email al proveedor:', err);
      setError('No se pudo enviar el email. Inténtalo de nuevo más tarde.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Genera un asunto predeterminado para un proveedor según su servicio
   * 
   * @param {Object} provider - Datos del proveedor
   * @returns {string} Asunto predeterminado
   */
  const generateDefaultSubject = useCallback((provider) => {
    if (!provider) return 'Consulta sobre servicios para boda';
    
    const servicioNormalizado = provider.service ? 
      provider.service.toLowerCase().trim() : 'servicios';
    
    const subjectTemplates = {
      'fotografía': 'Consulta sobre servicios de fotografía para boda',
      'fotografia': 'Consulta sobre servicios de fotografía para boda',
      'fotografo': 'Consulta sobre servicios de fotografía para boda',
      'catering': 'Consulta sobre servicios de catering para boda',
      'flores': 'Consulta sobre decoración floral para boda',
      'música': 'Consulta sobre música y animación para boda',
      'musica': 'Consulta sobre música y animación para boda',
      'dj': 'Consulta sobre servicio de DJ para boda',
      'transporte': 'Consulta sobre servicios de transporte para boda',
      'vestido': 'Consulta sobre vestido de novia',
      'traje': 'Consulta sobre traje de novio',
      'decoración': 'Consulta sobre decoración para boda',
      'decoracion': 'Consulta sobre decoración para boda',
      'invitaciones': 'Consulta sobre diseño de invitaciones',
      'default': `Consulta sobre ${servicioNormalizado} para boda`
    };
    
    const serviceKey = Object.keys(subjectTemplates).find(key => 
      servicioNormalizado.includes(key)
    );
    
    return serviceKey ? 
      subjectTemplates[serviceKey] : 
      subjectTemplates['default'];
  }, []);
  
  /**
   * Genera un cuerpo predeterminado para un email a un proveedor
   * 
   * @param {Object} provider - Datos del proveedor
   * @returns {string} Cuerpo del email en formato HTML
   */
  const generateDefaultEmailBody = useCallback((provider) => {
    if (!profile) return '';
    
    const nombreUsuario = profile.brideFirstName ? 
      `${profile.brideFirstName}${profile.brideLastName ? ' ' + profile.brideLastName : ''}` : 
      'Futuros novios';
    
    const fechaBoda = profile.weddingDate ? 
      new Date(profile.weddingDate).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) : 
      'fecha por determinar';
    
    return `
      <p>Estimado/a ${provider?.name || 'Proveedor'}:</p>
      
      <p>Mi nombre es ${nombreUsuario} y me pongo en contacto con ustedes porque estoy organizando mi boda para el día <strong>${fechaBoda}</strong>.</p>
      
      <p>He visto sus servicios de ${provider?.service || 'para bodas'} y me gustaría obtener más información sobre:</p>
      
      <ul>
        <li>Disponibilidad para la fecha mencionada</li>
        <li>Paquetes y servicios que ofrecen</li>
        <li>Precios aproximados</li>
        <li>Proceso de reserva</li>
      </ul>
      
      <p>Agradecería mucho si pudieran proporcionarme esta información para valorar su propuesta.</p>
      
      <p>Quedo a la espera de su respuesta.</p>
      
      <p>Saludos cordiales,<br>
      ${nombreUsuario}</p>
      
      <p style="color:#888; font-size:12px;">Email enviado desde Lovenda - Tu plataforma para organización de bodas</p>
    `;
  }, [profile]);
  
  return {
    loading,
    error,
    userEmail,
    sendEmailToProvider,
    generateDefaultSubject,
    generateDefaultEmailBody
  };
};

export default useProviderEmail;
