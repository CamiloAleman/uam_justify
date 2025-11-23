// frontend/src/components/MyRequests.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "../api/axios";
import Layout from "../Pages/Layout";
import { useNavigate } from "react-router-dom";

export default function MyRequests() {
  const [items, setItems] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [filtro, setFiltro] = useState("");
  const navigate = useNavigate();

  // Helpers
  const toArray = (res) =>
    Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.results)
      ? res.data.results
      : [];

  const formatDate = (v) => {
    if (!v) return "-";
    try {
      const d = new Date(v);
      return d.toLocaleString();
    } catch {
      return v;
    }
  };

  const estadoBadge = (estado) => {
    const base =
      "px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-block";
    switch ((estado || "").toUpperCase()) {
      case "APROBADO":
        return `${base} bg-green-50 text-green-700 border-green-200`;
      case "RECHAZADO":
        return `${base} bg-red-50 text-red-700 border-red-200`;
      case "OBSERVADO":
        return `${base} bg-yellow-50 text-yellow-800 border-yellow-200`;
      default:
        return `${base} bg-slate-50 text-slate-700 border-slate-200`;
    }
  };

  // --- NUEVO: obtener id del usuario autenticado (intenta varias fuentes) ---
  const getCurrentUserId = () => {
    try {
      // 1) Si guardas el perfil en localStorage bajo 'user' o 'profile'
      const userRaw = localStorage.getItem("user") || localStorage.getItem("profile");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u?.id) return u.id;
        if (u?.pk) return u.pk;
        if (u?.usuario_id) return u.usuario_id;
      }

      // 2) Si guardas un token JWT en localStorage: decodificar payload
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("access_token");
      if (token) {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
          // intenta varios campos comunes
          return payload.user_id || payload.sub || payload.id || payload.pk || null;
        }
      }
    } catch (e) {
      console.warn("No se pudo extraer id del usuario desde localStorage/token", e);
    }
    return null;
  };

  // Cargar datos
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrMsg("");
      try {
        const [mineRes, asigRes, motRes] = await Promise.all([
          axios.get("/justificaciones/"),
          axios.get("/asignaturas/"),
          axios.get("/motivos-ausencia/"),
        ]);

        // Convertir respuesta a arrays
        let justs = toArray(mineRes);
        const asigs = toArray(asigRes);
        const mots = toArray(motRes);

        // --- FILTRO: quedarnos solo con las justificaciones del usuario autenticado ---
        const currentUserId = getCurrentUserId();
        if (currentUserId) {
          // IMPORTANTE: aquí debes usar el nombre del campo que tu API devuelve para el autor.
          // Ejemplos comunes: 'created_by', 'usuario', 'estudiante', 'solicitante', 'owner', 'creador'
          // Reemplaza 'creador_id' por el campo real si es distinto.
          const authorFieldsToTry = [
            "creador", // { id: '...' } o id string
            "creador_id",
            "created_by",
            "created_by_id",
            "usuario",
            "usuario_id",
            "estudiante",
            "estudiante_id",
            "owner",
            "owner_id",
            "solicitante",
            "solicitante_id",
            "user",
            "user_id",
            "author",
            "author_id",
            "student",
            "student_id",
          ];

          const fieldDetect = (j) => {
            for (const f of authorFieldsToTry) {
              if (j[f] !== undefined && j[f] !== null) return { field: f, value: j[f] };
            }
            return null;
          };

          // Normalizamos: si j[field] es objeto con id -> tomar id, si es string -> usarlo directamente
          justs = justs.filter((j) => {
            const detected = fieldDetect(j);
            if (!detected) return false; // no sabemos quién lo creó -> excluir por seguridad
            let val = detected.value;
            if (typeof val === "object" && (val.id || val.pk)) val = val.id || val.pk;
            // comparar como strings (por si id es uuid vs entero)
            return String(val) === String(currentUserId);
          });
        } else {
          // Si no pudimos extraer id del usuario: opción conservadora -> no filtrar
          console.warn("No se detectó id del usuario autenticado, mostrando todas las justificaciones (modo fallback).");
        }

        setItems(justs);
        setAsignaturas(asigs);
        setMotivos(mots);
      } catch (e) {
        console.error(e);
        setErrMsg(
          "No se pudieron cargar tus justificaciones o catálogos. Verifica tu sesión y vuelve a intentar."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Índices para mostrar nombres
  const asigById = useMemo(() => {
    const map = new Map();
    asignaturas.forEach((a) => map.set(a.id, a));
    return map;
  }, [asignaturas]);

  const motivoById = useMemo(() => {
    const map = new Map();
    motivos.forEach((m) => map.set(m.id, m));
    return map;
  }, [motivos]);

  // Filtro simple por texto (asignatura, estado, motivo)
  const filtered = useMemo(() => {
    const q = (filtro || "").toLowerCase().trim();
    if (!q) return items.slice().sort((a, b) => (a.fecha_solicitud < b.fecha_solicitud ? 1 : -1));
    return items
      .filter((j) => {
        const asig = asigById.get(j.asignatura)?.nombre || "";
        const mot = motivoById.get(j.motivo)?.nombre || "";
        const txt = `${j.estado} ${asig} ${mot}`.toLowerCase();
        return txt.includes(q);
      })
      .sort((a, b) => (a.fecha_solicitud < b.fecha_solicitud ? 1 : -1));
  }, [items, filtro, asigById, motivoById]);

  return (
    <Layout>
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">
              Mis Justificaciones
            </h2>
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por asignatura, motivo o estado…"
              className="w-72 border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />

              <button
                onClick={() => navigate("/justificaciones/crear")}
                className="bg-[#0099a8] hover:bg-[#007c86] text-white font-semibold px-4 py-2 rounded-md shadow-md transition-all flex items-center justify-center gap-1"
              >
                <span className="text-lg font-bold">＋</span> Nueva Justificación
              </button>

          </div>

          {loading && (
            <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
              <p className="text-gray-600">Cargando…</p>
            </div>
          )}

          {!loading && errMsg && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
              {errMsg}
            </div>
          )}

          {!loading && !errMsg && filtered.length === 0 && (
            <div className="bg-white border border-dashed border-gray-300 rounded-md p-10 text-center text-gray-500">
              No tienes justificaciones registradas aún.
            </div>
          )}

          {!loading && !errMsg && filtered.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-600 border-b">
                <div className="col-span-3">Asignatura</div>
                <div className="col-span-2">Motivo</div>
                <div className="col-span-3">Rango de ausencia</div>
                <div className="col-span-2">Solicitada</div>
                <div className="col-span-2 text-right">Estado</div>
              </div>

              {/* Rows */}
              <ul className="divide-y">
                {filtered.map((j) => {
                  const asig = asigById.get(j.asignatura);
                  const mot = motivoById.get(j.motivo);
                  return (
                    <li key={j.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">
                        <div className="text-sm font-medium text-gray-800">
                          {asig?.nombre || "General"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {asig?.codigo || ""}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <span className="text-sm text-gray-700">
                          {mot?.nombre || "-"}
                        </span>
                      </div>

                      <div className="col-span-3 text-sm text-gray-700">
                        <div>
                          {formatDate(j.fecha_ausencia_inicio)?.split(",")[0]} —{" "}
                          {formatDate(j.fecha_ausencia_fin)?.split(",")[0]}
                        </div>
                        {j.descripcion_detallada ? (
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {j.descripcion_detallada}
                          </div>
                        ) : null}
                      </div>

                      <div className="col-span-2 text-sm text-gray-700">
                        {formatDate(j.fecha_solicitud)}
                      </div>

                      <div className="col-span-2 text-right">
                        <span className={estadoBadge(j.estado)}>
                          {j.estado || "PENDIENTE"}
                        </span>
                        {j.archivo_principal_id ? (
                          <div className="mt-1">
                            <a
                              href={`http://127.0.0.1:8000/media/${encodeURI(
                                j.archivo_principal_path || ""
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                              onClick={(e) => {
                                if (!j.archivo_principal_path) e.preventDefault();
                              }}
                            >
                              Ver documento
                            </a>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
