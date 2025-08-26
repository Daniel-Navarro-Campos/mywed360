/**
 * Tests para el componente SeatingPlanRefactored
 * Valida la integración y funcionalidad de los componentes modulares
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SeatingPlanRefactored from '../components/seating/SeatingPlanRefactored';

// Mock de dependencias
vi.mock('../hooks/useSeatingPlan', () => ({
  useSeatingPlan: () => ({
    tab: 'ceremony',
    setTab: vi.fn(),
    syncStatus: { status: 'synced' },
    hallSize: { width: 1800, height: 1200 },
    areas: [],
    tables: [],
    seats: [],
    selectedTable: null,
    guests: [],
    ceremonyConfigOpen: false,
    setCeremonyConfigOpen: vi.fn(),
    banquetConfigOpen: false,
    setBanquetConfigOpen: vi.fn(),
    spaceConfigOpen: false,
    setSpaceConfigOpen: vi.fn(),
    templateOpen: false,
    setTemplateOpen: vi.fn(),
    canvasRef: { current: null },
    handleSelectTable: vi.fn(),
    handleTableDimensionChange: vi.fn(),
    toggleSelectedTableShape: vi.fn(),
    setConfigTable: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    pushHistory: vi.fn(),
    generateSeatGrid: vi.fn(),
    generateBanquetLayout: vi.fn(),
    exportPNG: vi.fn(),
    exportPDF: vi.fn(),
    saveHallDimensions: vi.fn()
  })
}));

vi.mock('../components/seating/SeatingPlanTabs', () => ({
  default: ({ activeTab, onTabChange }) => (
    <div data-testid="seating-plan-tabs">
      <button onClick={() => onTabChange('ceremony')}>Ceremonia</button>
      <button onClick={() => onTabChange('banquet')}>Banquete</button>
    </div>
  )
}));

vi.mock('../components/seating/SeatingPlanToolbar', () => ({
  default: ({ onUndo, onRedo, onExportPNG }) => (
    <div data-testid="seating-plan-toolbar">
      <button onClick={onUndo}>Deshacer</button>
      <button onClick={onRedo}>Rehacer</button>
      <button onClick={onExportPNG}>Exportar PNG</button>
    </div>
  )
}));

vi.mock('../components/seating/SeatingPlanCanvas', () => ({
  default: ({ onSelectTable }) => (
    <div data-testid="seating-plan-canvas">
      <button onClick={() => onSelectTable(1)}>Seleccionar Mesa 1</button>
    </div>
  )
}));

vi.mock('../components/seating/SeatingPlanSidebar', () => ({
  default: ({ selectedTable }) => (
    <div data-testid="seating-plan-sidebar">
      {selectedTable ? `Mesa ${selectedTable.id}` : 'Sin selección'}
    </div>
  )
}));

vi.mock('../components/seating/SeatingPlanModals', () => ({
  default: () => <div data-testid="seating-plan-modals" />
}));

describe('SeatingPlanRefactored Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all main components', () => {
    render(<SeatingPlanRefactored />);

    expect(screen.getByTestId('seating-plan-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('seating-plan-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('seating-plan-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('seating-plan-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('seating-plan-modals')).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    render(<SeatingPlanRefactored />);

    const container = screen.getByTestId('seating-plan-tabs').closest('.h-full');
    expect(container).toHaveClass('flex', 'flex-col', 'bg-gray-50');
  });

  it('should render tabs and toolbar in header area', () => {
    render(<SeatingPlanRefactored />);

    const tabs = screen.getByTestId('seating-plan-tabs');
    const toolbar = screen.getByTestId('seating-plan-toolbar');
    
    expect(tabs).toBeInTheDocument();
    expect(toolbar).toBeInTheDocument();
  });

  it('should render canvas and sidebar in main content area', () => {
    render(<SeatingPlanRefactored />);

    const canvas = screen.getByTestId('seating-plan-canvas');
    const sidebar = screen.getByTestId('seating-plan-sidebar');
    
    expect(canvas).toBeInTheDocument();
    expect(sidebar).toBeInTheDocument();
  });

  it('should handle tab changes', () => {
    const mockSetTab = vi.fn();
    
    vi.mocked(require('../hooks/useSeatingPlan').useSeatingPlan).mockReturnValue({
      ...require('../hooks/useSeatingPlan').useSeatingPlan(),
      setTab: mockSetTab
    });

    render(<SeatingPlanRefactored />);

    fireEvent.click(screen.getByText('Banquete'));
    expect(mockSetTab).toHaveBeenCalledWith('banquet');
  });

  it('should integrate with all subcomponents correctly', () => {
    render(<SeatingPlanRefactored />);

    // Verificar que todos los componentes están presentes
    expect(screen.getByTestId('seating-plan-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('seating-plan-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('seating-plan-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('seating-plan-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('seating-plan-modals')).toBeInTheDocument();
  });
});
