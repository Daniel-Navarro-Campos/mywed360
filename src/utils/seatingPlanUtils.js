/**
 * Calcula posiciones válidas para mesas dentro de un lienzo.
 * @param {Array<Object>} tables Array de mesas con props {x, y, shape, diameter, width, height, length}
 * @param {HTMLElement} container DOM node del contenedor (p.e. ref.current)
 * @param {number} scale Escala actual (1 = 100%)
 * @returns {Array<Object>} Array de mesas, ajustadas solo si alguna estaba fuera de límites.
 */
export function clampTablesWithinCanvas(tables, container, scale = 1) {
  if (!container) return tables;
  const rect = container.getBoundingClientRect();
  const maxX = rect.width / scale;
  const maxY = rect.height / scale;
  let changed = false;
  const adjusted = tables.map((t) => {
    const shape = t.shape || 'circle';
    const diameter = t.diameter || 60;
    const width = t.width || 80;
    const height = t.height || t.length || 60;
    const sizeX = shape === 'circle' ? diameter : width;
    const sizeY = shape === 'circle' ? diameter : height;
    const minX = sizeX / 2;
    const minY = sizeY / 2;
    const maxAllowedX = maxX - sizeX / 2;
    const maxAllowedY = maxY - sizeY / 2;

    let nx = t.x;
    let ny = t.y;

    if (nx < minX) {
      nx = minX;
      changed = true;
    } else if (nx > maxAllowedX) {
      nx = maxAllowedX;
      changed = true;
    }

    if (ny < minY) {
      ny = minY;
      changed = true;
    } else if (ny > maxAllowedY) {
      ny = maxAllowedY;
      changed = true;
    }

    return nx !== t.x || ny !== t.y ? { ...t, x: nx, y: ny } : t;
  });

  return changed ? adjusted : tables;
}
