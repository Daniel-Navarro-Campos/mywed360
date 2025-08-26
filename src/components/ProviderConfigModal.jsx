import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const ProviderConfigModal = ({ defaultServices, currentServices, onSave, onCancel }) => {
  const [selectedServices, setSelectedServices] = useState(currentServices || []);
  const [customService, setCustomService] = useState('');

  const toggleService = (service) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const addCustomService = () => {
    if (customService.trim() && !selectedServices.includes(customService.trim())) {
      setSelectedServices(prev => [...prev, customService.trim()]);
      setCustomService('');
    }
  };

  const removeService = (service) => {
    setSelectedServices(prev => prev.filter(s => s !== service));
  };

  const handleSave = () => {
    onSave(selectedServices);
  };

  return (
    <div className="space-y-6">
      {/* Servicios predeterminados */}
      <div>
        <h4 className="font-semibold mb-3">Servicios básicos</h4>
        <div className="grid grid-cols-2 gap-2">
          {(defaultServices || []).map(service => (
            <label key={service} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedServices.includes(service)}
                onChange={() => toggleService(service)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{service}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Añadir servicio personalizado */}
      <div>
        <h4 className="font-semibold mb-3">Añadir servicio personalizado</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={customService}
            onChange={(e) => setCustomService(e.target.value)}
            placeholder="Ej: DJ, Animación infantil..."
            className="flex-1 border rounded px-3 py-2"
            onKeyPress={(e) => e.key === 'Enter' && addCustomService()}
          />
          <button
            onClick={addCustomService}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Servicios seleccionados */}
      {selectedServices.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Servicios configurados ({selectedServices.length})</h4>
          <div className="flex flex-wrap gap-2">
            {selectedServices.map(service => (
              <span
                key={service}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {service}
                <button
                  onClick={() => removeService(service)}
                  className="hover:bg-blue-200 rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
};

export default ProviderConfigModal;
