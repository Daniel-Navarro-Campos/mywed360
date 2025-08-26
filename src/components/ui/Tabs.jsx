import React, { createContext, useContext, useState } from 'react';

// Contexto para compartir el valor actual de la pestaña
const TabsContext = createContext({ value: '', setValue: () => {} });

/**
 * Componente raíz de Tabs.
 * @param {string} defaultValue - Valor inicial de la pestaña seleccionada.
 */
export function Tabs({
  defaultValue = '',
  value: controlledValue,
  onValueChange,
  children,
  className = '',
}) {
    // Soporta modo controlado y no controlado.
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const setValue = (val) => {
    if (isControlled) {
      onValueChange?.(val);
    } else {
      setInternalValue(val);
    }
  };
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/** Lista de pestañas (encabezados) */
export function TabsList({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

/**
 * Gatillo (botón) para cambiar de pestaña.
 * @param {string} value - Valor asociado a esta pestaña.
 */
export function TabsTrigger({ value, children, className = '' }) {
  const { value: current, setValue } = useContext(TabsContext);
  const isActive = current === value;
  return (
    <button
      type="button"
      className={`${className} ${isActive ? 'font-bold border-b-2 border-blue-500' : 'text-gray-600'}`}
      onClick={() => setValue(value)}
    >
      {children}
    </button>
  );
}

/**
 * Contenido asociado a una pestaña.
 * Solo se renderiza si su valor coincide con la pestaña seleccionada.
 */
export function TabsContent({ value, children, className = '' }) {
  const { value: current } = useContext(TabsContext);
  if (current !== value) return null;
  return <div className={className}>{children}</div>;
}
