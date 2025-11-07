export default function Footer() {
  return (
    <footer className="bg-[#0099a8] text-center py-4 mt-10 border-t">
      <p className="text-sm text-white">
        © {new Date().getFullYear()} Universidad Americana (UAM). Todos los derechos reservados.
      </p>
    </footer>
  );
}