/**
 * Componente que agrupa todos los modales del plan de asientos
 * Gestiona la configuración de ceremonia, banquete, espacio y plantillas
 */

import React from 'react';
import { X, Grid, Users, Maximize, Palette, Zap } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, icon: Icon }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-blue-600" />}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

const SeatingPlanModals = ({
  // Estados de modales
  ceremonyConfigOpen,
  banquetConfigOpen,
  spaceConfigOpen,
  templateOpen,
  
  // Handlers de cierre
  onCloseCeremonyConfig,
  onCloseBanquetConfig,
  onCloseSpaceConfig,
  onCloseTemplate,
  
  // Handlers de configuración
  onGenerateSeatGrid,
  onGenerateBanquetLayout,
  onSaveHallDimensions,
  onApplyTemplate,
  
  // Estado actual
  hallSize
}) => {
  return (
    <>
      {/* Modal de configuración de ceremonia */}
      <Modal
        isOpen={ceremonyConfigOpen}
        onClose={onCloseCeremonyConfig}
        title="Configurar Ceremonia"
        icon={Grid}
      >
        <CeremonyConfigForm
          onGenerate={onGenerateSeatGrid}
          onClose={onCloseCeremonyConfig}
        />
      </Modal>

      {/* Modal de configuración de banquete */}
      <Modal
        isOpen={banquetConfigOpen}
        onClose={onCloseBanquetConfig}
        title="Configurar Banquete"
        icon={Users}
      >
        <BanquetConfigForm
          onGenerate={onGenerateBanquetLayout}
          onClose={onCloseBanquetConfig}
        />
      </Modal>

      {/* Modal de configuración de espacio */}
      <Modal
        isOpen={spaceConfigOpen}
        onClose={onCloseSpaceConfig}
        title="Configurar Espacio"
        icon={Maximize}
      >
        <SpaceConfigForm
          hallSize={hallSize}
          onSave={onSaveHallDimensions}
          onClose={onCloseSpaceConfig}
        />
      </Modal>

      {/* Modal de plantillas */}
      <Modal
        isOpen={templateOpen}
        onClose={onCloseTemplate}
        title="Plantillas"
        icon={Palette}
      >
        <TemplateSelector
          onApply={onApplyTemplate}
          onClose={onCloseTemplate}
        />
      </Modal>
    </>
  );
};

// Formulario de configuración de ceremonia
const CeremonyConfigForm = ({ onGenerate, onClose }) => {
  const [config, setConfig] = React.useState({
    rows: 10,
    cols: 12,
    gap: 40,
    startX: 100,
    startY: 80,
    aisleAfter: 6
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(config.rows, config.cols, config.gap, config.startX, config.startY, config.aisleAfter);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Filas</label>
          <input
            type="number"
            min="1"
            max="20"
            value={config.rows}
            onChange={(e) => setConfig(prev => ({ ...prev, rows: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Columnas</label>
          <input
            type="number"
            min="1"
            max="30"
            value={config.cols}
            onChange={(e) => setConfig(prev => ({ ...prev, cols: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Separación (cm)</label>
        <input
          type="number"
          min="20"
          max="100"
          value={config.gap}
          onChange={(e) => setConfig(prev => ({ ...prev, gap: parseInt(e.target.value) }))}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Pasillo después de columna</label>
        <input
          type="number"
          min="0"
          max={config.cols}
          value={config.aisleAfter}
          onChange={(e) => setConfig(prev => ({ ...prev, aisleAfter: parseInt(e.target.value) }))}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Generar
        </button>
      </div>
    </form>
  );
};

// Formulario de configuración de banquete
const BanquetConfigForm = ({ onGenerate, onClose }) => {
  const [config, setConfig] = React.useState({
    rows: 3,
    cols: 4,
    seats: 8,
    gapX: 140,
    gapY: 160,
    startX: 120,
    startY: 160
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(config);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Filas de mesas</label>
          <input
            type="number"
            min="1"
            max="10"
            value={config.rows}
            onChange={(e) => setConfig(prev => ({ ...prev, rows: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Columnas de mesas</label>
          <input
            type="number"
            min="1"
            max="15"
            value={config.cols}
            onChange={(e) => setConfig(prev => ({ ...prev, cols: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Asientos por mesa</label>
        <input
          type="number"
          min="2"
          max="20"
          value={config.seats}
          onChange={(e) => setConfig(prev => ({ ...prev, seats: parseInt(e.target.value) }))}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Separación X (cm)</label>
          <input
            type="number"
            min="80"
            max="300"
            value={config.gapX}
            onChange={(e) => setConfig(prev => ({ ...prev, gapX: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Separación Y (cm)</label>
          <input
            type="number"
            min="80"
            max="300"
            value={config.gapY}
            onChange={(e) => setConfig(prev => ({ ...prev, gapY: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Generar
        </button>
      </div>
    </form>
  );
};

// Formulario de configuración de espacio
const SpaceConfigForm = ({ hallSize, onSave, onClose }) => {
  const [dimensions, setDimensions] = React.useState(hallSize);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(dimensions.width, dimensions.height);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ancho (cm)</label>
          <input
            type="number"
            min="200"
            max="5000"
            value={dimensions.width}
            onChange={(e) => setDimensions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Largo (cm)</label>
          <input
            type="number"
            min="200"
            max="5000"
            value={dimensions.height}
            onChange={(e) => setDimensions(prev => ({ ...prev, height: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded">
        <p className="text-sm text-gray-600">
          <strong>Área total:</strong> {(dimensions.width * dimensions.height / 10000).toFixed(1)} m²
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Guardar
        </button>
      </div>
    </form>
  );
};

// Selector de plantillas
const TemplateSelector = ({ onApply, onClose }) => {
  const templates = [
    {
      id: 'intimate',
      name: 'Boda Íntima',
      description: '50-80 invitados',
      ceremony: { rows: 8, cols: 8 },
      banquet: { rows: 2, cols: 3, seats: 8 }
    },
    {
      id: 'medium',
      name: 'Boda Mediana',
      description: '80-150 invitados',
      ceremony: { rows: 12, cols: 10 },
      banquet: { rows: 3, cols: 4, seats: 10 }
    },
    {
      id: 'large',
      name: 'Boda Grande',
      description: '150+ invitados',
      ceremony: { rows: 15, cols: 12 },
      banquet: { rows: 4, cols: 5, seats: 12 }
    }
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Selecciona una plantilla predefinida para comenzar rápidamente:
      </p>
      
      {templates.map((template) => (
        <div
          key={template.id}
          className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
          onClick={() => {
            onApply(template);
            onClose();
          }}
        >
          <h4 className="font-medium">{template.name}</h4>
          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
          <div className="text-xs text-gray-500">
            Ceremonia: {template.ceremony.rows}×{template.ceremony.cols} asientos • 
            Banquete: {template.banquet.rows}×{template.banquet.cols} mesas de {template.banquet.seats}
          </div>
        </div>
      ))}
      
      <div className="flex gap-2 pt-4">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default SeatingPlanModals;
