// ApprovalsList.jsx
import React, { useEffect, useState } from 'react';
import ApprovalRow from './ApprovalRow';
import axios from 'axios';

export default function ApprovalsList() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJustificacion, setSelectedJustificacion] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/tu-endpoint-de-justificaciones/'); // ajusta
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(id) {
    try {
      await axios.post(`/api/justificaciones/${id}/aprobar/`);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleReject(id) {
    try {
      await axios.post(`/api/justificaciones/${id}/rechazar/`);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  // Abre modal: recibe la justificación (j) desde ApprovalRow
  function openDetailModal(justificacion) {
    setSelectedJustificacion(justificacion);
    setIsModalOpen(true);
  }

  function closeDetailModal() {
    setSelectedJustificacion(null);
    setIsModalOpen(false);
  }

  return (
    <>
      {!isLoading && items.length > 0 && (
        <div className="bg-white shadow rounded border">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-600">
            <div className="col-span-3">Estudiante</div>
            <div className="col-span-2">Asignatura</div>
            <div className="col-span-3">Rango</div>
            <div className="col-span-2">Solicitada</div>
            <div className="col-span-2 text-right">Acción</div>
          </div>

          <ul className="divide-y">
            {items.map((item) => (
              <ApprovalRow
                key={item.id}
                item={item}
                onApprove={handleApprove}
                onReject={handleReject}
                onOpenDetail={openDetailModal} // <-- pasamos handler
              />
            ))}
          </ul>
        </div>
      )}

      {/** Modal: solo renderizar si isModalOpen */}
      {isModalOpen && selectedJustificacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={closeDetailModal}
          />

          {/* Modal box */}
          <div className="relative z-10 max-w-3xl w-full bg-white rounded shadow-lg overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h3 className="text-lg font-semibold">
                Detalle de la solicitud
              </h3>
              <button
                className="text-gray-600 hover:text-gray-800"
                onClick={closeDetailModal}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-4 max-h-[70vh] overflow-y-auto">
              {/* Datos principales */}
              <div className="mb-3">
                <div className="text-sm text-gray-500">Estudiante</div>
                <div className="text-base font-medium">{selectedJustificacion.estudiante_nombre || '—'}</div>
                {selectedJustificacion.estudiante && selectedJustificacion.estudiante.correo && (
                  <div className="text-sm text-gray-500">{selectedJustificacion.estudiante.correo}</div>
                )}
              </div>

              <div className="mb-3 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Asignatura</div>
                  <div className="text-base">{selectedJustificacion.asignatura_nombre || (selectedJustificacion.asignatura && selectedJustificacion.asignatura.nombre) || 'General'}</div>
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
                <div className="text-base">
                    {selectedJustificacion.motivo_nombre ||
                    (selectedJustificacion.motivo && (selectedJustificacion.motivo.nombre || selectedJustificacion.motivo.label)) ||
                    (typeof selectedJustificacion.motivo === 'string' ? selectedJustificacion.motivo : '-') }
                </div>
              </div>

              {/* Descripción larga en contenedor con scroll */}
              <div className="mb-3">
                <div className="text-sm text-gray-500">Descripción detallada</div>
                <div className="mt-2 border rounded p-3 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm">
                  {selectedJustificacion.descripcion_detallada || 'Sin descripción.'}
                </div>
              </div>

              {/* Documento adjunto */}
              {selectedJustificacion.archivo_principal_url && (
                <div className="mb-3">
                  <div className="text-sm text-gray-500">Documento adjunto</div>
                  <a
                    className="text-blue-600 underline block mt-1"
                    href={selectedJustificacion.archivo_principal_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver / Descargar documento
                  </a>
                </div>
              )}

              {/* Observaciones / Estado */}
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
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={closeDetailModal}
              >
                Cerrar
              </button>

              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={() => {
                  if (selectedJustificacion && selectedJustificacion.id) {
                    handleReject(selectedJustificacion.id);
                    closeDetailModal();
                  }
                }}
              >
                Rechazar
              </button>

              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={() => {
                  if (selectedJustificacion && selectedJustificacion.id) {
                    handleApprove(selectedJustificacion.id);
                    closeDetailModal();
                  }
                }}
              >
                Aprobar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
