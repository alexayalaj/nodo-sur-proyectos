import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function SinPermiso() {
  useEffect(() => { document.title = 'Sin permiso · Proyectos Nodo Sur'; }, []);
  return (
    <section className="tarjeta centrado" aria-labelledby="titulo">
      <h1 id="titulo">Sin permiso</h1>
      <p>Tu rol no permite abrir esta sección. Si crees que es un error, contacta a un administrador.</p>
      <Link className="btn" to="/">Volver al tablero</Link>
    </section>
  );
}
