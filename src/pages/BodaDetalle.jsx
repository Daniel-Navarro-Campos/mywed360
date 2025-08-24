import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthUnified';
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { doc, collection, onSnapshot, getDoc } from 'firebase/firestore';
import SeatingCanvas from '../features/seating/SeatingCanvas';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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

function formatDateEs(dateVal) {
  if (!dateVal) return '';
  try {
    if (typeof dateVal === 'string') return dateVal;
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toLocaleDateString('es-ES');
    return new Date(dateVal).toLocaleDateString('es-ES');
  } catch {
    return '';
  }
}

export default function BodaDetalle() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const DESIGN_ITEMS = [
    { key: 'web', label: 'Página web' },
    { key: 'invitación', label: 'Invitaciones' },
    { key: 'seating', label: 'Seating plan' },
    { key: 'menu', label: 'Menú' },
    { key: 'logo', label: 'Logo' },
  ];

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
      const emptyLists = {
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
        documents: [],
      };
      setWedding(prev => {
        const defaults = prev ? {} : emptyLists; // Sólo la primera vez para inicializar arrays
        return {
          ...defaults,
          ...(prev || {}),
           // Excluimos posibles arrays vacíos o desactualizados del documento principal
           ...(() => {
             const {
               seatingPlan: _sp,
               guests: _g,
               suppliers: _sup,
               tasks: _ts,
               timeline: _tl,
               designs: _ds,
               specialMoments: _sm,
               readings: _rd,
               expenses: _ex,
               ideas: _id,
               documents: _doc,
               ...rest
             } = data;
             return rest; // sólo los campos atómicos
           })(),
          id: snap.id,
          name: data.name || data.brideAndGroom || data.coupleName || data.nombrePareja || data.couple || data.brideAndGroomName || '',
          date: data.weddingDate || data.date || data.fecha || data.fechaBoda || data.ceremonyDate || '',
          location: data.location || data.celebrationPlace || data.ceremonyLocation || data.place || data.venue || '',
        };
      });

      // Obtener información adicional del subdocumento weddingInfo (primer doc de la subcolección)
      onSnapshot(collection(db, 'weddings', id, 'weddingInfo'), (infoSnap) => {
        if (infoSnap.empty) return;
        const info = infoSnap.docs[0].data() || {};
        setWedding(prev => ({
          ...(prev || {}),
          ...info,
          name: info.brideAndGroom || info.coupleName || prev?.name || '',
          date: info.weddingDate || info.date || prev?.date || '',
          location: info.celebrationPlace || info.ceremonyLocation || prev?.location || '',
        }));
      }, (err) => console.error('🔥 ERROR weddingInfo col:', err));

    }, (err) => {
      console.error('🔥 ERROR doc weddings:', err);
      if (err.code === 'permission-denied') {
        window.mostrarErrorUsuario?.('No tienes permisos para ver esta boda', 8000);
      }
    });
    unsubs.push(unsubDoc);


    // unsubs.push(unsubInfo);

    // Helper para escuchar subcolecciones y guardar en estado
    const listenSub = (colPath, stateKey) => {
      // Alias retrocompatibilidad: algunos bundles antiguos aún esperan colName
      const colName = colPath;
      const unsub = onSnapshot(collection(db, 'weddings', id, ...colPath.split('/')), (colSnap) => {
        const list = colSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      // Filtrar documentos "vacíos" (sólo id, sin más campos)
      .filter((doc) => {
        // Excluir documentos que carezcan de datos significativos
        const meaningfulKeys = Object.keys(doc).filter(k => !['id','createdAt','updatedAt'].includes(k));
        if (meaningfulKeys.length === 0) return false;
        // Validación de documentos:
        // - Para proveedores (suppliers) exigimos la presencia del campo "name".
        // - Para invitados (guests) aceptamos "name" o "nombre".
        if (stateKey === 'suppliers' && !doc.name) return false;
        if (stateKey === 'guests' && !(doc.name || doc.nombre)) return false;
        return true;
      });
        console.debug(`⬅️ Subcolección ${colPath} (${stateKey}) docs filtrados:`, list.length);

        setWedding(prev => ({ ...(prev || {}), [stateKey]: list }));
      }, (err) => {
        console.error(`🔥 ERROR sub ${colPath}:`, err);
      });
      unsubs.push(unsub);
    };

    listenSub('guests', 'guests');
    listenSub('tasks', 'tasks');
    listenSub('suppliers', 'suppliers');
    listenSub('timeline', 'timeline');
    listenSub('designs', 'designs');
    listenSub('seatingPlan/banquet/tables', 'seatingPlan');
    listenSub('specialMoments', 'specialMoments');
    listenSub('readings', 'readings');
    listenSub('expenses', 'expenses');
    listenSub('ideas', 'ideas');
    listenSub('documents', 'documents');

    setLoading(false);

    return () => {
      unsubs.forEach((fn) => fn && fn());
    };
  }, [id]);

  const banquetTables = wedding?.seatingPlan || [];
  // ---- Ajuste de escala y desplazamiento para la mini-preview ----
  // Calculamos scale dinámicamente para que todo el plano quepa en la vista  (máx 600x360)
  const previewScale = React.useMemo(() => {
    if (banquetTables.length === 0) return 0.6;
    const diam = t => t.diameter || Math.max(t.width || 0, t.height || t.length || 0) || 80;
    const minX = Math.min(...banquetTables.map(t => (t.x ?? 0)));
    const minY = Math.min(...banquetTables.map(t => (t.y ?? 0)));
    const maxX = Math.max(...banquetTables.map(t => (t.x ?? 0) + diam(t)));
    const maxY = Math.max(...banquetTables.map(t => (t.y ?? 0) + diam(t)));

    const boundingW = maxX - minX + 80; // + margen interno
    const boundingH = maxY - minY + 80;
    const maxW = 600; // ancho aproximado del contenedor (w-full con padding)
    const maxH = 360; // h-96 (~384) menos padding
    const scale = Math.min(maxW / boundingW, maxH / boundingH, 0.8);
    return scale < 0.2 ? 0.2 : scale; // límite mínimo para legibilidad
  }, [banquetTables]);
  const previewOffset = React.useMemo(() => {
    if (banquetTables.length === 0) return { x: 0, y: 0 };
    const minX = Math.min(...banquetTables.map(t => (t.x ?? 0)));
    const minY = Math.min(...banquetTables.map(t => (t.y ?? 0)));
    // Dejamos un pequeño margen interno (40 px)
    return { x: -minX * previewScale + 40, y: -minY * previewScale + 40 };
  }, [banquetTables]);
  /*
  

  
    if (!wedding) return;
    if (wedding.seatingPlanPdf) {
      (null);
      return;
    }
    if (banquetTables.length === 0) return;
    // Generar PDF listado sencillo de mesas e invitados
    
    
    pdf.text('Seating Plan – Banquete', 40, 40);
    pdf.setFontSize(11);
    let y = 70;
    banquetTables.forEach((t) => {
      const line = `${t.name || t.table || 'Mesa'}: ${(Array.isArray(t.seats) ? t.seats : t.assignedGuests || []).join(', ')}`;
      const lines = pdf.splitTextToSize(line, 500);
      lines.forEach((l) => {
        if (y > 750) { pdf.addPage(); y = 40; }
        pdf.text(l, 40, y);
        y += 18;
      });
    });
    
    
*/
  
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

      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{wedding.name?.trim() ? wedding.name : 'Boda sin nombre'}</h1>
      <p className="text-gray-600">
        {formatDateEs(wedding.date)}{wedding.location ? ` · ${wedding.location}` : ''}
      </p>

      {/* Información de la pareja */}
      {(wedding.bride || wedding.groom || wedding.coupleName) && (
        <p className="text-gray-700 mt-1">
          {wedding.coupleName || `${wedding.bride || ''}${wedding.bride && wedding.groom ? ' & ' : ''}${wedding.groom || ''}`}
        </p>
      )}

      {/* Información adicional */}
      {(wedding.schedule || wedding.celebrationPlace || wedding.banquetPlace) && (
        <div className="text-sm text-gray-600 mt-2 space-y-1">
          {wedding.schedule && <p>Horario: {wedding.schedule}</p>}
          {wedding.celebrationPlace && <p>Ceremonia: {wedding.celebrationPlace}</p>}
          {wedding.banquetPlace && <p>Banquete: {wedding.banquetPlace}</p>}
        </div>
      )}

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
        <Card className="text-center cursor-pointer" onClick={() => navigate('/invitados')}>
          <p className="text-sm text-gray-500">Invitados</p>
          <p className="text-2xl font-bold text-gray-800">{(wedding.guests || []).length}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500">Tareas pendientes</p>
          <p className="text-2xl font-bold text-gray-800">{(wedding.tasks || []).filter(t=>!t.done).length}</p>
        </Card>
        <Card className="text-center cursor-pointer" onClick={() => navigate('/proveedores')}>
          <p className="text-sm text-gray-500">Proveedores</p>
          <p className="text-2xl font-bold text-gray-800">{(wedding.suppliers || []).length}</p>
        </Card>
      </div>

      {/* Contenido principales secciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        

        {/* Ideas */}
        <div className="bg-white rounded shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Ideas</h3>
            <button
              onClick={() => navigate('/ideas')}
              className="text-blue-600 text-sm hover:underline"
            >
              Gestionar
            </button>
          </div>
          <ul className="list-disc list-inside space-y-1 max-h-60 overflow-y-auto text-sm">
            {(wedding.ideas || []).map((i) => (
              <li key={i.id}>{i.name || i.title}</li>
            ))}
            {wedding.ideas.length === 0 && <li className="text-gray-500">Sin ideas</li>}
          </ul>
        </div>
      </div>

      {role==='planner' && (
        <section>
         <div className="flex items-center justify-between mb-2">
           <h2 className="text-xl font-semibold">Disposición de Mesas</h2>
           {wedding.seatingPlanPdf && (
             <a href={wedding.seatingPlanPdf} target="_blank" rel="noopener" className="text-rose-600 hover:underline text-sm" onClick={e=>e.stopPropagation() }>Descargar PDF</a>
           )}
         </div>
         {/* Vista previa clickable */}
         <div
           className="border rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-rose-400 transition"
           onClick={() => navigate('/invitados/seating')}
         >
           {banquetTables.length > 0 ? (
              <div className="relative w-full h-96">
                <DndProvider backend={HTML5Backend}>
                 <SeatingCanvas
                   tab="banquet"
                   areas={[]}
                   tables={banquetTables}
                   guests={wedding.guests || []}
                   seats={[]}
                   scale={previewScale}
                   offset={previewOffset}
                   addArea={() => {}}
                   onDeleteArea={() => {}}
                   moveTable={() => {}}
                   onAssignGuest={() => {}}
                   onToggleEnabled={() => {}}
                   setConfigTable={() => {}}
                   online={false}
                   handleWheel={() => {}}
                   handlePointerDown={() => {}}
                   onSelectTable={() => {}}
                   drawMode="none"
                   canPan={false}
                   canMoveTables={false}
                   onToggleSeat={() => {}}
                 />
                 </DndProvider>
              </div>
              
              
            ) : wedding.seatingPlanImage ? (
             <img src={wedding.seatingPlanImage} alt="Plano de mesas" className="w-full block" />
           ) : banquetTables.length > 0 ? (
             <div className="p-4 space-y-1 text-sm">
               {banquetTables.map((t) => (
                 <div key={t.id || t.table || t.name} className="flex justify-between border-b py-0.5">
                   <span className="font-medium">{t.name || t.table || `Mesa ${t.id}`}</span>
                   <span className="text-gray-500">{Array.isArray(t.seats) ? t.seats.length : (t.assignedGuests?.length || 0)} invitados</span>
                 </div>
               ))}
             </div>
           ) : (
             <div className="p-6 text-center text-gray-500 text-sm">Haz clic para editar el plano de mesas</div>
           )}
         </div>
       </section>
        )}

      {/* Diseños */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Diseños</h2>
        <ul className="space-y-1">
          {DESIGN_ITEMS.map((item) => {
            const done = (wedding.designs || []).some((d) => d.type?.toLowerCase().includes(item.key));
            return (
              <li key={item.key} className="flex items-center bg-white rounded-md p-3 shadow-sm">
                {done ? (
                  <CheckCircle className="text-green-600 w-5 h-5 mr-2" />
                ) : (
                  <Circle className="text-gray-400 w-5 h-5 mr-2" />
                )}
                <span className={done ? 'text-green-700 font-medium' : 'text-gray-700'}>{item.label}</span>
              </li>
            );
          })}
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

      {/* Documentos */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Documentos</h2>
        <ul className="space-y-1">
          {(wedding.documents || []).map((d) => (
            <li key={d.id} className="flex justify-between bg-white rounded-md p-3 shadow-sm">
              <span>{d.name}</span>
              {d.url && (
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver</a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
