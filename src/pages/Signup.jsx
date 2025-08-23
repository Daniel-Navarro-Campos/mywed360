import React, { useState } from 'react';
import { useUserContext } from '../context/UserContext'; // Legacy - mantener durante migración
import { useAuth } from '../hooks/useAuthUnified'; // Nuevo sistema
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('particular');
  const [error, setError] = useState('');
  // Sistema legacy (mantener durante migración)
  const { signup } = useUserContext();
  
  // Nuevo sistema unificado
  const { register } = useAuth();
  
  // Usar el nuevo sistema como principal, con fallback al legacy
  const authSignup = register || signup;
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await authSignup(email, password, role);
      if (result && !result.success) {
        throw new Error(result.error?.message || 'Error en el registro');
      }
      navigate('/home');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--color-bg)]">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        <h2 className="text-2xl mb-4">Crear cuenta</h2>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border p-2 w-full mb-4"
        >
          <option value="particular">Particular</option>
          <option value="planner">Wedding Planner</option>
          <option value="assistant">Ayudante</option>
        </select>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          className="bg-[var(--color-primary)] text-[color:var(--color-surface)] px-4 py-2 rounded w-full hover:bg-[var(--color-accent)] transition-colors"
        >
          Registrarse
        </button>
        <p className="mt-4 text-sm">
          ¿Ya tienes cuenta? <Link to="/" className="text-[var(--color-primary)] hover:underline">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
