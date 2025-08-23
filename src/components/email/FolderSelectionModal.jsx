import React, { useState, useEffect, useRef } from 'react';
import { X, Folder, Check, Search } from 'lucide-react';
import Button from '../Button';

/**
 * Modal para seleccionar una carpeta personalizada
 * Usado para mover correos entre carpetas
 * Con soporte de accesibilidad mejorado
 */
const FolderSelectionModal = ({ 
  isOpen, 
  onClose, 
  folders = [], 
  onSelectFolder, 
  title = 'Seleccionar carpeta',
  description = 'Seleccione una carpeta para mover el correo'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFolders, setFilteredFolders] = useState(folders);
  const [focusedFolderIndex, setFocusedFolderIndex] = useState(-1);
  
  // Referencias para gestionar el foco
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);
  const folderRefs = useRef([]);
  
  // Actualizar carpetas filtradas cuando cambie el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFolders(folders);
      return;
    }
    
    const filtered = folders.filter(folder => 
      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFolders(filtered);
    // Resetear el índice de foco cuando cambian las carpetas filtradas
    setFocusedFolderIndex(-1);
  }, [searchTerm, folders]);
  
  // Enfocar el campo de búsqueda cuando se abre el modal
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Pequeño retraso para asegurar que el DOM está listo
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);
  
  // Preparar refs para las carpetas
  useEffect(() => {
    folderRefs.current = folderRefs.current.slice(0, filteredFolders.length);
  }, [filteredFolders]);
  
  // Manejar navegación por teclado
  const handleKeyDown = (e) => {
    const folderCount = filteredFolders.length;
    
    if (folderCount === 0) return;
    
    // ESC para cerrar el modal
    if (e.key === 'Escape') {
      onClose();
    }
    // Flecha abajo para navegar hacia abajo en la lista
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedFolderIndex(prevIndex => {
        const newIndex = prevIndex < folderCount - 1 ? prevIndex + 1 : 0;
        if (folderRefs.current[newIndex]) {
          folderRefs.current[newIndex].focus();
        }
        return newIndex;
      });
    }
    // Flecha arriba para navegar hacia arriba en la lista
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedFolderIndex(prevIndex => {
        const newIndex = prevIndex > 0 ? prevIndex - 1 : folderCount - 1;
        if (folderRefs.current[newIndex]) {
          folderRefs.current[newIndex].focus();
        }
        return newIndex;
      });
    }
  };
  
  // Cerrar el modal cuando se hace clic fuera
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };
  
  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
      onClick={handleOutsideClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="folder-modal-title"
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-md" 
        ref={modalRef}
        tabIndex="-1"
      >
        {/* Cabecera */}
        <header className="flex items-center justify-between p-4 border-b">
          <h2 
            id="folder-modal-title" 
            className="text-lg font-semibold text-gray-800"
          >
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 p-1 rounded-full"
            aria-label="Cerrar diálogo"
          >
            <X size={20} />
          </button>
        </header>
        
        {/* Descripción */}
        <div className="p-4 border-b">
          <p id="folder-modal-description" className="text-sm text-gray-700">{description}</p>
          
          {/* Búsqueda */}
          <div className="mt-3 relative">
            <label htmlFor="folder-search" className="sr-only">Buscar carpetas</label>
            <input
              id="folder-search"
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar carpetas..."
              className="w-full py-2 pl-10 pr-4 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              aria-describedby="folder-modal-description"
              aria-controls="folder-list"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-500" aria-hidden="true" />
          </div>
        </div>
        
        {/* Lista de carpetas */}
        <div 
          className="p-2 max-h-64 overflow-y-auto" data-testid="folder-menu"
          aria-label="Lista de carpetas disponibles"
          role="listbox"
          id="folder-list"
          tabIndex="0"
        >
          {filteredFolders.length > 0 ? (
            filteredFolders.map((folder, index) => (
              <div
                key={folder.id}
                ref={el => folderRefs.current[index] = el}
                onClick={() => onSelectFolder(folder.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectFolder(folder.id);
                  }
                }}
                className={`flex items-center px-3 py-2 rounded-md hover:bg-gray-100 
                  ${focusedFolderIndex === index ? 'bg-gray-100 ring-2 ring-blue-500' : ''} 
                  cursor-pointer transition-colors`}
                data-testid="folder-menu-item" role="option"
                aria-selected={focusedFolderIndex === index}
                tabIndex="0"
              >
                <Folder size={18} className="text-blue-600 mr-2" aria-hidden="true" />
                <span className="flex-grow text-gray-800">{folder.name}</span>
                <button 
                  className="p-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFolder(folder.id);
                  }}
                  aria-label={`Seleccionar carpeta ${folder.name}`}
                >
                  <Check size={16} aria-hidden="true" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-700" role="status">
              {searchTerm ? 'No se encontraron carpetas' : 'No hay carpetas disponibles'}
            </div>
          )}
        </div>
        
        {/* Acciones */}
        <footer className="p-4 border-t flex justify-end space-x-2">
          <Button 
            variant="ghost" 
            onClick={onClose}
            aria-label="Cancelar selección y cerrar"
          >
            Cancelar
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default FolderSelectionModal;
