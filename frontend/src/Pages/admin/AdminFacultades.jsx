// frontend/src/pages/admin/AdminFacultades.jsx
import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import Layout from '../../Pages/Layout';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export default function AdminFacultades() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get('/facultades/');
      setItems(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error cargando facultades'
      });
    }
    setLoading(false);
  }

  async function save() {
    try {
      if (!editing || !editing.nombre) {
        Swal.fire({
          icon: 'warning',
          title: 'Verifica',
          text: 'El nombre no puede estar vacío'
        });
        return;
      }

      if (editing.id) {
        await axios.patch(`/facultades/${editing.id}/`, { 
          nombre: editing.nombre, 
          descripcion: editing.descripcion 
        });
      } else {
        await axios.post('/facultades/', { 
          nombre: editing.nombre, 
          descripcion: editing.descripcion 
        });
      }

      await Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: editing.id 
          ? 'Facultad actualizada con éxito' 
          : 'Facultad creada con éxito',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0099a8'
      });

      setEditing(null);
      load();
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error guardando facultad'
      });
    }
  }
 
  // askDelete usa SweetAlert2 para confirmar y llama a doDeleteConfirmed
  async function askDelete(id, nombre) {
    const result = await Swal.fire({
      title: 'Confirmar eliminación',
      text: `Eliminar facultad "${nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      focusCancel: true,
      reverseButtons: true,
      confirmButtonColor: '#dc2626' // rojo para eliminar
    });

    if (result.isConfirmed) {
      // llamamos a la función que hace el delete
      await doDeleteConfirmed(id);
    }
  }

  async function doDeleteConfirmed(id) {
    try {
      await axios.delete(`/facultades/${id}/`);

      await Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Facultad eliminada con éxito',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0099a8'
      });

      load();
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la facultad'
      });
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Facultades</h2>
          <button
            onClick={() => setEditing({ nombre: '', descripcion: '' })}
            className="bg-[#0099a8] text-white px-3 py-2 rounded"
          >
            Nueva Facultad
          </button>
        </div>

        {loading ? <div>Cargando...</div> : (
          <table className="w-full bg-white rounded shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Descripción</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(f => (
                <tr key={f.id} className="border-t">
                  <td className="p-3">{f.nombre}</td>
                  <td className="p-3">{f.descripcion}</td>
                  <td className="p-3">
                    <button
                      onClick={() => setEditing({ ...f })}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-sm mr-2"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => askDelete(f.id, f.nombre)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {editing && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
            <div className="relative bg-white rounded p-6 z-50 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-3">{editing.id ? 'Editar' : 'Nueva'} Facultad</h3>
              <input
                className="w-full p-2 border rounded mb-2"
                placeholder="Nombre"
                value={editing.nombre}
                onChange={e => setEditing(p => ({ ...p, nombre: e.target.value }))}
              />
              <textarea
                className="w-full p-2 border rounded mb-2"
                placeholder="Descripción"
                value={editing.descripcion}
                onChange={e => setEditing(p => ({ ...p, descripcion: e.target.value }))}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditing(null)} className="px-3 py-1 border rounded">Cancelar</button>
                <button onClick={save} className="px-3 py-1 bg-[#0099a8] text-white rounded">Guardar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
