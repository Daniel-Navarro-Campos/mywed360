import React, { useState } from 'react';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui';
import PageWrapper from '../../components/PageWrapper';

const Timing = () => {
  const [timeline, setTimeline] = useState([
    {
      id: 'ceremonia',
      name: 'Ceremonia',
      startTime: '16:00',
      endTime: '16:45',
      status: 'on-time', // 'on-time', 'slightly-delayed', 'delayed'
      moments: [
        { id: 1, name: 'Llegada de invitados', time: '15:30', duration: '30 min', status: 'on-time' },
        { id: 2, name: 'Entrada de la novia', time: '16:00', duration: '5 min', status: 'on-time' },
        { id: 3, name: 'Lecturas', time: '16:20', duration: '10 min', status: 'on-time' },
      ],
    },
    {
      id: 'coctel',
      name: 'Cóctel',
      startTime: '17:00',
      endTime: '19:00',
      status: 'on-time',
      moments: [
        { id: 4, name: 'Brindis de bienvenida', time: '17:15', duration: '15 min', status: 'on-time' },
        { id: 5, name: 'Fotos de grupo', time: '17:45', duration: '30 min', status: 'on-time' },
      ],
    },
    // ... otros bloques
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'on-time': return 'bg-green-100 text-green-800';
      case 'slightly-delayed': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'on-time': return 'A tiempo';
      case 'slightly-delayed': return 'Ligero retraso';
      case 'delayed': return 'Retrasado';
      default: return 'Sin estado';
    }
  };

  const updateTiming = (blockId, momentId, newTime) => {
    setTimeline(timeline.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          moments: block.moments.map(moment => 
            moment.id === momentId ? { ...moment, time: newTime } : moment
          )
        };
      }
      return block;
    }));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Timing de la Boda</h1>
        <Button>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Añadir Bloque
        </Button>
      </div>
      
      <Card className="p-4">
        <p className="text-gray-600">Organiza la línea de tiempo de tu boda</p>
      </Card>

      <div className="space-y-6">
        {timeline.map((block) => (
          <Card key={block.id} className="overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">{block.name}</h3>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(block.status)}`}>
                  {getStatusLabel(block.status)}
                </span>
                <span className="text-sm text-gray-600">
                  {block.startTime} - {block.endTime}
                </span>
              </div>
            </div>
            
            <div className="divide-y">
              {block.moments.map((moment) => (
                <div key={moment.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(moment.status).split(' ')[0]}`}></div>
                        <h4 className="font-medium">{moment.name}</h4>
                      </div>
                      <div className="ml-6 mt-1 text-sm text-gray-600">
                        <span className="inline-block mr-4">
                          <span className="font-medium">Hora:</span> {moment.time}
                        </span>
                        <span className="inline-block">
                          <span className="font-medium">Duración:</span> {moment.duration}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="p-1 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          const newTime = prompt('Nueva hora (HH:MM):', moment.time);
                          if (newTime) updateTiming(block.id, moment.id, newTime);
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="px-6 py-3 bg-gray-50 text-right">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                + Añadir momento
              </button>
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="p-4 bg-blue-50">
        <div className="space-y-2">
          <h3 className="font-medium text-blue-800 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Consejo de planificación
          </h3>
          <p className="text-sm text-blue-700">
            Asegúrate de incluir tiempos de transición entre eventos. Como regla general, añade un 10-15% de tiempo extra a cada bloque para imprevistos.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Timing;
