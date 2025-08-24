import React, { useState, useMemo } from 'react';
import { Card, Button } from '../ui';
import { Plus, Edit3, Trash2, Download, Upload, Search, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import Modal from '../Modal';
import TransactionForm from './TransactionForm';

/**
 * Componente para gestión de transacciones
 * Incluye lista, filtros, formularios y acciones masivas
 */
export default function TransactionManager({ 
  transactions, 
  onCreateTransaction, 
  onUpdateTransaction, 
  onDeleteTransaction,
  onImportBank,
  isLoading 
}) {
  // Estados para filtros y modales
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Transacciones filtradas
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.concept?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !typeFilter || transaction.type === typeFilter;
      const matchesCategory = !categoryFilter || transaction.category === categoryFilter;
      
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter]);

  // Categorías únicas para el filtro
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
    return uniqueCategories.sort();
  }, [transactions]);

  // Estadísticas de transacciones filtradas
  const stats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Manejar apertura de modal para nueva transacción
  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowTransactionModal(true);
  };

  // Manejar apertura de modal para editar transacción
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  // Manejar guardado de transacción
  const handleSaveTransaction = async (transactionData) => {
    try {
      let result;
      if (editingTransaction) {
        result = await onUpdateTransaction(editingTransaction.id, transactionData);
      } else {
        result = await onCreateTransaction(transactionData);
      }
      
      if (result.success) {
        setShowTransactionModal(false);
        setEditingTransaction(null);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error guardando transacción:', error);
      alert('Error inesperado al guardar la transacción');
    }
  };

  // Manejar eliminación de transacción
  const handleDeleteTransaction = async (transaction) => {
    if (window.confirm(`¿Estás seguro de eliminar la transacción "${transaction.concept}"?`)) {
      const result = await onDeleteTransaction(transaction.id);
      if (!result.success) {
        alert(`Error eliminando transacción: ${result.error}`);
      }
    }
  };

  // Exportar transacciones a CSV
  const handleExportCSV = () => {
    const headers = ['Fecha', 'Concepto', 'Tipo', 'Categoría', 'Monto'];
    const csvData = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.date,
        `"${t.concept || t.description || ''}"`,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        t.category || '',
        t.amount || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacciones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Transacciones</h2>
          <p className="text-sm text-gray-600">
            {stats.count} transacciones • Balance: {formatCurrency(stats.balance)}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            leftIcon={<Upload size={16} />}
            onClick={onImportBank}
            disabled={isLoading}
          >
            Importar Banco
          </Button>
          <Button
            variant="outline"
            leftIcon={<Download size={16} />}
            onClick={handleExportCSV}
          >
            Exportar CSV
          </Button>
          <Button
            leftIcon={<Plus size={16} />}
            onClick={handleAddTransaction}
          >
            Nueva Transacción
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por tipo */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>

          {/* Filtro por categoría */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Limpiar filtros */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('');
              setCategoryFilter('');
            }}
            className="w-full"
          >
            Limpiar Filtros
          </Button>
        </div>
      </Card>

      {/* Lista de transacciones */}
      <Card className="overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No hay transacciones que mostrar</p>
            <Button
              className="mt-4"
              onClick={handleAddTransaction}
              leftIcon={<Plus size={16} />}
            >
              Crear primera transacción
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {transaction.concept || transaction.description || 'Sin concepto'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.category || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount || 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditTransaction(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de formulario de transacción */}
      <Modal
        open={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
        size="lg"
      >
        <TransactionForm
          transaction={editingTransaction}
          onSave={handleSaveTransaction}
          onCancel={() => {
            setShowTransactionModal(false);
            setEditingTransaction(null);
          }}
          isLoading={isLoading}
        />
      </Modal>
    </div>
  );
}
