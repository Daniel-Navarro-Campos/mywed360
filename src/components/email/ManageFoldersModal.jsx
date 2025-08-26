import React, { useState } from 'react';
import Button from '../Button';

/**
 * Modal para gestionar carpetas (crear, eliminar).
 * Cumple con los selectores utilizados en los tests E2E:
 * - data-testid="folders-manager-modal"      Contenedor principal del modal
 * - data-testid="folder-row"                 Cada fila de carpeta
 * - data-testid="delete-folder-button"       Botón para eliminar carpeta personalizada
 * - data-testid="confirm-delete-button"      Botón para confirmar eliminación
 * - data-testid="close-modal-button"         Botón para cerrar el modal
 *
 * Props:
 * @param {boolean}   isOpen            Mostrar u ocultar el modal
 * @param {Function}  onClose           Callback al cerrar
 * @param {Array}     folders           Lista de carpetas (obj => {id, name, system})
 * @param {Function}  onDeleteFolder    Callback para eliminar carpeta
 */
const ManageFoldersModal = ({ isOpen, onClose, folders = [], onDeleteFolder }) => {
  const [folderPendingDelete, setFolderPendingDelete] = useState(null);

  if (!isOpen) return null;

  const handleConfirmDelete = () => {
    if (folderPendingDelete) {
      onDeleteFolder(folderPendingDelete.id);
      setFolderPendingDelete(null);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
      role="dialog"
      aria-modal="true"
      data-testid="folders-manager-modal"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h2 className="text-lg font-semibold">Gestor de carpetas</h2>
          <button
            className="text-gray-500 hover:text-gray-700 p-1 rounded"
            aria-label="Cerrar"
            data-testid="close-modal-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Listado de carpetas */}
        <div className="max-h-64 overflow-y-auto divide-y" role="list">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center justify-between px-4 py-2" 
              data-testid="folder-row"
              role="listitem"
            >
              <span>{folder.name}</span>
              {!folder.system && (
                <button
                  className="text-red-600 hover:text-red-800 text-sm"
                  onClick={() => setFolderPendingDelete(folder)}
                  data-testid="delete-folder-button"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Confirmación de eliminación */}
        {folderPendingDelete && (
          <div className="border-t p-4 flex flex-col space-y-3">
            <p>¿Seguro que deseas eliminar "{folderPendingDelete.name}"?</p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFolderPendingDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                data-testid="confirm-delete-button"
                onClick={() => {
                  handleConfirmDelete();
                  onClose();
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageFoldersModal;
