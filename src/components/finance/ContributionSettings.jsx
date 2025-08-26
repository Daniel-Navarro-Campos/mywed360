import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { Users, RefreshCw, Calculator } from 'lucide-react';
import { formatCurrency } from '../../utils/formatUtils';

/**
 * Componente para configuración de aportaciones y regalos
 * Permite configurar aportaciones iniciales, mensuales y estimaciones de regalos
 */
export default function ContributionSettings({ 
  contributions, 
  onUpdateContributions, 
  onLoadGuestCount, 
  isLoading 
}) {
  const [localContributions, setLocalContributions] = useState(contributions);
  const [hasChanges, setHasChanges] = useState(false);

  // Manejar cambios en los campos
  const handleChange = (field, value) => {
    const numValue = Number(value) || 0;
    setLocalContributions(prev => ({ ...prev, [field]: numValue }));
    setHasChanges(true);
  };

  // Guardar cambios
  const handleSave = () => {
    onUpdateContributions(localContributions);
    setHasChanges(false);
  };

  // Resetear cambios
  const handleReset = () => {
    setLocalContributions(contributions);
    setHasChanges(false);
  };

  // Cálculos en tiempo real
  const monthlyTotal = localContributions.monthlyA + localContributions.monthlyB;
  const initialTotal = localContributions.initA + localContributions.initB;
  const expectedGifts = localContributions.giftPerGuest * localContributions.guestCount;
  const totalExpectedIncome = initialTotal + monthlyTotal + localContributions.extras + expectedGifts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Configuración de Aportaciones</h2>
          <p className="text-sm text-gray-600">
            Configura las aportaciones y estima los ingresos esperados
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<RefreshCw size={16} />}
          onClick={onLoadGuestCount}
          disabled={isLoading}
        >
          Actualizar Invitados
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de configuración */}
        <div className="space-y-6">
          {/* Aportaciones iniciales */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Aportaciones Iniciales
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Persona A (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localContributions.initA}
                  onChange={(e) => handleChange('initA', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Persona B (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localContributions.initB}
                  onChange={(e) => handleChange('initB', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Total inicial: <span className="font-medium text-gray-900">{formatCurrency(initialTotal)}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Aportaciones mensuales */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Aportaciones Mensuales
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Persona A (€/mes)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localContributions.monthlyA}
                  onChange={(e) => handleChange('monthlyA', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Persona B (€/mes)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localContributions.monthlyB}
                  onChange={(e) => handleChange('monthlyB', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Total mensual: <span className="font-medium text-gray-900">{formatCurrency(monthlyTotal)}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Aportaciones extras */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Aportaciones Extras
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total extras (familia, otros ingresos) (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localContributions.extras}
                  onChange={(e) => handleChange('extras', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Incluye regalos de familia, aportaciones de padres, etc.
                </p>
              </div>
            </div>
          </Card>

          {/* Estimación de regalos */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Estimación de Regalos
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Regalo estimado por invitado (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localContributions.giftPerGuest}
                  onChange={(e) => handleChange('giftPerGuest', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de invitados
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    value={localContributions.guestCount}
                    onChange={(e) => handleChange('guestCount', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <Button
                    variant="outline"
                    onClick={onLoadGuestCount}
                    disabled={isLoading}
                    className="px-3"
                  >
                    <Users size={16} />
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Haz clic en el icono para cargar automáticamente desde tu lista de invitados
                </p>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Total estimado en regalos: <span className="font-medium text-gray-900">{formatCurrency(expectedGifts)}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Botones de acción */}
          {hasChanges && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-blue-800">
                  Tienes cambios sin guardar
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Resumen y proyecciones */}
        <div className="space-y-6">
          {/* Resumen de ingresos esperados */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                <Calculator className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Resumen de Ingresos Esperados
                </h3>
                <p className="text-sm text-gray-600">
                  Proyección total basada en tus configuraciones
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Aportaciones iniciales</span>
                <span className="font-medium text-gray-900">{formatCurrency(initialTotal)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Aportaciones mensuales</span>
                <span className="font-medium text-gray-900">{formatCurrency(monthlyTotal)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Aportaciones extras</span>
                <span className="font-medium text-gray-900">{formatCurrency(localContributions.extras)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Regalos estimados</span>
                <span className="font-medium text-gray-900">{formatCurrency(expectedGifts)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg">
                <span className="font-medium text-green-800">Total Esperado</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(totalExpectedIncome)}</span>
              </div>
            </div>
          </Card>

          {/* Consejos y recomendaciones */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Consejos Financieros
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p>
                  <strong>Fondo de emergencia:</strong> Considera reservar un 10-15% del presupuesto total para gastos imprevistos.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p>
                  <strong>Regalos conservadores:</strong> Es mejor subestimar los regalos de boda que sobreestimarlos.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p>
                  <strong>Seguimiento regular:</strong> Revisa y actualiza estas proyecciones mensualmente.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p>
                  <strong>Aportaciones equilibradas:</strong> Mantén un balance justo entre las aportaciones de ambas personas.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
