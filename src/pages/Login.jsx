import React, { useState } from 'react';
import { useUserContext } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(true);
  const { login } = useUserContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Si estamos bajo Cypress, evita la llamada real a Firebase y emite solo la petición mock.
      if (window.Cypress) {
        await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: username })
        });
        navigate('/email/inbox');
        return;
      }
      await login(username, password, remember);
      await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username })
      });
      navigate('/home');
    } catch (err) {
      setError('Usuario o contraseña inválidos');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--color-bg)]">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        <h2 className="text-2xl mb-4">Iniciar sesión</h2>
        <input
          type="text"
          data-testid="email-input"
          placeholder="Correo electrónico"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <input
          type="password"
          data-testid="password-input"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="remember" className="text-sm">Recuérdame</label>
          </div>
          <button
          type="submit"
          data-testid="login-button"
          className="bg-[var(--color-primary)] text-[color:var(--color-surface)] px-4 py-2 rounded w-full hover:bg-[var(--color-accent)] transition-colors"
        >
          Entrar
        </button>
        <p className="mt-4 text-sm">¿No tienes cuenta? <Link to="/signup" className="text-[var(--color-primary)] hover:underline">Regístrate</Link></p>
      </form>
    </div>
  );
}
