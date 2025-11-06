import React, { useState } from 'react';
import axios from '../api/axios';  // Your updated axios instance
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/token/', { correo_institucional: username, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
      //navigate('');  // Redirect to home/dashboard
      window.location.href = "http://127.0.0.1:8000/api/";
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Credenciales inválidas');
      } else {
        setError('Error del servidor. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '2rem auto' }}>
      <h2>Iniciar sesión</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Correo institucional</label><br />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="ejemplo@universidad.edu"
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Contraseña</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button style={{ marginTop: 12 }} type="submit" disabled={loading}>
          {loading ? 'Cargando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}