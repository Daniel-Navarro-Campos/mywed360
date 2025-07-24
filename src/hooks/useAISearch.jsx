import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * @typedef {Object} AISearchResult
 * @property {string} id - ID único del resultado
 * @property {string} name - Nombre del proveedor
 * @property {string} service - Tipo de servicio
 * @property {string} snippet - Descripción corta del proveedor
 * @property {string} [image] - URL de la imagen
 * @property {string} location - Ubicación geográfica
 * @property {string} price - Rango de precio
 * @property {string[]} tags - Etiquetas relacionadas
 * @property {string[]} keywords - Palabras clave para búsqueda
 * @property {number} match - Porcentaje de coincidencia con la búsqueda (0-100)
 * @property {string} aiSummary - Resumen generado por IA
 */

/**
 * Hook personalizado para gestionar la búsqueda con IA de proveedores.
 * Proporciona funcionalidades para realizar búsquedas inteligentes de proveedores
 * utilizando técnicas de procesamiento de lenguaje natural y coincidencia semántica.
 * 
 * En una implementación real, este hook se conectaría con un servicio de IA como OpenAI
 * para realizar búsquedas más avanzadas y personalizadas. Actualmente simula resultados
 * para propósitos de demostración.
 * 
 * @returns {Object} Objeto con estados y funciones para realizar búsquedas con IA
 * @property {AISearchResult[]} results - Resultados de la última búsqueda
 * @property {boolean} loading - Indica si hay una búsqueda en curso
 * @property {string|null} error - Mensaje de error si existe
 * @property {string} lastQuery - Última consulta realizada
 * @property {Function} searchProviders - Realiza una búsqueda de proveedores
 * @property {Function} clearResults - Limpia los resultados de búsqueda
 */
export const useAISearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState('');
  const { user } = useAuth();

  /**
   * Función para realizar una búsqueda con IA
   */
  const searchProviders = useCallback(async (query) => {
    if (!query.trim() || !user) {
      return [];
    }

    setLoading(true);
    setLastQuery(query);
    setError(null);

    try {
      // Simular una llamada a una API de IA
      // En una implementación real, esto sería una llamada a una API como OpenAI
      // Ejemplo:
      // const response = await fetch('/api/ai-search', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ query, userId: user.uid })
      // });
      // const data = await response.json();
      
      // Para demostración, generamos resultados de ejemplo basados en la consulta
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular tiempo de espera
      
      const demoResults = generateDemoResults(query);
      setResults(demoResults);
      setLoading(false);
      return demoResults;
    } catch (err) {
      console.error('Error en la búsqueda con IA:', err);
      setError('No se pudo completar la búsqueda. Inténtalo de nuevo más tarde.');
      setLoading(false);
      return [];
    }
  }, [user]);

  /**
   * Función auxiliar para generar resultados de ejemplo basados en la consulta
   */
  const generateDemoResults = (query) => {
    const queryLower = query.toLowerCase();
    
    // Base de datos de ejemplo para demostración
    const demoDatabase = [
      {
        id: '1',
        name: 'Fotografía Naturaleza Viva',
        service: 'Fotografía',
        snippet: 'Estudio especializado en fotografía de bodas con estilo natural y documental. Captamos los momentos más emotivos y espontáneos de tu boda.',
        image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fHdlZGRpbmclMjBwaG90b2dyYXBoeXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
        location: 'Madrid',
        price: '1200€ - 2500€',
        tags: ['natural', 'documental', 'exterior', 'luz natural', 'momentos espontáneos', 'estilo periodístico'],
        keywords: ['fotografo', 'natural', 'documental', 'boda', 'exterior', 'espontáneo']
      },
      {
        id: '2',
        name: 'Lente Azul Fotografía',
        service: 'Fotografía',
        snippet: 'Más de 10 años de experiencia en fotografía de bodas en playa y espacios naturales. Ofrecemos paquetes personalizados para cada pareja.',
        image: 'https://images.unsplash.com/photo-1508435234994-67cfd7690508?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Nnx8d2VkZGluZyUyMHBob3RvZ3JhcGh5fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
        location: 'Barcelona',
        price: '1500€ - 3000€',
        tags: ['playa', 'exterior', 'naturaleza', 'experiencia', 'personalizado'],
        keywords: ['fotografo', 'boda', 'playa', 'exterior', 'experiencia']
      },
      {
        id: '3',
        name: 'Catering Delicious Moments',
        service: 'Catering',
        snippet: 'Servicio de catering exclusivo con opciones vegetarianas, veganas y para todo tipo de dietas. Especialistas en eventos de 50 a 200 personas.',
        image: 'https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8Y2F0ZXJpbmd8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
        location: 'Madrid',
        price: '70€ - 120€ por persona',
        tags: ['vegetariano', 'vegano', 'opciones dietéticas', 'buffet', 'servicio personalizado'],
        keywords: ['catering', 'vegetariano', 'vegano', 'buffet', 'comida', 'evento', 'grupo grande', 'alimentación']
      },
      {
        id: '4',
        name: 'DJ Sounds & Lights',
        service: 'Música',
        snippet: 'DJ con amplia experiencia en bodas y eventos. Contamos con equipo de sonido e iluminación de alta gama. Disponibilidad para todo tipo de eventos.',
        image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8OHx8ZGolMjB3ZWRkaW5nfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
        location: 'Valencia',
        price: '800€ - 1500€',
        tags: ['dj', 'música', 'iluminación', 'sonido', 'experiencia'],
        keywords: ['dj', 'musica', 'boda', 'evento', 'fiesta', 'iluminacion']
      },
      {
        id: '5',
        name: 'Flores del Jardín',
        service: 'Flores',
        snippet: 'Floristería artesanal especializada en decoración vintage y boho para bodas. Trabajamos con flores de temporada y productos ecológicos.',
        image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8ZmxvcmFsJTIwZGVzaWdufGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
        location: 'Sevilla',
        price: '500€ - 1500€',
        tags: ['flores', 'vintage', 'boho', 'ecológico', 'decoración', 'artesanal'],
        keywords: ['flores', 'floristeria', 'vintage', 'boho', 'decoracion', 'boda']
      }
    ];
    
    // Buscar coincidencias y calcular un puntaje de relevancia
    const resultWithScores = demoDatabase.map(item => {
      let score = 0;
      
      // Calcular coincidencias en diferentes campos
      const fields = [
        { name: 'name', weight: 3 },
        { name: 'service', weight: 5 },
        { name: 'snippet', weight: 2 },
        { name: 'location', weight: 2 },
        { name: 'tags', weight: 4, isArray: true },
        { name: 'keywords', weight: 4, isArray: true }
      ];
      
      fields.forEach(field => {
        if (field.isArray) {
          const matches = item[field.name].filter(tag => 
            queryLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(queryLower)
          ).length;
          score += matches * field.weight;
        } else if (item[field.name]) {
          const fieldValue = item[field.name].toLowerCase();
          if (fieldValue.includes(queryLower) || queryLower.includes(fieldValue)) {
            score += field.weight;
          }
          
          // Palabras clave individuales
          const queryWords = queryLower.split(' ');
          queryWords.forEach(word => {
            if (word.length > 3 && fieldValue.includes(word)) {
              score += field.weight * 0.5;
            }
          });
        }
      });
      
      return {
        ...item,
        match: Math.min(Math.round(score * 10), 95), // Convertir a porcentaje con máx de 95%
        aiSummary: generateAISummary(item, query)
      };
    });
    
    // Filtrar solo resultados con puntaje relevante y ordenar por puntaje
    return resultWithScores
      .filter(item => item.match > 30)
      .sort((a, b) => b.match - a.match);
  };
  
  /**
   * Función auxiliar para generar un resumen de IA de ejemplo
   */
  const generateAISummary = (item, query) => {
    const queryLower = query.toLowerCase();
    
    // Ejemplos de resúmenes predefinidos
    const summaries = {
      'fotografo': `Este ${item.service.toLowerCase()} tiene un estilo ${item.tags.join(' y ')} perfecto para bodas. ${item.location ? `Ubicado en ${item.location}, ` : ''}ofrece servicios en el rango de precios ${item.price}.`,
      'catering': `Servicio de catering que ofrece ${item.tags.join(', ')}, ideal para eventos con invitados. ${item.location ? `Disponible en ${item.location}, ` : ''}con precios aproximados de ${item.price}.`,
      'flores': `Servicio de flores con estilo ${item.tags.join(' y ')} para decoración de bodas. ${item.location ? `Ubicado en ${item.location}, ` : ''}trabaja con un presupuesto de ${item.price}.`,
      'dj': `DJ con amplia experiencia en eventos y bodas, ofrece ${item.tags.join(' y ')}. ${item.location ? `Disponible en ${item.location}, ` : ''}con tarifas de ${item.price}.`
    };
    
    // Determinar qué tipo de servicio se está buscando
    let summaryType = '';
    for (const key of Object.keys(summaries)) {
      if (queryLower.includes(key)) {
        summaryType = key;
        break;
      }
    }
    
    // Si no se identifica un tipo específico, usar el servicio del proveedor
    if (!summaryType) {
      summaryType = item.service.toLowerCase().includes('foto') ? 'fotografo' :
                   item.service.toLowerCase().includes('catering') ? 'catering' :
                   item.service.toLowerCase().includes('flores') ? 'flores' :
                   item.service.toLowerCase().includes('música') || item.service.toLowerCase().includes('dj') ? 'dj' :
                   'fotografo'; // default
    }
    
    return summaries[summaryType] || `Este proveedor parece adecuado para tu búsqueda de "${query}". Ofrece servicios de ${item.service} ${item.location ? `en ${item.location}` : ''}.`;
  };

  /**
   * Limpiar resultados de búsqueda
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setLastQuery('');
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    lastQuery,
    searchProviders,
    clearResults
  };
};

export default useAISearch;
