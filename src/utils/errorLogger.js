/**
 * Sistema de Logging y Diagnóstico de Errores Centralizado
 * Captura todos los errores del frontend y backend para diagnóstico
 */

class ErrorLogger {
  constructor() {
    this.errors = [];
    this.diagnostics = {
      firebase: { status: 'unknown', details: null },
      backend: { status: 'unknown', details: null },
      openai: { status: 'unknown', details: null },
      mailgun: { status: 'unknown', details: null },
      environment: { status: 'unknown', details: null }
    };
    this.isInitialized = false;
    this.setupGlobalErrorHandlers();
    this.startDiagnostics();
  }

  /**
   * Configura los manejadores globales de errores
   */
  setupGlobalErrorHandlers() {
    // Capturar errores JavaScript no manejados
    window.addEventListener('error', (event) => {
      this.logError('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || event.error
      });
    });

    // Capturar promesas rechazadas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack || 'No stack trace available'
      });
    });

    // Interceptar console.error para capturar errores manuales
    this.originalConsoleError = console.error;
    console.error = (...args) => {
      this.logError('Console Error', { args });
      // Llamar a la implementación original para no perder mensajes
      this.originalConsoleError.apply(console, args);
    };

    // Interceptar fetch para capturar errores de red
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          this.logError('HTTP Error', {
            url: args[0],
            status: response.status,
            statusText: response.statusText,
            method: args[1]?.method || 'GET'
          });
        }
        return response;
      } catch (error) {
        this.logError('Network Error', {
          url: args[0],
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    };
  }

  /**
   * Registra un error en el sistema
   */
  logError(type, details) {
    const errorEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errors.push(errorEntry);
    
    // Mantener solo los últimos 100 errores para evitar memory leaks
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    // Log en consola con formato mejorado evitando recursión
    if (this.originalConsoleError) {
      this.originalConsoleError.call(console, `🚨 ${type} - ${new Date().toLocaleTimeString()}`);
      this.originalConsoleError.call(console, 'Details:', details);
      this.originalConsoleError.call(console, 'Full Error Entry:', errorEntry);
    } else {
      console.group(`🚨 ${type} - ${new Date().toLocaleTimeString()}`);
      console.log('Details:', details);
      console.log('Full Error Entry:', errorEntry);
      console.groupEnd();
    }

    // Actualizar diagnósticos si es necesario
    this.updateDiagnosticsFromError(type, details);
  }

  /**
   * Actualiza el estado de diagnósticos basado en errores
   */
  updateDiagnosticsFromError(type, details) {
    if (type === 'Network Error' || type === 'HTTP Error') {
      const url = details.url || '';
      
      if (url.includes('firestore') || url.includes('firebase')) {
        this.diagnostics.firebase.status = 'error';
        this.diagnostics.firebase.details = details;
      } else if (url.includes('render.com') || url.includes('localhost:3001')) {
        this.diagnostics.backend.status = 'error';
        this.diagnostics.backend.details = details;
      } else if (url.includes('openai') || url.includes('api.openai.com')) {
        this.diagnostics.openai.status = 'error';
        this.diagnostics.openai.details = details;
      } else if (url.includes('mailgun')) {
        this.diagnostics.mailgun.status = 'error';
        this.diagnostics.mailgun.details = details;
      }
    }
  }

  /**
   * Inicia diagnósticos automáticos del sistema
   */
  async startDiagnostics() {
    console.log('🔍 Iniciando diagnósticos del sistema...');
    
    await Promise.all([
      this.checkEnvironmentVariables(),
      this.checkFirebaseConnection(),
      this.checkBackendConnection(),
      this.checkOpenAIConnection(),
      this.checkMailgunConnection()
    ]);

    this.isInitialized = true;
    this.printDiagnosticsReport();
  }

  /**
   * Verifica las variables de entorno críticas
   */
  async checkEnvironmentVariables() {
    try {
      const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_OPENAI_API_KEY',
        'VITE_MAILGUN_API_KEY',
        'VITE_BACKEND_BASE_URL'
      ];

      const missing = [];
      const present = [];

      requiredVars.forEach(varName => {
        const value = import.meta.env[varName];
        if (!value || value === 'undefined' || value === '') {
          missing.push(varName);
        } else {
          present.push({ name: varName, value: value.substring(0, 10) + '...' });
        }
      });

      this.diagnostics.environment = {
        status: missing.length === 0 ? 'success' : 'error',
        details: {
          missing,
          present,
          total: requiredVars.length,
          mode: import.meta.env.MODE,
          dev: import.meta.env.DEV
        }
      };

    } catch (error) {
      this.diagnostics.environment = {
        status: 'error',
        details: { error: error.message }
      };
    }
  }

  /**
   * Verifica la conexión con Firebase
   */
  async checkFirebaseConnection() {
    try {
      // Importar dinámicamente para evitar errores de inicialización
      const { getFirestore, doc, getDoc, setDoc } = await import('firebase/firestore');
      const { getAuth } = await import('firebase/auth');
      
      const db = getFirestore();
      const auth = getAuth();

      // Intentar operación en colección pública primero
      try {
        const testDoc = doc(db, '_conexion_prueba', 'diagnostic');
        await setDoc(testDoc, { 
          timestamp: new Date().toISOString(),
          source: 'diagnostic-system'
        }, { merge: true });
        
        this.diagnostics.firebase = {
          status: 'success',
          details: {
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            currentUser: auth.currentUser?.uid || 'No authenticated user',
            connection: 'OK - Public collection accessible'
          }
        };
        return;
      } catch (publicError) {
        // Si falla la colección pública, intentar con autenticación
        if (auth.currentUser) {
          const userDoc = doc(db, 'users', auth.currentUser.uid);
          await getDoc(userDoc);
          
          this.diagnostics.firebase = {
            status: 'success',
            details: {
              projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
              authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
              currentUser: auth.currentUser.uid,
              connection: 'OK - Authenticated access'
            }
          };
        } else {
          throw new Error('No authenticated user and public access failed');
        }
      }

    } catch (error) {
      this.diagnostics.firebase = {
        status: 'error',
        details: {
          error: error.message,
          code: error.code,
          stack: error.stack
        }
      };
    }
  }

  /**
   * Verifica la conexión con el backend
   */
  async checkBackendConnection() {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL;
      if (!backendUrl) {
        throw new Error('VITE_BACKEND_BASE_URL no está configurada');
      }

      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.diagnostics.backend = {
          status: 'success',
          details: {
            url: backendUrl,
            response: data,
            status: response.status
          }
        };
      } else {
        throw new Error(`Backend respondió con status ${response.status}`);
      }

    } catch (error) {
      this.diagnostics.backend = {
        status: 'error',
        details: {
          error: error.message,
          url: import.meta.env.VITE_BACKEND_BASE_URL
        }
      };
    }
  }

  /**
   * Verifica la conexión con OpenAI
   */
  async checkOpenAIConnection() {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('VITE_OPENAI_API_KEY no está configurada');
      }

      // Test simple de la API de OpenAI
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        this.diagnostics.openai = {
          status: 'success',
          details: {
            apiKeyPrefix: apiKey.substring(0, 10) + '...',
            status: response.status
          }
        };
      } else {
        throw new Error(`OpenAI API respondió con status ${response.status}`);
      }

    } catch (error) {
      this.diagnostics.openai = {
        status: 'error',
        details: {
          error: error.message,
          hasApiKey: !!import.meta.env.VITE_OPENAI_API_KEY
        }
      };
    }
  }

  /**
   * Verifica la configuración de Mailgun
   */
  async checkMailgunConnection() {
    try {
      const apiKey = import.meta.env.VITE_MAILGUN_API_KEY;
      const domain = import.meta.env.VITE_MAILGUN_DOMAIN;
      
      if (!apiKey || !domain) {
        throw new Error('Variables de Mailgun no configuradas');
      }

      // Verificar a través del backend si está disponible
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL;
      if (backendUrl) {
        const response = await fetch(`${backendUrl}/api/mailgun/test`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.diagnostics.mailgun = {
            status: 'success',
            details: data
          };
        } else {
          throw new Error(`Mailgun test falló con status ${response.status}`);
        }
      } else {
        // Si no hay backend, solo verificar que las variables estén configuradas
        this.diagnostics.mailgun = {
          status: 'warning',
          details: {
            message: 'Variables configuradas pero backend no disponible para test',
            domain,
            hasApiKey: !!apiKey
          }
        };
      }

    } catch (error) {
      this.diagnostics.mailgun = {
        status: 'error',
        details: {
          error: error.message,
          hasApiKey: !!import.meta.env.VITE_MAILGUN_API_KEY,
          hasDomain: !!import.meta.env.VITE_MAILGUN_DOMAIN
        }
      };
    }
  }

  /**
   * Imprime un reporte completo de diagnósticos en la consola
   */
  printDiagnosticsReport() {
    console.clear();
    console.log('🔍 REPORTE DE DIAGNÓSTICOS MYWED360');
    console.log('=====================================');
    console.log('Timestamp:', new Date().toLocaleString());
    console.log('');

    // Resumen general
    const services = Object.keys(this.diagnostics);
    const successful = services.filter(s => this.diagnostics[s].status === 'success').length;
    const errors = services.filter(s => this.diagnostics[s].status === 'error').length;
    const warnings = services.filter(s => this.diagnostics[s].status === 'warning').length;

    console.log(`📊 RESUMEN: ${successful} ✅ | ${warnings} ⚠️ | ${errors} ❌`);
    console.log('');

    // Detalles por servicio
    Object.entries(this.diagnostics).forEach(([service, data]) => {
      const icon = data.status === 'success' ? '✅' : 
                   data.status === 'warning' ? '⚠️' : '❌';
      
      console.group(`${icon} ${service.toUpperCase()}`);
      console.log('Status:', data.status);
      console.log('Details:', data.details);
      console.groupEnd();
    });

    // Errores recientes
    if (this.errors.length > 0) {
      console.log('');
      console.group('🚨 ERRORES RECIENTES');
      this.errors.slice(-5).forEach(error => {
        console.log(`[${error.timestamp}] ${error.type}:`, error.details);
      });
      console.groupEnd();
    }

    console.log('');
    console.log('💡 Para ver más detalles, usa: window.errorLogger.getFullReport()');
    console.log('💡 Para copiar errores: window.errorLogger.copyErrorsToClipboard()');
  }

  /**
   * Obtiene un reporte completo para copiar y pegar
   */
  getFullReport() {
    return {
      timestamp: new Date().toISOString(),
      diagnostics: this.diagnostics,
      errors: this.errors,
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV
      }
    };
  }

  /**
   * Copia los errores al portapapeles para facilitar el debugging
   */
  async copyErrorsToClipboard() {
    try {
      const report = JSON.stringify(this.getFullReport(), null, 2);
      await navigator.clipboard.writeText(report);
      console.log('✅ Reporte copiado al portapapeles');
      return true;
    } catch (error) {
      console.error('❌ Error al copiar al portapapeles:', error);
      console.log('📋 Copia manualmente este reporte:');
      console.log(JSON.stringify(this.getFullReport(), null, 2));
      return false;
    }
  }

  /**
   * Obtiene estadísticas de errores
   */
  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      recent: this.errors.filter(e => 
        new Date(e.timestamp) > new Date(Date.now() - 5 * 60 * 1000)
      ).length
    };

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }
}

// Crear instancia global
const errorLogger = new ErrorLogger();

// Hacer disponible globalmente para debugging
window.errorLogger = errorLogger;

export default errorLogger;
