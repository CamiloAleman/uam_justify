// frontend/src/pages/admin/AdminAsignaturas.jsx
import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import Layout from '../../Pages/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { successAlert, errorAlert } from "../../utils/alerts";

export default function AdminAsignaturas() {
  const [items, setItems] = useState([]);
  const [fac, setFac] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  // confirm modal state
  const [confirmInfo, setConfirmInfo] = useState({ open: false, id: null, text: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        axios.get('/asignaturas/'),
        axios.get('/facultades/'),
        axios.get('/usuarios/?role=DOCENTE') // backend filter support recommended
      ]);
      setItems(Array.isArray(r1.data) ? r1.data : r1.data.results || []);
      setFac(Array.isArray(r2.data) ? r2.data : r2.data.results || []);
      setDocentes(Array.isArray(r3.data) ? r3.data : r3.data.results || []);
    } catch (e) {
      console.error(e);
      errorAlert('Error cargando datos');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
      try { 
    const payload = { 
      nombre: editing.nombre, 
      codigo: editing.codigo, 
      descripcion: editing.descripcion,

      facultad: editing.facultad?.id || editing.facultad, 
      docente: editing.docente?.id || editing.docente 
    }; 
      if (editing.id) 
        await axios.patch(`/asignaturas/${editing.id}/`, payload);
      else 
        await axios.post('/asignaturas/', payload); 
        successAlert("Asignatura guardada con éxito"); setEditing(null); load(); 
    } catch (e) { 
      console.error(e); errorAlert("Error guardando asignatura"); 
    }
  }

  
  // Abrir diálogo de confirmación
  function askDelete(id, nombre) {
    setConfirmInfo({ open: true, id, text: `¿Eliminar asignatura "${nombre}"?` });
  }

  // Ejecutar eliminación cuando se confirme en el modal
  async function doDeleteConfirmed() {
    const id = confirmInfo.id;
    try {
      await axios.delete(`/asignaturas/${id}/`);
      successAlert('Asignatura eliminada');
      setConfirmInfo({ open: false, id: null, text: '' });
      await load();
    } catch (e) {
      console.error(e);
      errorAlert('Error eliminando asignatura');
      setConfirmInfo({ open: false, id: null, text: '' });
    }
  }

  // helpers para render
  const getFacName = (facVal) => {
    // facVal puede ser objeto {id,nombre} o un id string
    if (!facVal) return '-';
    if (typeof facVal === 'object') return facVal.nombre || '-';
    const f = fac.find(x => x.id === facVal);
    return f ? f.nombre : '-';
  };

  const getDocName = (docVal) => {
    if (!docVal) return '-';
    if (typeof docVal === 'object') return `${docVal.primer_nombre || ''} ${docVal.primer_apellido || ''}`.trim() || '-';
    const d = docentes.find(x => x.id === docVal);
    return d ? `${d.primer_nombre || ''} ${d.primer_apellido || ''}`.trim() : '-';
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Asignaturas</h2>
          <button
            onClick={() => setEditing({ nombre: '', codigo: '', descripcion: '', facultad: null, docente: null })}
            className="bg-[#0099a8] text-white px-3 py-2 rounded"
          >
            Nueva Asignatura
          </button>
        </div>

        {loading ? (
          <div className="p-6 bg-white rounded shadow text-gray-600">Cargando...</div>
        ) : (
          <table className="w-full bg-white rounded shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Facultad</th>
                <th className="p-3">Docente</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.codigo}</td>
                  <td className="p-3">{a.nombre}</td>
                  <td className="p-3">{getFacName(a.facultad)}</td>
                  <td className="p-3">{getDocName(a.docente)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditing({ ...a })} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Editar</button>
                      <button onClick={() => askDelete(a.id, a.nombre)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">No hay asignaturas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {editing && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
            <div className="relative bg-white rounded p-6 z-50 w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-3">{editing.id ? 'Editar' : 'Nueva'} Asignatura</h3>
              <div className="grid grid-cols-2 gap-3">
                <input value={editing.codigo || ''} onChange={e => setEditing(p => ({ ...p, codigo: e.target.value }))} className="p-2 border rounded" placeholder="Código" />
                <input value={editing.nombre || ''} onChange={e => setEditing(p => ({ ...p, nombre: e.target.value }))} className="p-2 border rounded" placeholder="Nombre" />
                <select
                  value={editing.facultad?.id || editing.facultad || ''}
                  onChange={e => setEditing(p => ({ ...p, facultad: fac.find(f => f.id === e.target.value) || e.target.value }))}
                  className="p-2 border rounded"
                >
                  <option value="">-- Seleccione facultad --</option>
                  {fac.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
                <select
                  value={editing.docente?.id || editing.docente || ''}
                  onChange={e => setEditing(p => ({ ...p, docente: docentes.find(d => d.id === e.target.value) || e.target.value }))}
                  className="p-2 border rounded"
                >
                  <option value="">-- Seleccione docente (opcional) --</option>
                  {docentes.map(d => <option key={d.id} value={d.id}>{d.primer_nombre} {d.primer_apellido}</option>)}
                </select>
                <textarea value={editing.descripcion || ''} onChange={e => setEditing(p => ({ ...p, descripcion: e.target.value }))} className="col-span-2 p-2 border rounded" placeholder="Descripción" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setEditing(null)} className="px-3 py-1 border rounded">Cancelar</button>
                <button onClick={save} className="px-3 py-1 bg-[#0099a8] text-white rounded">Guardar</button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirmInfo.open}
          title="Confirmar eliminación"
          message={confirmInfo.text}
          onCancel={() => setConfirmInfo({ open: false, id: null, text: '' })}
          onConfirm={doDeleteConfirmed}
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
        />
      </div>
    </Layout>
  );
}
