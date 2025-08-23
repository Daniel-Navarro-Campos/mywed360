import React, { useState, useEffect } from 'react';
import { useUserContext } from '../context/UserContext'; // Legacy - mantener durante migración
import { useAuth } from '../hooks/useAuthUnified'; // Nuevo sistema
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  // Cargar email guardado si existe
  const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('lovenda_login_email') || '' : '';
  const [username, setUsername] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(!!savedEmail);
  // Sistema legacy (mantener durante migración)
  const { login, isAuthenticated, loading } = useUserContext();
  
  // Nuevo sistema unificado
  const { login: unifiedLogin, isAuthenticated: unifiedAuth, isLoading } = useAuth();
  
  // Usar el nuevo sistema como principal, con fallback al legacy
  const authLogin = unifiedLogin || login;
  const authStatus = unifiedAuth !== undefined ? unifiedAuth : isAuthenticated;
  const authLoading = isLoading !== undefined ? isLoading : loading;
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && authStatus) {
      navigate('/home');
    }
  }, [authLoading, authStatus, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await authLogin(username, password, remember);
      if (result && !result.success) {
        throw new Error(result.error?.message || 'Error de autenticación');
      }
      // Guarda o elimina el email según la preferencia
      if (remember) {
        localStorage.setItem('lovenda_login_email', username);
      } else {
        localStorage.removeItem('lovenda_login_email');
      }
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
          placeholder="Nombre de usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 w-full mb-4"
          data-testid="email-input"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full mb-4"
          data-testid="password-input"
        />
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => {
              setRemember(e.target.checked);
              if (!e.target.checked) {
                localStorage.removeItem('lovenda_login_email');
              }
            }}
              className="mr-2"
            />
            <label htmlFor="remember" className="text-sm">Recuérdame</label>
          </div>
          <button
          type="submit"
          className="bg-[var(--color-primary)] text-[color:var(--color-surface)] px-4 py-2 rounded w-full hover:bg-[var(--color-accent)] transition-colors"
          data-testid="login-button"
        >
          Entrar
        </button>
        <p className="mt-4 text-sm">¿No tienes cuenta? <Link to="/signup" className="text-[var(--color-primary)] hover:underline">Regístrate</Link></p>
      </form>
    </div>
  );
}
