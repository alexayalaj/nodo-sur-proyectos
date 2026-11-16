import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSesion } from '../context/SesionContext.jsx';

export default function Encabezado() {
  const { usuario, esAdmin, cerrarSesion } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const ubicacion = useLocation();
  const navegar = useNavigate();

  // El menú móvil se cierra al cambiar de ruta
  useEffect(() => setAbierto(false), [ubicacion.pathname]);

  const salir = () => {
    cerrarSesion();
    navegar('/login');
  };
  const clase = ({ isActive }) => (isActive ? 'enlace activo' : 'enlace');

  return (
    <header className="encabezado">
      <div className="barra">
        <Link to="/" className="marca" aria-label="Nodo Sur, ir al tablero">
          <img src="/logo.svg" alt="Nodo Sur Soluciones Digitales" className="logo" />
        </Link>
        {usuario && (
          <button type="button" className="btn-menu" aria-expanded={abierto} aria-controls="menu-principal" onClick={() => setAbierto(!abierto)}>
            <span aria-hidden="true">{abierto ? '✕' : '☰'}</span> Menú
          </button>
        )}
        <nav id="menu-principal" className={`menu ${abierto ? 'abierto' : ''}`} aria-label="Principal">
          {usuario ? (
            <>
              <NavLink to="/" end className={clase}>Tablero</NavLink>
              <NavLink to="/proyectos" end className={clase}>Proyectos</NavLink>
              <NavLink to="/proyectos/nuevo" className={clase}>Nuevo proyecto</NavLink>
              {esAdmin && <NavLink to="/admin/usuarios" className={clase}>Administración</NavLink>}
              <span className="usuario-sesion">
                {usuario.nombre} <span className="etiqueta-rol">{usuario.rol}</span>
              </span>
              <button type="button" className="btn btn-claro" onClick={salir}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={clase}>Iniciar sesión</NavLink>
              <NavLink to="/registro" className={clase}>Registrarse</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
