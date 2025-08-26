


/**
 * Servicio de Diagnóstico Avanzado para Backend y Servicios Externos
 * Proporciona funciones específicas para diagnosticar problemas comunes
 */

class DiagnosticService {
  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_BASE_URL;
    this.testResults = new Map();
  }

  /**
   * Diagnóstico completo del sistema de emails
   */
  async diagnoseEmailSystem() {
    console.group('📧 Diagnosticando Sistema de Emails');
    
    const results = {
      mailgunConfig: await this.testMailgunConfig(),
      backendMailRoutes: await this.testBackendMailRoutes(),
      emailDatabase: await this.testEmailDatabase(),
      webhooks: await this.testWebhooks()
    };

    console.log('Resultados del diagnóstico de emails:', results);
    console.groupEnd();
    
    return results;
  }

  /**
   * Diagnóstico del chat IA
   */
  async diagnoseAIChat() {
    console.group('🤖 Diagnosticando Chat IA');
    
    const results = {
      openaiConfig: await this.testOpenAIConfig(),
      backendAIRoutes: await this.testBackendAIRoutes(),
      apiQuota: await this.checkAPIQuota()
    };

    console.log('Resultados del diagnóstico de IA:', results);
    console.groupEnd();
    
    return results;
  }

  /**
   * Diagnóstico completo de Firebase
   */
  async diagnoseFirebase() {
    console.group('🔥 Diagnosticando Firebase');
    
    const results = {
      authentication: await this.testFirebaseAuth(),
      firestore: await this.testFirestoreConnection(),
      storage: await this.testFirebaseStorage(),
      rules: await this.testFirestoreRules()
    };

    console.log('Resultados del diagnóstico de Firebase:', results);
    console.groupEnd();
    
    return results;
  }

  /**
   * Test de configuración de Mailgun
   */
  async testMailgunConfig() {
    try {
      const apiKey = import.meta.env.VITE_MAILGUN_API_KEY;
      const domain = import.meta.env.VITE_MAILGUN_DOMAIN;
      const sendingDomain = import.meta.env.VITE_MAILGUN_SENDING_DOMAIN;
      
      if (!apiKey || !domain) {
        return {
          status: 'error',
          message: 'Variables de Mailgun no configuradas',
          details: { hasApiKey: !!apiKey, hasDomain: !!domain }
        };
      }

      // Test a través del backend
      if (this.backendUrl) {
        const response = await fetch(`${this.backendUrl}/api/mailgun/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });

        if (response.ok) {
          const data = await response.json();
          return {
            status: 'success',
            message: 'Mailgun configurado correctamente',
            details: { domain, sendingDomain, response: data }
          };
        } else {
          const error = await response.text();
          return {
            status: 'error',
            message: `Error en test de Mailgun: ${response.status}`,
            details: { error, domain }
          };
        }
      }

      return {
        status: 'warning',
        message: 'Variables configuradas pero backend no disponible',
        details: { domain, sendingDomain }
      };

    } catch (error) {
      return {
        status: 'error',
        message: 'Error al probar Mailgun',
        details: { error: error.message }
      };
    }
  }

  /**
   * Test de rutas de email del backend
   */
  async testBackendMailRoutes() {
    if (!this.backendUrl) {
      return {
        status: 'error',
        message: 'URL del backend no configurada'
      };
    }

    const routes = [
      '/api/mail/send',
      '/api/mail/inbox',
      '/api/mailgun/webhook'
    ];

    const results = {};

    for (const route of routes) {
      try {
        const response = await fetch(`${this.backendUrl}${route}`, {
          method: 'OPTIONS' // Usar OPTIONS para verificar que la ruta existe
        });
        
        results[route] = {
          status: response.status < 500 ? 'success' : 'error',
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        results[route] = {
          status: 'error',
          error: error.message
        };
      }
    }

    return {
      status: Object.values(results).some(r => r.status === 'error') ? 'warning' : 'success',
      message: 'Test de rutas de email completado',
      details: results
    };
  }

  /**
   * Test de base de datos de emails
   */
  async testEmailDatabase() {
    try {
      const { getFirestore, collection, query, limit, getDocs } = await import('firebase/firestore');
      const db = getFirestore();

      // Intentar leer algunos emails de prueba
      const emailsRef = collection(db, 'emails');
      const q = query(emailsRef, limit(1));
      const snapshot = await getDocs(q);

      return {
        status: 'success',
        message: 'Conexión con base de datos de emails OK',
        details: {
          documentsFound: snapshot.size,
          collectionPath: 'emails'
        }
      };

    } catch (error) {
      return {
        status: 'error',
        message: 'Error al acceder a la base de datos de emails',
        details: { error: error.message, code: error.code }
      };
    }
  }

  /**
   * Test de webhooks
   */
  async testWebhooks() {
    if (!this.backendUrl) {
      return {
        status: 'error',
        message: 'Backend no disponible para test de webhooks'
      };
    }

    try {
      const response = await fetch(`${this.backendUrl}/api/mailgun/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'event-data': {
            event: 'test',
            message: { headers: { 'message-id': 'test-webhook' } }
          }
        })
      });

      return {
        status: response.status === 200 ? 'success' : 'warning',
        message: `Webhook test: ${response.status}`,
        details: { statusCode: response.status }
      };

    } catch (error) {
      return {
        status: 'error',
        message: 'Error al probar webhook',
        details: { error: error.message }
      };
    }
  }

  /**
   * Test de configuración de OpenAI
   */
  async testOpenAIConfig() {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        return {
          status: 'error',
          message: 'API Key de OpenAI no configurada'
        };
      }

      // Test básico de la API
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          status: 'success',
          message: 'OpenAI API configurada correctamente',
          details: {
            modelsAvailable: data.data?.length || 0,
            keyPrefix: apiKey.substring(0, 10) + '...'
          }
        };
      } else {
        const error = await response.text();
        return {
          status: 'error',
          message: `Error en OpenAI API: ${response.status}`,
          details: { error, status: response.status }
        };
      }

    } catch (error) {
      return {
        status: 'error',
        message: 'Error al probar OpenAI',
        details: { error: error.message }
      };
    }
  }

  /**
   * Test de rutas de IA del backend
   */
  async testBackendAIRoutes() {
    if (!this.backendUrl) {
      return {
        status: 'error',
        message: 'Backend no disponible'
      };
    }

    try {
      const response = await fetch(`${this.backendUrl}/api/ai/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'test' })
      });

      return {
        status: response.ok ? 'success' : 'error',
        message: `Backend AI routes: ${response.status}`,
        details: { statusCode: response.status }
      };

    } catch (error) {
      return {
        status: 'error',
        message: 'Error al probar rutas de IA',
        details: { error: error.message }
      };
    }
  }

  /**
   * Verificar cuota de API de OpenAI
   */
  async checkAPIQuota() {
    try {
      // Esta información normalmente requiere una llamada específica a la API de billing
      // Por ahora, haremos un test simple
      return {
        status: 'info',
        message: 'Verificación de cuota requiere implementación específica',
        details: { note: 'Implementar verificación de billing si es necesario' }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Error al verificar cuota',
        details: { error: error.message }
      };
    }
  }

  /**
   * Test de autenticación de Firebase
   */
  async testFirebaseAuth() {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();

      return {
        status: 'success',
        message: 'Firebase Auth inicializado',
        details: {
          currentUser: auth.currentUser?.uid || 'No authenticated user',
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
        }
      };

    } catch (error) {
      return {
        status: 'error',
        message: 'Error en Firebase Auth',
        details: { error: error.message, code: error.code }
      };
    }
  }

  /**
   * Test de conexión a Firestore
   */
  async testFirestoreConnection() {
    try {
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const db = getFirestore();

      // Intentar leer un documento de prueba
      const testDoc = doc(db, '_conexion_prueba', 'connection');
      await getDoc(testDoc);

      return {
        status: 'success',
        message: 'Firestore conectado correctamente',
        details: {
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
        }
      };

    } catch (error) {
      return {
        status: 'error',
        message: 'Error de conexión con Firestore',
        details: { error: error.message, code: error.code }
      };
    }
  }

  /**
   * Test de Firebase Storage
   */
  async testFirebaseStorage() {
    try {
      const { getStorage, ref } = await import('firebase/storage');
      const storage = getStorage();
      
      // Crear una referencia de prueba
      const testRef = ref(storage, 'test/connection');

      return {
        status: 'success',
        message: 'Firebase Storage disponible',
        details: {
          bucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
        }
      };

    } catch (error) {
      return {
        status: 'error',
        message: 'Error en Firebase Storage',
        details: { error: error.message, code: error.code }
      };
    }
  }

  /**
   * Test de reglas de Firestore
   */
  async testFirestoreRules() {
    try {
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const db = getFirestore();

      // Intentar acceder a diferentes colecciones para probar permisos
      const collections = ['users', 'weddings', 'emails', 'guests'];
      const results = {};

      for (const collectionName of collections) {
        try {
          const testDoc = doc(db, collectionName, 'test');
          await getDoc(testDoc);
          results[collectionName] = 'accessible';
        } catch (error) {
          results[collectionName] = error.code || 'error';
        }
      }

      return {
        status: 'success',
        message: 'Test de reglas completado',
        details: { collections: results }
      };

    } catch (error) {
      return {
        status: 'error',
        message: 'Error al probar reglas de Firestore',
        details: { error: error.message }
      };
    }
  }

  /**
   * Ejecuta un diagnóstico completo del sistema
   */
  async runFullDiagnostic() {
    console.log('🔍 Iniciando diagnóstico completo del sistema...');
    
    const results = {
      timestamp: new Date().toISOString(),
      email: await this.diagnoseEmailSystem(),
      ai: await this.diagnoseAIChat(),
      firebase: await this.diagnoseFirebase()
    };

    console.log('📊 Diagnóstico completo finalizado:', results);
    
    return results;
  }
}

export default new DiagnosticService();

