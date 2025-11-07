export default function Header() {
  return (
    <header className="bg-[#0099a8] text-white py-4 shadow-md">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">UAM Justify</h1>
        <nav className="space-x-4">
          <a href="/dashboard" className="hover:underline">Inicio</a>
          <a href="/justificaciones" className="hover:underline">Justificaciones</a>
          <a href="/perfil" className="hover:underline">Perfil</a>
        </nav>
      </div>
    </header>
  );
}