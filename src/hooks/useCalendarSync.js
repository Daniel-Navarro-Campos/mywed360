import { useState, useEffect } from 'react';
import { googleCalendarService } from '../services/GoogleCalendarService';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './useAuthUnified';

/**
 * Hook personalizado para gestionar la sincronización bidireccional con Google Calendar
 * @returns {Object} - Objeto con métodos y estado de sincronización
 */
export const useCalendarSync = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncedCalendars, setSyncedCalendars] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  // Cargar el estado de sincronización del usuario
  useEffect(() => {
    const loadSyncStatus = async () => {
      if (!user?.uid) return;

      try {
        const userSyncRef = doc(db, 'calendarSync', user.uid);
        const syncDoc = await getDoc(userSyncRef);
        
        if (syncDoc.exists()) {
          const syncData = syncDoc.data();
          setSyncedCalendars(syncData.syncedCalendars || []);
          setLastSync(syncData.lastSync ? new Date(syncData.lastSync) : null);
        }
      } catch (err) {
        console.error('Error al cargar estado de sincronización:', err);
        setError('Error al cargar configuración de sincronización');
      }
    };

    loadSyncStatus();
  }, [currentUser]);

  // Inicializar Google Calendar API
  useEffect(() => {
    const initGoogleCalendar = async () => {
      try {
        await googleCalendarService.loadClient();
        setIsAuthenticated(googleCalendarService.isAuthenticated());
      } catch (err) {
        console.error('Error al inicializar Google Calendar:', err);
        setError('Error al inicializar la conexión con Google Calendar');
      }
    };

    initGoogleCalendar();
  }, []);

  /**
   * Autenticarse con Google Calendar
   */
  const authenticate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await googleCalendarService.signIn();
      setIsAuthenticated(googleCalendarService.isAuthenticated());
    } catch (err) {
      console.error('Error de autenticación con Google Calendar:', err);
      setError('Error al iniciar sesión con Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cerrar sesión de Google Calendar
   */
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await googleCalendarService.signOut();
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Error al cerrar sesión de Google Calendar:', err);
      setError('Error al cerrar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Obtiene los calendarios disponibles del usuario en Google Calendar
   * @returns {Promise<Array>} - Lista de calendarios
   */
  const getAvailableCalendars = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const calendars = await googleCalendarService.getCalendars();
      setIsLoading(false);
      return calendars;
    } catch (err) {
      console.error('Error al obtener calendarios:', err);
      setError('Error al obtener tus calendarios de Google');
      setIsLoading(false);
      return [];
    }
  };

  /**
   * Guarda la configuración de sincronización del usuario
   * @param {Array} calendars - Calendarios seleccionados para sincronizar
   */
  const saveCalendarSyncConfig = async (calendars) => {
    if (!user?.uid) {
      setError('Debes iniciar sesión para sincronizar calendarios');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userSyncRef = doc(db, 'calendarSync', user.uid);
      await setDoc(userSyncRef, {
        syncedCalendars: calendars,
        lastSync: new Date().toISOString(),
        userId: user.uid
      }, { merge: true });
      
      setSyncedCalendars(calendars);
      setLastSync(new Date());
    } catch (err) {
      console.error('Error al guardar configuración de sincronización:', err);
      setError('Error al guardar configuración de sincronización');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Importa eventos de Google Calendar a Lovenda
   * @param {string} calendarId - ID del calendario a importar
   * @returns {Promise<Array>} - Lista de eventos importados
   */
  const importEventsFromGoogle = async (calendarId = 'primary') => {
    if (!user?.uid) {
      setError('Debes iniciar sesión para sincronizar eventos');
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Obtener eventos de Google Calendar
      const googleEvents = await googleCalendarService.getEvents(calendarId);
      
      // Transformar a formato Lovenda y guardar en Firestore
      const eventsRef = collection(db, 'tasks');
      const importedEvents = [];
      
      for (const googleEvent of googleEvents) {
        const lovendaEvent = googleCalendarService.transformToLovendaEvent(googleEvent);
        lovendaEvent.userId = user.uid;
        lovendaEvent.synced = true;
        lovendaEvent.source = 'google';
        
        // Verificar si ya existe por googleEventId
        const existingQuery = query(eventsRef, 
          where('userId', '==', user.uid),
          where('googleEventId', '==', googleEvent.id)
        );
        
        const existingEvents = await getDocs(existingQuery);
        
        if (existingEvents.empty) {
          // Nuevo evento - crear
          await setDoc(doc(eventsRef), lovendaEvent);
        } else {
          // Evento existente - actualizar
          const existingEvent = existingEvents.docs[0];
          await updateDoc(existingEvent.ref, lovendaEvent);
        }
        
        importedEvents.push(lovendaEvent);
      }
      
      // Actualizar fecha de última sincronización
      const userSyncRef = doc(db, 'calendarSync', user.uid);
      await updateDoc(userSyncRef, {
        lastSync: new Date().toISOString()
      });
      
      setLastSync(new Date());
      setIsLoading(false);
      return importedEvents;
    } catch (err) {
      console.error('Error al importar eventos de Google Calendar:', err);
      setError('Error al importar eventos de Google Calendar');
      setIsLoading(false);
      return [];
    }
  };

  /**
   * Exporta eventos de Lovenda a Google Calendar
   * @param {Array} events - Eventos a exportar
   * @param {string} calendarId - ID del calendario destino
   * @returns {Promise<Array>} - Lista de eventos exportados
   */
  const exportEventsToGoogle = async (events, calendarId = 'primary') => {
    if (!user?.uid) {
      setError('Debes iniciar sesión para sincronizar eventos');
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const exportedEvents = [];
      const eventsRef = collection(db, 'tasks');
      
      for (const event of events) {
        // Si el evento ya tiene ID de Google, actualizar
        if (event.googleEventId) {
          const updatedEvent = await googleCalendarService.updateEvent(event, calendarId);
          exportedEvents.push(updatedEvent);
        } else {
          // Si no tiene ID de Google, crear nuevo
          const newGoogleEvent = await googleCalendarService.createEvent(event, calendarId);
          
          // Guardar ID de Google en Firestore
          if (event.id) {
            const eventDoc = doc(eventsRef, event.id);
            await updateDoc(eventDoc, {
              googleEventId: newGoogleEvent.id,
              synced: true
            });
          }
          
          exportedEvents.push(newGoogleEvent);
        }
      }
      
      // Actualizar fecha de última sincronización
      const userSyncRef = doc(db, 'calendarSync', user.uid);
      await updateDoc(userSyncRef, {
        lastSync: new Date().toISOString()
      });
      
      setLastSync(new Date());
      setIsLoading(false);
      return exportedEvents;
    } catch (err) {
      console.error('Error al exportar eventos a Google Calendar:', err);
      setError('Error al exportar eventos a Google Calendar');
      setIsLoading(false);
      return [];
    }
  };

  /**
   * Sincroniza eventos bidireccionales entre Lovenda y Google Calendar
   * @param {string} calendarId - ID del calendario a sincronizar
   * @returns {Promise<Object>} - Resultado de la sincronización
   */
  const syncBidirectional = async (calendarId = 'primary') => {
    if (!user?.uid) {
      setError('Debes iniciar sesión para sincronizar eventos');
      return { imported: [], exported: [] };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Importar eventos de Google Calendar
      const googleEvents = await googleCalendarService.getEvents(calendarId);
      const importedEvents = [];
      
      // 2. Obtener eventos de Lovenda
      const eventsRef = collection(db, 'tasks');
      const lovendaEventsQuery = query(eventsRef, where('userId', '==', user.uid));
      const lovendaEventsSnapshot = await getDocs(lovendaEventsQuery);
      const lovendaEvents = lovendaEventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 3. Procesamiento de eventos de Google
      for (const googleEvent of googleEvents) {
        const lovendaEvent = googleCalendarService.transformToLovendaEvent(googleEvent);
        lovendaEvent.userId = user.uid;
        lovendaEvent.synced = true;
        lovendaEvent.source = 'google';
        
        // Buscar si ya existe este evento por googleEventId
        const existingEventIdx = lovendaEvents.findIndex(e => 
          e.googleEventId === googleEvent.id
        );
        
        if (existingEventIdx === -1) {
          // Nuevo evento de Google - crear en Lovenda
          await setDoc(doc(eventsRef), lovendaEvent);
          importedEvents.push(lovendaEvent);
        } else {
          // Evento existente - verificar fecha de modificación para decidir qué versión prevalece
          const existingEvent = lovendaEvents[existingEventIdx];
          
          // Si la versión de Google es más reciente, actualizar en Lovenda
          if (new Date(googleEvent.updated) > new Date(existingEvent.lastUpdated || 0)) {
            await updateDoc(doc(eventsRef, existingEvent.id), lovendaEvent);
            importedEvents.push(lovendaEvent);
          }
          
          // Quitar de la lista para exportación
          lovendaEvents.splice(existingEventIdx, 1);
        }
      }
      
      // 4. Exportar eventos de Lovenda que no vienen de Google o no están sincronizados
      const eventsToExport = lovendaEvents.filter(e => 
        !e.source || e.source !== 'google' || !e.synced
      );
      
      const exportedEvents = await exportEventsToGoogle(eventsToExport, calendarId);
      
      // 5. Actualizar fecha de última sincronización
      const userSyncRef = doc(db, 'calendarSync', user.uid);
      await updateDoc(userSyncRef, {
        lastSync: new Date().toISOString()
      });
      
      setLastSync(new Date());
      setIsLoading(false);
      
      return {
        imported: importedEvents,
        exported: exportedEvents
      };
    } catch (err) {
      console.error('Error en sincronización bidireccional:', err);
      setError('Error al sincronizar eventos');
      setIsLoading(false);
      return { imported: [], exported: [] };
    }
  };

  return {
    isLoading,
    isAuthenticated,
    syncedCalendars,
    lastSync,
    error,
    authenticate,
    logout,
    getAvailableCalendars,
    saveCalendarSyncConfig,
    importEventsFromGoogle,
    exportEventsToGoogle,
    syncBidirectional
  };
};
