import React, { useState } from 'react';
import { 
  Inbox, 
  Send, 
  Star, 
  Trash, 
  Plus, 
  Mail, 
  Tag, 
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import Button from "../../Button";

/**
 * Componente de navegación lateral para la bandeja de entrada unificada
 * Permite cambiar entre carpetas y muestra estadísticas
 *
 * @param {Object} props - Propiedades del componente
 * @param {string} props.currentFolder - Carpeta actual seleccionada
 * @param {Function} props.onFolderChange - Función para cambiar de carpeta
 * @param {Object} props.folderStats - Estadísticas de cada carpeta
 * @param {Function} props.onComposeNew - Función para crear nuevo email
 * @returns {JSX.Element} Componente de navegación
 */
const InboxNavigation = ({ 
  currentFolder, 
  onFolderChange, 
  folderStats, 
  onComposeNew 
}) => {
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(true);
  const [isContactsExpanded, setIsContactsExpanded] = useState(false);

  // Lista de carpetas principales con sus iconos y nombres
  const mainFolders = [
    { id: 'inbox', name: 'Bandeja de entrada', icon: <Inbox size={18} /> },
    { id: 'sent', name: 'Enviados', icon: <Send size={18} /> },
    { id: 'important', name: 'Importantes', icon: <Star size={18} /> },
    { id: 'trash', name: 'Papelera', icon: <Trash size={18} /> }
  ];

  // Etiquetas disponibles
  const labels = [
    { id: 'providers', name: 'Proveedores', color: 'bg-blue-500' },
    { id: 'guests', name: 'Invitados', color: 'bg-green-500' },
    { id: 'important', name: 'Importantes', color: 'bg-yellow-500' },
    { id: 'personal', name: 'Personal', color: 'bg-purple-500' }
  ];

  return (
    <div className="w-64 h-full bg-white border-r overflow-y-auto flex-shrink-0">
      <div className="p-4">
        {/* Botón de nuevo email */}
        <Button
          onClick={onComposeNew}
          className="w-full mb-4 flex items-center justify-center"
          primary
        >
          <Plus size={16} className="mr-2" />
          Nuevo email
        </Button>

        {/* Carpetas principales */}
        <div className="space-y-1 mb-6">
          {mainFolders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onFolderChange(folder.id)}
              className={`w-full text-left px-3 py-2 rounded flex items-center ${
                currentFolder === folder.id
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="mr-2">{folder.icon}</span>
              {folder.name}
              
              {/* Contador de no leídos o total */}
              {folderStats[folder.id] && (
                <span className={`ml-auto ${
                  folderStats[folder.id].unread > 0 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                } text-xs rounded-full w-6 h-6 flex items-center justify-center`}>
                  {folderStats[folder.id].unread || folderStats[folder.id].total || 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sección de etiquetas */}
        <div className="mb-4">
          <button
            onClick={() => setIsLabelsExpanded(!isLabelsExpanded)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
          >
            <div className="flex items-center">
              <Tag size={16} className="mr-2" />
              <span>Etiquetas</span>
            </div>
            {isLabelsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {isLabelsExpanded && (
            <div className="mt-1 space-y-1 ml-4">
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center px-3 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm"
                >
                  <span className={`w-3 h-3 rounded-full ${label.color} mr-2`}></span>
                  {label.name}
                </div>
              ))}
              
              {/* Añadir nueva etiqueta */}
              <div className="flex items-center px-3 py-1 hover:bg-gray-100 rounded cursor-pointer text-sm text-blue-600">
                <Plus size={14} className="mr-1" />
                Añadir etiqueta
              </div>
            </div>
          )}
        </div>

        {/* Sección de contactos */}
        <div className="mb-4">
          <button
            onClick={() => setIsContactsExpanded(!isContactsExpanded)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
          >
            <div className="flex items-center">
              <Mail size={16} className="mr-2" />
              <span>Contactos frecuentes</span>
            </div>
            {isContactsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {isContactsExpanded && (
            <div className="mt-1 space-y-1 ml-4">
              <div className="text-xs text-gray-500 px-3 py-1">
                Aquí aparecerán tus contactos frecuentes
              </div>
            </div>
          )}
        </div>

        {/* Configuración */}
        <div className="pt-4 border-t mt-4">
          <button
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <Settings size={16} className="mr-2" />
            <span>Configuración</span>
          </button>
          
          <div className="text-xs text-gray-500 mt-4 px-3">
            Almacenamiento: <span className="font-medium">23% usado</span>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '23%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxNavigation;
