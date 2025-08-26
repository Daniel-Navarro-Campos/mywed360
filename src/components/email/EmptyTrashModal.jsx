import React from 'react';
import Button from '../Button';

/**
 * Modal de confirmación para vaciar la carpeta Papelera.
 * Cumple con los selectores requeridos en los tests E2E:
 *  - data-testid="empty-trash-modal"      Contenedor principal del modal
 *  - data-testid="confirm-empty-button"    Botón para confirmar la acción
 *  - data-testid="close-modal-button"      Botón para cerrar el modal sin confirmar
 */
const EmptyTrashModal = ({ isOpen, onConfirm, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
      role="dialog"
      aria-modal="true"
      data-testid="empty-trash-modal"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h2 className="text-lg font-semibold">Vaciar papelera</h2>
          <button
            className="text-gray-500 hover:text-gray-700 p-1 rounded"
            aria-label="Cerrar"
            data-testid="close-modal-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-700">¿Seguro que deseas vaciar la carpeta Papelera? Esta acción no se puede deshacer.</p>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              data-testid="confirm-empty-button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Vaciar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyTrashModal;
