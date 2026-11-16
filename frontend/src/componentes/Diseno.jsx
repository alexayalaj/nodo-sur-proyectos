import { Outlet } from 'react-router-dom';
import Encabezado from './Encabezado.jsx';

// Estructura común: enlace para saltar al contenido, encabezado, contenido y pie
export default function Diseno() {
  return (
    <>
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <Encabezado />
      <main id="contenido" className="contenedor" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="pie">
        <p>Nodo Sur Soluciones Digitales S.A. de C.V. · Proyectos Nodo Sur</p>
      </footer>
    </>
  );
}
