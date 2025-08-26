/**
 * SeatingPlan refactorizado - Componente principal modular
 * Reemplaza el SeatingPlan.jsx monolítico con arquitectura de componentes especializados
 */

import React, { useEffect } from 'react';
import { useSeatingPlan } from '../../hooks/useSeatingPlan';
import SeatingPlanTabs from './SeatingPlanTabs';
import SeatingPlanToolbar from './SeatingPlanToolbar';
import SeatingPlanCanvas from './SeatingPlanCanvas';
import SeatingPlanSidebar from './SeatingPlanSidebar';
import SeatingPlanModals from './SeatingPlanModals';

const SeatingPlanRefactored = () => {
  const {
    // Estados principales
    tab,
    setTab,
    syncStatus,
    hallSize,
    areas,
    tables,
    seats,
    selectedTable,
    guests,
    
    // Estados de modales
    ceremonyConfigOpen,
    setCeremonyConfigOpen,
    banquetConfigOpen,
    setBanquetConfigOpen,
    spaceConfigOpen,
    setSpaceConfigOpen,
    templateOpen,
    setTemplateOpen,
    
    // Referencias
    canvasRef,
    
    // Funciones de gestión
    handleSelectTable,
    handleTableDimensionChange,
    toggleSelectedTableShape,
    setConfigTable,
    
    // Funciones de historial
    undo,
    redo,
    canUndo,
    canRedo,
    pushHistory,
    
    // Funciones de generación
    generateSeatGrid,
    generateBanquetLayout,
    
    // Funciones de exportación
    exportPNG,
    exportPDF,
    
    // Funciones de configuración
    saveHallDimensions
  } = useSeatingPlan();

  // Handlers de modales
  const handleOpenCeremonyConfig = () => setCeremonyConfigOpen(true);
  const handleCloseCeremonyConfig = () => setCeremonyConfigOpen(false);
  
  const handleOpenBanquetConfig = () => setBanquetConfigOpen(true);
  const handleCloseBanquetConfig = () => setBanquetConfigOpen(false);
  
  const handleOpenSpaceConfig = () => setSpaceConfigOpen(true);
  const handleCloseSpaceConfig = () => setSpaceConfigOpen(false);
  
  const handleOpenTemplates = () => setTemplateOpen(true);
  const handleCloseTemplates = () => setTemplateOpen(false);

  // Handler de configuración de mesa
  const handleConfigureTable = (table) => {
    setConfigTable(table);
    if (tab === 'ceremony') {
      handleOpenCeremonyConfig();
    } else {
      handleOpenBanquetConfig();
    }
  };

  // Handler de asignación automática con IA
  const handleAutoAssign = async () => {
    try {
      // Aquí iría la lógica de asignación automática con IA
      console.log('Iniciando asignación automática con IA...');
      
      // Simulación de asignación inteligente
      // En una implementación real, esto llamaría a un servicio de IA
      
    } catch (error) {
      console.error('Error en asignación automática:', error);
    }
  };

  // Handler de aplicación de plantillas
  const handleApplyTemplate = (template) => {
    if (template.ceremony) {
      generateSeatGrid(
        template.ceremony.rows,
        template.ceremony.cols,
        40, // gap por defecto
        100, // startX por defecto
        80, // startY por defecto
        Math.floor(template.ceremony.cols / 2) // aisleAfter
      );
    }
    
    if (template.banquet) {
      generateBanquetLayout({
        rows: template.banquet.rows,
        cols: template.banquet.cols,
        seats: template.banquet.seats,
        gapX: 140,
        gapY: 160,
        startX: 120,
        startY: 160
      });
    }
  };

  // Handlers de asignación de invitados
  const handleAssignGuest = (guestId, targetId) => {
    // Lógica de asignación de invitados
    console.log(`Asignando invitado ${guestId} a ${targetId}`);
  };

  const handleToggleEnabled = (id) => {
    // Lógica para habilitar/deshabilitar elementos
    console.log(`Toggling enabled state for ${id}`);
  };

  const handleAddArea = (area) => {
    // Lógica para añadir áreas
    console.log('Añadiendo área:', area);
  };

  const handleAddTable = (table) => {
    // Lógica para añadir mesas
    console.log('Añadiendo mesa:', table);
  };

  // Contadores para las pestañas
  const ceremonyCount = seats.length;
  const banquetCount = tables.length;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header con pestañas */}
      <div className="flex-shrink-0 p-4 pb-0">
        <SeatingPlanTabs
          activeTab={tab}
          onTabChange={setTab}
          ceremonyCount={ceremonyCount}
          banquetCount={banquetCount}
        />
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0 p-4 pb-2">
        <SeatingPlanToolbar
          tab={tab}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onExportPNG={exportPNG}
          onExportPDF={exportPDF}
          onOpenCeremonyConfig={handleOpenCeremonyConfig}
          onOpenBanquetConfig={handleOpenBanquetConfig}
          onOpenSpaceConfig={handleOpenSpaceConfig}
          onOpenTemplates={handleOpenTemplates}
          onAutoAssign={handleAutoAssign}
          syncStatus={syncStatus}
        />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex gap-4 p-4 pt-0 min-h-0">
        {/* Canvas principal */}
        <div className="flex-1 min-w-0">
          <SeatingPlanCanvas
            tab={tab}
            areas={areas}
            tables={tables}
            seats={seats}
            hallSize={hallSize}
            selectedTable={selectedTable}
            onSelectTable={handleSelectTable}
            onTableDimensionChange={handleTableDimensionChange}
            onAssignGuest={handleAssignGuest}
            onToggleEnabled={handleToggleEnabled}
            onAddArea={handleAddArea}
            onAddTable={handleAddTable}
            canvasRef={canvasRef}
            className="h-full"
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <SeatingPlanSidebar
            selectedTable={selectedTable}
            onTableDimensionChange={handleTableDimensionChange}
            onToggleTableShape={toggleSelectedTableShape}
            onConfigureTable={handleConfigureTable}
            guests={guests}
            tab={tab}
            className="h-full"
          />
        </div>
      </div>

      {/* Modales */}
      <SeatingPlanModals
        ceremonyConfigOpen={ceremonyConfigOpen}
        banquetConfigOpen={banquetConfigOpen}
        spaceConfigOpen={spaceConfigOpen}
        templateOpen={templateOpen}
        onCloseCeremonyConfig={handleCloseCeremonyConfig}
        onCloseBanquetConfig={handleCloseBanquetConfig}
        onCloseSpaceConfig={handleCloseSpaceConfig}
        onCloseTemplate={handleCloseTemplates}
        onGenerateSeatGrid={generateSeatGrid}
        onGenerateBanquetLayout={generateBanquetLayout}
        onSaveHallDimensions={saveHallDimensions}
        onApplyTemplate={handleApplyTemplate}
        hallSize={hallSize}
      />
    </div>
  );
};

export default SeatingPlanRefactored;
