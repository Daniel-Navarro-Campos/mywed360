import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useUserContext } from '../context/UserContext';
import { Card } from './ui/Card';
import { Progress } from './ui/Progress';
import Nav from './Nav';
import { Link } from 'react-router-dom';

import { User, DollarSign, Calendar, Users, ChevronLeft, ChevronRight, Plus, Phone } from 'lucide-react';
import Input from './Input';
import ProviderSearchModal from './ProviderSearchModal';

import { fetchWall } from '../services/wallService';

import PlannerDashboard from './PlannerDashboard';

export default function HomePage() {
  // Todo se maneja con modales locales
  const [noteText, setNoteText] = useState('');
  const [guest, setGuest] = useState({name: '', side: 'novia', contact: ''});
  const [newMovement, setNewMovement] = useState({concept: '', amount: 0, date: '', type: 'expense'});
  const [activeModal, setActiveModal] = useState(null);
  const { user, role, userName, weddingName, progress, logoUrl } = useUserContext();

  // Si el usuario es Wedding Planner mostramos dashboard específico
  if (role === 'planner') {
    return <PlannerDashboard />;
  }
  const galleryRef = useRef(null);
  const [categoryImages, setCategoryImages] = useState([]);

  // Cargar primera imagen de cada categoría
  useEffect(() => {
    const categories = ['decoración','cóctel','banquete','ceremonia'];
    Promise.all(categories.map(cat=>fetchWall(1, cat))).then(results=>{
      const imgs = results.map((arr,i)=>{
        const first = arr[0];
        if(first) return { src: first.url, alt: categories[i] };
        return null;
      }).filter(Boolean);
      setCategoryImages(imgs);
    }).catch(console.error);
  }, []);

  const handleRedoTutorial = async () => {
    if (!confirm('Esto eliminará datos locales y creará una nueva boda de prueba. ¿Continuar?')) return;
    try {
      // 1. Limpiar almacenamiento y marcar flag para mostrar tutorial
      localStorage.clear();
      localStorage.setItem('forceOnboarding', '1');

      toast.success('Tutorial reiniciado: recargando...');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo reiniciar el tutorial');
    }
  };
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
    <React.Fragment>
      {/* Botón solo visible en desarrollo */}
      {true && (
        <button
          onClick={handleRedoTutorial}
          className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-[100]"
        >
          Rehacer tutorial
        </button>
      )}
      <div className="relative flex flex-col h-full bg-[var(--color-bg)] pb-16">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent)] rounded-full opacity-20 transform translate-x-1/2 -translate-y-1/2" />

        {/* Header */}
        <header className="relative z-10 p-6 flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="page-title">Bienvenidos, {weddingName}{weddingName && userName ? ' y ' : ''}{userName}</h1>
            <p className="text-4xl font-bold text-[color:var(--color-text)]">Cada detalle hace tu boda inolvidable</p>
          </div>
          <img
            src={`${import.meta.env.BASE_URL}logo-app.png`}
            alt="Logo de la boda"
            className="w-32 h-32 object-contain"
          />
        </header>

        {/* Progress Section */}
        <section className="z-10 w-full p-6">
          <Card className="bg-[var(--color-surface)]/70 backdrop-blur-md p-4 w-full">
            <p className="text-sm text-[color:var(--color-text)]/70 mb-2">Progreso de tareas</p>
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
            <p className="mt-2 text-sm font-medium text-[color:var(--color-text)]">
              {progress}% completado
            </p>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="z-10 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
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
                className="flex items-center justify-between p-4 bg-[var(--color-surface)]/80 backdrop-blur-md hover:shadow-lg transition transform hover:scale-105 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="text-[var(--color-primary)]" />
                  <span className="text-[color:var(--color-text)] font-medium">{action.label}</span>
                </div>
                <ChevronRight className="text-[color:var(--color-text)]/50" />
              </Card>
            );
          })}
        </section>

        {/* Stats Cards */}
        <section className="z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 flex-grow">
          {statsCommon.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="p-4 bg-[var(--color-surface)]/80 backdrop-blur-md hover:shadow-lg transition transform hover:scale-105">
                <div className="flex items-center space-x-2">
                  <Icon className="text-[var(--color-primary)]" />
                  <p className="text-sm text-[color:var(--color-text)]">{stat.label}</p>
                </div>
                <p className="text-2xl font-extrabold text-[var(--color-primary)] mt-2">
                  {stat.value}
                </p>
              </Card>
            );
          })}
        </section>

        {/* Inspiration Gallery */}
        <section className="z-10 p-6 pb-12 relative">
          <div className="flex justify-between items-center mb-4">
            <Link to="/inspiracion">
              <button className="text-xl font-bold text-[var(--color-text)] hover:text-[var(--color-primary)]">
                Inspiración para tu boda
              </button>
            </Link>
            <div className="flex space-x-2">
              <button onClick={scrollPrev} className="p-2 rounded-full bg-[var(--color-surface)]/80 backdrop-blur-md">
                <ChevronLeft className="text-[var(--color-primary)]" />
              </button>
              <button onClick={scrollNext} className="p-2 rounded-full bg-[var(--color-surface)]/80 backdrop-blur-md">
                <ChevronRight className="text-[var(--color-primary)]" />
              </button>
            </div>
          </div>
          <div 
            ref={galleryRef} 
            className="flex space-x-4 overflow-x-auto pb-4 snap-x scrollbar-hide"
          >
            {categoryImages.map((img, idx) => (
              <div key={idx} className="snap-start flex-shrink-0 w-64 h-64 relative rounded-lg overflow-hidden">
                <img 
                  src={img.src} 
                  alt={img.alt}
                  className="w-full h-full object-cover transition transform hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white font-medium">{img.alt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Blog Section */}
        <section className="z-10 p-6 pb-2">
          <div className="flex justify-between items-center mb-4">
            <Link to="/blog">
              <button className="text-xl font-bold text-[var(--color-text)] hover:text-[var(--color-primary)]">
                Blog
              </button>
            </Link>
          </div>
        </section>

        {/* Artículos de Inspiración */}
        <section className="z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
          {[
            { title: "10 ideas para personalizar tu boda", source: "Blog de Bodas", url: "#" },
            { title: "Tendencias en decoración para este año", source: "Revista Novias", url: "#" },
            { title: "Guía de planificación paso a paso", source: "Lovenda", url: "#" },
            { title: "Consejos para elegir proveedores", source: "Expertos en Bodas", url: "#" }
          ].map((article, idx) => (
            <Card key={idx} className="p-4 hover:shadow-lg transition">
              <p className="text-lg font-medium text-[var(--color-text)]">
                {article.title}
              </p>
              <p className="text-sm text-[color:var(--color-text)] mt-1">
                {article.source}
              </p>
              <a
                href={article.url}
                className="inline-flex items-center text-[var(--color-primary)] mt-2"
              >
                Leer más
              </a>
            </Card>
          ))}
        </section>

        <Nav active="home" />
      </div>
      
      {/* Modales */}
      {activeModal === 'proveedor' && <ProviderSearchModal onClose={() => setActiveModal(null)} />}

      {activeModal === 'invitado' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">Añadir Invitado</h2>
            <div className="space-y-4">
              <Input 
                label="Nombre" 
                value={guest.name} 
                onChange={e => setGuest({...guest, name: e.target.value})} 
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Parte de</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded"
                    value={guest.side}
                    onChange={e => setGuest({...guest, side: e.target.value})}
                  >
                    <option value="novia">Novia</option>
                    <option value="novio">Novio</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
                <Input 
                  label="Contacto" 
                  value={guest.contact} 
                  onChange={e => setGuest({...guest, contact: e.target.value})} 
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-[var(--color-text)] border border-[var(--color-text)]/20 rounded"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  const guests = JSON.parse(localStorage.getItem('lovendaGuests') || '[]');
                  guests.push({...guest, id: Date.now()});
                  localStorage.setItem('lovendaGuests', JSON.stringify(guests));
                  setGuest({name:'',side:'novia',contact:''});
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'movimiento' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">Nuevo Movimiento</h2>
            <div className="space-y-4">
              <Input 
                label="Concepto" 
                value={newMovement.concept} 
                onChange={e => setNewMovement({...newMovement, concept: e.target.value})} 
              />
              <Input 
                label="Cantidad (€)" 
                type="number"
                value={newMovement.amount} 
                onChange={e => setNewMovement({...newMovement, amount: parseFloat(e.target.value) || 0})} 
              />
              <Input 
                label="Fecha" 
                type="date"
                value={newMovement.date} 
                onChange={e => setNewMovement({...newMovement, date: e.target.value})} 
              />
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded"
                  value={newMovement.type}
                  onChange={e => setNewMovement({...newMovement, type: e.target.value})}
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-[var(--color-text)] border border-[var(--color-text)]/20 rounded"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  const movs = JSON.parse(localStorage.getItem('quickMovements') || '[]');
                  movs.push({...newMovement, id: Date.now()});
                  localStorage.setItem('quickMovements', JSON.stringify(movs));
                  setNewMovement({concept:'',amount:0,date:'',type:'expense'});
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'nota' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">Nueva Nota</h2>
            <div className="space-y-4">
              <textarea
                className="w-full p-3 border border-gray-300 rounded h-32"
                placeholder="Escribe tu nota aquí..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-[var(--color-text)] border border-[var(--color-text)]/20 rounded"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  const notes = JSON.parse(localStorage.getItem('lovendaNotes') || '[]');
                  notes.push({text: noteText, id: Date.now()});
                  localStorage.setItem('lovendaNotes', JSON.stringify(notes));
                  setNoteText('');
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
