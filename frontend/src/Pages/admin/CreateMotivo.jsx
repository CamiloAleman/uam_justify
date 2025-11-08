// src/pages/admin/CreateMotivo.jsx
import React, {useState} from 'react';
import axios from '../../api/axios';
import Layout from '../../Pages/Layout';
import { useNavigate } from 'react-router-dom';

export default function CreateMotivo(){
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading,setLoading]=useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await axios.post('/motivos-ausencia/', { codigo, nombre, descripcion, activo: true });
      nav('/admin');
    } catch (err) {
      console.error(err);
      alert('Error: ' + JSON.stringify(err?.response?.data || err));
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-8">
        <h2 className="text-xl font-semibold mb-4">Crear Motivo de Ausencia</h2>
        <form onSubmit={submit} className="space-y-4">
          <input className="w-full border p-2 rounded" placeholder="Código (ej. MED)" value={codigo} onChange={e=>setCodigo(e.target.value)} required/>
          <input className="w-full border p-2 rounded" placeholder="Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} required/>
          <textarea className="w-full border p-2 rounded" placeholder="Descripción" value={descripcion} onChange={e=>setDescripcion(e.target.value)} />
          <div>
            <button disabled={loading} className="bg-[#0099a8] text-white px-4 py-2 rounded">{loading ? 'Guardando...' : 'Guardar motivo'}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
