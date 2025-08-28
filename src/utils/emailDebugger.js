/**
 * EmailDebugger - Sistema completo de diagnóstico para el flujo de email
 * Analiza autenticación, conexiones, caché y proporciona reparación automática
 */

import EmailService from '../services/emailService.js';
import { autoAuthenticateUser } from '../firebaseConfig.js';

class EmailDebugger {
  constructor() {
    this.logs = [];
    this.startTime = Date.now();
  }

  log(level, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      elapsed: Date.now() - this.startTime
    };
    this.logs.push(entry);
    console.log(`[${level.toUpperCase()}] ${message}`, data || '');
  }

  async checkAuthentication() {
    this.log('info', 'Verificando autenticación...');
    
    try {
      // Obtener información de debug del EmailService
      const debugInfo = EmailService.getEmailServiceDebugInfo?.();
      this.log('info', 'Estado del EmailService', debugInfo);

      // Verificar token de autenticación
      const token = await EmailService.getAuthToken?.();
      this.log('info', 'Token de autenticación', { 
        hasToken: !!token, 
        tokenLength: token?.length || 0 
      });

      return {
        ...debugInfo,
        hasToken: !!token,
        tokenLength: token?.length || 0,
        status: debugInfo?.CURRENT_USER_EMAIL ? 'authenticated' : 'not_authenticated'
      };
    } catch (error) {
      this.log('error', 'Error verificando autenticación', error);
      return { status: 'error', error: error.message };
    }
  }

  async checkMailgunConnection() {
    this.log('info', 'Verificando conexión con Mailgun...');
    
    try {
      // Verificar variables de entorno
      const mailgunKey = import.meta.env.VITE_MAILGUN_API_KEY;
      const mailgunDomain = import.meta.env.VITE_MAILGUN_DOMAIN || 'mywed360.com';
      
      this.log('info', 'Variables Mailgun', { 
        hasKey: !!mailgunKey, 
        keyLength: mailgunKey?.length || 0,
        domain: mailgunDomain 
      });

      if (!mailgunKey) {
        return { status: 'error', error: 'VITE_MAILGUN_API_KEY no configurada' };
      }

      // Intentar hacer una petición de prueba a Mailgun
      const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/events?limit=1`, {
        headers: {
          'Authorization': `Basic ${btoa(`api:${mailgunKey}`)}`
        }
      });

      const status = response.ok ? 'connected' : 'error';
      this.log('info', 'Respuesta de Mailgun', { status: response.status, ok: response.ok });

      return { 
        status, 
        statusCode: response.status,
        hasKey: true,
        domain: mailgunDomain
      };
    } catch (error) {
      this.log('error', 'Error conectando con Mailgun', error);
      return { status: 'error', error: error.message };
    }
  }

  async checkBackendConnection() {
    this.log('info', 'Verificando conexión con backend...');
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'https://mywed360-backend.onrender.com';
      this.log('info', 'URL del backend', { url: backendUrl });

      const response = await fetch(`${backendUrl}/health`);
      const status = response.ok ? 'connected' : 'error';
      
      this.log('info', 'Respuesta del backend', { status: response.status, ok: response.ok });

      return { 
        status, 
        statusCode: response.status,
        url: backendUrl
      };
    } catch (error) {
      this.log('error', 'Error conectando con backend', error);
      return { status: 'error', error: error.message };
    }
  }

  async checkLocalStorage() {
    this.log('info', 'Verificando almacenamiento local...');
    
    try {
      const userEmail = localStorage.getItem('mywed360_user_email');
      const storedMails = localStorage.getItem('mywed360_mails');
      const parsedMails = storedMails ? JSON.parse(storedMails) : [];

      this.log('info', 'Datos en localStorage', {
        userEmail,
        mailsCount: parsedMails.length,
        hasStoredMails: parsedMails.length > 0
      });

      return {
        status: 'ok',
        userEmail,
        mailsCount: parsedMails.length,
        hasStoredMails: parsedMails.length > 0
      };
    } catch (error) {
      this.log('error', 'Error verificando localStorage', error);
      return { status: 'error', error: error.message };
    }
  }

  async testEmailRetrieval() {
    this.log('info', 'Probando recuperación de emails...');
    
    try {
      // Probar obtener emails de inbox
      const inboxEmails = await EmailService.getMails('inbox');
      this.log('info', 'Emails de inbox obtenidos', { 
        count: Array.isArray(inboxEmails) ? inboxEmails.length : 0,
        type: typeof inboxEmails
      });

      // Probar obtener emails enviados
      const sentEmails = await EmailService.getMails('sent');
      this.log('info', 'Emails enviados obtenidos', { 
        count: Array.isArray(sentEmails) ? sentEmails.length : 0,
        type: typeof sentEmails
      });

      return {
        status: 'ok',
        inboxCount: Array.isArray(inboxEmails) ? inboxEmails.length : 0,
        sentCount: Array.isArray(sentEmails) ? sentEmails.length : 0,
        inboxEmails: Array.isArray(inboxEmails) ? inboxEmails.slice(0, 3) : inboxEmails,
        sentEmails: Array.isArray(sentEmails) ? sentEmails.slice(0, 3) : sentEmails
      };
    } catch (error) {
      this.log('error', 'Error probando recuperación de emails', error);
      return { status: 'error', error: error.message };
    }
  }

  async runFullDiagnosis() {
    this.log('info', '=== INICIANDO DIAGNÓSTICO COMPLETO ===');
    
    const results = {
      timestamp: new Date().toISOString(),
      authentication: await this.checkAuthentication(),
      mailgun: await this.checkMailgunConnection(),
      backend: await this.checkBackendConnection(),
      localStorage: await this.checkLocalStorage(),
      emailRetrieval: await this.testEmailRetrieval()
    };

    this.log('info', '=== DIAGNÓSTICO COMPLETADO ===');
    
    // Generar reporte resumido
    const report = this.generateDiagnosisReport(results);
    
    return {
      results,
      report,
      logs: this.logs
    };
  }

  generateDiagnosisReport(results) {
    const issues = [];
    const warnings = [];
    const recommendations = [];

    // Analizar autenticación
    if (results.authentication.status !== 'authenticated') {
      issues.push('Usuario no autenticado correctamente');
      recommendations.push('Ejecutar reparación de autenticación');
    }

    // Analizar conexiones
    if (results.mailgun.status === 'error') {
      issues.push('Problema de conexión con Mailgun');
      recommendations.push('Verificar VITE_MAILGUN_API_KEY');
    }

    if (results.backend.status === 'error') {
      warnings.push('Backend no accesible');
      recommendations.push('Verificar VITE_BACKEND_BASE_URL');
    }

    // Analizar emails
    if (results.emailRetrieval.inboxCount === 0 && results.emailRetrieval.sentCount === 0) {
      issues.push('No se recuperaron emails');
      recommendations.push('Verificar autenticación y conexiones');
    }

    const status = issues.length > 0 ? 'critical' : warnings.length > 0 ? 'warning' : 'healthy';

    return {
      status,
      issues,
      warnings,
      recommendations,
      summary: `Estado: ${status.toUpperCase()} - ${issues.length} problemas críticos, ${warnings.length} advertencias`
    };
  }
}

/**
 * Función de reparación automática de autenticación
 */
export async function repairEmailAuthentication() {
  console.log('=== INICIANDO REPARACIÓN DE AUTENTICACIÓN ===');
  
  try {
    // 1. Primero, autenticar en Firebase automáticamente
    console.log('🔐 Paso 1: Autenticando en Firebase...');
    const firebaseUser = await autoAuthenticateUser();
    
    if (firebaseUser) {
      console.log('✅ Firebase autenticado:', firebaseUser.uid);
    } else {
      console.log('⚠️ Firebase no pudo autenticarse, continuando...');
    }
    
    // 2. Intentar forzar reconfiguración del usuario
    if (EmailService.forceReconfigureEmailUser) {
      const success = await EmailService.forceReconfigureEmailUser();
      console.log('Reconfiguración de usuario:', success ? 'ÉXITO' : 'FALLÓ');
      
      if (success) {
        // Verificar que la reconfiguración funcionó
        const debugInfo = EmailService.getEmailServiceDebugInfo?.();
        console.log('Estado después de reparación:', debugInfo);
        
        return {
          success: true,
          message: 'Autenticación reparada correctamente (Firebase + EmailService)',
          userEmail: debugInfo?.CURRENT_USER_EMAIL,
          firebaseUser: firebaseUser?.uid,
          timestamp: new Date().toISOString()
        };
      }
    }

    // Si la reconfiguración automática falló, intentar manualmente
    console.log('Intentando reparación manual...');
    
    // Obtener usuario de Firebase
    if (window.firebase && window.firebase.auth) {
      const user = window.firebase.auth().currentUser;
      if (user && user.email) {
        await EmailService.initEmailService({ email: user.email });
        console.log('Reparación manual exitosa con Firebase user:', user.email);
        
        return {
          success: true,
          message: 'Autenticación reparada manualmente',
          userEmail: user.email,
          timestamp: new Date().toISOString()
        };
      }
    }

    // Último recurso: usar email almacenado
    const storedEmail = localStorage.getItem('mywed360_user_email');
    if (storedEmail) {
      await EmailService.initEmailService({ email: storedEmail });
      console.log('Reparación con email almacenado:', storedEmail);
      
      return {
        success: true,
        message: 'Autenticación reparada con email almacenado',
        userEmail: storedEmail,
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: false,
      message: 'No se pudo reparar la autenticación - no se encontró usuario válido',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error en reparación:', error);
    return {
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Exportar instancia global para uso en consola
const emailDebugger = new EmailDebugger();

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
  window.diagnoseEmailSystem = () => emailDebugger.runFullDiagnosis();
  window.repairEmailAuth = repairEmailAuthentication;
}

export default emailDebugger;
