import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { differenceInSeconds } from 'date-fns';

/*
  Página pública one-page con la información de la boda.
  Ruta: /w/:uid  (ej. https://example.com/w/abc123)
  El hosting podrá mapear subdominios a esta ruta.
*/

export default function WeddingSite() {
  const { uid } = useParams();
  const [profile, setProfile] = useState(null);
  const [customHtml, setCustomHtml] = useState('');
  const [gallery, setGallery] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [rsvp, setRsvp] = useState({ name: '', guests: 1, response: 'Sí', message: '' });
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Cargar datos
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const d = userDoc.data();
          if(d.generatedHtml){ setCustomHtml(d.generatedHtml); }
          setProfile(d.weddingInfo || {});
        }
        const galSnap = await getDocs(collection(db, 'users', uid, 'gallery'));
        setGallery(galSnap.docs.map(d => d.data()));
        const schSnap = await getDocs(collection(db, 'users', uid, 'schedule'));
        setSchedule(schSnap.docs.map(d => d.data()).sort((a,b)=>a.time.localeCompare(b.time)));
      } catch (e) { console.error(e); }
    })();
  }, [uid]);

  // Cuenta atrás
  useEffect(() => {
    if (!profile?.date) return;
    const target = new Date(profile.date);
    const i = setInterval(() => {
      const diff = Math.max(0, differenceInSeconds(target, new Date()));
      setCountdown({
        days: Math.floor(diff / 86400),
        hours: Math.floor((diff % 86400) / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
      });
    }, 1000);
    return () => clearInterval(i);
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'users', uid, 'rsvp'), { ...rsvp, createdAt: serverTimestamp() });
      alert('¡Gracias por tu respuesta!');
      setRsvp({ name: '', guests: 1, response: 'Sí', message: '' });
    } catch (err) {
      console.error(err);
      alert('Error al enviar.');
    }
  };

  if(customHtml) return <div dangerouslySetInnerHTML={{__html:customHtml}}/>;

  if (!profile) return <p style={{textAlign:'center',marginTop:40}}>Cargando…</p>;

  return (
    <div className="font-sans text-gray-800">
      {/* Hero */}
      <section className="min-h-[80vh] bg-cover bg-center flex flex-col items-center justify-center text-center text-white" style={{backgroundImage:'url(https://source.unsplash.com/1600x900/?wedding)'}}>
        <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">{profile.coupleName || 'Nuestra Boda'}</h1>
        <p className="text-2xl mb-6 drop-shadow">{profile.date} • {profile.celebrationPlace}</p>
        <div className="flex gap-4 text-xl bg-white/20 backdrop-blur-sm px-6 py-2 rounded">
          <span>{countdown.days}d</span>
          <span>{countdown.hours}h</span>
          <span>{countdown.minutes}m</span>
          <span>{countdown.seconds}s</span>
        </div>
      </section>

      {/* Historia */}
      {profile.story && (
      <section className="max-w-3xl mx-auto p-8 text-center">
        <h2 className="text-3xl font-semibold mb-4">Nuestra Historia</h2>
        <p className="text-lg whitespace-pre-line">{profile.story}</p>
      </section>)}

      {/* Programa */}
      {schedule.length>0 && (
      <section className="bg-gray-100 py-8">
        <h2 className="text-3xl font-semibold text-center mb-6">Programa</h2>
        <div className="max-w-xl mx-auto space-y-4">
          {schedule.map((s,i)=>(
            <div key={i} className="flex items-start gap-4">
              <span className="font-bold w-24">{s.time}</span>
              <p>{s.title}</p>
            </div>
          ))}
        </div>
      </section>)}

      {/* Galería */}
      {gallery.length>0 && (
      <section className="py-8 max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center mb-6">Galería</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {gallery.map((g,i)=>(<img key={i} src={g.url} alt="Foto" className="object-cover w-full h-40 rounded"/>))}
        </div>
      </section>)}

      {/* RSVP */}
      <section className="py-8 bg-pink-50 px-4">
        <h2 className="text-3xl font-semibold text-center mb-6">Confirma tu asistencia</h2>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <input required placeholder="Nombre" className="border w-full px-3 py-2 rounded" value={rsvp.name} onChange={e=>setRsvp({...rsvp,name:e.target.value})}/>
          <input type="number" min="1" className="border w-full px-3 py-2 rounded" value={rsvp.guests} onChange={e=>setRsvp({...rsvp,guests:+e.target.value})}/>
          <select className="border w-full px-3 py-2 rounded" value={rsvp.response} onChange={e=>setRsvp({...rsvp,response:e.target.value})}>
            <option value="Sí">Asistiré</option>
            <option value="No">No podré asistir</option>
          </select>
          <textarea placeholder="Mensaje" className="border w-full px-3 py-2 rounded" rows="3" value={rsvp.message} onChange={e=>setRsvp({...rsvp,message:e.target.value})}/>
          <button className="bg-pink-600 text-white px-4 py-2 rounded w-full">Enviar</button>
        </form>
      </section>

      {/* Regalos */}
      {profile.giftAccount && (
      <section className="py-8 text-center px-4">
        <h2 className="text-3xl font-semibold mb-4">Lista de regalos</h2>
        <p className="mb-2">Agradecemos tu regalo en la siguiente cuenta:</p>
        <code className="text-lg">{profile.giftAccount}</code>
      </section>)}

      {/* Mapa / alojamiento */}
      {profile.celebrationPlace && (
      <section className="py-8 bg-gray-100 px-4">
        <h2 className="text-3xl font-semibold text-center mb-6">Cómo llegar</h2>
        <div className="max-w-4xl mx-auto">
          <iframe
            title="Mapa"
            className="w-full h-64 rounded"
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_KEY&q=${encodeURIComponent(profile.celebrationPlace)}`}
          />
        </div>
      </section>)}

      <footer className="py-6 text-center text-sm text-gray-500">© {new Date().getFullYear()} {profile.coupleName || ''}</footer>
    </div>
  );
}
