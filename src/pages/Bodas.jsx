import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { useUserContext } from '../context/UserContext';


export default function Bodas() {
  const { user } = useUserContext();
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'weddings'), where('plannerIds', 'array-contains', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Enriquecer con weddingInfo del primer owner si faltan campos
      Promise.all(
        data.map(async (w) => {
          if ((w.name && w.weddingDate) || !Array.isArray(w.ownerIds) || w.ownerIds.length === 0) return w;
          try {
            const ownerId = w.ownerIds[0];
            const profileSnap = await getDoc(doc(db, 'users', ownerId));
            if (profileSnap.exists()) {
              const info = profileSnap.data().weddingInfo || {};
              return {
                ...w,
                name: w.name || info.coupleName || 'Boda sin nombre',
                date: w.weddingDate || info.date || '',
                location: w.location || info.celebrationPlace || info.ceremonyLocation || '',
              };
            }
          } catch (e) {
            console.warn('No se pudo obtener weddingInfo del owner', e);
          }
          return w;
        })
      ).then((list) => {
        const ordered = list.sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));
        setWeddings(
          ordered.map((w) => ({
            id: w.id,
            name: w.name || 'Boda sin nombre',
            date: w.weddingDate || w.date || '',
            location: w.location || '',
            progress: w.progress ?? 0,
            active: w.active ?? true,
          }))
        );
        setLoading(false);
      });

    });
    return () => unsub();
  }, [user]);

  if (loading) {
    return <p>Cargando bodas...</p>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mis Bodas</h1>

      {weddings.length === 0 ? (
        <p>No tienes bodas asignadas todavía.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {weddings.map((wed) => (
            <Card
              key={wed.id}
              className="cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between"
              onClick={() => navigate(`/bodas/${wed.id}`)}
            >
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-800">{wed.name}</h2>
                <p className="text-sm text-gray-600">
                  {wed.date} · {wed.location}
                </p>
              </div>
              {/* Barra de progreso */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progreso</span>
                  <span className="font-medium">{wed.progress}%</span>
                </div>
                <Progress value={wed.progress} className="h-2" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
