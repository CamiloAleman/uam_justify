// frontend/src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem('access_token');
  const user = localStorage.getItem("user");

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }


  return children;
}
