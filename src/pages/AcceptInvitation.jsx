import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { acceptInvitation } from '../services/WeddingService';
import { useAuth } from '../hooks/useAuthUnified';

export default function AcceptInvitation() {
  const { code } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Procesando...');

  useEffect(() => {
    if (!code || !currentUser) return;
    acceptInvitation(code, currentUser.uid)
      .then((weddingId) => {
        setStatus('¡Invitación aceptada! Redirigiendo...');
        setTimeout(() => navigate(`/bodas/${weddingId}`), 2000);
      })
      .catch((err) => {
        console.error(err);
        setStatus('No se pudo aceptar la invitación: ' + err.message);
      });
  }, [code, currentUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded shadow p-6 max-w-sm text-center">
        <p>{status}</p>
      </div>
    </div>
  );
}
