import React, { useState, useEffect } from 'react';
import { Folder, Plus, Edit2, Trash2, X, Check, MoreVertical, FolderPlus } from 'lucide-react';
import Button from '../Button';

/**
 * Componente para gestionar carpetas personalizadas de correo
 * Permite crear, editar y eliminar carpetas para organizar correos
 */
const CustomFolders = ({ folders = [], onSelectFolder, activeFolder, onCreateFolder, onRenameFolder, onDeleteFolder }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMenuForId, setShowMenuForId] = useState(null);
  
  // Manejar creación de nueva carpeta
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreating(false);
  };
  
  // Manejar renombrado de carpeta
  const handleRenameFolder = (folderId) => {
    if (!newFolderName.trim()) return;
    
    onRenameFolder(folderId, newFolderName.trim());
    setNewFolderName('');
    setIsEditing(false);
    setEditingFolderId(null);
  };
  
  // Iniciar edición de carpeta
  const startEditing = (folder) => {
    setIsEditing(true);
    setEditingFolderId(folder.id);
    setNewFolderName(folder.name);
    setShowMenuForId(null);
  };
  
  // Cancelar edición o creación
  const cancelAction = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingFolderId(null);
    setNewFolderName('');
  };
  
  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenuForId(null);
    };
    
    if (showMenuForId) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showMenuForId]);
  
  return (
    <div className="space-y-1 my-4">
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="font-medium text-gray-700">Carpetas personalizadas</h3>
        <button
          onClick={() => {
            setIsCreating(true);
            setIsEditing(false);
            setNewFolderName('');
          }}
          className="text-blue-600 hover:text-blue-800"
          title="Crear carpeta"
        >
          <FolderPlus size={16} />
        </button>
      </div>
      
      {/* Lista de carpetas */}
      {folders.map(folder => (
        <div key={folder.id} className="relative">
          {isEditing && editingFolderId === folder.id ? (
            <div className="flex items-center px-1">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="flex-grow py-1 px-2 text-sm border rounded"
                placeholder="Nombre de carpeta"
                autoFocus
              />
              <button 
                onClick={() => handleRenameFolder(folder.id)}
                className="p-1 text-green-600 hover:text-green-800"
                title="Guardar"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={cancelAction}
                className="p-1 text-red-600 hover:text-red-800"
                title="Cancelar"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div 
              className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer ${
                activeFolder === folder.id ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              onClick={() => onSelectFolder(folder.id)}
            >
              <div className="flex items-center truncate">
                <Folder size={16} className="mr-2 text-gray-500" />
                <span className="truncate">{folder.name}</span>
                {folder.unread > 0 && (
                  <span className="ml-2 text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5">
                    {folder.unread}
                  </span>
                )}
              </div>
              
              {/* Menú de opciones */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenuForId(showMenuForId === folder.id ? null : folder.id);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-200"
                >
                  <MoreVertical size={14} />
                </button>
                
                {showMenuForId === folder.id && (
                  <div className="absolute right-0 mt-1 bg-white border rounded shadow-md z-10 w-32">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(folder);
                      }}
                      className="flex items-center w-full text-left px-3 py-2 hover:bg-gray-100"
                    >
                      <Edit2 size={14} className="mr-2" /> Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                        setShowMenuForId(null);
                      }}
                      className="flex items-center w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
                    >
                      <Trash2 size={14} className="mr-2" /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Formulario para nueva carpeta */}
      {isCreating && (
        <div className="flex items-center px-1 mt-1">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-grow py-1 px-2 text-sm border rounded"
            placeholder="Nombre de carpeta"
            autoFocus
          />
          <button 
            onClick={handleCreateFolder}
            className="p-1 text-green-600 hover:text-green-800"
            title="Guardar"
          >
            <Check size={16} />
          </button>
          <button 
            onClick={cancelAction}
            className="p-1 text-red-600 hover:text-red-800"
            title="Cancelar"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Mensaje si no hay carpetas */}
      {folders.length === 0 && !isCreating && (
        <div className="text-center py-2 text-sm text-gray-500">
          <p>No hay carpetas personalizadas</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1"
            onClick={() => setIsCreating(true)}
          >
            <Plus size={14} className="mr-1" /> Crear carpeta
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomFolders;
