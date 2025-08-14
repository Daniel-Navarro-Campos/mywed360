import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserContext } from '../context/UserContext';

export default function DisenoWeb() {
  const { user } = useUserContext();
  const uid = user?.uid || 'dev';
  const [prompt, setPrompt] = useState('');
  const [html, setHtml] = useState('');
  const [profile, setProfile] = useState(null);
  const [versions, setVersions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('personalizada');
  
  // Plantillas predefinidas
  const templates = {
    personalizada: { 
      name: 'Personalizada', 
      desc: 'Crea una página web totalmente personalizada según tus indicaciones',
      prompt: ''
    },
    clasica: { 
      name: 'Clásica', 
      desc: 'Diseño elegante con tonos dorados y blancos, ideal para bodas tradicionales',
      prompt: 'Diseño clásico con tonos dorados y blancos. Usa tipografía elegante serif y elementos decorativos clásicos. Enfoque en elegancia tradicional.'
    },
    moderna: { 
      name: 'Moderna', 
      desc: 'Estilo minimalista con colores neutros y diseño limpio',
      prompt: 'Diseño moderno minimalista con colores neutros. Usa tipografía sans-serif limpia, mucho espacio en blanco y animaciones sutiles. Enfoque en elegancia contemporánea.'
    },
    rustica: { 
      name: 'Rústica', 
      desc: 'Inspirada en bodas campestres con elementos naturales y paleta de colores tierra',
      prompt: 'Diseño rústico campestre con elementos de madera y naturales. Usa colores tierra, verde y detalles florales. Aspecto cálido y acogedor tipo boda en el campo.'
    },
    playa: { 
      name: 'Playa', 
      desc: 'Perfecta para bodas en la costa con tonos azules y turquesa',
      prompt: 'Diseño temática de playa con tonos azules, turquesa y arena. Incluye elementos marinos sutiles, olas y textura de arena. Sensación fresca y relajada de boda costera.'
    }
  };

  // Cargar datos de perfil y versiones al montar
  useEffect(()=>{
    if(!uid) return;
    (async ()=>{
      try {
        const snap = await getDoc(doc(db,'users',uid));
        if(snap.exists()) setProfile(snap.data().weddingInfo || {});
        // cargar versiones
        const colSnap = await getDocs(collection(db,'users',uid,'generatedPages'));
        setVersions(colSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.createdAt?.seconds - a.createdAt?.seconds));
      } catch(e){ console.error(e);} 
    })();
  },[uid]);

  const generateWeb = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    // Llamar a OpenAI para generar la web
    try {
      if(!import.meta.env.VITE_OPENAI_API_KEY){
        // Fallback de demo si no hay clave
        const demo = `<html><head><style>body{font-family:sans-serif;padding:2rem}</style></head><body><h1>${prompt}</h1><p>Ejemplo de web generada (sin IA).</p></body></html>`;
        setHtml(demo);
        return;
      }
      
      // Extraer datos relevantes del perfil
      const {
        brideInfo = {},
        groomInfo = {},
        ceremonyInfo = {},
        receptionInfo = {},
        transportationInfo = {},
        rsvpInfo = {}
      } = profile || {};
      
      // Preparar información estructurada para la IA
      const weddingInfo = {
        bride: brideInfo.nombre || 'Nombre de la novia',
        groom: groomInfo.nombre || 'Nombre del novio',
        date: ceremonyInfo.fecha || 'Fecha por determinar',
        ceremonyTime: ceremonyInfo.hora || 'Hora por determinar',
        ceremonyLocation: ceremonyInfo.lugar || 'Lugar por determinar',
        ceremonyAddress: ceremonyInfo.direccion || '',
        receptionVenue: receptionInfo.lugar || 'Lugar por determinar',
        receptionAddress: receptionInfo.direccion || '',
        receptionTime: receptionInfo.hora || 'Hora por determinar',
        transportation: transportationInfo.detalles || '',
        rsvpDeadline: rsvpInfo.fecha || '',
        contactPhone: profile?.contactPhone || '',
        contactEmail: profile?.contactEmail || '',
        weddingStyle: profile?.weddingStyle || 'Clásico',
        colorScheme: profile?.colorScheme || 'Blanco y dorado',
        additionalInfo: profile?.additionalInfo || ''
      };
      
      // Instrucciones detalladas para el sistema
      const sys = `Eres un experto diseñador web especializado en páginas de bodas. 
      Debes crear un sitio web completo y funcional para una boda con diseño moderno, responsive y elegante.
      El sitio debe incluir las siguientes secciones, adaptándolas según la información disponible:
      - Inicio con nombres, fecha y cuenta regresiva
      - Historia de la pareja
      - Información de ceremonia y recepción
      - Galería de fotos (con marcadores para fotos)
      - Detalles de transporte y alojamiento
      - RSVP (si aplica)
      - Regalos/Lista de bodas
      - Contacto
      
      Usa un diseño moderno, tipografía elegante y estética acorde al estilo de boda indicado.
      Debes devolver ÚNICAMENTE código HTML completo con CSS embebido en el <head> y código JavaScript si es necesario.
      NO incluyas comentarios explicativos fuera del código.`;
      
      // Preparar mensaje para la IA incluyendo datos estructurados
      const userMessage = `
      Crea un sitio web completo para esta boda con los siguientes datos:
      
      DATOS DE LA BODA:
      - Novia: ${weddingInfo.bride}
      - Novio: ${weddingInfo.groom}
      - Fecha: ${weddingInfo.date}
      - Ceremonia: ${weddingInfo.ceremonyTime} en ${weddingInfo.ceremonyLocation}
      - Dirección ceremonia: ${weddingInfo.ceremonyAddress}
      - Recepción: ${weddingInfo.receptionTime} en ${weddingInfo.receptionVenue}
      - Dirección recepción: ${weddingInfo.receptionAddress}
      - Transporte: ${weddingInfo.transportation}
      - Fecha límite RSVP: ${weddingInfo.rsvpDeadline}
      - Teléfono de contacto: ${weddingInfo.contactPhone}
      - Email de contacto: ${weddingInfo.contactEmail}
      - Estilo de boda: ${weddingInfo.weddingStyle}
      - Paleta de colores: ${weddingInfo.colorScheme}
      - Información adicional: ${weddingInfo.additionalInfo}
      
      REQUISITOS ESPECÍFICOS DEL USUARIO:
      ${prompt}
      `;
      
      // Solicitud a la API
      // Verificar que exista la clave de OpenAI
      const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
      if(!OPENAI_KEY){
        alert('Configura la variable de entorno VITE_OPENAI_API_KEY con tu clave de OpenAI.');
        setError('Falta clave OpenAI – define VITE_OPENAI_API_KEY en tu .env');
        setLoading(false);
        return;
      }

      console.log('DEBUG OpenAI_KEY length:', OPENAI_KEY?.length || 'undefined');
      const modelName = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o';

      const messages = [
        { role: 'system', content: sys },
        { role: 'user', content: userMessage }
      ];
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${OPENAI_KEY}`,
          'OpenAI-Project': import.meta.env.VITE_OPENAI_PROJECT_ID 
        },
        body: JSON.stringify({ 
          model: modelName, // Modelo configurable vía VITE_OPENAI_MODEL
          messages, 
          temperature: 0.7 
        })
      });
      
      if(response.status === 401){
        throw new Error('Clave OpenAI inválida o no autorizada (401). Comprueba VITE_OPENAI_API_KEY');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Error al generar la página web');
      }
      
      let htmlGen = data.choices?.[0]?.message?.content || '';
      // Quitar posibles fences ```html
      htmlGen = htmlGen.replace(/```html|```/g, '').trim();
      setHtml(htmlGen);
    } catch (err) { 
      console.error('Error en la generación de la página:', err); 
      setError(`Error al generar con IA: ${err.message || 'Revisa la consola para más detalles'}`); 
      alert('Ha ocurrido un error al generar la página web. Por favor, inténtalo de nuevo.'); 
    }
    
    setLoading(false);
  };

  const publishWeb = async () => {
    if(!html.trim()){ alert('Genera la web primero'); return; }
    try{
      await setDoc(doc(db,'users',uid), { generatedHtml: html }, { merge:true });
      await addDoc(collection(db,'users',uid,'generatedPages'), { html, createdAt: serverTimestamp(), prompt });
      alert('¡Página publicada! Se mostrará en la URL pública en unos minutos.');
      // recargar versiones
      const colSnap = await getDocs(collection(db,'users',uid,'generatedPages'));
      setVersions(colSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.createdAt?.seconds - a.createdAt?.seconds));
    }catch(e){ console.error(e); alert('Error al publicar'); }
  };

  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey);
    if (templateKey !== 'personalizada') {
      // Si selecciona una plantilla predefinida, usar su prompt como base
      setPrompt(templates[templateKey].prompt);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Diseño Web de Boda</h1>
      
      {/* Selección de plantillas */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Selecciona un estilo para tu web</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(templates).map(([key, template]) => (
            <div 
              key={key}
              onClick={() => handleTemplateSelect(key)}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedTemplate === key ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}
            >
              <h3 className="font-medium text-lg">{template.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{template.desc}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Instrucciones personalizadas */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Personaliza tu web</h2>
        <p className="text-gray-600 mb-4">
          Describe cómo quieres que sea tu página web, colores, estilos o cualquier requisito específico.
          {selectedTemplate !== 'personalizada' && (
            <span className="block mt-2 text-blue-600">
              Usando plantilla: <strong>{templates[selectedTemplate].name}</strong>. 
              Puedes modificar el texto sugerido o añadir más detalles.
            </span>
          )}
        </p>
        
        <textarea
          className="w-full h-40 border rounded-lg p-4"
          placeholder="Ej: Quiero una web con estilo romántico, muchas fotos y una sección para que los invitados confirmen asistencia..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className="mt-4 flex flex-wrap gap-4">
          <button
            onClick={generateWeb}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generando...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Generar Página Web</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {html && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Vista previa de tu página web</h2>
          
          <div className="border rounded-lg overflow-hidden shadow-lg">
            <div className="bg-gray-100 p-2 border-b flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="flex-1 text-center text-sm text-gray-600">Vista previa - Tu web de boda</div>
            </div>
            <iframe
              title="Vista previa"
              srcDoc={html}
              sandbox="allow-same-origin allow-scripts"
              className="w-full h-[600px] border-none"
            />
          </div>

          <div className="mt-6 flex gap-4 items-center">
            <button
              onClick={publishWeb}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span>Publicar página</span>
            </button>
            <button 
              onClick={() => {
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              <span>Abrir en nueva pestaña</span>
            </button>
          </div>
        </div>
      )}

      {versions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Versiones publicadas</h2>
          
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plantilla</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indicaciones</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {versions.map(v => {
                  // Detectar qué plantilla se usó basado en el prompt
                  let templateUsed = 'Personalizada';
                  Object.entries(templates).forEach(([key, template]) => {
                    if (v.prompt && v.prompt.includes(template.prompt) && template.prompt) {
                      templateUsed = template.name;
                    }
                  });
                  
                  return (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(v.createdAt?.seconds * 1000).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {templateUsed}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">
                        {v.prompt || 'Sin indicaciones'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => setHtml(v.html)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          Ver
                        </button>
                        <button 
                          onClick={() => {
                            setPrompt(v.prompt || '');
                            setHtml(v.html);
                            // Detectar plantilla
                            let detectedTemplate = 'personalizada';
                            Object.entries(templates).forEach(([key, template]) => {
                              if (v.prompt && v.prompt.includes(template.prompt) && template.prompt) {
                                detectedTemplate = key;
                              }
                            });
                            setSelectedTemplate(detectedTemplate);
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
