import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { Plus, Edit3, Trash2, AlertTriangle, Target } from 'lucide-react';
import { formatCurrency } from '../../utils/formatUtils';
import Modal from '../Modal';

/**
 * Componente para gestión de presupuesto y categorías
 * Permite crear, editar y eliminar categorías de presupuesto
 */
export default function BudgetManager({ 
  budget, 
  budgetUsage, 
  onUpdateBudget, 
  onAddCategory, 
  onUpdateCategory, 
  onRemoveCategory 
}) {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(-1);
  const [newCategory, setNewCategory] = useState({ name: '', amount: '' });

  // Manejar apertura de modal para nueva categoría
  const handleAddCategory = () => {
    setEditingCategory(null);
    setEditingCategoryIndex(-1);
    setNewCategory({ name: '', amount: '' });
    setShowCategoryModal(true);
  };

  // Manejar apertura de modal para editar categoría
  const handleEditCategory = (category, index) => {
    setEditingCategory(category);
    setEditingCategoryIndex(index);
    setNewCategory({ name: category.name, amount: category.amount.toString() });
    setShowCategoryModal(true);
  };

  // Manejar guardado de categoría
  const handleSaveCategory = () => {
    const amount = Number(newCategory.amount);
    
    if (!newCategory.name.trim()) {
      alert('El nombre de la categoría es obligatorio');
      return;
    }
    
    if (isNaN(amount) || amount < 0) {
      alert('El monto debe ser un número válido');
      return;
    }

    if (editingCategory) {
      // Editar categoría existente
      onUpdateCategory(editingCategoryIndex, { 
        name: newCategory.name.trim(), 
        amount 
      });
    } else {
      // Agregar nueva categoría
      const result = onAddCategory(newCategory.name.trim(), amount);
      if (!result.success) {
        alert(result.error);
        return;
      }
    }

    setShowCategoryModal(false);
    setEditingCategory(null);
    setEditingCategoryIndex(-1);
    setNewCategory({ name: '', amount: '' });
  };

  // Manejar eliminación de categoría
  const handleDeleteCategory = (index, categoryName) => {
    if (window.confirm(`¿Estás seguro de eliminar la categoría "${categoryName}"?`)) {
      onRemoveCategory(index);
    }
  };

  // Calcular totales
  const totalBudgeted = budget.categories.reduce((sum, cat) => sum + cat.amount, 0);
  const totalSpent = budgetUsage.reduce((sum, cat) => sum + cat.spent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Presupuesto</h2>
          <p className="text-sm text-gray-600">
            Organiza y controla el presupuesto por categorías
          </p>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={handleAddCategory}
        >
          Nueva Categoría
        </Button>
      </div>

      {/* Resumen general del presupuesto */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Presupuesto Total</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(budget.total)}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Presupuestado</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalBudgeted)}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-3">
              <Target className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Gastado</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
          </div>
        </div>

        {/* Barra de progreso general */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progreso del presupuesto</span>
            <span>{budget.total > 0 ? ((totalSpent / budget.total) * 100).toFixed(1) : 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                totalSpent > budget.total 
                  ? 'bg-red-500' 
                  : totalSpent > budget.total * 0.8 
                  ? 'bg-orange-500' 
                  : 'bg-green-500'
              }`}
              style={{ 
                width: `${Math.min((totalSpent / budget.total) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      </Card>

      {/* Lista de categorías */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Categorías de Presupuesto</h3>
        </div>
        
        {budgetUsage.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No hay categorías de presupuesto</p>
            <Button onClick={handleAddCategory} leftIcon={<Plus size={16} />}>
              Crear primera categoría
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {budgetUsage.map((category, index) => (
              <div key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-gray-900">
                      {category.name}
                    </h4>
                    {category.percentage >= 100 && (
                      <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <AlertTriangle size={14} className="mr-1" />
                        <span className="text-xs font-medium">Excedido</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditCategory(category, index)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(index, category.name)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Presupuestado</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(category.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gastado</p>
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(category.spent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Restante</p>
                    <p className={`text-lg font-semibold ${
                      category.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(category.remaining)}
                    </p>
                  </div>
                </div>

                {/* Barra de progreso de la categoría */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progreso</span>
                    <span>{category.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        category.percentage >= 100 
                          ? 'bg-red-500' 
                          : category.percentage >= 75 
                          ? 'bg-orange-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min(category.percentage, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal para agregar/editar categoría */}
      <Modal
        open={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
          setEditingCategoryIndex(-1);
          setNewCategory({ name: '', amount: '' });
        }}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la categoría
            </label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Ej: Catering, Música, Flores..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Presupuesto asignado (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newCategory.amount}
              onChange={(e) => setNewCategory({ ...newCategory, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryModal(false);
                setEditingCategory(null);
                setEditingCategoryIndex(-1);
                setNewCategory({ name: '', amount: '' });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? 'Actualizar' : 'Crear'} Categoría
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
