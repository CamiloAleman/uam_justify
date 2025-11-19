// ApprovalRow.jsx
import React from 'react';

export default function ApprovalRow({ item, onApprove, onReject, onOpenDetail }) {
  const j = item.justificacion || {};
  const estudianteNombre =
    (j.estudiante_detail && j.estudiante_detail.nombre) ||
    (j.estudiante && j.estudiante.primer_nombre
      ? `${j.estudiante.primer_nombre} ${j.estudiante.primer_apellido || ''}`.trim()
      : null) ||
    (j.estudiante && typeof j.estudiante === 'string' ? j.estudiante : null) ||
    '—';
  const asignaturaNombre =
    (j.asignatura_nombre && String(j.asignatura_nombre).trim()) ||
    (j.asignatura_detail && (j.asignatura_detail.nombre || j.asignatura_detail.title)) ||
    (j.asignatura && (j.asignatura.nombre || j.asignatura.title || j.asignatura)) ||
    'General';
  const fechaInicio = j.fecha_ausencia_inicio || '-';
  const fechaFin = j.fecha_ausencia_fin || '-';
  const fechaSolicitud = j.fecha_solicitud || item.fecha_revision || '-';

  return (
    <li className="px-4 py-3 grid grid-cols-12 gap-2 items-center">
      <div className="col-span-3">
        <div className="text-sm font-medium">{estudianteNombre}</div>
        <div className="text-xs text-gray-500">{(j.estudiante_detail && j.estudiante_detail.correo) || ''}</div>
      </div>

      <div className="col-span-2 text-sm">{asignaturaNombre}</div>

      <div className="col-span-3 text-sm">
        {fechaInicio} — {fechaFin}
        {j.descripcion_detallada ? (
          <div className="text-xs text-gray-500 line-clamp-1">{j.descripcion_detallada}</div>
        ) : null}
      </div>

      <div className="col-span-2 text-sm">{fechaSolicitud ? new Date(fechaSolicitud).toLocaleString() : '-'}</div>

      <div className="col-span-2 text-right">
        <div className="flex justify-end gap-2 items-center whitespace-nowrap">
          <button
            onClick={() => onApprove && onApprove(item.id)}
            className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
            type="button"
          >
            Aprobar
          </button>

          <button
            onClick={() => onReject && onReject(item.id)}
            className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700"
            type="button"
          >
            Rechazar
          </button>

          <button
            onClick={() => onOpenDetail && onOpenDetail({ ...(j || {}), id: item.id })}
            className="ml-3 px-3 py-1 rounded bg-blue-100 text-blue-700 text-sm hover:bg-blue-200"
            type="button"
          >
            Ver detalle
          </button>
        </div>

        {j.archivo_principal_path || item.archivo_principal_path ? (
          <div className="mt-1 text-xs text-blue-600">
            <a
              href={`http://127.0.0.1:8000/media/${encodeURI(j.archivo_principal_path || item.archivo_principal_path)}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Ver documento
            </a>
          </div>
        ) : null}
      </div>
    </li>
  );
}
