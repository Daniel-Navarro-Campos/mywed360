import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from './Widget';
import { WidgetSelector } from './WidgetSelector';
import { WidgetTypes } from './widgets/WidgetTypes';
import { useWidgets } from '../../hooks/useWidgets';

// Animation variants (memoizadas para performance)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export function Dashboard() {
  const { 
    widgets, 
    addWidget, 
    removeWidget, 
    moveWidget, 
    updateWidgetConfig 
  } = useWidgets();
  
  const [isEditing, setIsEditing] = useState(false);
  
  // Set up the appropriate drag and drop backend based on device type (memoizado)
  const dndBackend = useMemo(() => isMobile ? TouchBackend : HTML5Backend, []);
  
  // Memoizar función de toggle editing
  const toggleEditing = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);
  
  // Memoizar función de activar editing mode
  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);
  
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Panel de Control</h1>
          <p className="text-gray-500 mt-1">
            {isEditing 
              ? 'Arrastra y suelta para reorganizar los widgets' 
              : 'Vista general de tu boda'}
          </p>
        </div>
        <button
          onClick={toggleEditing}
          className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
            isEditing
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          {isEditing ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Listo
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Personalizar
            </>
          )}
        </button>
      </motion.div>
      
      <DndProvider backend={dndBackend}>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {widgets.map((widget, index) => (
              <motion.div
                key={widget.id}
                variants={itemVariants}
                layout
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 120
                }}
              >
                <Widget
                  index={index}
                  widget={widget}
                  isEditing={isEditing}
                  onRemove={removeWidget}
                  onMove={moveWidget}
                  onConfigUpdate={updateWidgetConfig}
                />
              </motion.div>
            ))}
            
            {isEditing && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                layout
              >
                <WidgetSelector onSelect={addWidget} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DndProvider>
      
      {widgets.length === 0 && !isEditing && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 text-center text-gray-500"
        >
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" 
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-700">No hay widgets en tu panel</h3>
          <p className="mt-1">Haz clic en "Personalizar" para agregar widgets a tu panel de control.</p>
          <button
            onClick={startEditing}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Agregar widgets
          </button>
        </motion.div>
      )}
    </div>
  );
}
