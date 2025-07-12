import React, { useState, useEffect } from 'react';
import { useUserContext } from '../context/UserContext';
import { MessageSquare, Clock, RefreshCcw } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

const sampleBlocks = [
  { name: 'Ceremonia', items: ['Entrada novios', 'Lectura de votos', 'Anillos'] },
  { name: 'Cocktail', items: ['Aperitivos', 'Brindis'] },
  { name: 'Banquete', items: ['Primer plato', 'Segundo plato', 'Postre'] },
  { name: 'Disco', items: ['Baile', 'DJ set'] },
];

export default function AyudaCeremonia() {
  const { role } = useUserContext();
  const allowed = ['ayudante', 'wedding_planner', 'admin'];
  if (!allowed.includes(role)) {
    return <div className="p-6 text-red-600">Acceso denegado. Solo ayudantes o wedding planners.</div>;
  }

  const [selectedMoment, setSelectedMoment] = useState('');
  const [text, setText] = useState('');
  const [versions, setVersions] = useState([]);
  const [previewTime, setPreviewTime] = useState(0);

  useEffect(() => {
    if (text) {
      const words = text.split(' ').length;
      const speed = 200;
      setPreviewTime((words / speed).toFixed(2));
    }
  }, [text]);

  const handleSaveVersion = () => {
    const v = { id: Date.now(), timestamp: new Date(), text, moment: selectedMoment };
    setVersions([v, ...versions]);
  };

  const handleRevert = v => {
    setText(v.text);
    setSelectedMoment(v.moment);
  };

  const handleAIAdjust = () => {
    console.log('Ajustar con IA:', text);
  };

  return (
    <PageWrapper title="Ayuda Ceremonia">
      
      <div className="flex items-center gap-2">
        <label>Momento:</label>
        <select
          value={selectedMoment}
          onChange={e => setSelectedMoment(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">Selecciona momento</option>
          {sampleBlocks.flatMap(b =>
            b.items.map(item => (
              <option key={`${b.name}-${item}`} value={`${b.name}|${item}`}>
                {b.name} - {item}
              </option>
            ))
          )}
        </select>
      </div>

      <div>
        <label>Texto de lectura:</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full h-32 border rounded p-2"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAIAdjust}
          className="bg-purple-600 text-white px-3 py-1 rounded flex items-center"
        >
          <MessageSquare className="mr-1" /> Ajustar con IA
        </button>
        <button
          onClick={handleSaveVersion}
          className="bg-green-600 text-white px-3 py-1 rounded flex items-center"
        >
          <RefreshCcw className="mr-1" /> Guardar Versión
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Vista Previa</h3>
        <div className="flex items-center gap-1">
          <Clock />
          <span>Tiempo estimado: {previewTime} min</span>
        </div>
        <div
          className={`p-2 border rounded ${
            previewTime <= 2 ? 'bg-green-100' : previewTime <= 3 ? 'bg-blue-100' : 'bg-red-100'
          }`}
        >
          {text || 'Sin texto.'}
        </div>
      </div>

      <div>
        <h3 className="font-semibold">Historial de Versiones</h3>
        <ul className="list-disc pl-5 space-y-1">
          {versions.map(v => (
            <li key={v.id} className="flex justify-between items-center">
              <span>{new Date(v.timestamp).toLocaleString()}</span>
              <button
                onClick={() => handleRevert(v)}
                className="text-blue-600 hover:underline"
              >
                Revertir
              </button>
            </li>
          ))}
        </ul>
      </div>
    </PageWrapper>
  );
}
