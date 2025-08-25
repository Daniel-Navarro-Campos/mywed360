/**
 * Comandos de Consola para Diagnóstico y Debugging
 * Proporciona comandos fáciles de usar desde la consola del navegador
 */

import errorLogger from './errorLogger';
import diagnosticService from '../services/diagnosticService';

class ConsoleCommands {
  constructor() {
    this.setupCommands();
  }

  setupCommands() {
    // Hacer comandos disponibles globalmente
    window.mywed = {
      // Diagnósticos rápidos
      checkAll: () => this.checkAll(),
      checkEmails: () => this.checkEmails(),
      checkAI: () => this.checkAI(),
      checkFirebase: () => this.checkFirebase(),
      
      // Gestión de errores
      errors: () => this.showErrors(),
      clearErrors: () => this.clearErrors(),
      copyErrors: () => this.copyErrors(),
      
      // Información del sistema
      info: () => this.showSystemInfo(),
      env: () => this.showEnvironment(),
      
      // Utilidades
      help: () => this.showHelp(),
      reload: () => this.reloadApp(),
      
      // Acceso directo a servicios
      logger: errorLogger,
      diagnostic: diagnosticService
    };

    // Mostrar mensaje de bienvenida
    this.showWelcomeMessage();
  }

  showWelcomeMessage() {
    console.log(`
🚀 MyWed360 - Sistema de Diagnóstico Activado
=============================================

Comandos disponibles:
• mywed.help()        - Mostrar ayuda completa
• mywed.checkAll()    - Diagnóstico completo
• mywed.errors()      - Ver errores recientes
• mywed.info()        - Información del sistema

💡 Tip: Usa mywed.help() para ver todos los comandos
    `);
  }

  async checkAll() {
    console.log('🔍 Ejecutando diagnóstico completo...');
    
    try {
      const results = await diagnosticService.runFullDiagnostic();
      
      console.group('📊 RESULTADOS DEL DIAGNÓSTICO COMPLETO');
      console.log('Timestamp:', new Date().toLocaleString());
      console.log('Resultados:', results);
      
      // Resumen
      const services = ['email', 'ai', 'firebase'];
      const summary = services.map(service => {
        const status = results[service]?.status || 'unknown';
        const icon = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
        return `${icon} ${service}`;
      }).join(' | ');
      
      console.log('Resumen:', summary);
      console.groupEnd();
      
      return results;
    } catch (error) {
      console.error('❌ Error en diagnóstico completo:', error);
      return { error: error.message };
    }
  }

  async checkEmails() {
    console.log('📧 Diagnosticando sistema de emails...');
    
    try {
      const result = await diagnosticService.diagnoseEmailSystem();
      
      console.group('📧 DIAGNÓSTICO DE EMAILS');
      console.log('Mailgun Config:', result.mailgunConfig);
      console.log('Backend Routes:', result.backendMailRoutes);
      console.log('Email Database:', result.emailDatabase);
      console.log('Webhooks:', result.webhooks);
      console.groupEnd();
      
      return result;
    } catch (error) {
      console.error('❌ Error en diagnóstico de emails:', error);
      return { error: error.message };
    }
  }

  async checkAI() {
    console.log('🤖 Diagnosticando chat IA...');
    
    try {
      const result = await diagnosticService.diagnoseAIChat();
      
      console.group('🤖 DIAGNÓSTICO DE IA');
      console.log('OpenAI Config:', result.openaiConfig);
      console.log('Backend AI Routes:', result.backendAIRoutes);
      console.log('API Quota:', result.apiQuota);
      console.groupEnd();
      
      return result;
    } catch (error) {
      console.error('❌ Error en diagnóstico de IA:', error);
      return { error: error.message };
    }
  }

  async checkFirebase() {
    console.log('🔥 Diagnosticando Firebase...');
    
    try {
      const result = await diagnosticService.diagnoseFirebase();
      
      console.group('🔥 DIAGNÓSTICO DE FIREBASE');
      console.log('Authentication:', result.authentication);
      console.log('Firestore:', result.firestore);
      console.log('Storage:', result.storage);
      console.log('Rules:', result.rules);
      console.groupEnd();
      
      return result;
    } catch (error) {
      console.error('❌ Error en diagnóstico de Firebase:', error);
      return { error: error.message };
    }
  }

  showErrors() {
    const errors = errorLogger.errors;
    const stats = errorLogger.getErrorStats();
    
    console.group('🚨 ERRORES DEL SISTEMA');
    console.log(`Total de errores: ${stats.total}`);
    console.log(`Errores recientes (5min): ${stats.recent}`);
    
    if (stats.total > 0) {
      console.log('\nPor tipo:');
      Object.entries(stats.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      
      console.log('\nÚltimos 5 errores:');
      errors.slice(-5).forEach((error, index) => {
        console.log(`${index + 1}. [${new Date(error.timestamp).toLocaleTimeString()}] ${error.type}`);
        console.log('   Detalles:', error.details);
      });
    } else {
      console.log('✅ No hay errores registrados');
    }
    
    console.groupEnd();
    
    return { errors, stats };
  }

  clearErrors() {
    const count = errorLogger.errors.length;
    errorLogger.errors = [];
    console.log(`✅ ${count} errores eliminados`);
    return true;
  }

  async copyErrors() {
    try {
      await errorLogger.copyErrorsToClipboard();
      console.log('✅ Reporte de errores copiado al portapapeles');
      return true;
    } catch (error) {
      console.error('❌ Error al copiar:', error);
      return false;
    }
  }

  showSystemInfo() {
    const info = {
      timestamp: new Date().toISOString(),
      environment: {
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      diagnostics: errorLogger.diagnostics,
      errorStats: errorLogger.getErrorStats()
    };
    
    console.group('ℹ️ INFORMACIÓN DEL SISTEMA');
    console.log('Modo:', info.environment.mode);
    console.log('Desarrollo:', info.environment.dev);
    console.log('URL:', info.environment.url);
    console.log('User Agent:', info.environment.userAgent);
    console.log('\nEstado de servicios:');
    
    Object.entries(info.diagnostics).forEach(([service, data]) => {
      const icon = data.status === 'success' ? '✅' : 
                   data.status === 'warning' ? '⚠️' : '❌';
      console.log(`  ${icon} ${service}: ${data.status}`);
    });
    
    console.log('\nEstadísticas de errores:', info.errorStats);
    console.groupEnd();
    
    return info;
  }

  showEnvironment() {
    const env = {
      // Variables críticas (sin mostrar valores completos por seguridad)
      firebase: {
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY
      },
      backend: {
        url: import.meta.env.VITE_BACKEND_BASE_URL,
        hasConnection: !!import.meta.env.VITE_BACKEND_BASE_URL
      },
      openai: {
        hasApiKey: !!import.meta.env.VITE_OPENAI_API_KEY,
        keyPrefix: import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 10) + '...'
      },
      mailgun: {
        domain: import.meta.env.VITE_MAILGUN_DOMAIN,
        sendingDomain: import.meta.env.VITE_MAILGUN_SENDING_DOMAIN,
        hasApiKey: !!import.meta.env.VITE_MAILGUN_API_KEY,
        euRegion: import.meta.env.VITE_MAILGUN_EU_REGION
      }
    };
    
    console.group('🌍 VARIABLES DE ENTORNO');
    console.log('Firebase:', env.firebase);
    console.log('Backend:', env.backend);
    console.log('OpenAI:', env.openai);
    console.log('Mailgun:', env.mailgun);
    console.groupEnd();
    
    return env;
  }

  showHelp() {
    console.log(`
🔍 MyWed360 - Comandos de Diagnóstico
====================================

DIAGNÓSTICOS:
• mywed.checkAll()      - Diagnóstico completo del sistema
• mywed.checkEmails()   - Diagnosticar sistema de emails
• mywed.checkAI()       - Diagnosticar chat IA
• mywed.checkFirebase() - Diagnosticar Firebase

ERRORES:
• mywed.errors()        - Mostrar errores recientes
• mywed.clearErrors()   - Limpiar todos los errores
• mywed.copyErrors()    - Copiar reporte al portapapeles

INFORMACIÓN:
• mywed.info()          - Información del sistema
• mywed.env()           - Variables de entorno
• mywed.help()          - Mostrar esta ayuda

UTILIDADES:
• mywed.reload()        - Recargar aplicación
• mywed.logger          - Acceso directo al logger
• mywed.diagnostic      - Acceso directo al servicio de diagnóstico

EJEMPLOS DE USO:
• mywed.checkEmails()   // Verificar por qué no cargan los emails
• mywed.checkAI()       // Verificar por qué no funciona el chat IA
• mywed.errors()        // Ver todos los errores
• mywed.copyErrors()    // Copiar errores para enviar al desarrollador

💡 Todos los comandos devuelven promesas y pueden usarse con await
💡 Los resultados se muestran tanto en consola como se devuelven como objetos
    `);
  }

  reloadApp() {
    console.log('🔄 Recargando aplicación...');
    window.location.reload();
  }
}

// Inicializar comandos
const consoleCommands = new ConsoleCommands();

export default consoleCommands;
