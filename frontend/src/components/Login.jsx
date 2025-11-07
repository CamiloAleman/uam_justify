import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../Pages/Layout';

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
      navigate('/');  // redirige después del login
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
    <Layout>
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-semibold text-center text-[#0099a8] mb-6">
            Portal de Justificaciones UAM
          </h2>
          {error && (
            <div className="bg-red-100 text-red-600 border border-red-300 rounded-md p-2 mb-4 text-sm text-center">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm mb-1">Correo institucional</label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                placeholder="ejemplo@uam.edu.ni"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-md text-white font-medium transition-colors ${
                loading
                  ? 'bg-[#0099a8]/70 cursor-not-allowed'
                  : 'bg-[#0099a8] hover:bg-[#0099a8]'
              }`}
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
          <p className="text-center text-gray-500 text-xs mt-6">
            © {new Date().getFullYear()} Universidad Americana (UAM) — Proyecto UAM Justify
          </p>
        </div>
      </div>
    </Layout>
  );
}
