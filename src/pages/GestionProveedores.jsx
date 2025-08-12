import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Settings } from 'lucide-react';

// Firebase
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, getFirestore } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';

// Componentes
import ProveedorCardNuevo from '../components/proveedores/ProveedorCardNuevo';
import ProveedorDetalle from '../components/proveedores/ProveedorDetalle';
import ProveedorFiltro from '../components/proveedores/ProveedorFiltro';
import ProveedorFormModal from '../components/proveedores/ProveedorFormModal';
import AIBusquedaModal from '../components/proveedores/AIBusquedaModal';

/**
 * Página de gestión de proveedores
 * Muestra proveedores en tarjetas, permite filtrar, buscar con IA y añadir manualmente
 */
const GestionProveedores = () => {
  // Contextos
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Estados para proveedores
  const [proveedores, setProveedores] = useState([]);
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros y búsqueda
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [textoBusqueda, setTextoBusqueda] = useState('');
  
  // Estados para modales
  const [modalFormularioVisible, setModalFormularioVisible] = useState(false);
  const [modalAIVisible, setModalAIVisible] = useState(false);
  const [proveedorEditar, setProveedorEditar] = useState(null);
  
  // Estados para búsqueda IA
  const [resultadoBusquedaIA, setResultadoBusquedaIA] = useState(null);
  const [cargandoBusquedaIA, setCargandoBusquedaIA] = useState(false);
  
  // Estado para comunicaciones
  const [comunicaciones, setComunicaciones] = useState([]);
  
  // Cargar proveedores desde Firestore
  const cargarProveedores = useCallback(async () => {
    // Usar ID de usuario por defecto si no hay usuario autenticado (solo para desarrollo)
    const userId = currentUser?.uid || 'user123';
    console.log('cargarProveedores: usando ID de usuario:', userId);
    
    setCargando(true);
    setError(null);
    
    try {
      const proveedoresRef = collection(db, `users/${userId}/proveedores`);
      const q = query(proveedoresRef);
      const snapshot = await getDocs(q);
      
      const nuevosProveedores = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProveedores(nuevosProveedores);
      aplicarFiltros(nuevosProveedores, filtroActivo, textoBusqueda);
      
      setCargando(false);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setError('Error al cargar los proveedores. Inténtalo de nuevo más tarde.');
      setCargando(false);
    }
  }, [currentUser, filtroActivo, textoBusqueda]);
  
  // Cargar al iniciar
  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);
  
  // Aplicar filtros a los proveedores
  const aplicarFiltros = (listaProveedores, filtro, texto) => {
    let resultado = [...listaProveedores];
    
    // Aplicar filtro por categoría
    switch (filtro) {
      case 'contratados':
        resultado = resultado.filter(p => p.estado === 'Contratado');
        break;
      case 'contactados':
        resultado = resultado.filter(p => p.estado === 'Contactado');
        break;
      case 'favoritos':
        resultado = resultado.filter(p => p.favorito === true);
        break;
      default:
        // Todos los proveedores
        break;
    }
    
    // Aplicar filtro de texto si existe
    if (texto) {
      const textoLower = texto.toLowerCase();
      resultado = resultado.filter(p => 
        (p.nombre && p.nombre.toLowerCase().includes(textoLower)) ||
        (p.servicio && p.servicio.toLowerCase().includes(textoLower)) ||
        (p.ubicacion && p.ubicacion.toLowerCase().includes(textoLower))
      );
    }
    
    setProveedoresFiltrados(resultado);
  };
  
  // Cambiar filtro activo
  const cambiarFiltro = (nuevoFiltro) => {
    setFiltroActivo(nuevoFiltro);
    aplicarFiltros(proveedores, nuevoFiltro, textoBusqueda);
  };
  
  // Cambiar texto de búsqueda
  const cambiarTextoBusqueda = (nuevoTexto) => {
    setTextoBusqueda(nuevoTexto);
  };
  
  // Realizar búsqueda
  const buscar = () => {
    aplicarFiltros(proveedores, filtroActivo, textoBusqueda);
  };
  
  // Guardar nuevo proveedor
  const guardarProveedor = async (datosProveedor) => {
    console.log('guardarProveedor llamado con datos:', datosProveedor);
    
    // Usar ID de usuario por defecto si no hay usuario autenticado (solo para desarrollo)
    const userId = currentUser?.uid || 'user123';
    console.log('Usando ID de usuario:', userId);
    
    try {
      console.log('Intentando guardar proveedor en Firestore...');
      // Si tiene ID, actualizar
      if (datosProveedor.id) {
        console.log('Actualizando proveedor existente con ID:', datosProveedor.id);
        const proveedorRef = doc(db, `users/${userId}/proveedores`, datosProveedor.id);
        const { id, ...datosActualizar } = datosProveedor;
        await updateDoc(proveedorRef, datosActualizar);
        console.log('Proveedor actualizado correctamente');
      } else {
        // Si no tiene ID, crear nuevo
        console.log('Creando nuevo proveedor para usuario:', userId);
        const proveedoresRef = collection(db, `users/${userId}/proveedores`);
        const docRef = await addDoc(proveedoresRef, {
          ...datosProveedor,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('Proveedor creado con ID:', docRef.id);
      }
      
      // Recargar proveedores
      console.log('Recargando lista de proveedores...');
      await cargarProveedores();
      console.log('Lista de proveedores recargada');
      
      return true;
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      throw error;
    }
  };
  
  // Eliminar proveedor
  const eliminarProveedor = async (proveedorId) => {
    if (!currentUser?.uid || !proveedorId) return;
    
    if (!window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      return;
    }
    
    try {
      const proveedorRef = doc(db, `users/${currentUser.uid}/proveedores`, proveedorId);
      await deleteDoc(proveedorRef);
      
      // Actualizar estado local
      setProveedores(prev => prev.filter(p => p.id !== proveedorId));
      setProveedoresFiltrados(prev => prev.filter(p => p.id !== proveedorId));
      
      // Si era el proveedor seleccionado, deseleccionar
      if (proveedorSeleccionado?.id === proveedorId) {
        setProveedorSeleccionado(null);
      }
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      alert('Error al eliminar el proveedor');
    }
  };
  
  // Marcar/desmarcar favorito
  const toggleFavorito = async (proveedorId) => {
    if (!currentUser?.uid || !proveedorId) return;
    
    try {
      // Encontrar el proveedor en la lista
      const proveedor = proveedores.find(p => p.id === proveedorId);
      if (!proveedor) return;
      
      // Actualizar en Firestore
      const proveedorRef = doc(db, `users/${currentUser.uid}/proveedores`, proveedorId);
      await updateDoc(proveedorRef, {
        favorito: !proveedor.favorito,
        updatedAt: new Date().toISOString()
      });
      
      // Actualizar estado local
      setProveedores(prev => 
        prev.map(p => 
          p.id === proveedorId ? { ...p, favorito: !p.favorito } : p
        )
      );
      
      // Actualizar filtrados también
      setProveedoresFiltrados(prev => 
        prev.map(p => 
          p.id === proveedorId ? { ...p, favorito: !p.favorito } : p
        )
      );
      
      // Si es el proveedor seleccionado, actualizar
      if (proveedorSeleccionado?.id === proveedorId) {
        setProveedorSeleccionado(prev => ({ ...prev, favorito: !prev.favorito }));
      }
    } catch (error) {
      console.error('Error al marcar favorito:', error);
    }
  };
  
  // Editar proveedor
  const editarProveedor = (proveedor) => {
    setProveedorEditar(proveedor);
    setModalFormularioVisible(true);
  };
  
  // Ver detalle del proveedor
  const verDetalleProveedor = async (proveedor) => {
    setProveedorSeleccionado(proveedor);
    
    // Cargar comunicaciones para este proveedor
    try {
      if (currentUser?.uid && proveedor?.id) {
        const comunicacionesRef = collection(db, `users/${currentUser.uid}/proveedores/${proveedor.id}/comunicaciones`);
        const snapshot = await getDocs(comunicacionesRef);
        
        const nuevasComunicaciones = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => {
          // Ordenar por fecha descendente
          return new Date(b.fecha) - new Date(a.fecha);
        });
        
        setComunicaciones(nuevasComunicaciones);
      }
    } catch (error) {
      console.error('Error al cargar comunicaciones:', error);
      setComunicaciones([]);
    }
  };
  
  // Cerrar detalle
  const cerrarDetalle = () => {
    setProveedorSeleccionado(null);
    setComunicaciones([]);
  };
  
  // Añadir nueva comunicación
  const nuevaComunicacion = async () => {
    // Aquí iría un modal para añadir comunicación
    alert('Funcionalidad de añadir comunicación en desarrollo');
  };
  
  // Buscar con IA
  const buscarConIA = async (consulta) => {
    if (!consulta) return;
    
    setCargandoBusquedaIA(true);
    setResultadoBusquedaIA(null);
    
    try {
      // Simular búsqueda con IA (reemplazar con llamada real a API)
      setTimeout(() => {
        // Resultado simulado
        const resultado = {
          nombre: `Proveedor para: ${consulta}`,
          servicio: consulta.split(' ')[0] || 'Servicio',
          descripcion: `Este es un proveedor encontrado para tu búsqueda: "${consulta}". Aquí iría una descripción generada por IA con información relevante sobre el proveedor.`,
          web: 'https://ejemplo.com',
          ubicacion: 'Madrid, España',
          contacto: 'Persona de contacto',
          email: 'contacto@ejemplo.com',
          telefono: '+34 123 456 789'
        };
        
        setResultadoBusquedaIA(resultado);
        setCargandoBusquedaIA(false);
      }, 2000);
    } catch (error) {
      console.error('Error en búsqueda IA:', error);
      setCargandoBusquedaIA(false);
    }
  };
  
  // Guardar proveedor de IA
  const guardarProveedorIA = (resultado) => {
    if (!resultado) return;
    
    // Pasar al formulario para completar
    setProveedorEditar({
      nombre: resultado.nombre,
      servicio: resultado.servicio,
      ubicacion: resultado.ubicacion,
      contacto: resultado.contacto,
      email: resultado.email,
      telefono: resultado.telefono,
      web: resultado.web,
      notas: resultado.descripcion,
      estado: 'Nuevo',
      favorito: false
    });
    
    // Cerrar modal IA y abrir formulario
    setModalAIVisible(false);
    setModalFormularioVisible(true);
  };
  
  // Determinar contenido principal
  let contenidoPrincipal;
  
  if (error) {
    contenidoPrincipal = (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  } else if (cargando) {
    contenidoPrincipal = (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  } else if (proveedorSeleccionado) {
    // Vista detalle del proveedor
    contenidoPrincipal = (
      <ProveedorDetalle
        proveedor={proveedorSeleccionado}
        comunicaciones={comunicaciones}
        onCerrar={cerrarDetalle}
        onEditar={editarProveedor}
        onNuevaComunicacion={nuevaComunicacion}
      />
    );
  } else {
    // Lista de proveedores
    contenidoPrincipal = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {proveedoresFiltrados.length > 0 ? (
          proveedoresFiltrados.map(proveedor => (
            <ProveedorCardNuevo
              key={proveedor.id}
              proveedor={proveedor}
              onClick={verDetalleProveedor}
              onToggleFavorito={toggleFavorito}
              onEditar={() => editarProveedor(proveedor)}
              onEliminar={eliminarProveedor}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No hay proveedores</h3>
            <p className="mt-1 text-sm text-gray-500">
              {textoBusqueda ? 'No se encontraron resultados para tu búsqueda.' : 'Comienza añadiendo un nuevo proveedor.'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setModalFormularioVisible(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Añadir proveedor
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Proveedores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra todos los proveedores para tu boda
          </p>
        </div>
        
        {!proveedorSeleccionado && (
          <div className="mt-4 sm:mt-0 sm:ml-16 flex space-x-3">
            <button
              onClick={() => setModalAIVisible(true)}
              data-testid="open-ai-search"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Sparkles className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Buscar con IA
            </button>
            <button
              onClick={() => setModalFormularioVisible(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Añadir proveedor
            </button>
          </div>
        )}
      </div>
      
      {/* Filtros solo visibles si no hay proveedor seleccionado */}
      {!proveedorSeleccionado && (
        <ProveedorFiltro 
          filtroActivo={filtroActivo}
          onCambioFiltro={cambiarFiltro}
          textoBusqueda={textoBusqueda}
          onCambioTexto={cambiarTextoBusqueda}
          onBuscar={buscar}
        />
      )}
      
      {/* Contenido principal */}
      {contenidoPrincipal}
      
      {/* Modales */}
      <ProveedorFormModal
        visible={modalFormularioVisible}
        onClose={() => {
          setModalFormularioVisible(false);
          setProveedorEditar(null);
        }}
        onGuardar={guardarProveedor}
        proveedorEditar={proveedorEditar}
      />
      
      <AIBusquedaModal
        visible={modalAIVisible}
        onClose={() => {
          setModalAIVisible(false);
          setResultadoBusquedaIA(null);
        }}
        onBuscar={buscarConIA}
        onGuardar={guardarProveedorIA}
        resultado={resultadoBusquedaIA}
        cargando={cargandoBusquedaIA}
      />
    </div>
  );
};

export default GestionProveedores;
