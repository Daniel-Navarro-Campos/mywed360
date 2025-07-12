// Servicio de sincronización para manejar la persistencia híbrida entre localStorage y Firestore
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

// Estado global de la sincronización
const syncState = {
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingChanges: false,
  lastSyncTime: null
};

// Evento para actualizar componentes cuando cambia el estado de sincronización
const syncEventTarget = new EventTarget();
const SYNC_STATE_CHANGE = 'syncStateChange';

// Guarda datos tanto en localStorage como en Firestore
export const saveData = async (key, data, userOptions = {}) => {
  const options = {
    firestore: true, // También guardar en Firestore?
    collection: 'userData', // Colección en Firestore
    mergeWithExisting: true, // Combinar con datos existentes o reemplazar
    showNotification: true, // Mostrar notificación de éxito/error
    ...userOptions
  };

  try {
    // 1. Siempre guardar en localStorage primero (funciona offline)
    localStorage.setItem(key, JSON.stringify(data));
    
    // 2. Intentar guardar en Firestore si está habilitado y hay usuario
    if (options.firestore) {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        syncState.isSyncing = true;
        syncState.pendingChanges = true;
        notifySyncStateChange();
        
        const docRef = doc(db, options.collection, user.uid);
        
        try {
          // Comprobar si el documento ya existe
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && options.mergeWithExisting) {
            // Actualizar el campo específico en el documento existente
            await updateDoc(docRef, { [key]: data });
          } else {
            // Crear nuevo documento con el campo
            await setDoc(docRef, { [key]: data }, { merge: options.mergeWithExisting });
          }
          
          syncState.pendingChanges = false;
          syncState.lastSyncTime = new Date().toISOString();
          
          if (options.showNotification) {
            showNotification('Datos guardados en la nube', 'success');
          }
        } catch (error) {
          console.error('Error al guardar en Firestore:', error);
          syncState.pendingChanges = true;
          
          if (options.showNotification) {
            showNotification('Los datos se guardaron localmente, pero no se pudieron sincronizar con la nube', 'warning');
          }
          
          // Añadir a la cola de sincronización pendiente
          addToPendingSyncQueue(key, data, options);
        }
      } else {
        // Usuario no autenticado, solo guardar localmente
        if (options.showNotification) {
          showNotification('Datos guardados localmente', 'info');
        }
        syncState.pendingChanges = true;
      }
      
      syncState.isSyncing = false;
      notifySyncStateChange();
    }
    
    return true;
  } catch (error) {
    console.error('Error al guardar datos:', error);
    
    if (options.showNotification) {
      showNotification('Error al guardar datos', 'error');
    }
    
    syncState.isSyncing = false;
    notifySyncStateChange();
    return false;
  }
};

// Carga datos con prioridad a Firestore si está online, sino de localStorage
export const loadData = async (key, userOptions = {}) => {
  const options = {
    firestore: true, // Intentar cargar de Firestore?
    collection: 'userData', // Colección en Firestore
    fallbackToLocal: true, // Si no se encuentra en Firestore, intentar localStorage
    ...userOptions
  };
  
  try {
    // 1. Intentar cargar de Firestore si está habilitado y hay usuario
    if (options.firestore && navigator.onLine) {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        syncState.isSyncing = true;
        notifySyncStateChange();
        
        try {
          const docRef = doc(db, options.collection, user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data()[key] !== undefined) {
            // Guardar también en localStorage para acceso offline futuro
            localStorage.setItem(key, JSON.stringify(docSnap.data()[key]));
            
            syncState.isSyncing = false;
            syncState.lastSyncTime = new Date().toISOString();
            notifySyncStateChange();
            
            return docSnap.data()[key];
          }
        } catch (error) {
          console.warn('Error al cargar de Firestore, intentando localStorage:', error);
        }
      }
    }
    
    // 2. Intentar cargar de localStorage como respaldo
    if (options.fallbackToLocal) {
      const localData = localStorage.getItem(key);
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);
          
          syncState.isSyncing = false;
          notifySyncStateChange();
          
          return parsedData;
        } catch (e) {
          console.error('Error al analizar datos de localStorage:', e);
        }
      }
    }
    
    syncState.isSyncing = false;
    notifySyncStateChange();
    return null;
  } catch (error) {
    console.error('Error al cargar datos:', error);
    syncState.isSyncing = false;
    notifySyncStateChange();
    return null;
  }
};

// Sincroniza todos los datos pendientes cuando hay conexión
export const syncPendingData = async () => {
  if (!navigator.onLine) return false;
  
  const pendingSyncQueue = JSON.parse(localStorage.getItem('pendingSyncQueue') || '[]');
  
  if (pendingSyncQueue.length === 0) return true;
  
  syncState.isSyncing = true;
  notifySyncStateChange();
  
  let success = true;
  
  for (const item of pendingSyncQueue) {
    try {
      await saveData(item.key, item.data, {
        ...item.options,
        showNotification: false // No mostrar notificación para cada item
      });
    } catch (error) {
      console.error('Error al sincronizar item pendiente:', error);
      success = false;
    }
  }
  
  if (success) {
    localStorage.removeItem('pendingSyncQueue');
    syncState.pendingChanges = false;
    showNotification('Todos los cambios se han sincronizado con éxito', 'success');
  }
  
  syncState.isSyncing = false;
  syncState.lastSyncTime = new Date().toISOString();
  notifySyncStateChange();
  
  return success;
};

// Añade un item a la cola de sincronización pendiente
const addToPendingSyncQueue = (key, data, options) => {
  const pendingSyncQueue = JSON.parse(localStorage.getItem('pendingSyncQueue') || '[]');
  
  // Evitar duplicados (reemplazar si existe)
  const index = pendingSyncQueue.findIndex(item => item.key === key);
  
  if (index >= 0) {
    pendingSyncQueue[index] = { key, data, options };
  } else {
    pendingSyncQueue.push({ key, data, options });
  }
  
  localStorage.setItem('pendingSyncQueue', JSON.stringify(pendingSyncQueue));
};

// Función simple para mostrar notificaciones (sustituir por tu sistema de notificaciones)
const showNotification = (message, type = 'info') => {
  if (typeof window.toast === 'function') {
    window.toast[type](message);
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
};

// Registra los listeners de cambios de conexión
export const setupSyncListeners = () => {
  window.addEventListener('online', () => {
    syncState.isOnline = true;
    notifySyncStateChange();
    syncPendingData(); // Intentar sincronizar automáticamente
  });
  
  window.addEventListener('offline', () => {
    syncState.isOnline = false;
    notifySyncStateChange();
  });
};

// Suscribe un componente a cambios en el estado de sincronización
export const subscribeSyncState = (callback) => {
  const handler = () => callback(getSyncState());
  syncEventTarget.addEventListener(SYNC_STATE_CHANGE, handler);
  return () => syncEventTarget.removeEventListener(SYNC_STATE_CHANGE, handler);
};

// Notifica a los suscriptores sobre cambios en el estado
const notifySyncStateChange = () => {
  syncEventTarget.dispatchEvent(new CustomEvent(SYNC_STATE_CHANGE));
};

// Obtiene el estado actual de sincronización
export const getSyncState = () => ({ ...syncState });

// Inicializa el servicio
setupSyncListeners();
