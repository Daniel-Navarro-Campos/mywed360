import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

function RSVPConfirm() {
  const { token } = useParams();
  const [guest, setGuest] = useState(null);
  const [status, setStatus] = useState('accepted');
  const [companions, setCompanions] = useState(0);
  const [allergens, setAllergens] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchGuest = async () => {
      try {
        const res = await fetch(`/api/guests/${token}`);
        if (!res.ok) throw new Error('Invitado no encontrado');
        const data = await res.json();
        setGuest(data);
        setStatus(data.status === 'rejected' ? 'rejected' : 'accepted');
        setCompanions(data.companions || 0);
        setAllergens(data.allergens || '');
      } catch (err) {
        toast.error(err.message || 'Ha ocurrido un error');
      } finally {
        setLoading(false);
      }
    };
    fetchGuest();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/guests/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, companions: Number(companions), allergens })
      });
      if (!res.ok) throw new Error('Error enviando respuesta');
      toast.success('¡Respuesta registrada!');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || 'Ha ocurrido un error');
    }
  };

  if (loading) return <div className="p-6 text-center">Cargando…</div>;
  if (!guest) return <div className="p-6 text-center">Invitado no encontrado</div>;

  if (submitted) {
    return (
      <div className="p-6 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">¡Gracias, {guest.name}!</h1>
        <p>Hemos registrado tu respuesta. Nos vemos pronto.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Confirmación de asistencia</h1>
      <p className="mb-4">Hola {guest.name}, por favor confírmanos si podrás asistir.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-medium mr-4">¿Asistirás?</label>
          <label className="mr-4">
            <input type="radio" value="accepted" checked={status==='accepted'} onChange={()=>setStatus('accepted')} /> Sí
          </label>
          <label>
            <input type="radio" value="rejected" checked={status==='rejected'} onChange={()=>setStatus('rejected')} /> No
          </label>
        </div>
        <div>
          <label className="font-medium block mb-1">Número de acompañantes</label>
          <input type="number" min="0" value={companions} onChange={e=>setCompanions(e.target.value)} className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="font-medium block mb-1">Alergias o restricciones alimentarias</label>
          <textarea value={allergens} onChange={e=>setAllergens(e.target.value)} className="border rounded px-2 py-1 w-full" rows={3} />
        </div>
        <button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded">Enviar respuesta</button>
      </form>
    </div>
  );
}

export default RSVPConfirm;
