// Servicio de integración con Google Calendar API
// Basado en OAuth 2.0 y la API oficial de Google Calendar

// Configuración del cliente de Google API
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

/**
 * Clase para manejar la integración con Google Calendar
 */
class GoogleCalendarService {
  constructor() {
    this.isLoaded = false;
    this.isInitialized = false;
    this.isSignedIn = false;
    this.authInstance = null;
  }

  /**
   * Carga la biblioteca del cliente de Google API
   * @returns {Promise} - Promesa que se resuelve cuando la biblioteca está cargada
   */
  loadClient() {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        this.isLoaded = true;
        this.loadGapiClient().then(resolve).catch(reject);
      };
      script.onerror = (error) => reject(new Error('Error al cargar la API de Google: ' + error));
      document.body.appendChild(script);
    });
  }

  /**
   * Carga el cliente GAPI y lo inicializa
   */
  loadGapiClient() {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      window.gapi.load('client:auth2', () => {
        window.gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES
        }).then(() => {
          this.authInstance = window.gapi.auth2.getAuthInstance();
          this.isSignedIn = this.authInstance.isSignedIn.get();
          this.isInitialized = true;
          
          // Listener para cambios en el estado de autenticación
          this.authInstance.isSignedIn.listen((isSignedIn) => {
            this.isSignedIn = isSignedIn;
          });
          
          resolve();
        }).catch((error) => {
          reject(new Error('Error al inicializar el cliente GAPI: ' + error));
        });
      });
    });
  }

  /**
   * Inicia sesión con Google
   */
  signIn() {
    if (!this.isInitialized) {
      return this.loadClient().then(() => this.authInstance.signIn());
    }
    return this.authInstance.signIn();
  }

  /**
   * Cierra sesión con Google
   */
  signOut() {
    if (this.isInitialized) {
      return this.authInstance.signOut();
    }
    return Promise.resolve();
  }

  /**
   * Verifica si el usuario ha iniciado sesión
   * @returns {boolean} - true si el usuario ha iniciado sesión
   */
  isAuthenticated() {
    return this.isSignedIn;
  }

  /**
   * Obtiene los calendarios del usuario
   * @returns {Promise} - Promesa con los calendarios
   */
  async getCalendars() {
    if (!this.isSignedIn) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const response = await window.gapi.client.calendar.calendarList.list();
      return response.result.items;
    } catch (error) {
      console.error('Error al obtener calendarios:', error);
      throw error;
    }
  }

  /**
   * Obtiene eventos de un calendario específico
   * @param {string} calendarId - ID del calendario (default: 'primary')
   * @param {Date} timeMin - Fecha de inicio
   * @param {Date} timeMax - Fecha de fin
   * @returns {Promise} - Promesa con los eventos
   */
  async getEvents(calendarId = 'primary', timeMin = new Date(), timeMax = null) {
    if (!this.isSignedIn) {
      throw new Error('Usuario no autenticado');
    }

    if (!timeMax) {
      // Si no se especifica timeMax, usar fecha actual + 3 meses
      timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 3);
    }

    try {
      const response = await window.gapi.client.calendar.events.list({
        'calendarId': calendarId,
        'timeMin': timeMin.toISOString(),
        'timeMax': timeMax.toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'orderBy': 'startTime'
      });

      return response.result.items;
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      throw error;
    }
  }

  /**
   * Crea un evento en Google Calendar
   * @param {Object} event - Datos del evento
   * @param {string} calendarId - ID del calendario (default: 'primary')
   * @returns {Promise} - Promesa con el evento creado
   */
  async createEvent(event, calendarId = 'primary') {
    if (!this.isSignedIn) {
      throw new Error('Usuario no autenticado');
    }

    const googleEvent = this.transformToGoogleEvent(event);

    try {
      const response = await window.gapi.client.calendar.events.insert({
        'calendarId': calendarId,
        'resource': googleEvent
      });

      return response.result;
    } catch (error) {
      console.error('Error al crear evento:', error);
      throw error;
    }
  }

  /**
   * Actualiza un evento en Google Calendar
   * @param {Object} event - Datos del evento
   * @param {string} calendarId - ID del calendario (default: 'primary')
   * @returns {Promise} - Promesa con el evento actualizado
   */
  async updateEvent(event, calendarId = 'primary') {
    if (!this.isSignedIn) {
      throw new Error('Usuario no autenticado');
    }

    if (!event.googleEventId) {
      throw new Error('El evento no tiene ID de Google Calendar');
    }

    const googleEvent = this.transformToGoogleEvent(event);

    try {
      const response = await window.gapi.client.calendar.events.update({
        'calendarId': calendarId,
        'eventId': event.googleEventId,
        'resource': googleEvent
      });

      return response.result;
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      throw error;
    }
  }

  /**
   * Elimina un evento de Google Calendar
   * @param {string} eventId - ID del evento en Google Calendar
   * @param {string} calendarId - ID del calendario (default: 'primary')
   * @returns {Promise} - Promesa que se resuelve cuando se elimina el evento
   */
  async deleteEvent(eventId, calendarId = 'primary') {
    if (!this.isSignedIn) {
      throw new Error('Usuario no autenticado');
    }

    try {
      await window.gapi.client.calendar.events.delete({
        'calendarId': calendarId,
        'eventId': eventId
      });

      return true;
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      throw error;
    }
  }

  /**
   * Transforma un evento de Lovenda a formato de Google Calendar
   * @param {Object} event - Evento de Lovenda
   * @returns {Object} - Evento en formato Google Calendar
   */
  transformToGoogleEvent(event) {
    const googleEvent = {
      'summary': event.title || event.name,
      'description': event.desc || event.description || '',
      'start': {
        'dateTime': event.start.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      'end': {
        'dateTime': event.end.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    // Si hay ubicación
    if (event.location) {
      googleEvent.location = event.location;
    }

    // Si tiene color específico (mapear categorías de Lovenda a colores de Google)
    if (event.category) {
      const colorMap = {
        'LUGAR': '11', // Rojo
        'INVITADOS': '6', // Naranja
        'COMIDA': '5', // Amarillo
        'DECORACION': '10', // Verde
        'PAPELERIA': '7', // Cian
        'MUSICA': '9', // Azul
        'FOTOGRAFO': '3', // Púrpura
        'VESTUARIO': '4', // Rosa
        'OTROS': '8', // Gris
      };
      googleEvent.colorId = colorMap[event.category] || '1';
    }

    return googleEvent;
  }

  /**
   * Transforma un evento de Google Calendar a formato Lovenda
   * @param {Object} googleEvent - Evento de Google Calendar
   * @returns {Object} - Evento en formato Lovenda
   */
  transformToLovendaEvent(googleEvent) {
    const start = new Date(googleEvent.start.dateTime || googleEvent.start.date);
    const end = new Date(googleEvent.end.dateTime || googleEvent.end.date);

    const lovendaEvent = {
      id: Math.random().toString(36).substring(2, 9), // ID temporal
      title: googleEvent.summary,
      desc: googleEvent.description || '',
      start,
      end,
      googleEventId: googleEvent.id, // Guardar ID de Google para futuras actualizaciones
    };

    // Mapear color de Google a categoría de Lovenda
    if (googleEvent.colorId) {
      const categoryMap = {
        '11': 'LUGAR',
        '6': 'INVITADOS',
        '5': 'COMIDA',
        '10': 'DECORACION',
        '7': 'PAPELERIA',
        '9': 'MUSICA',
        '3': 'FOTOGRAFO',
        '4': 'VESTUARIO',
        '8': 'OTROS',
      };
      lovendaEvent.category = categoryMap[googleEvent.colorId] || 'OTROS';
    } else {
      lovendaEvent.category = 'OTROS';
    }

    // Si hay ubicación
    if (googleEvent.location) {
      lovendaEvent.location = googleEvent.location;
    }

    return lovendaEvent;
  }
}

// Exportar singleton
export const googleCalendarService = new GoogleCalendarService();
