import React, { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { WidgetContent } from './WidgetContent';
import { WidgetConfig } from './WidgetConfig';

// Animation variants
const widgetVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { 
      duration: 0.15,
      ease: 'easeIn'
    }
  },
  hover: {
    y: -2,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  },
  drag: {
    scale: 1.02,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }
};

export const Widget = ({
  widget,
  index,
  isEditing,
  onRemove,
  onMove,
  onConfigUpdate,
}) => {
  const ref = useRef(null);
  const [showConfig, setShowConfig] = useState(false);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'WIDGET',
    item: { id: widget.id, index },
    canDrag: isEditing,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'WIDGET',
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      
      // Time to actually perform the action
      onMove(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });
  
  // Initialize drag and drop refs
  drag(drop(ref));
  
  const opacity = isDragging ? 0.4 : 1;
  const cursor = isEditing ? 'cursor-move' : 'cursor-default';
  
  return (
    <motion.div 
      ref={ref}
      className="relative group"
      style={{ opacity }}
      variants={widgetVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={isEditing ? "hover" : undefined}
      whileTap={isEditing ? { scale: 0.98 } : undefined}
      drag={isEditing}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      dragElastic={0.1}
      dragMomentum={false}
      layout
    >
      <div 
        className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 ${
          isEditing ? 'ring-2 ring-blue-400 ring-opacity-50 hover:ring-blue-400' : 'hover:shadow-md'
        }`}
      >
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              {widget.type === 'calendar' && (
                <span className="text-blue-500">📅</span>
              )}
              {widget.type === 'tasks' && (
                <span className="text-green-500">✅</span>
              )}
              {widget.type === 'budget' && (
                <span className="text-yellow-500">💰</span>
              )}
              {widget.type === 'guest_list' && (
                <span className="text-purple-500">👥</span>
              )}
              {widget.type === 'timeline' && (
                <span className="text-red-500">⏱️</span>
              )}
              {widget.config.title}
            </h3>
            {isEditing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfig(!showConfig);
                  }}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Configurar widget"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(widget.id);
                  }}
                  className="p-1.5 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label="Eliminar widget"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <div className="w-6 h-6 flex items-center justify-center text-gray-300 cursor-grab active:cursor-grabbing">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <AnimatePresence>
          {showConfig && (
            <motion.div 
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-b border-gray-100"
            >
              <div className="p-4 bg-gray-50">
                <WidgetConfig 
                  config={widget.config} 
                  onUpdate={(newConfig) => onConfigUpdate(widget.id, newConfig)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="p-4">
          <WidgetContent widget={widget} />
        </div>
      </div>
    </motion.div>
  );
};
