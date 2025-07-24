import React, { useState, useEffect } from 'react';
import { saveData, loadData } from '../services/SyncService';
import Spinner from './Spinner';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { Wand2, RefreshCcw, Download, FileDown } from 'lucide-react';

/**
 * Componente para generar imágenes con IA
 * @param {Object} props - Propiedades del componente
 * @param {string} props.category - Categoría de la imagen (invitaciones, logo, menu, etc.)
 * @param {Array} props.templates - Array de plantillas predefinidas
 * @param {Function} props.onImageGenerated - Callback cuando se genera una imagen
 */
const ImageGeneratorAI = ({ category = 'general', templates = [], onImageGenerated = () => {} }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Cargar imágenes guardadas al iniciar
  useEffect(() => {
    const savedImages = loadData(`lovenda_ai_images_${category}`, { 
      defaultValue: [], 
      collection: 'userDesigns' 
    });
    
    if (savedImages && savedImages.length > 0) {
      setGeneratedImages(savedImages);
    }
  }, [category]);

  // Mostrar toast temporal
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Seleccionar una plantilla y aplicarla al prompt
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setPrompt(template.prompt);
  };

  // Generar imagen usando OpenAI DALL-E
  const generateImage = async () => {
    if (!prompt.trim()) {
      setToast({
        type: 'error',
        message: 'Por favor, escribe un prompt o selecciona una plantilla'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Si tenemos un proxy API, lo usamos
      try {
        const res = await fetch('/api/ai-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.url) {
            handleImageGenerated(data.url);
            return;
          }
        }
      } catch (err) {
        console.warn('Error con el proxy de API, intentando directo con OpenAI:', err);
      }

      // Si no hay proxy o falló, usamos OpenAI directamente
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "hd"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error al generar la imagen');
      }

      const data = await response.json();
      
      if (data && data.data && data.data[0] && data.data[0].url) {
        handleImageGenerated(data.data[0].url);
      } else {
        throw new Error('No se recibió URL de imagen en la respuesta');
      }
    } catch (err) {
      console.error('Error al generar imagen:', err);
      setError(err.message || 'Error al generar la imagen');
      setToast({
        type: 'error',
        message: 'Error al generar la imagen. Intenta con otro prompt.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar la imagen generada
  const handleImageGenerated = (imageUrl) => {
    const newImage = {
      id: Date.now(),
      url: imageUrl,
      prompt,
      timestamp: new Date().toISOString(),
      category
    };

    const updatedImages = [newImage, ...generatedImages];
    setGeneratedImages(updatedImages);
    
    // Guardar en almacenamiento local
    saveData(`lovenda_ai_images_${category}`, updatedImages, {
      collection: 'userDesigns',
      showNotification: false
    });

    // Llamar al callback
    onImageGenerated(newImage);
    
    setToast({
      type: 'success',
      message: '¡Imagen generada con éxito!'
    });
  };

  // Descargar la imagen
  const downloadImage = async (imageUrl, imageName) => {
    const urlObj = new URL(imageUrl);
    const sameOrigin = urlObj.origin === window.location.origin;

    // Si es otro dominio (Azure/OpenAI), usamos fallback directo sin fetch para evitar CORS error
    if (!sameOrigin) {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = imageName || `lovenda-${category}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = imageName || `lovenda-${category}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error al descargar la imagen:', err);
      // Fallback: abrir la URL directamente en nueva pestaña
      const aFallback = document.createElement('a');
      aFallback.href = imageUrl;
      aFallback.target = '_blank';
      aFallback.rel = 'noopener noreferrer';
      document.body.appendChild(aFallback);
      aFallback.click();
      document.body.removeChild(aFallback);
      setToast({
        type: 'error',
        message: 'Error al descargar la imagen'
      });
    }
  };

  // Descargar como PDF vectorial listo para impresión
  const downloadVectorPdf = async (imageUrl, fileName) => {
    try {
      const res = await fetch('/api/ai-image/vector-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl })
      });
      if (!res.ok) throw new Error('Error generando PDF');

      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error('PDF vacío');

      // Descargar usando FileSaver (cross-browser)
      saveAs(blob, fileName || `lovenda-${category}-${Date.now()}.pdf`);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      setToast({ type: 'error', message: 'No se pudo generar el PDF' });
    }
  };

  // Descargar como PDF sin márgenes
  const downloadAsPdf = async (imageUrl, fileName) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const pdf = new jsPDF({
          unit: 'pt',
          orientation: img.width >= img.height ? 'l' : 'p',
          format: [img.width, img.height]
        });
        pdf.addImage(img, 'PNG', 0, 0, img.width, img.height);
        pdf.save(fileName || `lovenda-${category}-${Date.now()}.pdf`);
        window.URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      setToast({
        type: 'error',
        message: 'Error al generar el PDF'
      });
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Panel de plantillas */}
      {templates.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Plantillas disponibles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {templates.map((template, index) => (
              <div 
                key={index} 
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedTemplate === template 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{template.name}</h4>
                  {selectedTemplate === template && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Seleccionada</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor de prompt */}
      <div className="bg-white p-4 border rounded-lg">
        <label htmlFor="prompt" className="block font-medium mb-2">Prompt para la generación</label>
        <div className="flex space-x-2">
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe la imagen que quieres generar..."
            className="flex-1 border rounded-lg p-3 min-h-[100px]"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={generateImage}
            disabled={loading || !prompt.trim()}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              loading || !prompt.trim() 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <><RefreshCcw className="animate-spin h-4 w-4" /><span>Generando...</span></>
            ) : (
              <><Wand2 className="h-4 w-4" /><span>Generar imagen</span></>
            )}
          </button>
        </div>
      </div>

      {/* Galería de imágenes generadas */}
      {generatedImages.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-4">Imágenes generadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedImages.map((image) => (
              <div key={image.id} className="border rounded-lg overflow-hidden">
                <div className="relative">
                  <img 
                    src={image.url} 
                    alt={image.prompt} 
                    className="w-full h-auto object-contain"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() => downloadImage(image.url)}
                      className="bg-white/80 p-2 rounded-full hover:bg-white"
                      title="Descargar PNG"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => downloadVectorPdf(image.url)}
                      className="bg-white/80 p-2 rounded-full hover:bg-white"
                      title="Descargar PDF"
                    >
                      <FileDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-700 line-clamp-2">{image.prompt}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(image.timestamp).toLocaleDateString()} {new Date(image.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast de notificación */}
      {toast && (
        <div 
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg ${
            toast.type === 'error' 
              ? 'bg-red-600 text-white' 
              : toast.type === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-blue-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ImageGeneratorAI;
