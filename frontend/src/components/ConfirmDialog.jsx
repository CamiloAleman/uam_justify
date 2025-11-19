// frontend/src/components/ConfirmDialog.jsx
import React from "react";

export default function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  showComentario = false,
  comentario,
  setComentario,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-md shadow-lg w-full max-w-md p-4 z-60">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <p className="text-sm text-gray-700 mb-3">{message}</p>

        {showComentario && (
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Comentario (opcional)</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario && setComentario(e.target.value)}
              className="w-full border rounded p-2 text-sm"
              rows={3}
              placeholder="Agrega un comentario que acompañe la decisión..."
            />
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded border text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1 rounded bg-red-600 text-white text-sm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
