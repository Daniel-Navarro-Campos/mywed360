import React, { useState, useRef, useEffect } from 'react';
import { saveData, loadData } from '../services/SyncService';
import SyncIndicator from '../components/SyncIndicator';

export default function Ideas() {
  
  const [view, setView] = useState('notes');
  const [notes, setNotes] = useState(()=>{
    return loadData('ideasNotes', { defaultValue: [], collection: 'userIdeas' });
  }); // {folder, text}
  const [noteText, setNoteText] = useState('');
  const [folders, setFolders] = useState(()=>{
    const stored = loadData('ideasFolders', { defaultValue: null, collection: 'userIdeas' });
    return stored || ['General'];
  });
  const [currentFolder, setCurrentFolder] = useState('General');
  const [photos, setPhotos] = useState([]);
  const textareaRef = useRef(null);

  // Si la URL incluye #nueva, enfocamos el textarea automáticamente
  useEffect(()=>{
    saveData('ideasNotes', notes, {
      collection: 'userIdeas',
      showNotification: false
    });
  },[notes]);
  
  useEffect(()=>{
    saveData('ideasFolders', folders, {
      collection: 'userIdeas',
      showNotification: false
    });
  },[folders]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#nueva') {
      setView('notes');
      setTimeout(() => textareaRef.current?.focus(), 0);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-8">
      <SyncIndicator />
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Ideas</h1>
      <div className="flex space-x-4 mb-4">
        <button onClick={() => setView('notes')} className={`px-4 py-2 rounded ${view==='notes'?'bg-blue-600 text-white':''}`}>Notas</button>
        
        <button onClick={() => setView('photos')} className={`px-4 py-2 rounded ${view==='photos'?'bg-blue-600 text-white':''}`}>Fotos</button>
      </div>
      {view==='notes' && (
        <div>
          {/* Selector de carpetas */}
          <div className="flex items-center space-x-2 mb-4">
            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => setCurrentFolder(folder)}
                className={`px-2 py-1 rounded-full text-sm ${currentFolder===folder ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                {folder}
              </button>
            ))}
            <button
              onClick={() => {
                const name = prompt('Nombre de la carpeta');
                if (name && !folders.includes(name)) {
                  setFolders([...folders, name]);
                  setCurrentFolder(name);
                }
              }}
              className="px-2 py-1 rounded-full text-sm bg-green-500 text-white"
            >
              + Nueva carpeta
            </button>
          </div>
          <textarea
            value={noteText}
            ref={textareaRef}
            onChange={e => setNoteText(e.target.value)}
            className="w-full border rounded p-2 mb-2"
            placeholder="Escribe tu nota..."
          />
          <button
            onClick={() => {
              if (noteText) {
                setNotes(prev => [...prev, { folder: currentFolder, text: noteText.trim() }]);
                setNoteText('');
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Añadir Nota
          </button>
          <ul className="mt-4 list-disc list-inside">
            {notes.filter(n => n.folder===currentFolder).map((n,i) => (<li key={i}>{n.text}</li>))}
          </ul>
        </div>
      )}
      
      {view==='photos' && (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files[0];
              if (file) setPhotos(prev => [...prev, URL.createObjectURL(file)]);
            }}
          />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {photos.map((p,i) => (<img key={i} src={p} alt={`Foto ${i}`} className="w-full h-32 object-cover rounded" />))}
          </div>
        </div>
      )}
    </div>
  );
}
