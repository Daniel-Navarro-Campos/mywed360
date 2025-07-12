import React from 'react';
import ImageGeneratorAI from '../../components/ImageGeneratorAI';

// Plantillas predefinidas para invitaciones
const invitationTemplates = [
  {
    name: 'Elegante & Minimalista',
    description: 'Invitación de boda con diseño simple, elegante y refinado',
    prompt: 'Diseña una invitación de boda elegante y minimalista con tipografía moderna. Usa colores neutros como blanco, beige y dorado. Incluye espacio para nombres de los novios, fecha y lugar. Estilo limpio y sofisticado.'
  },
  {
    name: 'Rústico & Vintage',
    description: 'Invitación con estilo rústico, flores silvestres y elementos vintage',
    prompt: 'Crea una invitación de boda rústica con elementos vintage. Utiliza flores silvestres, texturas de madera y cordel. Estilo romántico con tipografía manuscrita. Incluye espacio para nombres, fecha y lugar de celebración. Paleta de colores tierra, verde oliva y toques florales.'
  },
  {
    name: 'Botánico & Natural',
    description: 'Invitación con motivos botánicos, hojas verdes y elementos naturales',
    prompt: 'Diseña una invitación de boda botánica con abundante vegetación, hojas verdes y flores. Estilo fresco y natural con detalles en acuarela. Incluye espacio para nombres de los novios, fecha y lugar. Utiliza una paleta de colores verdes, blancos y toques dorados.'
  },
  {
    name: 'Playero & Costero',
    description: 'Invitación inspirada en el mar, con tonos azules y elementos marinos',
    prompt: 'Crea una invitación de boda con temática de playa. Utiliza elementos marinos como conchas, estrellas de mar y olas. Paleta en tonos azules, turquesa y arena. Incluye espacio para nombres, fecha y lugar de la ceremonia. Estilo fresco y relajado, ideal para boda costera.'
  },
  {
    name: 'Bohemio & Artístico',
    description: 'Invitación de estilo bohemio con patrones étnicos y colores vivos',
    prompt: 'Diseña una invitación de boda bohemia con elementos artísticos. Usa patrones étnicos, mandalas y detalles en acuarela. Paleta de colores vivos como terracota, mostaza, verde y azul índigo. Incluye espacio para nombres de los novios, fecha y lugar. Estilo libre y creativo con toques handmade.'
  },
];

const InvitacionesAI = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Diseña tus invitaciones</h2>
        <p className="text-gray-600">Genera invitaciones personalizadas para tu boda utilizando IA. Selecciona una plantilla o escribe tu propio prompt.</p>
      </div>
      
      <ImageGeneratorAI 
        category="invitaciones" 
        templates={invitationTemplates}
        onImageGenerated={(image) => {
          console.log('Nueva invitación generada:', image);
        }}
      />
    </div>
  );
};

export default InvitacionesAI;
