import React, { useState, useEffect, useRef, memo } from 'react';
import sanitizeHtml from '../../../utils/sanitizeHtml';
import EmailComments from '../EmailComments';
// Importación problemática eliminada temporalmente
// import { Viewer } from 'react-tiff';
import { toBlob } from 'html-to-image';

// Importamos nuestros componentes de iconos personalizados
import {
  IconArrowLeft,
  IconReply,
  IconTrash,
  IconDownload,
  IconStar,
  IconMoreHorizontal as IconMore,
  IconExternalLink as IconExternal,
  IconPrinter,
  IconFlag,
  IconArrowLeftRight,
  IconFolderMove
} from '../../ui/IconComponents';
import Button from '../../Button';
import EmailCategoryLabel from './EmailCategoryLabel';

/**
 * Componente para mostrar el detalle completo de un email
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.email - Email a mostrar
 * @param {Function} props.onReply - Función para responder al email
 * @param {Function} props.onDelete - Función para eliminar el email
 * @param {Function} props.onBack - Función para volver a la lista
 * @param {Function} props.onMarkRead - Función para marcar como leído
 * @returns {JSX.Element} Componente de detalle de email
 */

// Constantes para tipos de archivos
const IMAGE_TYPES = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',
  'bmp': 'image/bmp',
  'ico': 'image/x-icon'
};
const EmailDetail = ({ email, onReply, onDelete, onBack, onMarkRead }) => {
  // Si email es null o undefined, mostrar un mensaje
  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
        <p className="text-lg">Selecciona un email para ver su contenido</p>
      </div>
    );
  }
  const [isStarred, setIsStarred] = useState(email?.important || false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isRead, setIsRead] = useState(email?.read || false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [loadingImages, setLoadingImages] = useState({});
  const prevEmailIdRef = useRef(email?.id);
  
  // Efecto para actualizar el estado visual cuando cambia el email seleccionado
  useEffect(() => {
    if (email?.id !== prevEmailIdRef.current) {
      setIsRead(email?.read || false);
      prevEmailIdRef.current = email?.id;
    }
  }, [email?.id, email?.read]);
  
  // Efecto para marcar automáticamente como leído cuando se visualiza un email no leído
  useEffect(() => {
    if (email && !isRead) {
      setIsRead(true); // Actualizar inmediatamente el estado visual
      if (onMarkRead) {
        // Notificar al componente padre que debe actualizar el estado
        onMarkRead(email.id);
      }
    }
  }, [email, isRead, onMarkRead]);

  if (!email) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Selecciona un email para ver su contenido
      </div>
    );
  }

  // Función para manejar el marcado como importante
  const handleToggleStar = () => {
    setIsStarred(!isStarred);
    // Actualizar en el servidor y notificar al componente padre
    // Esta función debería conectarse con el servicio de email
    // por ahora solo actualizamos el estado local
  };

  // Formatear la fecha completa
  const formatFullDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener extensión del archivo
  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
  };
  
  // Verificar si el archivo es una imagen
  const isImageFile = (filename) => {
    const ext = getFileExtension(filename);
    return Object.keys(IMAGE_TYPES).includes(ext);
  };
  
  // Obtener tipo MIME basado en la extensión
  const getMimeType = (filename) => {
    const ext = getFileExtension(filename);
    return IMAGE_TYPES[ext] || 'application/octet-stream';
  };
  
  // Manejar click en una imagen adjunta
  const handleImageClick = (attachment) => {
    setExpandedImage(attachment);
  };
  
  // Cerrar visualizador de imagen
  const handleCloseImageViewer = () => {
    setExpandedImage(null);
  };
  
  // Manejar la descarga de un archivo adjunto
  const handleDownloadAttachment = (attachment) => {
    // Aquí implementaríamos la lógica de descarga
    console.log('Descargando:', attachment.filename);
    // Idealmente, esto conectaría con un endpoint de la API
  };
  
  // Obtener iniciales para el avatar
  const getInitials = (emailAddress) => {
    if (!emailAddress) return '?';
    
    const name = emailAddress.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim();
    const parts = name.split(' ').filter(part => part.length > 0);
    
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Procesar el contenido HTML del email de forma segura
  const getSafeHtml = (htmlContent) => {
    try {
      const result = sanitizeHtml(htmlContent || '');
      // Asegurar que siempre retornamos un string, nunca una Promesa
      return typeof result === 'string' ? result : String(result || '');
    } catch (error) {
      console.error('Error al sanitizar HTML:', error);
      return htmlContent || '';
    }
  };
    
    

    
  
  // Obtener color para el avatar basado en el remitente
  const getAvatarColor = (email) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-teal-500'
    ];
    
    // Usar una función simple de hash para asignar un color consistente
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = ((hash << 5) - hash) + email.charCodeAt(i);
      hash |= 0;
    }
    
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  // Detectar las categorías del email
  const detectCategories = (email) => {
    const categories = [];
    
    // Ejemplo de lógica para detectar categorías
    if (email.from.includes('proveedor') || email.subject.toLowerCase().includes('proveedor')) {
      categories.push({ name: 'Proveedor', color: 'bg-blue-500' });
    }
    
    if (email.from.includes('invitado') || email.subject.toLowerCase().includes('invitado')) {
      categories.push({ name: 'Invitado', color: 'bg-green-500' });
    }
    
    if (email.subject.toLowerCase().includes('importante') || email.important) {
      categories.push({ name: 'Importante', color: 'bg-yellow-500' });
    }
    
    return categories;
  };

  const emailCategories = detectCategories(email);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Barra de herramientas */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="mr-4 text-gray-600 hover:text-gray-900 md:hidden"
          >
            <ArrowLeft size={20} />
          </button>
          
          <Button 
            onClick={onReply}
            variant="outline"
            size="sm"
            className="flex items-center mr-2"
            aria-label="Responder"
          >
            <Reply size={16} className="mr-1" />
            <span className="hidden sm:inline">Responder</span>
          </Button>
          
          <Button
            onClick={onDelete}
            variant="outline"
            size="sm"
            className="flex items-center mr-2"
          >
            <Trash size={16} className="mr-1" />
            <span className="hidden sm:inline">Eliminar</span>
          </Button>
          
          <button
            onClick={handleToggleStar}
            className={`p-1.5 rounded-full hover:bg-gray-100 ${isStarred ? 'text-yellow-500' : 'text-gray-500'}`}
          >
            <Star size={20} className={isStarred ? 'fill-yellow-500' : ''} />
          </button>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <MoreHorizontal size={20} />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
              <div className="py-1">
                <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Printer size={16} className="mr-2" />
                  Imprimir
                </button>
                <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Download size={16} className="mr-2" />
                  Descargar
                </button>
                <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <ExternalLink size={16} className="mr-2" />
                  Abrir en nueva ventana
                </button>
                <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <ArrowLeftRight size={16} className="mr-2" />
                  Reenviar
                </button>
                <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Flag size={16} className="mr-2" />
                  Marcar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Cabecera del email */}
      <div className="p-6 border-b">
        <div className="flex items-start">
          <div className={`w-10 h-10 rounded-full ${getAvatarColor(email.from)} flex items-center justify-center text-white font-medium mr-4 flex-shrink-0`}>
            {getInitials(email.from)}
          </div>
          
          <div className="flex-grow">
            <div className="flex items-start justify-between">
              <h1 className="text-xl font-medium mb-2">
                {email.subject || '(Sin asunto)'}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center mb-1">
              <span className="font-medium mr-1">{email.from}</span>
              <span className="text-gray-500 text-sm mr-1">para</span>
              <span className="mr-2">{email.to}</span>
              
              {email.cc && (
                <>
                  <span className="text-gray-500 text-sm mr-1">cc:</span>
                  <span>{email.cc}</span>
                </>
              )}
            </div>
            
            <div className="text-gray-500 text-sm mb-2">
              {formatFullDate(email.date)}
            </div>
            
            {emailCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {emailCategories.map((category, index) => (
                  <EmailCategoryLabel 
                    key={index}
                    name={category.name}
                    color={category.color}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Contenido del email */}
      <div className="p-6 overflow-auto flex-grow">
        {email.body ? (
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: getSafeHtml(email.body) }}
          />
        ) : (
          <div className="text-gray-500 italic">
            (Este mensaje no tiene contenido)
          </div>
        )}
      </div>
      
      {/* Adjuntos si existen */}
      {email.attachments && email.attachments.length > 0 && (
        <div className="p-4 border-t">
          <h3 className="text-sm font-medium mb-2">
            Adjuntos ({email.attachments.length})
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {email.attachments.map((attachment, index) => {
              const isImage = isImageFile(attachment.filename);
              const fileExt = getFileExtension(attachment.filename);
              const isTiff = fileExt === 'tiff' || fileExt === 'tif';
              const isWebp = fileExt === 'webp';
              
              return (
                <div 
                  key={index}
                  className={`border rounded p-2 hover:border-blue-400 transition-all ${isImage ? 'cursor-zoom-in' : 'cursor-pointer'}`}
                >
                  {isImage ? (
                    <div 
                      className="w-32 h-32 flex items-center justify-center overflow-hidden bg-gray-50 mb-1 relative"
                      onClick={() => handleImageClick(attachment)}
                    >
                      {isTiff ? (
                        // Temporalmente deshabilitado el visor TIFF por problemas de compatibilidad
                        <div className="text-center text-sm text-gray-400 p-2">
                          Imagen TIFF
                          <div className="text-xs mt-1">Visor temporalmente no disponible</div>
                        </div>
                      ) : isWebp ? (
                        // Soporte específico para WebP
                        <picture>
                          <source srcSet={attachment.dataUrl} type="image/webp" />
                          <img 
                            src={attachment.dataUrl || '/placeholder-image.png'}
                            alt={attachment.filename}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-broken-image.png';
                            }}
                          />
                        </picture>
                      ) : (
                        // Otras imágenes con fallback
                        <img 
                          src={attachment.dataUrl || '/placeholder-image.png'}
                          alt={attachment.filename}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-broken-image.png';
                          }}
                        />
                      )}
                      {loadingImages[index] && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center bg-gray-50 mb-1">
                      <div className="bg-gray-100 w-16 h-16 flex items-center justify-center rounded shadow-sm text-2xl">
                        📄
                      </div>
                    </div>
                  )}
                  <div className="w-32">
                    <div className="text-sm font-medium truncate" title={attachment.filename}>
                      {attachment.filename || `adjunto-${index+1}`}
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between items-center mt-1">
                      <span>{attachment.size ? `${Math.round(attachment.size / 1024)} KB` : 'Tamaño desconocido'}</span>
                      <button 
                        className="text-blue-600 hover:text-blue-800 p-1"
                        onClick={() => handleDownloadAttachment(attachment)}
                        aria-label="Descargar archivo"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Visualizador de imagen expandida */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={handleCloseImageViewer}
        >
          <div className="max-w-4xl max-h-screen overflow-auto bg-white rounded-lg p-2">
            <div className="text-right mb-2">
              <button 
                className="text-gray-700 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100"
                onClick={handleCloseImageViewer}
              >
                ✕
              </button>
            </div>
            {getFileExtension(expandedImage.filename) === 'tiff' || 
             getFileExtension(expandedImage.filename) === 'tif' ? (
              // Temporalmente deshabilitado el visor TIFF por problemas de compatibilidad
              <div className="p-4 bg-gray-100 rounded text-center">
                <p className="text-gray-600 mb-2">Vista previa de TIFF temporalmente no disponible</p>
                <p className="text-sm text-gray-500">El visor de archivos TIFF está siendo actualizado</p>
              </div>
            ) : (
              <img 
                src={expandedImage.dataUrl} 
                alt={expandedImage.filename}
                className="max-w-full"
              />
            )}
            <div className="mt-2 text-center text-sm text-gray-600">
              {expandedImage.filename}
            </div>
          </div>
        </div>
      )}

      
      {/* Panel de comentarios internos */}
      <EmailComments emailId={email.id} />

      {/* Acciones rápidas */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Button
            onClick={onReply}
            variant="primary"
            size="sm"
            className="flex items-center"
          >
            <Reply size={16} className="mr-1" />
            Responder
          </Button>
        </div>
      </div>
    </div>
  );
};

// Exportación simple sin memo
export default EmailDetail;
