import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWedding } from '../context/WeddingContext';
import useWeddingCollection from './useWeddingCollection';
import { saveData, loadData, subscribeSyncState, getSyncState } from '../services/SyncService';

/**
 * Hook personalizado para gestión optimizada de invitados
 * Centraliza toda la lógica de invitados con performance mejorada
 */
const useGuests = () => {
  const { activeWedding } = useWedding();
  
  // Datos de ejemplo para desarrollo
  const sampleGuests = useMemo(() => [
    { 
      id: 1, 
      name: 'Ana García', 
      email: 'ana@example.com',
      phone: '123456789', 
      address: 'Calle Sol 1', 
      companion: 1, 
      table: '5', 
      response: 'Sí',
      status: 'confirmed',
      dietaryRestrictions: '',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 2, 
      name: 'Luis Martínez', 
      email: 'luis@example.com',
      phone: '987654321', 
      address: 'Av. Luna 3', 
      companion: 0, 
      table: '', 
      response: 'Pendiente',
      status: 'pending',
      dietaryRestrictions: 'Vegetariano',
      notes: 'Llegará tarde a la ceremonia',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ], []);

  // Usar datos de ejemplo si no hay boda activa
  const fallbackGuests = activeWedding ? [] : sampleGuests;
  
  // Hook de colección con datos optimizados
  const { 
    data: guests, 
    addItem, 
    updateItem, 
    deleteItem,
    isLoading 
  } = useWeddingCollection('guests', activeWedding, fallbackGuests);

  // Estado de sincronización
  const [syncStatus, setSyncStatus] = useState(getSyncState());
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    table: ''
  });

  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);

  // Sincronización con localStorage para compatibilidad
  useEffect(() => {
    try {
      localStorage.setItem('lovendaGuests', JSON.stringify(guests));
      
      // Emitir evento para componentes que escuchan cambios
      window.dispatchEvent(new CustomEvent('lovenda-guests-updated', {
        detail: { guests, count: guests.length }
      }));
    } catch (error) {
      console.error('Error sincronizando invitados:', error);
    }
  }, [guests]);

  // Funciones utilitarias memoizadas
  const utils = useMemo(() => ({
    normalize: (str = '') => str.trim().toLowerCase(),
    phoneClean: (str = '') => str.replace(/\s+/g, '').replace(/[^0-9+]/g, ''),
    getStatusLabel: (guest) => {
      if (guest.status) {
        if (guest.status === 'confirmed') return 'Sí';
        if (guest.status === 'declined') return 'No';
        return 'Pendiente';
      }
      return guest.response || 'Pendiente';
    }
  }), []);

  // Estadísticas memoizadas
  const stats = useMemo(() => {
    const confirmed = guests.filter(g => 
      g.status === 'confirmed' || g.response === 'Sí'
    ).length;
    
    const pending = guests.filter(g => 
      g.status === 'pending' || g.response === 'Pendiente'
    ).length;
    
    const declined = guests.filter(g => 
      g.status === 'declined' || g.response === 'No'
    ).length;
    
    const totalCompanions = guests.reduce((sum, g) => 
      sum + (parseInt(g.companion, 10) || 0), 0
    );
    
    const withDietaryRestrictions = guests.filter(g => 
      g.dietaryRestrictions && g.dietaryRestrictions.trim()
    ).length;

    return {
      total: guests.length,
      confirmed,
      pending,
      declined,
      totalAttendees: confirmed + totalCompanions,
      withDietaryRestrictions
    };
  }, [guests]);

  // Funciones de gestión de invitados
  const addGuest = useCallback(async (guestData) => {
    try {
      const newGuest = {
        ...guestData,
        id: guestData.id || `guest-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addItem(newGuest);
      return { success: true, guest: newGuest };
    } catch (error) {
      console.error('Error añadiendo invitado:', error);
      return { success: false, error: error.message };
    }
  }, [addItem]);

  const updateGuest = useCallback(async (guestId, updates) => {
    try {
      const updatedGuest = {
        ...updates,
        id: guestId,
        updatedAt: new Date().toISOString()
      };
      
      await updateItem(guestId, updatedGuest);
      return { success: true, guest: updatedGuest };
    } catch (error) {
      console.error('Error actualizando invitado:', error);
      return { success: false, error: error.message };
    }
  }, [updateItem]);

  const removeGuest = useCallback(async (guestId) => {
    try {
      await deleteItem(guestId);
      return { success: true };
    } catch (error) {
      console.error('Error eliminando invitado:', error);
      return { success: false, error: error.message };
    }
  }, [deleteItem]);

  // Funciones de invitación
  const inviteViaWhatsApp = useCallback((guest) => {
    const phone = utils.phoneClean(guest.phone);
    if (!phone) {
      alert('El invitado no tiene número de teléfono');
      return;
    }
    
    const message = encodeURIComponent(
      `¡Hola ${guest.name}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?`
    );
    
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  }, [utils]);

  const inviteViaEmail = useCallback((guest) => {
    if (!guest.email) {
      alert('El invitado no tiene email');
      return;
    }
    
    const subject = encodeURIComponent('Invitación a nuestra boda');
    const body = encodeURIComponent(
      `Hola ${guest.name},\n\nNos complace invitarte a nuestra boda. Esperamos contar contigo.\n\nPor favor confirma tu asistencia.\n\n¡Gracias!`
    );
    
    window.open(`mailto:${guest.email}?subject=${subject}&body=${body}`, '_blank');
  }, []);

  const bulkInviteWhatsApp = useCallback(async () => {
    const guestsWithPhone = guests.filter(g => utils.phoneClean(g.phone));
    
    if (guestsWithPhone.length === 0) {
      alert('No hay invitados con número de teléfono');
      return;
    }
    
    if (!window.confirm(
      `Se abrirá WhatsApp en una pestaña por cada invitado (${guestsWithPhone.length} invitados). ¿Continuar?`
    )) {
      return;
    }
    
    for (const guest of guestsWithPhone) {
      try {
        // Generar enlace RSVP si hay API disponible
        let rsvpLink = '';
        try {
          const resp = await fetch(`/api/guests/id/${guest.id}/rsvp-link`, { 
            method: 'POST' 
          });
          if (resp.ok) {
            const { link } = await resp.json();
            rsvpLink = link;
          }
        } catch (err) {
          console.warn('No se pudo generar enlace RSVP:', err);
        }
        
        const message = rsvpLink 
          ? `¡Hola ${guest.name}! Estamos encantados de invitarte a nuestra boda. Por favor confirma tu asistencia aquí: ${rsvpLink}`
          : `¡Hola ${guest.name}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?`;
        
        const phone = utils.phoneClean(guest.phone);
        const encodedMessage = encodeURIComponent(message);
        
        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
        
        // Pequeña pausa entre invitaciones
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error invitando a ${guest.name}:`, error);
      }
    }
  }, [guests, utils]);

  // Funciones de importación/exportación
  const importFromContacts = useCallback(async () => {
    if (!navigator.contacts || !navigator.contacts.select) {
      alert('La API de contactos no está disponible en este navegador');
      return;
    }
    
    try {
      const contacts = await navigator.contacts.select(
        ['name', 'tel', 'email'], 
        { multiple: true }
      );
      
      const importedGuests = contacts.map(contact => ({
        id: `imported-${Date.now()}-${Math.random()}`,
        name: contact.name?.[0] || 'Sin nombre',
        email: contact.email?.[0] || '',
        phone: contact.tel?.[0] || '',
        address: '',
        companion: 0,
        table: '',
        response: 'Pendiente',
        status: 'pending',
        dietaryRestrictions: '',
        notes: 'Importado desde contactos',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      // Añadir todos los invitados importados
      for (const guest of importedGuests) {
        await addGuest(guest);
      }
      
      alert(`Se importaron ${importedGuests.length} contactos exitosamente`);
    } catch (error) {
      console.error('Error importando contactos:', error);
      alert('Error al importar contactos');
    }
  }, [addGuest]);

  const exportToCSV = useCallback(() => {
    if (guests.length === 0) {
      alert('No hay invitados para exportar');
      return;
    }
    
    const headers = [
      'Nombre', 'Email', 'Teléfono', 'Dirección', 'Estado', 
      'Mesa', 'Acompañantes', 'Restricciones Dietéticas', 'Notas'
    ];
    
    const csvContent = [
      headers.join(','),
      ...guests.map(guest => [
        `"${guest.name || ''}"`,
        `"${guest.email || ''}"`,
        `"${guest.phone || ''}"`,
        `"${guest.address || ''}"`,
        `"${utils.getStatusLabel(guest)}"`,
        `"${guest.table || ''}"`,
        guest.companion || 0,
        `"${guest.dietaryRestrictions || ''}"`,
        `"${guest.notes || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `invitados-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [guests, utils]);

  // Funciones de filtrado
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: '', table: '' });
  }, []);

  return {
    // Datos
    guests,
    stats,
    filters,
    syncStatus,
    isLoading,
    
    // Funciones de gestión
    addGuest,
    updateGuest,
    removeGuest,
    
    // Funciones de invitación
    inviteViaWhatsApp,
    inviteViaEmail,
    bulkInviteWhatsApp,
    
    // Funciones de importación/exportación
    importFromContacts,
    exportToCSV,
    
    // Funciones de filtrado
    updateFilters,
    clearFilters,
    
    // Utilidades
    utils
  };
};

export default useGuests;
