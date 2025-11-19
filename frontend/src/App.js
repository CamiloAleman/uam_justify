import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import JustificationForm from './components/JustificationForm';
import MyRequests from './components/MyRequests';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './Pages/AdminDashboard';
import CreateFaculty from './Pages/admin/CreateFaculty';
import CreateAsignatura from './Pages/admin/CreateAsignatura';
import CreateMotivo from './Pages/admin/CreateMotivo';
import CreateUsuario from './Pages/admin/CreateUsuario';
import AdminUsers from './Pages/admin/AdminUsers';
import AdminFacultades from './Pages/admin/AdminFacultades';
import AdminAsignaturas from './Pages/admin/AdminAsignaturas';
import AdminCarreras from './Pages/admin/AdminCarreras';
import CreateCarrera from './Pages/admin/CreateCarrera';
import AdminMotivos from './Pages/admin/AdminMotivos';
import ApprovalsMine from './Pages/ApprovalsMine';


function App(){
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={<Login/>} />
        <Route path="/" element={<Login/>} />

        {/* ESTUDIANTES */}

        <Route path="/justificaciones/" element={<PrivateRoute><MyRequests/></PrivateRoute>} />
        <Route path="/justificaciones/crear" element={<PrivateRoute><JustificationForm/></PrivateRoute>} />

        {/* DOCENTES/COORDINADORES */}

        <Route path="/aprobaciones" element={<PrivateRoute><ApprovalsMine/></PrivateRoute>} />

        {/* ADMIN PANEL */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard/></AdminRoute>} />
        <Route path="/admin/facultades/nueva" element={<AdminRoute><CreateFaculty/></AdminRoute>} />
        <Route path="/admin/asignaturas/nueva" element={<AdminRoute><CreateAsignatura/></AdminRoute>} />
        <Route path="/admin/motivos/nuevo" element={<AdminRoute><CreateMotivo/></AdminRoute>} />

        <Route path="/admin/usuarios" element={<AdminRoute><AdminUsers/></AdminRoute>} />
        <Route path="/admin/usuarios/nuevo" element={<AdminRoute><CreateUsuario/></AdminRoute>} />

        <Route path="/admin/facultades" element={<AdminRoute><AdminFacultades/></AdminRoute>} />
        <Route path="/admin/asignaturas" element={<AdminRoute><AdminAsignaturas/></AdminRoute>} />
        <Route path="/admin/motivos" element={<AdminRoute><AdminMotivos/></AdminRoute>} />

        <Route path="/admin/carreras" element={<AdminRoute><AdminCarreras/></AdminRoute>} />
  |     <Route path="/admin/carreras/nueva" element={<AdminRoute><CreateCarrera/></AdminRoute>} />


      </Routes>
    </BrowserRouter>
  );
}
export default App;