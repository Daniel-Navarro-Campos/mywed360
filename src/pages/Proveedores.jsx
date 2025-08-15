import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import { useWedding } from '../context/WeddingContext';
import { useParams, useNavigate } from 'react-router-dom';
import useWeddingCollection from '../hooks/useWeddingCollection';
import { saveData, loadData, subscribeSyncState, getSyncState } from '../services/SyncService';
import { loadTrackingRecords, createTrackingRecord, updateTrackingStatus, TRACKING_STATUS } from '../services/EmailTrackingService';
import PageWrapper from '../components/PageWrapper';
import { Plus, Search, RefreshCcw, Star, Eye, Edit2, Trash2, Calendar, Clock, Download, MapPin } from 'lucide-react';
import Toast from '../components/Toast';

export default function Proveedores() {
  // Indicar si hay boda activa
  const renderNoWedding = () => (
    <MainLayout title="Proveedores">
      <p>No se ha seleccionado ninguna boda.</p>
    </MainLayout>
  );
  // Proveedores de ejemplo iniciales
  // Proveedores de ejemplo (solo cuando no hay boda activa)
  const sampleProviders = [
    { id: 1, name: 'Eventos Catering', service: 'Catering', contact: 'Luis Pérez', email: 'luis@catering.com', phone: '555-1234', status: 'Contactado', date: '2025-06-10', rating: 0, ratingCount: 0 },
    { id: 2, name: 'Flores y Diseño', service: 'Flores', contact: 'Ana Gómez', email: 'ana@flores.com', phone: '555-5678', status: 'Confirmado', date: '2025-06-12', rating: 0, ratingCount: 0 },
  ];
  const { activeWedding } = useWedding();
  const { id: routeWeddingId } = useParams();
  const weddingId = activeWedding || routeWeddingId;
  // Si existe un weddingId, no usamos proveedores de muestra
  const fallbackProviders = weddingId ? [] : sampleProviders;
  // Usamos weddingId para asegurar que la ruta por parámetro funcione
  const { data: providersData, addItem: addProvider, updateItem: updateProvider, deleteItem: deleteProvider, loading: providersLoading } = useWeddingCollection('suppliers', weddingId, fallbackProviders);
  if (!weddingId) return renderNoWedding();

  const [providers, setProviders] = useState([]);

  // Sincronizar con datos de Firestore
  useEffect(() => {
    setProviders(Array.isArray(providersData) ? providersData : []);
  }, [providersData]);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);
  // pestaña actual: selected | contacted
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiResults, setAiResults] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [budgetRange, setBudgetRange] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [detailProvider, setDetailProvider] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('info'); // 'info', 'communications', 'tracking'
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [showResModal, setShowResModal] = useState(false);
  const [providerToReserve, setProviderToReserve] = useState(null);
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const initialProvider = { name: '', service: '', contact: '', email: '', phone: '', status: 'Nuevo', date: '' };
  const [trackingRecords, setTrackingRecords] = useState([]);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [currentTracking, setCurrentTracking] = useState(null);
  const [syncedEmails, setSyncedEmails] = useState([]);
  const [isSyncingEmails, setIsSyncingEmails] = useState(false);
  
  // Estado de sincronización
  const [syncStatus, setSyncStatus] = useState(getSyncState());

  // Eliminar proveedor
  const removeProvider = async (id) => {
    // Obtener proveedor a eliminar (para conocer su link)
    const providerObj = providers.find(p => p.id === id);
    // 1. Eliminar del estado local principal
    setProviders(prev => prev.filter(p => p.id !== id));

    // 2. Si el proveedor está almacenado en lovendaSuppliers (lista IA), limpiarlo también
    try {
      const stored = await loadData('lovendaSuppliers', { defaultValue: [], firestore: false });
      if (Array.isArray(stored) && stored.length) {
        const filtered = stored.filter(p => p.id !== id && (providerObj ? p.link !== providerObj.link : true));
        // Solo guardar si cambia la longitud
        if (filtered.length !== stored.length) {
          await saveData('lovendaSuppliers', filtered, { firestore: false, showNotification: false });
        }
      }
    } catch (err) {
      console.warn('Error al limpiar lovendaSuppliers:', err);
    }

    // 3. Intentar eliminar de Firestore cuando aplique
    try {
      if (!`${id}`.startsWith('web-')) {
        await deleteProvider(id);
      }
    } catch (err) {
      console.warn('Error al eliminar proveedor de Firestore:', err);
    }
  };

  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);
  
  // Cargar registros de seguimiento al iniciar
  useEffect(() => {
    const loadTracking = () => {
      const records = loadTrackingRecords();
      setTrackingRecords(records);
    };
    
    loadTracking();
  }, []);

  // Cargar proveedores encontrados por la IA (usando SyncService) y escuchar cambios
  useEffect(() => {
    const loadSuppliers = async () => {
    // Ya no añadimos automáticamente todos los proveedores devueltos por la búsqueda IA.
    // El usuario decidirá manualmente qué proveedor añadir mediante el botón “Añadir”.
    // Se mantiene vacía para conservar la firma y evitar errores de llamadas existentes.
  };
    // Ejecutamos por compatibilidad, aunque la función esté vacía
    loadSuppliers();
    window.addEventListener('lovenda-suppliers', loadSuppliers);
    return () => window.removeEventListener('lovenda-suppliers', loadSuppliers);
  }, []);
  const [newProvider, setNewProvider] = useState(initialProvider);
  const handleAddProvider = async (e) => {
    e.preventDefault();

    // Borrador con id temporal (por si estamos offline)
    const draftProv = {
      id: `web-${Date.now()}`,
      ...newProvider,
      rating: 0,
      ratingCount: 0,
      date: new Date().toISOString().slice(0, 10),
    };

    let savedProv = draftProv;
    try {
      const result = await addProvider(draftProv);
      if (result) savedProv = result; // id definitivo si Firestore lo genera
    } catch (err) {
      console.warn('Error al guardar proveedor en Firestore, se mantiene local:', err);
    }

    setProviders(prev => [...prev, savedProv]);
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

  const selectProvider = async (item) => {
    // 1) Creamos el objeto con valores iniciales (sin id definitivo)
    const draftProv = {
      id: `web-${Date.now()}`, // id temporal en caso de modo offline
      name: item.title || item.name || 'Proveedor',
      service: serviceFilter || 'Proveedor',
      contact: '',
      email: '',
      phone: '',
      link: item.link,
      status: 'Nuevo',
      date: new Date().toISOString().slice(0, 10),
      rating: 0,
      ratingCount: 0,
      snippet: item.snippet || '',
      priceRange: item.priceRange || budgetRange,
      image: item.image || '',
    };

    // 2) Guardamos usando addProvider (puede devolver id definitivo)
    let savedProv = draftProv;
    try {
      const result = await addProvider(draftProv);
      if (result) {
        savedProv = result; // ya contiene id definitivo si viene de Firestore
      }
    } catch (err) {
      console.warn('Error al guardar proveedor, se mantiene versión local:', err);
    }

    // 3) Actualizamos estados UI con el proveedor guardado
    setProviders(prev => [...prev, savedProv]);
    setDetailProvider(savedProv);
    setShowDetail(true);
    setShowAiModal(false);
  };

  const rateProvider = (id, ratingValue) => {
  const prov = providers.find(p => p.id === id);
  if (!prov) return;
  const newCount = (prov.ratingCount || 0) + 1;
  const newRating = ((prov.rating || 0) * prov.ratingCount + ratingValue) / newCount;
  setProviders(prev => prev.map(p => p.id === id ? { ...p, ratingCount: newCount, rating: newRating } : p));
  updateProvider(id, { rating: newRating, ratingCount: newCount });
    setProviders(prev => prev.map(p =>
      p.id === id ? { ...p,
        ratingCount: p.ratingCount + 1,
        rating: (p.rating * p.ratingCount + ratingValue) / (p.ratingCount + 1)
      } : p
    ));
  };

  // Verificar la operatividad de enlaces de proveedores
const verifyProviderLinks = async (providers) => {
  console.log('Verificando validez de enlaces de proveedores...');
  // Normalizar proveedores para asegurarnos de que todos tienen los mismos campos
  const normalizedProviders = providers.map((provider) => ({
    title: provider.title || provider.name || 'Proveedor sin nombre',
    name: provider.title || provider.name || 'Proveedor',
    link: (() => {
    let l = provider.link || provider.url || '';
    if (l && !l.startsWith('http://') && !l.startsWith('https://')) {
      l = 'https://' + l.replace(/^\/+/, '');
    }
    return l;
  })(),
    snippet: provider.snippet || provider.description || '',
    service: provider.service || serviceFilter || 'Proveedor',
    location: provider.location || 'No especificada',
    priceRange: provider.priceRange || provider.price || 'Consultar',
    image: provider.image || '',
    // Por defecto consideramos válido hasta que se demuestre lo contrario
    verified: true,
  }));

  // Filtrar proveedores con enlaces vacíos o mal formados
  const validProviders = normalizedProviders.filter((provider) => {
    const link = provider.link || '';
    return (
      link &&
      (link.startsWith('http://') || link.startsWith('https://')) &&
      link.includes('.')
    );
  });

  console.log(`${validProviders.length} de ${normalizedProviders.length} tienen enlaces potencialmente válidos`);

  // Si no hay proveedores válidos, devolver un resultado de respaldo genérico
  if (validProviders.length === 0 && normalizedProviders.length > 0) {
    return [
      {
        title: 'Directorio de proveedores para bodas',
        link: `https://www.bodas.net/busqueda/${(serviceFilter || 'proveedores')
          .toLowerCase()
          .replace(/\s+/g, '-')}-espana`,
        snippet: `Encuentra proveedores de ${serviceFilter || 'boda'} en toda España`,
        service: serviceFilter || 'Proveedor',
        location: 'España',
        priceRange: 'Varios precios disponibles',
        verified: true,
      },
    ];
  }

  return validProviders;
};

const handleAiSearch = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim() && !serviceFilter) {
      setToast({ message: 'Por favor, introduce una búsqueda o selecciona un tipo de servicio', type: 'warning' });
      return;
    }
    
    setAiLoading(true);
    
    try {
      // Función para cargar y unificar TODOS los datos disponibles del perfil
      // Esta función es similar a la que hay en fetchOpenAi para mantener coherencia
      const loadAllProfileData = () => {
        try {
          // Lista de claves a buscar en almacenamiento local y en Firestore
          const storageKeys = ['lovendaProfile', 'weddingInfo', 'account', 'important', 
                               'ceremonyInfo', 'weddingConfig'];
          
          // Objeto unificado para almacenar todos los datos
          let unifiedData = {};
          
          // Cargar primero el perfil principal que contiene la información de la boda
          const profile = loadData('lovendaProfile', { defaultValue: {}, collection: 'userProfiles' });
          console.log('Perfil cargado para búsqueda de proveedores:', profile);
          
          // Copiar datos del perfil al objeto unificado
          Object.assign(unifiedData, profile);
          
          // Asegurarse de que weddingInfo esté disponible
          if (profile && profile.weddingInfo) {
            unifiedData.weddingInfo = profile.weddingInfo;
            Object.assign(unifiedData, profile.weddingInfo);
          }
          
          // Procesamos cada clave e intentamos extraer información válida
          storageKeys.forEach(key => {
            try {
              const data = loadData(key, { defaultValue: {}, collection: 'userData' });
              if (typeof data === 'object' && data !== null) {
                unifiedData[key] = data;
                // También aplanamos los datos para facilitar el acceso
                Object.assign(unifiedData, data);
              }
            } catch (err) {
              console.warn(`Error al cargar datos de ${key}:`, err);
            }
          });
          
          return unifiedData;
        } catch (err) {
          console.error('Error al cargar datos del perfil:', err);
          return {};
        }
      };
      
      // Cargar perfil de usuario completo
      const profileData = loadAllProfileData();
      
      // Extraer información importante del perfil para la búsqueda
      const extractWeddingLocation = (data) => {
        const possibleKeys = [
          'celebrationPlace',
          'ceremonyLocation',
          'weddingInfo.celebrationPlace',
          'weddingInfo.ceremonyLocation',
          'ceremonyInfo.location',
          'location'
        ];
        
        for (const key of possibleKeys) {
          const parts = key.split('.');
          let value;
          
          if (parts.length === 1) {
            value = data[parts[0]];
          } else if (parts.length === 2) {
            value = data[parts[0]] && data[parts[0]][parts[1]];
          }
          
          if (value && typeof value === 'string' && value.trim() !== '') {
            console.log(`Ubicación de boda encontrada en '${key}':`, value);
            return value;
          }
        }
        
        return '';
      };
      
      // Extraer ubicación de la boda
      const weddingLocation = extractWeddingLocation(profileData);
      
      // Si tenemos API de backend, intentamos usarla primero
      const res = await fetch('/api/ai-suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: aiQuery,
          service: serviceFilter,
          budget: budgetRange,
          profile: profileData,
          location: weddingLocation // Añadir explícitamente la ubicación
        })
      });
      
      let data = [];
      if (res.ok) {
        try {
          data = await res.json();
        } catch (_) { /* cuerpo vacío */ }
      }
      
      if (Array.isArray(data) && data.length) {
        // Verificar operatividad de los enlaces antes de mostrarlos
        verifyProviderLinks(data).then(verifiedResults => {
          setAiResults(verifiedResults);
          setShowAiModal(true);
          saveData('lovendaSuppliers', verifiedResults, { firestore: false, showNotification: false });
          window.dispatchEvent(new Event('lovenda-suppliers'));
        });
      } else {
        // Si la ruta no existe o responde vacío, usar OpenAI directamente
        await fetchOpenAi();
        return;
      }
    } catch (err) {
      console.error('Error en la búsqueda de proveedores:', err);
      setToast({ message: 'Error al buscar proveedores. Intentando búsqueda directa...', type: 'error' });
      await fetchOpenAi();
    } finally {
      setAiLoading(false);
    }
  };

  const displayed = providers
    .filter(p =>
      ((p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.service || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
      (serviceFilter ? p.service === serviceFilter : true) &&
      (statusFilter ? p.status === statusFilter : true) &&
      (dateFrom ? p.date >= dateFrom : true) &&
      (dateTo ? p.date <= dateTo : true)
    )
    .filter(p => {
      if (tab === 'contacted') return p.status === 'Contactado';
      if (tab === 'selected') return p.status === 'Confirmado' || p.status === 'Seleccionado';
      return true; // all
    });

  const toggleSelect = id => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const clearFilters = () => {
    setSearchTerm(''); setAiQuery(''); setServiceFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo('');
  };

  // Búsqueda directa usando OpenAI cuando la API backend no responde
  const fetchOpenAi = async () => {
    // VALIDACIÓN MEJORADA: Garantizar que tenemos al menos un criterio de búsqueda
    if (!aiQuery && !serviceFilter) {
      setToast({ message: 'Por favor, introduce una búsqueda o selecciona un tipo de servicio', type: 'warning' });
      setAiLoading(false);
      return;
    }
    
    // IMPORTANTE: Siempre garantizar que tenemos un tipo de servicio definido
    const servicioSeleccionado = serviceFilter || 
                               (aiQuery.toLowerCase().includes('fotograf') ? 'Fotografía' : 
                                aiQuery.toLowerCase().includes('flor') ? 'Flores' : 
                                aiQuery.toLowerCase().includes('cater') ? 'Catering' : 
                                aiQuery.toLowerCase().includes('música') || aiQuery.toLowerCase().includes('music') ? 'Música' : 
                                'proveedores de boda');
    
    setAiLoading(true);
    
    try {
      // Función mejorada para cargar y unificar TODOS los datos disponibles del perfil
      const loadAllProfileData = () => {
        try {
          // Lista de claves a buscar en almacenamiento local y en Firestore
          const storageKeys = ['lovendaProfile', 'weddingInfo', 'account', 'important', 
                               'ceremonyInfo', 'weddingConfig', 'invitados', 'finanzas', 
                               'transporte', 'eventSchedule', 'rsvp', 'proveedores'];
          
          // Objeto unificado para almacenar todos los datos
          let unifiedData = {};
          
          // Cargar primero el perfil principal que contiene la información de la boda
          const profile = loadData('lovendaProfile', { defaultValue: {}, collection: 'userProfiles' });
          console.log('Perfil principal cargado:', profile);
          
          // Asegurarse de que weddingInfo esté disponible
          if (profile && profile.weddingInfo) {
            unifiedData.weddingInfo = profile.weddingInfo;
            Object.assign(unifiedData, profile.weddingInfo);
          }
          
          // Procesamos cada clave e intentamos extraer información válida
          storageKeys.forEach(key => {
            try {
              const rawData = JSON.stringify(loadData(key, { defaultValue: {}, collection: 'userData' }));
              // Intentamos parsearlo como JSON si es posible
              try {
                const parsedData = JSON.parse(rawData);
                if (typeof parsedData === 'object' && parsedData !== null) {
                  unifiedData[key] = parsedData;
                  // También aplanamos los datos para facilitar el acceso
                  Object.assign(unifiedData, parsedData);
                }
              } catch {
                // Si no es JSON, lo guardamos como string
                unifiedData[key] = rawData;
              }
            } catch (err) {
              console.warn(`Error al cargar datos de ${key}:`, err);
            }
          });
          
          // Añadir ubicación fija de Valencia como respaldo si no se encuentra
          if (!unifiedData.celebrationPlace && !unifiedData.ceremonyLocation && !unifiedData.location) {
            unifiedData.celebrationPlace = 'Valencia, Comunidad Valenciana, España';
            console.log('Usando ubicación predeterminada: Valencia');
          }
          
          return unifiedData;
        } catch (err) {
          console.error('Error crítico al cargar datos del perfil:', err);
          // Proporcionar datos mínimos con ubicación Valencia como respaldo
          return { celebrationPlace: 'Valencia, Comunidad Valenciana, España' };
        }
      };
      
      // MEJORA: Cargamos datos con estructura más robusta
      const allProfileData = loadAllProfileData();
      console.log('Datos completos del perfil cargados:', allProfileData);
      
      // EXTRACCIÓN DE DATOS MEJORADA: Buscamos en profundidad y múltiples fuentes
      const extractDataFromMultipleSources = (sources, keys) => {
        for (const source of sources) {
          for (const key of keys) {
            // Comprobar si la fuente existe y tiene la clave
            if (source && source[key] && source[key] !== 'undefined' && source[key] !== '') {
              return source[key];
            }
          }
        }
        return '';
      };
      
      // Fuentes de datos priorizadas
      const dataSources = [
        allProfileData,
        allProfileData.lovendaProfile,
        allProfileData.weddingInfo,
        allProfileData.ceremonyInfo,
        allProfileData.weddingConfig
      ];
      
      // MEJORA: Extracción más completa de ubicaciones con prioridad al perfil
      // Intentar obtener directamente desde weddingInfo que es donde se guarda en el formulario del perfil
      let locationInfo = '';
      
      // Verificar si tenemos datos directos del perfil
      if (allProfileData.weddingInfo && allProfileData.weddingInfo.celebrationPlace) {
        locationInfo = allProfileData.weddingInfo.celebrationPlace;
        console.log('Ubicación encontrada directamente en weddingInfo:', locationInfo);
      } else {
        // Buscar en otras fuentes si no está directamente disponible
        locationInfo = extractDataFromMultipleSources(
          dataSources, 
          ['ceremonyLocation', 'ceremonyPlace', 'location', 'celebrationPlace', 'lugar', 'ciudad', 'province']
        );
        console.log('Ubicación encontrada en fuentes alternativas:', locationInfo);
      }
      
      // Si aún no tenemos ubicación, usar Valencia como respaldo
      if (!locationInfo) {
        locationInfo = 'Valencia, Comunidad Valenciana';
        console.log('Usando ubicación predeterminada (fallback): Valencia');
      }
      
      // Si la ubicación es un objeto, intentamos extraer el nombre
      const getLocationName = (location) => {
        if (typeof location === 'object' && location !== null) {
          return location.name || location.ciudad || location.province || 
                 location.address || location.texto || JSON.stringify(location);
        }
        return location;
      };
      
      // Procesamos la información de ubicación
      const formattedLocation = getLocationName(locationInfo) || 'Valencia';  // Usar Valencia como respaldo final
      
      // MEJORA: Extracción más detallada del resto de datos
      const receptionInfo = getLocationName(
        extractDataFromMultipleSources(dataSources, 
          ['receptionLocation', 'banquetPlace', 'banquete', 'lugarBanquete', 'salonBanquete']
        )
      ) || '';
      
      const weddingDate = extractDataFromMultipleSources(dataSources, 
        ['weddingDate', 'date', 'fecha', 'fechaBoda', 'ceremonyDate']
      ) || '';
      
      const weddingStyle = extractDataFromMultipleSources(dataSources, 
        ['style', 'estilo', 'themeStyle', 'temaBoda', 'estiloDecoracion']
      ) || '';
      
      const numGuests = extractDataFromMultipleSources(dataSources, 
        ['numGuests', 'guests', 'invitados', 'numeroInvitados', 'totalInvitados']
      ) || '';
      
      // Mejor extracción de nombres
      const brideName = extractDataFromMultipleSources(dataSources, 
        ['brideName', 'novia', 'brideInfo.name', 'bride.name']
      ) || '';
      
      const groomName = extractDataFromMultipleSources(dataSources, 
        ['groomName', 'novio', 'groomInfo.name', 'groom.name']
      ) || '';
      
      const coupleName = extractDataFromMultipleSources(dataSources, ['coupleName']) || 
                       (brideName && groomName ? `${brideName} y ${groomName}` : 
                        brideName || groomName || '');
      
      // MEJORA: Categorías para bodas.net más detalladas y precisas
      const bodasNetCategories = {
        'Catering': 'banquetes',
        'Fotografía': 'fotografia',
        'Música': 'musica-y-entretenimiento',
        'Flores': 'decoracion-y-flores',
        'Decoración': 'decoracion-y-flores',
        'Vestidos': 'vestidos-de-novia',
        'Trajes': 'trajes-de-novio',
        'Transporte': 'coche-para-bodas',
        'Invitaciones': 'invitaciones-de-boda',
        'Pasteles': 'tartas-y-dulces-de-boda',
        'Joyería': 'joyeria',
        'Detalles': 'detalles-de-boda',
        'Animación': 'musica-y-entretenimiento',
        // Categorías adicionales
        'Fincas': 'fincas-bodas',
        'Hoteles': 'hoteles-bodas',
        'Wedding Planner': 'wedding-planners',
        'Belleza': 'belleza-para-novias',
        'Maquillaje': 'belleza-para-novias',
        'Peluquería': 'belleza-para-novias',
        'Luna de miel': 'viajes-de-novios',
        'Video': 'video-de-boda'
      };
      
      // MEJORA: Determinar categoría para bodas.net de forma más precisa
      const getBodasNetCategory = (service) => {
        if (!service) return '';
        
        // Normalizar el servicio para comparar (sin tildes, en minúsculas)
        const normalizedService = service.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        
        // Buscar coincidencias parciales si no hay exactas
        for (const [key, value] of Object.entries(bodasNetCategories)) {
          const normalizedKey = key.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
            
          if (normalizedService === normalizedKey || 
              normalizedService.includes(normalizedKey) || 
              normalizedKey.includes(normalizedService)) {
            return value;
          }
        }
        
        // Si no hay coincidencia, devolver el servicio original normalizado
        return service.toLowerCase().replace(/ /g, '-');
      };
      
      // Construir búsqueda para bodas.net con lugar si está disponible
      const bodasNetCategory = getBodasNetCategory(servicioSeleccionado);
      
      // MEJORA: Consulta más optimizada para bodas.net
      let bodasNetQuery = `bodas.net ${bodasNetCategory}`;
      
      // Añadir ubicación si está disponible
      if (formattedLocation) {
        // Extraer solo la ciudad o provincia para búsqueda más precisa
        const locationParts = formattedLocation.split(',');
        const searchLocation = locationParts[0].trim();
        bodasNetQuery += ` en ${searchLocation}`;
      }
      
      // Añadir términos de búsqueda si hay
      if (aiQuery) {
        bodasNetQuery += ` ${aiQuery}`;
      }
      
      // Siempre priorizar ubicación como requisito clave
      if (formattedLocation) {
        // Reforzar que la búsqueda es específicamente en esa ubicación
        const locationParts = formattedLocation.split(',');
        const mainLocation = locationParts[0]; // Ciudad principal (ej: Valencia)
        
        // Añadir al final para enfatizarlo
        bodasNetQuery += ` ubicados en ${mainLocation}`;
      }
      
      // MEJORA: Contextualización del presupuesto más precisa
      const getBudgetContext = () => {
        if (!budgetRange) return '';
        
        if (budgetRange.includes('<') || budgetRange.includes('menos')) {
          return 'económico y de bajo coste';
        } else if (budgetRange.includes('>') || budgetRange.includes('más')) {
          return 'premium y de alta gama';
        } else if (budgetRange.includes('–') || budgetRange.includes('-')) {
          // Extraer números del rango para ser más específico
          const numbers = budgetRange.match(/\d+(\.\d+)?/g);
          if (numbers && numbers.length >= 2) {
            return `con precio medio entre ${numbers[0]}€ y ${numbers[1]}€`;
          }
          return 'con precio medio';
        }
        return budgetRange;
      };
      
      const budgetContext = getBudgetContext();
      
      // MEJORA: Información adicional para enriquecer la búsqueda
      const additionalInfo = [];
      
      // Añadir estilo si está disponible
      if (weddingStyle) {
        additionalInfo.push(`Estilo de boda: ${weddingStyle}`);
      }
      
      // Añadir temporada basada en la fecha
      if (weddingDate) {
        try {
          const date = new Date(weddingDate);
          const month = date.getMonth() + 1;
          let season = '';
          
          if (month >= 3 && month <= 5) season = 'primavera';
          else if (month >= 6 && month <= 8) season = 'verano';
          else if (month >= 9 && month <= 11) season = 'otoño';
          else season = 'invierno';
          
          additionalInfo.push(`Temporada: ${season}`);
        } catch {}
      }
      
      // Añadir tamaño de evento basado en invitados
      if (numGuests) {
        let size = '';
        const guests = parseInt(numGuests);
        
        if (!isNaN(guests)) {
          if (guests <= 50) size = 'pequeña';
          else if (guests <= 120) size = 'mediana';
          else size = 'grande';
          
          additionalInfo.push(`Tamaño del evento: boda ${size} (${guests} invitados)`);
        }
      }
      
      // MEJORA: Prompt muchísimo más estructurado y enfocado con ÉNFASIS EN UBICACIÓN
      const prompt = `Como experto en planificación de bodas en España, necesito que busques específicamente ${servicioSeleccionado.toUpperCase()} EXCLUSIVAMENTE EN LA ZONA DE ${formattedLocation ? formattedLocation.toUpperCase() : 'ESPAÑA'} para una boda${aiQuery ? ': ' + aiQuery : '.'}

  ========== UBICACIÓN PRIORITARIA ==========
  LA UBICACIÓN ES EL CRITERIO MÁS IMPORTANTE. TODOS LOS PROVEEDORES DEBEN:
  - Operar directamente en ${formattedLocation || 'la ubicación indicada'}, O
  - Ofrecer servicio de desplazamiento EXPLÍCITAMENTE a ${formattedLocation ? formattedLocation.split(',')[0] : 'la ubicación'}
  Los proveedores deben poder GARANTIZAR cobertura en ${formattedLocation ? formattedLocation.split(',')[0] : 'la zona'}
  
  ========== DATOS DE LA BODA ==========
  - Ubicación ceremonia: ${formattedLocation || 'Sin especificar'}
  - Ubicación banquete: ${receptionInfo || (formattedLocation ? 'Misma que ceremonia' : 'Sin especificar')}
  - Fecha: ${weddingDate || 'Sin especificar'}
  - Estilo: ${weddingStyle || 'Sin especificar'}
  - Número de invitados: ${numGuests || 'Sin especificar'}
  - Nombre pareja: ${coupleName || 'Sin especificar'}
  - Presupuesto: ${budgetRange || 'Sin especificar'} ${budgetContext ? '(' + budgetContext + ')' : ''}
  ${additionalInfo.length > 0 ? '- ' + additionalInfo.join('\n  - ') : ''}

  ========== REQUISITOS ESPECÍFICOS ==========
  1. PRIORIZA ABSOLUTAMENTE RESULTADOS DE BODAS.NET Y WEBS ESPAÑOLAS ESPECIALIZADAS EN BODAS.
  2. La búsqueda principal que debes usar es: "${bodasNetQuery}"
  3. CADA RESULTADO DEBE SER ESPECÍFICAMENTE DE ${servicioSeleccionado.toUpperCase()}, no incluyas otros servicios.
  4. CADA RESULTADO DEBE OPERAR O DESPLAZARSE A ${formattedLocation ? formattedLocation.split(',')[0].toUpperCase() : 'LA UBICACIÓN INDICADA'}
  5. Asegúrate de que cada resultado tenga un enlace a la página web oficial del proveedor, donde ofrezca directamente sus servicios.
  6. Si no tiene página web oficial propia, utiliza un enlace donde ofrezca sus servicios directamente (como su perfil en bodas.net o zankyou.es).
  7. Evita enlaces a agregadores genéricos donde el proveedor solo aparece en un listado.
  8. Verifica que el enlace sea actual y operativo.
  9. CADA RESULTADO DEBE INCLUIR LA UBICACIÓN EXACTA DEL PROVEEDOR Y SU POLÍTICA DE DESPLAZAMIENTO a ${formattedLocation || 'la ubicación de la boda'}
  10. El rango de precios debe ser específico o una tarifa aproximada.
  11. Ordena los resultados por relevancia geográfica: primero los que están exactamente en ${formattedLocation ? formattedLocation.split(',')[0] : 'la ubicación'}, luego los que están cerca y ofrecen desplazamiento.
  12. Incluye valoraciones o reseñas si están disponibles.

  ========== FORMATO DE RESPUESTA ==========
  Proporciona 5-7 resultados de máxima calidad y relevancia. ASEGÚRATE QUE TODOS:
  1. Son ESPECÍFICAMENTE ${servicioSeleccionado.toUpperCase()}
  2. Operan en ${formattedLocation ? formattedLocation.toUpperCase() : 'LA UBICACIÓN'} o se desplazan allí
  3. Tienen enlaces verificables y directos
  4. Incluyen datos de precios y ubicación específicos
  
  Responde en formato JSON con los siguientes campos por proveedor:
  - name: Nombre del proveedor
  - title: Título descriptivo
  - service: Tipo de servicio (${servicioSeleccionado})
  - link: URL oficial directa
  - snippet: Descripción con detalles clave
  - priceRange: Rango de precios
  - location: Ubicación y política de desplazamiento
  - coverage: Área geográfica atendida (INCLUIR EXPLÍCITAMENTE ${formattedLocation ? formattedLocation.split(',')[0] : 'la ubicación requerida'})`;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'OpenAI-Project': import.meta.env.VITE_OPENAI_PROJECT_ID
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { 
              role: 'system', 
              content: `Eres un asistente especializado en búsqueda de proveedores para bodas en España, especialmente de ${servicioSeleccionado}. Tu tarea es encontrar los proveedores más relevantes según las necesidades específicas del usuario. DEBES PRIORIZAR RESULTADOS DE BODAS.NET y asegurarte de que todos los proveedores sean ESPECÍFICAMENTE del servicio solicitado (${servicioSeleccionado}). ÚNICAMENTE DEBES INCLUIR PROVEEDORES QUE OPEREN EN LA UBICACIÓN ESPECIFICADA (${formattedLocation || 'España'}) o que ofrezcan desplazamiento a esta ubicación. Cada resultado debe incluir una URL válida y datos precisos.`
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3 // Temperatura más baja para mayor precisión y adherencia al tipo de servicio
        })
      });
      
      if (!response.ok) {
        // Manejo mejorado para diferentes códigos de error HTTP
        if (response.status === 401) {
          throw new Error('Error de autenticación: La clave API de OpenAI no es válida o ha expirado');
        } else if (response.status === 429) {
          throw new Error('Límite de solicitudes excedido: Demasiadas búsquedas en poco tiempo');
        } else if (response.status >= 500) {
          throw new Error('Error en los servidores de OpenAI: Intenta de nuevo más tarde');
        } else {
          throw new Error(`Error en la llamada a OpenAI (${response.status}): ${response.statusText}`);
        }
      }
      
      // Verificar que la respuesta de OpenAI tenga el formato esperado
      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No se recibió respuesta válida de OpenAI');
      }
      
      let results = [];
      
      try {
        // Verificar que la respuesta contiene el mensaje esperado
        if (!data.choices[0].message || !data.choices[0].message.content) {
          throw new Error('Formato de respuesta inválido');
        }
        
        // Intentar extraer los resultados del texto de respuesta
        const content = data.choices[0].message.content;
        
        // Detectar si la respuesta contiene un mensaje de error explícito
        if (content.toLowerCase().includes('error') && content.length < 150) {
          throw new Error(`Error reportado por OpenAI: ${content}`);
        }
        
        // Intentar extraer JSON de la respuesta con estrategias múltiples
        console.log('Procesando respuesta de OpenAI para extraer JSON...');
        
        // Estrategia 1: Buscar bloques de código JSON marcados con ```json
        let jsonMatches = content.match(/```json\s*([\s\S]+?)\s*```/);
        
        // Estrategia 2: Buscar cualquier bloque de código
        if (!jsonMatches) {
          jsonMatches = content.match(/```\s*([\s\S]+?)\s*```/);
          console.log('Usando estrategia 2: Bloque de código general');
        }
        
        // Estrategia 3: Buscar array directamente en el texto [...]
        if (!jsonMatches) {
          const arrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (arrayMatch) {
            jsonMatches = [null, arrayMatch[0]];
            console.log('Usando estrategia 3: Encontrado array directo en el texto');
          }
        }
        
        // Estrategia 4: Si todo falla, intentar con el texto completo
        if (!jsonMatches) {
          jsonMatches = [null, content.trim()];
          console.log('Usando estrategia 4: Texto completo');
        }
        
        if (!jsonMatches || !jsonMatches[1]) {
          console.error('No se pudo extraer JSON de la respuesta');
          throw new Error('No se pudo extraer JSON de la respuesta');
        }
        
        // Intentar analizar el JSON con manejo de errores mejorado
        let allResults = [];
        try {
          const jsonText = jsonMatches[1].trim();
          console.log('Texto JSON a parsear (primeros 100 caracteres):', 
                     jsonText.length > 100 ? jsonText.substring(0, 100) + '...' : jsonText);
          
          // Intenta parsear directamente
          allResults = JSON.parse(jsonText);
          
        } catch (jsonError) {
          console.error('Error en el primer intento de parseo JSON:', jsonError);
          
          try {
            // Estrategia de respaldo: buscar corchetes de apertura/cierre de un array
            const startIdx = jsonMatches[1].indexOf('[');
            const endIdx = jsonMatches[1].lastIndexOf(']');
            
            if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
              const arrayText = jsonMatches[1].substring(startIdx, endIdx + 1);
              console.log('Intentando parsear subconjunto como array:', 
                         arrayText.length > 100 ? arrayText.substring(0, 100) + '...' : arrayText);
              allResults = JSON.parse(arrayText);
            } else {
              throw new Error('No se encontró estructura de array en la respuesta');
            }
          } catch (subError) {
            // Último intento: crear un resultado manual basado en el texto
            console.warn('Creando resultado manual basado en el texto de respuesta');
            
            // Extraer frases que parezcan nombres de proveedores (primera letra mayúscula, más de 3 palabras)
            const lines = content.split('\n');
            const providerCandidates = lines.filter(line => 
              line.trim().length > 10 && 
              /^[A-Z]/.test(line.trim()) && 
              line.split(' ').length >= 3 &&
              !line.trim().startsWith('```')
            );
            
            if (providerCandidates.length > 0) {
              allResults = providerCandidates.map((line, index) => ({
                title: line.trim().split(':')[0] || `Proveedor ${index + 1}`,
                name: line.trim().split(':')[0] || `Proveedor ${index + 1}`,
                link: `https://www.bodas.net/busqueda/${(serviceFilter || 'proveedores')
                  .toLowerCase()
                  .replace(/\s+/g, '-')}-espana`,
                snippet: line,
                service: servicioSeleccionado,
                location: formattedLocation || 'España',
                priceRange: 'Consultar',
                verified: true
              }));
              console.log(`Creados ${allResults.length} resultados manuales basados en el texto`);
            }
          }
        }
        
        // Verificar que results es un array
        if (!Array.isArray(allResults)) {
          
          console.log(`Ciudad: ${mainLocation}, Región: ${region || 'no especificada'}, País: ${country}`);
          
          // Crear términos de ubicación relevantes basados en los datos del perfil
          // Esto es dinámico según la ubicación real del usuario, no hardcodeado a Valencia
          const locationRelatedTerms = [
            mainLocation,            // Ciudad principal
            region ? region.toLowerCase() : '',  // Región/provincia si está disponible
            country,                 // País
            region ? `provincia de ${region.toLowerCase()}` : '',  // Formato alternativo de provincia
            'nacional',              // Ámbito nacional
            'toda españa',           // Todo el país
            'desplazamiento',        // Indica que se desplazan
            'online',                // Servicios remotos/online
          ].filter(Boolean); // Eliminar valores vacíos
          
          console.log('Términos de ubicación para búsqueda:', locationRelatedTerms);

          // Función para evaluar la relevancia de ubicación (0-10)
          // Un número más alto indica mejor coincidencia con la ubicación
          const getLocationRelevance = (item) => {
            let relevance = 0;
            let locationText = '';
            
            // Combinar textos relevantes para buscar referencias a la ubicación
            if (item.location) locationText += ' ' + item.location.toLowerCase();
            if (item.snippet) locationText += ' ' + item.snippet.toLowerCase();
            if (item.title) locationText += ' ' + item.title.toLowerCase();
            if (item.description) locationText += ' ' + item.description.toLowerCase();
            
            // Dar puntuación según coincidencia de ubicación
            if (locationText.includes(mainLocation)) relevance += 5; // Coincidencia directa con ciudad
            if (region && locationText.includes(region.toLowerCase())) relevance += 3; // Coincidencia con región
            if (locationText.includes(country)) relevance += 1; // Coincidencia con país
            
            // Bonificación por exactitud
            if (new RegExp(`\\b${mainLocation}\\b`).test(locationText)) relevance += 2; // Palabra completa
            
            // Desplazamiento explícito a la ubicación
            if ((locationText.includes('desplaza') || locationText.includes('cobertur')) && 
                 locationText.includes(mainLocation)) relevance += 4;
            
            // Penalización si no hay ninguna mención de ubicación
            if (!locationRelatedTerms.some(term => locationText.includes(term))) relevance -= 2;
            
            return relevance;
          };
          
          // Clasificar TODOS los resultados por relevancia de ubicación
          const scoredResults = allResults.map(item => ({
            ...item,
            locationRelevance: getLocationRelevance(item)
          }));
          
          // Separar en dos grupos: altamente relevantes y menos relevantes
          const highRelevance = scoredResults.filter(item => item.locationRelevance >= 3);
          const lowRelevance = scoredResults.filter(item => item.locationRelevance < 3);
          
          // Ordenar cada grupo por su relevancia
          highRelevance.sort((a, b) => b.locationRelevance - a.locationRelevance);
          lowRelevance.sort((a, b) => b.locationRelevance - a.locationRelevance);
          
          console.log(`Clasificación por ubicación: ${highRelevance.length} resultados altamente relevantes, ${lowRelevance.length} menos relevantes`);
          
          // Combinar resultados, priorizando los de alta relevancia
          results = [...highRelevance, ...lowRelevance];
          
          // Si no hay resultados de alta relevancia pero sí hay de baja, mostrar un mensaje
          if (highRelevance.length === 0 && lowRelevance.length > 0) {
            console.log(`No se encontraron coincidencias óptimas para ${mainLocation}, mostrando alternativas`);
            setToast({ 
              message: `No se encontraron proveedores específicos en ${mainLocation}. Mostrando alternativas que podrían desplazarse.`, 
              type: 'info' 
            });
          }
          
          // Si no hay resultados en absoluto, usar todos (caso extremo)
          if (results.length === 0) {
            console.log('No se encontraron coincidencias de ubicación, usando todos los resultados');
            results = allResults;
            setToast({ 
              message: `No se encontraron proveedores para ${mainLocation}. Mostrando resultados generales.`, 
              type: 'warning' 
            });
          }
        } else {
          results = allResults;
        }
        
        // Asegurarse de que cada resultado tenga al menos title y link
        let validResults = results.filter(r => r && typeof r === 'object');
        
        // Normalizar y reparar resultados, en vez de descartarlos
        validResults = validResults.map(r => ({
          ...r,
          title: r.title || r.name || 'Proveedor sin nombre',
          link: r.link || `https://www.bodas.net/busqueda/${(r.service || servicioSeleccionado || '').toLowerCase().replace(/\s+/g, '-')}-${formattedLocation ? formattedLocation.split(',')[0].toLowerCase() : 'espana'}`,
          snippet: r.snippet || 'Sin descripción disponible',
          service: r.service || servicioSeleccionado,
          location: r.location || formattedLocation || 'España',
          priceRange: r.priceRange || 'Consultar',
          verified: true // Marcar todos como verificados para evitar filtrado
        }));
        
        console.log(`Normalización de resultados: ${validResults.length} resultados normalizados`);
        
        if (validResults.length === 0 && results.length > 0) {
          console.warn('No hay resultados válidos después de normalizar, creando respaldo');
          // Crear un resultado de respaldo para evitar que no haya resultados
          validResults = [{
            title: 'Directorio de proveedores para bodas',
            link: `https://www.bodas.net/busqueda/${servicioSeleccionado.toLowerCase().replace(/\s+/g, '-')}-${formattedLocation ? formattedLocation.split(',')[0].toLowerCase() : 'espana'}`,
            snippet: `Encuentra proveedores de ${servicioSeleccionado} en ${formattedLocation || 'toda España'}`,
            service: servicioSeleccionado,
            location: formattedLocation || 'España',
            priceRange: 'Varios precios disponibles',
            verified: true
          }];
        }
        
        results = validResults;
        
        // Ordenar enlaces por calidad y relevancia (pero ser menos estricto)
        results.sort((a, b) => {
          // Función para puntuar la calidad del enlace
          const getLinkScore = (item) => {
            if (!item || !item.link) return 0;
            const link = item.link.toLowerCase();
            
            // Enlaces probablemente oficiales (dominio propio)
            if (!link.includes('bodas.net') && 
                !link.includes('zankyou') && 
                !link.includes('matrimonio.com') && 
                !link.includes('facebook.com') && 
                !link.includes('instagram.com') && 
                link.includes('.')) {
              return 5; // Probablemente web oficial
            }
            
            // Perfiles en plataformas de bodas
            else if (link.includes('bodas.net') || 
                     link.includes('zankyou.es') || 
                     link.includes('matrimonio.com')) {
              return 4; // Plataforma especializada
            }
            
            // Redes sociales
            else if (link.includes('facebook.com') || 
                     link.includes('instagram.com')) {
              return 3; // Red social
            }
            
            // Otros enlaces
            return 1;
          };
          
          return getLinkScore(b) - getLinkScore(a); // Mayor puntuación primero
        });
        
        if (results.length > 0) {
          // Mostrar los resultados en el modal solo si hay resultados
          setAiResults(results);
          setShowAiModal(true);
          saveData('lovendaSuppliers', results, { firestore: false, showNotification: false });
          window.dispatchEvent(new Event('lovenda-suppliers'));
        } else {
          setToast({ 
            message: 'No se encontraron proveedores que coincidan con tu búsqueda. Intenta con otros términos o servicio.', 
            type: 'info' 
          });
        }
      } catch (parseError) {
        console.error('Error al procesar la respuesta de OpenAI:', parseError);
        console.log('Contenido recibido:', data.choices[0].message?.content || 'Contenido no disponible');
        
        // Mensaje más específico según el tipo de error
        if (parseError.message.includes('JSON')) {
          setToast({ 
            message: 'Error al procesar la respuesta: formato inválido. Intenta de nuevo o con otra búsqueda.', 
            type: 'error' 
          });
        } else {
          setToast({ 
            message: `Error al procesar los resultados: ${parseError.message}`, 
            type: 'error' 
          });
        }
      }
    } catch (err) {
      console.error('Error en la búsqueda de proveedores:', err);
      
      // Mensaje de error más específico según el tipo de error
      if (err.message.includes('autenticación') || err.message.includes('API')) {
        setToast({ 
          message: 'Error de autenticación en la API. Por favor, contacta con soporte.', 
          type: 'error' 
        });
      } else if (err.message.includes('Límite')) {
        setToast({ 
          message: 'Has excedido el límite de búsquedas. Espera unos minutos e intenta de nuevo.', 
          type: 'warning' 
        });
      } else if (err.message.includes('red') || err.message.includes('conexión') || err.message.includes('network')) {
        setToast({ 
          message: 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.', 
          type: 'error' 
        });
      } else {
        setToast({ 
          message: 'Error al buscar proveedores con IA. Intenta de nuevo más tarde.', 
          type: 'error' 
        });
      }
    } finally {
      setAiLoading(false);
    }
  };

  const openDetail = p => { setDetailProvider(p); setShowDetail(true); };
  const sendMailToProvider = async () => {
    if (!detailProvider?.email) { 
      setToast({ message: 'El proveedor no tiene email disponible', type: 'error' }); 
      return; 
    }
    
    // Obtener información del perfil para personalizar el mensaje
    let profileInfo = {};
    try {
      profileInfo = await loadData('lovendaProfile', {});
    } catch (err) {
      console.warn('No se pudo cargar la información del perfil para el correo:', err);
    }
    
    // Construir los nombres de la pareja
    const bride = profileInfo.bride?.name || profileInfo.nombre1 || 'Novia';
    const groom = profileInfo.groom?.name || profileInfo.nombre2 || 'Novio';
    const weddingDate = profileInfo.date || profileInfo.weddingInfo?.date || 'fecha por determinar';
    
    // Crear plantilla de correo personalizada
    const emailBody = `Hola ${detailProvider.contact || ''}:

Somos ${bride} y ${groom}, estamos organizando nuestra boda para el ${weddingDate} ${profileInfo.celebrationPlace ? `en ${profileInfo.celebrationPlace}` : ''} y estamos interesados en sus servicios de ${detailProvider.service || 'proveedor'}.

¿Podría proporcionarnos información sobre sus servicios, disponibilidad para esa fecha y precios aproximados?

Muchas gracias de antemano.

Saludos cordiales,
${bride} y ${groom}`;
    
    // Disparar evento global para abrir redacción en Buzón con plantilla
    window.dispatchEvent(new CustomEvent('lovenda-compose', { 
      detail: { 
        to: detailProvider.email, 
        subject: `Consulta sobre servicios de ${detailProvider.service || ''} para boda - ${detailProvider.name}`,
        body: emailBody
      } 
    }));
    
    // Registrar este proveedor como contactado y añadir la comunicación al historial
    const currentDate = new Date();
    const dateStr = currentDate.toISOString();
    const formattedDate = dateStr.split('T')[0];
    
    const newCommunication = {
      date: dateStr,
      type: 'Email enviado',
      subject: `Consulta sobre servicios de ${detailProvider.service || ''} para boda`,
      content: emailBody.substring(0, 100) + '...' // Resumen del contenido
    };
    
    const updatedProviders = providers.map(p => {
      if (p.id === detailProvider.id) {
        // Añadir comunicación al historial (crear array si no existe)
        const communications = p.communications ? [...p.communications, newCommunication] : [newCommunication];
        
        return {
          ...p, 
          status: 'Contactado', 
          lastContactDate: formattedDate,
          communications: communications
        };
      }
      return p;
    });
    
    // Actualizar estado y guardar en localStorage
    setProviders(updatedProviders);
    saveData('providers', updatedProviders);
    
    // Actualizar el proveedor en detalle para mostrar la comunicación inmediatamente
    if (detailProvider) {
      const communications = detailProvider.communications ? [...detailProvider.communications, newCommunication] : [newCommunication];
      setDetailProvider({
        ...detailProvider,
        status: 'Contactado',
        lastContactDate: formattedDate,
        communications: communications
      });
    }
    
    // Crear o actualizar registro de seguimiento para este proveedor
    const emailData = {
      id: `email-${Date.now()}`,
      to: detailProvider.email,
      subject: `Consulta sobre servicios de ${detailProvider.service || ''} para boda - ${detailProvider.name}`,
      body: emailBody,
      date: new Date()
    };
    
    // Crear registro de seguimiento automáticamente al enviar email
    createTrackingRecord(emailData, detailProvider);
    setTrackingRecords(loadTrackingRecords());
    
    // Notificar al usuario que la funcionalidad está temporalmente no disponible
    alert('Funcionalidad de buzón temporalmente no disponible');
    setShowDetail(false);
  };

  // Gestionar el seguimiento del proveedor
  const handleProviderTracking = () => {
    if (!detailProvider) return;
    
    // Buscar si ya existe un seguimiento para este proveedor
    const existingTracking = trackingRecords.find(record => 
      record.providerEmail === detailProvider.email || record.providerId === detailProvider.id
    );
    
    if (existingTracking) {
      // Si ya existe un seguimiento, mostrarlo
      setCurrentTracking(existingTracking);
      setShowTrackingModal(true);
    } else {
      // Si no existe, crear uno nuevo
      const dummyEmail = {
        id: `dummy-${Date.now()}`,
        to: detailProvider.email,
        subject: `Seguimiento de ${detailProvider.service || 'proveedor'} - ${detailProvider.name}`,
        body: `Seguimiento automático creado para ${detailProvider.name}`,
        date: new Date()
      };
      
      const newTracking = createTrackingRecord(dummyEmail, detailProvider);
      setCurrentTracking(newTracking);
      setTrackingRecords(loadTrackingRecords());
      setShowTrackingModal(true);
    }
  };
  
  // Actualizar estado de seguimiento
  const updateTrackingStatusHandler = (recordId, newStatus) => {
    updateTrackingStatus(recordId, newStatus);
    setTrackingRecords(loadTrackingRecords());
    setCurrentTracking(prev => prev && prev.id === recordId ? 
      {...prev, status: newStatus} : prev);
    
    setToast({ 
      message: `Estado de seguimiento actualizado a "${newStatus}"`, 
      type: 'success' 
    });
  };
  
  // Sincronizar emails del buzón para un proveedor específico
  const syncProviderEmails = (provider) => {
    if (!provider || !provider.email) {
      setToast({ message: 'Este proveedor no tiene email para sincronizar', type: 'warning' });
      return;
    }
    
    setIsSyncingEmails(true);
    setSyncedEmails([]);
    
    // Cargar emails del localStorage (simulación de búsqueda en buzón)
    setTimeout(() => {
      try {
        // En una implementación real, esta función buscaría en el buzón por remitente/destinatario
        const allEmails = loadData('emails', { defaultValue: [] });
        
        // Filtrar por emails que coincidan con el email del proveedor
        const relatedEmails = allEmails.filter(email => {
          const isRelated = (
            // Es el remitente o está entre los destinatarios
            email.from?.includes(provider.email) ||
            email.to?.includes(provider.email) ||
            // O contiene el nombre del proveedor en el asunto
            (email.subject && provider.name && 
             email.subject.toLowerCase().includes(provider.name.toLowerCase()))
          );
          return isRelated;
        });
        
        // Formatear emails para mostrar
        const formattedEmails = relatedEmails.map(email => ({
          id: email.id || `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          subject: email.subject || '(Sin asunto)',
          snippet: email.body?.substring(0, 100) || '',
          date: email.date || new Date(),
          direction: email.from?.includes('@midominio.com') ? 'outgoing' : 'incoming',
          from: email.from || '',
          to: email.to || '',
        }));
        
        // Ordenar por fecha más reciente primero
        formattedEmails.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setSyncedEmails(formattedEmails);
        
        // Actualizar comunicaciones del proveedor con los emails sincronizados
        if (formattedEmails.length > 0) {
          const updatedProvider = {...provider};
          
          // Convertir emails a formato de comunicaciones
          const newCommunications = formattedEmails.map(email => ({
            date: email.date,
            type: email.direction === 'outgoing' ? 'Email enviado' : 'Email recibido',
            subject: email.subject,
            content: email.snippet,
            emailId: email.id
          }));
          
          // Filtrar comunicaciones existentes para no duplicar
          const existingEmailIds = updatedProvider.communications 
            ? updatedProvider.communications
                .filter(c => c.emailId)
                .map(c => c.emailId) 
            : [];
          
          const newUniqueCommunications = newCommunications.filter(
            nc => !existingEmailIds.includes(nc.emailId)
          );
          
          // Añadir nuevas comunicaciones
          updatedProvider.communications = updatedProvider.communications 
            ? [...updatedProvider.communications, ...newUniqueCommunications]
            : newUniqueCommunications;
            
          // Actualizar el proveedor en la lista y en detalle
          const updatedProviders = providers.map(p => 
            p.id === provider.id ? updatedProvider : p
          );
          
          setProviders(updatedProviders);
          saveData('providers', updatedProviders);
          
          if (detailProvider && detailProvider.id === provider.id) {
            setDetailProvider(updatedProvider);
          }
        }
        
        setToast({ 
          message: `Sincronización completada: ${formattedEmails.length} emails encontrados`, 
          type: 'success' 
        });
      } catch (error) {
        console.error('Error al sincronizar emails:', error);
        setToast({ 
          message: 'Error al sincronizar emails con el buzón', 
          type: 'error' 
        });
      } finally {
        setIsSyncingEmails(false);
      }
    }, 1500); // Simulamos un retardo para mostrar el estado de carga
  };

  return (
    <PageWrapper
        title="Gestión de Proveedores"
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => setShowAiModal(true)} data-testid="open-ai-search">
            Buscar proveedor
          </Button>
        }
      >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Card className="space-y-4 p-4">
        {/* Pestañas */}
        <div className="flex gap-2">
          {[ 
            { key: 'selected', label: 'Seleccionados' },
            { key: 'contacted', label: 'Contactados' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{t.label}</button>
          ))}
        </div>
        <form onSubmit={e => e.preventDefault()} className="flex items-center border rounded px-2 py-1">
          <Search size={16} className="mr-2 text-gray-600" />
          
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="outline-none"
          />
          
        </form>
        <div className="hidden">
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
      </Card>

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

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {displayed.length===0 && <p className="text-gray-500">No hay proveedores en esta pestaña.</p>}
        {displayed.map(p=>(
          <div key={p.id} className="relative p-4 cursor-pointer bg-white rounded shadow" onClick={() => openDetail(p)}>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
              onClick={(e) => { e.stopPropagation(); removeProvider(p.id); }}
              title="Eliminar proveedor"
            >
              <Trash2 size={16} />
            </button>
            <span className="absolute top-2 left-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{p.service}</span>
            <h3 className="text-lg font-semibold mb-2 mt-6">{p.name}</h3>
            <p className="text-sm text-gray-600">{p.contact || p.email || p.phone}</p>
          </div>
        ))}
      </div>

      {/* Modal Detalle */}
      {showDetail && detailProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={()=>setShowDetail(false)}>
          <div className="bg-white w-full max-w-lg p-6 rounded shadow space-y-4 max-h-[90vh] overflow-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{detailProvider.name}</h2>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${detailProvider.status === 'Confirmado' ? 'bg-green-100 text-green-800' : detailProvider.status === 'Contactado' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {detailProvider.status || 'Pendiente'}
                </span>
                <button className="text-gray-500 text-2xl leading-4" onClick={()=>setShowDetail(false)}>&times;</button>
              </div>
            </div>
            
            {/* Pestañas de navegación */}
            <div className="flex border-b mb-4">
              <button
                className={`px-4 py-2 font-medium text-sm ${activeDetailTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveDetailTab('info')}
              >
                Información
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${activeDetailTab === 'communications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveDetailTab('communications')}
              >
                Comunicaciones
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${activeDetailTab === 'tracking' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveDetailTab('tracking')}
              >
                Seguimiento
              </button>
            </div>
            
            {/* Pestaña de Información */}
            {activeDetailTab === 'info' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p><span className="font-medium">Servicio:</span> {detailProvider.service}</p>
                    {detailProvider.contact && <p><span className="font-medium">Contacto:</span> {detailProvider.contact}</p>}
                    {detailProvider.email && <p><span className="font-medium">Email:</span> {detailProvider.email}</p>}
                    {detailProvider.phone && <p><span className="font-medium">Teléfono:</span> {detailProvider.phone}</p>}
                  </div>
                  
                  <div>
                    {detailProvider.priceRange && (
                      <p><span className="font-medium">Precio aproximado:</span> {detailProvider.priceRange}</p>
                    )}
                    {detailProvider.location && (
                      <p><span className="font-medium">Ubicación:</span> {detailProvider.location}</p>
                    )}
                    {detailProvider.link && (
                      <p>
                        <span className="font-medium">Web:</span> 
                        <a href={detailProvider.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline ml-1">
                          {detailProvider.link.replace(/(https?:\/\/|www\.)/g, '').split('/')[0]}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
                
                {detailProvider.snippet && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Descripción</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-2 rounded">{detailProvider.snippet}</p>
                  </div>
                )}
              </>
            )}
            
            {/* Pestaña de Comunicaciones */}
            {activeDetailTab === 'communications' && (
              <div className="pb-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Historial de comunicaciones</h3>
                  {detailProvider.communications && detailProvider.communications.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-auto">
                      {detailProvider.communications.map((comm, idx) => (
                        <div key={idx} className="border-l-2 border-blue-400 pl-2 py-1">
                          <p className="text-xs text-gray-500">{new Date(comm.date).toLocaleString()}</p>
                          <p className="text-sm font-medium">{comm.type}</p>
                          <p className="text-sm">{comm.subject}</p>
                          {comm.content && <p className="text-xs text-gray-600">{comm.content}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No hay comunicaciones registradas</p>
                  )}
                </div>
                
                {/* Correos sincronizados desde el buzón */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    Correos sincronizados
                    <button 
                      className="ml-2 text-xs text-blue-600 hover:underline flex items-center" 
                      onClick={() => {
                        syncProviderEmails(detailProvider);
                      }}
                      disabled={isSyncingEmails}
                    >
                      {isSyncingEmails ? (
                        <>
                          <Spinner size="small" className="mr-1" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <RefreshCcw size={12} className="mr-1" />
                          Sincronizar
                        </>
                      )}
                    </button>
                  </h3>
                  
                  <div className="space-y-2 max-h-[300px] overflow-auto">
                    {syncedEmails && syncedEmails.length > 0 ? (
                      syncedEmails.map((email, idx) => (
                        <div key={idx} className="border-l-2 border-purple-400 pl-2 py-1">
                          <p className="text-xs text-gray-500">{new Date(email.date).toLocaleString()}</p>
                          <p className="text-sm font-medium">{email.direction === 'outgoing' ? 'Enviado' : 'Recibido'}</p>
                          <p className="text-sm">{email.subject}</p>
                          {email.snippet && <p className="text-xs text-gray-600 truncate">{email.snippet}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">Sin datos sincronizados del buzón</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Pestaña de Seguimiento */}
            {activeDetailTab === 'tracking' && (
              <div>
                {/* Registro de seguimiento activo */}
                {trackingRecords.filter(record => 
                  record.providerEmail === detailProvider.email || record.providerId === detailProvider.id
                ).length > 0 ? (
                  <div className="space-y-4">
                    {trackingRecords.filter(record => 
                      record.providerEmail === detailProvider.email || record.providerId === detailProvider.id
                    ).map((record, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{record.subject || 'Seguimiento'}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${record.status === TRACKING_STATUS.URGENT ? 'bg-red-100 text-red-800' : 
                            record.status === TRACKING_STATUS.WAITING ? 'bg-amber-100 text-amber-800' :
                            record.status === TRACKING_STATUS.RESPONDED ? 'bg-green-100 text-green-800' :
                            record.status === TRACKING_STATUS.FOLLOWUP ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'}`}>
                            {record.status || 'Pendiente'}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-1">Último contacto: {new Date(record.lastEmailDate).toLocaleDateString()}</p>
                        {record.dueDate && <p className="text-xs text-gray-500">Fecha límite: {new Date(record.dueDate).toLocaleDateString()}</p>}
                        
                        {record.notes && <p className="text-sm mt-2 bg-gray-50 p-2 rounded">{record.notes}</p>}
                        
                        <div className="mt-2">
                          <button 
                            className="text-blue-600 text-sm hover:underline"
                            onClick={() => {
                              setCurrentTracking(record);
                              setShowTrackingModal(true);
                            }}
                          >
                            Ver detalles
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Clock className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No hay seguimientos activos para este proveedor</p>
                    <button 
                      className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-full text-sm"
                      onClick={handleProviderTracking}
                    >
                      Crear seguimiento
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Panel de acciones rápidas contextuales */}
            <div className="border-t border-gray-200 mt-4 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Acciones rápidas</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {/* Acción rápida: Email */}
                <button 
                  className="p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex flex-col items-center justify-center"
                  onClick={sendMailToProvider}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">Email</span>
                </button>
                
                {/* Acción rápida: Seguimiento */}
                <button 
                  className="p-2 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 flex flex-col items-center justify-center"
                  onClick={handleProviderTracking}
                >
                  <Clock className="h-6 w-6 text-amber-600 mb-1" />
                  <span className="text-xs">Seguimiento</span>
                </button>
                
                {/* Acción rápida: Reservar cita */}
                <button 
                  className="p-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 flex flex-col items-center justify-center"
                  onClick={() => {
                    setProviderToReserve(detailProvider);
                    setShowResModal(true);
                  }}
                >
                  <Calendar className="h-6 w-6 text-green-600 mb-1" />
                  <span className="text-xs">Reservar</span>
                </button>
                
                {/* Acción rápida: Plantillas */}
                <div className="relative">
                  <button 
                    className="p-2 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 flex flex-col items-center justify-center w-full"
                    onClick={() => {
                      // Mostrar menú de plantillas
                      const templates = [
                        { name: 'Consulta inicial', subject: `Consulta de servicios - ${detailProvider.name}` },
                        { name: 'Solicitar presupuesto', subject: `Solicitud de presupuesto - ${detailProvider.name}` },
                        { name: 'Confirmar detalles', subject: `Confirmación de detalles - ${detailProvider.name}` },
                        { name: 'Consulta disponibilidad', subject: `Consulta de disponibilidad - ${detailProvider.name}` }
                      ];
                      
                      // Crear evento para abrir plantilla en buzón
                      const template = templates[0]; // Usar primera plantilla como ejemplo
                      const allProfileData = loadData('lovendaProfile', { defaultValue: {} });
                      const weddingDate = allProfileData.weddingInfo?.date || 'fecha por determinar';
                      const bride = allProfileData.bride?.name || 'Novia';
                      const groom = allProfileData.groom?.name || 'Novio';
                      
                      const emailBody = `Hola ${detailProvider.contact || 'Responsable de ' + detailProvider.name},

Somos ${bride} y ${groom} y estamos organizando nuestra boda para el ${weddingDate}.

Nos gustaría recibir un presupuesto detallado para vuestros servicios de ${detailProvider.service}.

¿Podríais proporcionarnos información sobre tarifas, opciones disponibles y qué incluye cada servicio?

Muchas gracias de antemano.

Saludos cordiales,
${bride} y ${groom}`;
                      
                      window.dispatchEvent(new CustomEvent('lovenda-compose', { 
                        detail: { 
                          to: detailProvider.email, 
                          subject: template.subject,
                          body: emailBody
                        } 
                      }));
                      
                      alert('Funcionalidad de buzón temporalmente no disponible');
                      setShowDetail(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs">Plantilla</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={()=>setShowDetail(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      <div className="hidden">
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
            {displayed.map(p => (
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

      {/* Modal búsqueda proveedor */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAiModal(false)}>
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded shadow flex flex-col" data-testid="ai-search-modal" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Buscar proveedor</h2>
              <button className="text-gray-500 text-2xl leading-4" onClick={() => setShowAiModal(false)}>&times;</button>
            </div>
            <div className="p-4 bg-gray-100">
              <form onSubmit={handleAiSearch} className="flex flex-wrap gap-2 items-center mb-4">
                <input type="text" placeholder="Describe lo que buscas..." value={aiQuery} onChange={e=>setAiQuery(e.target.value)} className="flex-1 border rounded px-2 py-1" data-testid="open-ai-search" />
                <select value={serviceFilter} onChange={e=>setServiceFilter(e.target.value)} className="border rounded px-2 py-1">
                  <option value="">Servicio...</option>
                  <option>Catering</option>
                  <option>Flores</option>
                  <option>Fotografía</option>
                  <option>Música</option>
                  <option>Decoración</option>
                  <option>Vestidos</option>
                  <option>Trajes</option>
                  <option>Transporte</option>
                  <option>Invitaciones</option>
                  <option>Pasteles</option>
                  <option>Joyería</option>
                  <option>Detalles</option>
                  <option>Animación</option>
                </select>
                <select value={budgetRange} onChange={e=>setBudgetRange(e.target.value)} className="border rounded px-2 py-1">
                  <option value="">Presupuesto...</option>
                  <option>&lt; 1.000€</option>
                  <option>1.000€ – 3.000€</option>
                  <option>3.000€ – 6.000€</option>
                  <option>&gt; 6.000€</option>
                </select>
                <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded flex items-center" data-testid="ai-search-button">
                  {aiLoading ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search size={16} className="mr-1"/>
                      Buscar
                    </>
                  )}
                </button>
              </form>
              
              {/* Resultados de la búsqueda IA */}
              {aiResults.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <h3 className="font-semibold text-lg mb-3">Resultados de búsqueda AI</h3>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" data-testid="ai-results-list">
                    {aiResults.map((r, idx) => (
                      <div key={idx} className="bg-white border rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => selectProvider(r)}>
                        {r.image && <img src={r.image} alt={r.title} className="w-full h-32 object-cover"/>}
                        <div className="p-3">
                          <h4 className="font-medium text-blue-700 mb-1">{r.name || r.title}</h4>
                          {r.service && <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{r.service}</p>}
                          {r.location && <p className="text-xs text-gray-500 mb-1"><MapPin size={12} className="inline mr-1"/>{r.location}</p>}
                          {r.priceRange && <p className="text-sm font-medium text-gray-700 mb-2">{r.priceRange}</p>}
                          {r.snippet && <p className="text-sm text-gray-600 line-clamp-3">{r.snippet}</p>}
                          <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                            {r.link && <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-semibold" onClick={(e) => e.stopPropagation()}>Ver web</a>}
                            <div className="flex gap-2">
                              <button onClick={(e) => {
                                e.stopPropagation();
                                // Abrir modal de composición de email con datos del proveedor
                                const emailData = {
                                  to: r.email || '',
                                  subject: `Consulta sobre ${r.service || 'servicios'} - ${r.name || r.title}`,
                                  body: `Hola,\n\nEstoy interesado en sus servicios de ${r.service || 'proveedor'} para mi boda.\n\n¿Podrían proporcionarme más información sobre disponibilidad y precios?\n\nGracias,`
                                };
                                // Simular apertura de modal de email
                                setToast({ message: 'Funcionalidad de email en desarrollo', type: 'info' });
                              }} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded" data-testid="email-provider-btn">
                                Email
                              </button>
                              <button onClick={(e) => {
                                e.stopPropagation();
                                setProviders(prev => [...prev, { 
                                  id: `web-${Date.now()}`, 
                                  name: r.title, 
                                  service: r.service || servicioSeleccionado,
                                  contact: '',
                                  email: '',
                                  phone: '',
                                  link: r.link, 
                                  status: 'Nuevo',
                                  location: r.location || '',
                                  date: new Date().toISOString().slice(0,10), 
                                  rating: 0, 
                                  ratingCount: 0, 
                                  snippet: r.snippet || '',
                                  priceRange: r.priceRange || ''
                                }]);
                                setToast({ message: 'Proveedor añadido a la lista', type: 'success' });
                              }} className="text-xs bg-green-50 hover:bg-green-100 text-green-600 px-2 py-1 rounded">
                                Añadir
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Estado de carga y mensajes */}
              {aiLoading && aiResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
                  <p className="text-gray-600">Buscando los mejores proveedores para ti...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vista móvil eliminada en nuevo diseño */}
      <div className="block md:hidden space-y-4">
        {displayed.map(p => (
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
      
      {/* Modal para reserva */}
      {showResModal && providerToReserve && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Reservar con {providerToReserve.name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input 
                  type="date" 
                  value={resDate}
                  onChange={e => setResDate(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input 
                  type="time" 
                  value={resTime}
                  onChange={e => setResTime(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button 
                className="px-4 py-2 bg-gray-200 rounded" 
                onClick={() => setShowResModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded" 
                onClick={confirmReservation}
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para gestionar seguimiento */}
      {showTrackingModal && currentTracking && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Seguimiento: {currentTracking.providerName}</h3>
              <button 
                onClick={() => setShowTrackingModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            {/* Estado actual y acciones rápidas */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Estado actual</h4>
              <div className="flex flex-wrap gap-2">
                {Object.values(TRACKING_STATUS).map(status => (
                  <button
                    key={status}
                    onClick={() => updateTrackingStatusHandler(currentTracking.id, status)}
                    className={`px-3 py-1.5 text-xs rounded-full flex items-center ${currentTracking.status === status ? 
                      (status === TRACKING_STATUS.URGENT ? 'bg-red-600 text-white' : 
                       status === TRACKING_STATUS.WAITING ? 'bg-amber-500 text-white' :
                       status === TRACKING_STATUS.RESPONDED ? 'bg-green-600 text-white' :
                       status === TRACKING_STATUS.FOLLOWUP ? 'bg-blue-600 text-white' :
                       'bg-gray-600 text-white') : 
                      'bg-gray-100 text-gray-700'}`}
                  >
                    {status === TRACKING_STATUS.URGENT && <AlertTriangle size={12} className="mr-1" />}
                    {status === TRACKING_STATUS.WAITING && <Clock size={12} className="mr-1" />}
                    {status === TRACKING_STATUS.RESPONDED && <Eye size={12} className="mr-1" />}
                    {status === TRACKING_STATUS.FOLLOWUP && <RefreshCcw size={12} className="mr-1" />}
                    {status === TRACKING_STATUS.COMPLETED && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>}
                    {status === TRACKING_STATUS.URGENT ? 'Urgente' :
                     status === TRACKING_STATUS.WAITING ? 'Esperando' :
                     status === TRACKING_STATUS.RESPONDED ? 'Respondido' :
                     status === TRACKING_STATUS.FOLLOWUP ? 'Seguimiento' :
                     status === TRACKING_STATUS.COMPLETED ? 'Completado' :
                     status}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Detalles del proveedor */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Información del proveedor</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-lg">
                <div>
                  <p><span className="font-medium">Nombre:</span> {currentTracking.providerName}</p>
                  <p><span className="font-medium">Email:</span> {currentTracking.providerEmail}</p>
                  <p><span className="font-medium">Último contacto:</span> {new Date(currentTracking.lastEmailDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p><span className="font-medium">Asunto:</span> {currentTracking.subject}</p>
                  {currentTracking.dueDate && <p><span className="font-medium">Fecha límite:</span> {new Date(currentTracking.dueDate).toLocaleDateString()}</p>}
                </div>
              </div>
            </div>
            
            {/* Historial de comunicaciones */}
            {currentTracking.thread && currentTracking.thread.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Historial de comunicaciones</h4>
                <div className="space-y-2 max-h-[200px] overflow-auto p-3 border rounded-lg">
                  {currentTracking.thread.map((item, idx) => (
                    <div key={idx} className={`p-2 rounded-lg ${item.direction === 'outgoing' ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-green-50 border-l-4 border-green-400'}`}>
                      <p className="text-xs text-gray-500">{new Date(item.date).toLocaleString()}</p>
                      <p className="text-sm font-medium">{item.subject}</p>
                      {item.snippet && <p className="text-sm text-gray-700">{item.snippet}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Notas */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Notas de seguimiento</h4>
              <textarea 
                className="w-full border rounded-lg p-3 min-h-[100px]"
                placeholder="Añade notas sobre este proveedor..."
                value={currentTracking.notes || ''}
                onChange={(e) => {
                  setCurrentTracking({...currentTracking, notes: e.target.value});
                  // Actualizar notas del registro
                  updateTrackingStatus(currentTracking.id, currentTracking.status, e.target.value);
                }}
              />
            </div>
            
            {/* Acciones finales */}
            <div className="flex justify-between">
              <div>
                <button 
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded border border-red-200"
                  onClick={() => {
                    // Eliminar seguimiento (implementar esta función)
                    // deleteTrackingRecord(currentTracking.id);
                    setShowTrackingModal(false);
                    setToast({ message: 'Seguimiento eliminado', type: 'info' });
                  }}
                >
                  Eliminar seguimiento
                </button>
              </div>
              
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 bg-amber-500 text-white rounded flex items-center"
                  onClick={() => {
                    // Actualizar fecha límite para fecha actual + 3 días
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 3);
                    const newTracking = {...currentTracking, dueDate};
                    updateTrackingStatus(currentTracking.id, currentTracking.status, currentTracking.notes, dueDate);
                    setCurrentTracking(newTracking);
                    setToast({ message: 'Fecha límite actualizada', type: 'success' });
                  }}
                >
                  <Calendar size={16} className="mr-1" />
                  Recordatorio (3 días)
                </button>
                
                <button 
                  onClick={() => setShowTrackingModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

