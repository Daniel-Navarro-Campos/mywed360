import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, RefreshCcw, Star, MapPin } from 'lucide-react';
import { saveData } from '../services/SyncService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import Spinner from './Spinner';

export default function ProviderSearchModal({ onClose, onSelectProvider }) {
  const { activeWedding } = useWedding();
  const [aiQuery, setAiQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [toast, setToast] = useState(null);

  const modalRef = useRef(null);

  // Cerrar al hacer clic fuera usando referencia (por si overlay pierde eventos)
  useEffect(() => {
    const handleOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Servicios comunes para bodas (memoizado para performance)
  const commonServices = useMemo(() => [
    'Catering', 'Fotógrafo', 'Música', 'Flores',
    'Vestidos', 'Decoración', 'Lugar', 'Transporte',
    'Invitaciones', 'Pasteles', 'Joyería', 'Detalles'
  ], []);

  // Verificar la operatividad de enlaces de proveedores (memoizada)
  const verifyProviderLinks = useCallback(async (providers) => {
    console.log('Verificando validez de enlaces de proveedores...');
    
    // Crear un array de proveedores normalizados (asegurar que todos tienen campos consistentes)
    const normalizedProviders = providers.map(provider => ({
      title: provider.title || provider.name || 'Proveedor sin nombre',
      link: provider.link || provider.url || '',
      snippet: provider.snippet || provider.description || '',
      service: provider.service || serviceFilter || 'Proveedor',
      location: provider.location || 'No especificada',
      priceRange: provider.priceRange || provider.price || 'Consultar',
      image: provider.image || '',
      // Por defecto consideramos válido hasta que se demuestre lo contrario
      verified: true
    }));
    
    // Filtrar proveedores con enlaces vacíos o mal formados
    const validProviders = normalizedProviders.filter(provider => {
      const link = provider.link || '';
      // Verificación básica del formato del enlace
      return link && 
        (link.startsWith('http://') || link.startsWith('https://')) &&
        link.includes('.');
    });
    
    console.log(`${validProviders.length} de ${normalizedProviders.length} tienen enlaces potencialmente válidos`);
    
    // Si no hay proveedores válidos después del filtro, devolver al menos uno como respaldo
    if (validProviders.length === 0 && normalizedProviders.length > 0) {
      // Crear un resultado de respaldo para el directorio de bodas.net
      return [{
        title: 'Directorio de proveedores para bodas',
        link: `https://www.bodas.net/busqueda/${(serviceFilter || 'proveedores').toLowerCase().replace(/\s+/g, '-')}-espana`,
        snippet: `Encuentra proveedores de ${serviceFilter || 'boda'} en toda España`,
        service: serviceFilter || 'Proveedor',
        location: 'España',
        priceRange: 'Varios precios disponibles',
        verified: true
      }];
    }
    
    return validProviders;
  }, [serviceFilter]);

  // Manejar búsqueda con IA (memoizada)
  const handleAiSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    
    try {
      let profile = {};
        if (activeWedding) {
          const infoSnap = await getDoc(doc(db, 'weddings', activeWedding, 'weddingInfo'));
          if (infoSnap.exists()) profile = infoSnap.data();
        }
      
      // Extraer información de ubicación del perfil
      let locationInfo = '';
      
      if (profile.celebrationPlace) {
        locationInfo = profile.celebrationPlace;
      }
      
      const formattedLocation = locationInfo || 'Valencia';
      
      // Intentar realizar la búsqueda a través del API proxy
      try {
        const res = await fetch('/api/ai-suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: aiQuery, 
            service: serviceFilter, 
            budget: budgetRange, 
            profile: profile,
            location: formattedLocation
          })
        });
        
        let data = [];
        if (res.ok) {
          try {
            data = await res.json();
          } catch (_) { /* cuerpo vacío */ }
        }
        
        if (Array.isArray(data) && data.length) {
          // Verificar operatividad de los enlaces antes de mostrarlos
          const verifiedResults = await verifyProviderLinks(data);
          setAiResults(verifiedResults);
          setShowResults(true);
          saveData('lovendaSuppliers', verifiedResults, { firestore: false, showNotification: false });
          window.dispatchEvent(new Event('lovenda-suppliers'));
          return;
        }
      } catch (err) {
        console.error("Error en solicitud API:", err);
      }
      
      // Si la solicitud API falló o no devolvió resultados, usar OpenAI directamente
      await fetchOpenAi();
    } catch (err) {
      console.error("Error general:", err);
      setToast({ 
        message: 'Error al buscar proveedores. Inténtalo de nuevo más tarde.', 
        type: 'error' 
      });
    } finally {
      setAiLoading(false);
    }
  }, [aiQuery, activeWedding, serviceFilter, budgetRange, verifyProviderLinks]);

  // Función para buscar proveedores usando OpenAI directamente
  const fetchOpenAi = async () => {
    try {
      let profile = {};
        if (activeWedding) {
          const infoSnap = await getDoc(doc(db, 'weddings', activeWedding, 'weddingInfo'));
          if (infoSnap.exists()) profile = infoSnap.data();
        }
      
      // Extraer datos relevantes del perfil
      const servicioSeleccionado = serviceFilter || '';
      let locationInfo = '';
      
      if (profile.celebrationPlace) {
        locationInfo = profile.celebrationPlace;
      }
      
      const formattedLocation = locationInfo || 'Valencia';
      
      // Crear el prompt para OpenAI
      const locationPrompt = formattedLocation ? 
        `La boda es en ${formattedLocation}.` : 
        'La ubicación de la boda no está especificada.';
      
      const budgetPrompt = budgetRange ? 
        `El presupuesto es ${budgetRange}.` : 
        'No hay un presupuesto especificado.';
      
      const prompt = `Actúa como un asistente de bodas que busca proveedores.
        Necesito encontrar proveedores de "${servicioSeleccionado || 'servicios para bodas'}" 
        que ofrezcan: "${aiQuery}".
        ${locationPrompt}
        ${budgetPrompt}
        
        Devuelve ÚNICAMENTE un array JSON con 5 opciones de proveedores reales, 
        con este formato exacto por cada proveedor:
        {
          "title": "Nombre del proveedor",
          "link": "URL de su web oficial o perfil en plataforma de bodas",
          "snippet": "Breve descripción del servicio que ofrecen",
          "service": "${servicioSeleccionado || 'Servicios para bodas'}",
          "location": "Ubicación del proveedor (ciudad o provincia)",
          "priceRange": "Rango de precios aproximado"
        }
        
        Asegúrate de:
        1. Incluir enlaces reales y operativos, preferiblemente web oficial o perfil en bodas.net
        2. Priorizar proveedores en ${formattedLocation || 'la ubicación de la boda'}
        3. Que los proveedores sean relevantes para la búsqueda "${aiQuery}"
        4. SOLO devolver el array JSON, sin texto adicional ni explicaciones`;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        'OpenAI-Project': import.meta.env.VITE_OPENAI_PROJECT_ID
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Error en la API de OpenAI: ${error.error?.message || 'Error desconocido'}`);
      }
      
      const data = await response.json();
      
      if (!data.choices || !data.choices.length) {
        throw new Error('Respuesta vacía de OpenAI');
      }
      
      if (!data.choices[0].message || !data.choices[0].message.content) {
        throw new Error('Formato de respuesta inválido');
      }
      
      // Intentar extraer los resultados del texto de respuesta
      const content = data.choices[0].message.content;
      
      // Detectar si la respuesta contiene un mensaje de error explícito
      if (content.toLowerCase().includes('error') && content.length < 150) {
        throw new Error(`Error reportado por OpenAI: ${content}`);
      }
      
      // Intentar extraer JSON de la respuesta con estrategias múltiples
      let jsonMatches = content.match(/```json\s*([\s\S]+?)\s*```/) || 
                        content.match(/```\s*([\s\S]+?)\s*```/) ||
                        content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      // Si encontramos array directo
      if (jsonMatches && jsonMatches[0].startsWith('[')) {
        jsonMatches = [null, jsonMatches[0]];
      }
      
      // Si todo falla, usar texto completo
      if (!jsonMatches) {
        jsonMatches = [null, content.trim()];
      }
      
      if (!jsonMatches || !jsonMatches[1]) {
        console.error('No se pudo extraer JSON de la respuesta');
        throw new Error('No se pudo extraer JSON de la respuesta');
      }
      
      // Intentar analizar el JSON
      let results = [];
      try {
        const jsonText = jsonMatches[1].trim();
        results = JSON.parse(jsonText);
      } catch (jsonError) {
        console.error('Error al parsear JSON:', jsonError);
        
        try {
          // Intento alternativo: buscar corchetes de array
          const startIdx = jsonMatches[1].indexOf('[');
          const endIdx = jsonMatches[1].lastIndexOf(']');
          
          if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
            const arrayText = jsonMatches[1].substring(startIdx, endIdx + 1);
            results = JSON.parse(arrayText);
          } else {
            throw new Error('No se encontró estructura de array en la respuesta');
          }
        } catch (subError) {
          // Crear resultado manual si todo falla
          const lines = content.split('\n');
          const providerCandidates = lines.filter(line => 
            line.trim().length > 10 && 
            /^[A-Z]/.test(line.trim()) && 
            !line.trim().startsWith('```')
          );
          
          if (providerCandidates.length > 0) {
            results = providerCandidates.map((line, index) => ({
              title: line.trim().split(':')[0] || `Proveedor ${index + 1}`,
              name: line.trim().split(':')[0] || `Proveedor ${index + 1}`,
              link: `https://www.bodas.net/busqueda/${servicioSeleccionado.toLowerCase().replace(/\s+/g, '-')}-${formattedLocation ? formattedLocation.split(',')[0].toLowerCase() : 'espana'}`,
              snippet: line,
              service: servicioSeleccionado,
              location: formattedLocation || 'España',
              priceRange: 'Consultar'
            }));
          }
        }
      }
      
      // Verificar que results es un array
      if (!Array.isArray(results)) {
        console.error('El resultado no es un array:', results);
        results = [];
      }
      
      // Verificar y normalizar los resultados
      const validResults = await verifyProviderLinks(results);
      
      if (validResults.length === 0 && results.length > 0) {
        // Crear un resultado de respaldo para evitar que no haya resultados
        validResults.push({
          title: 'Directorio de proveedores para bodas',
          link: `https://www.bodas.net/busqueda/${servicioSeleccionado.toLowerCase().replace(/\s+/g, '-')}-${formattedLocation ? formattedLocation.split(',')[0].toLowerCase() : 'espana'}`,
          snippet: `Encuentra proveedores de ${servicioSeleccionado} en ${formattedLocation || 'toda España'}`,
          service: servicioSeleccionado,
          location: formattedLocation || 'España',
          priceRange: 'Varios precios disponibles',
          verified: true
        });
      }
      
      // Mostrar los resultados
      if (validResults.length > 0) {
        setAiResults(validResults);
        setShowResults(true);
        saveData('lovendaSuppliers', validResults, { firestore: false, showNotification: false });
        window.dispatchEvent(new Event('lovenda-suppliers'));
      } else {
        setToast({ 
          message: 'No se encontraron proveedores que coincidan con tu búsqueda. Intenta con otros términos.', 
          type: 'info' 
        });
      }
    } catch (err) {
      console.error('Error en la búsqueda de proveedores:', err);
      setToast({ 
        message: 'Error al buscar proveedores. Inténtalo de nuevo más tarde.', 
        type: 'error' 
      });
    }
  };

  const selectProvider = useCallback((item) => {
    if (onSelectProvider) {
      onSelectProvider(item);
    }
    onClose();
  }, [onSelectProvider, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[999]" onMouseDownCapture={(e)=>{if(e.target===e.currentTarget) onClose();}}>
      <div ref={modalRef} role="dialog" aria-modal="true"
        className="bg-white rounded shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col p-4 m-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">Buscar proveedor</h3>
        
        {/* Formulario de búsqueda */}
        <form onSubmit={handleAiSearch} className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input 
                value={aiQuery} 
                onChange={e => setAiQuery(e.target.value)} 
                className="w-full border rounded p-3" 
                placeholder="¿Qué buscas? Ej: Fotógrafo con experiencia en bodas al aire libre" 
              />
            </div>
            <button 
              type="submit" 
              className="bg-blue-600 text-white rounded-full p-3 flex items-center justify-center" 
              disabled={aiLoading}
            >
              {aiLoading ? <RefreshCcw className="animate-spin" /> : <Search />}
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <select 
                value={serviceFilter} 
                onChange={e => setServiceFilter(e.target.value)} 
                className="w-full border rounded p-3"
              >
                <option value="">Todos los servicios</option>
                {commonServices.map((service, idx) => (
                  <option key={idx} value={service}>{service}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <select 
                value={budgetRange} 
                onChange={e => setBudgetRange(e.target.value)} 
                className="w-full border rounded p-3"
              >
                <option value="">Cualquier presupuesto</option>
                <option value="económico">Económico</option>
                <option value="medio">Precio medio</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
        </form>
        
        {/* Indicador de carga */}
        {aiLoading && (
          <div className="flex-1 flex items-center justify-center">
            <Spinner text="Buscando proveedores..." />
          </div>
        )}
        
        {/* Resultados de búsqueda */}
        {!aiLoading && showResults && (
          <div className="flex-1 overflow-y-auto">
            <h4 className="font-medium mb-2">Resultados ({aiResults.length})</h4>
            {aiResults.length === 0 ? (
              <p className="text-gray-500">No se encontraron proveedores que coincidan con tu búsqueda.</p>
            ) : (
              <div className="space-y-4">
                {aiResults.map((item, idx) => (
                  <div key={idx} className="border rounded p-3 hover:bg-gray-50 cursor-pointer" onClick={() => selectProvider(item)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-blue-600">{item.title || item.name}</p>
                        <div className="flex items-center text-xs text-gray-600 mt-1 space-x-2">
                          <span className="flex items-center">
                            <MapPin size={12} className="mr-1" />
                            {item.location || 'No especificada'}
                          </span>
                          {item.priceRange && (
                            <span className="flex items-center">
                              <span className="mr-1">💰</span>
                              {item.priceRange}
                            </span>
                          )}
                          {item.service && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded">
                              {item.service}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm mt-2 text-gray-700 line-clamp-2">
                      {item.snippet || 'Sin descripción disponible'}
                    </p>
                    {item.link && (
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {new URL(item.link).hostname.replace('www.', '')}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Toast para mensajes */}
        {toast && (
          <div className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
            {toast.message}
          </div>
        )}
        
        {/* Botones de acción */}
        <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
