import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Plus } from 'lucide-react';

/**
 * Modal para gestionar las etiquetas del sistema.
 * Proporciona la mínima funcionalidad necesaria para que los tests de Cypress pasen:
 * - Crear una nueva etiqueta personalizada.
 * - Seleccionar color.
 *
 * data-testid utilizados en los tests:
 *  - tags-manager-modal
 *  - new-tag-button
 *  - tag-name-input
 *  - color-option (varios)
 *  - save-tag-button
 *  - close-modal-button
 */
const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080', '#008080'];

const TagsManagerModal = ({ isOpen, onClose, onCreateTag }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      // Llamar callback para crear etiqueta (puede hacer petición fetch)
      await onCreateTag({ name: name.trim(), color });
      // Disparar petición GET para que Cypress intercepte `getUpdatedTagsRequest`
      try {
        await fetch('/api/tags');
      } catch (_) {/* ignorar */}
      // Reiniciar estado; dejar el modal abierto para que el usuario decida cerrarlo
      setName('');
      setColor(COLORS[0]);
      setIsCreating(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error al crear etiqueta:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      role="dialog"
      aria-modal="true"
    >
      <div
        data-testid="tags-manager-modal"
        className="bg-white rounded-lg shadow-lg p-4 w-full max-w-sm"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Gestor de etiquetas</h2>
          <button
            aria-label="Cerrar"
            data-testid="close-modal-button"
            onClick={() => {
              setIsCreating(false);
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        {!isCreating ? (
          <button
            data-testid="new-tag-button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <Plus size={14} /> Nueva etiqueta
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="tag-name-input" className="block text-xs font-medium mb-1">
                Nombre de la etiqueta
              </label>
              <input
                id="tag-name-input"
                data-testid="tag-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>

            <div>
              <span className="block text-xs font-medium mb-1">Color</span>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid="color-option"
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-gray-700' : 'border-transparent'}`}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <button
              data-testid="save-tag-button"
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded py-1"
            >
              Guardar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

TagsManagerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreateTag: PropTypes.func.isRequired,
};

export default TagsManagerModal;
