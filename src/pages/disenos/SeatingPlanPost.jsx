import React from 'react';
import Card from '../../components/Card';
import { saveData, loadData } from '../../services/SyncService';
import ImageGeneratorAI from '../../components/ImageGeneratorAI';

// Plantillas predefinidas para carteles de seating plan
const seatingPlanTemplates = [
  {
    name: 'Elegante & Clásico',
    description: 'Cartel de asignación de mesas con diseño formal y refinado',
    prompt: 'Diseña un cartel elegante para el seating plan (asignación de mesas) de una boda. Estilo formal con tipografía serif. Incluye el título "Seating Plan" o "Distribución de Mesas" con un diseño elegante. El cartel debe tener espacio para listar nombres de invitados organizados por mesas. Usa colores neutros con toques dorados o plateados. El diseño debe ser sofisticado y fácil de leer.'
  },
  {
    name: 'Rústico & Natural',
    description: 'Cartel de estilo rústico con elementos naturales y madera',
    prompt: 'Crea un cartel de seating plan con estética rústica para una boda. Utiliza elementos como madera, flores silvestres y elementos naturales. Diseño que parezca una pizarra o tabla de madera con los nombres escritos. Incluye el título "Encuentra tu sitio" o similar. Estilo cálido y acogedor, con aspecto artesanal. La distribución debe permitir organizar nombres por mesas de forma clara.'
  },
  {
    name: 'Minimalista & Moderno',
    description: 'Diseño limpio con tipografía sencilla y organización clara',
    prompt: 'Diseña un cartel de seating plan minimalista y moderno para una boda. Utiliza mucho espacio en blanco, tipografía sans-serif limpia y elementos geométricos simples. El título debe ser "Seating Plan" o "Tu mesa". Organización visual muy clara con números de mesa bien destacados. Colores monocromáticos con posibles acentos en un solo color. Diseño contemporáneo, limpio y extremadamente legible.'
  },
  {
    name: 'Temático & Creativo',
    description: 'Cartel personalizado con temática especial (viajes, naturaleza, etc)',
    prompt: 'Crea un cartel de seating plan con diseño temático creativo. Utiliza una temática de viajes/mapas donde cada mesa representa un destino o lugar. Incluye elementos gráficos como brújulas, mapas, aviones o globos. El título puede ser "Encuentra tu destino" o similar. El diseño debe ser original y visualmente atractivo, permitiendo que los invitados identifiquen fácilmente su mesa asignada.'
  },
  {
    name: 'Romántico & Floral',
    description: 'Cartel decorado con flores, motivos románticos y colores suaves',
    prompt: 'Diseña un cartel de seating plan romántico con abundantes elementos florales para una boda. Utiliza una paleta de colores suaves como rosa, lavanda y verde salvia. Incorpora ilustraciones delicadas de flores y elementos botánicos. El título puede ser "Con cariño, os hemos asignado" o similar. Tipografía elegante y caligráfica. El diseño debe transmitir romanticismo y delicadeza, organizado de forma clara para que los invitados encuentren fácilmente su mesa.'
  },
];

export default function SeatingPlanPost() {
  // Obtener información de invitados y mesas si está disponible
  const getSeatingInfo = () => {
    try {
      const guests = loadData('lovendaGuests', { defaultValue: [], collection: 'userGuests' });
      const tables = loadData('lovendaTables', { defaultValue: [], collection: 'userTables' });
      
      // Si no hay datos suficientes, devolver cadena vacía
      if (!guests.length || !tables.length) return '';
      
      // Agrupar invitados por mesa
      const guestsByTable = {};
      guests.forEach(guest => {
        if (guest.tableId) {
          if (!guestsByTable[guest.tableId]) {
            guestsByTable[guest.tableId] = [];
          }
          guestsByTable[guest.tableId].push(guest.name);
        }
      });
      
      // Crear prompt con la información real
      let tableInfo = [];
      tables.forEach(table => {
        const tableGuests = guestsByTable[table.id] || [];
        if (tableGuests.length) {
          tableInfo.push(`Mesa ${table.name || table.id}: ${tableGuests.join(', ')}`);
        }
      });
      
      if (!tableInfo.length) return '';
      
      return `Incluye las siguientes mesas con sus invitados:\n${tableInfo.join('\n')}`;
    } catch (err) {
      console.error('Error al obtener información de asientos:', err);
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Diseño del Seating Plan</h1>
        <p className="text-gray-600">Crea carteles para que tus invitados encuentren su mesa asignada. Selecciona un estilo o personaliza tu propio diseño.</p>
        
        <div className="mt-2">
          <p className="text-sm text-blue-600">
            <span className="font-medium">Consejo:</span> Para mejores resultados, primero asigna a tus invitados en mesas usando la página de Seating Plan.
          </p>
        </div>
      </Card>
      
      <ImageGeneratorAI 
        category="seating-plan" 
        templates={seatingPlanTemplates}
        onImageGenerated={(image) => {
          console.log('Nuevo cartel de seating plan generado:', image);
        }}
      />
    </div>
  );
}
