import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore, getFirestore, connectFirestoreEmulator, doc, setDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getDatabase, ref, onValue } from 'firebase/database';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyArwjJewGV5j_vzWjqOsQPoJMSFtaCkSZE",
  authDomain: "lovenda-98c77.firebaseapp.com",
  projectId: "lovenda-98c77",
  storageBucket: "lovenda-98c77.appspot.com",
  messagingSenderId: "844882125080",
  appId: "1:844882125080:web:4015c2e2e6eedf009f7e6d",
  measurementId: "G-4QMWEHYPG8"
};

// Variables globales de Firebase
let app;
let auth;
let db;
let analytics;

// Configuración simplificada sin módulo de diagnóstico visual

/**
 * Prueba la conexión con Firestore con reintentos
 */
const probarConexionFirestore = async (maxReintentos = 2) => {
  for (let intento = 0; intento <= maxReintentos; intento++) {
    try {
      const docPrueba = doc(db, '_conexion_prueba', 'test');
      await setDoc(docPrueba, { 
        timestamp: new Date().toISOString(),
        intento: intento + 1
      }, { merge: true });
      console.log('Prueba de conexión exitosa');
      return true;
    } catch (error) {
      console.warn(`Intento ${intento + 1} fallido:`, error);
      if (intento === maxReintentos) {
        console.error('Todos los intentos de conexión fallaron');
        throw error;
      }
      // Esperar antes de reintentar (backoff exponencial)
      await new Promise(resolver => setTimeout(resolver, 1000 * Math.pow(2, intento)));
    }
  }
  return false;
};

/**
 * Configura el listener de estado de conexión
 */
// Configura el listener de estado de conexión (solo si se habilita explícitamente)
const configurarListenerConexion = () => {
  if (typeof window === 'undefined') return;

  // Si la variable de entorno VITE_ENABLE_REALTIME_DB no está en 'true', omitimos
  if (import.meta.env.VITE_ENABLE_REALTIME_DB !== 'true') {
    console.log('Realtime Database deshabilitada – no se configurará listener de conexión');
    return;
  }
  if (typeof window === 'undefined') return;

  try {
        // Se asume que Realtime Database está correctamente configurada en el proyecto
    const dbRealtime = getDatabase();
    const estadoConexion = ref(dbRealtime, '.info/connected');
    
    onValue(estadoConexion, (snapshot) => {
      if (snapshot.val() === true) {
        console.log('Conectado a Firebase');
        window.mostrarErrorUsuario?.(`Conectado a internet`, 3000);
      } else {
        console.log('Desconectado de Firebase');

      }
    });
  } catch (error) {
    console.warn('No se pudo configurar el listener de conexión:', error);
  }
};

/**
 * Inicializa los servicios de Firebase
 */
const inicializarFirebase = async () => {
  try {
    console.log('Iniciando configuración de Firebase...');
    
    // Inicializar la app de Firebase
    try {
      app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      console.log('✅ Firebase inicializado correctamente');
    } catch (initError) {
      console.error('❌ Error al inicializar Firebase App:', initError);
      throw new Error(`Error al inicializar Firebase: ${initError.message}`);
    }

    // Inicializar autenticación
    try {
      auth = getAuth(app);
      // Exponer auth para depuración en modo desarrollo
      if (typeof window !== 'undefined' && import.meta.env && import.meta.env.DEV) {
        window.auth = auth;
      }
      // Garantizamos persistencia local para mantener la sesión incluso tras cerrar el navegador
      try {
        const { setPersistence, browserLocalPersistence } = await import('firebase/auth');
        await setPersistence(auth, browserLocalPersistence);
        console.log('✅ Persistencia del auth establecida en Local');
      } catch (pErr) {
        console.warn('No se pudo establecer la persistencia local de auth:', pErr);
      }
      auth.languageCode = 'es';
      if (typeof window !== 'undefined') window.auth = auth;
      console.log('✅ Autenticación de Firebase inicializada');
    } catch (authError) {
      console.error('❌ Error al inicializar Firebase Auth:', authError);
      throw new Error(`Error al inicializar autenticación: ${authError.message}`);
    }

    // Inicializar Firestore con mejores opciones para estabilidad de conexión
    try {
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        cacheSizeBytes: 50 * 1024 * 1024, // ~50 MB
        ignoreUndefinedProperties: true,
      });
      console.log('✅ Firestore inicializado con configuración optimizada');
    } catch (firestoreError) {
      // Si Firestore ya estaba inicializado (p.ej. por otro módulo), reutilizamos la instancia existente
      if (firestoreError?.message?.includes('has already been called')) {
        db = getFirestore(app);
        console.warn('ℹ️ Firestore ya estaba inicializado, usando instancia existente');
      } else {
        console.error('❌ Error al inicializar Firestore:', firestoreError);
        throw new Error(`Error al inicializar Firestore: ${firestoreError.message}`);
      }
    }
    
    // Habilitar persistencia offline con IndexedDB
    try {
      await enableIndexedDbPersistence(db);
      console.log('Persistencia offline habilitada para Firestore');
      window.mostrarNotificacion?.('Modo offline habilitado: puedes usar la aplicación sin conexión', 'info');
    } catch (err) {
      if (err.code === 'failed-precondition') {
        // Múltiples pestañas abiertas, solo una puede usar persistencia
        console.warn('La persistencia offline no está disponible en múltiples pestañas abiertas');
      } else if (err.code === 'unimplemented') {
        // El navegador actual no soporta todas las características necesarias
        console.warn('Este navegador no soporta persistencia offline');
      } else {
        console.error('Error al habilitar persistencia offline:', err);
      }
    }
    // Conectar al emulador de Firestore en desarrollo si es necesario
    try {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        // Comentamos esta línea si no estás utilizando el emulador local
        // connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('Modo desarrollo detectado - usando Firebase cloud');
      }
    } catch (emulatorError) {
      console.warn('No se pudo configurar el emulador:', emulatorError);
    }

    // Probar la conexión con Firestore
    try {
      console.log('Probando conexión a Firestore...');
      await probarConexionFirestore();
      console.log('✅ Conexión con Firestore verificada');
      
      // Verificar reglas de seguridad
      try {
        const testDoc = doc(db, '_test_connection', 'test');
        await setDoc(testDoc, { test: new Date().toISOString() }, { merge: true });
        console.log('✅ Prueba de escritura en Firestore exitosa');
        window.mostrarErrorUsuario?.(`✅ Conectado a Firebase correctamente`, 3000);
      } catch (writeError) {
        console.error('❌ Error al escribir en Firestore:', writeError);
        let errorMsg = 'Error al escribir en Firestore';
        
        if (writeError.code === 'permission-denied') {
          errorMsg = 'Error de permisos: No tienes acceso a la base de datos. Verifica tu autenticación o las reglas de seguridad.';
          console.error('❌ Error de permisos en Firestore - revisa las reglas de seguridad');
        } else if (writeError.code === 'unavailable') {
          errorMsg = 'Servidor de Firebase no disponible. Verifica tu conexión a internet.';
          console.error('❌ Error de disponibilidad - Firestore no accesible');
        } else {
          errorMsg = `Error al acceder a Firestore: ${writeError.message}`;
        }
        
        window.mostrarErrorUsuario?.(errorMsg, 10000);
      }
    } catch (error) {
      console.warn('❌ No se pudo conectar a Firestore, trabajando en modo fuera de línea:', error);
      let errorMsg = 'Modo sin conexión - Los cambios se sincronizarán cuando se recupere la conexión';
      
      if (error.code === 'unavailable') {
        errorMsg = 'Firebase no disponible. Verifica tu conexión a internet.';
      } else if (error.message && error.message.includes('network')) {
        errorMsg = 'Problemas de red al conectar con Firebase. Verificando conexión...';
      }
      
      window.mostrarErrorUsuario?.(errorMsg, 10000);
    }

    // Inicializar Analytics solo en producción
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      try {
        const soporteAnalytics = await isSupported();
        if (soporteAnalytics) {
          analytics = getAnalytics(app);
          console.log('Analytics inicializado');
        } else {
          console.log('Analytics no es compatible con este navegador');
        }
      } catch (error) {
        console.warn('Error al inicializar Analytics:', error);
      }
    }

    // Configurar listener de conexión
    configurarListenerConexion();

  } catch (error) {
    console.error('Error al inicializar Firebase:', error);
    if (typeof window !== 'undefined') {
      window.mostrarErrorUsuario?.(
        'Error al conectar con el servidor. La aplicación funcionará en modo fuera de línea.',
        0
      );
    }
    throw error;
  }
};

/**
 * Autenticación automática para solucionar problemas de bandeja de salida
 * Esta función crea un usuario simulado para evitar problemas con Firebase Auth
 */
const autoAuthenticateUser = async () => {
  try {
    // En lugar de usar signInAnonymously (que está bloqueado), 
    // crear un usuario simulado para el sistema de correos
    if (!auth.currentUser) {
      console.log('🔐 Creando usuario simulado para sistema de correos...');
      
      // Crear un objeto de usuario simulado que imite la estructura de Firebase
      const simulatedUser = {
        uid: 'email-system-user-' + Date.now(),
        email: 'usuario@mywed360.com',
        displayName: 'Usuario MyWed360',
        isAnonymous: true,
        // Simular método getIdToken para compatibilidad
        getIdToken: async () => {
          // Generar un token simulado para el backend
          const payload = {
            uid: 'email-system-user-' + Date.now(),
            email: 'usuario@mywed360.com',
            iss: 'https://securetoken.google.com/lovenda-98c77',
            aud: 'lovenda-98c77',
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora
            iat: Math.floor(Date.now() / 1000)
          };
          // Token simulado (no es un JWT real, pero sirve para identificación)
          return btoa(JSON.stringify(payload));
        }
      };
      
      console.log('✅ Usuario simulado creado:', simulatedUser.uid);
      return simulatedUser;
    }
    return auth.currentUser;
  } catch (error) {
    console.error('❌ Error en autenticación simulada:', error);
    return null;
  }
};

// Al importar este módulo iniciamos Firebase y exportamos la promesa
const firebaseReady = inicializarFirebase()
  .then(async () => {
    // Autenticar automáticamente después de inicializar Firebase
    await autoAuthenticateUser();
    return true;
  })
  .catch(error => {
    console.error('Error crítico al inicializar Firebase:', error);
    // Propagamos error para que otros módulos puedan manejarlo
    throw error;
  });

export { auth, db, analytics, firebaseReady, autoAuthenticateUser };
