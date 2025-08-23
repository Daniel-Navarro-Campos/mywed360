/**
 * Tests para el hook useSeatingPlan
 * Valida la funcionalidad del estado centralizado y operaciones
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSeatingPlan } from '../hooks/useSeatingPlan';

// Mock de dependencias
vi.mock('../firebaseConfig', () => ({
  db: {}
}));

vi.mock('../services/SyncService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
  subscribeSyncState: vi.fn(() => () => {}),
  getSyncState: vi.fn(() => ({ status: 'synced' }))
}));

vi.mock('../context/WeddingContext', () => ({
  useWedding: () => ({
    activeWedding: 'test-wedding-id'
  })
}));

vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toDataURL: () => 'data:image/png;base64,test'
  }))
}));

vi.mock('jspdf', () => ({
  default: vi.fn(() => ({
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn()
  }))
}));

describe('useSeatingPlan Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSeatingPlan());

    expect(result.current.tab).toBe('ceremony');
    expect(result.current.areas).toEqual([]);
    expect(result.current.tables).toEqual([]);
    expect(result.current.seats).toEqual([]);
    expect(result.current.selectedTable).toBeNull();
    expect(result.current.hallSize).toEqual({ width: 1800, height: 1200 });
  });

  it('should change tab correctly', () => {
    const { result } = renderHook(() => useSeatingPlan());

    act(() => {
      result.current.setTab('banquet');
    });

    expect(result.current.tab).toBe('banquet');
  });

  it('should handle table selection', () => {
    const { result } = renderHook(() => useSeatingPlan());
    
    const mockTable = { id: 1, name: 'Mesa 1', x: 100, y: 100 };
    
    // Primero añadir una mesa
    act(() => {
      result.current.setTables([mockTable]);
    });

    // Luego seleccionarla
    act(() => {
      result.current.handleSelectTable(1);
    });

    expect(result.current.selectedTable).toEqual(mockTable);
  });

  it('should handle table dimension changes', () => {
    const { result } = renderHook(() => useSeatingPlan());
    
    const mockTable = { id: 1, name: 'Mesa 1', x: 100, y: 100, width: 80, height: 60 };
    
    act(() => {
      result.current.setTables([mockTable]);
      result.current.handleSelectTable(1);
    });

    act(() => {
      result.current.handleTableDimensionChange('width', '120');
    });

    expect(result.current.selectedTable.width).toBe(120);
  });

  it('should toggle table shape', () => {
    const { result } = renderHook(() => useSeatingPlan());
    
    const mockTable = { id: 1, name: 'Mesa 1', shape: 'rectangle' };
    
    act(() => {
      result.current.setTables([mockTable]);
      result.current.handleSelectTable(1);
    });

    act(() => {
      result.current.toggleSelectedTableShape();
    });

    expect(result.current.selectedTable.shape).toBe('circle');
  });

  it('should generate seat grid for ceremony', () => {
    const { result } = renderHook(() => useSeatingPlan());

    act(() => {
      result.current.generateSeatGrid(5, 6, 40, 100, 80, 3);
    });

    expect(result.current.seats.length).toBe(30); // 5 rows × 6 cols
    expect(result.current.seats[0]).toMatchObject({
      id: 1,
      x: 100,
      y: 80,
      enabled: true,
      guestId: null
    });
  });

  it('should generate banquet layout', () => {
    const { result } = renderHook(() => useSeatingPlan());

    act(() => {
      result.current.setTab('banquet');
      result.current.generateBanquetLayout({
        rows: 2,
        cols: 3,
        seats: 8,
        gapX: 140,
        gapY: 160,
        startX: 120,
        startY: 160
      });
    });

    expect(result.current.tables.length).toBe(6); // 2 rows × 3 cols
    expect(result.current.tables[0]).toMatchObject({
      id: 1,
      x: 120,
      y: 160,
      seats: 8,
      enabled: true
    });
  });

  it('should handle undo/redo functionality', () => {
    const { result } = renderHook(() => useSeatingPlan());

    // Inicialmente no debería poder deshacer
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    // Añadir algo al historial
    act(() => {
      result.current.pushHistory({
        type: 'ceremony',
        seats: [{ id: 1, x: 100, y: 100 }],
        tables: [],
        areas: []
      });
    });

    expect(result.current.canUndo).toBe(false); // Necesita al menos 2 entradas
    expect(result.current.canRedo).toBe(false);
  });

  it('should normalize IDs correctly', () => {
    const { result } = renderHook(() => useSeatingPlan());

    expect(result.current.normalizeId('123')).toBe(123);
    expect(result.current.normalizeId(456)).toBe(456);
    expect(result.current.normalizeId('abc')).toBe('abc');
  });
});
