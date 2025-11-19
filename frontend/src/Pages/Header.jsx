// frontend/src/components/Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutAndRevoke, clearAuth } from "../utils/auth";

export default function Header() {
  const navigate = useNavigate();

  // Leer usuario actual desde localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const nombreUsuario = user
    ? `${user.primer_nombre || ""} ${user.primer_apellido || ""}`.trim()
    : null;

  const handleLogout = async () => {
    try {
      await logoutAndRevoke();
    } catch {
      clearAuth();
    }
    navigate("/", { replace: true });
  };

  function goHomeByRole() {
    const role = (user.role || "").toUpperCase();

    if (role === "ADMIN") {
      navigate("/admin");
    } else if (role === "DOCENTE" || role === "COORDINADOR") {
      navigate("/aprobaciones");
    } else {
      navigate("/justificaciones");
    }
  }

  return (
    <header className="bg-[#0099a8] text-white py-4 shadow-md">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          <button onClick={goHomeByRole} className="hover:underline font-bold">
            UAM Justify
          </button>
        </h1>

        <nav className="flex items-center space-x-4">
          
          {/*<Link to="/justificaciones" className="hover:underline">
            Justificaciones
          </Link>*/}

          {/* Mostrar saludo y logout solo si hay usuario logueado */}
          {user && (
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">
                Hola, {nombreUsuario || "Usuario"}
              </span>

              <button
                onClick={goHomeByRole}
                className="bg-white text-[#0099a8] px-3 py-1 rounded-md hover:bg-gray-100 text-sm font-medium transition"
              >
                Inicio
              </button>

              <button
                onClick={handleLogout}
                className="bg-white text-[#0099a8] px-3 py-1 rounded-md hover:bg-gray-100 text-sm font-medium transition"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
