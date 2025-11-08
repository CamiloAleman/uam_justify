// src/pages/admin/CreateFaculty.jsx
import React, { useState } from 'react';
import axios from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../../Pages/Layout';

export default function CreateFaculty(){
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await axios.post('/facultades/', { nombre, descripcion });
      setMsg('Facultad creada.');
      nav('/admin'); // o volver al listado
    } catch (err) {
      console.error(err);
      setMsg(err?.response?.data || 'Error creando facultad.');
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <h2 className="text-xl font-semibold mb-4">Crear Facultad</h2>
        {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input value={nombre} onChange={e=>setNombre(e.target.value)} required className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">Descripción</label>
            <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <button disabled={loading} className="bg-[#0099a8] text-white px-4 py-2 rounded">{loading ? 'Creando...' : 'Crear Facultad'}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
