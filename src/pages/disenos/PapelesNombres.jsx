import React from 'react';
import Card from '../../components/Card';
import { loadData } from '../../services/SyncService';
import { useWedding } from '../../context/WeddingContext';
import useWeddingCollection from '../../hooks/useWeddingCollection';
import ImageGeneratorAI from '../../components/ImageGeneratorAI';

// Plantillas predefinidas para marcadores de mesa y papelitos con nombres
const nameCardsTemplates = [
  {
    name: 'Elegante & Minimalista',
    description: 'Marcador de mesa elegante con tipografía refinada sobre fondo neutro',
    prompt: 'Diseña un marcador de mesa elegante y minimalista para una boda. El diseño debe incluir un espacio claro para el nombre del invitado, con tipografía serif refinada. Usa colores neutros como blanco, crema, o gris pálido con detalles en dorado o plateado. El estilo debe ser sobrio, clásico y sofisticado, adecuado para una cena formal. Formato rectangular u ovalado que pueda imprimirse y doblarse.'
  },
  {
    name: 'Rústico & Natural',
    description: 'Marcador de mesa con elementos naturales, madera y estilo campestre',
    prompt: 'Crea un marcador de mesa con estilo rústico y natural para boda. Utiliza texturas que simulen madera, papel kraft o materiales reciclados. Incorpora elementos decorativos como hojas, flores silvestres o ramas. Tipografía con aspecto manuscrito o artesanal. El diseño debe transmitir calidez y un ambiente campestre. Formato que permita escribir el nombre del invitado de forma destacada y legible.'
  },
  {
    name: 'Floral & Romántico',
    description: 'Marcador decorado con flores, motivos botánicos y colores suaves',
    prompt: 'Diseña un marcador de mesa con motivos florales y románticos para una boda. Incorpora ilustraciones delicadas de flores como rosas, peonías o lavanda. Utiliza una paleta de colores suaves y pasteles. Tipografía elegante, caligráfica o manuscrita que resalte el nombre del invitado. El diseño debe ser delicado y evocador, con un aire romántico y primaveral.'
  },
  {
    name: 'Moderno & Geométrico',
    description: 'Marcador con líneas limpias, formas geométricas y estilo contemporáneo',
    prompt: 'Crea un marcador de mesa moderno con elementos geométricos para boda. Utiliza formas como hexágonos, triángulos o líneas abstractas. Tipografía sans-serif limpia y contemporánea. Paleta de colores contrastantes pero elegantes como negro, blanco, dorado o colores acentuados. El diseño debe ser actual, con estilo minimalista pero distintivo, dejando espacio prominente para el nombre del invitado.'
  },
  {
    name: 'Temático & Personalizado',
    description: 'Marcador temático que refleja algún interés, afición o motivo especial',
    prompt: 'Diseña un marcador de mesa temático para boda inspirado en viajes/destinos. Incorpora sutilmente elementos como mapas, brújulas, aviones o monumentos icónicos. El diseño debe mantener la elegancia apropiada para una boda mientras incorpora estos elementos temáticos de forma creativa. Incluye un espacio claro para el nombre del invitado con tipografía legible y atractiva que complemente el tema.'
  },
];

export default function PapelesNombres() {
  const { activeWedding } = useWedding();
  const { data: dbGuests } = useWeddingCollection('guests', activeWedding, []);
  // Obtener información de invitados si está disponible
  const getGuestsInfo = () => {
    try {
      const guests = dbGuests;
      
      // Si no hay suficientes invitados, devolver cadena vacía
      if (guests.length < 5) return '';
      
      // Seleccionar algunos invitados para incluir en el ejemplo
      const selectedGuests = guests
        .filter(g => g.name && g.name.trim() !== '')
        .slice(0, 8)
        .map(g => g.name);
      
      if (selectedGuests.length === 0) return '';
      
      return `Incluye ejemplos para los siguientes nombres: ${selectedGuests.join(', ')}`;
    } catch (err) {
      console.error('Error al obtener información de invitados:', err);
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Marcadores de Mesa</h1>
        <p className="text-gray-600">Crea elegantes marcadores con los nombres de tus invitados para identificar su lugar en la mesa. Selecciona un estilo o personaliza tu propio diseño.</p>
        
        <div className="mt-2">
          <p className="text-sm text-blue-600">
            <span className="font-medium">Consejo:</span> Para mejores resultados, añade primero a tus invitados en la sección de Invitados.
          </p>
        </div>
      </Card>
      
      <ImageGeneratorAI 
        category="place-cards" 
        templates={nameCardsTemplates}
        onImageGenerated={(image) => {
          console.log('Nuevos marcadores de mesa generados:', image);
        }}
      />
    </div>
  );
}
