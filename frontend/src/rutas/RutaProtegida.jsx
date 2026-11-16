import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSesion } from '../context/SesionContext.jsx';

// Sin sesión lleva a /login y recuerda a dónde iba; con rol insuficiente lleva a /sin-permiso.
export default function RutaProtegida({ roles }) {
  const { token, rol } = useSesion();
  const ubicacion = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname + ubicacion.search }} />;
  if (roles && !roles.includes(rol)) return <Navigate to="/sin-permiso" replace />;
  return <Outlet />;
}
