import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import { Plus, Sparkles } from 'lucide-react';

// Importar componentes modulares
import ProveedorList from '../components/proveedores/ProveedorList';
import ProveedorDetail from '../components/proveedores/ProveedorDetail';
import ProveedorCard from '../components/proveedores/ProveedorCard';
import ProveedorForm from '../components/proveedores/ProveedorForm';
import ReservationModal from '../components/proveedores/ReservationModal';
import AISearchModal from '../components/proveedores/ai/AISearchModal';

import TrackingModal from '../components/proveedores/tracking/TrackingModal';

// Importar hooks personalizados
import useProveedores from '../hooks/useProveedores';
import useAISearch from '../hooks/useAISearch';
import { useAuth } from '../hooks/useAuthUnified';

const Proveedores = () => {
  // Diagnóstico: verificar que la versión nueva se carga en el navegador
  console.log('%c[Lovenda] ProveedoresNuevo cargado', 'color: #10B981; font-weight: bold;');
  // Obtener funcionalidad de los hooks personalizados
  const {
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
    tab,
    setSearchTerm,
    setServiceFilter,
    setStatusFilter,
    setDateFrom,
    setDateTo,
    setTab,
    setSelectedProvider,
    loadProviders,
    addProvider,
    updateProvider,
    deleteProvider,
    toggleFavoriteProvider,
    toggleSelectProvider,
    clearSelection,
    clearFilters
  } = useProveedores();

  const {
    results: aiResults,
    loading: aiLoading,
    searchProviders,
    clearResults
  } = useAISearch();

  const { user } = useAuth();

  // Estado local para modales y pestañas
  const [showNewProviderForm, setShowNewProviderForm] = useState(false);
  const [showEditProviderForm, setShowEditProviderForm] = useState(false);
  const [showAISearchModal, setShowAISearchModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [currentTrackingItem, setCurrentTrackingItem] = useState(null);
  const [trackingFilter, setTrackingFilter] = useState('todos');

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      loadProviders();
    }
  }, [user, loadProviders]);

  // Funciones para manejar la visualización de modales
  const handleViewDetail = (provider) => {
    setSelectedProvider(provider);
    setActiveTab('info');
  };

  const handleNewProvider = () => {
    setShowNewProviderForm(true);
  };

  const handleEditProvider = () => {
    setShowEditProviderForm(true);
  };

  const handleReserveProvider = (provider) => {
    setSelectedProvider(provider);
    setShowReservationModal(true);
  };

  const handleCloseDetail = () => {
    setSelectedProvider(null);
  };

  const handleOpenAISearch = () => {
    setShowAISearchModal(true);
  };

  const handleAISelect = (provider, action) => {
    if (action === 'view') {
      setSelectedProvider(provider);
      setShowAISearchModal(false);
    } else if (action === 'add') {
      addProvider(provider);
      setShowAISearchModal(false);
    } else if (action === 'select') {
      addProvider({...provider, status: 'Seleccionado'});
      setShowAISearchModal(false);
    }
  };

  const handleSubmitProvider = async (providerData) => {
    if (showEditProviderForm && selectedProvider) {
      await updateProvider(selectedProvider.id, providerData);
      setShowEditProviderForm(false);
    } else {
      await addProvider(providerData);
      setShowNewProviderForm(false);
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      await deleteProvider(providerId);
    }
  };

  const handleSubmitReservation = async (reservationData) => {
    // En una implementación real, esto guardaría la reserva en la base de datos
    console.log('Reserva creada:', reservationData);
    // Actualizar el estado del proveedor a 'Contactado' si no está ya confirmado/seleccionado
    if (selectedProvider && 
        selectedProvider.status !== 'Confirmado' && 
        selectedProvider.status !== 'Seleccionado') {
      // Guardar reserva en Firestore y estado local
      await addReservation(selectedProvider.id, reservationData);

      await updateProvider(selectedProvider.id, { 
        ...selectedProvider, 
        status: 'Contactado',
        date: reservationData.date
      });
    }
    setShowReservationModal(false);
  };

  const handleViewTrackingDetails = (trackingItem) => {
    setCurrentTrackingItem(trackingItem);
    setShowTrackingModal(true);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Proveedores</h1>
          
          <div className="flex space-x-2">
            <Button onClick={handleOpenAISearch} className="flex items-center">
              <Sparkles size={16} className="mr-1" /> Búsqueda IA
            </Button>
            <Button onClick={handleNewProvider} className="flex items-center">
              <Plus size={16} className="mr-1" /> Nuevo Proveedor
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 bg-red-50 border border-red-200">
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Cargando proveedores...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Lista de proveedores con filtros */}
            <ProveedorList
              providers={filteredProviders}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              serviceFilter={serviceFilter}
              setServiceFilter={setServiceFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              clearFilters={clearFilters}
              handleViewDetail={handleViewDetail}
              tab={tab}
              setTab={setTab}
              selected={selectedProviderIds}
              toggleSelect={toggleSelectProvider}
              toggleFavorite={toggleFavoriteProvider}
            />

            {/* Acciones con proveedores seleccionados */}
            {selectedProviderIds.length > 0 && (
              <Card className="bg-blue-50 border border-blue-100">
                <div className="flex justify-between items-center">
                  <p className="text-blue-800">
                    {selectedProviderIds.length} {selectedProviderIds.length === 1 ? 'proveedor seleccionado' : 'proveedores seleccionados'}
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      Deseleccionar todo
                    </Button>
                    <Button size="sm">
                      Acción masiva
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Vista detallada de proveedor */}
        {selectedProvider && (
          <ProveedorDetail
            provider={selectedProvider}
            onClose={handleCloseDetail}
            onEdit={handleEditProvider}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Modal para añadir nuevo proveedor */}
        {showNewProviderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <ProveedorForm
              onSubmit={handleSubmitProvider}
              onCancel={() => setShowNewProviderForm(false)}
            />
          </div>
        )}

        {/* Modal para editar proveedor */}
        {showEditProviderForm && selectedProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <ProveedorForm
              initialData={selectedProvider}
              onSubmit={handleSubmitProvider}
              onCancel={() => setShowEditProviderForm(false)}
            />
          </div>
        )}

        {/* Modal de búsqueda con IA */}
        <AISearchModal
          isOpen={showAISearchModal}
          onClose={() => setShowAISearchModal(false)}
          onSearch={searchProviders}
          onSelect={handleAISelect}
          isLoading={aiLoading}
        />

        {/* Modal de reserva */}
        {showReservationModal && selectedProvider && (
          <ReservationModal
            provider={selectedProvider}
            onClose={() => setShowReservationModal(false)}
            onSubmit={handleSubmitReservation}
          />
        )}

        {/* Modal de seguimiento */}
        {showTrackingModal && currentTrackingItem && (
          <TrackingModal
            isOpen={showTrackingModal}
            onClose={() => setShowTrackingModal(false)}
            trackingItem={currentTrackingItem}
          />
        )}

        {/* Proveedores seleccionados */}
        {selectedProviderIds.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Proveedores seleccionados</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedProviderIds.map(pid => {
                const provider = providers.find(p => p.id === pid);
                if(!provider) return null;
                return (
                  <ProveedorCard
                    key={pid}
                    provider={provider}
                    isSelected={true}
                    onToggleSelect={() => toggleSelectProvider(pid)}
                    onViewDetail={() => handleViewDetail(provider)}
                    onToggleFavorite={toggleFavoriteProvider}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Proveedores;
