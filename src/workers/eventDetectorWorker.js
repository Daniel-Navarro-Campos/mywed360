/**
 * Web Worker para detectar eventos en emails largos sin bloquear la UI
 * Este worker analiza el contenido de un email buscando fechas, horas y ubicaciones
 * y envía los eventos detectados de vuelta al hilo principal
 */

// Meses en español para la detección de fechas
const months = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
  'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
};

/**
 * Analiza un fragmento de texto en busca de eventos
 * @param {string} text - Fragmento de texto a analizar
 * @param {string} subject - Asunto del email
 * @param {number} startIndex - Índice inicial del fragmento en el texto completo
 * @param {number} chunkId - Identificador del fragmento
 * @return {Array} - Array de eventos detectados
 */
function detectEventsInChunk(text, subject, startIndex, chunkId) {
  if (!text) return [];
  
  try {
    const events = [];
    
    // Expresiones regulares para detectar fechas en formato español
    const datePatterns = [
      // DD/MM/YYYY o DD-MM-YYYY
      {
        regex: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
        parse: (match) => {
          const [_, day, month, year] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      },
      // DD de Mes de YYYY
      {
        regex: /(\d{1,2}) de ([a-zñáéíóú]+)( de (\d{4}))?/gi,
        parse: (match) => {
          const day = parseInt(match[1]);
          const monthName = match[2].toLowerCase();
          const month = months[monthName];
          const year = match[4] ? parseInt(match[4]) : new Date().getFullYear();
          
          if (month !== undefined) {
            return new Date(year, month, day);
          }
          return null;
        }
      }
    ];
    
    // Expresión regular para detectar horas
    const timeRegex = /(\d{1,2}):(\d{2})( ?(?:AM|PM|a\.m\.|p\.m\.))?/gi;
    
    // Expresiones para detectar ubicaciones
    const locationPrefixes = [
      'en ', 'en el ', 'en la ', 'en los ', 'en las ',
      'lugar: ', 'ubicación: ', 'dirección: ', 'localización: '
    ];
    
    // Buscar frases con potenciales ubicaciones
    const locationMatches = [];
    for (const prefix of locationPrefixes) {
      const regex = new RegExp(`${prefix}([^\\.,\\n]{3,50})`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        locationMatches.push({
          text: match[1].trim(),
          index: match.index + startIndex
        });
      }
    }
    
    // Extraer fechas
    for (const pattern of datePatterns) {
      let match;
      const regex = new RegExp(pattern.regex);
      while ((match = regex.exec(text)) !== null) {
        const date = pattern.parse(match);
        if (date && !isNaN(date)) {
          // Calcular el índice real en el texto completo
          const realIndex = match.index + startIndex;
          
          // Buscar horas cercanas (dentro de 100 caracteres)
          const surroundingText = text.substring(
            Math.max(0, match.index - 100),
            Math.min(text.length, match.index + match[0].length + 100)
          );
          
          let timeMatch;
          const timeMatches = [];
          const timeRegexLocal = new RegExp(timeRegex);
          while ((timeMatch = timeRegexLocal.exec(surroundingText)) !== null) {
            const hour = parseInt(timeMatch[1]);
            const minute = parseInt(timeMatch[2]);
            const period = timeMatch[3] ? timeMatch[3].trim().toLowerCase() : null;
            
            // Ajustar hora para formato 24h si es necesario
            let adjustedHour = hour;
            if (period) {
              if ((period === 'pm' || period === 'p.m.') && hour < 12) {
                adjustedHour = hour + 12;
              } else if ((period === 'am' || period === 'a.m.') && hour === 12) {
                adjustedHour = 0;
              }
            }
            
            const eventDate = new Date(date);
            eventDate.setHours(adjustedHour, minute, 0, 0);
            
            timeMatches.push(eventDate);
          }
          
          // Si no hay hora específica, usar 9:00 AM como hora predeterminada
          if (timeMatches.length === 0) {
            const defaultDate = new Date(date);
            defaultDate.setHours(9, 0, 0, 0);
            timeMatches.push(defaultDate);
          }
          
          // Buscar posible ubicación en contexto cercano
          let eventLocation = '';
          for (const loc of locationMatches) {
            if (Math.abs(loc.index - realIndex) < 200) {
              eventLocation = loc.text;
              break;
            }
          }
          
          // Crear eventos para cada combinación de fecha y hora encontrada
          for (const eventTime of timeMatches) {
            // Generar un título tentativo basado en el asunto del email
            // o usando patrones comunes en el texto cercano
            let title = subject || 'Evento detectado';
            
            // Buscar palabras clave que suelen preceder a títulos de eventos
            const titleKeywords = ['reunión', 'cita', 'evento', 'meeting', 'reserva'];
            for (const keyword of titleKeywords) {
              const keywordRegex = new RegExp(`${keyword}[\\s:]+([^\\.,\\n]{3,50})`, 'i');
              const titleMatch = text.match(keywordRegex);
              if (titleMatch) {
                title = titleMatch[1].trim();
                break;
              }
            }
            
            events.push({
              title,
              date: eventTime.toISOString(), // Convertir a ISO para serialización
              location: eventLocation,
              sourceText: match[0],
              context: surroundingText,
              chunkId
            });
          }
        }
      }
    }
    
    return events;
    
  } catch (error) {
    // Enviar error al hilo principal
    self.postMessage({
      type: 'error',
      error: error.message,
      chunkId
    });
    return [];
  }
}

// Escuchar mensajes del hilo principal
self.addEventListener('message', (e) => {
  const { text, subject, chunkSize, chunkId, startIndex } = e.data;
  
  // Detectar eventos en este chunk
  const events = detectEventsInChunk(text, subject, startIndex, chunkId);
  
  // Enviar resultados al hilo principal
  self.postMessage({
    type: 'result',
    events,
    chunkId,
    isDone: true
  });
});
