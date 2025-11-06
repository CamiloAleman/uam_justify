// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/token/', { username, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
      navigate('/'); // redirige a home o panel
    } catch (err) {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div style={{maxWidth:480, margin: '2rem auto'}}>
      <h2>Iniciar sesión</h2>
      {error && <div style={{color:'red'}}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Correo institucional</label><br/>
          <input value={username} onChange={(e)=>setUsername(e.target.value)} required />
        </div>
        <div style={{marginTop:8}}>
          <label>Contraseña</label><br/>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </div>
        <button style={{marginTop:12}} type="submit">Entrar</button>
      </form>
    </div>
  );
}
