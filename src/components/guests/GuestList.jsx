import React, { useMemo, useCallback } from 'react';
import { User, Phone, Mail, Edit2, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '../ui';
import useTranslations from '../../hooks/useTranslations';

/**
 * Lista optimizada de invitados con filtrado y acciones
 * Componente memoizado para mejor rendimiento
 */
const GuestList = React.memo(({ 
  guests = [], 
  searchTerm = '', 
  statusFilter = '', 
  tableFilter = '',
  onEdit,
  onDelete,
  onInviteWhatsApp,
  onInviteEmail,
  isLoading = false
}) => {
  const { t, wedding, format } = useTranslations();

  // Filtrado optimizado con useMemo
  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const matchesSearch = !searchTerm || 
        guest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.phone?.includes(searchTerm);
      
      const matchesStatus = !statusFilter || 
        guest.status === statusFilter ||
        guest.response === statusFilter;
      
      const matchesTable = !tableFilter || 
        guest.table?.toString().includes(tableFilter);
      
      return matchesSearch && matchesStatus && matchesTable;
    });
  }, [guests, searchTerm, statusFilter, tableFilter]);

  // Estadísticas memoizadas
  const stats = useMemo(() => {
    const confirmed = guests.filter(g => g.status === 'confirmed' || g.response === 'Sí').length;
    const pending = guests.filter(g => g.status === 'pending' || g.response === 'Pendiente').length;
    const declined = guests.filter(g => g.status === 'declined' || g.response === 'No').length;
    const totalCompanions = guests.reduce((sum, g) => sum + (parseInt(g.companion, 10) || 0), 0);
    
    return {
      total: guests.length,
      confirmed,
      pending,
      declined,
      totalAttendees: confirmed + totalCompanions
    };
  }, [guests]);

  // Funciones de acción memoizadas
  const handleEdit = useCallback((guest) => {
    onEdit?.(guest);
  }, [onEdit]);

  const handleDelete = useCallback((guest) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${guest.name}?`)) {
      onDelete?.(guest);
    }
  }, [onDelete]);

  const handleWhatsApp = useCallback((guest) => {
    onInviteWhatsApp?.(guest);
  }, [onInviteWhatsApp]);

  const handleEmail = useCallback((guest) => {
    onInviteEmail?.(guest);
  }, [onInviteEmail]);

  // Función para obtener el color del estado
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'confirmed':
      case 'Sí':
        return 'text-green-600 bg-green-100';
      case 'declined':
      case 'No':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando invitados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">{t('guests.totalGuests')}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          <div className="text-sm text-gray-600">{t('guests.confirmedGuests')}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">{t('guests.pendingGuests')}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-purple-600">{stats.totalAttendees}</div>
          <div className="text-sm text-gray-600">Total asistentes</div>
        </div>
      </div>

      {/* Lista de invitados */}
      {filteredGuests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron invitados
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter || tableFilter
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Añade tu primer invitado para comenzar'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Vista de escritorio */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invitado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mesa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acompañantes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User size={20} className="text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {guest.name}
                            </div>
                            {guest.dietaryRestrictions && (
                              <div className="text-xs text-orange-600">
                                Restricciones dietéticas
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{guest.email}</div>
                        <div className="text-sm text-gray-500">{guest.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(guest.status || guest.response)}`}>
                          {wedding.guestStatus(guest.status) || guest.response}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {guest.table || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {guest.companion || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {guest.phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWhatsApp(guest)}
                              title="Invitar por WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </Button>
                          )}
                          {guest.email && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEmail(guest)}
                              title="Invitar por email"
                            >
                              <Mail size={16} />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(guest)}
                            title="Editar invitado"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(guest)}
                            title="Eliminar invitado"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vista móvil */}
          <div className="md:hidden space-y-4">
            {filteredGuests.map((guest) => (
              <div key={guest.id} className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                      <User size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{guest.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(guest.status || guest.response)}`}>
                        {wedding.guestStatus(guest.status) || guest.response}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {guest.email && (
                    <div className="flex items-center">
                      <Mail size={14} className="mr-2" />
                      {guest.email}
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center">
                      <Phone size={14} className="mr-2" />
                      {guest.phone}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Mesa: {guest.table || '-'}</span>
                    <span>Acompañantes: {guest.companion || 0}</span>
                  </div>
                  {guest.dietaryRestrictions && (
                    <div className="text-orange-600 text-xs">
                      Restricciones dietéticas
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  {guest.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWhatsApp(guest)}
                    >
                      <MessageCircle size={16} />
                    </Button>
                  )}
                  {guest.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEmail(guest)}
                    >
                      <Mail size={16} />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(guest)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(guest)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

GuestList.displayName = 'GuestList';

export default GuestList;
