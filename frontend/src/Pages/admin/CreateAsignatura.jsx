// src/pages/admin/CreateAsignatura.jsx
import React, {useEffect, useState} from 'react';
import axios from '../../api/axios';
import Layout from '../../Pages/Layout';
import { useNavigate } from 'react-router-dom';

export default function CreateAsignatura(){
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [facultades, setFacultades] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [facultad, setFacultad] = useState('');
  const [docente, setDocente] = useState('');
  const nav = useNavigate();

  useEffect(()=> {
    const load = async () => {
      const [fac, docs] = await Promise.all([
        axios.get('/facultades/'),
        axios.get('/usuarios/?role=DOCENTE') // si tu API filtra por role
      ]);
      setFacultades(Array.isArray(fac.data) ? fac.data : fac.data.results || []);
      setDocentes(Array.isArray(docs.data) ? docs.data : docs.data.results || []);
    };
    load();
  },[]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/asignaturas/', { codigo, nombre, facultad, docente });
      nav('/admin');
    } catch (err) {
      console.error(err);
      alert('Error creando asignatura.');
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <h2 className="text-xl font-semibold mb-4">Crear Asignatura</h2>
        <form onSubmit={submit} className="space-y-4">
          <input className="w-full border p-2 rounded" placeholder="Código" value={codigo} onChange={e=>setCodigo(e.target.value)} required/>
          <input className="w-full border p-2 rounded" placeholder="Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} required/>
          <select className="w-full border p-2 rounded" value={facultad} onChange={e=>setFacultad(e.target.value)} required>
            <option value="">-- Seleccione facultad --</option>
            {facultades.map(f=> <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
          <select className="w-full border p-2 rounded" value={docente} onChange={e=>setDocente(e.target.value)}>
            <option value="">-- Seleccione docente (opcional) --</option>
            {docentes.map(d=> <option key={d.id} value={d.id}>{d.primer_nombre} {d.primer_apellido} ({d.correo_institucional})</option>)}
          </select>

          <div><button className="bg-[#0099a8] text-white px-4 py-2 rounded">Crear Asignatura</button></div>
        </form>
      </div>
    </Layout>
  );
}
