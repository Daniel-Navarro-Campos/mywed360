import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useFirestoreCollection } from './useFirestoreCollection';
import { useWedding } from '../context/WeddingContext';
import { saveData, loadData, subscribeSyncState, getSyncState } from '../services/SyncService';
import { getTransactions } from '../services/bankService';

/**
 * Hook centralizado para gestión de finanzas
 * Maneja transacciones, presupuestos, aportaciones y sincronización
 */
export default function useFinance() {
  const { activeWedding } = useWedding();
  
  // Estados principales
  const [syncStatus, setSyncStatus] = useState(getSyncState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configuración de aportaciones y regalos
  const [contributions, setContributions] = useState({
    initA: 0,
    initB: 0,
    monthlyA: 0,
    monthlyB: 0,
    extras: 0,
    giftPerGuest: 0,
    guestCount: 0
  });

  // Presupuesto y categorías
  const [budget, setBudget] = useState({
    total: 30000,
    categories: [
      { name: 'Catering', amount: 8000 },
      { name: 'Música', amount: 2000 },
      { name: 'Flores', amount: 1500 },
      { name: 'Luna de miel', amount: 5000 },
    ]
  });

  // Transacciones usando Firestore
  const { 
    data: transactions, 
    addItem: addTransaction, 
    updateItem: updateTransaction, 
    deleteItem: deleteTransaction 
  } = useFirestoreCollection('transactions', activeWedding, []);

  // Cálculos memoizados
  const monthlyContrib = useMemo(() => 
    contributions.monthlyA + contributions.monthlyB, 
    [contributions.monthlyA, contributions.monthlyB]
  );

  const expectedIncome = useMemo(() => 
    contributions.giftPerGuest * contributions.guestCount + 
    contributions.extras + 
    contributions.initA + 
    contributions.initB + 
    monthlyContrib,
    [contributions, monthlyContrib]
  );

  const emergencyAmount = useMemo(() => 
    Math.round(budget.total * 0.1), 
    [budget.total]
  );

  const totalSpent = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalIncome = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const currentBalance = useMemo(() => 
    totalIncome - totalSpent + expectedIncome,
    [totalIncome, totalSpent, expectedIncome]
  );

  const budgetUsage = useMemo(() => {
    if (!Array.isArray(budget.categories)) return [];
    return budget.categories.map(category => {
      const spent = Array.isArray(transactions) 
        ? transactions
            .filter(t => t.type === 'expense' && t.category === category.name)
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
        : 0;
      
      return {
        ...category,
        spent,
        remaining: category.amount - spent,
        percentage: category.amount > 0 ? (spent / category.amount) * 100 : 0
      };
    });
  }, [budget.categories, transactions]);

  // Estadísticas generales
  const stats = useMemo(() => ({
    totalBudget: budget.total,
    totalSpent,
    totalIncome,
    currentBalance,
    expectedIncome,
    emergencyAmount,
    budgetRemaining: budget.total - totalSpent,
    budgetUsagePercentage: budget.total > 0 ? (totalSpent / budget.total) * 100 : 0
  }), [budget.total, totalSpent, totalIncome, currentBalance, expectedIncome, emergencyAmount]);

  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);

  // Cargar número de invitados desde el perfil de la boda
  const loadGuestCount = useCallback(async () => {
    if (!activeWedding) return;
    
    try {
      setIsLoading(true);
      const infoSnap = await getDoc(doc(db, 'weddings', activeWedding, 'info', 'weddingInfo'));
      if (infoSnap.exists()) {
        const info = infoSnap.data();
        if (info?.numGuests) {
          setContributions(prev => ({
            ...prev,
            guestCount: Number(info.numGuests)
          }));
        }
      }
    } catch (err) {
      console.error('Error cargando número de invitados:', err);
      setError('Error cargando datos del perfil');
    } finally {
      setIsLoading(false);
    }
  }, [activeWedding]);

  // Actualizar configuración de aportaciones
  const updateContributions = useCallback((updates) => {
    setContributions(prev => ({ ...prev, ...updates }));
  }, []);

  // Gestión de categorías de presupuesto
  const addBudgetCategory = useCallback((name, amount = 0) => {
    if (!name || budget.categories.find(c => c.name === name)) {
      return { success: false, error: 'Categoría ya existe o nombre inválido' };
    }
    
    setBudget(prev => ({
      ...prev,
      categories: [...prev.categories, { name, amount }]
    }));
    
    return { success: true };
  }, [budget.categories]);

  const updateBudgetCategory = useCallback((index, updates) => {
    setBudget(prev => ({
      ...prev,
      categories: prev.categories.map((cat, idx) => 
        idx === index ? { ...cat, ...updates } : cat
      )
    }));
  }, []);

  const removeBudgetCategory = useCallback((index) => {
    setBudget(prev => ({
      ...prev,
      categories: prev.categories.filter((_, idx) => idx !== index)
    }));
  }, []);

  // Gestión de transacciones
  const createTransaction = useCallback(async (transactionData) => {
    try {
      setIsLoading(true);
      const result = await addTransaction({
        ...transactionData,
        date: transactionData.date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
      
      if (result.success) {
        // Sincronizar con localStorage para compatibilidad
        const updatedTransactions = [...transactions, result.data];
        saveData('movements', updatedTransactions, {
          docPath: activeWedding ? `weddings/${activeWedding}/finance/main` : undefined,
          showNotification: false
        });
        window.dispatchEvent(new Event('lovenda-movements'));
      }
      
      return result;
    } catch (err) {
      console.error('Error creando transacción:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [addTransaction, transactions, activeWedding]);

  // Importar transacciones bancarias
  const importBankTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const bankTransactions = await getTransactions();
      
      for (const transaction of bankTransactions) {
        await createTransaction({
          concept: transaction.description,
          amount: Math.abs(transaction.amount),
          type: transaction.amount < 0 ? 'expense' : 'income',
          category: transaction.category || 'OTROS',
          source: 'bank'
        });
      }
      
      return { success: true, imported: bankTransactions.length };
    } catch (err) {
      console.error('Error importando transacciones bancarias:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [createTransaction]);

  return {
    // Estados
    syncStatus,
    isLoading,
    error,
    contributions,
    budget,
    transactions,
    
    // Cálculos
    stats,
    budgetUsage,
    monthlyContrib,
    expectedIncome,
    emergencyAmount,
    currentBalance,
    
    // Acciones
    updateContributions,
    loadGuestCount,
    addBudgetCategory,
    updateBudgetCategory,
    removeBudgetCategory,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    importBankTransactions,
    
    // Utilidades
    clearError: () => setError(null)
  };
}
