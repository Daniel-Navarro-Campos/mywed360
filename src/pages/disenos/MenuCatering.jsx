import React, { useState } from 'react';
import Card from '../../components/Card';
import { saveData, loadData } from '../../services/SyncService';
import ImageGeneratorAI from '../../components/ImageGeneratorAI';

// Plantillas predefinidas para menús especiales de catering
const cateringTemplates = [
  {
    name: 'Menú Vegetariano',
    description: 'Diseño elegante para menús vegetarianos',
    prompt: 'Diseña una tarjeta de menú vegetariano para boda. Utiliza un diseño elegante con elementos vegetales sutiles como hojas o hierbas. Incluye el título "Menú Vegetariano" y espacio para listar entrantes, plato principal y postre. El diseño debe ser sofisticado y a juego con la decoración general de la boda, pero claramente identificable como opción vegetariana. Usa colores que evoquen frescura y naturaleza.'
  },
  {
    name: 'Menú Infantil',
    description: 'Diseño divertido pero elegante para el menú de niños',
    prompt: 'Crea un diseño de menú infantil para boda que sea divertido pero mantenga la elegancia del evento. Incluye elementos gráficos amigables para niños sin ser excesivamente infantil. El título debe ser "Menú Infantil" o similar, con espacio para listar opciones de comida para niños. Usa colores vibrantes pero armoniosos con la temática de boda. El diseño debe ser atractivo para los niños pero también visualmente agradable para los padres.'
  },
  {
    name: 'Menú Sin Gluten',
    description: 'Diseño elegante para menús sin gluten',
    prompt: 'Diseña una tarjeta de menú sin gluten para boda. El diseño debe ser elegante y sofisticado, a la altura del evento. Incluye el título "Menú Sin Gluten" de forma visible pero discreta. Proporciona espacio para detallar los platos seguros sin gluten para entrantes, plato principal y postre. Utiliza un símbolo o icono sutil que indique que es apto para celíacos. El estilo visual debe integrarse perfectamente con el resto de la papelería de boda.'
  },
  {
    name: 'Menú Sin Lácteos',
    description: 'Diseño para menús libres de lácteos',
    prompt: 'Crea un diseño de menú sin lácteos para boda. El diseño debe ser elegante y refinado, en línea con la estética general de la boda. Incluye un título claro como "Menú Sin Lácteos" o "Menú Libre de Lácteos". Proporciona espacio para listar entrantes, plato principal y postre. Puedes incorporar algún elemento gráfico sutil que indique la ausencia de lácteos. La paleta de colores debe ser armoniosa con el resto de la decoración del evento.'
  },
  {
    name: 'Menú Personalizado',
    description: 'Diseño versátil para cualquier necesidad dietética especial',
    prompt: 'Diseña un formato de menú personalizable para necesidades dietéticas especiales en una boda. El diseño debe incluir un espacio prominente para el título donde se pueda especificar el tipo de menú especial. Proporciona secciones claras para entrantes, plato principal y postre. Incorpora elementos gráficos elegantes que sean neutros y adaptables a cualquier tipo de restricción alimentaria. El diseño debe ser sofisticado y coherente con la estética general de la boda.'
  },
];

export default function MenuCatering() {
  // Estado para los diferentes tipos de menús especiales
  const [specialMenus, setSpecialMenus] = useState(() => {
    try {
      return loadData('specialMenus', { 
        defaultValue: { vegetariano: [], infantil: [], sinGluten: [], sinLacteos: [], otros: [] },
        collection: 'userSpecialMenus'
      });
    } catch (error) {
      console.error('Error al cargar menús especiales:', error);
      return { vegetariano: [], infantil: [], sinGluten: [], sinLacteos: [], otros: [] };
    }
  });

  // Generar un prompt personalizado basado en los datos del menú
  const generateCustomPrompt = () => {
    // Ejemplo: si hay menús vegetarianos definidos, incluirlos en el prompt
    const menuTypes = Object.keys(specialMenus).filter(type => specialMenus[type].length > 0);
    
    if (menuTypes.length === 0) return '';
    
    const menuDetails = menuTypes.map(type => {
      const items = specialMenus[type];
      const typeLabel = {
        vegetariano: 'Menú Vegetariano',
        infantil: 'Menú Infantil',
        sinGluten: 'Menú Sin Gluten',
        sinLacteos: 'Menú Sin Lácteos',
        otros: 'Menú Especial'
      }[type] || 'Menú Especial';
      
      return `${typeLabel}: ${items.join(', ')}`;
    });
    
    return `Diseña un conjunto de tarjetas de menús especiales para boda con los siguientes tipos: ${menuDetails.join('. ')}. Cada tarjeta debe identificar claramente el tipo de menú especial.`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Diseño de Menús Especiales</h1>
        <p className="text-gray-600">Crea tarjetas elegantes para los menús especiales de tu boda (vegetarianos, infantil, sin gluten, etc). Selecciona un estilo o personaliza tu propio diseño.</p>
        
        <div className="mt-2">
          <p className="text-sm text-blue-600">
            <span className="font-medium">Consejo:</span> Para una experiencia completa, define primero los platos de cada menú especial en la sección de Menú principal.
          </p>
        </div>
      </Card>
      
      <ImageGeneratorAI 
        category="special-menus" 
        templates={cateringTemplates}
        onImageGenerated={(image) => {
          console.log('Nuevos diseños de menús especiales generados:', image);
        }}
      />
    </div>
  );
}
