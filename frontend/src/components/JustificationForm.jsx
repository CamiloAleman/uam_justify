// src/components/JustificationForm.jsx
import React, { useEffect, useState } from "react";
import axios from "../api/axios"; // tu axiosInstance con baseURL y token
import Layout from "../Pages/Layout";

export default function JustificationForm() {


    const [asignaturas, setAsignaturas] = useState([]);
    const [motivos, setMotivos] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState("");

    const [form, setForm] = useState({
      asignatura: "",
      motivo: "",
      fecha_ausencia_inicio: "",
      fecha_ausencia_fin: "",
      descripcion_detallada: "",
    });

    const [archivoPrincipal, setArchivoPrincipal] = useState(null);

    // Cargar catálogos (asignaturas + motivos)
    useEffect(() => {
      const load = async () => {
        try {
          const [asigRes, motRes] = await Promise.all([
            axios.get("/asignaturas/"), // GET lista de asignaturas activas
            axios.get("/motivos-ausencia/"),     // GET lista de motivos (MotivoAusencia)
          ]);
          setAsignaturas(asigRes.data);
          setMotivos(motRes.data);
        } catch (e) {
          console.error(e);
          setMsg("No se pudieron cargar catálogos (asignaturas/motivos).");
        }
      };
      load();
    }, []);

    // Helpers
    const onChange = (e) =>
      setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const validate = () => {
      if (!form.asignatura) return "Seleccione una asignatura.";
      if (!form.motivo) return "Seleccione un motivo de ausencia.";
      if (!form.fecha_ausencia_inicio) return "Seleccione fecha de inicio.";
      if (!form.fecha_ausencia_fin) return "Seleccione fecha de fin.";
      if (new Date(form.fecha_ausencia_fin) < new Date(form.fecha_ausencia_inicio)) {
        return "La fecha fin no puede ser anterior a la fecha inicio.";
      }
      // archivo opcional (si tu política requiere archivo, valida aquí)
      return null;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setMsg("");
      const err = validate();
      if (err) {
        setMsg(err);
        return;
      }
      setSubmitting(true);
      try {
        const data = new FormData();
        // Nombres de campos deben coincidir con tu serializer DRF:
        // Justificacion: asignatura, motivo, fecha_ausencia_inicio, fecha_ausencia_fin, descripcion_detallada, archivo_principal
        data.append("asignatura", form.asignatura);
        data.append("motivo", form.motivo);
        data.append("fecha_ausencia_inicio", form.fecha_ausencia_inicio);
        data.append("fecha_ausencia_fin", form.fecha_ausencia_fin);
        data.append("descripcion_detallada", form.descripcion_detallada || "");
        if (archivoPrincipal) {
          data.append("archivo_principal", archivoPrincipal); // File
        }

        await axios.post("/justificaciones/", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setMsg("✅ Justificación enviada correctamente. Estado: PENDIENTE.");
        setForm({
          asignatura: "",
          motivo: "",
          fecha_ausencia_inicio: "",
          fecha_ausencia_fin: "",
          descripcion_detallada: "",
        });
        setArchivoPrincipal(null);
      } catch (error) {
        console.error(error);
        // Mensaje más legible si viene detalle del serializer
        const apiMsg =
          error?.response?.data?.detail ||
          error?.response?.data?.non_field_errors?.[0] ||
          "No se pudo crear la justificación.";
        setMsg(`❌ ${apiMsg}`);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Registrar Justificación</h2>

        {msg && (
          <div className="mb-4 p-3 border rounded text-sm">
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
          {/* Asignatura */}
          <div>
            <label className="block text-sm mb-1">Asignatura</label>
            <select
              name="asignatura"
              value={form.asignatura}
              onChange={onChange}
              required
              className="w-full border rounded p-2"
            >
              <option value="">-- Seleccione --</option>
              {asignaturas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm mb-1">Motivo de ausencia</label>
            <select
              name="motivo"
              value={form.motivo}
              onChange={onChange}
              required
              className="w-full border rounded p-2"
            >
              <option value="">-- Seleccione --</option>
              {motivos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Fecha de ausencia (inicio)</label>
              <input
                type="date"
                name="fecha_ausencia_inicio"
                value={form.fecha_ausencia_inicio}
                onChange={onChange}
                required
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Fecha de ausencia (fin)</label>
              <input
                type="date"
                name="fecha_ausencia_fin"
                value={form.fecha_ausencia_fin}
                onChange={onChange}
                required
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm mb-1">Descripción detallada (opcional)</label>
            <textarea
              name="descripcion_detallada"
              value={form.descripcion_detallada}
              onChange={onChange}
              rows={3}
              className="w-full border rounded p-2"
              placeholder="Describa brevemente el motivo de la ausencia…"
            />
          </div>

          {/* Archivo principal */}
          <div>
            <label className="block text-sm mb-1">
              Documento de respaldo (PDF/JPG/PNG)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setArchivoPrincipal(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>

          {/* Estado: no se expone (queda PENDIENTE por defecto en backend) */}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Enviar justificación"}
            </button>
          </div>
        </form>
      </div>
      </Layout>
    );
  }