import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserContext } from '../context/UserContext';
import { Plus, Trash, Zap } from 'lucide-react';

/*
  Editor interno para la página web de la boda.
  Permite al usuario rellenar/editar la información que utilizará WeddingSite.jsx.
*/

export default function WebEditor() {
  const { user } = useUserContext();
  const uid = user?.uid || 'dev';

  const [info, setInfo] = useState({
    coupleName: '',
    date: '',
    celebrationPlace: '',
    story: '',
    giftAccount: '',
    primaryColor: '#E91E63',
    secondaryColor: '#FFFFFF',
  });
  const [schedule, setSchedule] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Cargar datos existentes
  useEffect(() => {
    (async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists() && docSnap.data().weddingInfo) setInfo({ ...info, ...docSnap.data().weddingInfo });
        const schSnap = await getDocs(collection(db, 'users', uid, 'schedule'));
        setSchedule(schSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>a.time.localeCompare(b.time)));
        const galSnap = await getDocs(collection(db, 'users', uid, 'gallery'));
        setGallery(galSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const saveInfo = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', uid), { weddingInfo: info }, { merge: true });
      alert('Información guardada');
    } catch (err) { console.error(err); alert('Error al guardar'); }
    setLoading(false);
  };

  // --- Schedule helpers ---
  const addSchedule = () => setSchedule([...schedule, { time: '', title: '', temp: Date.now() }]);
  const updateSchedule = (idx, key, val) => {
    const next = [...schedule];
    next[idx][key] = val;
    setSchedule(next);
  };
  const removeSchedule = (idx) => setSchedule(schedule.filter((_,i)=>i!==idx));
  const saveSchedule = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'users', uid, 'schedule');
      // Borrar docs existentes y volver a crear (simple)
      const existing = await getDocs(colRef);
      await Promise.all(existing.docs.map(d=>deleteDoc(d.ref)));
      await Promise.all(schedule.map(item=> addDoc(colRef, { time: item.time, title: item.title })));
      alert('Programa guardado');
    } catch (e) { console.error(e); alert('Error'); }
    setLoading(false);
  };

  // --- AI helpers ---
  const suggestStory = async () => {
    if (aiLoading) return;
    if (!import.meta.env.VITE_OPENAI_API_KEY) { alert('Falta la clave de OpenAI'); return; }
    setAiLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        'OpenAI-Project': import.meta.env.VITE_OPENAI_PROJECT_ID
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Eres un asistente que redacta textos románticos para webs de boda en español.' },
            { role: 'user', content: `Genera una breve historia de amor (máx 150 palabras) para la pareja ${info.coupleName}.` }
          ],
          temperature: 0.8
        })
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) setInfo(prev => ({ ...prev, story: text }));
    } catch (err) { console.error(err); alert('Error OpenAI'); }
    setAiLoading(false);
  };

  const suggestSchedule = async () => {
    if (aiLoading) return;
    if (!import.meta.env.VITE_OPENAI_API_KEY) { alert('Falta la clave de OpenAI'); return; }
    setAiLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        'OpenAI-Project': import.meta.env.VITE_OPENAI_PROJECT_ID
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Eres un asistente que devuelve un JSON con el programa típico de una boda en España. Ejemplo: [{"time":"12:00","title":"Ceremonia"}]' },
            { role: 'user', content: 'Genera un programa para nuestra boda con 6-8 eventos clave. Usa formato JSON.' }
          ],
          temperature: 0.7
        })
      });
      const data = await response.json();
      let arr = [];
      try { arr = JSON.parse(data.choices?.[0]?.message?.content); } catch {}
      if (Array.isArray(arr)) setSchedule(arr.map((item,i)=>({...item, temp:i})));
    } catch(err){ console.error(err); alert('Error OpenAI'); }
    setAiLoading(false);
  };

  // --- Gallery helpers ---
  const addImage = () => setGallery([...gallery, { url: '' }]);
  const updateImage = (idx, val) => {
    const next = [...gallery];
    next[idx].url = val;
    setGallery(next);
  };
  const removeImage = idx => setGallery(gallery.filter((_,i)=>i!==idx));
  const saveGallery = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'users', uid, 'gallery');
      const existing = await getDocs(colRef);
      await Promise.all(existing.docs.map(d=>deleteDoc(d.ref)));
      await Promise.all(gallery.filter(g=>g.url).map(img=> addDoc(colRef, { url: img.url })));
      alert('Galería guardada');
    } catch (e) { console.error(e); alert('Error'); }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Editor de mi web</h1>

      {/* Información básica */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">Datos básicos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input className="border p-2 rounded" placeholder="Nombres de la pareja" value={info.coupleName} onChange={e=>setInfo({...info,coupleName:e.target.value})}/>
          <input className="border p-2 rounded" type="date" value={info.date} onChange={e=>setInfo({...info,date:e.target.value})}/>
          <input className="border p-2 rounded sm:col-span-2" placeholder="Lugar de la celebración" value={info.celebrationPlace} onChange={e=>setInfo({...info,celebrationPlace:e.target.value})}/>
        </div>
        <textarea className="border p-2 rounded w-full" rows="4" placeholder="Nuestra historia" value={info.story} onChange={e=>setInfo({...info,story:e.target.value})}/>
        <button type="button" onClick={suggestStory} disabled={aiLoading} className="text-sm text-blue-600 underline">{aiLoading ? 'Generando...' : 'Sugerir con IA'}</button>
        <input className="border p-2 rounded w-full" placeholder="Cuenta bancaria / lista de regalos" value={info.giftAccount} onChange={e=>setInfo({...info,giftAccount:e.target.value})}/>
        <div className="flex gap-4 items-center">
          <label>Color primario:</label>
          <input type="color" value={info.primaryColor} onChange={e=>setInfo({...info,primaryColor:e.target.value})}/>
          <label>Color secundario:</label>
          <input type="color" value={info.secondaryColor} onChange={e=>setInfo({...info,secondaryColor:e.target.value})}/>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading} onClick={saveInfo}>Guardar información</button>
      </section>

      {/* Programa */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium flex items-center justify-between">Programa del día
          <div className="flex gap-3">
            <button onClick={addSchedule} className="text-green-600 flex items-center gap-1"><Plus size={16}/> Añadir</button>
            <button onClick={suggestSchedule} disabled={aiLoading} className="text-indigo-600 flex items-center gap-1"><Zap size={16}/> IA</button>
          </div>
        </h2>
        {schedule.map((s,idx)=>(
          <div key={s.id || s.temp} className="flex gap-2 items-center">
            <input type="time" className="border p-1 rounded" value={s.time} onChange={e=>updateSchedule(idx,'time',e.target.value)}/>
            <input className="border p-1 rounded flex-grow" placeholder="Descripción" value={s.title} onChange={e=>updateSchedule(idx,'title',e.target.value)}/>
            <button onClick={()=>removeSchedule(idx)} className="text-red-600"><Trash size={16}/></button>
          </div>
        ))}
        <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading} onClick={saveSchedule}>Guardar programa</button>
      </section>

      {/* Galería */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium flex items-center justify-between">Galería <button onClick={addImage} className="text-green-600 flex items-center gap-1"><Plus size={16}/> Añadir</button></h2>
        {gallery.map((g,idx)=>(
          <div key={g.id || idx} className="flex gap-2 items-center">
            <input className="border p-1 rounded flex-grow" placeholder="URL de la imagen" value={g.url} onChange={e=>updateImage(idx,e.target.value)}/>
            <button onClick={()=>removeImage(idx)} className="text-red-600"><Trash size={16}/></button>
          </div>
        ))}
        <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading} onClick={saveGallery}>Guardar galería</button>
      </section>

      {/* Vista previa */}
      <section className="space-y-2">
        <h2 className="text-xl font-medium">Vista previa</h2>
        <iframe title="Preview" className="border w-full h-[600px] rounded" src={`/w/${uid}`} />
      </section>
    </div>
  );
}
