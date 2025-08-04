import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { doc, collection, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// TODO: Reemplazar por llamada real a Firestore para obtener detalles de la boda
function fetchWeddingById(weddingId) {
  // Datos simulados para demo
  const mock = {
    id: weddingId,
    name: 'Boda de Ana y Luis',
    date: '2025-09-15',
    location: 'Sevilla',
    progress: 65,
    guests: [
      { id: 'g1', name: 'María López' },
      { id: 'g2', name: 'Carlos Ruiz' },
    ],
    tasks: [
      { id: 't1', title: 'Confirmar lugar', done: true },
      { id: 't2', title: 'Elegir menú', done: false },
    ],
    suppliers: [
      { id: 's1', name: 'Floristería Las Rosas', category: 'Flores' },
      { id: 's2', name: 'DJ Max', category: 'Música' },
    ],
    timeline: [
      { label: 'Ceremonia', time: '17:00' },
      { label: 'Cóctel', time: '18:30' },
      { label: 'Banquete', time: '20:00' },
    ],
    designs: [
      { id: 'des1', type: 'Invitación', name: 'Invitación Floral' },
      { id: 'des2', type: 'Logo', name: 'Monograma A&L' },
      { id: 'des3', type: 'Menu', name: 'Menú Vintage' }
    ],
    seatingPlanPdf: '/docs/seating-plan-demo.pdf',
    seatingPlan: [
      { table: 'Mesa 1', seats: ['María López', 'Carlos Ruiz', 'Elena Paredes'] },
      { table: 'Mesa 2', seats: ['Juan Gómez', 'Laura Díaz'] }
    ],
    specialMoments: [
      { id: 'm1', title: 'Primer baile', time: '22:00' },
      { id: 'm2', title: 'Corte de tarta', time: '23:00' }
    ],
    readings: [
      { id: 'r1', title: 'Lectura 1: Carta de Corintios' },
      { id: 'r2', title: 'Lectura 2: Soneto XVII' }
    ],
    expenses: [
      { id: 'e1', concept: 'Flores', amount: 1200 },
      { id: 'e2', concept: 'Música', amount: 800 },
      { id: 'e3', concept: 'Fotografía', amount: 1500 }
    ],
    ideas: [
      { id: 'i1', name: 'Inspiración decoración' },
      { id: 'i2', name: 'Paleta de colores' }
    ],
    documents: [
      { id: 'd1', name: 'Contrato Lugar.pdf' },
      { id: 'd2', name: 'Menú.pdf' },
    ],
  };
  return Promise.resolve(mock);
}

export default function BodaDetalle() {
  const { id } = useParams();
  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsubs = [];

    // Document principal de la boda
    const unsubDoc = onSnapshot(doc(db, 'weddings', id), (snap) => {
      if (!snap.exists()) {
        setWedding(null);
        setLoading(false);
        return;
      }
      const data = snap.data();
      setWedding(prev => ({
        ...(prev || {}),
        guests: [],
        tasks: [],
        suppliers: [],
        timeline: [],
        designs: [],
        seatingPlan: [],
        specialMoments: [],
        readings: [],
        expenses: [],
        ideas: [],
        ...snap.data(),
        id: snap.id,
      }));

      // Obtener información adicional del perfil del propietario principal
      const ownerIds = data.ownerIds || [];
      if (ownerIds.length > 0) {
        getDoc(doc(db, 'userProfile', ownerIds[0])).then((profileSnap) => {
          if (!profileSnap.exists()) return;
          const info = profileSnap.data().weddingInfo || {};
          setWedding(prev => ({
            ...prev,
            name: prev.name || info.brideAndGroom || info.coupleName || prev.name,
            date: prev.date || info.weddingDate || prev.date,
            location: prev.location || info.celebrationPlace || prev.location,
          }));
        }).catch((err) => {
          console.error('🔥 ERROR userProfile:', err);
        });
      }
    }, (err) => {
      console.error('🔥 ERROR doc weddings:', err);
      if (err.code === 'permission-denied') {
        window.mostrarErrorUsuario?.('No tienes permisos para ver esta boda', 8000);
      }
    });
    unsubs.push(unsubDoc);

    // Helper para escuchar subcolecciones y guardar en estado
    const listenSub = (colName, stateKey) => {
      const unsub = onSnapshot(collection(db, 'weddings', id, colName), (colSnap) => {
        const list = colSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setWedding(prev => ({ ...(prev || {}), [stateKey]: list }));
      }, (err) => {
        console.error(`🔥 ERROR sub ${colName}:`, err);
      });
      unsubs.push(unsub);
    };

    listenSub('guests', 'guests');
    listenSub('tasks', 'tasks');
    listenSub('suppliers', 'suppliers');
    listenSub('timeline', 'timeline');
    listenSub('designs', 'designs');
    listenSub('seating', 'seatingPlan');
    listenSub('specialMoments', 'specialMoments');
    listenSub('readings', 'readings');
    listenSub('expenses', 'expenses');
    listenSub('ideas', 'ideas');

    setLoading(false);

    return () => {
      unsubs.forEach((fn) => fn && fn());
    };
  }, [id]);

  if (loading) return <p>Cargando detalle...</p>;
  if (!wedding) return <p>No se encontró la boda.</p>;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-rose-600 hover:underline"
      >
        <ArrowLeft size={18} className="mr-1" /> Volver
      </button>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{wedding.name}</h1>
      <p className="text-gray-600">
        {wedding.date} · {wedding.location}
      </p>

      {/* Barra de progreso */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Progreso</span>
          <span className="font-medium">{wedding.progress}%</span>
        </div>
        <Progress value={wedding.progress} className="h-3" />
      </div>

      {/* Resumen métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-sm text-gray-500">Invitados</p>
          <p className="text-2xl font-bold text-gray-800">{wedding.guests.length}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500">Tareas pendientes</p>
          <p className="text-2xl font-bold text-gray-800">{wedding.tasks.filter(t=>!t.done).length}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500">Proveedores</p>
          <p className="text-2xl font-bold text-gray-800">{wedding.suppliers.length}</p>
        </Card>
      </div>

      {/* Proveedores */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Proveedores</h2>
        <ul className="space-y-1">
          {wedding.suppliers.map((s) => (
            <li key={s.id} className="flex justify-between bg-white rounded-md p-3 shadow-sm">
              <span>{s.name}</span>
              <span className="font-medium text-gray-500">{s.category}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Ideas */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Ideas</h2>
        <ul className="space-y-1">
          {wedding.ideas.map((idea)=> (
            <li key={idea.id} className="flex justify-between bg-white rounded-md p-3 shadow-sm">
              <span>{idea.name}</span>
              <button className="text-rose-600 hover:underline text-sm" onClick={()=>alert('Ver idea: '+ idea.name)}>Ver</button>
            </li>
          ))}
        </ul>
      </section>

      {/* Disposición de Mesas */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Disposición de Mesas</h2>
          {wedding.seatingPlanPdf && (
            <a href={wedding.seatingPlanPdf} target="_blank" rel="noopener" className="text-rose-600 hover:underline text-sm">Descargar PDF</a>
          )}
        </div>
        {wedding.seatingPlan.map((table) => (
          <Card key={table.table} className="mb-2">
            <h3 className="font-semibold mb-1">{table.table}</h3>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {table.seats.map((guest) => (
                <li key={guest}>{guest}</li>
              ))}
            </ul>
          </Card>
        ))}
      </section>

      {/* Diseños */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Diseños</h2>
        <ul className="space-y-1">
          {wedding.designs.map((d) => (
            <li key={d.id} className="flex justify-between bg-white rounded-md p-3 shadow-sm">
              <span>{d.type}: {d.name}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Momentos Especiales */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Momentos Especiales</h2>
        <ul className="space-y-1">
          {wedding.specialMoments.map((m) => (
            <li key={m.id} className="flex justify-between bg-white rounded-md p-3 shadow-sm">
              <span>{m.title}</span>
              <span className="font-medium text-gray-500">{m.time}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Checklist */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Checklist</h2>
        <ul className="space-y-1">
          {wedding.tasks.map((t) => (
            <li key={t.id} className="flex justify-between bg-white rounded-md p-3 shadow-sm">
              <span>{t.title}</span>
              <span className={`font-medium ${t.done ? 'text-green-600' : 'text-rose-600'}`}>{t.done ? 'Hecho' : 'Pendiente'}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Gastos */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Gastos</h2>
        <ul className="space-y-1">
          {wedding.expenses.map((e) => (
            <li key={e.id} className="flex justify-between bg-white rounded-md p-3 shadow-sm">
              <span>{e.concept}</span>
              <span className="font-medium text-gray-800">€ {e.amount.toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <p className="text-right font-semibold mt-2">Total: € {wedding.expenses.reduce((acc, e) => acc + e.amount, 0).toLocaleString()}</p>
      </section>

      {/* Línea de tiempo básica */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Timing</h2>
        <ul className="space-y-1">
          {wedding.timeline.map((item, idx) => (
            <li key={idx} className="flex justify-between bg-white rounded-md p-3 shadow-sm">
              <span>{item.label}</span>
              <span className="font-medium">{item.time}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Placeholder para más información (documentos, notas, etc.) */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Documentos y notas</h2>
        <p className="text-gray-500">Próximamente...</p>
      </section>
    </div>
  );
}
