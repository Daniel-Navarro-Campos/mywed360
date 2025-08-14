import { describe, it, expect } from 'vitest';
import { clampTablesWithinCanvas } from '../seatingPlanUtils';

// Helper: crea contenedor simulado con las dimensiones indicadas
const createMockContainer = (w, h) => ({
  getBoundingClientRect: () => ({ width: w, height: h }),
});

describe('clampTablesWithinCanvas', () => {
  const container = createMockContainer(500, 400); // área visible 500x400 px
  const scale = 1;

  it('no modifica mesas que ya están dentro de límites', () => {
    const tables = [{ id: 'T1', x: 100, y: 80, shape: 'circle', diameter: 60 }];
    const result = clampTablesWithinCanvas(tables, container, scale);
    expect(result).toEqual(tables);
  });

  it('clampea posición X por la izquierda', () => {
    const tables = [{ id: 'T1', x: 10, y: 80, shape: 'circle', diameter: 60 }];
    const result = clampTablesWithinCanvas(tables, container, scale);
    // diámetro 60 => radio 30. mínX = 30
    expect(result[0].x).toBe(30);
  });

  it('clampea posición Y por abajo', () => {
    const tables = [{ id: 'T1', x: 250, y: 395, shape: 'circle', diameter: 60 }];
    const result = clampTablesWithinCanvas(tables, container, scale);
    // maxY = 400, allowed max center = 400 - 30 = 370
    expect(result[0].y).toBe(370);
  });
});
