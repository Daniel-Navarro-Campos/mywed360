import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, doc, setDoc } from 'firebase/firestore';
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

/**
 * Configura el manejo de errores globales
 */
const configurarManejoErrores = () => {
  if (typeof window === 'undefined') return;
  
  // Crear banner de error si no existe
  let bannerError = document.getElementById('firebase-error-banner');
  if (!bannerError) {
    bannerError = document.createElement('div');
    bannerError.id = 'firebase-error-banner';
    bannerError.style.position = 'fixed';
    bannerError.style.bottom = '0';
    bannerError.style.left = '0';
    bannerError.style.right = '0';
    bannerError.style.backgroundColor = '#ff4444';
    bannerError.style.color = 'white';
    bannerError.style.padding = '10px';
    bannerError.style.textAlign = 'center';
    bannerError.style.zIndex = '9999';
    bannerError.style.display = 'none';
    document.body.appendChild(bannerError);
  }

  // Manejador global de errores
  const manejarErrorGlobal = (evento) => {
    const error = evento.error || evento.reason;
    console.error('Error global:', error);
    if (error) {
      mostrarErrorUsuario(error.message || 'Ocurrió un error inesperado');
    }
  };

  // Función para mostrar errores al usuario
  window.mostrarErrorUsuario = (mensaje, duracion = 10000) => {
    if (!bannerError) return;
    bannerError.textContent = mensaje;
    bannerError.style.display = 'block';
    if (duracion > 0) {
      setTimeout(() => {
        if (bannerError) bannerError.style.display = 'none';
      }, duracion);
    }
  };

  window.addEventListener('error', manejarErrorGlobal);
  window.addEventListener('unhandledrejection', manejarErrorGlobal);
};

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
const configurarListenerConexion = () => {
  if (typeof window === 'undefined') return;

  try {
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
    // Inicializar la app de Firebase
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    console.log('Firebase inicializado');

    // Inicializar autenticación
    auth = getAuth(app);
    auth.languageCode = 'es';
    console.log('Autenticación de Firebase inicializada');

    // Inicializar Firestore con experimentalForceLongPolling
    db = initializeFirestore(app, { experimentalForceLongPolling: true });
    console.log('Firestore inicializado con experimentalForceLongPolling');
    // Conectar al emulador de Firestore en desarrollo
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Conectado al emulador de Firestore en localhost:8080');
    }

    // Probar la conexión con Firestore
    try {
      await probarConexionFirestore();
      console.log('Conexión con Firestore verificada');
      // Verificar reglas de seguridad
      try {
        const testDoc = doc(db, '_test_connection', 'test');
        await setDoc(testDoc, { test: new Date().toISOString() }, { merge: true });
        console.log('Prueba de escritura en Firestore exitosa');
      } catch (writeError) {
        console.error('Error al escribir en Firestore:', writeError);
        if (writeError.code === 'permission-denied') {
          window.mostrarErrorUsuario?.(
            'Error de permisos: No tienes acceso a la base de datos. Por favor, verifica tu autenticación.',
            10000
          );
        }
      }
    } catch (error) {
      console.warn('No se pudo conectar a Firestore, trabajando en modo fuera de línea:', error);
      window.mostrarErrorUsuario?.(
        'Modo sin conexión - Los cambios se sincronizarán cuando se recupere la conexión',
        0
      );
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

// Configurar manejo de errores primero
configurarManejoErrores();

// Inicializar Firebase cuando se importe el módulo
inicializarFirebase().catch(error => {
  console.error('Error crítico al inicializar Firebase:', error);
});

export { auth, db, analytics };
