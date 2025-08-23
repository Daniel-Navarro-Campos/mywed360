/**
 * Componente Tabs especializado para el plan de asientos
 * Navegación entre ceremonia y banquete con indicadores visuales
 */

import React from 'react';
import { Church, Utensils, Users, Grid3X3 } from 'lucide-react';

const SeatingPlanTabs = ({
  activeTab,
  onTabChange,
  ceremonyCount = 0,
  banquetCount = 0,
  className = ""
}) => {
  const tabs = [
    {
      id: 'ceremony',
      label: 'Ceremonia',
      icon: Church,
      count: ceremonyCount,
      description: 'Disposición de asientos para la ceremonia'
    },
    {
      id: 'banquet',
      label: 'Banquete',
      icon: Utensils,
      count: banquetCount,
      description: 'Distribución de mesas para el banquete'
    }
  ];

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              title={tab.description}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              
              {/* Contador de elementos */}
              {tab.count > 0 && (
                <span className={`
                  px-2 py-0.5 text-xs rounded-full
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Indicador de progreso */}
      <div className="h-1 bg-gray-100">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ 
            width: activeTab === 'ceremony' ? '50%' : '100%',
            marginLeft: activeTab === 'ceremony' ? '0%' : '0%'
          }}
        />
      </div>
    </div>
  );
};

export default React.memo(SeatingPlanTabs);
