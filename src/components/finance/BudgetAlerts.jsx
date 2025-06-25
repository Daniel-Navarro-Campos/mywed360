import React from 'react';
import Card from '../Card';
import { AlertCircle, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export const BudgetAlerts = ({ transactions, budgetLimits = {} }) => {
  // Calcular totales por categoría
  const categoryTotals = React.useMemo(() => {
    return transactions.reduce((acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = { expense: 0, income: 0 };
      }
      acc[curr.category][curr.type] += parseFloat(curr.realCost || 0);
      return acc;
    }, {});
  }, [transactions]);

  // Generar alertas
  const alerts = React.useMemo(() => {
    const result = [];
    const now = new Date();
    
    // Verificar presupuestos por categoría
    Object.entries(categoryTotals).forEach(([category, { expense }]) => {
      const limit = budgetLimits[category] || 0;
      if (limit > 0) {
        const percentage = (expense / limit) * 100;
        
        if (expense > limit) {
          result.push({
            type: 'error',
            message: `¡Presupuesto excedido en ${category}! (${percentage.toFixed(0)}%)`,
            icon: <AlertCircle className="text-red-500" />
          });
        } else if (percentage >= 90) {
          result.push({
            type: 'warning',
            message: `Cuidado: ${category} al ${percentage.toFixed(0)}% del presupuesto`,
            icon: <AlertTriangle className="text-yellow-500" />
          });
        }
      }
    });

    // Verificar pagos pendientes
    const pendingPayments = transactions.filter(
      t => t.status === 'pending' && new Date(t.paymentDate) < now
    );

    if (pendingPayments.length > 0) {
      result.push({
        type: 'warning',
        message: `${pendingPayments.length} pagos pendientes de vencimiento`,
        icon: <Clock className="text-yellow-500" />,
        items: pendingPayments.map(p => ({
          name: p.item,
          amount: p.realCost,
          dueDate: p.paymentDate
        }))
      });
    }

    // Si no hay alertas, mostrar mensaje positivo
    if (result.length === 0) {
      result.push({
        type: 'success',
        message: '¡Todo en orden! No hay alertas importantes.'
      });
    }

    return result;
  }, [categoryTotals, transactions, budgetLimits]);

  return (
    <Card className="p-4 h-full">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlertCircle className="text-blue-500" />
        Alertas de Presupuesto
      </h3>
      
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div 
            key={index}
            className={`p-3 rounded-lg ${
              alert.type === 'error' ? 'bg-red-50 border border-red-200' :
              alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-green-50 border border-green-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {alert.icon || <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />}
              <div>
                <p className="text-sm font-medium">{alert.message}</p>
                {alert.items && (
                  <div className="mt-2 space-y-1">
                    {alert.items.map((item, i) => (
                      <div key={i} className="text-xs text-gray-600 flex justify-between">
                        <span>{item.name}</span>
                        <span className="font-medium">€{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
