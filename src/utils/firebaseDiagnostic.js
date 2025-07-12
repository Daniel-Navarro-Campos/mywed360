import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, enableNetwork, disableNetwork } from 'firebase/firestore';

/**
 * Realiza diagnóstico de la conexión a Firestore
 * @returns {Promise<Object>} Resultado del diagnóstico
 */
export const diagnosticarFirestore = async () => {
  const resultado = {
    timestamp: new Date().toISOString(),
    estadoConexion: 'desconocido',
    usuarioAutenticado: false,
    permisoEscritura: false,
    permisoLectura: false,
    errores: [],
    solucionesIntentadas: []
  };

  try {
    // 1. Comprobar autenticación
    const auth = getAuth();
    const usuario = auth.currentUser;
    resultado.usuarioAutenticado = !!usuario;
    
    if (!usuario) {
      resultado.errores.push('No hay usuario autenticado, requerido para operaciones en Firestore');
      return resultado;
    }

    // 2. Intentar forzar reconexión a la red
    try {
      resultado.solucionesIntentadas.push('Desactivar/activar red para forzar reconexión');
      await disableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await enableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      resultado.errores.push(`Error al reiniciar conexión: ${error.message}`);
    }

    // 3. Intentar leer un documento público
    try {
      const docRef = doc(db, 'system_status', 'online_check');
      const docSnap = await getDoc(docRef);
      resultado.permisoLectura = true;
      resultado.estadoConexion = 'online';
    } catch (error) {
      resultado.errores.push(`Error al leer documento público: ${error.message}`);
      resultado.permisoLectura = false;
    }

    // 4. Intentar escribir en un documento de usuario
    if (resultado.permisoLectura) {
      try {
        const userDocRef = doc(db, 'users', usuario.uid);
        await setDoc(userDocRef, { 
          diagnosticCheck: new Date().toISOString(),
          browser: navigator.userAgent
        }, { merge: true });
        resultado.permisoEscritura = true;
      } catch (error) {
        resultado.errores.push(`Error al escribir documento de usuario: ${error.message}`);
        resultado.permisoEscritura = false;
      }
    }

    // 5. Verificar configuración de IndexedDB
    try {
      if (window.indexedDB) {
        // Probar acceso a IndexedDB
        const testRequest = window.indexedDB.open('test-indexeddb');
        
        testRequest.onerror = function() {
          resultado.errores.push('IndexedDB está bloqueado o no disponible');
        };
        
        testRequest.onsuccess = function() {
          resultado.solucionesIntentadas.push('Acceso a IndexedDB verificado correctamente');
          testRequest.result.close();
        };
      } else {
        resultado.errores.push('IndexedDB no está disponible en este navegador');
      }
    } catch (error) {
      resultado.errores.push(`Error al verificar IndexedDB: ${error.message}`);
    }

  } catch (error) {
    resultado.errores.push(`Error general: ${error.message}`);
  }

  return resultado;
};

/**
 * Intenta resolver problemas comunes de conexión a Firestore
 * @returns {Promise<Object>} Resultado del intento de reparación
 */
export const repararConexionFirestore = async () => {
  const resultado = {
    accionesRealizadas: [],
    errores: [],
    exito: false
  };

  try {
    // 1. Forzar reconexión a la red
    try {
      resultado.accionesRealizadas.push('Desactivar red temporalmente');
      await disableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      resultado.accionesRealizadas.push('Reactivar red');
      await enableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      resultado.errores.push(`Error al reiniciar conexión: ${error.message}`);
    }

    // 2. Verificar si la reparación tuvo éxito
    const diagnostico = await diagnosticarFirestore();
    if (diagnostico.estadoConexion === 'online') {
      resultado.exito = true;
      resultado.accionesRealizadas.push('Conexión restablecida correctamente');
    } else {
      resultado.exito = false;
      resultado.errores.push('No se pudo restablecer la conexión');
    }

  } catch (error) {
    resultado.errores.push(`Error durante la reparación: ${error.message}`);
    resultado.exito = false;
  }

  return resultado;
};
