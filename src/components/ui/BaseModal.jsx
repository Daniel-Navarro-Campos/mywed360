import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * Componente Modal base avanzado y reutilizable
 * Proporciona funcionalidades comunes para todos los modales del proyecto
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Controla si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {string} props.title - Título del modal
 * @param {React.ReactNode} props.children - Contenido del modal
 * @param {string} props.size - Tamaño del modal ('sm', 'md', 'lg', 'xl', 'full')
 * @param {boolean} props.closeOnOverlayClick - Si se puede cerrar haciendo clic fuera
 * @param {boolean} props.closeOnEscape - Si se puede cerrar con la tecla Escape
 * @param {boolean} props.showCloseButton - Si mostrar el botón de cerrar
 * @param {string} props.className - Clases CSS adicionales para el contenedor
 * @param {React.ReactNode} props.footer - Contenido del pie del modal
 * @param {boolean} props.scrollable - Si el contenido es desplazable
 * @returns {React.ReactElement|null} Componente modal base
 */
const BaseModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  footer,
  scrollable = true
}) => {
  // Manejar cierre con tecla Escape
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && closeOnEscape && onClose) {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  // Agregar/remover event listener para tecla Escape
  useEffect(() => {
    if (isOpen && closeOnEscape) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, closeOnEscape, handleKeyDown]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Manejar clic en overlay
  const handleOverlayClick = useCallback((event) => {
    if (event.target === event.currentTarget && closeOnOverlayClick && onClose) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  // Obtener clases de tamaño
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-7xl mx-4';
      default:
        return 'max-w-lg';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={`
          bg-white rounded-lg shadow-xl w-full ${getSizeClasses()} 
          max-h-[90vh] flex flex-col transform transition-all
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
            {title && (
              <h2 
                id="modal-title"
                className="text-lg font-semibold text-gray-800"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Contenido del modal */}
        <div 
          className={`
            flex-1 p-4 
            ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'}
            ${!title && !showCloseButton ? 'pt-4' : ''}
          `}
        >
          {children}
        </div>

        {/* Pie del modal */}
        {footer && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseModal;
