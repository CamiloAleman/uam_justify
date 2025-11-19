// frontend/src/pages/admin/AdminCarreras.jsx
import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import Layout from '../../Pages/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AdminCarreras(){
  const [items, setItems] = useState([]);
  const [facultades, setFacultades] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmInfo, setConfirmInfo] = useState({open:false, id:null, text:''});

  useEffect(()=>{ load(); }, []);

  async function load(){
    setLoading(true);
    try{
      const [r1, r2] = await Promise.all([axios.get('/carreras/'), axios.get('/facultades/')]);
      setItems(Array.isArray(r1.data)? r1.data : r1.data.results || []);
      setFacultades(Array.isArray(r2.data)? r2.data : r2.data.results || []);
    }catch(e){ console.error(e); alert('Error cargando carreras'); }
    setLoading(false);
  }

  async function save(){
    try{
      const payload = {
        nombre: editing.nombre,
        descripcion: editing.descripcion,
        facultad_id: editing.facultad?.id || editing.facultad
      };
      if(editing.id) await axios.patch(`/carreras/${editing.id}/`, payload);
      else await axios.post('/carreras/', payload);
      setEditing(null);
      load();
    }catch(e){ console.error(e); alert('Error guardando'); }
  }

  async function doDeleteConfirmed(){
    try{
      await axios.delete(`/carreras/${confirmInfo.id}/`);
      setConfirmInfo({open:false,id:null,text:''});
      load();
    }catch(e){ console.error(e); alert('Error eliminando'); setConfirmInfo({open:false,id:null,text:''}); }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Carreras</h2>
          <button onClick={()=>setEditing({nombre:'',descripcion:'',facultad:null})} className="bg-[#0099a8] text-white px-3 py-2 rounded">Nueva Carrera</button>
        </div>

        {loading ? <div>Cargando...</div> : (
          <div className="bg-white rounded shadow">
            <table className="w-full">
              <thead className="bg-gray-50"><tr><th className="p-3">Nombre</th><th className="p-3">Facultad</th><th className="p-3">Acciones</th></tr></thead>
              <tbody>
                {items.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3">{c.nombre}</td>
                    <td className="p-3">{c.facultad?.nombre || '-'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={()=>setEditing({...c})} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Editar</button>
                        <button onClick={()=>setConfirmInfo({open:true,id:c.id,text:`Eliminar carrera "${c.nombre}"?`})} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setEditing(null)} />
            <div className="relative bg-white rounded p-6 z-50 w-full max-w-xl">
              <h3 className="text-lg font-semibold mb-3">{editing.id? 'Editar' : 'Nueva'} Carrera</h3>
              <input value={editing.nombre||''} onChange={e=>setEditing(p=>({...p, nombre:e.target.value}))} className="w-full p-2 border rounded mb-2" placeholder="Nombre" />
              <select value={editing.facultad?.id || editing.facultad || ''} onChange={e=>setEditing(p=>({...p, facultad: facultades.find(f=>f.id===e.target.value) || e.target.value }))} className="w-full p-2 border rounded mb-2">
                <option value="">-- Seleccione Facultad --</option>
                {facultades.map(f=> <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
              <textarea value={editing.descripcion||''} onChange={e=>setEditing(p=>({...p, descripcion:e.target.value}))} className="w-full p-2 border rounded mb-2" placeholder="Descripción" />
              <div className="flex justify-end gap-2">
                <button onClick={()=>setEditing(null)} className="px-3 py-1 border rounded">Cancelar</button>
                <button onClick={save} className="px-3 py-1 bg-[#0099a8] text-white rounded">Guardar</button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirmInfo.open}
          title="Confirmar eliminación"
          message={confirmInfo.text}
          onCancel={()=>setConfirmInfo({open:false,id:null,text:''})}
          onConfirm={doDeleteConfirmed}
        />
      </div>
    </Layout>
  );
}
