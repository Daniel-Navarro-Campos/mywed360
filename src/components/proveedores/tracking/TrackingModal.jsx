import React from 'react';
import { X, Mail, Clock, CheckCircle, Eye, XCircle, ExternalLink, Calendar } from 'lucide-react';
import Button from '../../../components/Button';
import Card from '../../../components/Card';

/**
 * @typedef {import('./EmailTrackingList').EmailTrackingItem} EmailTrackingItem
 */

/**
 * Modal que muestra los detalles completos del seguimiento de un email enviado a un proveedor.
 * Incluye información detallada sobre el estado del email, historial de interacciones,
 * contenido del mensaje, acciones realizadas y estadísticas de apertura.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Indica si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {EmailTrackingItem} props.trackingItem - Elemento de seguimiento a mostrar en detalle
 * @returns {React.ReactElement|null} Modal de detalles de seguimiento o null si no está abierto
 */
const TrackingModal = ({ isOpen, onClose, trackingItem }) => {
  if (!isOpen || !trackingItem) return null;

  // Función para obtener el color y texto según el estado del email
  const getStatusInfo = (status) => {
    switch (status) {
      case 'enviado':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: <Mail size={20} className="text-blue-600" />,
          text: 'Enviado'
        };
      case 'entregado':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: <CheckCircle size={20} className="text-green-600" />,
          text: 'Entregado'
        };
      case 'leido':
        return {
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          icon: <Eye size={20} className="text-purple-600" />,
          text: 'Leído'
        };
      case 'error':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: <XCircle size={20} className="text-red-600" />,
          text: 'Error'
        };
      case 'pendiente':
        return {
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
          icon: <Clock size={20} className="text-amber-600" />,
          text: 'Pendiente'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: <Clock size={20} className="text-gray-600" />,
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
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Datos de ejemplo para la visualización
  const statusInfo = getStatusInfo(trackingItem.status);

  // Historial de actividad de ejemplo
  const activities = [
    {
      type: 'send',
      date: trackingItem.sentAt,
      detail: `Email enviado a ${trackingItem.recipientEmail || 'destinatario'}`
    }
  ];

  // Añadir eventos adicionales basados en el estado
  if (trackingItem.status !== 'enviado' && trackingItem.status !== 'error') {
    activities.push({
      type: 'deliver',
      date: trackingItem.deliveredAt || new Date(new Date(trackingItem.sentAt).getTime() + 60000).toISOString(),
      detail: 'Email entregado al servidor de destino'
    });
  }

  if (trackingItem.status === 'leido') {
    // Añadir eventos de apertura
    const openCount = trackingItem.openCount || 1;
    for (let i = 0; i < openCount; i++) {
      activities.push({
        type: 'open',
        date: i === 0 
          ? trackingItem.firstOpenedAt || new Date(new Date(trackingItem.sentAt).getTime() + 300000).toISOString()
          : new Date(new Date(trackingItem.sentAt).getTime() + (300000 * (i + 1))).toISOString(),
        detail: `Email abierto ${i === 0 ? 'por primera vez' : `(apertura #${i + 1})`}`
      });
    }
  }

  if (trackingItem.status === 'error') {
    activities.push({
      type: 'error',
      date: trackingItem.errorAt || new Date(new Date(trackingItem.sentAt).getTime() + 120000).toISOString(),
      detail: trackingItem.errorMessage || 'Error en la entrega del email'
    });
  }

  // Ordenar actividades por fecha
  activities.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Seguimiento de Email</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido principal con scroll */}
        <div className="overflow-y-auto p-4 flex-1">
          {/* Información del email */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Información del email</h3>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                {statusInfo.icon}
                <span className="ml-1 font-medium">{statusInfo.text}</span>
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Asunto</p>
                <p className="font-medium">{trackingItem.subject}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Proveedor</p>
                  <p className="font-medium">{trackingItem.providerName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Destinatario</p>
                  <p className="font-medium">{trackingItem.recipientEmail || 'No disponible'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Enviado</p>
                  <p className="font-medium">{formatDateTime(trackingItem.sentAt)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Última actualización</p>
                  <p className="font-medium">{formatDateTime(trackingItem.lastUpdated || trackingItem.sentAt)}</p>
                </div>
              </div>

              {trackingItem.openCount > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Aperturas</p>
                  <p className="font-medium text-green-600">{trackingItem.openCount} {trackingItem.openCount === 1 ? 'vez' : 'veces'}</p>
                </div>
              )}
              
              {trackingItem.errorMessage && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200 text-red-700">
                  <p className="font-medium mb-1">Error</p>
                  <p className="text-sm">{trackingItem.errorMessage}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Historial de actividad */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Historial de actividad</h3>
            
            <div className="relative">
              {/* Línea de tiempo vertical */}
              <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200"></div>
              
              {/* Eventos */}
              <div className="space-y-6">
                {activities.map((activity, index) => {
                  let icon;
                  let iconBg;
                  
                  switch(activity.type) {
                    case 'send':
                      icon = <Mail size={16} className="text-white" />;
                      iconBg = 'bg-blue-500';
                      break;
                    case 'deliver':
                      icon = <CheckCircle size={16} className="text-white" />;
                      iconBg = 'bg-green-500';
                      break;
                    case 'open':
                      icon = <Eye size={16} className="text-white" />;
                      iconBg = 'bg-purple-500';
                      break;
                    case 'error':
                      icon = <XCircle size={16} className="text-white" />;
                      iconBg = 'bg-red-500';
                      break;
                    default:
                      icon = <Clock size={16} className="text-white" />;
                      iconBg = 'bg-gray-500';
                  }
                  
                  return (
                    <div key={index} className="flex">
                      <div className="relative flex items-center justify-center">
                        <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center z-10`}>
                          {icon}
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-sm text-gray-500 mb-1">
                            {formatDateTime(activity.date)}
                          </p>
                          <p className="font-medium">{activity.detail}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contenido del email (ejemplo) */}
          <Card>
            <h3 className="text-lg font-medium mb-4">Contenido del email</h3>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="mb-4">
                <p><strong>De:</strong> Tu Correo de Lovenda</p>
                <p><strong>Para:</strong> {trackingItem.recipientEmail || 'proveedor@ejemplo.com'}</p>
                <p><strong>Asunto:</strong> {trackingItem.subject}</p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p>Estimado proveedor,</p>
                <br/>
                <p>Este es un ejemplo del contenido del email que se envió al proveedor.</p>
                <p>En una implementación real, aquí se mostraría el contenido real del email enviado.</p>
                <br/>
                <p>Saludos cordiales,</p>
                <p>Tu Nombre</p>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Footer con botones */}
        <div className="border-t p-4 bg-gray-50 flex justify-between">
          <div>
            <Button variant="outline" size="sm" className="flex items-center">
              <Calendar size={16} className="mr-1" /> Programar seguimiento
            </Button>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              variant="outline" 
              className="flex items-center"
              onClick={() => window.open(`mailto:${trackingItem.recipientEmail || ''}`)}
            >
              <Mail size={16} className="mr-1" /> Responder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingModal;
