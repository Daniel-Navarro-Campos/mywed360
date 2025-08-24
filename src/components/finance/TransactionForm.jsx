import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { formatCurrency } from '../../utils/formatUtils';

/**
 * Formulario para crear/editar transacciones
 * Incluye validación y categorías predefinidas
 */
export default function TransactionForm({ transaction, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    concept: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  // Categorías predefinidas
  const categories = {
    expense: [
      'Catering',
      'Música',
      'Flores',
      'Fotografía',
      'Vestimenta',
      'Decoración',
      'Transporte',
      'Alojamiento',
      'Invitaciones',
      'Luna de miel',
      'Otros'
    ],
    income: [
      'Aportación inicial',
      'Aportación mensual',
      'Regalo de boda',
      'Aportación familiar',
      'Otros ingresos'
    ]
  };

  // Inicializar formulario con datos de transacción existente
  useEffect(() => {
    if (transaction) {
      setFormData({
        concept: transaction.concept || transaction.description || '',
        amount: transaction.amount?.toString() || '',
        date: transaction.date || new Date().toISOString().split('T')[0],
        type: transaction.type || 'expense',
        category: transaction.category || '',
        description: transaction.description || ''
      });
    }
  }, [transaction]);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.concept.trim()) {
      newErrors.concept = 'El concepto es obligatorio';
    }

    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser un número positivo';
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es obligatoria';
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const transactionData = {
      ...formData,
      amount: Number(formData.amount)
    };

    await onSave(transactionData);
  };

  // Manejar cambios en los campos
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Obtener categorías según el tipo
  const availableCategories = categories[formData.type] || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo de transacción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de transacción
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="expense"
              checked={formData.type === 'expense'}
              onChange={(e) => handleChange('type', e.target.value)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Gasto</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="income"
              checked={formData.type === 'income'}
              onChange={(e) => handleChange('type', e.target.value)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Ingreso</span>
          </label>
        </div>
      </div>

      {/* Concepto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Concepto *
        </label>
        <input
          type="text"
          value={formData.concept}
          onChange={(e) => handleChange('concept', e.target.value)}
          placeholder="Ej: Pago de catering, Regalo de boda..."
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.concept ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.concept && (
          <p className="mt-1 text-sm text-red-600">{errors.concept}</p>
        )}
      </div>

      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monto (€) *
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          placeholder="0.00"
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.amount ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
        )}
        {formData.amount && !isNaN(formData.amount) && (
          <p className="mt-1 text-sm text-gray-500">
            Monto: {formatCurrency(Number(formData.amount))}
          </p>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha *
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.date ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-600">{errors.date}</p>
        )}
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Categoría *
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.category ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Selecciona una categoría</option>
          {availableCategories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category}</p>
        )}
      </div>

      {/* Descripción adicional (opcional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción adicional
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Detalles adicionales sobre la transacción..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : (transaction ? 'Actualizar' : 'Crear')} Transacción
        </Button>
      </div>
    </form>
  );
}
