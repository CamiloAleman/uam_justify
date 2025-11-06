import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import JustificationForm from './components/JustificationForm';
import MyRequests from './components/MyRequests';
import PrivateRoute from './components/PrivateRoute';

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><MyRequests/></PrivateRoute>} />
        <Route path="/new" element={<PrivateRoute><JustificationForm/></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;