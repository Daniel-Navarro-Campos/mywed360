import React, { useState, useEffect } from 'react';
import { Tag, X, Plus, Check } from 'lucide-react';
import Button from '../Button';
import { useAuth } from '../../hooks/useAuth';
import { 
  getUserTags, 
  getEmailTagsDetails, 
  addTagToEmail, 
  removeTagFromEmail 
} from '../../services/tagService';

/**
 * Componente para gestionar etiquetas de un correo electrónico
 */
const EmailTagsManager = ({ emailId, onTagsChange }) => {
  const [tags, setTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [isSelectingTag, setIsSelectingTag] = useState(false);
  const { currentUser } = useAuth();
  
  // Cargar etiquetas del correo y todas las disponibles
  useEffect(() => {
    if (!currentUser || !emailId) return;
    
    // Obtener todas las etiquetas disponibles
    const availableTags = getUserTags(currentUser.uid);
    setAllTags(availableTags);
    
    // Obtener etiquetas del correo
    const emailTags = getEmailTagsDetails(currentUser.uid, emailId);
    setTags(emailTags);
  }, [currentUser, emailId]);
  
  // Añadir etiqueta al correo
  const handleAddTag = async (tagId) => {
    if (!currentUser || !emailId) return;
    
    try {
      // Añadir etiqueta
      // Llamada a backend para tests E2E
      await fetch(`/api/email/${emailId}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId })
      });

      // Persistencia local (mock)
      addTagToEmail(currentUser.uid, emailId, tagId);
      
      // Actualizar etiquetas del correo
      const updatedTags = getEmailTagsDetails(currentUser.uid, emailId);
      setTags(updatedTags);
      
      // Cerrar selector
      setIsSelectingTag(false);
      
      // Notificar cambio
      if (onTagsChange) {
        onTagsChange(updatedTags);
      }
    } catch (error) {
      console.error('Error al añadir etiqueta:', error);
    }
  };
  
  // Quitar etiqueta del correo
  const handleRemoveTag = async (tagId) => {
    if (!currentUser || !emailId) return;
    
    try {
      // Quitar etiqueta
      await fetch(`/api/email/${emailId}/tag`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId })
      });

      removeTagFromEmail(currentUser.uid, emailId, tagId);
      
      // Actualizar etiquetas del correo
      const updatedTags = getEmailTagsDetails(currentUser.uid, emailId);
      setTags(updatedTags);
      
      // Notificar cambio
      if (onTagsChange) {
        onTagsChange(updatedTags);
      }
    } catch (error) {
      console.error('Error al quitar etiqueta:', error);
    }
  };
  
  return (
    <div className="mt-2">
      {/* Etiquetas actuales */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <div 
            key={tag.id}
            data-testid="email-tag"
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ 
              backgroundColor: `${tag.color}20`,
              color: tag.color,
              borderColor: `${tag.color}50`,
              borderWidth: '1px'
            }}
          >
            <span>{tag.name}</span>
            <button 
              data-testid="remove-tag-button"
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-1 rounded-full hover:bg-opacity-20 hover:bg-gray-600 remove-tag-button"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        
        {/* Botón para añadir etiqueta */}
        {!isSelectingTag ? (
          <button 
            data-testid="tag-menu-button"
            onClick={() => setIsSelectingTag(true)}
            className="inline-flex items-center rounded-full border border-dashed border-gray-300 px-2.5 py-0.5 text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50"
          >
            <Plus size={12} className="mr-1" /> 
            Añadir etiqueta
          </button>
        ) : (
          <button 
            onClick={() => setIsSelectingTag(false)}
            className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
          >
            <X size={12} className="mr-1" /> 
            Cancelar
          </button>
        )}
      </div>
      
      {/* Selector de etiquetas */}
      {isSelectingTag && (
        <div className="mt-1 p-2 border rounded-md bg-white shadow-sm max-h-32 overflow-y-auto">
          <div className="space-y-1">
            {allTags
              .filter(tag => !tags.some(t => t.id === tag.id))
              .map(tag => (
                <div
                  key={tag.id}
                  data-testid="tag-option"
                  onClick={() => handleAddTag(tag.id)}
                  className="flex items-center px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm">{tag.name}</span>
                </div>
              ))}
              
            {allTags.filter(tag => !tags.some(t => t.id === tag.id)).length === 0 && (
              <div className="text-center py-2 text-xs text-gray-500">
                No hay más etiquetas disponibles
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTagsManager;
