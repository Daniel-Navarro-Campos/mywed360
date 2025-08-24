import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { Spinner } from '../components/ui';
import Pagination from '../components/Pagination';
import Toast from '../components/Toast';
import { saveAs } from 'file-saver';
import { getTransactions } from '../services/bankService';
import { Plus, Link2, Edit3, AlertCircle, Clock, CheckCircle, AlertTriangle, Download, Upload, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { saveData, loadData, subscribeSyncState, getSyncState } from '../services/SyncService';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../components/ui';
import { Button } from '../components/ui';
import { CategoryBreakdown } from '../components/finance/CategoryBreakdown';
import { BudgetAlerts } from '../components/finance/BudgetAlerts';

import Modal from '../components/Modal';
import { useWedding } from '../context/WeddingContext';

// -------------------------- NUEVA PÁGINA FINANZAS --------------------------
function Finance() {
  const locationHash = typeof window !== 'undefined' ? window.location.hash : '';
  const { activeWedding } = useWedding();
  const [tab, setTab] = useState('contabilidad');

  const [configOpen, setConfigOpen] = React.useState(false);
  // Estado para aportaciones y regalos
  const [initA, setInitA] = React.useState(0);
  const [initB, setInitB] = React.useState(0);
  const [monthlyA, setMonthlyA] = React.useState(0);
  const [monthlyB, setMonthlyB] = React.useState(0);
  const [extras, setExtras] = React.useState(0);
  const [giftPerGuest, setGiftPerGuest] = React.useState(0);
  const [guestCount, setGuestCount] = React.useState(0);
  const monthlyContrib = useMemo(() => monthlyA + monthlyB, [monthlyA, monthlyB]);

  const expectedIncome = useMemo(() => 
    giftPerGuest * guestCount + extras + initA + initB + monthlyContrib,
    [giftPerGuest, guestCount, extras, initA, initB, monthlyContrib]
  );

  // Balance se calcula dinámicamente a partir de todas las transacciones (movimientos manuales + IA + banco)
  const [manualOpen, setManualOpen] = useState(false);

  // Estado de sincronización
  const [syncStatus, setSyncStatus] = useState(getSyncState());

  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);

  // Al abrir/mostrar configuracion intentar cargar número de invitados desde perfil
  React.useEffect(() => {
    if (!configOpen) return;
    (async () => {
      try {
        if (!activeWedding) return;
        const infoSnap = await getDoc(doc(db, 'weddings', activeWedding, 'weddingInfo'));
        if (infoSnap.exists()) {
          const info = infoSnap.data();
          if (info?.numGuests) setGuestCount(Number(info.numGuests));
        }
      } catch (e) { console.error('Error leyendo perfil', e); }
    })();
  }, [configOpen]);

  // Abrir modal de nuevo movimiento si la URL contiene #nuevo
  React.useEffect(() => {
    if (locationHash === '#nuevo') {
      setManualOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  const [newMovement, setNewMovement] = useState({ concept: '', amount: 0, date: '', type: 'expense' });
  // Presupuesto total y categorías
  const [totalBudget, setTotalBudget] = useState(30000);
  const [categories, setCategories] = useState([
    { name: 'Catering', amount: 8000 },
    { name: 'Música', amount: 2000 },
    { name: 'Flores', amount: 1500 },
    { name: 'Luna de miel', amount: 5000 },
  ]);
  const emergencyAmount = useMemo(() => Math.round(totalBudget * 0.1), [totalBudget]);


  const addCategory = useCallback(() => {
    const name = prompt('Nombre de la categoría');
    if (name && !categories.find(c => c.name === name)) {
      setCategories([...categories, { name, amount: 0 }]);
    }
  }, [categories]);
  
  const updateCategory = useCallback((idx, value) => {
    const next = [...categories];
    next[idx].amount = Number(value);
    setCategories(next);
  }, [categories]);

  // --- Cargar movimientos IA/externos con SyncService (memoizada) ---
  const loadStoredMovements = useCallback(() => {
    try {
      return loadData('movements', {
        defaultValue: [],
        docPath: activeWedding ? `weddings/${activeWedding}/finance/main` : undefined
      });
    } catch(error) { 
      console.error('Error al cargar movimientos:', error);
      return []; 
    }
  }, [activeWedding]);

/* upcomingExpenses, upcomingIncomes y pendingExpenses se calculan dinámicamente más abajo */
  const initialHistory = [
    { id: 1, name: 'Reserva finca', amount: 3000, date: '2025-06-01', type: 'expense' },
    { id: 2, name: 'Aportación Persona A', amount: 5000, date: '2025-05-30', type: 'income' },
  ];

  const { data: historyState, addItem: addMovement, updateItem: updateMovement, deleteItem: deleteMovement } = useFirestoreCollection('movements', initialHistory);

  // Compatibilidad con flujo IA antiguo (evento 'lovenda-movements')
  useEffect(() => {
    const handler = async () => {
      try {
        const stored = await loadData('movements', { defaultValue: [], docPath: activeWedding ? `weddings/${activeWedding}/finance/main` : undefined }) || [];
        for (const m of stored) {
          if (!historyState.some(e => e.id === m.id)) {
            await addMovement(m);
          }
        }
      } catch(error){
        console.error('Error al procesar movimientos:', error);
      }
    };
    window.addEventListener('lovenda-movements', handler);
    return () => window.removeEventListener('lovenda-movements', handler);
  }, [historyState, addMovement]);

  // --- Transacciones de banco (si están configuradas las credenciales) ---
  const [bankTransactions, setBankTransactions] = useState([]);
  const [loadingBank, setLoadingBank] = useState(false);

  // Memoizar función de obtener transacciones bancarias
  const fetchTx = useCallback(async () => {
    try {
      setLoadingBank(true);
      const data = await getTransactions({});
      setBankTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching bank transactions', err);
    } finally {
      setLoadingBank(false);
    }
  }, []);

  useEffect(() => {
    fetchTx();
  }, [fetchTx]);

  // Unificar transacciones locales (historial + IA) y del banco
  const transactions = useMemo(() => {
    const merged = [...historyState, ...bankTransactions];
    return merged.map(t => ({
      ...t,
      realCost: t.realCost ?? t.amount,
      category: t.category || 'General',
    }));
  }, [historyState, bankTransactions]);

  // Balance disponible = ingresos - gastos
  const balance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      const amount = Number(t.amount ?? t.realCost ?? 0);
      return acc + (t.type === 'income' ? amount : -amount);
    }, 0);
  }, [transactions]);

  // Cálculos de próximos y pendientes
  const today = new Date();
  const upcomingExpenses = useMemo(() => transactions.filter(t => t.type==='expense' && t.date && new Date(t.date) > today).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,5), [transactions]);
  const upcomingIncomes = useMemo(() => transactions.filter(t => t.type==='income' && t.date && new Date(t.date) > today).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,5), [transactions]);
  const pendingExpenses = useMemo(() => transactions.filter(t => t.type==='expense' && t.date && new Date(t.date) >= today).sort((a,b)=>new Date(a.date)-new Date(b.date)), [transactions]);

  // Calcular gastos totales y porcentaje gastado del presupuesto
  const totalExpenses = React.useMemo(() => transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount ?? t.realCost ?? 0), 0), [transactions]);
  const percentSpent = totalBudget ? (totalExpenses / totalBudget) * 100 : 0;

  const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

  return (
    <div className="p-4 md:p-6 space-y-8 pb-36">
      <h1 className="text-2xl font-semibold">Finanzas</h1>
      <div className="flex gap-2 mt-2">
        {['contabilidad','planificacion'].map(t => (
          <button
            key={t}
            className={`px-3 py-1 rounded ${tab===t? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setTab(t)}
          >
            {t==='contabilidad' ? 'Contabilidad' : 'Planificación'}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 my-4">
        <Button leftIcon={<Link2 size={18} />} onClick={() => alert('Función de vincular banco próximamente')}>Vincular banco</Button>
        <Button leftIcon={<Edit3 size={18} />} onClick={() => setManualOpen(true)}>Añadir movimiento</Button>
        {/* Botón de configuración eliminado */}
        
        
      </div>
      <div className={`flex flex-wrap md:flex-nowrap gap-4 w-full ${tab!=='contabilidad' ? 'hidden' : ''}`}>
        <Card className="p-4 flex-1 md:basis-1/2 min-w-[260px] text-center">
        <h2 className="text-lg font-medium mb-2">Saldo disponible</h2>
        <p className="text-4xl font-bold text-green-600">{fmt.format(balance)}</p>
      </Card>

        
          <Card className="flex-1 md:basis-1/4 min-w-[220px]">
            <h3 className="font-medium mb-2">Próximos gastos</h3>
            <ul className="text-sm space-y-1">
              {upcomingExpenses.map(e => (
                <li key={e.id} className="flex justify-between">
                  <span>{e.name}</span>
                  <span className="text-red-600">{fmt.format(e.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="flex-1 md:basis-1/4 min-w-[220px]">
            <h3 className="font-medium mb-2">Próximos ingresos</h3>
            <ul className="text-sm space-y-1">
              {upcomingIncomes.map(i => (
                <li key={i.id} className="flex justify-between">
                  <span>{i.name}</span>
                  <span className="text-green-600">{fmt.format(i.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        

        

        
      

      </div>

      {/* Sección de gastos pendientes y alertas de presupuesto (solo contabilidad) */}
      <div className={`grid md:grid-cols-2 gap-4 ${tab!=='contabilidad' ? 'hidden' : ''}`}>
        <Card className="p-4">
          <h3 className="font-medium mb-2">Gastos pendientes</h3>
          <table className="w-full text-sm divide-y">
            <thead>
              <tr className="text-left">
                <th>Concepto</th>
                <th>Fecha</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pendingExpenses.map(e => (
                <tr key={e.id} className="border-t">
                  <td>{e.name}</td>
                  <td>{e.date}</td>
                  <td className="text-red-600">{fmt.format(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        
        {/* Alertas de presupuesto */}
        <BudgetAlerts transactions={transactions} budgetLimits={categories.reduce((acc,c)=>{acc[c.name]=c.amount;return acc;},{})} />
      </div>

      {/* Planificación de presupuesto */}
      <Card className="hidden">
        <h3 className="font-medium text-lg">Planificación de presupuesto</h3>
        <div className="flex items-center space-x-2">
          <span>Presupuesto total:</span>
          <input
            type="number"
            className="border rounded px-2 py-1 w-32"
            value={totalBudget}
            onChange={e => setTotalBudget(Number(e.target.value))}
          />
        </div>
        
        <table className="w-full text-sm divide-y">
          <thead>
            <tr className="text-left">
              <th>Categoría</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((cat, idx) => (
              <tr key={cat.name} className="border-t">
                <td className="py-1">{cat.name}</td>
                <td className="py-1">
                  <input
                    type="number"
                    className="border rounded px-1 w-24"
                    value={cat.amount}
                    onChange={e => updateCategory(idx, e.target.value)}
                  />
                </td>
              </tr>
            ))}
            <tr className="border-t font-medium">
              <td className="py-1">Fondo de emergencia (10%)</td>
              <td className="py-1">{fmt.format(emergencyAmount)}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4">
            <div className="w-full bg-gray-200 rounded h-4 overflow-hidden">
              <div className={`h-4 ${percentSpent>100?'bg-red-600':percentSpent>=90?'bg-yellow-500':'bg-green-600'}`} style={{ width: `${Math.min(percentSpent,100)}%` }}></div>
            </div>
            <p className="text-xs text-right mt-1">{percentSpent.toFixed(0)}% del presupuesto gastado</p>
          </div>
          <Button variant="secondary" onClick={addCategory}>+ Añadir categoría</Button>

          {/* Configuración de aportaciones y regalos */}
          <div className="space-y-4 mt-6 hidden">
            <h4 className="font-medium">Aportaciones iniciales</h4>
            <label className="block">
              Persona A (€)
              <input type="number" className="border rounded px-2 py-1 w-full" value={initA} onChange={e=>setInitA(+e.target.value||0)} />
            </label>
            <label className="block">
              Persona B (€)
              <input type="number" className="border rounded px-2 py-1 w-full" value={initB} onChange={e=>setInitB(+e.target.value||0)} />
            </label>

            <h4 className="font-medium mt-3">Aportaciones mensuales</h4>
            <label className="block">
              Persona A (€ / mes)
              <input type="number" className="border rounded px-2 py-1 w-full" value={monthlyA} onChange={e=>setMonthlyA(+e.target.value||0)} />
            </label>
            <label className="block">
              Persona B (€ / mes)
              <input type="number" className="border rounded px-2 py-1 w-full" value={monthlyB} onChange={e=>setMonthlyB(+e.target.value||0)} />
            </label>

            <h4 className="font-medium mt-3">Aportaciones extras</h4>
            <label className="block">
              Total extras (€)
              <input type="number" className="border rounded px-2 py-1 w-full" value={extras} onChange={e=>setExtras(+e.target.value||0)} />
            </label>

            <h4 className="font-medium mt-3">Regalos estimados</h4>
            <label className="block">
              Regalo estimado por invitado (€)
              <input type="number" className="border rounded px-2 py-1 w-full" value={giftPerGuest} onChange={e=>setGiftPerGuest(+e.target.value||0)} />
            </label>
            <label className="block">
              Número de invitados
              <input type="number" className="border rounded px-2 py-1 w-full" value={guestCount} onChange={e=>setGuestCount(+e.target.value||0)} />
            </label>
          </div>
      </Card>

       {/* Panel eliminado - las alertas ya están arriba */}

       {/* === PLANIFICACIÓN === */}
      {tab==='planificacion' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Ingresos esperados */}
          <Card className="p-4 col-span-full lg:col-span-1 text-center">
            <h3 className="text-lg font-medium mb-2">Ingresos esperados</h3>
            <p className="text-3xl font-bold text-green-600">{fmt.format(expectedIncome)}</p>
            <p className="text-sm text-gray-500 mt-1">Aportaciones + regalos</p>
          </Card>

          {/* Aportaciones y extras */}
          <Card className="p-4 space-y-3 lg:col-span-2">
            <h3 className="text-lg font-medium">Aportaciones y regalos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                Persona A (inicial €)
                <input type="number" className="border rounded px-2 py-1 w-full" value={initA} onChange={e=>setInitA(+e.target.value||0)} />
              </label>
              <label className="block">
                Persona B (inicial €)
                <input type="number" className="border rounded px-2 py-1 w-full" value={initB} onChange={e=>setInitB(+e.target.value||0)} />
              </label>
              <label className="block">
                Persona A (mensual €)
                <input type="number" className="border rounded px-2 py-1 w-full" value={monthlyA} onChange={e=>setMonthlyA(+e.target.value||0)} />
              </label>
              <label className="block">
                Persona B (mensual €)
                <input type="number" className="border rounded px-2 py-1 w-full" value={monthlyB} onChange={e=>setMonthlyB(+e.target.value||0)} />
              </label>
              <label className="block">
                Extras (€)
                <input type="number" className="border rounded px-2 py-1 w-full" value={extras} onChange={e=>setExtras(+e.target.value||0)} />
              </label>
              <label className="block">
                Regalo por invitado (€)
                <input type="number" className="border rounded px-2 py-1 w-full" value={giftPerGuest} onChange={e=>setGiftPerGuest(+e.target.value||0)} />
              </label>
              <label className="block">
                Número de invitados
                <input type="number" className="border rounded px-2 py-1 w-full" value={guestCount} onChange={e=>setGuestCount(+e.target.value||0)} />
              </label>
            </div>
          </Card>

          {/* Planificación de presupuesto */}
          <Card className="p-4 space-y-4 col-span-full">
            <h3 className="font-medium text-lg">Planificación de presupuesto</h3>
            <div className="flex items-center space-x-2">
              <span>Presupuesto total:</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-32"
                value={totalBudget}
                onChange={e => setTotalBudget(Number(e.target.value))}
              />
            </div>
            <table className="w-full text-sm divide-y">
              <thead>
                <tr className="text-left">
                  <th>Categoría</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((cat, idx) => (
                  <tr key={cat.name} className="border-t">
                    <td className="py-1">{cat.name}</td>
                    <td className="py-1">
                      <input
                        type="number"
                        className="border rounded px-1 w-24"
                        value={cat.amount}
                        onChange={e => updateCategory(idx, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
                <tr className="border-t font-medium">
                  <td className="py-1">Fondo de emergencia (10%)</td>
                  <td className="py-1">{fmt.format(emergencyAmount)}</td>
                </tr>
              </tbody>
            </table>
            <Button variant="secondary" onClick={addCategory}>+ Añadir categoría</Button>
          </Card>
        </div>
      )}

      {/* Historial */}
      <Card className={`p-4 overflow-x-auto ${tab!=='contabilidad' ? 'hidden' : ''}`}>
        <h3 className="font-medium mb-2">Histórico de gastos e ingresos</h3>
        <table className="w-full text-sm divide-y">
          <thead>
            <tr className="text-left">
              <th>Concepto</th>
              <th>Fecha</th>
              <th>Importe</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {historyState.map(r => (
              <tr key={r.id} className="border-t">
                <td>{r.name}</td>
                <td>{r.date}</td>
                <td className={r.type === 'expense' ? 'text-red-600' : 'text-green-600'}>{fmt.format(r.amount)}</td>
                <td>{r.type === 'expense' ? 'Gasto' : 'Ingreso'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      
      
        <Modal open={configOpen} onClose={() => setConfigOpen(false)} title="Configuración">
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
          <h4 className="font-medium">Aportaciones iniciales</h4>
          <label className="block">
            Persona A (€)
            <input type="number" className="border rounded px-2 py-1 w-full" value={initA} onChange={e=>setInitA(+e.target.value||0)} />
          </label>
          <label className="block">
            Persona B (€)
            <input type="number" className="border rounded px-2 py-1 w-full" value={initB} onChange={e=>setInitB(+e.target.value||0)} />
          </label>

          <h4 className="font-medium mt-3">Aportaciones mensuales</h4>
          <label className="block">
            Persona A (€ / mes)
            <input type="number" className="border rounded px-2 py-1 w-full" value={monthlyA} onChange={e=>setMonthlyA(+e.target.value||0)} />
          </label>
          <label className="block">
            Persona B (€ / mes)
            <input type="number" className="border rounded px-2 py-1 w-full" value={monthlyB} onChange={e=>setMonthlyB(+e.target.value||0)} />
          </label>

          <h4 className="font-medium mt-3">Aportaciones extras (familia u otros ingresos)</h4>
          <label className="block">
            Total extras (€)
            <input type="number" className="border rounded px-2 py-1 w-full" value={extras} onChange={e=>setExtras(+e.target.value||0)} />
          </label>

          <h4 className="font-medium mt-3">Regalos estimados</h4>
          <label className="block">
            Regalo estimado por invitado (€)
            <input type="number" className="border rounded px-2 py-1 w-full" value={giftPerGuest} onChange={e=>setGiftPerGuest(+e.target.value||0)} />
          </label>
          <label className="block">
            Número de invitados
            <input type="number" className="border rounded px-2 py-1 w-full" value={guestCount} onChange={e=>setGuestCount(+e.target.value||0)} />
          </label>

          <div className="text-right mt-4">
            <Button >Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal movimiento manual */}
      <Modal open={manualOpen} onClose={() => setManualOpen(false)} title="Nuevo movimiento">
        <div className="space-y-3">
          <label className="block">
            Concepto
            <input type="text" className="border rounded px-2 py-1 w-full" value={newMovement.concept} onChange={e=>setNewMovement({...newMovement, concept:e.target.value})} />
          </label>
          <label className="block">
            Monto (€)
            <input type="number" className="border rounded px-2 py-1 w-full" value={newMovement.amount} onChange={e=>setNewMovement({...newMovement, amount:+e.target.value||0})} />
          </label>
          <label className="block">
            Fecha
            <input type="date" className="border rounded px-2 py-1 w-full" value={newMovement.date} onChange={e=>setNewMovement({...newMovement, date:e.target.value})} />
          </label>
          <label className="block">
            Tipo
            <select className="border rounded px-2 py-1 w-full" value={newMovement.type} onChange={e=>setNewMovement({...newMovement, type:e.target.value})}>
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </label>
          <div className="text-right space-x-2">
            <Button variant="outline" onClick={()=>setManualOpen(false)}>Cancelar</Button>
            <Button onClick={()=>{const id = `mov-${Date.now()}`;
                const movObj = { ...newMovement, id };
                // Actualizar estados y sincronizar datos
                setNewTransaction({ type: 'expense', date: today, name: '', amount: '', category: 'OTROS' });
                const updatedMovements = [...stored, movObj];
                saveData('movements', updatedMovements, {
                  docPath: activeWedding ? `weddings/${activeWedding}/finance/main` : undefined,
                  showNotification: false
                });
                window.dispatchEvent(new Event('lovenda-movements'));
                setManualOpen(false);}}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
export default Finance;
