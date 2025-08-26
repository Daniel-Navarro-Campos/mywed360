import React from 'react';
import Button from '../Button';

/**
 * Barra lateral de etiquetas para filtrar correos
 * Cumple con los selectores utilizados en los tests E2E:
 * - data-testid="tags-sidebar"   Contenedor principal
 * - data-testid="tag-item"       Cada etiqueta (añade clase system-tag si es del sistema)
 * - Dentro del botón, span.tag-color para color del tag
 *
 * Props:
 * @param {Array}   tags            Lista de objetos {id, name, color, systemTag}
 * @param {string}  activeTagId     ID de la etiqueta seleccionada actualmente
 * @param {Function} onSelectTag    Callback(tagId) al hacer clic
 */
const TagsSidebar = ({ tags = [], activeTagId = null, onSelectTag }) => {
  return (
    <nav className="flex flex-col p-2" data-testid="tags-sidebar">
      {tags.map(tag => (
        <Button
          key={tag.id}
          variant={activeTagId === tag.id ? 'subtle' : 'ghost'}
          className={`w-full justify-start ${tag.systemTag ? 'system-tag' : ''} ${activeTagId === tag.id ? 'active' : ''}`}
          data-testid="tag-item"
          onClick={() => onSelectTag && onSelectTag(tag.id)}
        >
          <span
            className="w-3 h-3 rounded-full mr-2 tag-color"
            style={{ backgroundColor: tag.color || '#64748b' }}
          />
          {tag.name}
        </Button>
      ))}
    </nav>
  );
};

export default TagsSidebar;
