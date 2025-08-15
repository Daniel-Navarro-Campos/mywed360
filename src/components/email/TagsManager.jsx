import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash, X, Check, Circle } from 'lucide-react';
import Button from '../Button';
import { useAuth } from '../../hooks/useAuth';
import { 
  getUserTags,
  getCustomTags, 
  createTag, 
  deleteTag,
  SYSTEM_TAGS
} from '../../services/tagService';
import { toast } from 'react-toastify';
import { safeRender, ensureNotPromise, safeMap } from '../../utils/promiseSafeRenderer';

/**
 * Componente para administrar todas las etiquetas del usuario
 */
const TagsManager = () => {
  const [tags, setTags] = useState([]);
  const [systemTags, setSystemTags] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#64748b'); // Color predeterminado
  const { currentUser } = useAuth();
  
  // Colores disponibles para etiquetas
  const colorOptions = [
    '#e53e3e', // Rojo
    '#dd6b20', // Naranja
    '#d69e2e', // Amarillo
    '#38a169', // Verde
    '#3182ce', // Azul
    '#805ad5', // Morado
    '#d53f8c', // Rosa
    '#64748b', // Gris
    '#000000', // Negro
  ];
  
  // Cargar etiquetas al montar el componente
  useEffect(() => {
    if (!currentUser) return;
    loadTags();
  }, [currentUser]);
  
  // Cargar etiquetas del usuario
  const loadTags = () => {
    if (!currentUser) return;
    
    // Obtener etiquetas personalizadas
    const customTags = getCustomTags(currentUser.uid);
    setTags(customTags);
    
    // Establecer etiquetas del sistema
    setSystemTags(SYSTEM_TAGS);
  };
  
  // Crear nueva etiqueta
  const handleCreateTag = () => {
    if (!currentUser || !newTagName.trim()) return;
    
    try {
      // Crear etiqueta
      createTag(currentUser.uid, newTagName.trim(), newTagColor);
      
      // Limpiar formulario
      setNewTagName('');
      setNewTagColor('#64748b');
      setIsCreating(false);
      
      // Recargar etiquetas
      loadTags();
      
      // Notificar éxito
      toast.success(`Etiqueta "${newTagName.trim()}" creada con éxito`);
    } catch (error) {
      console.error('Error al crear etiqueta:', error);
      toast.error(`Error: ${error.message || 'No se pudo crear la etiqueta'}`);
    }
  };
  
  // Eliminar etiqueta
  const handleDeleteTag = (tagId, tagName) => {
    if (!currentUser) return;
    
    if (confirm(`¿Estás seguro de eliminar la etiqueta "${tagName}"?`)) {
      try {
        // Eliminar etiqueta
        deleteTag(currentUser.uid, tagId);
        
        // Recargar etiquetas
        loadTags();
        
        // Notificar éxito
        toast.success(`Etiqueta "${tagName}" eliminada con éxito`);
      } catch (error) {
        console.error('Error al eliminar etiqueta:', error);
        toast.error(`Error: ${error.message || 'No se pudo eliminar la etiqueta'}`);
      }
    }
  };
  
  return (
    <div className="bg-white border rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h3 className="text-lg font-medium text-gray-900">Gestionar etiquetas</h3>
        <p className="mt-1 text-sm text-gray-600">
          Crea y organiza etiquetas para clasificar tus correos
        </p>
      </div>
      
      <div className="px-4 py-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Etiquetas del sistema</h4>
        <div className="space-y-2 mb-4">
          {systemTags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm font-medium">{tag.name}</span>
              </div>
              <span className="text-xs text-gray-500 italic">Predefinida</span>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Etiquetas personalizadas</h4>
            {!isCreating && (
              <Button 
                onClick={() => setIsCreating(true)}
                variant="secondary"
                size="sm"
                className="text-xs py-1 px-2"
              >
                <Plus size={14} className="mr-1" />
                Nueva etiqueta
              </Button>
            )}
          </div>
          
          {/* Formulario para crear etiqueta */}
          {isCreating && (
            <div className="mb-4 p-3 border border-gray-200 bg-gray-50 rounded-md">
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre de la etiqueta
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Nombre de la etiqueta"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <div
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full cursor-pointer flex items-center justify-center ${newTagColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    >
                      {newTagColor === color && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2 mt-2">
                <Button 
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="text-xs py-1.5"
                  size="sm"
                >
                  <Check size={14} className="mr-1" />
                  Crear etiqueta
                </Button>
                <Button 
                  onClick={() => {
                    setIsCreating(false);
                    setNewTagName('');
                    setNewTagColor('#64748b');
                  }}
                  variant="secondary"
                  className="text-xs py-1.5"
                  size="sm"
                >
                  <X size={14} className="mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {tags.length === 0 && !isCreating && (
              <p className="text-sm text-gray-500 text-center py-4">
                No has creado etiquetas personalizadas
              </p>
            )}
            
            {safeMap(tags, []).map((tag) => (
              <div key={safeRender(tag.id, '')} className="flex items-center justify-between py-2 px-3 border border-gray-200 rounded-md">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: safeRender(tag.color, '#64748b') }}
                  />
                  <span className="text-sm">{safeRender(tag.name, '')}</span>
                </div>
                <Button 
                  onClick={() => handleDeleteTag(safeRender(tag.id, ''), safeRender(tag.name, ''))}
                  variant="danger"
                  className="text-xs py-1 px-2"
                  size="sm"
                >
                  <Trash size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagsManager;
