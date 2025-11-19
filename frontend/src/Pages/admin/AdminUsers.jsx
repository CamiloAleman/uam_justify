// frontend/src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import Layout from "../../Pages/Layout";
import Swal from 'sweetalert2';

function Confirm({ open, text, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded p-4 z-50 w-full max-w-md">
        <p className="mb-4">{text}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1 border rounded">Cancelar</button>
          <button onClick={onConfirm} className="px-3 py-1 bg-red-600 text-white rounded">Confirmar</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // user object being edited
  const [confirmInfo, setConfirmInfo] = useState({ open:false, id:null, text:'' });
  const [carreras, setCarreras] = useState([]);
  const [facultades, setFacultades] = useState([]);

  useEffect(() => {
    load();
    loadCarreras();
    loadFacultades();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get("/usuarios/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setUsers(data);
    } catch (e) {
      console.error(e);
      alert("Error cargando usuarios.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCarreras() {
    try {
      const r = await axios.get("/carreras/");  // Ajusta la ruta según tu API
      setCarreras(Array.isArray(r.data) ? r.data : r.data.results || []);
    } catch (e) {
      console.error("Error cargando carreras", e);
    }
  }

  async function loadFacultades() {
    try {
      const r = await axios.get("/facultades/");
      setFacultades(Array.isArray(r.data) ? r.data : r.data.results || []);
    } catch (e) {
      console.error("Error cargando facultades", e);
    }
  }

  function openEdit(u) {
    // Normalizar: si carrera/facultad vienen como objeto, usar su id para los selects
    const normalized = {
      ...u,
      carrera: u?.carrera?.id ? u.carrera.id : (u.carrera || ""),
      facultad: u?.facultad?.id ? u.facultad.id : (u.facultad || "")
    };
    setEditing(normalized);
  }
  function closeEdit() {
    setEditing(null);
  }

  async function saveEdit() {
    try {
      if (!editing) return;

      // Validación cliente
      const role = (editing.role || "").toUpperCase();
      if (role === 'DOCENTE' && !editing.facultad) {
        return alert('Debe seleccionar una facultad para el rol DOCENTE.');
      }
      if ((role === 'COORDINADOR' || role === 'ESTUDIANTE') && !editing.carrera) {
        return alert('Debe seleccionar una carrera para el rol + role + .');
      }

      const payload = {
        primer_nombre: editing.primer_nombre,
        segundo_nombre: editing.segundo_nombre,
        primer_apellido: editing.primer_apellido,
        segundo_apellido: editing.segundo_apellido,
        correo_institucional: editing.correo_institucional,
        cif_identificacion: editing.cif_identificacion,
        role: editing.role,
        estado: editing.estado,
        // backend espera carrera_id y facultad_id (PrimaryKeyRelatedField)
        carrera_id: editing.carrera && typeof editing.carrera === 'object' ? (editing.carrera.id || null) : (editing.carrera || null),
        facultad_id: editing.facultad && typeof editing.facultad === 'object' ? (editing.facultad.id || null) : (editing.facultad || null)
      };

      

    if (editing.id) {
      // UPDATE
      await axios.patch(`/usuarios/${editing.id}/`, payload);
      await Swal.fire({ icon: 'success', title: 'Guardado', text: 'Usuario actualizado.' });
    } else {
      // CREATE
      const res = await axios.post('/usuarios/', payload);
      // opcional: si la API devuelve el nuevo recurso, puedes usar res.data
      await Swal.fire({ icon: 'success', title: 'Guardado', text: 'Usuario creado.' });
    }

    closeEdit();
    load();

    } catch (e) {
      console.error(e);
      // mostrar error provisto por el servidor cuando exista
      const serverData = e.response?.data;
      if (serverData) {
        try {
          // extraer primer mensaje legible del servidor
          const first = Object.entries(serverData)[0];
          const msg = first
            ? `${first[0]}: ${Array.isArray(first[1]) ? first[1].join(" ") : first[1]}`
            : JSON.stringify(serverData);

          await Swal.fire({
            icon: "error",
            title: "Error",
            text: msg
          }); 

        } catch {
          await Swal.fire({ icon: 'error', title: 'Error', text: "Error al interpretar el mensaje del servidor." }); 
        }
      } else {
          await Swal.fire({ icon: 'error', title: 'Error', text: 'Error actualizando usuario.' });
      }
    }
  }

  async function doDelete(id) {
    const r = await Swal.fire({
      title: 'Eliminar usuario',
      text: '¿Seguro que deseas eliminar este usuario?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!r.isConfirmed) return;

    try {
      await axios.delete(`/usuarios/${id}/`);
      await Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Usuario eliminado.' });
      load();
    } catch (e) {
      console.error(e);
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Error eliminando usuario.' });
    } finally {
      setConfirmInfo({ open:false, id:null, text:'' });
    }
  }

  async function resetPassword(id) {
    if (!window.confirm("Confirmar generación de contraseña temporal y mostrarla en pantalla?")) return;
    try {
      const res = await axios.post(`/usuarios/${id}/generate-temp-password/`);
      const temp = res.data?.temp_password;
      if (temp) {
        alert("Contraseña temporal: " + temp + "\nIndícale al usuario que la cambie al ingresar.");
      } else {
        alert("Acción realizada. (En prod enviaría correo en lugar de mostrar contraseña.)");
      }
    } catch (e) {
      console.error(e);
      alert("Error al resetear contraseña.");
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Usuarios</h2>
          <div>
          <button
              onClick={() => setEditing({
                // objeto inicial para creación — deja campos vacíos o con valores por defecto
                primer_nombre: '',
                segundo_nombre: '',
                primer_apellido: '',
                segundo_apellido: '',
                correo_institucional: '',
                cif_identificacion: '',
                role: 'ESTUDIANTE', // valor por defecto; el usuario lo puede cambiar
                estado: 'ACTIVO',
                carrera: '',    // guardamos id en este campo cuando se seleccione
                facultad: ''    // idem
              })}
              className="bg-[#0099a8] text-white px-3 py-2 rounded"
            >
              Nuevo Usuario
            </button>
          </div>
        </div>

        {loading ? <div>Cargando...</div> : (
          <div className="bg-white shadow rounded">
            <table className="min-w-full">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Correo</th>
                  <th className="p-3">CIF</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Carrera</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3">{u.primer_nombre} {u.primer_apellido}</td>
                    <td className="p-3">{u.correo_institucional}</td>
                    <td className="p-3">{u.cif_identificacion}</td>
                    <td className="p-3">{u.role}</td>
                    <td className="p-3">{u.carrera?.nombre || '-'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={()=>openEdit(u)} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Editar</button>
                        <button onClick={()=>resetPassword(u.id)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm">Reset Pwd</button>
                        <button onClick={()=>setConfirmInfo({open:true,id:u.id,text:'¿Eliminar usuario?'})} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit modal */}
        {editing && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={closeEdit} />
            <div className="relative bg-white rounded p-6 z-50 w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Editar usuario</h3>
              <div className="grid grid-cols-2 gap-3">
                <input className="p-2 border rounded" value={editing.primer_nombre||''} onChange={(e)=>setEditing(p=>({...p, primer_nombre: e.target.value}))} placeholder="Primer nombre" />
                <input className="p-2 border rounded" value={editing.segundo_nombre||''} onChange={(e)=>setEditing(p=>({...p, segundo_nombre: e.target.value}))} placeholder="Segundo nombre" />
                <input className="p-2 border rounded" value={editing.primer_apellido||''} onChange={(e)=>setEditing(p=>({...p, primer_apellido: e.target.value}))} placeholder="Primer apellido" />
                <input className="p-2 border rounded" value={editing.segundo_apellido||''} onChange={(e)=>setEditing(p=>({...p, segundo_apellido: e.target.value}))} placeholder="Segundo apellido" />
                <input className="p-2 border rounded col-span-2" value={editing.correo_institucional||''} onChange={(e)=>setEditing(p=>({...p, correo_institucional: e.target.value}))} placeholder="Correo institucional" />
                <input className="p-2 border rounded" value={editing.cif_identificacion||''} onChange={(e)=>setEditing(p=>({...p, cif_identificacion: e.target.value}))} placeholder="CIF" />

                {/* Role select */}
                <select className="p-2 border rounded" value={editing.role||''} onChange={(e)=>setEditing(p=>({...p, role:e.target.value}))}>
                  <option value="">-- Seleccione rol --</option>
                  <option value="ESTUDIANTE">ESTUDIANTE</option>
                  <option value="DOCENTE">DOCENTE</option>
                  <option value="COORDINADOR">COORDINADOR</option>
                  <option value="SECRETARIA">SECRETARIA</option>
                  <option value="ADMIN">ADMIN</option>
                </select>

                {/* Conditionally show carrera select for estudiantes/coordinadores */}
                {['ESTUDIANTE', 'COORDINADOR'].includes((editing.role||'').toUpperCase()) && (
                  <select
                    className="w-full p-2 border rounded mb-2"
                    value={editing.carrera || ""}
                    onChange={e => {
                      const selectedId = e.target.value || "";
                      // buscar la carrera en el arreglo
                      const selectedCarrera = carreras.find(c => String(c.id) === String(selectedId));
                      setEditing(prev => ({
                        ...prev,
                        // almacenamos SOLO el id de la carrera
                        carrera: selectedId || "",
                        // si la carrera tiene facultad, almacenamos SOLO el id de la facultad (no objeto)
                        facultad: selectedCarrera
                                  ? (selectedCarrera.facultad && typeof selectedCarrera.facultad === 'object'
                                      ? (selectedCarrera.facultad.id || "")
                                      : (selectedCarrera.facultad || ""))
                                  : prev.facultad
                      }));
                    }}
                  >
                    <option value="">-- Seleccione carrera --</option>
                    {carreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                )}

                {/* Conditionally show facultad select for docentes */}
                {((editing.role||'').toUpperCase() === 'DOCENTE') && (
                  <select value={editing.facultad || ''} onChange={e => setEditing(p => ({...p, facultad: e.target.value}))} className="p-2 border rounded">
                    <option value="">-- Seleccione facultad --</option>
                    {facultades.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                  </select>
                )}

                <input className="p-2 border rounded" value={editing.estado||''} onChange={(e)=>setEditing(p=>({...p, estado:e.target.value}))} placeholder="Estado" />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={closeEdit} className="px-3 py-1 border rounded">Cancelar</button>
                <button onClick={saveEdit} className="px-3 py-1 bg-[#0099a8] text-white rounded">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm delete */}
        <Confirm
          open={confirmInfo.open}
          text={confirmInfo.text}
          onCancel={()=>setConfirmInfo({open:false,id:null,text:''})}
          onConfirm={()=>doDelete(confirmInfo.id)}
        />
      </div>
    </Layout>
  );
}
