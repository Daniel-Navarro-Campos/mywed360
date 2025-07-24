import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, X, Check, AlertCircle } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';

/**
 * Componente para extraer información de eventos y fechas desde emails y crear eventos en el calendario
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.email - Datos del email del cual extraer información
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onSave - Función llamada al guardar el evento
 * @returns {React.ReactElement} Formulario de integración con calendario
 */
const CalendarIntegration = ({ email, onClose, onSave }) => {
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    time: '12:00',
    location: '',
    description: '',
    attendees: [],
    providerRelated: false,
    providerId: null,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [extractedInfo, setExtractedInfo] = useState([]);
  
  useEffect(() => {
    if (!email) {
      setError('No hay email para analizar');
      setLoading(false);
      return;
    }
    
    // Extraer posibles fechas, ubicaciones y personas del email
    extractEventInfo(email);
  }, [email]);
  
  /**
   * Extrae información relevante para eventos del contenido del email
   */
  const extractEventInfo = (email) => {
    setLoading(true);
    
    try {
      // En un entorno real, aquí podríamos usar algún servicio de NLP
      // Por ahora, usamos una implementación sencilla basada en expresiones regulares
      
      // Título posible basado en asunto del email
      const possibleTitle = email.subject ? email.subject.replace(/^Re: |^Fwd: /gi, '') : '';
      
      // Extraer posibles fechas (formato DD/MM/YYYY o similar)
      const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})|(\d{1,2}) de ([a-zá-úñ]+)( de (\d{4}))?/gi;
      const dates = [];
      let dateMatch;
      const bodyText = email.body || '';
      
      while ((dateMatch = dateRegex.exec(bodyText)) !== null) {
        // Convertir a formato de fecha ISO
        let formattedDate = '';
        if (dateMatch[1]) { // Formato numérico
          formattedDate = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
        } else { // Formato con mes en texto
          const monthNames = {
            'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
            'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
            'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
          };
          const month = monthNames[dateMatch[5].toLowerCase()];
          const year = dateMatch[7] || new Date().getFullYear().toString();
          formattedDate = `${year}-${month}-${dateMatch[4].padStart(2, '0')}`;
        }
        
        dates.push({
          type: 'date',
          value: formattedDate,
          original: dateMatch[0]
        });
      }
      
      // Extraer posibles horas (formato HH:MM o similar)
      const timeRegex = /(\d{1,2}):(\d{2})( ?(?:AM|PM|a\.m\.|p\.m\.))?/gi;
      const times = [];
      let timeMatch;
      
      while ((timeMatch = timeRegex.exec(bodyText)) !== null) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2];
        const period = timeMatch[3]?.trim().toLowerCase();
        
        // Convertir a formato 24 horas si es necesario
        if (period && (period === 'pm' || period === 'p.m.')) {
          if (hours < 12) hours += 12;
        } else if (period && (period === 'am' || period === 'a.m.') && hours === 12) {
          hours = 0;
        }
        
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
        
        times.push({
          type: 'time',
          value: formattedTime,
          original: timeMatch[0]
        });
      }
      
      // Extraer posibles ubicaciones
      const locationKeywords = ['en', 'ubicado en', 'ubicada en', 'dirección', 'lugar', 'local', 'ubicación'];
      const locationRegex = new RegExp(`(${locationKeywords.join('|')})\\s+([^.,;:\\n]{5,50})`, 'gi');
      const locations = [];
      let locationMatch;
      
      while ((locationMatch = locationRegex.exec(bodyText)) !== null) {
        locations.push({
          type: 'location',
          value: locationMatch[2].trim(),
          original: locationMatch[0]
        });
      }
      
      // Extraer posibles personas/contactos
      // Esto es simplificado, en un entorno real usaríamos NLP más avanzado
      const attendeeRegex = /([A-Za-zÁ-ÿÑñ]{2,} [A-Za-zÁ-ÿÑñ]{2,})/g;
      const attendees = new Set();
      let attendeeMatch;
      
      while ((attendeeMatch = attendeeRegex.exec(bodyText)) !== null) {
        const name = attendeeMatch[1].trim();
        // Filtrar nombres muy cortos o que parecen no ser nombres
        if (name.length > 4 && !['para', 'este', 'esta', 'esos', 'esas', 'todos', 'todas'].includes(name.toLowerCase())) {
          attendees.add(name);
        }
      }
      
      // Verificar si el email está relacionado con un proveedor
      const isProviderRelated = email.to?.includes('proveedor') || 
                                email.from?.includes('proveedor') ||
                                bodyText.toLowerCase().includes('proveedor') ||
                                bodyText.toLowerCase().includes('servicio') ||
                                bodyText.toLowerCase().includes('contratación');
      
      // Compilar toda la información extraída
      const allExtracted = [
        ...dates,
        ...times,
        ...locations,
        ...[...attendees].map(name => ({ type: 'attendee', value: name, original: name }))
      ];
      
      setExtractedInfo(allExtracted);
      
      // Preparar datos iniciales para el formulario con la información más probable
      setEventData({
        title: possibleTitle,
        date: dates.length > 0 ? dates[0].value : '',
        time: times.length > 0 ? times[0].value : '12:00',
        location: locations.length > 0 ? locations[0].value : '',
        description: `Evento creado a partir del email: "${email.subject || '(Sin asunto)'}"`,
        attendees: [...attendees],
        providerRelated: isProviderRelated,
        providerId: email.providerId || null
      });
      
    } catch (err) {
      console.error('Error al analizar email:', err);
      setError('No se pudo analizar correctamente el contenido del email');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAttendeeChange = (index, value) => {
    const newAttendees = [...eventData.attendees];
    newAttendees[index] = value;
    
    setEventData(prev => ({
      ...prev,
      attendees: newAttendees
    }));
  };
  
  const removeAttendee = (index) => {
    setEventData(prev => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index)
    }));
  };
  
  const addAttendee = () => {
    setEventData(prev => ({
      ...prev,
      attendees: [...prev.attendees, '']
    }));
  };
  
  const handleSubmit = () => {
    // Validación básica
    if (!eventData.title) {
      setError('El título del evento es obligatorio');
      return;
    }
    
    if (!eventData.date) {
      setError('Debes seleccionar una fecha para el evento');
      return;
    }
    
    // Formatear datos para guardar
    const formattedEvent = {
      ...eventData,
      // Combinar fecha y hora en un solo campo ISO
      dateTime: `${eventData.date}T${eventData.time}:00`,
      // Filtrar asistentes vacíos
      attendees: eventData.attendees.filter(a => a.trim())
    };
    
    onSave(formattedEvent);
    onClose();
  };
  
  const applyExtracted = (item) => {
    switch (item.type) {
      case 'date':
        setEventData(prev => ({ ...prev, date: item.value }));
        break;
      case 'time':
        setEventData(prev => ({ ...prev, time: item.value }));
        break;
      case 'location':
        setEventData(prev => ({ ...prev, location: item.value }));
        break;
      case 'attendee':
        if (!eventData.attendees.includes(item.value)) {
          setEventData(prev => ({ 
            ...prev, 
            attendees: [...prev.attendees, item.value] 
          }));
        }
        break;
      default:
        break;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-xl font-bold flex items-center">
            <Calendar size={24} className="mr-2 text-blue-500" />
            Añadir evento al calendario
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-grow">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
              <AlertCircle size={18} className="flex-shrink-0 mr-2" />
              <span>{error}</span>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-8">Analizando contenido del email...</div>
          ) : (
            <>
              {extractedInfo.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Información detectada en el email:</h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedInfo.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-sm bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100"
                        onClick={() => applyExtracted(item)}
                        title={`Usar ${item.type === 'date' ? 'esta fecha' : 
                                 item.type === 'time' ? 'esta hora' : 
                                 item.type === 'location' ? 'esta ubicación' : 
                                 'este asistente'}`}
                      >
                        {item.type === 'date' && <Calendar size={14} className="mr-1 text-blue-600" />}
                        {item.type === 'time' && <Clock size={14} className="mr-1 text-blue-600" />}
                        {item.type === 'location' && <MapPin size={14} className="mr-1 text-blue-600" />}
                        {item.type === 'attendee' && <User size={14} className="mr-1 text-blue-600" />}
                        {item.original}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título del evento:</label>
                  <input
                    type="text"
                    name="title"
                    value={eventData.title}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2"
                    placeholder="Título del evento"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha:</label>
                    <input
                      type="date"
                      name="date"
                      value={eventData.date}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora:</label>
                    <input
                      type="time"
                      name="time"
                      value={eventData.time}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación:</label>
                  <input
                    type="text"
                    name="location"
                    value={eventData.location}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2"
                    placeholder="Ubicación del evento"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción:</label>
                  <textarea
                    name="description"
                    value={eventData.description}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2"
                    rows="3"
                    placeholder="Descripción del evento"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asistentes:</label>
                  
                  {eventData.attendees.map((attendee, index) => (
                    <div key={index} className="flex mb-2">
                      <input
                        type="text"
                        value={attendee}
                        onChange={(e) => handleAttendeeChange(index, e.target.value)}
                        className="flex-grow border border-gray-300 rounded-md p-2"
                        placeholder="Nombre del asistente"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttendee(index)}
                        className="ml-2"
                      >
                        <X size={18} />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAttendee}
                    className="mt-1"
                  >
                    Añadir asistente
                  </Button>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="providerRelated"
                    name="providerRelated"
                    checked={eventData.providerRelated}
                    onChange={(e) => setEventData(prev => ({
                      ...prev,
                      providerRelated: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <label htmlFor="providerRelated" className="text-sm text-gray-700">
                    Este evento está relacionado con un proveedor
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center"
            >
              <Check size={18} className="mr-1" />
              Guardar evento
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CalendarIntegration;
