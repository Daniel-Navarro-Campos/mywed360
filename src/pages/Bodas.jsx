import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, getDoc, doc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import WeddingFormModal from '../components/WeddingFormModal';
import { Card } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { useUserContext } from '../context/UserContext';
import { useWedding } from '../context/WeddingContext';


export default function Bodas() {
  const { user } = useUserContext();
  const { setActiveWedding } = useWedding();
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tab, setTab] = useState('active');
  const navigate = useNavigate();

  const crearBoda = async (values) => {
    try {
      const newDoc = await addDoc(collection(db, 'weddings'), {
        name: values.name,
        weddingDate: values.date || '',
        location: values.location || '',
        banquetPlace: values.banquetPlace || '',
        createdAt: serverTimestamp(),
        ownerIds: [],
        plannerIds: [user.uid],
        assistantIds: [],
        progress: 0,
        active: true,
      });
      // Inicializar subcolección de finanzas
      try {
        const financeRef = doc(db, 'weddings', newDoc.id, 'finance', 'main');
        await setDoc(financeRef, { movements: [], createdAt: serverTimestamp() }, { merge: true });
      } catch (e) {
        console.warn('No se pudo inicializar finance/main para', newDoc.id, e);
      }
      setActiveWedding(newDoc.id);
      navigate(`/bodas/${newDoc.id}`);
    } catch (err) {
      console.error('Error creando nueva boda:', err);
      alert('No se pudo crear la boda. Revise permisos.');
    }
  };

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

    const today = new Date();
  const activeWeddings = weddings.filter((w) => {
    if (!w.date) return true; // sin fecha = activa
    const d = new Date(w.date);
    return isNaN(d) ? true : d >= today;
  });
  const pastWeddings = weddings.filter((w) => {
    if (!w.date) return false;
    const d = new Date(w.date);
    return !isNaN(d) && d < today;
  });
  const weddingsToShow = tab === 'active' ? activeWeddings : pastWeddings;

  if (loading) {
    return <p>Cargando bodas...</p>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mis Bodas</h1>
        {user?.role === 'planner' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded shadow"
          >
            + Crear nueva boda
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-1 rounded font-medium ${tab==='active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Bodas activas
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-1 rounded font-medium ${tab==='past' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Bodas pasadas
        </button>
      </div>

      {weddingsToShow.length === 0 ? (
        <p>No tienes bodas asignadas todavía.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {weddingsToShow.map((wed) => (
            <Card
              key={wed.id}
              className="cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between"
              onClick={() => {
                setActiveWedding(wed.id);
                navigate(`/bodas/${wed.id}`);
              }}
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
          <WeddingFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={crearBoda}
      />
    </div>
  );
}
