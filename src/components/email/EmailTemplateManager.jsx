import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Edit, Trash, Plus, Save, Copy, AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';
import * as EmailService from '../../services/EmailService';
import templateCache from '../../services/TemplateCacheService';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import useEmailMonitoring from '../../hooks/useEmailMonitoring';

/**
 * Componente para gestionar plantillas de email personalizadas
 * Permite crear, editar, eliminar y utilizar plantillas predefinidas para diferentes tipos de comunicación
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onSelectTemplate - Función llamada al seleccionar una plantilla
 * @param {Function} props.onClose - Función para cerrar el gestor de plantillas
 * @returns {React.ReactElement} Gestor de plantillas de email
 */
const EmailTemplateManager = ({ onSelectTemplate, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Inicializar hook de monitoreo
  const {
    trackTemplateUsage,
    trackTemplateSearch,
    logEmailError,
    measureTemplateRendering
  } = useEmailMonitoring();
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [templatesPerPage, setTemplatesPerPage] = useState(10);
  
  // Detectar dispositivos móviles
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Ajustar elementos por página basado en el tamaño de pantalla
  useEffect(() => {
    if (isMobile) {
      setTemplatesPerPage(5);
    } else {
      setTemplatesPerPage(10);
    }
  }, [isMobile]);
  
  // Categorías ordenadas para mostrar en el gestor
  const [categories] = useState([
    'Proveedores - Solicitud de información',
    'Proveedores - Confirmación',
    'Proveedores - Cancelación',
    'Proveedores - Seguimiento',
    'Invitados - Información',
    'Invitados - Recordatorio',
    'Seguimiento',
    'General'
  ]);
  
  // Estado para controlar categorías expandidas
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // Estado para saber si se está usando caché
  const [usingCache, setUsingCache] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0
  });
  
  // Cargar plantillas existentes
  const loadTemplates = async (bypassCache = false) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Iniciar medición de tiempo
      const startTime = performance.now();
      
      // Usar el hook de monitoreo para trackear la operación
      const templateList = await trackTemplateUsage(
        'all', // templateId
        'all', // category
        'load', // action
        async () => {
          // Obtener plantillas con o sin caché según el parámetro
          return await EmailService.getEmailTemplates(bypassCache);
        },
        { operation: 'loadAll', bypassCache }
      );
      
      // Finalizar medición de tiempo
      const endTime = performance.now();
      const loadTime = Math.round(endTime - startTime);
      
      // Actualizar estado de caché
      setUsingCache(!bypassCache);
      
      // Registrar rendimiento
      measureTemplateRendering('load', loadTime, {
        count: templateList?.length || 0,
        fromCache: !bypassCache
      });
      
      // Registrar estadísticas
      if (!bypassCache) {
        setCacheStats(prevStats => ({
          hits: prevStats.hits + 1,
          misses: prevStats.misses
        }));
      } else {
        setCacheStats(prevStats => ({
          hits: prevStats.hits,
          misses: prevStats.misses + 1
        }));
      }
      
      setTemplates(templateList || []);
    } catch (err) {
      logEmailError('template_load', err, { operation: 'loadTemplates', bypassCache });
      console.error('Error al cargar plantillas:', err);
      setError('No se pudieron cargar las plantillas');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para recargar plantillas ignorando la caché
  const refreshTemplates = () => {
    loadTemplates(true);
  };
  
  // Cargar plantillas al iniciar el componente
  useEffect(() => {    
    loadTemplates();
  }, []);
  
  // Filtrar plantillas basado en término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTemplates(templates);
      return;
    }
    
    // Usar trackTemplateSearch para monitorear la búsqueda de plantillas
    trackTemplateSearch(searchTerm, 'all', () => {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = templates.filter(template => 
        template.name.toLowerCase().includes(lowercasedSearch) || 
        template.category.toLowerCase().includes(lowercasedSearch) ||
        template.subject.toLowerCase().includes(lowercasedSearch) ||
        template.body.toLowerCase().includes(lowercasedSearch)
      );
      
      setFilteredTemplates(filtered);
      setCurrentPage(1); // Reiniciar a primera página al buscar
      
      return filtered;
    });
  }, [searchTerm, templates, trackTemplateSearch]);
  
  // Calcular plantillas para la página actual
  const currentTemplates = useMemo(() => {
    const indexOfLastTemplate = currentPage * templatesPerPage;
    const indexOfFirstTemplate = indexOfLastTemplate - templatesPerPage;
    return filteredTemplates.slice(indexOfFirstTemplate, indexOfLastTemplate);
  }, [currentPage, templatesPerPage, filteredTemplates]);
  
  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Calcular número total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(filteredTemplates.length / templatesPerPage);
  }, [filteredTemplates, templatesPerPage]);
  
  // Manejar cambios en campo de búsqueda
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);
  
  // Alternar expansión de categoría
  const toggleCategory = useCallback((category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);
  
  // Función para restablecer las plantillas predefinidas del sistema
  const handleResetTemplates = async () => {
    if (!window.confirm('¿Estás seguro de que deseas restablecer todas las plantillas predefinidas? Esta acción no eliminará tus plantillas personalizadas.')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const restoredTemplates = await EmailService.resetPredefinedTemplates();
      setTemplates(restoredTemplates);
      setSuccess('Se han restablecido correctamente las plantillas predefinidas');
      
      // Ocultar el mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Error al restablecer plantillas predefinidas:', err);
      setError('No se pudieron restablecer las plantillas predefinidas');
    } finally {
      setLoading(false);
    }
  };
  
  // Configurar una plantilla nueva para edición
  const handleCreateNew = () => {
    setEditingTemplate({
      id: `template_${Date.now()}`,
      name: '',
      category: 'Proveedores - Solicitud de información',
      subject: '',
      body: '',
      isSystem: false,
      variables: []
    });
    setEditMode(true);
  };
  
  // Configurar una plantilla existente para edición
  const handleEdit = (template) => {
    setEditingTemplate({ ...template });
    setEditMode(true);
  };
  
  // Duplicar una plantilla existente
  const handleDuplicate = (template) => {
    setEditingTemplate({
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copia)`,
      isSystem: false
    });
    setEditMode(true);
  };
  
  // Eliminar una plantilla
  const handleDelete = async (templateId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      try {
        await EmailService.deleteEmailTemplate(templateId);
        
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      } catch (err) {
        console.error('Error al eliminar plantilla:', err);
        setError('No se pudo eliminar la plantilla');
      }
    }
  };
  
  // Manejar cambios en el formulario de edición
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditingTemplate(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Detectar variables en el contenido del email
  const detectVariables = (content) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set();
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1].trim());
    }
    
  // Guardar una plantilla (nueva o editada)
  const handleSaveTemplate = async () => {
    if (!editingTemplate?.subject || !editingTemplate?.body) {
      setError('El asunto y el cuerpo de la plantilla son obligatorios');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Medir tiempo de renderizado para el monitor de rendimiento
      const renderStart = performance.now();
      
      // Detectar variables en contenido
      const variables = detectVariables(editingTemplate.body);
      
      // Preparar plantilla con fecha y variables
      const templateToSave = {
        ...editingTemplate,
        variables,
        lastUpdated: new Date().toISOString()
      };
      
      // Si es una plantilla nueva, generar ID único
      if (!templateToSave.id) {
        templateToSave.id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Guardar mediante el servicio
      const savedTemplate = await trackTemplateUsage(
        templateToSave.id,
        templateToSave.category || 'Sin categoría',
        'save',
        async () => EmailService.saveEmailTemplate(templateToSave),
        { operation: 'saveTemplate' }
      );
      
      // Medir tiempo de guardado
      const renderEnd = performance.now();
      measureTemplateRendering('save', renderEnd - renderStart, { template: templateToSave.id });
      
      // Actualizar la lista de plantillas
      await loadTemplates(true); // Forzar actualización ignorando caché
      
      // Registrar uso de la plantilla para mejorar precarga
      if (savedTemplate && savedTemplate.category) {
        templateCache.registerTemplateUsage(savedTemplate.id, savedTemplate.category);
      }
      
      setSuccess('Plantilla guardada correctamente');
      setEditMode(false);
      setEditingTemplate(null);
    } catch (err) {
      logEmailError('template_save', err, { templateId: editingTemplate?.id });
      console.error('Error al guardar plantilla:', err);
      setError('No se pudo guardar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  // Usar una plantilla
  const handleUseTemplate = (template) => {
    // Monitorear el uso de la plantilla
    trackTemplateUsage(
      template.id, 
      template.category || 'Sin categoría', 
      'use', 
      async () => {
        // Registrar uso en la caché para mejorar precarga
        templateCache.registerTemplateUsage(template.id, template.category || 'Sin categoría');
        
        // Guardar en caché para acceso rápido
        templateCache.cacheTemplate(template);
        
        if (onSelectTemplate) {
          onSelectTemplate(template);
        }
        if (onClose) {
          onClose();
        }
      },
      { operation: 'useTemplate' }
    );
  };
  
  // Modo de visualización de plantillas
  const renderTemplateList = () => {
    if (loading) {
      return <div className="text-center py-8">Cargando plantillas...</div>;
    }
    
    if (templates.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No hay plantillas disponibles. 
          <div className="flex justify-center space-x-4 mt-4">
            <button 
              onClick={handleCreateNew}
              className="text-blue-500 hover:underline"
            >
              Crear una nueva
            </button>
            <button 
              onClick={handleResetTemplates}
              className="text-blue-500 hover:underline"
            >
              Restablecer plantillas predefinidas
            </button>
          </div>
        </div>
      );
    }
    
    // Si hay búsqueda pero no hay resultados
    if (searchTerm && filteredTemplates.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No se encontraron plantillas que coincidan con "{searchTerm}".
          <div className="mt-4">
            <button 
              onClick={() => setSearchTerm('')}
              className="text-blue-500 hover:underline"
            >
              Limpiar búsqueda
            </button>
          </div>
        </div>
      );
    }
    
    // Agrupar plantillas por categoría
    const groupedTemplates = {};
    categories.forEach(category => {
      groupedTemplates[category] = templates.filter(t => t.category === category);
    });
    
    // Plantillas sin categoría
    const uncategorized = templates.filter(t => !categories.includes(t.category));
    if (uncategorized.length > 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay plantillas disponibles. 
        <div className="flex justify-center space-x-4 mt-4">
          <button 
            onClick={handleCreateNew}
            className="text-blue-500 hover:underline"
          >
            Crear una nueva
          </button>
          <button 
            onClick={handleResetTemplates}
            className="text-blue-500 hover:underline"
          >
            Restablecer plantillas predefinidas
          </button>
        </div>
      </div>
    );
  }
  
  // Si hay búsqueda pero no hay resultados
  if (searchTerm && filteredTemplates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron plantillas que coincidan con "{searchTerm}".
        <div className="mt-4">
          <button 
            onClick={() => setSearchTerm('')}
            className="text-blue-500 hover:underline"
          >
            Limpiar búsqueda
          </button>
        </div>
      </div>
    );
  }
  
  // Agrupar plantillas por categoría
  const groupedTemplates = {};
  categories.forEach(category => {
    groupedTemplates[category] = templates.filter(t => t.category === category);
  });
  
  // Plantillas sin categoría
  const uncategorized = templates.filter(t => !categories.includes(t.category));
  if (uncategorized.length > 0) {
    groupedTemplates['Otras'] = uncategorized;
  }
  
  return editMode ? renderTemplateEditor() : (
    <div className="space-y-4">
      {/* Barra superior con búsqueda y estado de caché */}
      <div className="flex flex-col sm:flex-row items-center mb-6 gap-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500" />
          </div>
          <input
            type="text"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Buscar plantillas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Indicador de caché y botón de recarga */}
        <div className="flex items-center gap-2">
          {usingCache && (
            <div className="text-xs flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <Zap className="w-3 h-3" /> 
              <span>Caché activa</span>
            </div>
          )}
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={refreshTemplates} 
            title="Recargar plantillas (ignorar caché)"
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> 
            <span className="hidden sm:inline">Recargar</span>
          </Button>
        </div>
      </div>
      
      {/* Estadísticas de caché */}
      {(cacheStats.hits > 0 || cacheStats.misses > 0) && (
        <div className="mb-4 text-xs text-gray-500 flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded">
          <div>Rendimiento de caché:</div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-green-600">{cacheStats.hits}</span> aciertos
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-amber-600">{cacheStats.misses}</span> fallos
          </div>
          {cacheStats.hits > 0 && (
            <div className="text-xs">
              <span className="font-medium text-blue-600">
                {Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100)}%
              </span> efectividad
            </div>
          )}
        </div>
      )}
      
      {/* Lista de plantillas por categoría */}
      {categories.map(category => {
        // Filtrar plantillas por categoría (usando la lista filtrada si hay búsqueda)
        const categoryTemplates = currentTemplates.filter(t => t.category === category);
        
        if (categoryTemplates.length === 0) return null;
        
        const isExpanded = expandedCategories[category] !== false; // Por defecto expandido
        
        return (
          <div key={category} className="border rounded-lg overflow-hidden shadow-sm">
            <div 
              className="bg-gray-100 p-3 cursor-pointer flex justify-between items-center transition-colors hover:bg-gray-200"
              onClick={() => toggleCategory(category)}
            >
              <h3 className="font-medium">{category}</h3>
              <ChevronDown 
                size={18} 
                className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </div>
            
            {isExpanded && (
              <div className="divide-y">
                {categoryTemplates.map(template => (
                  <div key={template.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className={isMobile ? "w-2/3" : "w-3/4"}>
                        <h4 className="font-medium truncate">{template.name}</h4>
                        <p className="text-sm text-gray-500 truncate">{template.subject}</p>
                      </div>
                      
                      <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
                        <button 
                          onClick={() => handleSelect(template)}
                          className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                          title="Usar esta plantilla"
                        >
                          <Copy size={isMobile ? 14 : 16} />
                        </button>
                        
                        <button 
                          onClick={() => handleEdit(template)}
                          className="p-1 text-green-500 hover:bg-green-50 rounded"
                          title="Editar plantilla"
                        >
                          <Edit size={isMobile ? 14 : 16} />
                        </button>
                        
                        {!template.isSystem && (
                          <button 
                            onClick={() => handleDelete(template.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Eliminar plantilla"
                    <div className="mt-1 text-sm text-gray-600">
                      Asunto: {template.subject}
                    </div>
                    {template.variables.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.variables.map(variable => (
                          <span 
                            key={variable} 
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Modo de edición de plantilla
  const renderTemplateEditor = () => {
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
            <AlertCircle size={18} className="flex-shrink-0 mr-2" />
            <span>{error}</span>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la plantilla:</label>
          <input
            type="text"
            name="name"
            value={editingTemplate.name}
            onChange={handleFormChange}
            className="w-full border border-gray-300 rounded-md p-2"
            placeholder="Ej: Solicitud de presupuesto"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría:</label>
          <div className="relative">
            <select
              name="category"
              value={editingTemplate.category}
              onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-md p-2 pr-8 appearance-none"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-3 pointer-events-none text-gray-500" />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asunto:</label>
          <input
            type="text"
            name="subject"
            value={editingTemplate.subject}
            onChange={handleFormChange}
            className="w-full border border-gray-300 rounded-md p-2"
            placeholder="Ej: Solicitud de información para {{servicio}}"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido del email:</label>
          <textarea
            name="body"
            value={editingTemplate.body}
            onChange={handleFormChange}
            className="w-full border border-gray-300 rounded-md p-2"
            rows="10"
            placeholder="Escribe el contenido de la plantilla aquí..."
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">
            Usa {{variable}} para crear campos dinámicos (ej: {{nombre_proveedor}}, {{fecha_boda}})
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleCancelEdit}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveTemplate}
            className="flex items-center"
          >
            <Save size={18} className="mr-1" />
            Guardar plantilla
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-xl font-bold mb-2 sm:mb-0">Plantillas de email</h2>
        {!editMode && (
          <div className={`flex ${isMobile ? 'w-full justify-between' : 'space-x-2'}`}>
            <Button
              variant="outline"
              onClick={handleResetTemplates}
              className="flex items-center"
              title="Restablecer plantillas predefinidas"
              size={isMobile ? "sm" : "md"}
            >
              <RefreshCw size={isMobile ? 14 : 16} className="mr-1" />
              {isMobile ? "Restablecer" : "Restablecer plantillas"}
            </Button>
            <Button
              onClick={handleCreateNew}
              className="flex items-center"
              size={isMobile ? "sm" : "md"}
            >
              <Plus size={isMobile ? 14 : 16} className="mr-1" />
              {isMobile ? "Nueva" : "Nueva plantilla"}
            </Button>
          </div>
        )}
      </div>
      
      {/* Mensajes de estado */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700 mb-4">
          <AlertCircle size={18} className="flex-shrink-0 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700 mb-4">
          <span>{success}</span>
        </div>
      )}
      
      {editMode ? renderTemplateEditor() : renderTemplateList()}
    </div>
  );
};

export default EmailTemplateManager;
