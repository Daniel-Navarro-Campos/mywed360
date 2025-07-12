import React, { useState, useEffect } from 'react';
import { Search, Mail, Edit2, Trash2, RefreshCcw, Plus, User, Phone, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { saveData, loadData, subscribeSyncState, getSyncState } from '../services/SyncService';

// ---------------- NUEVO COMPONENTE INVITADOS ----------------
function Invitados() {
  const locationHash = typeof window !== 'undefined' ? window.location.hash : '';

  const sampleGuests = [
    { id: 1, name: 'Ana García', phone: '123456789', address: 'Calle Sol 1', companion: 1, table: '5', response: 'Sí' },
    { id: 2, name: 'Luis Martínez', phone: '987654321', address: 'Av. Luna 3', companion: 0, table: '', response: 'Pendiente' },
  ];
  const { data: guests, addItem, updateItem, deleteItem } = useFirestoreCollection('guests', sampleGuests);

  // --- Utilidades duplicados ---
  const normalize = (str = '') => str.trim().toLowerCase();
  const phoneClean = (str = '') => str.replace(/\s+/g, '').replace(/[^0-9+]/g, '');

  // --- Funciones para enviar invitaciones ---
  const bulkInvite = () => {
    // recoger todos los invitados con email o teléfono
    const mails = guests.filter(g=>g.email).map(g=>g.email).join(',');
    if (mails) {
      const subject = encodeURIComponent('Invitación a nuestra boda');
      const body = encodeURIComponent('¡Hola! Nos encantaría contar contigo en nuestra boda. Por favor confirma tu asistencia.');
      window.open(`mailto:${mails}?subject=${subject}&body=${body}`);
    } else {
      alert('No hay emails de invitados disponibles');
    }
  };
  const inviteWhatsApp = (guest) => {
    const phone = phoneClean(guest.phone);
    if(!phone){ alert('Invitado sin teléfono'); return; }
    const txt = encodeURIComponent(`¡Hola ${guest.name}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?`);
    window.open(`https://wa.me/${phone}?text=${txt}`, '_blank');
  };
  const inviteEmail = (guest) => {
    const email = guest.email || '';
    if(!email){ alert('Invitado sin email'); return; }
    const subject = encodeURIComponent('Invitación a nuestra boda');
    const body = encodeURIComponent(`Hola ${guest.name},\n\nNos complace invitarte a nuestra boda. Esperamos contar contigo. Por favor confirma tu asistencia.\n\n¡Gracias!`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  // ---- Sincronización híbrida ----
  // Estado de sincronización
  const [syncStatus, setSyncStatus] = useState(getSyncState());
  
  // Cada vez que cambie la colección de invitados, actualizamos localStorage + Firestore
  // y emitimos un evento para que SeatingPlan u otros escuchadores reaccionen.
  useEffect(() => {
    try {
      // Usar SyncService para persistencia híbrida
      saveData('lovendaGuests', guests, {
        collection: 'userGuests',
        showNotification: false // No mostrar notificación cada vez
      });
      
      // Mantener compatibilidad con componentes que usan localStorage directamente
      window.dispatchEvent(new Event('lovenda-guests'));
    } catch (error) {
      console.error('Error al sincronizar invitados:', error);
    }
  }, [guests]);
  
  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);

  

  const [search, setSearch] = React.useState('');
  const [filterResponse, setFilterResponse] = React.useState('');
  const [filterTable, setFilterTable] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingGuest, setEditingGuest] = React.useState(null);
  const [tablesOpen, setTablesOpen] = React.useState(false);
  const groupedTables = React.useMemo(() => {
    const map = {};
    guests.filter(g => g.table).forEach(g => {
      const key = g.table;
      map[key] = map[key] || [];
      map[key].push(g);
    });
    return map;
  }, [guests]);

  const emptyGuest = { name: '', phone: '', email: '', address: '', companion: 0, table: '', response: 'Pendiente' };

  // Abrir modal automáticamente si la URL incluye #nuevo
  React.useEffect(() => {
    if (locationHash === '#nuevo') {
      setEditingGuest({ ...emptyGuest });
      setModalOpen(true);
      // limpia el hash para evitar reabrir al navegar
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Importar invitados usando la Contact Picker API
  const importFromContacts = async () => {
    if (navigator.contacts && navigator.contacts.select) {
      try {
        const picked = await navigator.contacts.select(['name', 'tel'], { multiple: true });
        if (picked && picked.length) {
          const mapped = picked.map(c => ({
              name: Array.isArray(c.name) ? c.name[0] : c.name || 'Invitado',
              phone: Array.isArray(c.tel) ? c.tel[0] : c.tel || '',
              address: '',
              companion: 0,
              table: '',
              response: 'Pendiente'
            })).filter(m => !guests.some(g =>
              normalize(g.name) === normalize(m.name) ||
              (g.phone && m.phone && phoneClean(g.phone) === phoneClean(m.phone))
            ));
            for (const m of mapped) {
              await addItem(m);
            }
        }
      } catch (err) {
        console.error('Error importando contactos', err);
      }
    } else {
      alert('La API de Contactos no está disponible en este dispositivo.');
    }
  };

  const handleSave = async () => {
    if (!editingGuest.name.trim()) return;
    const exists = editingGuest.id && guests.some(g => g.id === editingGuest.id);
    if (exists) {
      // Actualiza invitado existente
      await updateItem(editingGuest.id, editingGuest);
    } else {
      // Nuevo invitado: comprobamos duplicados
      const duplicate = guests.some(g =>
        normalize(g.name) === normalize(editingGuest.name) ||
        (g.phone && editingGuest.phone && phoneClean(g.phone) === phoneClean(editingGuest.phone))
      );
      if (duplicate) {
        alert('Ese invitado ya existe');
        return;
      }
      await addItem(editingGuest);
    }
    setModalOpen(false);
    setEditingGuest(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar invitado?')) {
      await deleteItem(id);
    }
  };

  const filtered = guests.filter(g => {
    return (
      g.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterResponse ? g.response === filterResponse : true) &&
      (filterTable ? String(g.table) === filterTable : true)
    );
  });

  const getTooltipForTable = tableId => {
    if (!tableId) return '';
    const names = guests.filter(g => g.table === tableId).map(g => g.name);
    return `Mesa de ${names.slice(0, 3).join(', ')}${names.length > 3 ? '…' : ''}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800 mr-auto">Gestión de Invitados</h1>
        <div className="flex gap-2">
          <Button leftIcon={<Mail size={16}/>} onClick={bulkInvite}>Enviar invitaciones</Button>
          <Button leftIcon={<Plus size={16}/>} onClick={() => { setEditingGuest({ ...emptyGuest }); setModalOpen(true); }}>Añadir Invitado</Button>
          <Button variant="outline" onClick={() => setTablesOpen(true)}>Ver mesas</Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="space-y-6 p-6">
        <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center border rounded px-2 py-1">
          <Search size={16} className="mr-2 text-gray-600" />
          <input type="text" placeholder="Buscar por nombre" value={search} onChange={e => setSearch(e.target.value)} className="outline-none" />
        </div>
        <select value={filterResponse} onChange={e => setFilterResponse(e.target.value)} className="border rounded px-2 py-1 pr-8 appearance-none">
          <option value="">Todas las respuestas</option>
          <option value="Sí">Sí</option>
          <option value="No">No</option>
          <option value="Pendiente">Pendiente</option>
        </select>
        <input type="text" placeholder="Mesa" value={filterTable} onChange={e => setFilterTable(e.target.value)} className="border rounded px-2 py-1 w-24" />
      </div>

      {/* Tabla */}
      <div className="overflow-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2">Nombre</th>
              <th className="p-2">Teléfono</th>
              <th className="p-2">Respuesta</th>
              <th className="p-2">Acompañante(s)</th>
              <th className="p-2">Mesa</th>
            </tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => { setEditingGuest({ ...g }); setModalOpen(true); }}>
                  <td className="p-2 flex items-center"><User size={16} className="mr-2 text-gray-600" />{g.name}</td>
                  <td className="p-2">{g.phone}</td>
                  <td className="p-2">{g.response}</td>
                  <td className="p-2">{g.companion}</td>
                  <td className="p-2" title={getTooltipForTable(g.table)}>{g.table || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Ver Mesas */}
      {tablesOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={()=>setTablesOpen(false)}>
          <div className="bg-white p-6 rounded shadow max-w-4xl w-full max-h-[85vh] overflow-auto" onClick={e=>e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Mesas e invitados</h2>
            {Object.keys(groupedTables).length===0 ? (
              <p>No hay mesas asignadas</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(groupedTables).map(([table, list]) => (
                  <div key={table} className="border rounded p-3">
                    <h3 className="font-medium mb-2">Mesa {table}</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {list.map(g => (
                        <li key={g.id}>{g.name}{g.companion ? ` (+${g.companion})` : ''}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            <div className="text-right mt-4">
              <Button onClick={()=>setTablesOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Añadir/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow w-96 space-y-4">
            <h2 className="text-lg font-semibold">{editingGuest?.id ? 'Editar Invitado' : 'Añadir Invitado'}</h2>
            <div className="space-y-3">
              {/* Import from contacts (only when adding new guest) */}
              {!editingGuest?.id && (
                <Button variant="outline" leftIcon={<Phone size={16}/>} onClick={importFromContacts}>
                  Importar desde contactos
                </Button>
              )}
              <Input label="Nombre" value={editingGuest.name} onChange={e => setEditingGuest({ ...editingGuest, name: e.target.value })} />
              <Input label="Teléfono" value={editingGuest.phone} onChange={e => setEditingGuest({ ...editingGuest, phone: e.target.value })} />
               <Input label="Email" value={editingGuest.email} onChange={e => setEditingGuest({ ...editingGuest, email: e.target.value })} />
              <Input label="Dirección postal" value={editingGuest.address} onChange={e => setEditingGuest({ ...editingGuest, address: e.target.value })} />
              <Input label="Acompañantes" type="number" min="0" value={editingGuest.companion} onChange={e => setEditingGuest({ ...editingGuest, companion: parseInt(e.target.value,10)||0 })} />
              <Input label="Mesa (número o apodo)" value={editingGuest.table} onChange={e => setEditingGuest({ ...editingGuest, table: e.target.value })} />
            </div>
            <div className="flex justify-between gap-2 pt-2">
              {editingGuest?.id && <Button variant="outline" className="text-red-600" onClick={() => { if(window.confirm('¿Eliminar invitado?')) { setGuests(prev=>prev.filter(g=>g.id!==editingGuest.id)); setModalOpen(false); } }}>Eliminar</Button>}
              <Button variant="outline" onClick={() => { setModalOpen(false); setEditingGuest(null); }}>Cancelar</Button>
              <Button onClick={handleSave}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------

export default Invitados;

// -----------------------------------------------------------

function InvitadosOld() {
  const sampleGuests = [
    { id: 1, name: 'Ana García', email: 'ana@example.com', phone: '123456789', rsvp: 'Sí', guests: 1, table: 5 },
    { id: 2, name: 'Luis Martínez', email: 'luis@example.com', phone: '987654321', rsvp: 'Pendiente', guests: 2, table: '' },
  ];
  const [guests, setGuests] = useState(sampleGuests);
  const [searchTerm, setSearchTerm] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const statuses = ['Pendiente', 'Sí', 'No'];
  const [selected, setSelected] = useState([]);
  const toggleSelectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map(g => g.id));
    }
  };

  // Importar invitados desde la API de Contactos del navegador móvil
  const importFromContacts = async () => {
    if (navigator.contacts && navigator.contacts.select) {
      try {
        const picked = await navigator.contacts.select(['name', 'tel', 'email'], { multiple: true });
        if (picked && picked.length) {
          setGuests(prev => {
            let nextId = prev.length ? Math.max(...prev.map(g => g.id)) + 1 : 1;
            const mapped = picked.map(c => ({
              id: nextId++,
              name: Array.isArray(c.name) ? c.name[0] : c.name || 'Invitado',
              email: Array.isArray(c.email) ? c.email[0] : c.email || '',
              phone: Array.isArray(c.tel) ? c.tel[0] : c.tel || '',
              rsvp: 'Pendiente',
              guests: 1,
              table: ''
            }));
            return [...prev, ...mapped];
          });
        }
      } catch (error) {
        console.error('Error importing contacts:', error);
      }
    }
  };

  const handleDelete = id => {
    setGuests(guests.filter(guest => guest.id !== id));
    setSelected(selected.filter(selectedId => selectedId !== id));
    if (window.confirm('¿Eliminar invitado?')) {
      setGuests(prev => prev.filter(g => g.id !== id));
      setSelected(prev => prev.filter(x => x !== id));
    }
  };
const getNextStatus = curr => {
  const idx = statuses.indexOf(curr);
  return statuses[(idx + 1) % statuses.length];
};
const sendBulkEmails = () => {
  const recipients = selected
    .map(id => guests.find(g => g.id === id)?.email)
    .filter(Boolean)
    .join(',');
  if (recipients) {
    window.open('mailto:' + recipients + '?subject=Recordatorio boda&body=¡Hola! Te esperamos en nuestra boda.');
  }
};
  const [showModal, setShowModal] = useState(false);
const initialGuest = { name: '', email: '', phone: '', rsvp: 'Pendiente', guests: 1, table: '' };
const [newGuest, setNewGuest] = useState(initialGuest);
const handleSaveGuest = () => {
  const newId = guests.length ? Math.max(...guests.map(g => g.id)) + 1 : 1;
  setGuests(prev => [...prev, { ...newGuest, id: newId }]);
  setNewGuest(initialGuest);
  setShowModal(false);
};

  const filtered = guests.filter(g => {
    return (
      (g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (rsvpFilter ? g.rsvp === rsvpFilter : true) &&
      (tableFilter ? String(g.table) === tableFilter : true)
    );
  });

  const toggleSelect = id => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800 mr-auto">Gestión de Invitados</h1>
        <div className="flex gap-2">
          <button onClick={importFromContacts} className="bg-green-600 text-white px-4 py-2 rounded flex items-center">
            <Phone size={16} className="mr-2" />Importar contactos
          </button>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center">
            <Plus size={16} className="mr-2" />Añadir Invitado
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center border rounded px-2 py-1">
          <Search size={16} className="mr-2 text-gray-600" />
          <input
            type="text"
            placeholder="Buscar por nombre o email"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="outline-none"
          />
        </div>
        <select value={rsvpFilter} onChange={e => setRsvpFilter(e.target.value)} className="border rounded px-2 py-1">
          <option value="">RSVP Todos</option>
          <option value="Sí">Sí</option>
          <option value="No">No</option>
          <option value="Pendiente">Pendiente</option>
        </select>
        <input
          type="number"
          placeholder="Mesa"
          value={tableFilter}
          onChange={e => setTableFilter(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <button className="bg-gray-200 px-3 py-1 rounded flex items-center">
          <RefreshCcw size={16} className="mr-1" />Limpiar
        </button>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-gray-100 p-2 rounded flex gap-2">
          <button onClick={sendBulkEmails} className="bg-green-600 text-white px-3 py-1 rounded">Enviar recordatorio ({selected.length})</button>
          <select className="border rounded px-2 py-1">
            <option>Asignar mesa</option>
            {[...new Set(filtered.map(g => g.table))].map(table => (
              <option key={table} value={table}>
                Mesa {table}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabla Escritorio */}
      <div className="hidden md:block overflow-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2"><input type="checkbox" aria-label="Seleccionar todos" onChange={toggleSelectAll} checked={filtered.length > 0 && selected.length === filtered.length} /></th>
              <th className="p-2">Nombre completo</th>
              <th className="p-2">Email</th>
              <th className="p-2">Teléfono</th>
              <th className="p-2">Estado RSVP</th>
              <th className="p-2">Nº acompañantes</th>
              <th className="p-2">Mesa</th>
               <th className="p-2">Invitar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => (
              <tr key={g.id} className="border-b">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(g.id)}
                    onChange={() => toggleSelect(g.id)}
                  />
                </td>
                <td className="p-2 flex items-center">
                  <User size={20} className="mr-2 text-gray-600" />
                  {g.name}
                </td>
                <td className="p-2">{g.email}</td>
                <td className="p-2">{g.phone}</td>
                <td className="p-2 cursor-pointer" onClick={() => setGuests(prev => prev.map(x => x.id === g.id ? { ...x, rsvp: getNextStatus(x.rsvp) } : x))}>{g.rsvp}</td>
                <td className="p-2 cursor-pointer">{g.guests}</td>
                <td className="p-2">{g.table || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Vista móvil */}
      <div className="block md:hidden space-y-4">
        {filtered.map(g => (
          <div key={g.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <User size={20} className="mr-2 text-gray-600" />
                <div>
                  <p className="font-semibold">{g.name}</p>
                  <p className="text-sm text-gray-600">{g.email}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow w-96">
            <h2 className="text-lg font-semibold mb-4">Añadir Invitado</h2>
            {/* Formulario Añadir Invitado */}
            <form onSubmit={e => { e.preventDefault(); handleSaveGuest(); }} className="space-y-3">
              <input
                type="text"
                placeholder="Nombre completo"
                value={newGuest.name}
                onChange={e => setNewGuest({ ...newGuest, name: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newGuest.email}
                onChange={e => setNewGuest({ ...newGuest, email: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={newGuest.phone}
                onChange={e => setNewGuest({ ...newGuest, phone: e.target.value })}
                className="w-full border rounded px-2 py-1"
              />
              <select
                value={newGuest.rsvp}
                onChange={e => setNewGuest({ ...newGuest, rsvp: e.target.value })}
                className="w-full border rounded px-2 py-1"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
              <input
                type="number"
                min="1"
                placeholder="Acompañantes"
                value={newGuest.guests}
                onChange={e => setNewGuest({ ...newGuest, guests: parseInt(e.target.value, 10) || 0 })}
                className="w-full border rounded px-2 py-1"
              />
              <input
                type="text"
                placeholder="Mesa"
                value={newGuest.table}
                onChange={e => setNewGuest({ ...newGuest, table: e.target.value })}
                className="w-full border rounded px-2 py-1"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
