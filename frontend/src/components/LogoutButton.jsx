import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutAndRevoke } from '../utils/auth';

export default function LogoutButton({ label = 'Cerrar sesión' }) {
  const nav = useNavigate();
  const handle = async () => {
    await logoutAndRevoke();          // revoca (si está activado) + limpia localStorage
    nav('/login', { replace: true }); // redirige al login
  };

  return (
    <button
      onClick={handle}
      className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
    >
      {label}
    </button>
  );
}
