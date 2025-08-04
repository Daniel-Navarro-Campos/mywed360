// Archivo barril (barrel) para exportar componentes UI
// Este archivo facilita la importación agrupada de componentes
// Ejemplo: import { Button, Alert, Badge } from '../../components/ui';

export { default as Card } from './Card';
export { default as Input } from '../Input';
export { default as Button } from './Button';
// Exportaciones de otros componentes UI
// Estos no tienen archivos ahora, pero hay que crearlos o importarlos correctamente
export { default as Spinner } from './Spinner';
export { default as Alert } from './Alert';
export { default as Badge } from './Badge';

// Exportar componente de progreso
export { default as Progress } from './Progress';

// Exportar componentes de Tabs simples (implementación interna)
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
