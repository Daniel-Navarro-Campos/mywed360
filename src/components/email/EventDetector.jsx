import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import useEventCache from '../../hooks/useEventCache';

/**
 * Componente que analiza el contenido de un email en busca de posibles eventos
 * (fechas, horas, ubicaciones) y permite al usuario añadirlos al calendario
 * con un solo clic.
 * 
 * @component
 * @example
 * ```jsx
 * <EventDetector
 *   emailContent={email.body}
 *   emailSubject={email.subject}
 *   onEventDetected={(eventData) => addToCalendar(eventData)}
 * />
 * ```
 */
function EventDetector({ emailContent, emailSubject, onEventDetected }) {
  const [detectedEvents, setDetectedEvents] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const workerRef = useRef();
  const chunksProcessed = useRef(0);
  const totalChunks = useRef(0);
  
  // Usar cache para eventos ya detectados
  const { getCachedEvents, cacheEvents } = useEventCache();
  
  /**
   * Inicializa un nuevo web worker para la detección de eventos
   * @returns {Worker} Instancia del worker
   */
  const initWorker = useCallback(() => {
    // Terminar el worker anterior si existe
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    
    // Crear un nuevo worker
    const worker = new Worker(new URL('../../workers/eventDetectorWorker.js', import.meta.url));
    
    // Manejar mensajes del worker
    worker.onmessage = (e) => {
      const { type, events, chunkId, isDone, error } = e.data;
      
      if (type === 'error') {
        console.error('Error en worker:', error);
      } else if (type === 'result') {
        // Procesar eventos detectados
        if (events && events.length > 0) {
          // Convertir las fechas de formato ISO a objetos Date
          const processedEvents = events.map(event => ({
            ...event,
            date: new Date(event.date)
          }));
          
          // Añadir a los eventos detectados
          setDetectedEvents(prev => [...prev, ...processedEvents]);
        }
        
        // Actualizar progreso
        chunksProcessed.current += 1;
        const newProgress = Math.round((chunksProcessed.current / totalChunks.current) * 100);
        setProgress(newProgress);
        
        // Comprobar si se han procesado todos los chunks
        if (chunksProcessed.current >= totalChunks.current) {
          setIsAnalyzing(false);
          
          // Guardar eventos en caché
          if (emailContent) {
            const contentHash = btoa(emailContent.substring(0, 100)); // Usar inicio del contenido como clave
            cacheEvents(contentHash, detectedEvents);
          }
        }
      }
    };
    
    workerRef.current = worker;
    return worker;
  }, [cacheEvents]);
  
  /**
   * Divide el texto en chunks y los envía al worker para procesamiento
   * @param {string} text - Texto completo a analizar
   * @param {string} subject - Asunto del email
   */
  const detectPotentialEvents = useCallback((text, subject) => {
    if (!text) {
      setDetectedEvents([]);
      setIsAnalyzing(false);
      return;
    }
    
    // Comprobar caché primero
    const contentHash = btoa(text.substring(0, 100));
    const cachedEvents = getCachedEvents(contentHash);
    
    if (cachedEvents && cachedEvents.length > 0) {
      console.log('Usando eventos en caché');
      setDetectedEvents(cachedEvents);
      return;
    }
    
    setIsAnalyzing(true);
    setDetectedEvents([]);
    setProgress(0);
    chunksProcessed.current = 0;
    
    try {
      // Inicializar worker
      const worker = initWorker();
      
      // Dividir el texto en chunks de aproximadamente 1000 caracteres
      // pero respetando los límites de palabras
      const chunkSize = 1000;
      const chunks = [];
      let startIndex = 0;
      
      while (startIndex < text.length) {
        let endIndex = Math.min(startIndex + chunkSize, text.length);
        
        // Ajustar para no cortar palabras
        if (endIndex < text.length) {
          // Buscar el próximo espacio en blanco
          while (endIndex > startIndex && text[endIndex] !== ' ' && text[endIndex] !== '\n') {
            endIndex--;
          }
          
          // Si no encontramos un buen punto de corte, usar el límite original
          if (endIndex === startIndex) {
            endIndex = Math.min(startIndex + chunkSize, text.length);
          }
        }
        
        chunks.push({
          text: text.substring(startIndex, endIndex),
          start: startIndex
        });
        
        startIndex = endIndex;
      }
      
      // Establecer el número total de chunks
      totalChunks.current = chunks.length;
      
      // Procesar cada chunk con el worker
      chunks.forEach((chunk, index) => {
        worker.postMessage({
          text: chunk.text,
          subject,
          chunkId: index,
          startIndex: chunk.start,
          chunkSize
        });
      });
      
    } catch (error) {
      console.error('Error al detectar eventos:', error);
      setIsAnalyzing(false);
      setProgress(0);
    }
  }, [getCachedEvents, cacheEvents, initWorker]);

  // Analizar el contenido del email cuando cambie
  useEffect(() => {
    if (emailContent) {
      detectPotentialEvents(emailContent, emailSubject);
    } else {
      setDetectedEvents([]);
    }
    
    // Cleanup: terminar worker cuando se desmonte el componente
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [emailContent, emailSubject, detectPotentialEvents]);
  
  // Filtrar eventos que ya pasaron y eliminar duplicados
  const validEvents = useMemo(() => {
    const now = new Date();
    
    // Filtrar eventos futuros
    const futureEvents = detectedEvents.filter(event => event.date > now);
    
    // Eliminar duplicados (mismo título, fecha y ubicación)
    const uniqueEvents = [];
    const eventMap = new Map();
    
    futureEvents.forEach(event => {
      const key = `${event.date.toISOString()}_${event.location}_${event.title}`;
      if (!eventMap.has(key)) {
        eventMap.set(key, event);
        uniqueEvents.push(event);
      }
    });
    
    return uniqueEvents;
  }, [detectedEvents]);
  
  // No renderizar nada si no hay eventos detectados o está analizando
  if ((validEvents.length === 0 && !isAnalyzing) || !emailContent) {
    return null;
  }

  return (
    <div className="mt-4 border-t pt-3">
      <h4 className="text-sm font-medium text-gray-700 mb-2">
        {isAnalyzing ? 'Analizando posibles eventos...' : 'Eventos detectados'}
      </h4>
      
      {isAnalyzing ? (
        <div className="text-sm text-gray-500">
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
            Analizando contenido...
          </div>
          
          {progress > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs mt-1 text-right">{progress}% completado</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {validEvents.map((event, index) => (
            <div 
              key={index} 
              className="p-3 bg-indigo-50 border border-indigo-100 rounded-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium">{event.title}</div>
                  <div className="text-xs text-gray-500">
                    {format(event.date, 'EEEE, d MMMM yyyy', { locale: es })} · {format(event.date, 'HH:mm')}
                  </div>
                  {event.location && (
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Ubicación:</span> {event.location}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onEventDetected(event)}
                  className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs rounded-md transition"
                  aria-label="Añadir al calendario"
                >
                  Añadir al calendario
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

EventDetector.propTypes = {
  /** Contenido del email donde buscar eventos */
  emailContent: PropTypes.string.isRequired,
  /** Asunto del email para generar títulos de eventos */
  emailSubject: PropTypes.string,
  /** Función a llamar cuando el usuario quiere añadir un evento detectado */
  onEventDetected: PropTypes.func.isRequired
};

export default EventDetector;
