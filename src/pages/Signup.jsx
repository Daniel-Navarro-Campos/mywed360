import React, { useState } from 'react';
import { useUserContext } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useUserContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signup(email, password);
      navigate('/home');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-pastel-yellow">
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
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          className="bg-pastel-blue text-white px-4 py-2 rounded w-full hover:bg-pastel-green transition-colors"
        >
          Registrarse
        </button>
        <p className="mt-4 text-sm">
          ¿Ya tienes cuenta? <Link to="/" className="text-pastel-blue hover:underline">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
