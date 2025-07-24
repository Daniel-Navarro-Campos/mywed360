import React from 'react';
import { Clock, Mail, CheckCircle, AlertCircle, XCircle, Eye } from 'lucide-react';
import Button from '../../../components/Button';
import Card from '../../../components/Card';

/**
 * @typedef {Object} EmailTrackingItem
 * @property {string} id - ID único del elemento de seguimiento
 * @property {string} providerId - ID del proveedor asociado
 * @property {string} providerName - Nombre del proveedor
 * @property {string} subject - Asunto del email
 * @property {string} status - Estado del email (enviado, entregado, leido, error, etc.)
 * @property {string} date - Fecha de envío
 * @property {number} [openCount] - Número de veces que fue abierto (solo para estado 'leido')
 * @property {string} [lastOpenDate] - Última fecha de apertura (solo para estado 'leido')
 * @property {string} [errorMessage] - Mensaje de error (solo para estado 'error')
 */

/**
 * Componente que muestra una lista de seguimiento de emails enviados a proveedores.
 * Permite filtrar por estado y ver detalles de cada email enviado.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {EmailTrackingItem[]} [props.trackingItems=[]] - Lista de elementos de seguimiento de emails
 * @param {Function} props.onViewDetails - Función para ver detalles de un elemento de seguimiento
 * @param {Function} props.onFilter - Función para filtrar la lista por estado
 * @param {string} props.currentFilter - Filtro actual aplicado ('todos', 'enviados', 'entregados', 'leidos', 'error')
 * @returns {React.ReactElement} Componente de lista de seguimiento de emails
 */
const EmailTrackingList = ({ trackingItems = [], onViewDetails, onFilter, currentFilter }) => {
  // Función para obtener el color y texto según el estado del email
  const getStatusInfo = (status) => {
    switch (status) {
      case 'enviado':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: <Mail size={16} />,
          text: 'Enviado'
        };
      case 'entregado':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: <CheckCircle size={16} />,
          text: 'Entregado'
        };
      case 'leido':
        return {
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          icon: <Eye size={16} />,
          text: 'Leído'
        };
      case 'error':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: <XCircle size={16} />,
          text: 'Error'
        };
      case 'pendiente':
        return {
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
          icon: <Clock size={16} />,
          text: 'Pendiente'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: <AlertCircle size={16} />,
          text: 'Desconocido'
        };
    }
  };
  
  // Formatear fecha y hora
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };
  
  // Ejemplos de datos para el seguimiento si no hay datos reales
  const demoTrackingItems = [
    {
      id: 1,
      providerId: 101,
      providerName: 'Fotografía Naturaleza Viva',
      subject: 'Consulta de disponibilidad para sesión de fotos',
      sentAt: '2025-05-10T14:30:00',
      status: 'leido',
      lastUpdated: '2025-05-10T15:45:00',
      openCount: 3
    },
    {
      id: 2,
      providerId: 102,
      providerName: 'Catering Delicious Moments',
      subject: 'Presupuesto para evento de 100 invitados',
      sentAt: '2025-05-09T10:15:00',
      status: 'enviado',
      lastUpdated: '2025-05-09T10:15:00',
      openCount: 0
    },
    {
      id: 3,
      providerId: 103,
      providerName: 'DJ Sound & Lights',
      subject: 'Confirmación de reserva para boda',
      sentAt: '2025-05-08T16:20:00',
      status: 'entregado',
      lastUpdated: '2025-05-08T16:22:00',
      openCount: 0
    }
  ];
  
  // Usar datos reales si están disponibles, o los datos de demostración
  const displayItems = trackingItems.length > 0 ? trackingItems : demoTrackingItems;
  
  // Filtrar elementos según el filtro actual
  const filteredItems = currentFilter === 'todos' 
    ? displayItems 
    : displayItems.filter(item => item.status === currentFilter);
  
  return (
    <div className="space-y-4">
      {/* Filtros de estado */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['todos', 'enviado', 'entregado', 'leido', 'error', 'pendiente'].map(filter => (
          <Button
            key={filter}
            onClick={() => onFilter(filter)}
            variant={filter === currentFilter ? 'default' : 'outline'}
            size="sm"
            className={`capitalize ${
              filter === currentFilter ? '' : 'text-gray-600'
            }`}
          >
            {filter === 'todos' ? 'Todos' : getStatusInfo(filter).text}
          </Button>
        ))}
      </div>
      
      {/* Lista de elementos de seguimiento */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map(item => {
            const statusInfo = getStatusInfo(item.status);
            
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">{item.providerName}</h3>
                      <span className={`text-xs ${statusInfo.color} ${statusInfo.bgColor} flex items-center gap-1 px-2 py-1 rounded-full`}>
                        {statusInfo.icon} {statusInfo.text}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-700 mb-1 truncate">
                      {item.subject}
                    </p>
                    
                    <div className="flex items-center text-xs text-gray-500 gap-x-4">
                      <span>Enviado: {formatDateTime(item.sentAt)}</span>
                      {item.lastUpdated !== item.sentAt && (
                        <span>Actualizado: {formatDateTime(item.lastUpdated)}</span>
                      )}
                      {item.openCount > 0 && (
                        <span className="text-green-600 flex items-center">
                          <Eye size={12} className="mr-1" /> Abierto {item.openCount} {item.openCount === 1 ? 'vez' : 'veces'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => onViewDetails(item)} 
                    variant="ghost" 
                    size="sm"
                  >
                    Detalles
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No hay emails de seguimiento que coincidan con el filtro seleccionado.
        </div>
      )}
    </div>
  );
};

// Optimizar renderizado con React.memo para evitar renderizados innecesarios
export default React.memo(EmailTrackingList, (prevProps, nextProps) => {
  // Solo re-renderizar cuando los datos de seguimiento o filtros cambien
  return (
    prevProps.trackingItems?.length === nextProps.trackingItems?.length &&
    JSON.stringify(prevProps.trackingItems) === JSON.stringify(nextProps.trackingItems) &&
    prevProps.currentFilter === nextProps.currentFilter
  );
});
