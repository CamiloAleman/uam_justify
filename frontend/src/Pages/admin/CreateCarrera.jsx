// frontend/src/pages/admin/CreateCarrera.jsx
import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import Layout from "../../Pages/Layout";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function CreateCarrera() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [facultades, setFacultades] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [facultadId, setFacultadId] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const r = await axios.get("/facultades/");
        setFacultades(Array.isArray(r.data) ? r.data : r.data.results || []);
      } catch (e) {
        console.error("Error cargando facultades", e);
        Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar facultades." });
      }
    }
    load();
  }, []);

    const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones cliente
    if (!nombre.trim()) {
        await Swal.fire({ icon: "warning", title: "Validación", text: "El nombre es requerido." });
        setLoading(false);
        return;
    }
    if (!facultadId) {
        await Swal.fire({ icon: "warning", title: "Validación", text: "Debe seleccionar una facultad para la carrera." });
        setLoading(false);
        return;
    }

    try {
        await axios.post("/carreras/", {
        nombre,
        descripcion,
        facultad_id: facultadId // o facultad_id según tu API
        });
        await Swal.fire({ icon: "success", title: "Creada", text: "Carrera creada correctamente." });
        nav("/admin/carreras", { replace: true });
    } catch (err) {
        console.error("Error creando carrera", err);
        // manejo de mensajes del servidor
        const serverData = err?.response?.data;
        if (serverData) {
        const first = Object.entries(serverData)[0];
        const msg = first ? `${first[0]}: ${Array.isArray(first[1]) ? first[1].join(" ") : first[1]}` : JSON.stringify(serverData);
        await Swal.fire({ icon: "error", title: "Error", text: msg });
        } else {
        await Swal.fire({ icon: "error", title: "Error", text: "Error creando carrera." });
        }
    } finally {
        setLoading(false);
    }
    };

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-8">
        <h2 className="text-xl font-semibold mb-4">Crear Carrera</h2>
        <form onSubmit={submit} className="space-y-4">
          <input
            required
            className="w-full border p-2 rounded"
            placeholder="Nombre de la carrera"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <select
            required
            value={facultadId}
            onChange={(e) => setFacultadId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Seleccione facultad (opcional) --</option>
            {facultades.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <div>
            <button disabled={loading} className="bg-[#0099a8] text-white px-4 py-2 rounded">
              {loading ? "Guardando..." : "Crear carrera"}
            </button>
            <button type="button" onClick={() => nav("/admin/carreras")} className="ml-3 px-4 py-2 border rounded">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
