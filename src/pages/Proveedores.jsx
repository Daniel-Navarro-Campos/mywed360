import React, { useState, useEffect } from 'react';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import Card from '../components/Card';
import { Search, RefreshCcw, Plus, Eye, Edit2, Trash2, Calendar, Download, Cpu, Star } from 'lucide-react';

export default function Proveedores() {
  const sampleProviders = [
    { id: 1, name: 'Eventos Catering', service: 'Catering', contact: 'Luis Pérez', email: 'luis@catering.com', phone: '555-1234', status: 'Contactado', date: '2025-06-10', rating: 0, ratingCount: 0 },
    { id: 2, name: 'Flores y Diseño', service: 'Flores', contact: 'Ana Gómez', email: 'ana@flores.com', phone: '555-5678', status: 'Confirmado', date: '2025-06-12', rating: 0, ratingCount: 0 },
  ];
  const [providers, setProviders] = useState(sampleProviders);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailProvider, setDetailProvider] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [showResModal, setShowResModal] = useState(false);
  const [providerToReserve, setProviderToReserve] = useState(null);
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const initialProvider = { name: '', service: '', contact: '', email: '', phone: '', status: '', date: '' };

  // Cargar proveedores encontrados por la IA (almacenados en localStorage) y escuchar cambios
  useEffect(() => {
    const loadSuppliers = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('lovendaSuppliers') || '[]');
        if (!Array.isArray(stored) || !stored.length) return;
        setProviders(prev => {
          const existingLinks = new Set(prev.map(p => p.link));
          const mapped = stored
            .filter(s => !existingLinks.has(s.link))
            .map((s, idx) => ({
              id: `web-${Date.now()}-${idx}`,
              name: s.title,
              service: 'Proveedor',
              contact: '',
              email: '',
              phone: '',
              link: s.link,
              status: 'Nuevo',
              date: new Date().toISOString().slice(0, 10),
              rating: 0,
              ratingCount: 0,
              snippet: s.snippet || '',
            }));
          return [...prev, ...mapped];
        });
      } catch (_) {}
    };
    loadSuppliers();
    window.addEventListener('lovenda-suppliers', loadSuppliers);
    return () => window.removeEventListener('lovenda-suppliers', loadSuppliers);
  }, []);
  const [newProvider, setNewProvider] = useState(initialProvider);
  const handleAddProvider = e => {
    e.preventDefault();
    const newId = providers.length ? Math.max(...providers.map(p => p.id)) + 1 : 1;
    setProviders(prev => [...prev, { id: newId, ...newProvider, rating: 0, ratingCount: 0 }]);
    setNewProvider(initialProvider);
    setShowAddModal(false);
    setToast({ message: 'Proveedor agregado', type: 'success' });
  };

  const openResModal = (p) => {
    setProviderToReserve(p);
    setResDate('');
    setResTime('');
    setShowResModal(true);
  };

  const confirmReservation = () => {
    if (providerToReserve && resDate && resTime) {
      const dt = new Date(resDate + 'T' + resTime);
      setReservations(prev => [...prev, { providerId: providerToReserve.id, datetime: dt }]);
      setShowResModal(false);
    }
  };

  const rateProvider = (id, ratingValue) => {
    setProviders(prev => prev.map(p =>
      p.id === id ? { ...p,
        ratingCount: p.ratingCount + 1,
        rating: (p.rating * p.ratingCount + ratingValue) / (p.ratingCount + 1)
      } : p
    ));
  };

  const filtered = providers.filter(p =>
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.service.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (serviceFilter ? p.service === serviceFilter : true) &&
    (statusFilter ? p.status === statusFilter : true) &&
    (dateFrom ? p.date >= dateFrom : true) &&
    (dateTo ? p.date <= dateTo : true)
  );

  const toggleSelect = id => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const clearFilters = () => {
    setSearchTerm(''); setAiQuery(''); setServiceFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo('');
  };

  const handleAiSearch = async () => {
    if (!aiQuery) return;
    setAiLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that filters providers based on user query. Return a JSON array of matching provider IDs.' },
            { role: 'user', content: `Query: ${aiQuery}. Providers: ${JSON.stringify(sampleProviders)}` }
          ]
        })
      });
      const data = await response.json();
      let ids = [];
      try { ids = JSON.parse(data.choices[0].message.content); } catch { console.error('Invalid JSON from AI', data.choices[0].message.content); }
      setProviders(sampleProviders.filter(p => ids.includes(p.id)));
      setToast({ message: 'Proveedores filtrados por IA', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error al buscar con IA', type: 'error' });
    } finally {
      setAiLoading(false);
    }
  };

  const openDetail = p => { setDetailProvider(p); setShowDetail(true); };

  return (
    <Card className="p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gestión de Proveedores</h1>
        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center">
          <Plus size={16} className="mr-2" /> Añadir Proveedor
        </button>
          <button className="bg-gray-200 px-4 py-2 rounded flex items-center">
            <RefreshCcw size={16} className="mr-2" /> Importar CSV
          </button>
        </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center border rounded px-2 py-1">
          <Search size={16} className="mr-2 text-gray-600" />
          <input
            type="text"
            placeholder="Buscar nombre o servicio"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="outline-none"
          />
        </div>
        <div className="flex items-center border rounded px-2 py-1">
          <Cpu size={16} className="mr-2 text-gray-600" />
            {aiLoading && <Spinner className="ml-2" />}
          <input
            type="text"
            placeholder="Buscar IA..."
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
            className="outline-none"
          />
        </div>
        <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Todos los servicios</option>
          <option value="Catering">Catering</option>
          <option value="Flores">Flores</option>
          <option value="Música">Música</option>
          <option value="Fotografía">Fotografía</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Todos los estados</option>
          <option value="Contactado">Contactado</option>
          <option value="Confirmado">Confirmado</option>
          <option value="Pendiente">Pendiente</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-2 py-1" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-2 py-1" />
        <button onClick={clearFilters} className="bg-gray-200 px-3 py-1 rounded flex items-center">
          <RefreshCcw size={16} className="mr-1" /> Limpiar
        </button>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-gray-100 p-2 rounded flex gap-2">
          <button className="bg-green-600 text-white px-3 py-1 rounded">Enviar comunicaciones ({selected.length})</button>
          <select className="border rounded px-2 py-1">
            <option value="">Cambiar estado...</option>
            <option value="Contactado">Contactado</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>
      )}

      {/* Tabla Escritorio */}
      <div className="hidden md:block overflow-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2"><input type="checkbox" /></th>
              <th className="p-2">Nombre</th>
              <th className="p-2">Servicio</th>
              <th className="p-2">Contacto</th>
              <th className="p-2">Email</th>
              <th className="p-2">Teléfono</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Fecha</th>
              <th className="p-2">Valoración</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b">
                <td className="p-2">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                </td>
                <td className="p-2">{p.link ? <a href={p.link} target="_blank" rel="noreferrer" className="text-blue-600 underline">{p.name}</a> : p.name}</td>
                <td className="p-2">{p.service}</td>
                <td className="p-2">{p.contact}</td>
                <td className="p-2">{p.email}</td>
                <td className="p-2">{p.phone}</td>
                <td className="p-2 cursor-pointer">{p.status}</td>
                <td className="p-2 cursor-pointer">{p.date}</td>
                <td className="p-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={16} className="cursor-pointer" color={i <= Math.round(p.rating) ? '#facc15' : '#e5e7eb'} onClick={() => rateProvider(p.id, i)} />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">({p.ratingCount})</span>
                </td>
                <td className="p-2 flex gap-2">
                  <Eye size={16} className="cursor-pointer text-gray-600" onClick={() => openDetail(p)} />
                  <Edit2 size={16} className="cursor-pointer text-blue-600" />
                  <Trash2 size={16} className="cursor-pointer text-red-600" onClick={() => { setProviders(prev => prev.filter(x => x.id !== p.id)); setToast({ message: 'Proveedor eliminado', type: 'success' }); }} />
                  <Calendar size={16} className="cursor-pointer text-green-600" onClick={() => openResModal(p)} />
                  <span className="text-sm text-gray-600 ml-1">{reservations.filter(r => r.providerId === p.id).length}</span>
                  <Download size={16} className="cursor-pointer text-purple-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista móvil */}
      <div className="block md:hidden space-y-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="font-semibold text-lg">{p.name}</p>
                <p className="text-sm text-gray-600">{p.service} - {p.status}</p>
                <p className="text-sm text-gray-600">{p.contact}</p>
              </div>
              <button onClick={() => toggleSelect(p.id)} className="text-gray-600">Acciones</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Añadir Proveedor */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow w-96">
            <h2 className="text-lg font-semibold mb-4">Añadir Proveedor</h2>
            <form onSubmit={handleAddProvider} className="space-y-3">
              <input type="text" placeholder="Nombre" value={newProvider.name} onChange={e => setNewProvider({ ...newProvider, name: e.target.value })} className="w-full border rounded px-2 py-1" required />
              <input type="text" placeholder="Servicio" value={newProvider.service} onChange={e => setNewProvider({ ...newProvider, service: e.target.value })} className="w-full border rounded px-2 py-1" required />
              <input type="text" placeholder="Contacto" value={newProvider.contact} onChange={e => setNewProvider({ ...newProvider, contact: e.target.value })} className="w-full border rounded px-2 py-1" />
              <input type="email" placeholder="Email" value={newProvider.email} onChange={e => setNewProvider({ ...newProvider, email: e.target.value })} className="w-full border rounded px-2 py-1" />
              <input type="tel" placeholder="Teléfono" value={newProvider.phone} onChange={e => setNewProvider({ ...newProvider, phone: e.target.value })} className="w-full border rounded px-2 py-1" />
              <select value={newProvider.status} onChange={e => setNewProvider({ ...newProvider, status: e.target.value })} className="w-full border rounded px-2 py-1">
                <option value="">Seleccionar estado</option>
                <option value="Contactado">Contactado</option>
                <option value="Confirmado">Confirmado</option>
                <option value="Pendiente">Pendiente</option>
              </select>
              <input type="date" value={newProvider.date} onChange={e => setNewProvider({ ...newProvider, date: e.target.value })} className="w-full border rounded px-2 py-1" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDetail && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow w-96">
            <h2 className="text-lg font-semibold mb-4">Detalle del Proveedor</h2>
            <p><strong>Nombre:</strong> {detailProvider.name}</p>
            <p><strong>Servicio:</strong> {detailProvider.service}</p>
            <p><strong>Contacto:</strong> {detailProvider.contact}</p>
            <p><strong>Email:</strong> {detailProvider.email}</p>
            <p><strong>Teléfono:</strong> {detailProvider.phone}</p>
            <p><strong>Estado:</strong> {detailProvider.status}</p>
            <p><strong>Fecha:</strong> {detailProvider.date}</p>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowDetail(false)} className="px-4 py-2 bg-red-600 text-white rounded">Cerrar</button>
            </div>
          </div>
        </div>
      )}
      {showResModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow w-96">
            <h2 className="text-lg font-semibold mb-4">Reservar con {providerToReserve?.name}</h2>
            <input type="date" value={resDate} onChange={e => setResDate(e.target.value)} className="w-full border rounded px-2 py-1 mb-2" />
            <input type="time" value={resTime} onChange={e => setResTime(e.target.value)} className="w-full border rounded px-2 py-1 mb-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowResModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button type="button" onClick={confirmReservation} className="px-4 py-2 bg-green-600 text-white rounded">Reservar</button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

