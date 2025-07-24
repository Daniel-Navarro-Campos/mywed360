import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle, Send as SendIcon, Users } from 'lucide-react';
import Button from '../Button';
import { useAuth } from '../../hooks/useAuth';
import {
  createWedding,
  invitePartner,
  invitePlanner,
  acceptInvitation,
} from '../../services/WeddingService';

/**
 * Componente para vincular cuentas de boda y gestionar invitaciones.
 */
const WeddingAccountLink = () => {
  const { currentUser, userProfile, reloadUserProfile } = useAuth();
  const [weddingId, setWeddingId] = useState('');

  const [emailInvite, setEmailInvite] = useState('');
  const [role, setRole] = useState('partner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userProfile) {
      setWeddingId(userProfile.weddingId || '');
    }
  }, [userProfile]);

  const handleCreateWedding = async () => {
    try {
      setLoading(true);
      const wid = await createWedding(currentUser.uid);
      setWeddingId(wid);
      setSuccess('Boda creada correctamente.');
      await reloadUserProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!emailInvite) {
      setError('Introduce un correo.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      let code;
      if (role === 'partner') {
        code = await invitePartner(weddingId, emailInvite);
      } else {
        code = await invitePlanner(weddingId, emailInvite);
      }
      setSuccess(`Invitación enviada. Código: ${code}`);
      setEmailInvite('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!inviteCode) {
      setError('Introduce el código de invitación.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await acceptInvitation(inviteCode);
      setSuccess('Invitación aceptada correctamente.');
      setInviteCode('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-md font-medium mb-2 flex items-center">
        <Users className="w-4 h-4 mr-2" /> Vincular cuentas de boda
      </h3>

      {!weddingId ? (
        <div>
          <p className="text-gray-600 mb-3">Crea tu boda para poder invitar a tu pareja o wedding planner.</p>
          <Button onClick={handleCreateWedding} disabled={loading}>
            {loading ? 'Creando...' : 'Crear mi boda'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md border text-sm">
            <span className="font-medium">ID de tu boda:</span> {weddingId}
          </div>

          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo de la persona a invitar
            </label>
            <input
              type="email"
              id="invite-email"
              value={emailInvite}
              onChange={(e) => setEmailInvite(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border rounded-md">
              <option value="partner">Pareja (copropietario)</option>
              <option value="planner">Wedding Planner</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start text-sm">
              <AlertTriangle size={16} className="mr-2 mt-0.5" />
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start text-sm">
              <Check size={16} className="mr-2 mt-0.5" />
              {success}
            </div>
          )}

          <Button
            onClick={handleSendInvite}
            disabled={loading || !emailInvite}
            variant="default"
          >
            {loading ? 'Enviando...' : (
              <span className="flex items-center"><SendIcon size={16} className="mr-1" /> Enviar invitación</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default WeddingAccountLink;
