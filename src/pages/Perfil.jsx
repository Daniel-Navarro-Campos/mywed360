import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui';
import { Button } from '../components/ui';
import { Input } from '../components/ui';
import { useAuth } from '../hooks/useAuthUnified';
import { toast } from 'react-toastify';
import useRoles from '../hooks/useRoles';
import { Users, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { auth, db } from '../firebaseConfig'; // respaldo para UID
import 'react-toastify/dist/ReactToastify.css';
import { invitePlanner, getWeddingIdForOwner } from '../services/WeddingService';
import { subscribeSyncState, getSyncState } from '../services/SyncService';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// ---------------------- NUEVO PERFIL -----------------------
function Perfil() {
  const [subscription, setSubscription] = useState('free');
  const [account, setAccount] = useState({
    name: '',
    linkedAccount: '',
    planner: '',
    helpers: '',
    email: '',
    password: '',
  });
  const [weddingInfo, setWeddingInfo] = useState({
    coupleName: '',
    celebrationPlace: '',
    banquetPlace: '',
    schedule: '',
    giftAccount: '',
    numGuests: '',
  });
  // Campo de texto amplio para notas importantes de la boda
  const [importantInfo, setImportantInfo] = useState('');
  const [syncStatus, setSyncStatus] = useState(getSyncState());
  const [plannerEmail, setPlannerEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Sincronizar número de invitados automáticamente
  // Escucha cambios en la lista de invitados en tiempo real
  useEffect(() => {
    function updateGuestCount() {
      let guests = [];
      try {
        guests = JSON.parse(localStorage.getItem('lovendaGuests'));
        if (!Array.isArray(guests)) guests = null;
      } catch { guests = null; }
      if (!guests) {
        guests = [
          { id: 1, name: 'Ana García', phone: '123456789', address: 'Calle Sol 1', companion: 1, table: '5', response: 'Sí' },
          { id: 2, name: 'Luis Martínez', phone: '987654321', address: 'Av. Luna 3', companion: 0, table: '', response: 'Pendiente' },
        ];
      }
      const total = guests.reduce((acc, g) => acc + 1 + (parseInt(g.companion)||0), 0);
      setWeddingInfo(w => ({ ...w, numGuests: total }));
    }
    updateGuestCount(); // inicial
    window.addEventListener('lovenda-guests', updateGuestCount);
    return () => window.removeEventListener('lovenda-guests', updateGuestCount);
   }, []);

  // Escucha notas importantes agregadas desde el chat
  useEffect(() => {
    function updateNotes() {
      setImportantInfo(loadData('importantNotes'));
    }
    window.addEventListener('lovenda-important-note', updateNotes);
    return () => window.removeEventListener('lovenda-important-note', updateNotes);
  }, []);

  const [billing, setBilling] = useState({
    fullName: '',
    address: '',
    zip: '',
    city: '',
    state: '',
    country: '',
    dni: '',
  });

  const { userProfile, user: authUser } = useAuth();
  // UID de respaldo usando Firebase Auth (en caso de que useAuth no tenga usuario)
  const fallbackUid = authUser?.uid || auth.currentUser?.uid || null;
  const weddingId = userProfile?.weddingId || '';
  const { roles: collaborators, loading: rolesLoading, assignRole, removeRole } = useRoles(weddingId);

  const handleAccountChange = (e) => setAccount({ ...account, [e.target.name]: e.target.value });
  const handleWeddingChange = (e) => setWeddingInfo({ ...weddingInfo, [e.target.name]: e.target.value });
  const handleBillingChange = (e) => setBilling({ ...billing, [e.target.name]: e.target.value });

  const handleCreateInvite = async () => {

    if (!plannerEmail) return;
    let wid = weddingId;
    const effectiveUid = fallbackUid;
  if (!wid && !effectiveUid) {
      toast.error('Tu sesión aún no está lista. Espera unos segundos e inténtalo de nuevo.');
      return;
    }
    if (!wid) {
      // intentar obtener la boda directamente de Firestore por owner
      wid = await getWeddingIdForOwner(effectiveUid);
      if (!wid) {
        toast.error('No se encontró tu boda. Completa el tutorial o contacta soporte.');
        return;
      }
    }
    try {
      setInviteLoading(true);
      const code = await invitePlanner(wid, plannerEmail.trim().toLowerCase());
      const link = `${window.location.origin}/invitation/${code}`;
      setInviteLink(link);
      try {
        await navigator.clipboard.writeText(link);
        toast.success('Enlace copiado al portapapeles');
      } catch {
        toast.success('Enlace generado');
      }
      setPlannerEmail('');
    } catch (err) {
      console.error(err);
      toast.error('Error creando invitación');
    } finally {
      setInviteLoading(false);
    }
  };

  const saveProfile = async () => {
    const uid = fallbackUid;
    if (!uid) {
      toast.error('No se pudo determinar tu usuario.');
      return;
    }

    try {
      // 1. Datos globales del usuario
      await setDoc(
        doc(db, 'users', uid),
        {
          account,
          subscription,
          billing,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 2. Datos específicos de la boda
      if (weddingId) {
        await updateDoc(doc(db, 'weddings', weddingId), {
          weddingInfo: { ...weddingInfo, importantInfo },
        });
      }

      toast.success('Perfil guardado');
    } catch (error) {
      console.error('Error guardando perfil:', error);
      toast.error('Error al guardar el perfil');
    }
  };

  useEffect(() => {
    // Suscribirse a cambios en el estado de sincronización
    const unsubscribe = subscribeSyncState(setSyncStatus);
    
    // Cargar datos con la nueva estrategia híbrida
    const loadProfileData = async () => {
      const uid = fallbackUid;
      if (!uid) return;
      try {
        // Datos globales
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) {
          const d = userSnap.data();
          if (d.account) setAccount(d.account);
          if (d.subscription) setSubscription(d.subscription);
          if (d.billing) setBilling(d.billing);
        }

        // Datos de la boda
        if (weddingId) {
          const wedSnap = await getDoc(doc(db, 'weddings', weddingId));
          if (wedSnap.exists() && wedSnap.data().weddingInfo) {
            const wi = wedSnap.data().weddingInfo;
            setWeddingInfo({
              coupleName: wi.coupleName || '',
              celebrationPlace: wi.celebrationPlace || '',
              banquetPlace: wi.banquetPlace || '',
              schedule: wi.schedule || '',
              giftAccount: wi.giftAccount || '',
              numGuests: wi.numGuests || '',
            });
            if (wi.importantInfo) setImportantInfo(wi.importantInfo);
          }
        }
      } catch (error) {
        console.error('Error cargando datos del perfil:', error);
        toast.error('Error al cargar el perfil');
      }
    };
    
    loadProfileData();
    
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Perfil</h1>
        
        {/* Indicador de estado de sincronización */}
        <div className="flex items-center text-sm">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            !syncStatus.isOnline ? 'bg-red-500' : 
            syncStatus.isSyncing ? 'bg-yellow-500' :
            syncStatus.pendingChanges ? 'bg-orange-500' : 'bg-green-500'
          }`}></div>
          <span>
            {!syncStatus.isOnline ? 'Sin conexión (modo offline)' : 
             syncStatus.isSyncing ? 'Sincronizando...' : 
             syncStatus.pendingChanges ? 'Cambios pendientes' : 'Sincronizado'}
          </span>
        </div>
      </div>

      {/* Suscripción */}
      <Card className="space-y-4">
        <h2 className="text-lg font-medium">Tipo de suscripción</h2>
        <div className="flex gap-4">
          <Button variant={subscription === 'free' ? 'primary' : 'outline'} onClick={() => setSubscription('free')}>Gratis</Button>
          <Button variant={subscription === 'premium' ? 'primary' : 'outline'} onClick={() => setSubscription('premium')}>Premium</Button>
        </div>
      </Card>

      {/* Información de la cuenta */}
      <Card className="space-y-4">
        <h2 className="text-lg font-medium">Información de la cuenta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre" name="name" value={account.name} onChange={handleAccountChange} />
          <Input label="Cuenta vinculada" name="linkedAccount" value={account.linkedAccount} onChange={handleAccountChange} />
          <Input label="Wedding planner vinculada" name="planner" value={account.planner} onChange={handleAccountChange} />
          <Input label="Ayudantes vinculados" name="helpers" value={account.helpers} onChange={handleAccountChange} />
          <Input label="Correo electrónico" name="email" type="email" value={account.email} onChange={handleAccountChange} />
          <Input label="Reestablecer contraseña" name="password" type="password" value={account.password} onChange={handleAccountChange} />
        </div>
        <div className="text-right">
          <Button onClick={saveProfile}>Guardar</Button>
        </div>
      </Card>

      {/* Información de la boda */}
      <Card className="space-y-4">
        <h2 className="text-lg font-medium">Información de la boda</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre de la pareja" name="coupleName" value={weddingInfo.coupleName} onChange={handleWeddingChange} />
          <Input label="Lugar de la celebración" name="celebrationPlace" value={weddingInfo.celebrationPlace} onChange={handleWeddingChange} />
          <Input label="Lugar del banquete" name="banquetPlace" value={weddingInfo.banquetPlace} onChange={handleWeddingChange} />
          <Input label="Horario" name="schedule" value={weddingInfo.schedule} onChange={handleWeddingChange} />
          <Input label="Cuenta de regalos" name="giftAccount" value={weddingInfo.giftAccount} onChange={handleWeddingChange} />
          <Input label="Número de invitados" name="numGuests" type="number" value={weddingInfo.numGuests} readOnly />
        </div>
        <div className="text-right">
          <Button onClick={saveProfile}>Guardar</Button>
        </div>
      </Card>

      {/* Información importante de la boda */}
      <Card className="space-y-4">
        <h2 className="text-lg font-medium">Información importante de la boda</h2>
        <textarea
          className="w-full min-h-[150px] border rounded-md p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Datos o detalles clave que la IA o el usuario quieran guardar (ej.: alergias, proveedores críticos, horarios especiales, etc.)"
          value={importantInfo}
          onChange={(e)=>setImportantInfo(e.target.value)}
        />
        <div className="text-right">
          <Button onClick={saveProfile}>Guardar</Button>
        </div>
      </Card>

      {/* Colaboradores */}
      <Card className="space-y-4">
        <h2 className="text-lg font-medium flex items-center"><Users className="w-5 h-5 mr-2" />Colaboradores</h2>
          {/* Invitación a wedding planner */}
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
            <Input
              placeholder="Email del planner"
              value={plannerEmail}
              onChange={(e)=>setPlannerEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCreateInvite} disabled={inviteLoading || !plannerEmail}>
              {inviteLoading ? 'Creando...' : 'Crear enlace'}
            </Button>
          </div>
          {inviteLink && (
            <p className="text-sm text-green-700 break-all mb-4 select-all">
              Enlace generado: <span className="underline">{inviteLink}</span>
            </p>
          )}
        {rolesLoading ? (
          <p>Cargando...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Usuario</th>
                <th className="text-left p-2">Rol</th>
                <th className="p-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map(c => (
                <tr key={c.uid} className="border-b">
                  <td className="p-2">{c.email || c.uid}</td>
                  <td className="p-2">
                    <select
                      value={c.role}
                      onChange={(e)=>assignRole(c.uid, e.target.value)}
                      disabled={c.role==='owner'}
                      className="border rounded px-2 py-1 text-sm">
                      <option value="owner">Pareja</option>
                      <option value="planner">Wedding Planner</option>
                      <option value="helper">Ayudante</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    {c.role!=='owner' && (
                      <button onClick={()=>removeRole(c.uid)} className="text-red-500 hover:text-red-700">
                        <X size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Datos de facturación */}
      <Card className="space-y-4">
        <h2 className="text-lg font-medium">Datos de facturación</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre completo" name="fullName" value={billing.fullName} onChange={handleBillingChange} />
          <Input label="Dirección" name="address" value={billing.address} onChange={handleBillingChange} />
          <Input label="CP" name="zip" value={billing.zip} onChange={handleBillingChange} />
          <Input label="Localidad" name="city" value={billing.city} onChange={handleBillingChange} />
          <Input label="Provincia" name="state" value={billing.state} onChange={handleBillingChange} />
          <Input label="País" name="country" value={billing.country} onChange={handleBillingChange} />
          <Input label="DNI" name="dni" value={billing.dni} onChange={handleBillingChange} />
        </div>
        <div className="text-right">
          <Button onClick={saveProfile}>Guardar</Button>
        </div>
      </Card>
    </div>
  );
}

export default Perfil;

// -----------------------------------------------------------

function LegacyPerfil() {
  const navigate = useNavigate();
  const { 
    user, 
    updateProfile, 
    sendVerificationEmail, 
    sendPasswordReset, 
    updateUserEmail,
    updateUserPassword,
    reauthenticate,
    currentUser
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  // Estado para mostrar/ocultar menú lateral en pantallas pequeñas
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ 
    displayName: '', 
    email: '', 
    weddingName: '', 
    logoUrl: '', 
    partnerName: '', 
    partnerEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        displayName: user.displayName || '',
        email: user.email || '',
        weddingName: user.weddingName || '',
        logoUrl: user.logoUrl || '',
        partnerName: user.partnerName || '',
        partnerEmail: user.partnerEmail || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile({
        displayName: form.displayName,
        weddingName: form.weddingName,
        logoUrl: form.logoUrl,
        partnerName: form.partnerName,
        partnerEmail: form.partnerEmail
      });
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error(`Error al actualizar el perfil: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    setIsLoading(true);
    try {
      await updateUserPassword(form.newPassword);
      toast.success('Contraseña actualizada correctamente');
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error) {
      toast.error(`Error al actualizar la contraseña: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = async () => {
    try {
      await sendVerificationEmail();
      toast.success('Correo de verificación enviado. Por favor revisa tu bandeja de entrada.');
    } catch (error) {
      toast.error(`Error al enviar el correo de verificación: ${error.message}`);
    }
  };

  const handlePasswordReset = async () => {
    if (!form.email) {
      toast.error('Por favor ingresa tu correo electrónico');
      return;
    }
    try {
      await sendPasswordReset(form.email);
      toast.success('Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico');
    } catch (error) {
      toast.error(`Error al enviar el enlace de restablecimiento: ${error.message}`);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Configuración de Cuenta</h1>
      
      {/* Botón hamburguesa para móviles */}
      <button
        type="button"
        onClick={() => setMenuOpen(prev => !prev)}
        className="md:hidden mb-4 px-4 py-2 bg-blue-600 text-white rounded"
        aria-expanded={menuOpen}
        aria-controls="sidebar-menu"
      >
        {menuOpen ? 'Cerrar menú' : 'Menú'}
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div id="sidebar-menu" className={`${menuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
          <Card className="p-4">
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab('profile'); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  activeTab === 'profile' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Perfil
              </button>
              <button
                onClick={() => { setActiveTab('password'); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  activeTab === 'password' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Contraseña
              </button>
              <button
                onClick={() => { setActiveTab('email'); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  activeTab === 'email' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Correo Electrónico
              </button>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Información del Perfil</h2>
              <form onSubmit={handleProfileSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de Usuario
                    </label>
                    <Input
                      type="text"
                      name="displayName"
                      value={form.displayName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Boda
                    </label>
                    <Input
                      type="text"
                      name="weddingName"
                      value={form.weddingName}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL del Logo
                    </label>
                    <Input
                      type="url"
                      name="logoUrl"
                      value={form.logoUrl}
                      onChange={handleChange}
                      placeholder="https://ejemplo.com/logo.png"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Pareja
                    </label>
                    <Input
                      type="text"
                      name="partnerName"
                      value={form.partnerName}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo de la Pareja
                    </label>
                    <Input
                      type="email"
                      name="partnerEmail"
                      value={form.partnerEmail}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Cambiar Contraseña</h2>
              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña Actual
                    </label>
                    <Input
                      type="password"
                      name="currentPassword"
                      value={form.currentPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva Contraseña
                    </label>
                    <Input
                      type="password"
                      name="newPassword"
                      value={form.newPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <Input
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Correo Electrónico</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Estado de Verificación</p>
                      <p className="text-sm text-gray-600">
                        {user.emailVerified 
                          ? 'Tu correo electrónico ha sido verificado.' 
                          : 'Tu correo electrónico no ha sido verificado.'}
                      </p>
                    </div>
                    {!user.emailVerified && (
                      <Button 
                        onClick={handleSendVerification}
                        variant="outline"
                        disabled={isLoading}
                      >
                        Verificar Correo
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium mb-2">Restablecer Contraseña</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    ¿Olvidaste tu contraseña? Te enviaremos un enlace para restablecerla a tu correo electrónico.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="tu@email.com"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handlePasswordReset}
                      variant="outline"
                      disabled={isLoading}
                    >
                      Enviar Enlace
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
