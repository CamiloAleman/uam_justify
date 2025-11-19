// frontend/src/pages/ApprovalsMine.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import Layout from '../Pages/Layout';
import ConfirmDialog from '../components/ConfirmDialog';

const fetchApprovals = async () => {
  const res = await axios.get('/aprobaciones/mine/');
  return Array.isArray(res.data) ? res.data : res.data.results || [];
};

const decideApproval = async ({ id, estado, comentario }) => {
  const res = await axios.post(`/aprobaciones/${id}/decide/`, { estado, comentario });
  return res.data;
};

const deleteJustificacion = async (id) => {
  await axios.delete(`/justificaciones/${id}/`);
  return id;
};

export default function ApprovalsMine() {
  const qc = useQueryClient();
  const [confirmInfo, setConfirmInfo] = useState({
    open: false,
    id: null,
    estado: null,
    comentario: '',
    showComentario: false,
  });

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ['approvals', 'mine'],
    queryFn: fetchApprovals,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  const decideMutation = useMutation({
    mutationFn: decideApproval,
    onSuccess: (updated) => {
      qc.setQueryData(['approvals', 'mine'], (old = []) =>
        old.map((it) => (it.id === updated.id ? updated : it))
      );
    },
    onError: (err) => {
      console.error('decide error', err);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJustificacion,
    onSuccess: (_, id) => {
      qc.setQueryData(['approvals', 'mine'], (old = []) => old.filter((it) => it.id !== id));
    },
    onError: (err) => {
      console.error('delete error', err);
    },
  });

  const askReject = (id) =>
    setConfirmInfo({ open: true, id, estado: 'RECHAZADO', comentario: '', showComentario: true });
  const askApprove = (id) =>
    setConfirmInfo({ open: true, id, estado: 'APROBADO', comentario: '', showComentario: false });
  const handleCancelConfirm = () =>
    setConfirmInfo({ open: false, id: null, estado: null, comentario: '', showComentario: false });

  const handleConfirm = () => {
    const { id, estado, comentario } = confirmInfo;
    if (!id || !estado) {
      handleCancelConfirm();
      return;
    }
    decideMutation.mutate({ id, estado, comentario });
    setConfirmInfo({ open: false, id: null, estado: null, comentario: '', showComentario: false });
  };

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJustificacion, setSelectedJustificacion] = useState(null);

  function openDetailModal(justificacion) {
    setSelectedJustificacion((prev) => ({ ...(justificacion || {}), id: justificacion?.id || justificacion?.pk || prev?.id || null }));
    setIsModalOpen(true);
  }

  function closeDetailModal() {
    setSelectedJustificacion(null);
    setIsModalOpen(false);
  }

  function handleApprove(id) {
    if (!id) return;
    decideMutation.mutate({ id, estado: 'APROBADO', comentario: '' });
    closeDetailModal();
  }

  function handleReject(id, comentario = '') {
    if (!id) return;
    decideMutation.mutate({ id, estado: 'RECHAZADO', comentario });
    closeDetailModal();
  }

  // Dropdown menu state (open menu per-row)
  const [openMenuId, setOpenMenuId] = useState(null);
  const menusRef = useRef({}); // optional refs map, not strictly required but kept for clarity

  // close menu on outside click
  useEffect(() => {
    function onDocClick(e) {
      // If any menu is open, close it when clicking outside
      // We check if the clicked element is inside any menu button/menu; if not, close.
      const anyMenuContains = Object.values(menusRef.current).some((el) => el && el.contains(e.target));
      if (!anyMenuContains) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Helper to compute doc URL
  const getDocUrl = (j, item) =>
    (j?.archivo_principal_url || item?.archivo_principal_url) ||
    (j?.archivo_principal_path || item?.archivo_principal_path
      ? `http://127.0.0.1:8000/media/${encodeURI(j?.archivo_principal_path || item?.archivo_principal_path)}`
      : null);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Aprobaciones pendientes</h1>

        {isLoading && <div>Cargando…</div>}
        {isError && <div className="text-red-600">Error cargando aprobaciones.</div>}
        {!isLoading && items.length === 0 && <div>No hay aprobaciones para revisar.</div>}

        {!isLoading && items.length > 0 && (
          <div className="bg-white shadow rounded border">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-600">
              <div className="col-span-3">Estudiante</div>
              <div className="col-span-2">Asignatura</div>
              <div className="col-span-2">Rango</div>
              <div className="col-span-2">Solicitada</div>
              <div className="col-span-3 text-right">Acción</div>
            </div>

            <ul className="divide-y">
              {items.map((item) => {
                const j = item.justificacion || {};
                const estudianteNombre =
                  (j.estudiante_detail && j.estudiante_detail.nombre) ||
                  (j.estudiante && j.estudiante.primer_nombre
                    ? `${j.estudiante.primer_nombre} ${j.estudiante.primer_apellido || ''}`.trim()
                    : null) ||
                  (j.estudiante && typeof j.estudiante === 'string' ? j.estudiante : null) ||
                  '—';
                const estudianteCorreo = (j.estudiante_detail && j.estudiante_detail.correo) || '';
                const carreraNombre =
                  (j.estudiante_detail && j.estudiante_detail.carrera && j.estudiante_detail.carrera.nombre) ||
                  (j.estudiante && j.estudiante.carrera && j.estudiante.carrera.nombre) ||
                  '';

                const asignaturaNombre =
                  (j.asignatura_nombre && String(j.asignatura_nombre).trim()) ||
                  (j.asignatura_detail && (j.asignatura_detail.nombre || j.asignatura_detail.title)) ||
                  (j.asignatura && (j.asignatura.nombre || j.asignatura.title || j.asignatura)) ||
                  'General';

                const fechaInicio = j.fecha_ausencia_inicio || '-';
                const fechaFin = j.fecha_ausencia_fin || '-';
                const fechaSolicitud = j.fecha_solicitud || item.fecha_revision || '-';

                const docUrl = getDocUrl(j, item);

                return (
                  <li key={item.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3">
                      <div className="text-sm font-medium">{estudianteNombre || '—'}</div>
                      <div className="text-xs text-gray-500">{estudianteCorreo || ''}</div>
                      {carreraNombre ? <div className="text-xs text-gray-500">Carrera: {carreraNombre}</div> : null}
                    </div>

                    <div className="col-span-2 text-sm">
                      <div className="truncate max-w-[220px]" title={asignaturaNombre}>
                        {asignaturaNombre}
                      </div>
                    </div>

                    <div className="col-span-2 text-sm">
                      <div className="truncate max-w-[200px]" title={`${fechaInicio} — ${fechaFin}`}>
                        {fechaInicio} — {fechaFin}
                      </div>
                      {j.descripcion_detallada ? (
                        <div className="text-xs text-gray-500 truncate max-w-[240px]" title={j.descripcion_detallada}>
                          {j.descripcion_detallada}
                        </div>
                      ) : null}
                    </div>

                    <div className="col-span-2 text-sm">
                      <div className="text-sm">
                        {fechaSolicitud ? new Date(fechaSolicitud).toLocaleString() : '-'}
                      </div>
                    </div>

                    <div className="col-span-3 text-right relative">
                      {/* Botón único que abre dropdown */}
                      <div
                        // elemento contenedor del trigger y el menú; registramos ref para detectar clics fuera
                        ref={(el) => (menusRef.current[item.id] = el)}
                        className="inline-block text-left"
                        onClick={(e) => {
                          // evitar que el click burbujee a document listener y cierre inmediatamente
                          e.stopPropagation();
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenMenuId((prev) => (prev === item.id ? null : item.id))}
                          className="w-32 h-10 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                          aria-haspopup="true"
                          aria-expanded={openMenuId === item.id}
                        >
                          Acciones ▾
                        </button>

                        {/* Dropdown */}
                        {openMenuId === item.id && (
                          <div
                            className="origin-top-right absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20"
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby={`menu-button-${item.id}`}
                            onClick={(ev) => ev.stopPropagation()} /* prevenir cierre inmediato */
                          >
                            <div className="py-1">
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-600 hover:text-white transition-colors duration-150 ease-in-out"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  askApprove(item.id);
                                }}
                              >
                                Aprobar
                              </button>

                              <button
                                className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-600 hover:text-white transition-colors duration-150 ease-in-out"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  askReject(item.id);
                                }}
                              >
                                Rechazar
                              </button>

                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-700 hover:text-white transition-colors duration-150 ease-in-out"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  openDetailModal({ ...(j || {}), id: item.id });
                                }}
                              >
                                Ver detalle
                              </button>

                              {docUrl ? (
                                <a
                                  className="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-600 hover:text-white transition-colors duration-150 ease-in-out"
                                  role="menuitem"
                                  href={docUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  Ver documento
                                </a>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmInfo.open}
        title={confirmInfo.estado === 'RECHAZADO' ? 'Confirmar rechazo' : 'Confirmar aprobación'}
        message={confirmInfo.estado === 'RECHAZADO' ? '¿Confirmas que deseas rechazar esta justificación?' : '¿Confirmas que deseas aprobar esta justificación?'}
        onCancel={handleCancelConfirm}
        onConfirm={handleConfirm}
        confirmLabel={confirmInfo.estado === 'RECHAZADO' ? 'Rechazar' : 'Aprobar'}
        cancelLabel="Cancelar"
        showComentario={confirmInfo.showComentario}
        comentario={confirmInfo.comentario}
        setComentario={(v) => setConfirmInfo((p) => ({ ...p, comentario: v }))}
      />

      {isModalOpen && selectedJustificacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black opacity-50" onClick={closeDetailModal} />

          <div className="relative z-10 max-w-3xl w-full bg-white rounded shadow-lg overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h3 className="text-lg font-semibold">Detalle de la solicitud</h3>
              <button className="text-gray-600 hover:text-gray-800" onClick={closeDetailModal} aria-label="Cerrar">✕</button>
            </div>

            <div className="px-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="mb-3">
                <div className="text-sm text-gray-500">Estudiante</div>
                <div className="text-base font-medium">
                  {(selectedJustificacion.estudiante_detail && selectedJustificacion.estudiante_detail.nombre) ||
                    (selectedJustificacion.estudiante && selectedJustificacion.estudiante.primer_nombre
                      ? `${selectedJustificacion.estudiante.primer_nombre} ${selectedJustificacion.estudiante.primer_apellido || ''}`.trim()
                      : null) ||
                    selectedJustificacion.estudiante ||
                    '—'}
                </div>
                {selectedJustificacion.estudiante_detail && selectedJustificacion.estudiante_detail.correo && (
                  <div className="text-sm text-gray-500">{selectedJustificacion.estudiante_detail.correo}</div>
                )}
              </div>

              <div className="mb-3 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Asignatura</div>
                  <div className="text-base">
                    {selectedJustificacion.asignatura_nombre ||
                      (selectedJustificacion.asignatura && (selectedJustificacion.asignatura.nombre || selectedJustificacion.asignatura)) ||
                      'General'}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Fechas</div>
                  <div className="text-base">
                    {selectedJustificacion.fecha_ausencia_inicio || '-'} — {selectedJustificacion.fecha_ausencia_fin || '-'}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm text-gray-500">Solicitada</div>
                <div className="text-base">{selectedJustificacion.fecha_solicitud || '-'}</div>
              </div>

              <div className="mb-3">
                <div className="text-sm text-gray-500">Motivo</div>
                <div className="text-base">{selectedJustificacion.motivo || '-'}</div>
              </div>

              <div className="mb-3">
                <div className="text-sm text-gray-500">Descripción detallada</div>
                <div className="mt-2 border rounded p-3 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm">
                  {selectedJustificacion.descripcion_detallada || 'Sin descripción.'}
                </div>
              </div>

              {(selectedJustificacion.archivo_principal_url || selectedJustificacion.archivo_principal_path) && (
                <div className="mb-3">
                  <div className="text-sm text-gray-500">Documento adjunto</div>
                  <a
                    className="text-blue-600 underline block mt-1"
                    href={
                      selectedJustificacion.archivo_principal_url ||
                      `http://127.0.0.1:8000/media/${encodeURI(selectedJustificacion.archivo_principal_path)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver / Descargar documento
                  </a>
                </div>
              )}

              <div className="mt-4">
                <div className="text-sm text-gray-500">Estado</div>
                <div className="text-base">{selectedJustificacion.estado || 'Pendiente'}</div>
                {selectedJustificacion.observaciones && (
                  <>
                    <div className="text-sm text-gray-500 mt-2">Observaciones</div>
                    <div className="text-sm">{selectedJustificacion.observaciones}</div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={closeDetailModal}>Cerrar</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => { closeDetailModal(); if (selectedJustificacion?.id) askReject(selectedJustificacion.id); }} type="button">Rechazar</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={() => { closeDetailModal(); if (selectedJustificacion?.id) askApprove(selectedJustificacion.id); }} type="button">Aprobar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
