import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import { Plus, Trash2 } from 'lucide-react';
import { saveData, loadData } from '../../services/SyncService';
import SyncIndicator from '../../components/SyncIndicator';

const initialState = () => {
  try {
    return loadData('menuDesigner', { 
      defaultValue: { entradas: [], principales: [], postres: [], bebidas: [] }, 
      collection: 'userMenus' 
    });
  } catch (error) {
    console.error('Error al cargar el diseño del menú:', error);
    return { entradas: [], principales: [], postres: [], bebidas: [] };
  }
};

// Plantillas predefinidas para menús de boda
const menuTemplates = [
  {
    name: 'Elegante & Clásico',
    description: 'Diseño de menú formal con estilo clásico y refinado',
    prompt: 'Diseña un menú elegante para una boda con estilo clásico y refinado. Formato vertical con tipografía serif elegante. Usa colores neutros con detalles dorados o plateados. Incluye secciones para entrante, plato principal, postre y bebidas. El diseño debe ser sobrio y sofisticado, adecuado para una cena formal de boda.'
  },
  {
    name: 'Rústico & Natural',
    description: 'Menú con estética rústica, elementos naturales y texto manuscrito',
    prompt: 'Crea un menú de boda con estética rústica y natural. Utiliza elementos como madera, flores silvestres y hojas. Tipografía con aspecto manuscrito o caligráfico. Formato de una página con secciones para entrante, principal, postre y bebidas. Paleta de colores tierra y verdes naturales. El diseño debe transmitir calidez y un ambiente campestre elegante.'
  },
  {
    name: 'Minimalista & Moderno',
    description: 'Diseño limpio y contemporáneo con espacios blancos y tipografía simple',
    prompt: 'Diseña un menú minimalista y moderno para boda. Utiliza mucho espacio en blanco, tipografía sans-serif limpia y elementos geométricos simples. Formato elegante con distribución equilibrada. Paleta monocromática o con un acento de color. Incluye secciones para los platos principales y bebidas. El diseño debe ser contemporáneo, limpio y fácil de leer.'
  },
  {
    name: 'Botánico & Floral',
    description: 'Menú decorado con elementos botánicos, flores y follaje',
    prompt: 'Crea un menú de boda con temática botánica y floral. Incorpora ilustraciones delicadas de flores, hojas y ramas como elementos decorativos. Usa una combinación de tipografías elegantes y caligráficas. Paleta de colores suaves como verde salvia, rosa pálido y toques dorados. Formato de una página con todas las secciones del menú organizadas armónicamente entre los elementos vegetales.'
  },
  {
    name: 'Vintage & Romántico',
    description: 'Menú con estética nostálgica, detalles ornamentados y aire romántico',
    prompt: 'Diseña un menú de boda con estética vintage y romántica. Utiliza elementos decorativos como encajes, marcos ornamentados y motivos florales delicados. Tipografía elegante con serifs o caligráfica. Paleta en tonos sepia, crema o rosa antiguo. Formato que recuerde a documentos antiguos o postales vintage. Incluye todas las secciones del menú dentro de un diseño que evoque nostalgia y romance.'
  },
];

export default function MenuDiseno() {
  
  const [menu, setMenu] = useState(initialState);
  const [course, setCourse] = useState('entradas');
  const [dish, setDish] = useState('');

  useEffect(() => {
    saveData('menuDesigner', menu, {
      collection: 'userMenus',
      showNotification: false
    });
  }, [menu]);

  const addDish = () => {
    if (!dish.trim()) return;
    setMenu(prev => ({ ...prev, [course]: [...prev[course], dish.trim()] }));
    setDish('');
  };

  const removeDish = (courseKey, idx) => {
    setMenu(prev => ({
      ...prev,
      [courseKey]: prev[courseKey].filter((_, i) => i !== idx),
    }));
  };

  // Generar un prompt personalizado basado en los datos del menú
  const generateCustomPrompt = () => {
    const menuItems = [];
    if (menu.entradas.length > 0) menuItems.push(`Entrantes: ${menu.entradas.join(', ')}`);
    if (menu.principales.length > 0) menuItems.push(`Platos principales: ${menu.principales.join(', ')}`);
    if (menu.postres.length > 0) menuItems.push(`Postres: ${menu.postres.join(', ')}`);
    if (menu.bebidas.length > 0) menuItems.push(`Bebidas: ${menu.bebidas.join(', ')}`);
    
    if (menuItems.length === 0) return '';
    
    return `Diseña un menú elegante para boda con los siguientes platos:\n${menuItems.join('\n')}`;
  };

  return (
    <div className="space-y-8">
      <SyncIndicator />
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Diseño del Menú</h1>
        <div className="flex flex-col md:flex-row gap-2 md:items-end">
          <select value={course} onChange={e => setCourse(e.target.value)} className="border rounded px-3 py-2">
            <option value="entradas">Entradas</option>
            <option value="principales">Plato principal</option>
            <option value="postres">Postres</option>
            <option value="bebidas">Bebidas</option>
          </select>
          <input
            type="text"
            placeholder="Nombre del plato"
            value={dish}
            onChange={e => setDish(e.target.value)}
            className="flex-grow border rounded px-3 py-2"
          />
          <button onClick={addDish} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded">
            <Plus size={16} /> Añadir
          </button>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <h2 className="text-xl font-semibold">Vista Previa</h2>
        <div className="space-y-4 text-center font-serif">
          {Object.entries(menu).map(([key, dishes]) => (
            <div key={key} className="space-y-1">
              <h3 className="text-lg font-bold capitalize">{key}</h3>
              {dishes.length === 0 && <p className="text-sm text-gray-500">Sin elementos</p>}
              {dishes.map((d, idx) => (
                <div key={idx} className="flex items-center justify-center gap-2 group">
                  <span>{d}</span>
                  <button
                    onClick={() => removeDish(key, idx)}
                    className="hidden group-hover:inline-flex text-red-600"
                    aria-label={`Eliminar ${d}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-8 mb-4">
        <h2 className="text-lg font-semibold mb-2">Diseña tu menú</h2>
        <p className="text-gray-600">Genera diseños para tu menú utilizando IA. Los datos que has introducido arriba se incluirán automáticamente.</p>
      </div>

      <ImageGeneratorAI 
        category="menu" 
        templates={menuTemplates}
        customPrompt={generateCustomPrompt()}
        onImageGenerated={(image) => {
          console.log('Nuevo diseño de menú generado:', image);
        }}
      />
    </div>
  );
}
