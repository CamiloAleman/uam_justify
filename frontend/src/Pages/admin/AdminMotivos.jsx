// frontend/src/pages/admin/AdminMotivos.jsx
import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import Layout from '../../Pages/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AdminMotivos() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  // confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmName, setConfirmName] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await axios.get('/motivos-ausencia/');
      setItems(Array.isArray(r.data) ? r.data : r.data.results || []);
    } catch (e) {
      console.error(e);
      alert('Error cargando motivos');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    try {
      const payload = {
        nombre: editing?.nombre ?? '',
        descripcion: editing?.descripcion ?? '',
        activo: !!editing?.activo,
        codigo: editing?.codigo
      };
      if (editing?.id) {
        await axios.patch(`/motivos-ausencia/${editing.id}/`, payload);
      } else {
        await axios.post('/motivos-ausencia/', payload);
      }
      setEditing(null);
      load();
    } catch (e) {
      console.error(e);
      alert('Error guardando');
    }
  }

  // Abrir diálogo de confirmación
  function askDelete(id, nombre) {
    setConfirmId(id);
    setConfirmName(nombre);
    setConfirmOpen(true);
  }

  function handleCancel() {
    setConfirmOpen(false);
    setConfirmId(null);
    setConfirmName('');
  }

  async function handleConfirm() {
    try {
      if (!confirmId) return;
      await axios.delete(`/motivos-ausencia/${confirmId}/`);
      alert('Eliminado');
      load();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    } finally {
      setConfirmOpen(false);
      setConfirmId(null);
      setConfirmName('');
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Motivos de ausencia</h2>
          <button
            onClick={() => setEditing({ codigo: '', nombre: '', descripcion: '', activo: true,  })}
            className="bg-[#0099a8] text-white px-3 py-2 rounded"
          >
            Nuevo Motivo
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-md p-6 text-gray-600">Cargando motivos…</div>
        ) : (
          <div className="bg-white rounded shadow">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Nombre</th>
                  <th className="p-3 text-left">Activo</th>
                  <th className="p-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(m => (
                  <tr key={m.id} className="border-t">
                    <td className="p-3">{m.nombre}</td>
                    <td className="p-3">{m.activo ? 'Sí' : 'No'}</td>
                    <td className="p-3">
                      <button onClick={() => setEditing({ ...m })} className="px-2 py-1 bg-blue-600 text-white rounded text-sm mr-2">Editar</button>
                      <button onClick={() => askDelete(m.id, m.nombre)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-4 text-center text-gray-500">No hay motivos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit modal */}
        {editing && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
            <div className="relative bg-white rounded p-6 z-50 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-3">{editing.id ? 'Editar' : 'Nuevo'} Motivo</h3>
              <input
                className="w-full p-2 border rounded mb-2"
                placeholder="Código"
                value={editing?.codigo ?? ''}
                onChange={e => setEditing(p => ({ ...(p || {}), codigo: e.target.value }))}
              />
              <input
                className="w-full p-2 border rounded mb-2"
                placeholder="Nombre"
                value={editing?.nombre ?? ''}
                onChange={e => setEditing(p => ({ ...(p || {}), nombre: e.target.value }))}
              />
              <textarea
                className="w-full p-2 border rounded mb-2"
                placeholder="Descripción"
                value={editing?.descripcion ?? ''}
                onChange={e => setEditing(p => ({ ...(p || {}), descripcion: e.target.value }))}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!editing?.activo}
                  onChange={e => setEditing(p => ({ ...(p || {}), activo: e.target.checked }))}
                /> Activo
              </label>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setEditing(null)} className="px-3 py-1 border rounded">Cancelar</button>
                <button onClick={save} className="px-3 py-1 bg-[#0099a8] text-white rounded">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm dialog */}
        <ConfirmDialog
          open={confirmOpen}
          title="Eliminar motivo"
          message={`¿Realmente deseas eliminar "${confirmName}"?`}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
        />
      </div>
    </Layout>
  );
}
