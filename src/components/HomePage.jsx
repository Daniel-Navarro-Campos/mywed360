import React, { useRef, useState } from 'react';
import { useUserContext } from '../context/UserContext';
import { Card } from './ui/Card';
import { Progress } from './ui/Progress';
import Nav from './Nav';

import { User, DollarSign, Calendar, Users, ChevronLeft, ChevronRight, Plus, Phone } from 'lucide-react';
import Input from './Input';
import ProviderSearchModal from './ProviderSearchModal';

import inspo1 from '../assets/inspo1.jpg';
import inspo2 from '../assets/inspo2.jpg';
import inspo3 from '../assets/inspo3.jpg';
import inspo4 from '../assets/inspo4.jpg';

export default function HomePage() {
  // Todo se maneja con modales locales
  const [noteText,setNoteText]=useState('');
  const [guest,setGuest]=useState({name:'',side:'novia',contact:''});
  const [newMovement,setNewMovement]=useState({concept:'',amount:0,date:'',type:'expense'});
  const [activeModal, setActiveModal] = useState(null);
  const { role, userName, weddingName, progress, logoUrl } = useUserContext();
  const galleryRef = useRef(null);
  const scrollAmount = 300;

  const scrollPrev = () => {
    galleryRef.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollNext = () => {
    galleryRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // --- Métricas dinámicas ---
  const guestsArr = (() => {
    try { return JSON.parse(localStorage.getItem('lovendaGuests') || '[]'); } catch { return []; }
  })();
  const confirmedCount = guestsArr.filter(g => ((g.response || g.status || '').toLowerCase() === 'confirmado')).length;
  const totalGuests = guestsArr.length;

  const tasksCompletedMap = (() => { try { return JSON.parse(localStorage.getItem('tasksCompleted') || '{}'); } catch { return {}; } })();
  const meetingsArr = (() => { try { return JSON.parse(localStorage.getItem('lovendaMeetings') || '[]'); } catch { return []; } })();
  const longTasksArr = (() => { try { return JSON.parse(localStorage.getItem('lovendaLongTasks') || '[]'); } catch { return []; } })();
  const allTasks = [...meetingsArr, ...longTasksArr];
  const tasksTotal = allTasks.length;
  const tasksCompleted = allTasks.filter(t => tasksCompletedMap[t.id]).length;

  const providersArr = (() => { try { return JSON.parse(localStorage.getItem('lovendaProviders') || '[]'); } catch { return []; } })();
  const providersTotalNeeded = 8; // puede venir de ajustes
  const providersAssigned = providersArr.length;

  const movements = (() => { try { return JSON.parse(localStorage.getItem('quickMovements') || '[]'); } catch { return []; } })();
  const spent = movements.filter(m => m.type !== 'income').reduce((sum, m) => sum + (m.amount || 0), 0);
  const budgetTotal = 15000; // placeholder
 (() => {
    try {
      const arr = JSON.parse(localStorage.getItem('lovendaGuests') || '[]');
      return arr.filter(g => ((g.response || g.status || '').toLowerCase() === 'confirmado')).length;
    } catch {
      return 0;
    }
  })();

  const statsNovios = [
    { label: 'Invitados confirmados', value: confirmedCount, icon: Users },
    { label: 'Presupuesto gastado', value: `€${spent.toLocaleString()}` + (budgetTotal ? ` / €${budgetTotal.toLocaleString()}` : ''), icon: DollarSign },
    { label: 'Proveedores contratados', value: `${providersAssigned} / ${providersTotalNeeded}`, icon: User },
    { label: 'Tareas completadas', value: `${tasksCompleted} / ${tasksTotal}`, icon: Calendar },
  ];

  const statsPlanner = [
    { label: 'Tareas asignadas', value: `${tasksTotal}`, icon: Calendar },
    { label: 'Proveedores asignados', value: providersAssigned, icon: User },
    { label: 'Invitados confirmados', value: confirmedCount, icon: Users },
    { label: 'Presupuesto gastado', value: `€${spent.toLocaleString()}` + (budgetTotal ? ` / €${budgetTotal.toLocaleString()}` : ''), icon: DollarSign },
  ];

  const statsCommon = role === 'particular' ? statsNovios : statsPlanner;

  return (
    <div className="relative flex flex-col h-full bg-pastel-yellow pb-16">
      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-pastel-pink rounded-full opacity-20 transform translate-x-1/2 -translate-y-1/2" />

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="page-title">Bienvenidos, {weddingName}{weddingName && userName ? ' y ' : ''}{userName}</h1>
          <p className="text-4xl font-bold text-gray-800">Cada detalle hace tu boda inolvidable</p>
        </div>
        <img
            src={`${import.meta.env.BASE_URL}logo-app.png`}
            alt="Logo de la boda"
            className="w-32 h-32 object-contain"
          />
      </header>

      {/* Progress Section */}
      <section className="z-10 w-full p-6">
        <Card className="bg-white/70 backdrop-blur-md p-4 w-full">
          <p className="text-sm text-gray-600 mb-2">Progreso de tareas</p>
          <Progress
            className="h-4 rounded-full w-full"
            value={progress}
            max={100}
            variant={
              progress >= 100
                ? 'success'
                : progress >= 80
                ? 'primary'
                : 'destructive'
            }
          />
          <p className="mt-2 text-sm font-medium text-gray-700">
            {progress}% completado
          </p>
        </Card>
      </section>

      {/* Quick Actions */}
      <section className="z-10 p-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { key: 'proveedor', label: 'Buscar proveedor', icon: User },
          { key: 'invitado', label: 'Añadir invitado', icon: Users },
          { key: 'movimiento', label: 'Añadir movimiento', icon: DollarSign },
          { key: 'nota', label: 'Nueva nota', icon: Plus },
        ].map((action, idx) => {
          const Icon = action.icon;
          return (
            <Card
              key={idx}
              role="button"
              onClick={() => setActiveModal(action.key)}
              className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md hover:shadow-lg transition transform hover:scale-105 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <Icon className="text-pastel-blue" />
                <span className="text-gray-700 font-medium">{action.label}</span>
              </div>
              <ChevronRight className="text-gray-400" />
            </Card>
          );
        })}
      </section>

      {/* Stats Cards */}
      <section className="z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 flex-grow">
        {statsCommon.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card
              key={idx}
              className="p-4 bg-white/80 backdrop-blur-md hover:shadow-lg transition transform hover:scale-105"
            >
              <div className="flex items-center space-x-2">
                <Icon className="text-pastel-blue" />
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
              <p className="text-2xl font-extrabold text-blue-600 mt-2">
                {stat.value}
              </p>
            </Card>
          );
        })}
      </section>

      {/* Inspiration Gallery */}
      <section className="z-10 p-6">
        
        <div className="relative">
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-white/80 rounded-full shadow-md"
          >
            <ChevronLeft className="text-gray-700" />
          </button>
          <div
            ref={galleryRef}
            className="flex space-x-4 py-2 overflow-hidden scroll-smooth"
          >
            {[inspo1, inspo2, inspo3, inspo4].map((src, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-80 h-56 rounded-xl overflow-hidden shadow-md"
              >
                <img
                  src={src}
                  alt={`Inspiración ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-white/80 rounded-full shadow-md"
          >
            <ChevronRight className="text-gray-700" />
          </button>
        </div>
      </section>

      {/* News & Articles */}
      <section className="z-10 p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Últimas Noticias
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Tendencias en decoraciones nupciales 2025',
              url: '#',
              source: 'Blog de Bodas',
            },
            {
              title: 'Cómo elegir el menú perfecto para tu boda',
              url: '#',
              source: 'Revista Eventos',
            },
            {
              title: 'Guía definitiva de flores de temporada',
              url: '#',
              source: 'Noticias Florales',
            },
          ].map((article, idx) => (
            <Card key={idx} className="p-4 hover:shadow-lg transition">
              <p className="text-lg font-medium text-gray-800">
                {article.title}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {article.source}
              </p>
              <a
                href={article.url}
                className="inline-flex items-center text-blue-600 mt-2"
              >
                Leer más <ChevronRight className="ml-1" />
              </a>
            </Card>
          ))}
        </div>
      </section>

      {/* Fixed Bottom Navigation */}
      {/* Quick Modals */}
      {activeModal==='nota' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={()=>{setActiveModal(null);setNoteText('');}}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Nueva Nota</h3>
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} className="w-full border rounded p-2 mb-4" placeholder="Escribe tu idea..." />
            <div className="text-right space-x-2">
              <button onClick={()=>{setActiveModal(null);setNoteText('');}} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
              <button onClick={()=>{
                if(!noteText.trim()) return;
                const stored=JSON.parse(localStorage.getItem('ideasNotes')||'[]');
                stored.push({folder:'General',text:noteText.trim()});
                localStorage.setItem('ideasNotes',JSON.stringify(stored));
                setActiveModal(null);setNoteText('');
              }} className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
            </div>
          </div>
        </div>
    )}

    {activeModal === 'proveedor' && (
      <ProviderSearchModal 
        onClose={() => setActiveModal(null)} 
        onSelectProvider={(provider) => {
          // Guardar el proveedor seleccionado
          const providers = JSON.parse(localStorage.getItem('lovendaProviders') || '[]');
          const newId = providers.length ? Math.max(...providers.map(p => p.id)) + 1 : 1;
          const newProvider = {
            id: newId,
            name: provider.title || provider.name || 'Proveedor',
            service: provider.service || 'Proveedor',
            contact: '',
            email: '',
            phone: '',
            link: provider.link || '',
            status: 'Nuevo',
            date: new Date().toISOString().slice(0, 10),
            rating: 0,
            ratingCount: 0,
            snippet: provider.snippet || '',
          };
          localStorage.setItem('lovendaProviders', JSON.stringify([...providers, newProvider]));
          window.dispatchEvent(new Event('lovenda-providers'));
        }}
      />
    )}

    {activeModal === 'invitado' && (
      <GuestModalHomePage onClose={() => setActiveModal(null)} />
    )}

    {activeModal === 'movimiento' && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setActiveModal(null); setNewMovement({ concept: '', amount: 0, date: '', type: 'expense' }); }}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-semibold mb-3">Nuevo movimiento</h3>
          <input value={newMovement.concept} onChange={e => setNewMovement({ ...newMovement, concept: e.target.value })} className="w-full border rounded p-2 mb-2" placeholder="Concepto" />
          <input type="number" value={newMovement.amount} onChange={e => setNewMovement({ ...newMovement, amount: +e.target.value || 0 })} className="w-full border rounded p-2 mb-2" placeholder="Monto (€)" />
          <input type="date" value={newMovement.date} onChange={e => setNewMovement({ ...newMovement, date: e.target.value })} className="w-full border rounded p-2 mb-2" />
          <select value={newMovement.type} onChange={e => setNewMovement({ ...newMovement, type: e.target.value })} className="w-full border rounded p-2 mb-4">
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
          <div className="text-right space-x-2">
            <button onClick={() => { setActiveModal(null); setNewMovement({ concept: '', amount: 0, date: '', type: 'expense' }); }} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
            <button onClick={() => {
              if (!newMovement.concept.trim() || !newMovement.date) return;
              const movs = JSON.parse(localStorage.getItem('quickMovements') || '[]');
              movs.push({ ...newMovement, concept: newMovement.concept.trim() });
              localStorage.setItem('quickMovements', JSON.stringify(movs));
              setActiveModal(null); setNewMovement({ concept: '', amount: 0, date: '', type: 'expense' });
            }} className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
          </div>
        </div>
      </div>
    )}

    <div className="fixed bottom-0 left-0 w-full z-20">
      <Nav />
    </div>
  </div>
);
}

// --- GuestModalHomePage fuera del componente principal ---

function GuestModalHomePage({ onClose }) {
  const emptyGuest = { name: '', phone: '', address: '', companion: 0, table: '', response: 'Pendiente' };
  const [editingGuest, setEditingGuest] = React.useState({ ...emptyGuest });
  const [importing, setImporting] = React.useState(false);

  const importFromContacts = async () => {
    if (navigator.contacts && navigator.contacts.select) {
      setImporting(true);
      try {
        const picked = await navigator.contacts.select(['name', 'tel'], { multiple: true });
        if (picked && picked.length) {
          const stored = JSON.parse(localStorage.getItem('lovendaGuests') || '[]');
          let nextId = stored.length ? Math.max(...stored.map(g => g.id)) + 1 : 1;
          const mapped = picked.map(c => ({
            id: nextId++,
            name: Array.isArray(c.name) ? c.name[0] : c.name || 'Invitado',
            phone: Array.isArray(c.tel) ? c.tel[0] : c.tel || '',
            address: '',
            companion: 0,
            table: '',
            response: 'Pendiente'
          }));
          const updated = [...stored, ...mapped];
          localStorage.setItem('lovendaGuests', JSON.stringify(updated));
          window.dispatchEvent(new Event('lovenda-guests'));
          onClose();
        }
      } catch (err) {
        alert('Error importando contactos');
      } finally {
        setImporting(false);
      }
    } else {
      alert('La API de Contactos no está disponible en este dispositivo.');
    }
  };

  const handleSave = () => {
    if (!editingGuest.name.trim()) return;
    const stored = JSON.parse(localStorage.getItem('lovendaGuests') || '[]');
    const newId = stored.length ? Math.max(...stored.map(g => g.id)) + 1 : 1;
    const newGuest = { ...editingGuest, id: newId, name: editingGuest.name.trim() };
    localStorage.setItem('lovendaGuests', JSON.stringify([...stored, newGuest]));
    window.dispatchEvent(new Event('lovenda-guests'));
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow w-96 space-y-4">
        <h2 className="text-lg font-semibold">Añadir Invitado</h2>
        <div className="space-y-3">
          <button className="w-full px-3 py-2 rounded border border-blue-400 text-blue-700 bg-blue-50 flex items-center justify-center gap-2" onClick={importFromContacts} disabled={importing}>
            <Phone size={16}/> Importar desde contactos
          </button>
          <Input label="Nombre" value={editingGuest.name} onChange={e => setEditingGuest({ ...editingGuest, name: e.target.value })} />
          <Input label="Teléfono" value={editingGuest.phone} onChange={e => setEditingGuest({ ...editingGuest, phone: e.target.value })} />
          <Input label="Dirección postal" value={editingGuest.address} onChange={e => setEditingGuest({ ...editingGuest, address: e.target.value })} />
          <Input label="Acompañantes" type="number" min="0" value={editingGuest.companion} onChange={e => setEditingGuest({ ...editingGuest, companion: parseInt(e.target.value,10)||0 })} />
          <Input label="Mesa (número o apodo)" value={editingGuest.table} onChange={e => setEditingGuest({ ...editingGuest, table: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-4 py-2 rounded bg-gray-300" onClick={onClose}>Cancelar</button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
