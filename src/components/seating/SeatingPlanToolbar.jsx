/**
 * Componente Toolbar modernizado para el plan de asientos
 * Interfaz mejorada con iconos claros y mejor UX
 */

import React from 'react';
import { 
  Undo2, 
  Redo2, 
  Download, 
  FileImage, 
  Settings, 
  Grid, 
  Users, 
  Maximize, 
  Palette,
  Save,
  Cloud,
  CloudOff,
  Zap
} from 'lucide-react';

const SeatingPlanToolbar = ({
  tab,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExportPNG,
  onExportPDF,
  onOpenCeremonyConfig,
  onOpenBanquetConfig,
  onOpenSpaceConfig,
  onOpenTemplates,
  onAutoAssign,
  syncStatus,
  className = ""
}) => {
  const getSyncIcon = () => {
    switch (syncStatus?.status) {
      case 'syncing':
        return <Cloud className="h-4 w-4 animate-pulse text-blue-500" />;
      case 'synced':
        return <Cloud className="h-4 w-4 text-green-500" />;
      case 'error':
        return <CloudOff className="h-4 w-4 text-red-500" />;
      default:
        return <CloudOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSyncText = () => {
    switch (syncStatus?.status) {
      case 'syncing':
        return 'Sincronizando...';
      case 'synced':
        return 'Sincronizado';
      case 'error':
        return 'Error de sincronización';
      default:
        return 'Sin conexión';
    }
  };

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-2 p-3">
        {/* Grupo: Historial */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
            <span className="hidden sm:inline">Deshacer</span>
          </button>
          
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Rehacer (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
            <span className="hidden sm:inline">Rehacer</span>
          </button>
        </div>

        {/* Grupo: Configuración */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            onClick={onOpenSpaceConfig}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title="Configurar espacio"
          >
            <Maximize className="h-4 w-4" />
            <span className="hidden sm:inline">Espacio</span>
          </button>

          {tab === 'ceremony' ? (
            <button
              onClick={onOpenCeremonyConfig}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
              title="Configurar ceremonia"
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">Ceremonia</span>
            </button>
          ) : (
            <button
              onClick={onOpenBanquetConfig}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
              title="Configurar banquete"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Banquete</span>
            </button>
          )}

          <button
            onClick={onOpenTemplates}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title="Plantillas"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Plantillas</span>
          </button>
        </div>

        {/* Grupo: IA y Automatización */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            onClick={onAutoAssign}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded hover:from-purple-600 hover:to-blue-600 transition-all"
            title="Asignación automática con IA"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Auto IA</span>
          </button>
        </div>

        {/* Grupo: Exportación */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            onClick={onExportPNG}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title="Exportar como PNG"
          >
            <FileImage className="h-4 w-4" />
            <span className="hidden sm:inline">PNG</span>
          </button>
          
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title="Exportar como PDF"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>

        {/* Estado de sincronización */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            {getSyncIcon()}
            <span className="hidden md:inline">{getSyncText()}</span>
          </div>
        </div>
      </div>

      {/* Barra de progreso de sincronización */}
      {syncStatus?.status === 'syncing' && (
        <div className="h-1 bg-gray-200">
          <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
        </div>
      )}
    </div>
  );
};

export default React.memo(SeatingPlanToolbar);
