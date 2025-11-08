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

function App(){
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/login" element={<Login/>} /> */}
        {/* <Route path="/" element={<PrivateRoute><MyRequests/></PrivateRoute>} /> */}
        <Route path="/" element={<Login/>} />
        <Route path="/justificaciones/" element={<PrivateRoute><MyRequests/></PrivateRoute>} />
        <Route path="/justificaciones/crear" element={<PrivateRoute><JustificationForm/></PrivateRoute>} />

        <Route path="/admin" element={<AdminRoute><AdminDashboard/></AdminRoute>} />
        <Route path="/admin/facultades/nueva" element={<AdminRoute><CreateFaculty/></AdminRoute>} />
        <Route path="/admin/asignaturas/nueva" element={<AdminRoute><CreateAsignatura/></AdminRoute>} />
        <Route path="/admin/motivos/nuevo" element={<AdminRoute><CreateMotivo/></AdminRoute>} />


      </Routes>
    </BrowserRouter>
  );
}
export default App;