// frontend/src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../Pages/Layout";
import axios from "../api/axios";

export default function AdminDashboard() {
  const nav = useNavigate();
  const [counts, setCounts] = useState({
    facultades: null,
    asignaturas: null,
    motivos: null,
    usuarios: null,
    carreras: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCounts() {
    setLoading(true);
    try {
      // Llamadas paralelas a los endpoints.
      const [f, a, m, u, c] = await Promise.allSettled([
        axios.get("/facultades/"),
        axios.get("/asignaturas/"),
        axios.get("/motivos-ausencia/"),
        axios.get("/usuarios/"),
        axios.get("/carreras/")
      ]);

      setCounts({
        facultades: f.status === "fulfilled" ? countFromResponse(f.value) : 0,
        asignaturas: a.status === "fulfilled" ? countFromResponse(a.value) : 0,
        motivos: m.status === "fulfilled" ? countFromResponse(m.value) : 0,
        usuarios: u.status === "fulfilled" ? countFromResponse(u.value) : 0,
        // CORRECCIÓN: 'fulfilled' estaba mal escrito -> ahora se detecta correctamente
        carreras: c.status === "fulfilled" ? countFromResponse(c.value) : 0
      });
    } catch (err) {
      console.error("Error cargando contadores admin", err);
      // fallback numérico para evitar mostrar '-' o vacío
      setCounts({ facultades: 0, asignaturas: 0, motivos: 0, usuarios: 0, carreras: 0 });
    } finally {
      setLoading(false);
    }
  }

  function countFromResponse(res) {
    // res es la respuesta de axios (res.data)
    if (!res || !res.data) return 0;
    const d = res.data;

    if (Array.isArray(d)) return d.length;
    if (typeof d.count === "number") return d.count;
    if (Array.isArray(d.results)) return d.results.length;

    // Si la API devolviera directamente un número en data (caso raro)
    if (typeof d === "number") return d;

    return 0;
  }

  // Clase común para botones outline (hover: fondo primario y texto blanco)
  const outlineBtnClass =
    "px-3 py-2 bg-white border rounded text-sm transition duration-200 hover:bg-[#0099a8] hover:text-white";

  // Clase común para botones primarios
  const primaryBtnClass = "px-3 py-2 bg-[#0099a8] text-white rounded text-sm transition duration-200 hover:brightness-90";

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-10 px-6">
        <h1 className="text-3xl font-semibold mb-8">Panel de Administración</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Facultades - estructura unificada con las otras cards */}
          <div className="p-6 border rounded shadow-sm bg-white">
            <h3 className="font-medium text-lg">Facultades</h3>
            <p className="text-sm text-gray-500 mt-2">Gestiona facultades.</p>

            <div className="mt-4">
              <span className="text-3xl font-semibold text-gray-800">
                {loading ? "…" : counts.facultades ?? 0}
              </span>
              <div className="text-sm text-gray-500">registros</div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => nav("/admin/facultades")}
                className={outlineBtnClass}
                aria-label="Ver listado de facultades"
              >
                Ver listado
              </button>

              <button
                onClick={() => nav("/admin/facultades/nueva")}
                className={primaryBtnClass}
                aria-label="Crear nueva facultad"
              >
                Nueva Facultad
              </button>
            </div>
          </div>

          {/* Carreras */}
          <div className="p-6 border rounded shadow-sm bg-white">
            <h3 className="font-medium text-lg">Carreras</h3>
            <p className="text-sm text-gray-500 mt-2">Gestiona las carreras y su vinculación a facultades.</p>

            <div className="mt-4">
              <span className="text-3xl font-semibold text-gray-800">
                {loading ? "…" : counts.carreras ?? 0}
              </span>
              <div className="text-sm text-gray-500">registros</div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => nav("/admin/carreras")}
                className={outlineBtnClass}
                aria-label="Ver listado de carreras"
              >
                Ver listado
              </button>

              <button
                onClick={() => nav("/admin/carreras/nueva")}
                className={primaryBtnClass}
                aria-label="Crear nueva carrera"
              >
                Nueva Carrera
              </button>
            </div>
          </div>

          {/* Asignaturas */}
          <div className="p-6 border rounded shadow-sm bg-white">
            <h3 className="font-medium text-lg">Asignaturas</h3>
            <p className="text-sm text-gray-500 mt-2">Crear y vincular a docente y facultad.</p>
            <div className="mt-4">
              <span className="text-3xl font-semibold text-gray-800">{loading ? "…" : counts.asignaturas ?? 0}</span>
              <div className="text-sm text-gray-500">registros</div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => nav("/admin/asignaturas")} className={outlineBtnClass}>Ver listado</button>
              <button onClick={() => nav("/admin/asignaturas/nueva")} className={primaryBtnClass}>Nueva Asignatura</button>
            </div>
          </div>

          {/* Motivos */}
          <div className="p-6 border rounded shadow-sm bg-white">
            <h3 className="font-medium text-lg">Motivos</h3>
            <p className="text-sm text-gray-500 mt-2">Motivos de ausencia (MED/DEP/OTR).</p>
            <div className="mt-4">
              <span className="text-3xl font-semibold text-gray-800">{loading ? "…" : counts.motivos ?? 0}</span>
              <div className="text-sm text-gray-500">registros</div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => nav("/admin/motivos")} className={outlineBtnClass}>Ver listado</button>
              <button onClick={() => nav("/admin/motivos/nuevo")} className={primaryBtnClass}>Nuevo Motivo</button>
            </div>
          </div>

          {/* Usuarios (Admin) */}
          <div className="p-6 border rounded shadow-sm bg-white">
            <h3 className="font-medium text-lg">Usuarios</h3>
            <p className="text-sm text-gray-500 mt-2">Lista y administración de usuarios.</p>
            <div className="mt-4">
              <span className="text-3xl font-semibold text-gray-800">{loading ? "…" : counts.usuarios ?? 0}</span>
              <div className="text-sm text-gray-500">registros</div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => { console.log('Dashboard -> Ver listado usuarios'); nav("/admin/usuarios"); }} className={outlineBtnClass}>Ver listado</button>

              <button onClick={() => { console.log('Dashboard -> Nuevo usuario'); nav("/admin/usuarios/nuevo"); }} className={primaryBtnClass}>Nuevo Usuario</button>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500">Usa los botones "Ver listado" para acceder a los CRUD con tablas y editar/eliminar registros.</p>
      </div>
    </Layout>
  );
}