// src/pages/AdminDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Pages/Layout';

export default function AdminDashboard() {
  const nav = useNavigate();
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-10">
        <h1 className="text-2xl font-semibold mb-6">Panel de Administración</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border rounded shadow-sm">
            <h3 className="font-medium mb-2">Facultades</h3>
            <p className="text-sm text-gray-600 mb-3">Gestiona facultades.</p>
            <button onClick={()=>nav('/admin/facultades/nueva')} className="bg-[#0099a8] text-white px-3 py-2 rounded">Nueva Facultad</button>
          </div>

          <div className="p-4 border rounded shadow-sm">
            <h3 className="font-medium mb-2">Asignaturas</h3>
            <p className="text-sm text-gray-600 mb-3">Crear y vincular a docente y facultad.</p>
            <button onClick={()=>nav('/admin/asignaturas/nueva')} className="bg-[#0099a8] text-white px-3 py-2 rounded">Nueva Asignatura</button>
          </div>

          <div className="p-4 border rounded shadow-sm">
            <h3 className="font-medium mb-2">Motivos</h3>
            <p className="text-sm text-gray-600 mb-3">Motivos de ausencia (MED/DEP/OTR).</p>
            <button onClick={()=>nav('/admin/motivos/nuevo')} className="bg-[#0099a8] text-white px-3 py-2 rounded">Nuevo Motivo</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
