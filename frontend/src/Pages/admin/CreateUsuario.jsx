// frontend/src/pages/admin/CreateUsuario.jsx
import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import Layout from "../../Pages/Layout";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function CreateUsuario() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [facultades, setFacultades] = useState([]);
  const [carreras, setCarreras] = useState([]);

  const [primer_nombre, setPrimerNombre] = useState("");
  const [segundo_nombre, setSegundoNombre] = useState("");
  const [primer_apellido, setPrimerApellido] = useState("");
  const [segundo_apellido, setSegundoApellido] = useState("");
  const [correo_institucional, setCorreo] = useState("");
  const [cif_identificacion, setCIF] = useState("");
  const [role, setRole] = useState("ESTUDIANTE");
  const [estado, setEstado] = useState("ACTIVO");
  const [carreraId, setCarreraId] = useState("");
  const [facultadId, setFacultadId] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [rFac, rCarr] = await Promise.all([
          axios.get("/facultades/"),
          axios.get("/carreras/"),
        ]);
        setFacultades(Array.isArray(rFac.data) ? rFac.data : rFac.data.results || []);
        setCarreras(Array.isArray(rCarr.data) ? rCarr.data : rCarr.data.results || []);
      } catch (e) {
        console.error("Error cargando catálogos", e);
        Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar facultades o carreras." });
      }
    }
    load();
  }, []);

  // Cuando se selecciona una carrera, auto-llenar facultad si la carrera incluye facultad
  const onCarreraChange = (val) => {
    setCarreraId(val || "");
    if (!val) {
      setFacultadId("");
      return;
    }
    const c = carreras.find((x) => String(x.id) === String(val));
    if (c) {
      if (typeof c.facultad === "object" && c.facultad?.id) setFacultadId(c.facultad.id);
      else if (c.facultad) setFacultadId(c.facultad);
      else setFacultadId("");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones cliente (coincidentes con las reglas de negocio)
    const r = (role || "").toUpperCase();
    if (r === "DOCENTE" && !facultadId) {
      await Swal.fire({ icon: "warning", title: "Validación", text: "Debe seleccionar una facultad para el rol DOCENTE." });
      setLoading(false);
      return;
    }
    if ((r === "ESTUDIANTE" || r === "COORDINADOR") && !carreraId) {
      await Swal.fire({ icon: "warning", title: "Validación", text: "Debe seleccionar una carrera para el rol ESTUDIANTE/COORDINADOR." });
      setLoading(false);
      return;
    }

    const payload = {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      correo_institucional,
      cif_identificacion,
      role: r,
      estado,
      carrera_id: carreraId || null,
      facultad_id: facultadId || null,
      password,
    };

    if (password) payload.password = password;

    try {
      await axios.post("/usuarios/", payload);
      await Swal.fire({ icon: "success", title: "Creado", text: "Usuario creado correctamente." });
      nav("/admin/", { replace: true }); // ir a listado de usuarios
    } catch (err) {
      console.error("Error creando usuario", err);
      const serverData = err?.response?.data;
      if (serverData) {
        try {
          const first = Object.entries(serverData)[0];
          const msg = first ? `${first[0]}: ${Array.isArray(first[1]) ? first[1].join(" ") : first[1]}` : JSON.stringify(serverData);
          await Swal.fire({ icon: "error", title: "Error", text: msg });
        } catch {
          await Swal.fire({ icon: "error", title: "Error", text: "Error creando usuario." });
        }
      } else {
        await Swal.fire({ icon: "error", title: "Error", text: err.message || "Error de servidor" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <h2 className="text-xl font-semibold mb-4">Crear Usuario</h2>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input required className="p-2 border rounded" placeholder="Primer nombre" value={primer_nombre} onChange={(e) => setPrimerNombre(e.target.value)} />
            <input className="p-2 border rounded" placeholder="Segundo nombre" value={segundo_nombre} onChange={(e) => setSegundoNombre(e.target.value)} />
            <input required className="p-2 border rounded" placeholder="Primer apellido" value={primer_apellido} onChange={(e) => setPrimerApellido(e.target.value)} />
            <input className="p-2 border rounded" placeholder="Segundo apellido" value={segundo_apellido} onChange={(e) => setSegundoApellido(e.target.value)} />
            <input required type="email" className="col-span-2 p-2 border rounded" placeholder="Correo institucional" value={correo_institucional} onChange={(e) => setCorreo(e.target.value)} />
            <input required className="p-2 border rounded" placeholder="CIF / Identificación" value={cif_identificacion} onChange={(e) => setCIF(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <select value={role} onChange={(e) => setRole(e.target.value)} className="p-2 border rounded">
              <option value="ESTUDIANTE">ESTUDIANTE</option>
              <option value="DOCENTE">DOCENTE</option>
              <option value="COORDINADOR">COORDINADOR</option>
              <option value="SECRETARIA">SECRETARIA</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            <select value={carreraId} onChange={(e) => onCarreraChange(e.target.value)} className="p-2 border rounded">
              <option value="">-- Seleccione carrera (si aplica) --</option>
              {carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.facultad?.nombre ? ` — ${c.facultad.nombre}` : ''}</option>)}
            </select>

            <select value={facultadId} onChange={(e) => setFacultadId(e.target.value)} className="p-2 border rounded">
              <option value="">-- Seleccione facultad (si aplica) --</option>
              {facultades.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </div>

          <div>
            <input type="password" className="p-2 border rounded w-full" placeholder="Contraseña inicial (opcional)" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-gray-500 mt-1">Si no defines contraseña, se generará una temporal desde el backend o el admin puede resetearla luego.</p>
          </div>

          <div>
            <button disabled={loading} className="bg-[#0099a8] text-white px-4 py-2 rounded">
              {loading ? "Guardando..." : "Crear usuario"}
            </button>
            <button type="button" onClick={() => nav("/admin/")} className="ml-3 px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
