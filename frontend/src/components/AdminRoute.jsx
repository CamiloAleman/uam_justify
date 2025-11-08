// src/components/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }) {
  const raw = localStorage.getItem('user');
  if (!raw) return <Navigate to="/login" replace />;
  const user = JSON.parse(raw);
  const isAdmin = (user.role === 'ADMIN') || user.is_staff || user.is_superuser;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
