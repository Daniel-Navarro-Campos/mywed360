import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from './useAuth';

/**
 * @typedef {Object} Provider
 * @property {string} id - ID único del proveedor
 * @property {string} name - Nombre del proveedor
 * @property {string} service - Tipo de servicio ofrecido
 * @property {string} contact - Nombre de la persona de contacto
 * @property {string} email - Email de contacto
 * @property {string} phone - Teléfono de contacto
 * @property {string} status - Estado actual (Nuevo, Contactado, Seleccionado, Confirmado, etc.)
 * @property {string} date - Fecha de contacto o cita
 * @property {number} rating - Puntuación media (0-5)
 * @property {number} ratingCount - Número de valoraciones
 * @property {string} [snippet] - Descripción corta
 * @property {string} [link] - Enlace a la web del proveedor
 * @property {string} [image] - URL de la imagen del proveedor
 */

/**
 * Hook personalizado para gestionar la lógica de los proveedores.
 * Proporciona funcionalidades para listar, filtrar, añadir, editar y eliminar proveedores,
 * así como para gestionar el estado de selección y filtrado.
 * 
 * @returns {Object} Objeto con estados y funciones para gestionar proveedores
 * @property {Provider[]} providers - Lista completa de proveedores
 * @property {Provider[]} filteredProviders - Lista de proveedores filtrada según criterios
 * @property {boolean} loading - Indica si hay una operación en curso
 * @property {string|null} error - Mensaje de error si existe
 * @property {Provider|null} selectedProvider - Proveedor actualmente seleccionado
 * @property {string[]} selectedProviderIds - IDs de proveedores seleccionados
 * @property {string} searchTerm - Término de búsqueda actual
 * @property {string} serviceFilter - Filtro por servicio
 * @property {string} statusFilter - Filtro por estado
 * @property {string} dateFrom - Filtro por fecha desde
 * @property {string} dateTo - Filtro por fecha hasta
 * @property {string} tab - Pestaña actual ('all', 'selected', 'contacted')
 * @property {Function} setSearchTerm - Actualizar término de búsqueda
 * @property {Function} setServiceFilter - Actualizar filtro por servicio
 * @property {Function} setStatusFilter - Actualizar filtro por estado
 * @property {Function} setDateFrom - Actualizar filtro por fecha desde
 * @property {Function} setDateTo - Actualizar filtro por fecha hasta
 * @property {Function} setTab - Cambiar pestaña actual
 * @property {Function} setSelectedProvider - Establecer proveedor seleccionado
 * @property {Function} loadProviders - Cargar proveedores desde la base de datos
 * @property {Function} addProvider - Añadir un nuevo proveedor
 * @property {Function} updateProvider - Actualizar un proveedor existente
 * @property {Function} deleteProvider - Eliminar un proveedor
 * @property {Function} toggleSelectProvider - Seleccionar/deseleccionar un proveedor
 * @property {Function} clearSelection - Limpiar selecciones
 * @property {Function} clearFilters - Limpiar todos los filtros
 */
export const useProveedores = () => {
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProviderIds, setSelectedProviderIds] = useState([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
    // Filtro de rating mínimo (0 = cualquiera)
    const [ratingMin, setRatingMin] = useState(0);
  const [tab, setTab] = useState('all'); // 'all', 'reserved', 'favorite'
  
  const { user } = useAuth();
  
  /**
   * Cargar proveedores desde Firestore
   */
  const loadProviders = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const proveedoresRef = collection(db, `usuarios/${user.uid}/proveedores`);
      const q = query(proveedoresRef, orderBy('created', 'desc'));
      const snapshot = await getDocs(q);
      
      const loadedProviders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date ? new Date(doc.data().date.toDate()).toISOString().split('T')[0] : ''
      }));
      
      setProviders(loadedProviders);
      applyFilters(loadedProviders);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar los proveedores:', err);
      setError('No se pudieron cargar los proveedores. Inténtalo de nuevo más tarde.');
      setLoading(false);
    }
  }, [user]);
  
  /**
   * Aplicar filtros a los proveedores
   */
  const applyFilters = useCallback((providersToFilter = providers) => {
    let filtered = [...providersToFilter];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTermLower) || 
        p.service?.toLowerCase().includes(searchTermLower) || 
        p.contact?.toLowerCase().includes(searchTermLower) ||
        p.status?.toLowerCase().includes(searchTermLower) ||
        p.snippet?.toLowerCase().includes(searchTermLower)
      );
    }
    
    // Aplicar filtro de servicio
    if (serviceFilter) {
      filtered = filtered.filter(p => p.service === serviceFilter);
    }
    
    // Aplicar filtro de estado
    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    // Aplicar filtro de fecha desde
    if (dateFrom) {
      filtered = filtered.filter(p => p.date >= dateFrom);
    }
    
    // Aplicar filtro de fecha hasta
    if (dateTo) {
      filtered = filtered.filter(p => p.date <= dateTo);
    }
    
    // Aplicar filtro de rating mínimo
    if (ratingMin > 0) {
      filtered = filtered.filter(p => p.rating >= ratingMin);
    }
    
    // Filtrar por pestaña
    if (tab === 'reserved') {
      filtered = filtered.filter(p => Array.isArray(p.reservations) && p.reservations.length);
    }
    if (tab === 'favorite') {
      filtered = filtered.filter(p => p.favorite);
    }
    
    setFilteredProviders(filtered);
  }, [providers, searchTerm, serviceFilter, statusFilter, dateFrom, dateTo, ratingMin, tab]);
  
  /**
   * Limpiar todos los filtros
   */
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setServiceFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setRatingMin(0);
    setTab('all');
  }, []);
  
  /**
   * Crear un nuevo proveedor
   */
  const addProvider = useCallback(async (providerData) => {
    if (!user) return null;
    
    try {
      const proveedoresRef = collection(db, `usuarios/${user.uid}/proveedores`);
      
      // Añadir campos de timestamp
      const providerWithTimestamp = {
        ...providerData,
        created: serverTimestamp(),
        updated: serverTimestamp(),
        date: providerData.date ? Timestamp.fromDate(new Date(providerData.date)) : null
      };
      
      const docRef = await addDoc(proveedoresRef, providerWithTimestamp);
      
      // Actualizar estado local
      const newProvider = {
        id: docRef.id,
        ...providerData,
        date: providerData.date || ''
      };
      
      setProviders(prev => [newProvider, ...prev]);
      applyFilters([newProvider, ...providers]);
      
      return newProvider;
    } catch (err) {
      console.error('Error al añadir proveedor:', err);
      setError('No se pudo añadir el proveedor. Inténtalo de nuevo más tarde.');
      return null;
    }
  }, [user, providers, applyFilters]);
  
  /**
   * Actualizar un proveedor existente
   */
  const updateProvider = useCallback(async (providerId, providerData) => {
    if (!user) return false;
    
    try {
      const providerRef = doc(db, `usuarios/${user.uid}/proveedores`, providerId);
      
      // Añadir campo de timestamp de actualización
      const providerWithTimestamp = {
        ...providerData,
        updated: serverTimestamp(),
        date: providerData.date ? Timestamp.fromDate(new Date(providerData.date)) : null
      };
      
      await updateDoc(providerRef, providerWithTimestamp);
      
      setError(null);
    } catch (err) {
      console.error('Error al actualizar proveedor:', err);
      setError('Error al actualizar el proveedor. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  /**
   * Eliminar un proveedor
   */
  /**
   * Añadir reserva a proveedor
   */
  const addReservation = useCallback(async (providerId, reservation) => {
    const provider = providers.find(p => p.id === providerId);
    if(!provider) return false;
    const newReservations = Array.isArray(provider.reservations) ? [...provider.reservations, reservation] : [reservation];
    // local update
    const updatedProvider = { ...provider, reservations: newReservations };
    setProviders(prev => prev.map(p => p.id===providerId ? updatedProvider : p));
    applyFilters(providers.map(p => p.id===providerId ? updatedProvider : p));
    // firestore update
    if(user){
      try{
        const providerRef = doc(db, `usuarios/${user.uid}/proveedores`, providerId);
        await updateDoc(providerRef, { reservations: newReservations, updated: serverTimestamp() });
      }catch(err){ console.error('Error al guardar reserva', err);}  }
    return true;
  }, [providers, user, applyFilters]);

  const deleteProvider = useCallback(async (providerId) => {
    if (!user) return false;
    
    try {
      const providerRef = doc(db, `usuarios/${user.uid}/proveedores`, providerId);
      await deleteDoc(providerRef);
      
      // Actualizar estado local
      setProviders(prev => prev.filter(p => p.id !== providerId));
      applyFilters(providers.filter(p => p.id !== providerId));
      
      // Si es el proveedor seleccionado, limpiarlo
      if (selectedProvider && selectedProvider.id === providerId) {
        setSelectedProvider(null);
      }
      
      // Eliminar de la lista de seleccionados si estaba allí
      setSelectedProviderIds(prev => prev.filter(id => id !== providerId));
      
      return true;
    } catch (err) {
      console.error('Error al eliminar proveedor:', err);
      setError('No se pudo eliminar el proveedor. Inténtalo de nuevo más tarde.');
      return false;
    }
  }, [user, providers, selectedProvider, applyFilters]);
  
  /**
   * Seleccionar/deseleccionar un proveedor de la lista
   */
  const toggleFavoriteProvider = useCallback(async (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    if(!provider) return;
    const newFav = !provider.favorite;
    // actualizar local
    setProviders(prev => prev.map(p => p.id===providerId ? {...p, favorite:newFav}:p));
    applyFilters(providers.map(p => p.id===providerId ? {...p, favorite:newFav}:p));
    // actualizar firestore
    if(user){
      try{
        const providerRef = doc(db, `usuarios/${user.uid}/proveedores`, providerId);
        await updateDoc(providerRef, { favorite: newFav, updated: serverTimestamp() });
      }catch(err){ console.error('Error al marcar favorito', err);}  }
  }, [providers, user, applyFilters]);

  const toggleSelectProvider = useCallback((providerId) => {
    setSelectedProviderIds(prev => {
      if (prev.includes(providerId)) {
        return prev.filter(id => id !== providerId);
      } else {
        return [...prev, providerId];
      }
    });
  }, []);
  
  /**
   * Limpiar todas las selecciones
   */
  const clearSelection = useCallback(() => {
    setSelectedProviderIds([]);
  }, []);
  
  // Cargar proveedores al iniciar
  useEffect(() => {
    if (user) {
      loadProviders();
    }
  }, [user, loadProviders]);
  
  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [searchTerm, serviceFilter, statusFilter, dateFrom, dateTo, ratingMin, tab, applyFilters]);
  
  return {
    // Estado
    providers,
    filteredProviders,
    loading,
    error,
    selectedProvider,
    selectedProviderIds,
    searchTerm,
    serviceFilter,
    statusFilter,
    dateFrom,
    dateTo,
    ratingMin,
    tab,

    // Setters
    setSearchTerm,
    setServiceFilter,
    setStatusFilter,
    setDateFrom,
    setDateTo,
    setRatingMin,
    setTab,
    setSelectedProvider,

    // Acciones
    loadProviders,
    addProvider,
    updateProvider,
    deleteProvider,
    addReservation,
    toggleSelectProvider,
    toggleFavoriteProvider,
    clearSelection,
    clearFilters
  };
};

export default useProveedores;
